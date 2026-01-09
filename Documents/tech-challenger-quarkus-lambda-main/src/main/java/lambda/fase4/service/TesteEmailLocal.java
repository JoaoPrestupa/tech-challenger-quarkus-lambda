package lambda.fase4.service;

public class TesteEmailLocal {

    public static void main(String[] args) {
        System.out.println("=== TESTE DE ENVIO DE EMAIL ===");
        System.out.println("Destinatário: henriquaalves2020@gmail.com");
        System.out.println();

        try {
            EmailService emailService = EmailConfig.getEmailService();

            // TESTE 1: Email de confirmação para CLIENTE
            System.out.println("📧 Enviando email de confirmação (CLIENTE)...");
            emailService.enviarConfirmacaoAvaliacao(
                    "henriquaalves2020@gmail.com",
                    "Restaurante Bom Sabor",
                    5,
                    "Comida excelente e atendimento impecável!"
            );
            System.out.println("✅ Email de confirmação enviado!");
            System.out.println();

            // Aguardar um pouco antes do próximo email
            Thread.sleep(2000);

            // TESTE 2: Notificação para ADMIN (qualquer nota)
            System.out.println("📋 Enviando notificação para ADMIN (nota boa)...");
            emailService.enviarNotificacaoAdmin(
                    "henriquaalves2020@gmail.com",
                    "Restaurante Bom Sabor",
                    5,
                    "Comida excelente e atendimento impecável!",
                    "cliente@exemplo.com"
            );
            System.out.println("✅ Notificação admin enviada!");
            System.out.println();

            // Aguardar um pouco antes do próximo email
            Thread.sleep(2000);

            // TESTE 3: Email de alerta para ADMIN (nota baixa)
            System.out.println("⚠️ Enviando email de ALERTA URGENTE (ADMIN)...");
            emailService.enviarAlertaAvaliacaoBaixa(
                    "henriquaalves2020@gmail.com",
                    "Restaurante Bom Sabor",
                    2,
                    "Comida fria e atendimento demorado",
                    "cliente.insatisfeito@exemplo.com"
            );
            System.out.println("✅ Email de alerta enviado!");
            System.out.println();

            // Aguardar um pouco antes do próximo email
            Thread.sleep(2000);

            // TESTE 4: Notificação para ADMIN com nota média
            System.out.println("📋 Enviando notificação para ADMIN (nota média)...");
            emailService.enviarNotificacaoAdmin(
                    "henriquaalves2020@gmail.com",
                    "Restaurante Bom Sabor",
                    3,
                    "Experiência ok, pode melhorar",
                    "cliente2@exemplo.com"
            );
            System.out.println("✅ Notificação admin enviada!");
            System.out.println();

            System.out.println("=== TESTE CONCLUÍDO ===");
            System.out.println("Você deve ter recebido 4 emails:");
            System.out.println("1. ✉️ Confirmação para cliente (nota 5)");
            System.out.println("2. 📋 Notificação admin normal (nota 5)");
            System.out.println("3. ⚠️ Alerta urgente admin (nota 2)");
            System.out.println("4. 📋 Notificação admin normal (nota 3)");
            System.out.println();
            System.out.println("Verifique sua caixa de entrada: henriquaalves2020@gmail.com");

        } catch (Exception e) {
            System.err.println("❌ ERRO ao enviar email:");
            e.printStackTrace();
            System.err.println();
            System.err.println("Possíveis causas:");
            System.err.println("1. Senha de app incorreta no EmailConfig.java");
            System.err.println("2. Verificação em 2 etapas não ativada");
            System.err.println("3. Firewall bloqueando porta 587");
            System.err.println("4. Sem conexão com internet");
        }
    }
}
