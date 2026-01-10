package lambda.fase4.domain.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;
import software.amazon.awssdk.services.cloudwatch.CloudWatchClient;
import software.amazon.awssdk.services.cloudwatch.model.Dimension;
import software.amazon.awssdk.services.cloudwatch.model.MetricDatum;
import software.amazon.awssdk.services.cloudwatch.model.PutMetricDataRequest;
import software.amazon.awssdk.services.cloudwatch.model.StandardUnit;

import java.time.Instant;

@ApplicationScoped
public class CloudWatchMetricsService {

    private static final Logger LOG = Logger.getLogger(CloudWatchMetricsService.class);
    private static final String NAMESPACE = "FeedbackSystem";

    @Inject
    CloudWatchClient cloudWatchClient;

    public void registrarAvaliacao(String restaurante, Integer nota) {
        try {
            Dimension restauranteDimension = Dimension.builder()
                .name("Restaurante")
                .value(restaurante)
                .build();

            MetricDatum metricDatum = MetricDatum.builder()
                .metricName("AvaliacoesRecebidas")
                .value(1.0)
                .unit(StandardUnit.COUNT)
                .timestamp(Instant.now())
                .dimensions(restauranteDimension)
                .build();

            PutMetricDataRequest request = PutMetricDataRequest.builder()
                .namespace(NAMESPACE)
                .metricData(metricDatum)
                .build();

            cloudWatchClient.putMetricData(request);

            // Também registrar a nota
            registrarNota(restaurante, nota);

            LOG.infof("Métrica registrada no CloudWatch: %s", restaurante);

        } catch (Exception e) {
            LOG.errorf(e, "Erro ao registrar métrica no CloudWatch");
        }
    }

    private void registrarNota(String restaurante, Integer nota) {
        try {
            Dimension restauranteDimension = Dimension.builder()
                .name("Restaurante")
                .value(restaurante)
                .build();

            MetricDatum metricDatum = MetricDatum.builder()
                .metricName("NotaAvaliacao")
                .value(nota.doubleValue())
                .unit(StandardUnit.NONE)
                .timestamp(Instant.now())
                .dimensions(restauranteDimension)
                .build();

            PutMetricDataRequest request = PutMetricDataRequest.builder()
                .namespace(NAMESPACE)
                .metricData(metricDatum)
                .build();

            cloudWatchClient.putMetricData(request);

        } catch (Exception e) {
            LOG.errorf(e, "Erro ao registrar nota no CloudWatch");
        }
    }
}

