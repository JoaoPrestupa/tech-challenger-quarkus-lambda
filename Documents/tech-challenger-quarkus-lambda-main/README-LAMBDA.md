# Guia de Deploy das Funções Lambda na AWS

Este projeto Quarkus contém 3 funções Lambda para o sistema de feedback de restaurantes.

## Funções Lambda

1. **ReceberFeedbackHandler** - Recebe e processa feedback de clientes
2. **EnviarNotificacaoHandler** - Processa notificações urgentes da fila SQS
3. **GerarRelatorioHandler** - Gera relatórios semanais automaticamente

## Pré-requisitos

- Java 21
- Maven 3.8+
- AWS CLI configurado
- Conta AWS com permissões para Lambda, SQS, SNS, CloudWatch e RDS

## Build do Projeto

### Opção 1: Usando Quarkus (Recomendado para Lambda)

```bash
mvn clean package -DskipTests
```

Isso irá gerar dois arquivos importantes:
- `target/feedback-system-1.0.0-SNAPSHOT-runner.jar` - Quarkus runner jar
- `target/function.zip` - Pacote pronto para upload na AWS Lambda

### Opção 2: Usando Maven Shade Plugin (Uber JAR)

O pom.xml já está configurado com o maven-shade-plugin que cria um uber-jar com todas as dependências.

```bash
mvn clean package -DskipTests
```

O arquivo gerado será: `target/lambda-function.jar`

## Estrutura das Funções Lambda

### 1. Receber Feedback (ReceberFeedbackHandler)

**Handler:** `lambda.fase4.lambda.ReceberFeedbackHandler`

**Trigger:** API Gateway (HTTP POST)

**Entrada (JSON):**
```json
{
  "restaurante": "Restaurante X",
  "nota": 5,
  "comentario": "Excelente atendimento!",
  "emailCliente": "cliente@example.com"
}
```

**Saída (JSON):**
```json
{
  "id": 1,
  "restaurante": "Restaurante X",
  "nota": 5,
  "comentario": "Excelente atendimento!",
  "dataAvaliacao": "2025-12-10T10:30:00",
  "emailCliente": "cliente@example.com"
}
```

### 2. Enviar Notificação (EnviarNotificacaoHandler)

**Handler:** `lambda.fase4.lambda.EnviarNotificacaoHandler`

**Trigger:** SQS Queue

**Entrada:** Mensagens da fila SQS (automaticamente processadas)

### 3. Gerar Relatório (GerarRelatorioHandler)

**Handler:** `lambda.fase4.lambda.GerarRelatorioHandler`

**Trigger:** EventBridge (CloudWatch Events) - Agendado

**Saída (JSON):**
```json
{
  "periodo": "03/12/2025 a 10/12/2025",
  "totalAvaliacoes": 150,
  "mediaNotas": 4.2,
  "avaliacoesPorRestaurante": {
    "Restaurante A": 50,
    "Restaurante B": 100
  },
  "comentariosNegativos": [
    "[Restaurante A - Nota 1] Péssimo atendimento"
  ]
}
```

## Deploy na AWS

### 1. Criar a Função Lambda via AWS CLI

```bash
# Criar a função Lambda para Receber Feedback
aws lambda create-function \
  --function-name receber-feedback \
  --runtime java21 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler lambda.fase4.lambda.ReceberFeedbackHandler::handleRequest \
  --zip-file fileb://target/function.zip \
  --timeout 30 \
  --memory-size 512 \
  --environment Variables="{
    DB_HOST=your-rds-endpoint.amazonaws.com,
    DB_PORT=5432,
    DB_NAME=feedback_db,
    DB_USERNAME=postgres,
    DB_PASSWORD=your-password,
    SQS_NOTIFICACAO_URL=https://sqs.us-east-2.amazonaws.com/ACCOUNT_ID/notificacao-queue,
    SNS_URGENCIA_ARN=arn:aws:sns:us-east-2:ACCOUNT_ID:urgencia-topic
  }"

# Criar a função Lambda para Enviar Notificação
aws lambda create-function \
  --function-name enviar-notificacao \
  --runtime java21 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler lambda.fase4.lambda.EnviarNotificacaoHandler::handleRequest \
  --zip-file fileb://target/function.zip \
  --timeout 30 \
  --memory-size 512

# Criar a função Lambda para Gerar Relatório
aws lambda create-function \
  --function-name gerar-relatorio \
  --runtime java21 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler lambda.fase4.lambda.GerarRelatorioHandler::handleRequest \
  --zip-file fileb://target/function.zip \
  --timeout 60 \
  --memory-size 1024 \
  --environment Variables="{
    DB_HOST=your-rds-endpoint.amazonaws.com,
    DB_PORT=5432,
    DB_NAME=feedback_db,
    DB_USERNAME=postgres,
    DB_PASSWORD=your-password,
    SNS_URGENCIA_ARN=arn:aws:sns:us-east-2:ACCOUNT_ID:urgencia-topic
  }"
```

### 2. Atualizar uma Função Lambda Existente

```bash
# Atualizar o código
aws lambda update-function-code \
  --function-name receber-feedback \
  --zip-file fileb://target/function.zip

# Atualizar variáveis de ambiente
aws lambda update-function-configuration \
  --function-name receber-feedback \
  --environment Variables="{
    DB_HOST=your-rds-endpoint.amazonaws.com,
    DB_PORT=5432,
    DB_NAME=feedback_db,
    DB_USERNAME=postgres,
    DB_PASSWORD=your-password,
    SQS_NOTIFICACAO_URL=https://sqs.us-east-2.amazonaws.com/ACCOUNT_ID/notificacao-queue
  }"
```

### 3. Configurar Triggers

#### API Gateway para ReceberFeedbackHandler

```bash
# Via Console AWS ou usando AWS SAM/CloudFormation
# Criar um API Gateway REST API e conectar à função Lambda
```

#### SQS Trigger para EnviarNotificacaoHandler

```bash
# Adicionar trigger SQS
aws lambda create-event-source-mapping \
  --function-name enviar-notificacao \
  --event-source-arn arn:aws:sqs:us-east-2:ACCOUNT_ID:notificacao-queue \
  --batch-size 10
```

#### EventBridge Trigger para GerarRelatorioHandler

```bash
# Criar regra no EventBridge (toda segunda-feira às 9h)
aws events put-rule \
  --name gerar-relatorio-semanal \
  --schedule-expression "cron(0 9 ? * MON *)"

# Adicionar permissão
aws lambda add-permission \
  --function-name gerar-relatorio \
  --statement-id gerar-relatorio-semanal \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn arn:aws:events:us-east-2:ACCOUNT_ID:rule/gerar-relatorio-semanal

# Adicionar target
aws events put-targets \
  --rule gerar-relatorio-semanal \
  --targets "Id"="1","Arn"="arn:aws:lambda:us-east-2:ACCOUNT_ID:function:gerar-relatorio"
```

## Infraestrutura Necessária

### 1. RDS PostgreSQL

```sql
CREATE DATABASE feedback_db;

CREATE TABLE avaliacoes (
    id SERIAL PRIMARY KEY,
    restaurante VARCHAR(255) NOT NULL,
    nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
    comentario VARCHAR(1000),
    data_avaliacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    email_cliente VARCHAR(255)
);
```

### 2. SQS Queue

```bash
aws sqs create-queue --queue-name notificacao-urgencia-queue
```

### 3. SNS Topic

```bash
aws sns create-topic --name urgencia-topic

# Adicionar subscrição por email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-2:ACCOUNT_ID:urgencia-topic \
  --protocol email \
  --notification-endpoint admin@example.com
```

### 4. IAM Role

A role precisa ter as seguintes políticas:
- AWSLambdaBasicExecutionRole
- AmazonSQSFullAccess (ou permissões específicas para a fila)
- AmazonSNSFullAccess (ou permissões específicas para o tópico)
- CloudWatchFullAccess (para métricas)
- AmazonRDSDataFullAccess (para acesso ao banco)
- VPCAccessExecutionRole (se o RDS estiver em VPC privada)

## Testes

### Testar Localmente (Dev Mode)

```bash
mvn quarkus:dev
```

Endpoints disponíveis:
- POST http://localhost:8080/api/avaliacoes - Criar avaliação
- GET http://localhost:8080/api/avaliacoes - Listar todas
- GET http://localhost:8080/api/avaliacoes/{id} - Buscar por ID

### Testar Lambda Localmente com SAM CLI

```bash
# Instalar AWS SAM CLI
sam local invoke ReceberFeedbackHandler --event test-event.json
```

Exemplo de `test-event.json`:
```json
{
  "body": "{\"restaurante\":\"Restaurante Teste\",\"nota\":5,\"comentario\":\"Ótimo!\",\"emailCliente\":\"teste@example.com\"}"
}
```

### Testar na AWS

```bash
# Invocar função diretamente
aws lambda invoke \
  --function-name receber-feedback \
  --payload '{"body":"{\"restaurante\":\"Restaurante X\",\"nota\":5,\"comentario\":\"Excelente!\",\"emailCliente\":\"teste@example.com\"}"}' \
  response.json

cat response.json
```

## Monitoramento

### CloudWatch Logs

```bash
# Ver logs
aws logs tail /aws/lambda/receber-feedback --follow
```

### CloudWatch Metrics

As métricas customizadas são enviadas para o namespace `FeedbackSystem`:
- `AvaliacoesRecebidas` - Total de avaliações
- `NotaAvaliacao` - Notas das avaliações

## Troubleshooting

### Erro: ClassNotFoundException

**Causa:** Dependências faltando no JAR
**Solução:** Verificar se o uber-jar foi criado corretamente com todas as dependências

```bash
# Verificar conteúdo do JAR
jar tf target/lambda-function.jar | grep "jboss/logging"
```

### Erro: Connection timeout to RDS

**Causa:** Lambda não está na mesma VPC que o RDS ou Security Groups incorretos
**Solução:** 
1. Configurar Lambda para executar na mesma VPC do RDS
2. Ajustar Security Groups para permitir conexão na porta 5432

### Erro: Access Denied (SQS/SNS/CloudWatch)

**Causa:** IAM Role sem permissões necessárias
**Solução:** Adicionar políticas necessárias à IAM Role

## Custos Estimados

- **Lambda:** ~$0.20 por 1 milhão de requisições + tempo de execução
- **RDS PostgreSQL (t3.micro):** ~$15/mês
- **SQS:** Primeiros 1 milhão de requisições gratuitas
- **SNS:** Primeiros 1.000 notificações por email gratuitas
- **CloudWatch:** Logs e métricas básicas gratuitos

## Arquitetura

```
Cliente → API Gateway → Lambda (ReceberFeedback) → RDS PostgreSQL
                                    ↓
                                  SQS Queue
                                    ↓
                         Lambda (EnviarNotificacao) → SNS → Email
                                    
EventBridge Schedule → Lambda (GerarRelatorio) → RDS → SNS → Email
```

## Próximos Passos

1. Configurar CI/CD com GitHub Actions ou AWS CodePipeline
2. Implementar testes de integração
3. Adicionar autenticação/autorização no API Gateway
4. Configurar WAF para proteção contra ataques
5. Implementar cache com ElastiCache/Redis
6. Adicionar observabilidade com AWS X-Ray

