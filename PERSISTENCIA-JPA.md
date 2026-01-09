# Persistência de Dados com JPA no Lambda

## 📋 Resumo

Este projeto utiliza **JPA (Java Persistence API)** com **Hibernate Panache** para persistir avaliações de restaurantes no **Amazon RDS PostgreSQL**.

## 🏗️ Arquitetura da Persistência

```
ReceberFeedbackHandler (Lambda)
    ↓ @Inject
AvaliacaoRepository (Panache)
    ↓ JPA/Hibernate
PostgreSQL (RDS)
```

## 📁 Estrutura de Arquivos

### 1. **Entidade JPA** - `Avaliacao.java`
```java
@Entity
@Table(name = "avaliacoes")
public class Avaliacao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String restaurante;
    private Integer nota;
    private String comentario;
    private String emailCliente;
    private LocalDateTime dataAvaliacao;
    private Boolean processada;
}
```

### 2. **Repositório Panache** - `AvaliacaoRepository.java`
```java
@ApplicationScoped
public class AvaliacaoRepository implements PanacheRepository<Avaliacao> {
    // Métodos customizados já disponíveis
}
```

### 3. **Handler Lambda** - `ReceberFeedbackHandler.java`
```java
@Named("receberFeedback")
public class ReceberFeedbackHandler implements RequestHandler {
    @Inject
    AvaliacaoRepository avaliacaoRepository;
    
    @Transactional
    public Map<String, Object> handleRequest(...) {
        avaliacaoRepository.persist(avaliacao);
    }
}
```

## ⚙️ Configuração

### Variáveis de Ambiente da Lambda (já configuradas)
```
DB_HOST=feedback-system-db-fiap.cxck8ugaaz2t.us-east-2.rds.amazonaws.com
DB_NAME=feedback-system-db-fiap
DB_USERNAME=postgres
DB_PASSWORD=Frederico
DB_PORT=5432
```

### Application Properties
```properties
quarkus.datasource.db-kind=postgresql
quarkus.datasource.jdbc.url=jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}
quarkus.datasource.username=${DB_USERNAME}
quarkus.datasource.password=${DB_PASSWORD}
quarkus.hibernate-orm.database.generation=update
quarkus.hibernate-orm.log.sql=true
```

## 🚀 Como Funciona

### 1. **Criação Automática de Tabelas**
O Hibernate cria automaticamente a tabela `avaliacoes` no primeiro deploy com:
- `quarkus.hibernate-orm.database.generation=update`

### 2. **Persistência Transacional**
```java
@Transactional
public Map<String, Object> handleRequest(Map<String, Object> input, Context context) {
    // 1. Parse do JSON
    AvaliacaoRequest request = gson.fromJson(body, AvaliacaoRequest.class);
    
    // 2. Criar entidade
    Avaliacao avaliacao = new Avaliacao(
        request.getRestaurante(),
        request.getNota(),
        request.getComentario(),
        request.getEmailCliente()
    );
    
    // 3. Persistir no banco (automático com @Transactional)
    avaliacaoRepository.persist(avaliacao);
    
    // 4. ID é gerado automaticamente
    return avaliacao.getId(); // Retorna ID do banco
}
```

### 3. **Métodos Disponíveis no Repositório**

#### Métodos Herdados do Panache (automáticos):
```java
// Salvar
avaliacaoRepository.persist(avaliacao);

// Buscar por ID
avaliacaoRepository.findById(1L);

// Listar todos
avaliacaoRepository.listAll();

// Deletar
avaliacaoRepository.delete(avaliacao);

// Contar
avaliacaoRepository.count();
```

#### Métodos Customizados:
```java
// Buscar por restaurante
avaliacaoRepository.findByRestaurante("Restaurante X");

// Buscar avaliações urgentes (nota <= 2)
avaliacaoRepository.findAvaliacoesUrgentes();

// Buscar por nota específica
avaliacaoRepository.findByNota(5);

// Marcar como processada
avaliacaoRepository.marcarComoProcessada(id);
```

## 📊 Estrutura da Tabela

```sql
CREATE TABLE avaliacoes (
    id              BIGSERIAL PRIMARY KEY,
    restaurante     VARCHAR(200) NOT NULL,
    nota            INTEGER NOT NULL,
    comentario      TEXT,
    email_cliente   VARCHAR(200),
    data_avaliacao  TIMESTAMP NOT NULL,
    processada      BOOLEAN DEFAULT false
);
```

## 🔄 Fluxo Completo

1. **Cliente envia feedback** → API Gateway/Lambda
2. **Lambda recebe evento** → `ReceberFeedbackHandler.handleRequest()`
3. **Parse JSON** → `AvaliacaoRequest`
4. **Validação** → `validarAvaliacao()`
5. **Criar entidade** → `new Avaliacao(...)`
6. **Persistir** → `avaliacaoRepository.persist()`
7. **Commit automático** → `@Transactional`
8. **Retornar resposta** → `AvaliacaoResponse` com ID do banco

## 🎯 Vantagens do Panache

✅ **Menos código**: Elimina necessidade de implementar métodos básicos  
✅ **Type-safe**: Usa queries type-safe ao invés de strings  
✅ **Produtividade**: Métodos prontos (persist, find, delete, etc)  
✅ **Flexível**: Permite adicionar métodos customizados facilmente  
✅ **CDI Ready**: Integração automática com injeção de dependências  

## 📝 Exemplo de Requisição

### Entrada:
```json
{
  "restaurante": "Pizza da Casa",
  "nota": 5,
  "comentario": "Excelente atendimento!",
  "emailCliente": "cliente@email.com"
}
```

### Resposta:
```json
{
  "id": 123,
  "restaurante": "Pizza da Casa",
  "nota": 5,
  "comentario": "Excelente atendimento!",
  "dataAvaliacao": "2026-01-09T14:30:00",
  "emailCliente": "cliente@email.com"
}
```

## 🔧 Troubleshooting

### Problema: Tabela não é criada
**Solução**: Verificar se `quarkus.hibernate-orm.database.generation=update` está configurado

### Problema: Erro de conexão com RDS
**Solução**: Verificar:
1. Lambda está na mesma VPC do RDS
2. Security Group permite conexão na porta 5432
3. Variáveis de ambiente estão corretas

### Problema: Transação não persiste
**Solução**: Verificar se método tem anotação `@Transactional`

## 🚀 Deploy

```bash
# Compilar o projeto
mvn clean package

# Deploy com SAM (se configurado)
sam deploy --guided
```

## 📚 Referências

- [Quarkus Hibernate ORM](https://quarkus.io/guides/hibernate-orm)
- [Quarkus Panache](https://quarkus.io/guides/hibernate-orm-panache)
- [Quarkus Lambda](https://quarkus.io/guides/amazon-lambda)

