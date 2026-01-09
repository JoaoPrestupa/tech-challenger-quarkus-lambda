package lambda.fase4.repository;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import lambda.fase4.model.Avaliacao;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repositório Panache para operações de banco de dados com Avaliações
 * Panache simplifica o uso de JPA eliminando muito código boilerplate
 */
@ApplicationScoped
public class AvaliacaoRepository implements PanacheRepository<Avaliacao> {

    /**
     * Busca avaliações por restaurante
     */
    public List<Avaliacao> findByRestaurante(String restaurante) {
        return list("restaurante", restaurante);
    }

    /**
     * Busca avaliações urgentes (nota baixa) não processadas
     */
    public List<Avaliacao> findAvaliacoesUrgentes() {
        return list("nota <= ?1", 2);
    }

    /**
     * Busca avaliações por nota
     */
    public List<Avaliacao> findByNota(Integer nota) {
        return list("nota", nota);
    }

    /**
     * Busca avaliações por período
     */
    public List<Avaliacao> findByPeriodo(LocalDateTime inicio, LocalDateTime fim) {
        return list("dataAvaliacao >= ?1 and dataAvaliacao <= ?2", inicio, fim);
    }

    /**
     * Marca uma avaliação como processada
     */
    public void marcarComoProcessada(Long id) {
        update("processada = true where id = ?1", id);
    }
}

