package lambda.fase4.repository;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import lambda.fase4.model.Avaliacao;

import java.time.LocalDateTime;
import java.util.List;


@ApplicationScoped
public class AvaliacaoRepository implements PanacheRepository<Avaliacao> {


    public List<Avaliacao> findByRestaurante(String restaurante) {
        return list("restaurante", restaurante);}


    public List<Avaliacao> findAvaliacoesUrgentes() {
        return list("nota <= ?1", 2);}


    public List<Avaliacao> findByNota(Integer nota) {
        return list("nota", nota);}



    public List<Avaliacao> findByPeriodo(LocalDateTime inicio, LocalDateTime fim) {
        return list("dataAvaliacao >= ?1 and dataAvaliacao <= ?2", inicio, fim);}



    public void marcarComoProcessada(Long id) {
        update("processada = true where id = ?1", id);}
}