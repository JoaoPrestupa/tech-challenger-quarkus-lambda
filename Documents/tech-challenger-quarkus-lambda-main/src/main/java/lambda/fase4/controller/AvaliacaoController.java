package lambda.fase4.controller;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lambda.fase4.dto.AvaliacaoRequest;
import lambda.fase4.dto.AvaliacaoResponse;
import lambda.fase4.service.AvaliacaoService;
import org.jboss.logging.Logger;

import java.util.List;

/**
 * Controller REST para testes locais
 * Em produção, as Lambdas serão invocadas diretamente via API Gateway
 */
@Path("/api/avaliacoes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AvaliacaoController {

    private static final Logger LOG = Logger.getLogger(AvaliacaoController.class);

    @Inject
    AvaliacaoService avaliacaoService;

    @POST
    public Response criar(AvaliacaoRequest request) {
        try {
            LOG.infof("Recebendo nova avaliação: %s", request.getRestaurante());
            AvaliacaoResponse response = avaliacaoService.salvarAvaliacao(request);
            return Response.status(Response.Status.CREATED).entity(response).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(new ErrorResponse(e.getMessage()))
                .build();
        } catch (Exception e) {
            LOG.errorf(e, "Erro ao criar avaliação");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new ErrorResponse("Erro interno do servidor"))
                .build();
        }
    }

    @GET
    public Response listarTodas() {
        List<AvaliacaoResponse> avaliacoes = avaliacaoService.listarTodas();
        return Response.ok(avaliacoes).build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") Long id) {
        try {
            AvaliacaoResponse response = avaliacaoService.buscarPorId(id);
            return Response.ok(response).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(new ErrorResponse(e.getMessage()))
                .build();
        }
    }

    @GET
    @Path("/restaurante/{nome}")
    public Response buscarPorRestaurante(@PathParam("nome") String nome) {
        List<AvaliacaoResponse> avaliacoes = avaliacaoService.buscarPorRestaurante(nome);
        return Response.ok(avaliacoes).build();
    }

    // Classe interna para resposta de erro
    public static class ErrorResponse {
        private String error;

        public ErrorResponse(String error) {
            this.error = error;
        }

        public String getError() {
            return error;
        }

        public void setError(String error) {
            this.error = error;
        }
    }
}

