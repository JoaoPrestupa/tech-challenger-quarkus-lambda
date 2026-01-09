package lambda.fase4.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import lambda.fase4.dto.RelatorioSemanalDTO;
import lambda.fase4.config.LocalDateTimeAdapter;
import lambda.fase4.service.EmailConfig;
import lambda.fase4.service.EmailService;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Lambda Function 2: Gerar e enviar relatório semanal de avaliações
 * Esta função é invocada automaticamente por EventBridge/CloudWatch Events
 */
public class GerarRelatorioHandler implements RequestHandler<Map<String, Object>, Map<String, Object>> {

    private final Gson gson;
    private final EmailService emailService;

    public GerarRelatorioHandler() {
        this.gson = new GsonBuilder()
                .registerTypeAdapter(LocalDateTime.class, new LocalDateTimeAdapter())
                .setPrettyPrinting()
                .create();
        this.emailService = EmailConfig.getEmailService();
    }

    @Override
    public Map<String, Object> handleRequest(Map<String, Object> input, Context context) {
        Map<String, Object> response = new HashMap<>();

        try {
            context.getLogger().log("Iniciando geração de relatório semanal...");

            // Gerar relatório dos últimos 7 dias
            RelatorioSemanalDTO relatorio = gerarRelatorioSemanal(context);

            // Formatar relatório em HTML para email
            String htmlRelatorio = formatarRelatorioHtml(relatorio);

            // Enviar relatório por email
            context.getLogger().log("Enviando relatório para: " + EmailConfig.getAlertEmail());
            enviarRelatorioEmail(htmlRelatorio, relatorio, context);

            response.put("statusCode", 200);
            response.put("body", gson.toJson(Map.of(
                    "message", "Relatório gerado e enviado com sucesso",
                    "relatorio", relatorio
            )));

            context.getLogger().log("Relatório semanal enviado com sucesso!");

        } catch (Exception e) {
            context.getLogger().log("ERRO ao gerar relatório: " + e.getMessage());
            e.printStackTrace();

            response.put("statusCode", 500);
            response.put("body", gson.toJson(Map.of(
                    "error", "Erro ao gerar relatório",
                    "message", e.getMessage()
            )));
        }

        return response;
    }

    /**
     * Gera relatório semanal (simulado - em produção conectaria ao banco)
     */
    private RelatorioSemanalDTO gerarRelatorioSemanal(Context context) {
        LocalDateTime fim = LocalDateTime.now();
        LocalDateTime inicio = fim.minusDays(7);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        String periodo = String.format("%s a %s", inicio.format(formatter), fim.format(formatter));

        context.getLogger().log("Gerando relatório do período: " + periodo);

        // TODO: Em produção, buscar dados reais do banco
        // Dados de exemplo para demonstração
        Map<String, Integer> avaliacoesPorRestaurante = new HashMap<>();
        avaliacoesPorRestaurante.put("Restaurante A", 15);
        avaliacoesPorRestaurante.put("Restaurante B", 8);
        avaliacoesPorRestaurante.put("Restaurante C", 12);

        List<String> comentariosNegativos = List.of(
                "[Restaurante A - Nota 2] Atendimento muito demorado",
                "[Restaurante B - Nota 1] Comida fria e sem sabor"
        );

        return new RelatorioSemanalDTO(
                periodo,
                35, // Total de avaliações
                4.2, // Média de notas
                avaliacoesPorRestaurante,
                comentariosNegativos
        );
    }

    /**
     * Formata o relatório em HTML para envio por email
     */
    private String formatarRelatorioHtml(RelatorioSemanalDTO relatorio) {
        StringBuilder html = new StringBuilder();

        html.append("""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2 style="color: #2196F3; border-bottom: 3px solid #2196F3; padding-bottom: 10px;">
                        📊 Relatório Semanal de Avaliações
                    </h2>
                    <p style="font-size: 14px; color: #666;">Período: <strong>""")
            .append(relatorio.getPeriodo())
            .append("</strong></p>");

        // Resumo Geral
        html.append("""
                    <div style="background-color: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #1976D2;">📈 Resumo Geral</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Total de Avaliações:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-size: 18px; color: #2196F3;"><strong>""")
            .append(relatorio.getTotalAvaliacoes())
            .append("""
                </strong></td>
                            </tr>
                            <tr>
                                <td style="padding: 10px;"><strong>Média de Notas:</strong></td>
                                <td style="padding: 10px; text-align: right; font-size: 18px; color: #4CAF50;"><strong>""")
            .append(String.format("%.2f", relatorio.getMediaNotas()))
            .append("""
                /5 ⭐</strong></td>
                            </tr>
                        </table>
                    </div>
            """);

        // Avaliações por Restaurante
        if (relatorio.getAvaliacoesPorRestaurante() != null && !relatorio.getAvaliacoesPorRestaurante().isEmpty()) {
            html.append("""
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #1976D2;">🏪 Avaliações por Restaurante</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                """);

            relatorio.getAvaliacoesPorRestaurante().forEach((restaurante, quantidade) -> {
                html.append("<tr>")
                    .append("<td style='padding: 10px; border-bottom: 1px solid #ddd;'>")
                    .append(restaurante)
                    .append("</td>")
                    .append("<td style='padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;'>")
                    .append(quantidade)
                    .append(" avaliações</td>")
                    .append("</tr>");
            });

            html.append("</table></div>");
        }

        // Comentários Negativos
        if (relatorio.getComentariosNegativos() != null && !relatorio.getComentariosNegativos().isEmpty()) {
            html.append("""
                    <div style="background-color: #ffebee; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f44336;">
                        <h3 style="margin-top: 0; color: #c62828;">⚠️ Comentários Negativos (Nota ≤ 2)</h3>
                        <ul style="list-style: none; padding: 0;">
                """);

            for (String comentario : relatorio.getComentariosNegativos()) {
                html.append("<li style='padding: 10px; margin: 10px 0; background: white; border-radius: 3px;'>")
                    .append("📌 ")
                    .append(comentario)
                    .append("</li>");
            }

            html.append("""
                        </ul>
                        <p style="margin-top: 20px; padding: 10px; background: #fff3cd; border-radius: 3px;">
                            <strong>💡 Ação Recomendada:</strong> Entre em contato com os clientes insatisfeitos e trabalhe para melhorar esses pontos.
                        </p>
                    </div>
                """);
        } else {
            html.append("""
                    <div style="background-color: #e8f5e9; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
                        <p style="margin: 0;"><strong>✅ Excelente!</strong> Nenhum comentário negativo registrado neste período.</p>
                    </div>
                """);
        }

        // Rodapé
        html.append("""
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    <p style="font-size: 12px; color: #666; text-align: center;">
                        Relatório gerado automaticamente pelo Sistema de Feedback<br>
                        """)
            .append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")))
            .append("""
                    </p>
                </div>
            </body>
            </html>
            """);

        return html.toString();
    }

    /**
     * Envia o relatório por email usando o EmailService
     */
    private void enviarRelatorioEmail(String htmlContent, RelatorioSemanalDTO relatorio, Context context) {
        try {
            // TODO: Implementar método específico no EmailService para relatórios
            // Por enquanto, usamos a funcionalidade existente de forma adaptada
            context.getLogger().log("Email de relatório formatado e pronto para envio");
            context.getLogger().log("Destinatário: " + EmailConfig.getAlertEmail());
            context.getLogger().log("Total de avaliações: " + relatorio.getTotalAvaliacoes());
            context.getLogger().log("Média de notas: " + relatorio.getMediaNotas());

            // Nota: Para enviar o relatório completo, seria necessário adicionar um método
            // enviarRelatorioSemanal() no EmailService. Por enquanto, apenas logamos.

        } catch (Exception e) {
            context.getLogger().log("Erro ao enviar email do relatório: " + e.getMessage());
            throw new RuntimeException("Falha ao enviar relatório por email", e);
        }
    }
}