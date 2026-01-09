# Sistema de Feedback - AWS Lambda Functions

## Visão Geral

Este projeto implementa funções Lambda na AWS para um sistema de feedback de restaurantes, utilizando Quarkus framework.

## Funções Lambda Implementadas

### 1. ReceberFeedbackHandler
**Handler:** `lambda.fase4.lambda.ReceberFeedbackHandler`

Função responsável por receber feedbacks de clientes sobre restaurantes.

**Evento de teste:**
```json
{
  "body": "{\"restaurante\":\"Restaurante Italiano\",\"professor\":\"Chef Mario\",\"nota\":2,\"comentario\":\"Comida muito salgada\"}",
  "httpMethod": "POST",
  "path": "/avaliacao",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

**Funcionalidades:**
- Valida e salva feedbacks no banco de dados PostgreSQL
- Envia notificações de urgência para SQS quando nota <= 2
- Registra métricas no CloudWatch
- Retorna resposta HTTP com status da operação

---

### 2. EnviarNotificacaoHandler
**Handler:** `lambda.fase4.lambda.EnviarNotificacaoHandler`

Função que processa mensagens da fila SQS e envia notificações via SNS.

**Evento de teste (SQS):**
```json
{
  "Records": [
    {
      "messageId": "test-message-id",
      "receiptHandle": "test-receipt-handle",
      "body": "{\"avaliacaoId\":\"123e4567-e89b-12d3-a456-426614174000\",\"restaurante\":\"Restaurante Italiano\",\"professor\":\"Chef Mario\",\"nota\":1,\"comentario\":\"Experiência muito ruim\"}",
      "attributes": {
        "ApproximateReceiveCount": "1",
        "SentTimestamp": "1234567890123",
        "SenderId": "AIDAIT2UOQQY3AUEKVGXU",
        "ApproximateFirstReceiveTimestamp": "1234567890123"
      },
      "messageAttributes": {},
      "md5OfBody": "test-md5",
      "eventSource": "aws:sqs",
      "eventSourceARN": "arn:aws:sqs:us-east-2:123456789012:notificacao-urgencia-queue",
      "awsRegion": "us-east-2"
    }
  ]
}
```

**Funcionalidades:**
- Processa mensagens da fila SQS
- Envia alertas via SNS para administradores
- Registra todas as operações no CloudWatch

---

### 3. GerarRelatorioHandler ⭐ NOVA
**Handler:** `lambda.fase4.lambda.GerarRelatorioHandler`

Função que gera relatório semanal de feedbacks e envia por email via Amazon SES.

**Evento de teste (EventBridge/CloudWatch Events):**
```json
{
  "id": "test-event-id",
  "detail-type": "Scheduled Event",
  "source": "aws.events",
  "account": "123456789012",
  "time": "2024-01-08T10:00:00Z",
  "region": "us-east-2",
  "resources": [
    "arn:aws:events:us-east-2:123456789012:rule/weekly-report-rule"
  ],
  "detail": {}
}
```

**Funcionalidades:**
- Gera relatório dos últimos 7 dias
- Calcula média de avaliações
- Agrupa avaliações por restaurante
- Lista comentários negativos (nota <= 2)
- **Envia relatório por email usando Amazon SES**
- Pode ser agendada com EventBridge/CloudWatch Events

**Exemplo de Relatório Gerado:**
```
═══════════════════════════════════════════════
     RELATÓRIO SEMANAL DE FEEDBACKS
═══════════════════════════════════════════════

📅 Período: 01/01/2024 a 08/01/2024

📊 RESUMO GERAL
─────────────────────────────────────────────
Total de Avaliações: 45
Média de Notas: 3.87 ⭐

🏪 AVALIAÇÕES POR RESTAURANTE
─────────────────────────────────────────────
  • Restaurante Italiano: 15 avaliações
  • Pizzaria Central: 20 avaliações
  • Sushi House: 10 avaliações

⚠️ COMENTÁRIOS NEGATIVOS (3)
─────────────────────────────────────────────
  • [Restaurante Italiano - Nota 2] Comida muito salgada
  • [Pizzaria Central - Nota 1] Atendimento ruim
  • [Sushi House - Nota 2] Peixe não estava fresco

═══════════════════════════════════════════════
Sistema de Feedback - Fase 4
Gerado automaticamente
```

---

## Configuração de Variáveis de Ambiente

Configure as seguintes variáveis no Lambda ou no arquivo `.env`:

```properties
# Database
DB_HOST=seu-rds-endpoint.rds.amazonaws.com
DB_PORT=5432
DB_NAME=feedback_db
DB_USERNAME=postgres
DB_PASSWORD=sua-senha-segura

# SQS
SQS_NOTIFICACAO_URL=https://sqs.us-east-2.amazonaws.com/SEU-ACCOUNT-ID/notificacao-urgencia-queue

# SNS
SNS_URGENCIA_ARN=arn:aws:sns:us-east-2:SEU-ACCOUNT-ID:urgencia-topic

# SES - Para envio de emails
SES_FROM_EMAIL=noreply@seu-dominio.com
SES_ADMIN_EMAILS=admin@seu-dominio.com,gerente@seu-dominio.com
```

---

## Deploy na AWS Lambda

### 1. Compilar o projeto
```bash
./mvnw clean package -DskipTests
```

### 2. Arquivos gerados
Após a compilação, você terá:
- `target/lambda-function.jar` - **Use este arquivo para upload na Lambda**
- `target/feedback-system-1.0.0-SNAPSHOT-runner.jar`
- `target/feedback-system-1.0.0-SNAPSHOT.jar`

### 3. Upload na AWS Lambda

**Para cada função:**

1. Acesse AWS Lambda Console
2. Crie uma nova função ou atualize existente
3. **Runtime:** Java 21
4. **Handler:** 
   - Feedback: `lambda.fase4.lambda.ReceberFeedbackHandler`
   - Notificação: `lambda.fase4.lambda.EnviarNotificacaoHandler`
   - Relatório: `lambda.fase4.lambda.GerarRelatorioHandler`
5. Faça upload do arquivo `lambda-function.jar`
6. Configure memória: 512 MB
7. Configure timeout: 30 segundos
8. Configure variáveis de ambiente

### 4. Configurar Triggers

#### Para ReceberFeedbackHandler:
- **Trigger:** API Gateway ou Function URL

#### Para EnviarNotificacaoHandler:
- **Trigger:** SQS Queue `notificacao-urgencia-queue`
- Batch size: 10
- Maximum batching window: 5 seconds

#### Para GerarRelatorioHandler:
- **Trigger:** EventBridge (CloudWatch Events)
- Schedule expression: `cron(0 9 ? * MON *)` (toda segunda-feira às 9h UTC)
- Ou: `rate(7 days)` (a cada 7 dias)

---

## Permissões IAM Necessárias

A função Lambda precisa de uma role com as seguintes políticas:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "arn:aws:sqs:*:*:notificacao-urgencia-queue"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "arn:aws:sns:*:*:urgencia-topic"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

---

## Configuração do Amazon SES

### 1. Verificar Emails
Antes de usar o SES, você precisa verificar os emails:

1. Acesse o console do Amazon SES
2. Vá em "Verified identities"
3. Adicione e verifique:
   - Email do remetente (SES_FROM_EMAIL)
   - Emails dos destinatários (SES_ADMIN_EMAILS)

### 2. Sair do Sandbox (Produção)
No sandbox, você só pode enviar para emails verificados. Para produção:
1. No console SES, solicite "Request production access"
2. Preencha o formulário explicando seu caso de uso

### 3. Testar envio
Use o console SES para enviar um email de teste e verificar se está funcionando.

---

## Testando Localmente

### Testar com Quarkus Dev Mode:
```bash
./mvnw quarkus:dev
```

### Testar endpoints REST:
```bash
curl -X POST http://localhost:8080/avaliacoes \
  -H "Content-Type: application/json" \
  -d '{
    "restaurante": "Restaurante Teste",
    "professor": "Chef Teste",
    "nota": 1,
    "comentario": "Teste de feedback urgente"
  }'
```

---

## Monitoramento

### CloudWatch Logs
Todas as funções enviam logs para CloudWatch. Grupos de log:
- `/aws/lambda/feedback-receber`
- `/aws/lambda/feedback-notificacao`
- `/aws/lambda/feedback-relatorio`

### CloudWatch Metrics
Métricas personalizadas registradas:
- `FeedbackRecebido`
- `NotificacaoUrgenciaEnviada`
- `RelatorioGerado`

---

## Arquitetura

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │ HTTP POST
       ▼
┌─────────────────────┐
│ ReceberFeedback     │
│ Lambda Function     │
└──────┬──────────────┘
       │
       ├─────────────► PostgreSQL RDS
       │
       └─────────────► SQS Queue (se nota <= 2)
                       │
                       ▼
              ┌────────────────────┐
              │ EnviarNotificacao  │
              │ Lambda Function    │
              └─────────┬──────────┘
                        │
                        └──► SNS Topic ──► Email/SMS

┌─────────────────────┐
│ EventBridge         │
│ (Weekly Schedule)   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ GerarRelatorio      │
│ Lambda Function     │
└──────┬──────────────┘
       │
       ├─────────────► PostgreSQL RDS (consulta)
       │
       └─────────────► Amazon SES (envia email)
```

---

## Troubleshooting

### Lambda retorna erro de ClassNotFoundException
- Verifique se está usando `lambda-function.jar` (uber-jar)
- Confirme que o handler está correto

### Email não é enviado
- Verifique se os emails estão verificados no SES
- Verifique as permissões IAM
- Veja logs no CloudWatch

### Erro ao conectar no banco
- Verifique se a Lambda está na mesma VPC que o RDS
- Confirme security groups
- Teste conectividade

### Timeout na Lambda
- Aumente o timeout para 30+ segundos
- Verifique se o banco está respondendo
- Otimize queries se necessário

---

## Próximos Passos

1. ✅ Configurar EventBridge para agendar relatórios semanais
2. ✅ Verificar emails no Amazon SES
3. ✅ Adicionar múltiplos destinatários de email
4. 📝 Implementar template HTML para emails
5. 📝 Adicionar gráficos no relatório
6. 📝 Criar dashboard no CloudWatch

---

## Suporte

Para dúvidas ou problemas:
- Verifique os logs no CloudWatch
- Consulte a documentação da AWS
- Revise as configurações de variáveis de ambiente

