package lambda.fase4.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "avaliacoes")
public class Avaliacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String restaurante;

    @Column(nullable = false)
    private Integer nota; // 1 a 5

    @Column(length = 1000)
    private String comentario;

    @Column(name = "data_avaliacao", nullable = false)
    private LocalDateTime dataAvaliacao;

    @Column(name = "email_cliente")
    private String emailCliente;

    @Column(name = "processada")
    private Boolean processada = false;

    public Avaliacao() {
        this.dataAvaliacao = LocalDateTime.now();
        this.processada = false;
    }

    public Avaliacao(String restaurante, Integer nota, String comentario, String emailCliente) {
        this.restaurante = restaurante;
        this.nota = nota;
        this.comentario = comentario;
        this.emailCliente = emailCliente;
        this.dataAvaliacao = LocalDateTime.now();
        this.processada = false;
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

    public Boolean getProcessada() {
        return processada;
    }

    public void setProcessada(Boolean processada) {
        this.processada = processada;
    }

    public boolean isUrgente() {
        return nota != null && nota <= 2;
    }

    @PrePersist
    public void prePersist() {
        if (this.dataAvaliacao == null) {
            this.dataAvaliacao = LocalDateTime.now();
        }
        if (this.processada == null) {
            this.processada = false;
        }
    }
}

