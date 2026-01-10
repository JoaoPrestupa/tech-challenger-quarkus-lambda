package lambda.fase4.application.dto;

public class AvaliacaoRequest {
    private String restaurante;
    private Integer nota;
    private String comentario;
    private String emailCliente;

    public AvaliacaoRequest() {}

    public AvaliacaoRequest(String restaurante, Integer nota, String comentario, String emailCliente) {
        this.restaurante = restaurante;
        this.nota = nota;
        this.comentario = comentario;
        this.emailCliente = emailCliente;
    }

    // Getters and Setters
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

    public String getEmailCliente() {
        return emailCliente;
    }

    public void setEmailCliente(String emailCliente) {
        this.emailCliente = emailCliente;
    }
}

