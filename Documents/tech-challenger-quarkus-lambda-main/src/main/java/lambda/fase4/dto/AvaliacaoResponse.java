package lambda.fase4.dto;

import java.time.LocalDateTime;

public class AvaliacaoResponse {
    private Long id;
    private String restaurante;
    private Integer nota;
    private String comentario;
    private LocalDateTime dataAvaliacao;
    private String emailCliente;

    public AvaliacaoResponse() {}

    public AvaliacaoResponse(Long id, String restaurante, Integer nota, String comentario,
                           LocalDateTime dataAvaliacao, String emailCliente) {
        this.id = id;
        this.restaurante = restaurante;
        this.nota = nota;
        this.comentario = comentario;
        this.dataAvaliacao = dataAvaliacao;
        this.emailCliente = emailCliente;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getEmailCliente() {
        return emailCliente;
    }

    public void setEmailCliente(String emailCliente) {
        this.emailCliente = emailCliente;
    }
}

