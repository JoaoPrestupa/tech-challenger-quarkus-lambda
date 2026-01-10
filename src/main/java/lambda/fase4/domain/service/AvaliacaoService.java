package lambda.fase4.domain.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import lambda.fase4.application.dto.AvaliacaoRequest;
import lambda.fase4.application.dto.AvaliacaoResponse;
import lambda.fase4.domain.model.Avaliacao;
import lambda.fase4.domain.repository.AvaliacaoRepository;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class AvaliacaoService {

    private static final Logger LOG = Logger.getLogger(AvaliacaoService.class);

    @Inject
    AvaliacaoRepository avaliacaoRepository;

    @Inject
    NotificacaoService notificacaoService;

    @Inject
    CloudWatchMetricsService metricsService;

    @Transactional
    public AvaliacaoResponse salvarAvaliacao(AvaliacaoRequest request) {
        LOG.infof("Salvando avaliação para restaurante: %s", request.getRestaurante());

        // Validação
        validarAvaliacao(request);

        // Criar e salvar entidade
        Avaliacao avaliacao = new Avaliacao(
            request.getRestaurante(),
            request.getNota(),
            request.getComentario(),
            request.getEmailCliente()
        );

        avaliacaoRepository.persist(avaliacao);

        // Enviar métrica para CloudWatch
        metricsService.registrarAvaliacao(request.getRestaurante(), request.getNota());

        // Se for urgente, enviar para fila SQS
        if (avaliacao.isUrgente()) {
            LOG.infof("Avaliação urgente detectada (nota %d), enviando para SQS", avaliacao.getNota());
            notificacaoService.enviarNotificacaoUrgencia(avaliacao);
        }

        return converterParaResponse(avaliacao);
    }

    public List<AvaliacaoResponse> listarTodas() {
        return avaliacaoRepository.listAll().stream()
            .map(this::converterParaResponse)
            .collect(Collectors.toList());
    }

    public AvaliacaoResponse buscarPorId(Long id) {
        Avaliacao avaliacao = avaliacaoRepository.findById(id);
        if (avaliacao == null) {
            throw new IllegalArgumentException("Avaliação não encontrada: " + id);
        }
        return converterParaResponse(avaliacao);
    }

    public List<AvaliacaoResponse> buscarPorRestaurante(String restaurante) {
        return avaliacaoRepository.findByRestaurante(restaurante).stream()
            .map(this::converterParaResponse)
            .collect(Collectors.toList());
    }

    private void validarAvaliacao(AvaliacaoRequest request) {
        if (request.getRestaurante() == null || request.getRestaurante().trim().isEmpty()) {
            throw new IllegalArgumentException("Nome do restaurante é obrigatório");
        }
        if (request.getNota() == null || request.getNota() < 1 || request.getNota() > 5) {
            throw new IllegalArgumentException("Nota deve estar entre 1 e 5");
        }
    }

    private AvaliacaoResponse converterParaResponse(Avaliacao avaliacao) {
        return new AvaliacaoResponse(
            avaliacao.getId(),
            avaliacao.getRestaurante(),
            avaliacao.getNota(),
            avaliacao.getComentario(),
            avaliacao.getDataAvaliacao(),
            avaliacao.getEmailCliente()
        );
    }
}

