package lambda.fase4.application.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.SQSEvent;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import lambda.fase4.application.dto.NotificacaoUrgenciaDTO;
import lambda.fase4.infraestructure.LocalDateTimeAdapter;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;


public class EnviarNotificacaoHandler implements RequestHandler<SQSEvent, Map<String, Object>> {

    private final Gson gson;

    public EnviarNotificacaoHandler() {
        this.gson = new GsonBuilder()
            .registerTypeAdapter(LocalDateTime.class, new LocalDateTimeAdapter())
            .create();
    }

    @Override
    public Map<String, Object> handleRequest(SQSEvent event, Context context) {
        Map<String, Object> response = new HashMap<>();
        int processadas = 0;
        int erros = 0;

        for (SQSEvent.SQSMessage message : event.getRecords()) {
            try {
                String body = message.getBody();
                NotificacaoUrgenciaDTO notificacao = gson.fromJson(body, NotificacaoUrgenciaDTO.class);

                // Formatar notificação
                String titulo = String.format("🚨 Avaliação Urgente - %s", notificacao.getRestaurante());
                String mensagem = formatarNotificacao(notificacao);

                // TODO: Enviar via SNS quando configurado
                context.getLogger().log("Notificação: " + titulo);

                processadas++;

            } catch (Exception e) {
                erros++;
            }
        }

        response.put("statusCode", 200);
        response.put("processadas", processadas);
        response.put("erros", erros);
        response.put("message", String.format("Processadas %d mensagens com %d erros", processadas, erros));

        return response;
    }

    private String formatarNotificacao(NotificacaoUrgenciaDTO notificacao) {
        StringBuilder sb = new StringBuilder();

        sb.append("Uma avaliação urgente foi recebida!\n\n");
        sb.append("🏪 Restaurante: ").append(notificacao.getRestaurante()).append("\n");
        sb.append("⭐ Nota: ").append(notificacao.getNota()).append("/5\n");
        sb.append("📅 Data: ").append(notificacao.getDataAvaliacao()).append("\n\n");

        if (notificacao.getComentario() != null && !notificacao.getComentario().isEmpty()) {
            sb.append("💬 Comentário:\n");
            sb.append(notificacao.getComentario()).append("\n\n");
        }

        sb.append("⚠️ Esta avaliação requer atenção imediata!");

        return sb.toString();
    }
}

