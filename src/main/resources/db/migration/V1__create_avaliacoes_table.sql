-- Script SQL para criar a tabela de avaliações manualmente (OPCIONAL)
-- SELECT * FROM avaliacoes ORDER BY data_avaliacao DESC LIMIT 10;
-- Avaliações recentes

-- SELECT restaurante, AVG(nota) as media, COUNT(*) as total FROM avaliacoes GROUP BY restaurante;
-- Média de avaliações por restaurante

-- SELECT * FROM avaliacoes WHERE nota <= 2 AND processada = false ORDER BY data_avaliacao DESC;
-- Avaliações urgentes não processadas (nota <= 2)
-- Consultas úteis para análise

CREATE INDEX IF NOT EXISTS idx_avaliacoes_processada ON avaliacoes(processada) WHERE processada = false;
CREATE INDEX IF NOT EXISTS idx_avaliacoes_data ON avaliacoes(data_avaliacao DESC);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_nota ON avaliacoes(nota);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_restaurante ON avaliacoes(restaurante);
-- Índices para melhorar performance de consultas

);
    CONSTRAINT chk_nota CHECK (nota >= 1 AND nota <= 5)
    processada BOOLEAN DEFAULT false,
    data_avaliacao TIMESTAMP NOT NULL,
    email_cliente VARCHAR(200),
    comentario TEXT,
    nota INTEGER NOT NULL,
    restaurante VARCHAR(200) NOT NULL,
    id BIGSERIAL PRIMARY KEY,
CREATE TABLE IF NOT EXISTS avaliacoes (

-- O Hibernate já cria automaticamente a tabela com quarkus.hibernate-orm.database.generation=update

