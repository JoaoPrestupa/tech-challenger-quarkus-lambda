package lambda.fase4.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.ScheduledEvent;
import com.google.gson.Gson;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import lambda.fase4.dto.RelatorioSemanalDTO;
import lambda.fase4.service.EmailService;
import lambda.fase4.service.NotificacaoService;
import lambda.fase4.service.RelatorioService;
import org.jboss.logging.Logger;

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
    EmailService emailService;

    @Inject
    Gson gson;

    @Override
    public Map<String, Object> handleRequest(ScheduledEvent event, Context context) {
        Map<String, Object> response = new HashMap<>();

        try {
            LOG.info("=== Iniciando geração de relatório semanal ===");

            // Gerar relatório do banco de dados
            RelatorioSemanalDTO relatorio = relatorioService.gerarRelatorioSemanal();

            LOG.infof("Relatório gerado: %d avaliações, média %.2f",
                relatorio.getTotalAvaliacoes(), relatorio.getMediaNotas());

            // Formatar email
            String assunto = "📊 Relatório Semanal de Feedbacks - " + relatorio.getPeriodo();
            String corpoEmail = formatarRelatorio(relatorio);

            // Enviar email via SES
            emailService.enviarRelatorioSemanal(assunto, corpoEmail);

            LOG.info("Relatório enviado por email com sucesso");

            response.put("statusCode", 200);
            response.put("body", gson.toJson(relatorio));
            response.put("message", "Relatório gerado e enviado com sucesso");

        } catch (Exception e) {
            LOG.error("Erro ao gerar/enviar relatório", e);
            response.put("statusCode", 500);
            response.put("error", e.getMessage());
        }

        return response;
    }

    private String formatarRelatorio(RelatorioSemanalDTO relatorio) {
        StringBuilder sb = new StringBuilder();

        sb.append("═══════════════════════════════════════════════\n");
        sb.append("     RELATÓRIO SEMANAL DE FEEDBACKS\n");
        sb.append("═══════════════════════════════════════════════\n\n");
        sb.append("📅 Período: ").append(relatorio.getPeriodo()).append("\n\n");

        sb.append("📊 RESUMO GERAL\n");
        sb.append("─────────────────────────────────────────────\n");
        sb.append("Total de Avaliações: ").append(relatorio.getTotalAvaliacoes()).append("\n");
        sb.append("Média de Notas: ").append(String.format("%.2f", relatorio.getMediaNotas())).append(" ⭐\n\n");

        if (!relatorio.getAvaliacoesPorRestaurante().isEmpty()) {
            sb.append("🏪 AVALIAÇÕES POR RESTAURANTE\n");
            sb.append("─────────────────────────────────────────────\n");
            relatorio.getAvaliacoesPorRestaurante().forEach((restaurante, quantidade) -> {
                sb.append("  • ").append(restaurante).append(": ").append(quantidade);
                sb.append(" avaliação").append(quantidade > 1 ? "ões" : "").append("\n");
            });
            sb.append("\n");
        }

        if (!relatorio.getComentariosNegativos().isEmpty()) {
            sb.append("⚠️ COMENTÁRIOS NEGATIVOS (").append(relatorio.getComentariosNegativos().size()).append(")\n");
            sb.append("─────────────────────────────────────────────\n");
            relatorio.getComentariosNegativos().forEach(comentario -> {
                sb.append("  • ").append(comentario).append("\n");
            });
            sb.append("\n");
        }

        sb.append("═══════════════════════════════════════════════\n");
        sb.append("Sistema de Feedback - Fase 4\n");
        sb.append("Gerado automaticamente\n");

        return sb.toString();
    }
}


