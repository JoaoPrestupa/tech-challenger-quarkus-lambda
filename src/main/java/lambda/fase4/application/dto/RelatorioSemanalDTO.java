package lambda.fase4.application.dto;

import java.util.List;
import java.util.Map;

public class RelatorioSemanalDTO {
    private String periodo;
    private Integer totalAvaliacoes;
    private Double mediaNotas;
    private Map<String, Integer> avaliacoesPorRestaurante;
    private List<String> comentariosNegativos;

    public RelatorioSemanalDTO() {}

    public RelatorioSemanalDTO(String periodo, Integer totalAvaliacoes, Double mediaNotas,
                             Map<String, Integer> avaliacoesPorRestaurante,
                             List<String> comentariosNegativos) {
        this.periodo = periodo;
        this.totalAvaliacoes = totalAvaliacoes;
        this.mediaNotas = mediaNotas;
        this.avaliacoesPorRestaurante = avaliacoesPorRestaurante;
        this.comentariosNegativos = comentariosNegativos;
    }

    // Getters and Setters
    public String getPeriodo() {
        return periodo;
    }

    public void setPeriodo(String periodo) {
        this.periodo = periodo;
    }

    public Integer getTotalAvaliacoes() {
        return totalAvaliacoes;
    }

    public void setTotalAvaliacoes(Integer totalAvaliacoes) {
        this.totalAvaliacoes = totalAvaliacoes;
    }

    public Double getMediaNotas() {
        return mediaNotas;
    }

    public void setMediaNotas(Double mediaNotas) {
        this.mediaNotas = mediaNotas;
    }

    public Map<String, Integer> getAvaliacoesPorRestaurante() {
        return avaliacoesPorRestaurante;
    }

    public void setAvaliacoesPorRestaurante(Map<String, Integer> avaliacoesPorRestaurante) {
        this.avaliacoesPorRestaurante = avaliacoesPorRestaurante;
    }

    public List<String> getComentariosNegativos() {
        return comentariosNegativos;
    }

    public void setComentariosNegativos(List<String> comentariosNegativos) {
        this.comentariosNegativos = comentariosNegativos;
    }
}

