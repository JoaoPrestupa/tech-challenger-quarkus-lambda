package lambda.fase4.dto;

import java.time.LocalDateTime;

public class NotificacaoUrgenciaDTO {
    private Long avaliacaoId;
    private String restaurante;
    private Integer nota;
    private String comentario;
    private LocalDateTime dataAvaliacao;

    public NotificacaoUrgenciaDTO() {}

    public NotificacaoUrgenciaDTO(Long avaliacaoId, String restaurante, Integer nota,
                                 String comentario, LocalDateTime dataAvaliacao) {
        this.avaliacaoId = avaliacaoId;
        this.restaurante = restaurante;
        this.nota = nota;
        this.comentario = comentario;
        this.dataAvaliacao = dataAvaliacao;
    }

    // Getters and Setters
    public Long getAvaliacaoId() {
        return avaliacaoId;
    }

    public void setAvaliacaoId(Long avaliacaoId) {
        this.avaliacaoId = avaliacaoId;
    }

    public String getRestaurante() {
        return restaurante;
    }

    public void setRestaurante(String restaurante) {
        this.restaurante = restaurante;
    }

    public Integer getNota() {
        return nota;
    }

    public void setNota(Integer nota) {
        this.nota = nota;
    }

    public String getComentario() {
        return comentario;
    }

    public void setComentario(String comentario) {
        this.comentario = comentario;
    }

    public LocalDateTime getDataAvaliacao() {
        return dataAvaliacao;
    }

    public void setDataAvaliacao(LocalDateTime dataAvaliacao) {
        this.dataAvaliacao = dataAvaliacao;
    }
}

