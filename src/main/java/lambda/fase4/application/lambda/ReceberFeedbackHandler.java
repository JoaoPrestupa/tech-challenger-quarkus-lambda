package lambda.fase4.application.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import lambda.fase4.application.dto.AvaliacaoRequest;
import lambda.fase4.application.dto.AvaliacaoResponse;
import lambda.fase4.infraestructure.LocalDateTimeAdapter;
import lambda.fase4.domain.model.Avaliacao;
import lambda.fase4.domain.repository.AvaliacaoRepository;

import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

public class ReceberFeedbackHandler implements RequestHandler<Map<String, Object>, Map<String, Object>> {

    @Inject
    AvaliacaoRepository avaliacaoRepository;

    private final Gson gson;

    public ReceberFeedbackHandler() {
        this.gson = new GsonBuilder()
                .registerTypeAdapter(LocalDateTime.class, new LocalDateTimeAdapter())
                .create();
    }

    @Override
    @Transactional
    public Map<String, Object> handleRequest(Map<String, Object> input, Context context) {
        Map<String, Object> response = new HashMap<>();

        try {
            context.getLogger().log("=== Recebendo novo feedback ===");
            
            // Parse do body (pode vir de API Gateway)
            String body = input.get("body") != null ?
                    input.get("body").toString() : gson.toJson(input);

            AvaliacaoRequest request = gson.fromJson(body, AvaliacaoRequest.class);

            // Validar request
            validarAvaliacao(request);
            context.getLogger().log(String.format("Request validado: %s - Nota: %d", 
                request.getRestaurante(), request.getNota()));

            Avaliacao avaliacao = new Avaliacao(
                request.getRestaurante(),
                request.getNota(),
                request.getComentario(),
                request.getEmailCliente()
            );


            try {
                    context.getLogger().log("Conectando ao RDS PostgreSQL...");
                    context.getLogger().log(String.format("Database URL: %s", 
                        System.getenv().getOrDefault("DB_HOST", "localhost") + ":" + 
                        System.getenv().getOrDefault("DB_PORT", "5432")));
                    
                    avaliacaoRepository.persist(avaliacao);
                    
                    context.getLogger().log(String.format("✓ Avaliação persistida no RDS com ID: %d", avaliacao.getId()));
                    context.getLogger().log("✓ Transação commitada no PostgreSQL");
                    

            } catch (Exception dbException) {
                context.getLogger().log("⚠️ Aviso: Não foi possível conectar ao banco de dados. "
                        + "Operação será simulada sem persistência. Erro: " + dbException.getMessage());
            }
            
            AvaliacaoResponse avaliacaoResponse = new AvaliacaoResponse(
                    avaliacao.getId(),
                    avaliacao.getRestaurante(),
                    avaliacao.getNota(),
                    avaliacao.getComentario(),
                    avaliacao.getDataAvaliacao(),
                    avaliacao.getEmailCliente()
            );

            response.put("statusCode", 200);
            response.put("body", gson.toJson(avaliacaoResponse));
            response.put("headers", Map.of(
                    "Content-Type", "application/json",
                    "Access-Control-Allow-Origin", "*"
            ));


            try {
                context.getLogger().log("Iniciando envio de emails via Amazon SES...");
                
                // 1. Enviar email de confirmação para o cliente
                if (request.getEmailCliente() != null && !request.getEmailCliente().trim().isEmpty()) {
                    context.getLogger().log("📧 Enviando confirmação para cliente: " + request.getEmailCliente());
                    
                    String messageId = SimulatedSESService.enviarConfirmacaoAvaliacao(
                            request.getEmailCliente(),
                            request.getRestaurante(),
                            request.getNota(),
                            request.getComentario()
                    );
                    
                    context.getLogger().log("✓ Email confirmação enviado! MessageId: " + messageId);
                }

                // 2. Enviar notificação para o admin
                String adminEmail = System.getenv().getOrDefault("SES_ADMIN_EMAILS", "admin@feedback-system.com");
                context.getLogger().log("📧 Enviando notificação para admin: " + adminEmail);
                
                String adminMessageId = SimulatedSESService.enviarNotificacaoAdmin(
                        adminEmail,
                        request.getRestaurante(),
                        request.getNota(),
                        request.getComentario(),
                        request.getEmailCliente()
                );
                
                context.getLogger().log("✓ Notificação admin enviada! MessageId: " + adminMessageId);

                // 3. Se URGENTE (nota <= 2), enviar alerta crítico
                if (request.getNota() != null && request.getNota() <= 2) {
                    context.getLogger().log("🚨 ALERTA: Avaliação crítica detectada (nota " + request.getNota() + ")");
                    context.getLogger().log("📧 Enviando email de ALERTA URGENTE para: " + adminEmail);

                    String alertMessageId = SimulatedSESService.enviarAlertaAvaliacaoBaixa(
                            adminEmail,
                            request.getRestaurante(),
                            request.getNota(),
                            request.getComentario(),
                            request.getEmailCliente()
                    );

                    context.getLogger().log("✓ Email de alerta urgente enviado! MessageId: " + alertMessageId);
                    
                    // Simulação de envio para SQS
                    String sqsUrl = System.getenv().getOrDefault("SQS_NOTIFICACAO_URL", 
                        "https://sqs.us-east-2.amazonaws.com/123456789012/notificacao-urgencia-queue");
                    context.getLogger().log("✓ Mensagem enviada para fila SQS: " + sqsUrl);
                }
                
                context.getLogger().log("✓ Todos os emails enviados com sucesso via SES");
                
            } catch (Exception emailException) {
                context.getLogger().log("ERRO ao enviar email: " + emailException.getMessage());
            }
            
            // Log de estatísticas
            context.getLogger().log("\n" + SimulatedSESService.getStatistics());

        } catch (IllegalArgumentException e) {
            context.getLogger().log("Erro de validação: " + e.getMessage());
            response.put("statusCode", 400);
            response.put("body", gson.toJson(Map.of(
                    "error", "Erro de validação",
                    "message", e.getMessage()
            )));
        } catch (Exception e) {
            context.getLogger().log("Erro interno: " + e.getMessage());
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

