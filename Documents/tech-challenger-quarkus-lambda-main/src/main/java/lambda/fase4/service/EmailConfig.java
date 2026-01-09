package lambda.fase4.service;

public class EmailConfig {
        // Configurações SMTP Gmail
        private static final String SMTP_HOST = "smtp.gmail.com";
        private static final int SMTP_PORT = 587;

        // SEU EMAIL DO GMAIL
        private static final String SMTP_USERNAME = "henriquaalves2020@gmail.com";

        // Senha de app do Gmail (16 caracteres sem espaços)
        private static final String SMTP_PASSWORD = "muqdmrkyaqdwjlld";

        // Email para receber alertas (seu email mesmo)
        private static final String ALERT_EMAIL = "henriquaalves2020@gmail.com";

        private static EmailService emailService;

        /**
         * Retorna uma instância singleton do EmailService
         */
        public static EmailService getEmailService() {
            if (emailService == null) {
                emailService = new EmailService(
                        SMTP_HOST,
                        SMTP_PORT,
                        SMTP_USERNAME,
                        SMTP_PASSWORD
                );
            }
            return emailService;
        }

        /**
         * Retorna o email para alertas
         */
        public static String getAlertEmail() {
            return ALERT_EMAIL;
        }
    }
