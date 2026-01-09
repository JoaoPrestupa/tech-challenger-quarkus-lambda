# 🧪 Guia de Testes - Persistência JPA

## ✅ Checklist Pré-Deploy

Antes de fazer o deploy da Lambda, verifique:

### 1. Configurações do RDS
- [ ] RDS PostgreSQL está rodando
- [ ] Security Group permite conexão na porta 5432
- [ ] Lambda e RDS estão na mesma VPC (ou VPC Peering configurado)

### 2. Variáveis de Ambiente na Lambda
Certifique-se de que estas variáveis estão configuradas:
```
DB_HOST=feedback-system-db-fiap.cxck8ugaaz2t.us-east-2.rds.amazonaws.com
DB_NAME=feedback-system-db-fiap
DB_USERNAME=postgres
DB_PASSWORD=Frederico
DB_PORT=5432
```

### 3. Permissões IAM
A Lambda precisa de:
- Acesso à VPC (se RDS está em VPC privada)
- CloudWatch Logs para debug

## 🔧 Compilar e Empacotar

```bash
# Limpar e compilar
mvn clean package -DskipTests

# O JAR será gerado em:
# target/feedback-system-1.0.0-SNAPSHOT-runner.jar
```

## 🚀 Deploy para AWS

### Opção 1: AWS Console
1. Acesse AWS Lambda Console
2. Selecione a função `receberFeedback`
3. Faça upload do JAR: `target/feedback-system-1.0.0-SNAPSHOT-runner.jar`
4. Configure o Handler: `io.quarkus.amazon.lambda.runtime.QuarkusStreamHandler::handleRequest`
5. Configure as variáveis de ambiente (listadas acima)
6. Configure VPC (mesma do RDS)
7. Aumente o timeout para 30 segundos (primeira execução pode demorar)
8. Aumente memória para 512MB (recomendado)

### Opção 2: AWS SAM/CLI
```bash
sam deploy --guided
```

## 🧪 Testes

### Teste 1: Criar Avaliação Positiva (nota 5)
```json
{
  "restaurante": "Restaurante Teste",
  "nota": 5,
  "comentario": "Excelente comida e atendimento!",
  "emailCliente": "cliente@email.com"
}
```

**Resultado Esperado:**
```json
{
  "statusCode": 200,
  "body": {
    "id": 1,
    "restaurante": "Restaurante Teste",
    "nota": 5,
    "comentario": "Excelente comida e atendimento!",
    "dataAvaliacao": "2026-01-09T14:30:00",
    "emailCliente": "cliente@email.com"
  }
}
```

### Teste 2: Criar Avaliação Urgente (nota 2)
```json
{
  "restaurante": "Restaurante Problema",
  "nota": 2,
  "comentario": "Atendimento demorado",
  "emailCliente": "cliente2@email.com"
}
```

**Resultado Esperado:**
- Status 200
- Log: "Avaliação urgente detectada (nota 2)"
- Dados persistidos no banco

### Teste 3: Validação - Restaurante Vazio
```json
{
  "restaurante": "",
  "nota": 5,
  "comentario": "Teste"
}
```

**Resultado Esperado:**
```json
{
  "statusCode": 400,
  "body": {
    "error": "Erro de validação",
    "message": "Nome do restaurante é obrigatório"
  }
}
```

### Teste 4: Validação - Nota Inválida
```json
{
  "restaurante": "Teste",
  "nota": 6,
  "comentario": "Teste"
}
```

**Resultado Esperado:**
```json
{
  "statusCode": 400,
  "body": {
    "error": "Erro de validação",
    "message": "Nota deve estar entre 1 e 5"
  }
}
```

## 🔍 Verificar Dados no Banco

### Conectar ao RDS
```bash
psql -h feedback-system-db-fiap.cxck8ugaaz2t.us-east-2.rds.amazonaws.com \
     -p 5432 \
     -U postgres \
     -d feedback-system-db-fiap
```

### Consultas SQL Úteis

```sql
-- Ver todas as avaliações
SELECT * FROM avaliacoes ORDER BY data_avaliacao DESC;

-- Ver apenas avaliações urgentes
SELECT * FROM avaliacoes WHERE nota <= 2 ORDER BY data_avaliacao DESC;

-- Média de avaliações por restaurante
SELECT restaurante, AVG(nota) as media, COUNT(*) as total 
FROM avaliacoes 
GROUP BY restaurante;

-- Contar avaliações por nota
SELECT nota, COUNT(*) as quantidade 
FROM avaliacoes 
GROUP BY nota 
ORDER BY nota;

-- Últimas 10 avaliações
SELECT id, restaurante, nota, comentario, data_avaliacao 
FROM avaliacoes 
ORDER BY data_avaliacao DESC 
LIMIT 10;
```

## 📊 Monitoramento

### CloudWatch Logs
Verifique os logs em CloudWatch para debug:

```
Logs esperados:
- "Avaliação persistida com ID: X"
- "Avaliação urgente detectada (nota Y)" (se nota <= 2)
- Logs SQL do Hibernate (se quarkus.hibernate-orm.log.sql=true)
```

### Métricas Importantes
- **Duration**: Tempo de execução (primeira execução ~5s, demais ~500ms)
- **Memory Used**: Memória consumida (~200-300MB)
- **Errors**: Deve estar em 0

## 🐛 Troubleshooting

### Erro: "Could not acquire connection"
**Causa**: Lambda não consegue conectar ao RDS  
**Solução**:
1. Verificar se Lambda está na mesma VPC do RDS
2. Verificar Security Group do RDS (permite porta 5432)
3. Verificar variáveis de ambiente (DB_HOST, DB_PORT, etc)

### Erro: "Table 'avaliacoes' doesn't exist"
**Causa**: Tabela não foi criada automaticamente  
**Solução**:
1. Verificar `quarkus.hibernate-orm.database.generation=update`
2. Executar script SQL manualmente (V1__create_avaliacoes_table.sql)

### Erro: "NullPointerException"
**Causa**: Repositório não foi injetado  
**Solução**:
1. Verificar anotação `@Named("receberFeedback")` na classe
2. Verificar anotação `@Inject` no repositório
3. Recompilar o projeto

### Timeout na Lambda
**Causa**: Primeira execução demora mais (cold start + conexão DB)  
**Solução**:
1. Aumentar timeout para 30 segundos
2. Aumentar memória para 512MB
3. Considerar usar Provisioned Concurrency (para produção)

## 📈 Performance

### Primeira Execução (Cold Start)
- **Duração**: ~5-10 segundos
- **Memória**: ~300MB
- **Causa**: Inicialização do Quarkus + Pool de conexões

### Execuções Subsequentes (Warm)
- **Duração**: ~300-500ms
- **Memória**: ~200-250MB
- **Conexões**: Reutilizadas do pool

### Otimizações
1. **Usar Native Image** (GraalVM):
   - Reduz cold start para ~300ms
   - Reduz memória para ~100MB
   - Requer compilação nativa

2. **Connection Pooling** (já configurado):
   ```properties
   quarkus.datasource.jdbc.max-size=5
   quarkus.datasource.jdbc.min-size=1
   ```

3. **Provisioned Concurrency**:
   - Mantém instâncias "quentes"
   - Elimina cold starts
   - Custo adicional

## ✅ Checklist Final

Antes de considerar a implementação completa:

- [ ] Lambda compila sem erros
- [ ] Teste 1 (avaliação positiva) passa
- [ ] Teste 2 (avaliação urgente) passa
- [ ] Teste 3 (validação) passa
- [ ] Dados aparecem no banco
- [ ] Logs estão visíveis no CloudWatch
- [ ] Sem erros de conexão
- [ ] Performance aceitável (<2s)

## 🎯 Próximos Passos

Após confirmar que a persistência funciona:

1. **Integrar com SQS** para avaliações urgentes
2. **Criar Lambda de processamento** de avaliações
3. **Implementar envio de notificações** (SNS/SES)
4. **Adicionar testes unitários**
5. **Criar API Gateway** para exposição HTTP

---

**Dúvidas?** Consulte o arquivo `PERSISTENCIA-JPA.md` para mais detalhes.

