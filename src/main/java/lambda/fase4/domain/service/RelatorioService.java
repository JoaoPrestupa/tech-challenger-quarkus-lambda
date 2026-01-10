package lambda.fase4.domain.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import lambda.fase4.application.dto.RelatorioSemanalDTO;
import lambda.fase4.domain.model.Avaliacao;
import lambda.fase4.domain.repository.AvaliacaoRepository;
import org.jboss.logging.Logger;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@ApplicationScoped
public class RelatorioService {

    private static final Logger LOG = Logger.getLogger(RelatorioService.class);

    @Inject
    AvaliacaoRepository avaliacaoRepository;

    public RelatorioSemanalDTO gerarRelatorioSemanal() {
        LocalDateTime fim = LocalDateTime.now();
        LocalDateTime inicio = fim.minusDays(7);

        LOG.infof("Gerando relatório semanal de %s até %s", inicio, fim);

        List<Avaliacao> avaliacoes = avaliacaoRepository.findByPeriodo(inicio, fim);

        if (avaliacoes.isEmpty()) {
            LOG.info("Nenhuma avaliação encontrada no período");
            return criarRelatorioVazio(inicio, fim);
        }

        // Total de avaliações
        int totalAvaliacoes = avaliacoes.size();

        // Média de notas
        double mediaNotas = avaliacoes.stream()
            .mapToInt(Avaliacao::getNota)
            .average()
            .orElse(0.0);

        // Avaliações por restaurante
        Map<String, Integer> avaliacoesPorRestaurante = avaliacoes.stream()
            .collect(Collectors.groupingBy(
                Avaliacao::getRestaurante,
                Collectors.collectingAndThen(Collectors.counting(), Long::intValue)
            ));

        // Comentários negativos (nota <= 2)
        List<String> comentariosNegativos = avaliacoes.stream()
            .filter(a -> a.getNota() <= 2 && a.getComentario() != null)
            .map(a -> String.format("[%s - Nota %d] %s",
                a.getRestaurante(), a.getNota(), a.getComentario()))
            .collect(Collectors.toList());

        String periodo = formatarPeriodo(inicio, fim);

        LOG.infof("Relatório gerado: %d avaliações, média %.2f", totalAvaliacoes, mediaNotas);

        return new RelatorioSemanalDTO(
            periodo,
            totalAvaliacoes,
            Math.round(mediaNotas * 100.0) / 100.0,
            avaliacoesPorRestaurante,
            comentariosNegativos
        );
    }

    private RelatorioSemanalDTO criarRelatorioVazio(LocalDateTime inicio, LocalDateTime fim) {
        return new RelatorioSemanalDTO(
            formatarPeriodo(inicio, fim),
            0,
            0.0,
            new HashMap<>(),
            List.of()
        );
    }

    private String formatarPeriodo(LocalDateTime inicio, LocalDateTime fim) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        return String.format("%s a %s",
            inicio.format(formatter),
            fim.format(formatter));
    }
}

