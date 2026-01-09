package lambda.fase4.service;

import com.google.gson.Gson;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import lambda.fase4.dto.NotificacaoUrgenciaDTO;
import lambda.fase4.model.Avaliacao;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;

@ApplicationScoped
public class NotificacaoService {

    private static final Logger LOG = Logger.getLogger(NotificacaoService.class);

    @Inject
    SqsClient sqsClient;

    @Inject
    SnsClient snsClient;

    @Inject
    Gson gson;

    @ConfigProperty(name = "quarkus.sqs.queue.notificacao.url")
    String sqsQueueUrl;

    @ConfigProperty(name = "quarkus.sns.topic.urgencia.arn")
    String snsTopicArn;

    public void enviarNotificacaoUrgencia(Avaliacao avaliacao) {
        try {
            NotificacaoUrgenciaDTO dto = new NotificacaoUrgenciaDTO(
                avaliacao.getId(),
                avaliacao.getRestaurante(),
                avaliacao.getNota(),
                avaliacao.getComentario(),
                avaliacao.getDataAvaliacao()
            );

            String mensagemJson = gson.toJson(dto);

            // Enviar para SQS
            SendMessageRequest sqsRequest = SendMessageRequest.builder()
                .queueUrl(sqsQueueUrl)
                .messageBody(mensagemJson)
                .build();

            sqsClient.sendMessage(sqsRequest);
            LOG.infof("Mensagem enviada para SQS: %s", mensagemJson);

        } catch (Exception e) {
            LOG.errorf(e, "Erro ao enviar notificação de urgência");
            throw new RuntimeException("Erro ao enviar notificação", e);
        }
    }

    public void publicarAlertaSNS(String titulo, String mensagem) {
        try {
            String mensagemCompleta = String.format("=== %s ===\n\n%s", titulo, mensagem);

            PublishRequest publishRequest = PublishRequest.builder()
                .topicArn(snsTopicArn)
                .subject(titulo)
                .message(mensagemCompleta)
                .build();

            snsClient.publish(publishRequest);
            LOG.infof("Alerta publicado no SNS: %s", titulo);

        } catch (Exception e) {
            LOG.errorf(e, "Erro ao publicar no SNS");
            throw new RuntimeException("Erro ao publicar no SNS", e);
        }
    }
}

