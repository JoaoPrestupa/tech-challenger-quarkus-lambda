package lambda.fase4.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.ScheduledEvent;
import com.google.gson.Gson;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import lambda.fase4.dto.RelatorioSemanalDTO;
import lambda.fase4.service.NotificacaoService;
import lambda.fase4.service.RelatorioService;
import org.jboss.logging.Logger;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;


@Named("gerarRelatorio")
public class GerarRelatorioHandler implements RequestHandler<ScheduledEvent, Map<String, Object>> {

    private static final Logger LOG = Logger.getLogger(GerarRelatorioHandler.class);

    @Inject
    RelatorioService relatorioService;

    @Inject
    NotificacaoService notificacaoService;

    @Inject
    Gson gson;

    @Override
    public Map<String, Object> handleRequest(ScheduledEvent event, Context context) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Gerar relatório simulado (em produção conectaria ao banco)
            LocalDateTime fim = LocalDateTime.now();
            LocalDateTime inicio = fim.minusDays(7);

            RelatorioSemanalDTO relatorio = new RelatorioSemanalDTO(
                formatarPeriodo(inicio, fim),
                0,  // Total de avaliações (seria consultado do banco)
                0.0, // Média (seria calculada do banco)
                new HashMap<>(), // Avaliações por restaurante
                Collections.emptyList() // Comentários negativos
            );

            // Formatar relatório
            String mensagemRelatorio = formatarRelatorio(relatorio);

            // TODO: Publicar no SNS quando configurado
            context.getLogger().log("Relatório gerado para período: " + relatorio.getPeriodo());

            response.put("statusCode", 200);
            response.put("body", gson.toJson(relatorio));
            response.put("message", "Relatório gerado com sucesso");

        } catch (Exception e) {
            response.put("statusCode", 500);
            response.put("error", e.getMessage());
        }

        return response;
    }

    private String formatarPeriodo(LocalDateTime inicio, LocalDateTime fim) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        return String.format("%s a %s",
            inicio.format(formatter),
            fim.format(formatter));
    }

    private String formatarRelatorio(RelatorioSemanalDTO relatorio) {
        StringBuilder sb = new StringBuilder();

        sb.append("Período: ").append(relatorio.getPeriodo()).append("\n\n");
        sb.append("📊 RESUMO GERAL\n");
        sb.append("Total de Avaliações: ").append(relatorio.getTotalAvaliacoes()).append("\n");
        sb.append("Média de Notas: ").append(String.format("%.2f", relatorio.getMediaNotas())).append("\n\n");

        if (!relatorio.getAvaliacoesPorRestaurante().isEmpty()) {
            sb.append("🏪 AVALIAÇÕES POR RESTAURANTE\n");
            relatorio.getAvaliacoesPorRestaurante().forEach((restaurante, quantidade) -> {
                sb.append("  • ").append(restaurante).append(": ").append(quantidade).append("\n");
            });
            sb.append("\n");
        }

        if (!relatorio.getComentariosNegativos().isEmpty()) {
            sb.append("⚠️ COMENTÁRIOS NEGATIVOS (").append(relatorio.getComentariosNegativos().size()).append(")\n");
            relatorio.getComentariosNegativos().forEach(comentario -> {
                sb.append("  • ").append(comentario).append("\n");
            });
        }

        return sb.toString();
    }
}

