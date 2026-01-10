package lambda.fase4.domain.service;

import javax.mail.*;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;
import java.util.Properties;

/**
 * Serviço para envio de emails via SMTP
 */
public class EmailService {

    private final Session session;
    private final String fromEmail;

    public EmailService(String host, int port, String username, String password) {
        this.fromEmail = username;

        Properties props = new Properties();
        props.put("mail.smtp.host", host);
        props.put("mail.smtp.port", port);
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.transport.protocol", "smtp");

        // Criar sessão com autenticação
        this.session = Session.getInstance(props, new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(username, password);
            }
        });
    }

    /**
     * Envia email de confirmação de avaliação
     */
    public void enviarConfirmacaoAvaliacao(String destinatario, String restaurante, Integer nota, String comentario) {
        try {
            MimeMessage message = new MimeMessage(session);
            message.setFrom(new InternetAddress(fromEmail));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(destinatario));
            message.setSubject("Confirmação de Avaliação - " + restaurante);

            String htmlContent = construirEmailConfirmacao(restaurante, nota, comentario);
            message.setContent(htmlContent, "text/html; charset=utf-8");

            Transport.send(message);

        } catch (MessagingException e) {
            throw new RuntimeException("Erro ao enviar email: " + e.getMessage(), e);
        }
    }

    /**
     * Envia email de alerta para avaliações baixas
     */
    public void enviarAlertaAvaliacaoBaixa(String destinatario, String restaurante, Integer nota, String comentario, String emailCliente) {
        try {
            MimeMessage message = new MimeMessage(session);
            message.setFrom(new InternetAddress(fromEmail));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(destinatario));
            message.setSubject("URGENTE: Avaliação Baixa - " + restaurante);

            String htmlContent = construirEmailAlerta(restaurante, nota, comentario, emailCliente);
            message.setContent(htmlContent, "text/html; charset=utf-8");

            Transport.send(message);

        } catch (MessagingException e) {
            throw new RuntimeException("Erro ao enviar email de alerta: " + e.getMessage(), e);
        }
    }

    /**
     * Envia notificação para admin sobre nova avaliação (qualquer nota)
     */
    public void enviarNotificacaoAdmin(String destinatario, String restaurante, Integer nota, String comentario, String emailCliente) {
        try {
            MimeMessage message = new MimeMessage(session);
            message.setFrom(new InternetAddress(fromEmail));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(destinatario));
            message.setSubject("Nova Avaliação Recebida - " + restaurante);

            String htmlContent = construirEmailNotificacaoAdmin(restaurante, nota, comentario, emailCliente);
            message.setContent(htmlContent, "text/html; charset=utf-8");

            Transport.send(message);

        } catch (MessagingException e) {
            throw new RuntimeException("Erro ao enviar notificação admin: " + e.getMessage(), e);
        }
    }

    private String construirEmailConfirmacao(String restaurante, Integer nota, String comentario) {
        return String.format("""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2 style="color: #4CAF50;">Avaliação Recebida com Sucesso!</h2>
                    <p>Obrigado por avaliar o <strong>%s</strong>!</p>
                    
                    <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Nota:</strong> %s/5 ⭐</p>
                        <p><strong>Comentário:</strong></p>
                        <p style="font-style: italic;">"%s"</p>
                    </div>
                    
                    <p>Sua opinião é muito importante para nós!</p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666;">
                        Este é um email automático, por favor não responda.
                    </p>
                </div>
            </body>
            </html>
            """,
                restaurante,
                nota,
                comentario != null ? comentario : "Sem comentário"
        );
    }

    private String construirEmailAlerta(String restaurante, Integer nota, String comentario, String emailCliente) {
        return String.format("""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #f44336; border-radius: 5px;">
                    <h2 style="color: #f44336;">⚠️ ALERTA: Avaliação Baixa Recebida</h2>
                    <p>Uma avaliação negativa foi registrada para o restaurante <strong>%s</strong></p>
                    
                    <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f44336;">
                        <p><strong>Nota:</strong> <span style="color: #f44336; font-size: 18px;">%s/5</span> ⭐</p>
                        <p><strong>Comentário do Cliente:</strong></p>
                        <p style="font-style: italic;">"%s"</p>
                        <p><strong>Email do Cliente:</strong> %s</p>
                    </div>
                    
                    <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Ação Recomendada:</strong></p>
                        <ul>
                            <li>Entre em contato com o cliente o mais rápido possível</li>
                            <li>Investigue o problema relatado</li>
                            <li>Ofereça uma solução ou compensação adequada</li>
                        </ul>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666;">
                        Este é um alerta automático do sistema de feedback.
                    </p>
                </div>
            </body>
            </html>
            """,
                restaurante,
                nota,
                comentario != null ? comentario : "Sem comentário",
                emailCliente != null ? emailCliente : "Não informado"
        );
    }

    private String construirEmailNotificacaoAdmin(String restaurante, Integer nota, String comentario, String emailCliente) {
        String corNota = nota <= 2 ? "#f44336" : (nota <= 3 ? "#ff9800" : "#4CAF50");
        String emoji = nota <= 2 ? "😟" : (nota <= 3 ? "😐" : "😊");

        return String.format("""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2 style="color: #2196F3;">📋 Nova Avaliação Recebida</h2>
                    <p>Uma nova avaliação foi registrada para o restaurante <strong>%s</strong></p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid %s;">
                        <p><strong>Nota:</strong> <span style="color: %s; font-size: 20px;">%s/5</span> %s</p>
                        <p><strong>Comentário:</strong></p>
                        <p style="font-style: italic; padding: 10px; background: white; border-radius: 3px;">"%s"</p>
                        <p><strong>Email do Cliente:</strong> %s</p>
                    </div>
                    
                    <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>💡 Dica:</strong></p>
                        <p style="margin: 5px 0 0 0;">%s</p>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666;">
                        Notificação automática do Sistema de Feedback | %s
                    </p>
                </div>
            </body>
            </html>
            """,
                restaurante,
                corNota,
                corNota,
                nota,
                emoji,
                comentario != null ? comentario : "Sem comentário",
                emailCliente != null ? emailCliente : "Não informado",
                nota <= 2 ? "Entre em contato com o cliente urgentemente!" :
                        (nota <= 3 ? "Considere entrar em contato para entender melhor a experiência." :
                                "Continue com o excelente trabalho!"),
                java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
        );
    }
}