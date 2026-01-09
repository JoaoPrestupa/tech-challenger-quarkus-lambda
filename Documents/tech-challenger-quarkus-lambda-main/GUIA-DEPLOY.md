# 🚀 GUIA DE DEPLOY - Lambda AWS

## ✅ Como o Quarkus gera o pacote:

O Quarkus **NÃO gera um uber-jar único**, mas sim:
- ✅ Um JAR principal (`feedback-system-1.0.0-SNAPSHOT-runner.jar`)
- ✅ Uma pasta `lib/` com **todas as 200+ dependências**
- ✅ Um arquivo **`function.zip`** que empacota tudo junto

⚠️ **IMPORTANTE**: Você deve enviar o `function.zip` para a Lambda, NÃO apenas o JAR!

## 📦 DEPLOY CORRETO (passo a passo):

### Passo 1: Compilar o projeto

```powershell
cd C:\Users\joao\Downloads\code-with-quarkus\code-with-quarkus
.\mvnw.cmd clean package -DskipTests
```

Isso gera em `target/`:
- ✅ `function.zip` (~45MB) ← **USE ESTE!**
- `feedback-system-1.0.0-SNAPSHOT-runner.jar` (JAR principal)
- `lib/` (pasta com todas as dependências)

### Passo 2: Enviar para S3

```powershell
aws s3 cp target\function.zip s3://feedback-lambda-deploy-temp/function.zip --region us-east-2
```

### Passo 3: Atualizar função Lambda

```powershell
aws lambda update-function-code `
  --function-name feedback-system-gerar-relatorio `
  --s3-bucket feedback-lambda-deploy-temp `
  --s3-key function.zip `
  --region us-east-2
```

### Passo 4: Configurar Handler na Lambda

No console AWS Lambda:

1. Vá em **Runtime settings** → **Edit**
2. Handler: `lambda.fase4.lambda.GerarRelatorioHandler::handleRequest`
3. Clique em **Save**

### Passo 5: Configurar variáveis de ambiente

Em **Configuration** → **Environment variables**, adicione:

```
DB_HOST=feedback-system-db-fiap.cxck8ugaa2t.us-east-2.rds.amazonaws.com
DB_PORT=5432
DB_NAME=feedback-system-db-fiap
DB_USERNAME=postgres
DB_PASSWORD=Frederico
SES_FROM_EMAIL=noreply@feedback-system.com
SES_TO_EMAIL=admin@feedback-system.com
AWS_REGION=us-east-2
```

### Passo 6: Testar a função

Use este JSON de teste:

```json
{
  "id": "test-123",
  "detail-type": "Scheduled Event",
  "source": "aws.events",
  "time": "2026-01-08T00:00:00Z",
  "region": "us-east-2",
  "detail": {}
}
```

## ⚠️ Por que dava erro antes?

- ❌ **Você estava enviando apenas o JAR** → Lambda não encontrava as dependências na pasta `lib/`
- ❌ Erro: `ClassNotFoundException: org.jboss.logging.Logger`
- ✅ **Solução**: Enviar o `function.zip` que contém JAR + `lib/` com todas as dependências

## 🔍 Verificar o conteúdo do function.zip

```powershell
# Ver o que tem dentro do ZIP
Expand-Archive target\function.zip -DestinationPath temp -Force
ls temp
```

Você verá:
```
feedback-system-1.0.0-SNAPSHOT-runner.jar
lib/ (pasta com 200+ arquivos .jar incluindo jboss-logging-3.6.1.Final.jar)
```

## 🎯 Próximos passos:

Para as outras funções Lambda, repita os Passos 2-6 mudando apenas o `--function-name`:

1. **ReceberFeedbackHandler**:
   ```powershell
   aws lambda update-function-code --function-name feedback-system-receber-feedback --s3-bucket feedback-lambda-deploy-temp --s3-key function.zip --region us-east-2
   ```
   Handler: `lambda.fase4.lambda.ReceberFeedbackHandler::handleRequest`

2. **EnviarNotificacaoHandler**:
   ```powershell
   aws lambda update-function-code --function-name feedback-system-enviar-notificacao --s3-bucket feedback-lambda-deploy-temp --s3-key function.zip --region us-east-2
   ```
   Handler: `lambda.fase4.lambda.EnviarNotificacaoHandler::handleRequest`

## ✅ Checklist final:

- [ ] Compilou com `.\mvnw.cmd clean package -DskipTests`
- [ ] Verificou que `target/function.zip` foi gerado (~45MB)
- [ ] Enviou o `function.zip` para S3 (NÃO o JAR!)
- [ ] Atualizou a função Lambda apontando para o ZIP no S3
- [ ] Configurou o Handler correto
- [ ] Configurou as variáveis de ambiente
- [ ] Testou a função e funcionou! 🎉


