package lambda.fase4.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import lambda.fase4.dto.AvaliacaoRequest;
import lambda.fase4.dto.AvaliacaoResponse;
import lambda.fase4.config.LocalDateTimeAdapter;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Lambda Function 1: Receber e processar feedback de clientes
 * Esta função é invocada quando um novo feedback é enviado
 */
public class ReceberFeedbackHandler implements RequestHandler<Map<String, Object>, Map<String, Object>> {

    private final Gson gson;

    public ReceberFeedbackHandler() {
        this.gson = new GsonBuilder()
            .registerTypeAdapter(LocalDateTime.class, new LocalDateTimeAdapter())
            .create();
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

            // Se for urgente (nota <= 2), enviar para SQS
            if (request.getNota() != null && request.getNota() <= 2) {
                // TODO: Enviar para SQS quando configurado
                context.getLogger().log("Avaliação urgente detectada (nota " + request.getNota() + ")");
            }

        } catch (IllegalArgumentException e) {
            response.put("statusCode", 400);
            response.put("body", gson.toJson(Map.of(
                "error", "Erro de validação",
                "message", e.getMessage()
            )));
        } catch (Exception e) {
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

