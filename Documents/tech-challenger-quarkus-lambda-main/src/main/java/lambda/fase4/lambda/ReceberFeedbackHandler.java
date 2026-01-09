package lambda.fase4.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import lambda.fase4.dto.AvaliacaoRequest;
import lambda.fase4.dto.AvaliacaoResponse;
import lambda.fase4.config.LocalDateTimeAdapter;

import lambda.fase4.service.EmailConfig;
import lambda.fase4.service.EmailService;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Lambda Function 1: Receber e processar feedback de clientes
 * Esta função é invocada quando um novo feedback é enviado
 */
public class ReceberFeedbackHandler implements RequestHandler<Map<String, Object>, Map<String, Object>> {

    private final Gson gson;
    private final EmailService emailService;

    public ReceberFeedbackHandler() {
        this.gson = new GsonBuilder()
                .registerTypeAdapter(LocalDateTime.class, new LocalDateTimeAdapter())
                .create();
        this.emailService = EmailConfig.getEmailService();
    }

    @Override
    public Map<String, Object> handleRequest(Map<String, Object> input, Context context) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Parse do body (pode vir de API Gateway)
            String body = input.get("body") != null ?
                    input.get("body").toString() : gson.toJson(input);

            AvaliacaoRequest request = gson.fromJson(body, AvaliacaoRequest.class);

            // Validar request
            validarAvaliacao(request);

            // Criar response (simulado - em produção conectaria ao banco)
            AvaliacaoResponse avaliacaoResponse = new AvaliacaoResponse(
                    System.currentTimeMillis(), // ID temporário
                    request.getRestaurante(),
                    request.getNota(),
                    request.getComentario(),
                    LocalDateTime.now(),
                    request.getEmailCliente()
            );

            response.put("statusCode", 200);
            response.put("body", gson.toJson(avaliacaoResponse));
            response.put("headers", Map.of(
                    "Content-Type", "application/json",
                    "Access-Control-Allow-Origin", "*"
            ));

            // ENVIO DE EMAILS APÓS A RESPONSE
            try {
                // 1. Enviar email de confirmação para o cliente (se email fornecido)
                if (request.getEmailCliente() != null && !request.getEmailCliente().trim().isEmpty()) {
                    context.getLogger().log("Enviando email de confirmação para: " + request.getEmailCliente());
                    emailService.enviarConfirmacaoAvaliacao(
                            request.getEmailCliente(),
                            request.getRestaurante(),
                            request.getNota(),
                            request.getComentario()
                    );
                    context.getLogger().log("Email de confirmação enviado com sucesso!");
                }

                // 2. SEMPRE enviar notificação para o admin sobre nova avaliação
                context.getLogger().log("Enviando notificação admin para: " + EmailConfig.getAlertEmail());
                emailService.enviarNotificacaoAdmin(
                        EmailConfig.getAlertEmail(),
                        request.getRestaurante(),
                        request.getNota(),
                        request.getComentario(),
                        request.getEmailCliente()
                );
                context.getLogger().log("Notificação admin enviada com sucesso!");

                // 3. Se for URGENTE (nota <= 2), enviar TAMBÉM alerta crítico
                if (request.getNota() != null && request.getNota() <= 2) {
                    context.getLogger().log("Avaliação urgente detectada (nota " + request.getNota() + ")");
                    context.getLogger().log("Enviando email de ALERTA URGENTE para: " + EmailConfig.getAlertEmail());

                    emailService.enviarAlertaAvaliacaoBaixa(
                            EmailConfig.getAlertEmail(),
                            request.getRestaurante(),
                            request.getNota(),
                            request.getComentario(),
                            request.getEmailCliente()
                    );

                    context.getLogger().log("Email de alerta urgente enviado com sucesso!");
                    // TODO: Enviar para SQS quando configurado
                }
            } catch (Exception emailException) {
                // Log do erro mas não falha a requisição
                context.getLogger().log("ERRO ao enviar email: " + emailException.getMessage());
                emailException.printStackTrace();
                // Email é uma operação secundária, não deve quebrar a resposta principal
            }

        } catch (IllegalArgumentException e) {
            response.put("statusCode", 400);
            response.put("body", gson.toJson(Map.of(
                    "error", "Erro de validação",
                    "message", e.getMessage()
            )));
        } catch (Exception e) {
            context.getLogger().log("ERRO: " + e.getMessage());
            e.printStackTrace();
            response.put("statusCode", 500);
            response.put("body", gson.toJson(Map.of(
                    "error", "Erro interno do servidor",
                    "message", e.getMessage()
            )));
        }

        return response;
    }

    private void validarAvaliacao(AvaliacaoRequest request) {
        if (request.getRestaurante() == null || request.getRestaurante().trim().isEmpty()) {
            throw new IllegalArgumentException("Nome do restaurante é obrigatório");
        }
        if (request.getNota() == null || request.getNota() < 1 || request.getNota() > 5) {
            throw new IllegalArgumentException("Nota deve estar entre 1 e 5");
        }
    }
}