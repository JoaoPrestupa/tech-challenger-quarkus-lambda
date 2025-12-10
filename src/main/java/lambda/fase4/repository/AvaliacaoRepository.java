package lambda.fase4.repository;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import lambda.fase4.model.Avaliacao;

import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class AvaliacaoRepository implements PanacheRepository<Avaliacao> {

    public List<Avaliacao> findByRestaurante(String restaurante) {
        return list("restaurante", restaurante);
    }

    public List<Avaliacao> findByNota(Integer nota) {
        return list("nota", nota);
    }

    public List<Avaliacao> findAvaliacoesUrgentes() {
        return list("nota <= ?1", 2);
    }

    public List<Avaliacao> findByPeriodo(LocalDateTime inicio, LocalDateTime fim) {
        return list("dataAvaliacao between ?1 and ?2", inicio, fim);
    }

    public Double getMediaNotas(LocalDateTime inicio, LocalDateTime fim) {
        return find("SELECT AVG(a.nota) FROM Avaliacao a WHERE a.dataAvaliacao BETWEEN ?1 AND ?2",
                   inicio, fim)
               .project(Double.class)
               .firstResult();
    }

    public Long countByRestaurante(String restaurante, LocalDateTime inicio, LocalDateTime fim) {
        return count("restaurante = ?1 and dataAvaliacao between ?2 and ?3",
                    restaurante, inicio, fim);
    }
}

