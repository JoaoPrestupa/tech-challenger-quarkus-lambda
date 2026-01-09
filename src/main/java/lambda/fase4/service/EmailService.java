package lambda.fase4.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.*;

import java.util.Arrays;
import java.util.List;

@ApplicationScoped
public class EmailService {

    private static final Logger LOG = Logger.getLogger(EmailService.class);

    @Inject
    SesClient sesClient;

    @ConfigProperty(name = "aws.ses.from.email")
    String fromEmail;

    @ConfigProperty(name = "aws.ses.admin.emails")
    String adminEmails;

    public void enviarRelatorioSemanal(String assunto, String corpoEmail) {
        try {
            List<String> destinatarios = parseDestinatarios();

            LOG.infof("Enviando relatório semanal para: %s", String.join(", ", destinatarios));

            Destination destination = Destination.builder()
                .toAddresses(destinatarios)
                .build();

            Content subject = Content.builder()
                .data(assunto)
                .charset("UTF-8")
                .build();

            Content textBody = Content.builder()
                .data(corpoEmail)
                .charset("UTF-8")
                .build();

            Body body = Body.builder()
                .text(textBody)
                .build();

            Message message = Message.builder()
                .subject(subject)
                .body(body)
                .build();

            SendEmailRequest emailRequest = SendEmailRequest.builder()
                .source(fromEmail)
                .destination(destination)
                .message(message)
                .build();

            SendEmailResponse response = sesClient.sendEmail(emailRequest);

            LOG.infof("Email enviado com sucesso! MessageId: %s", response.messageId());

        } catch (SesException e) {
            LOG.errorf(e, "Erro ao enviar email via SES: %s", e.awsErrorDetails().errorMessage());
            throw new RuntimeException("Erro ao enviar email", e);
        } catch (Exception e) {
            LOG.errorf(e, "Erro inesperado ao enviar email");
            throw new RuntimeException("Erro ao enviar email", e);
        }
    }

    public void enviarEmailSimples(String destinatario, String assunto, String corpo) {
        try {
            LOG.infof("Enviando email para: %s", destinatario);

            Destination destination = Destination.builder()
                .toAddresses(destinatario)
                .build();

            Content subject = Content.builder()
                .data(assunto)
                .charset("UTF-8")
                .build();

            Content textBody = Content.builder()
                .data(corpo)
                .charset("UTF-8")
                .build();

            Body body = Body.builder()
                .text(textBody)
                .build();

            Message message = Message.builder()
                .subject(subject)
                .body(body)
                .build();

            SendEmailRequest emailRequest = SendEmailRequest.builder()
                .source(fromEmail)
                .destination(destination)
                .message(message)
                .build();

            SendEmailResponse response = sesClient.sendEmail(emailRequest);

            LOG.infof("Email enviado com sucesso! MessageId: %s", response.messageId());

        } catch (SesException e) {
            LOG.errorf(e, "Erro ao enviar email via SES: %s", e.awsErrorDetails().errorMessage());
            throw new RuntimeException("Erro ao enviar email", e);
        }
    }

    private List<String> parseDestinatarios() {
        return Arrays.asList(adminEmails.split(","));
    }
}

