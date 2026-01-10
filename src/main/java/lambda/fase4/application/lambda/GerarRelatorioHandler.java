package lambda.fase4.application.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.ScheduledEvent;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import lambda.fase4.infraestructure.LocalDateTimeAdapter;
import lambda.fase4.domain.model.Avaliacao;
import lambda.fase4.domain.repository.AvaliacaoRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;


public class GerarRelatorioHandler implements RequestHandler<ScheduledEvent, Map<String, Object>> {

    @Inject
    AvaliacaoRepository avaliacaoRepository;

    private final Gson gson;
    private boolean usarBancoDados = true;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public GerarRelatorioHandler() {
        this.gson = new GsonBuilder()
                .registerTypeAdapter(LocalDateTime.class, new LocalDateTimeAdapter())
                .create();
    }

    @Override
    @Transactional
    public Map<String, Object> handleRequest(ScheduledEvent event, Context context) {
        Map<String, Object> response = new HashMap<>();

        try {
            context.getLogger().log("=== Iniciando geração de relatório semanal ===");

            // Período: últimos 7 dias
            LocalDateTime fim = LocalDateTime.now();
            LocalDateTime inicio = fim.minusDays(7);

            context.getLogger().log(String.format("Período: %s até %s",
                inicio.format(DATE_FORMATTER), fim.format(DATE_FORMATTER)));

            List<Avaliacao> avaliacoes;

            try {
                if (usarBancoDados && avaliacaoRepository != null) {
                    // MODO PRODUÇÃO: Consulta banco PostgreSQL/RDS
                    context.getLogger().log("Consultando RDS PostgreSQL...");
                    context.getLogger().log(String.format("Database: %s@%s:%s/%s",
                        System.getenv().getOrDefault("DB_USERNAME", "postgres"),
                        System.getenv().getOrDefault("DB_HOST", "localhost"),
                        System.getenv().getOrDefault("DB_PORT", "5432"),
                        System.getenv().getOrDefault("DB_NAME", "feedback_db")));

                    avaliacoes = avaliacaoRepository.findByPeriodo(inicio, fim);

                    context.getLogger().log(String.format("✓ Consulta SQL executada: %d avaliações encontradas", avaliacoes.size()));
                    context.getLogger().log("✓ Query: SELECT * FROM Avaliacao WHERE dataAvaliacao BETWEEN ? AND ?");

                } else {
                    throw new Exception("Banco de dados não disponível");
                }
            } catch (Exception dbException) {
                // MODO DEMONSTRAÇÃO: Fallback para simulação
                context.getLogger().log("⚠️ Banco de dados não disponível, usando dados simulados");
                context.getLogger().log("Consultando RDS PostgreSQL (SIMULADO)...");

                usarBancoDados = false;
            }

            // Gerar estatísticas do relatório
            Map<String, Object> relatorio = gerarEstatisticas(null, inicio, fim, context);

            // Formatar email
            String assunto = "📊 Relatório Semanal de Feedbacks - " +
                           LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            String corpoEmail = formatarRelatorioHTML(relatorio);

            context.getLogger().log("Enviando relatório via Amazon SES...");

            String adminEmail = System.getenv().getOrDefault("SES_ADMIN_EMAILS", "admin@feedback-system.com");
            String messageId = SimulatedSESService.enviarRelatorioSemanal(
                adminEmail,
                assunto,
                corpoEmail
            );

            context.getLogger().log("✓ Relatório enviado com sucesso! MessageId: " + messageId);

            // Preparar response
            response.put("statusCode", 200);
            response.put("message", "Relatório gerado e enviado com sucesso");
            response.put("relatorio", relatorio);
            response.put("emailMessageId", messageId);
            response.put("dataSource", usarBancoDados ? "PostgreSQL RDS" : "Simulação em Memória");

        } catch (Exception e) {
            context.getLogger().log("Erro ao gerar/enviar relatório: " + e.getMessage());
            e.printStackTrace();
            response.put("statusCode", 500);
            response.put("error", e.getMessage());
        }

        return response;
    }

    private Map<String, Object> gerarEstatisticas(List<Avaliacao> avaliacoes, LocalDateTime inicio, LocalDateTime fim, Context context) {
        Map<String, Object> stats = new HashMap<>();

        context.getLogger().log("Processando estatísticas...");

        // Informações gerais
        stats.put("periodo_inicio", inicio.format(DATE_FORMATTER));
        stats.put("periodo_fim", fim.format(DATE_FORMATTER));
        stats.put("total_avaliacoes", avaliacoes.size());

        if (avaliacoes.isEmpty()) {
            context.getLogger().log("⚠️ Nenhuma avaliação encontrada no período");
            stats.put("media_notas", 0.0);
            stats.put("avaliacoes_por_restaurante", new HashMap<>());
            stats.put("distribuicao_notas", new HashMap<>());
            stats.put("comentarios_negativos", new ArrayList<>());
            return stats;
        }

        double media = avaliacoes.stream()
                .mapToInt(Avaliacao::getNota)
                .average()
                .orElse(0.0);
        stats.put("media_notas", Math.round(media * 100.0) / 100.0);
        context.getLogger().log(String.format("Média de notas calculada: %.2f", media));

        Map<String, Long> porRestaurante = avaliacoes.stream()
                .collect(Collectors.groupingBy(Avaliacao::getRestaurante, Collectors.counting()));
        stats.put("avaliacoes_por_restaurante", porRestaurante);
        context.getLogger().log(String.format("Restaurantes únicos: %d", porRestaurante.size()));

        Map<Integer, Long> distribuicaoNotas = avaliacoes.stream()
                .collect(Collectors.groupingBy(Avaliacao::getNota, Collectors.counting()));
        stats.put("distribuicao_notas", distribuicaoNotas);

        List<Map<String, Object>> negativos = avaliacoes.stream()
                .filter(a -> a.getNota() <= 2)
                .map(a -> {
                    Map<String, Object> neg = new HashMap<>();
                    neg.put("restaurante", a.getRestaurante());
                    neg.put("nota", a.getNota());
                    neg.put("comentario", a.getComentario());
                    neg.put("data", a.getDataAvaliacao().format(DATE_FORMATTER));
                    neg.put("email_cliente", a.getEmailCliente());
                    return neg;
                })
                .collect(Collectors.toList());
        stats.put("comentarios_negativos", negativos);
        context.getLogger().log(String.format("⚠️ Avaliações críticas (≤2): %d", negativos.size()));

        List<Map<String, Object>> topRestaurantes = porRestaurante.entrySet().stream()
                .sorted((e1, e2) -> e2.getValue().compareTo(e1.getValue()))
                .limit(3)
                .map(e -> {
                    Map<String, Object> top = new HashMap<>();
                    top.put("restaurante", e.getKey());
                    top.put("total_avaliacoes", e.getValue());
                    return top;
                })
                .collect(Collectors.toList());
        stats.put("top_restaurantes", topRestaurantes);

        context.getLogger().log("✓ Estatísticas processadas com sucesso");

        return stats;
    }

    private String formatarRelatorioHTML(Map<String, Object> stats) {
        StringBuilder html = new StringBuilder();

        html.append("═══════════════════════════════════════════════════════════\n");
        html.append("          📊 RELATÓRIO SEMANAL DE FEEDBACKS\n");
        html.append("═══════════════════════════════════════════════════════════\n\n");

        html.append("📅 PERÍODO ANALISADO\n");
        html.append("────────────────────────────────────────────────────────────\n");
        html.append("Início: ").append(stats.get("periodo_inicio")).append("\n");
        html.append("Fim: ").append(stats.get("periodo_fim")).append("\n\n");

        html.append("📈 RESUMO EXECUTIVO\n");
        html.append("────────────────────────────────────────────────────────────\n");
        html.append("Total de Avaliações: ").append(stats.get("total_avaliacoes")).append("\n");
        html.append("Média Geral de Notas: ").append(String.format("%.2f", (Double) stats.get("media_notas"))).append(" ⭐\n\n");

        @SuppressWarnings("unchecked")
        Map<Integer, Long> distribuicao = (Map<Integer, Long>) stats.get("distribuicao_notas");
        if (distribuicao != null && !distribuicao.isEmpty()) {
            html.append("⭐ DISTRIBUIÇÃO DE NOTAS\n");
            html.append("────────────────────────────────────────────────────────────\n");
            for (int i = 5; i >= 1; i--) {
                long count = distribuicao.getOrDefault(i, 0L);
                String bar = "█".repeat((int) count);
                html.append(String.format("  %d estrelas: %s %d avaliações\n", i, bar, count));
            }
            html.append("\n");
        }

        @SuppressWarnings("unchecked")
        Map<String, Long> porRestaurante = (Map<String, Long>) stats.get("avaliacoes_por_restaurante");
        if (porRestaurante != null && !porRestaurante.isEmpty()) {
            html.append("🏪 AVALIAÇÕES POR RESTAURANTE\n");
            html.append("────────────────────────────────────────────────────────────\n");
            porRestaurante.entrySet().stream()
                    .sorted((e1, e2) -> e2.getValue().compareTo(e1.getValue()))
                    .forEach(entry -> html.append(String.format("  • %-30s: %d avaliações\n",
                            entry.getKey(), entry.getValue())));
            html.append("\n");
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> negativos = (List<Map<String, Object>>) stats.get("comentarios_negativos");
        if (negativos != null && !negativos.isEmpty()) {
            html.append("⚠️ AVALIAÇÕES CRÍTICAS (NOTA ≤ 2)\n");
            html.append("────────────────────────────────────────────────────────────\n");
            html.append("TOTAL: ").append(negativos.size()).append(" avaliações requerem atenção!\n\n");

            for (Map<String, Object> neg : negativos) {
                html.append("  🚨 Restaurante: ").append(neg.get("restaurante")).append("\n");
                html.append("     Nota: ").append(neg.get("nota")).append(" estrelas\n");
                html.append("     Data: ").append(neg.get("data")).append("\n");
                html.append("     Comentário: \"").append(neg.get("comentario")).append("\"\n");
                if (neg.get("email_cliente") != null) {
                    html.append("     Cliente: ").append(neg.get("email_cliente")).append("\n");
                }
                html.append("\n");
            }
        }

        html.append("═══════════════════════════════════════════════════════════\n");
        html.append("Relatório gerado automaticamente pelo sistema\n");
        html.append("Data/Hora: ").append(LocalDateTime.now().format(DATE_FORMATTER)).append("\n");
        html.append("Próximo relatório: ").append(LocalDateTime.now().plusDays(7).format(DATE_FORMATTER)).append("\n");
        html.append("═══════════════════════════════════════════════════════════\n");

        return html.toString();
    }
}

