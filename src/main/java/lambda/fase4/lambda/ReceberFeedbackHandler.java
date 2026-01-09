package lambda.fase4.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import lambda.fase4.dto.AvaliacaoRequest;
import lambda.fase4.dto.AvaliacaoResponse;
import lambda.fase4.config.LocalDateTimeAdapter;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Lambda Function 1: Receber e processar feedback de clientes
 * Usa JDBC puro - simples e eficaz para Lambda
 */
public class ReceberFeedbackHandler implements RequestHandler<Map<String, Object>, Map<String, Object>> {

    private final Gson gson;

    public ReceberFeedbackHandler() {
        this.gson = new GsonBuilder()
            .registerTypeAdapter(LocalDateTime.class, new LocalDateTimeAdapter())
            .create();
    }

    @Override
    public Map<String, Object> handleRequest(Map<String, Object> input, Context context) {
        Map<String, Object> response = new HashMap<>();
        Connection conn = null;
        PreparedStatement pstmt = null;

        try {
            // Parse do body
            String body = input.get("body") != null ?
                input.get("body").toString() : gson.toJson(input);

            AvaliacaoRequest request = gson.fromJson(body, AvaliacaoRequest.class);

            // Validar request
            validarAvaliacao(request);

            // Criar conexão com banco
            conn = getConnection();

            // Criar tabela se não existir
            createTableIfNotExists(conn);

            // Inserir avaliação
            String sql = "INSERT INTO avaliacoes (restaurante, nota, comentario, email_cliente, data_avaliacao, processada) " +
                        "VALUES (?, ?, ?, ?, ?, ?) RETURNING id, data_avaliacao";

            pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, request.getRestaurante());
            pstmt.setInt(2, request.getNota());
            pstmt.setString(3, request.getComentario());
            pstmt.setString(4, request.getEmailCliente());
            pstmt.setTimestamp(5, Timestamp.valueOf(LocalDateTime.now()));
            pstmt.setBoolean(6, false);

            ResultSet rs = pstmt.executeQuery();

            Long id = null;
            LocalDateTime dataAvaliacao = null;
            if (rs.next()) {
                id = rs.getLong("id");
                dataAvaliacao = rs.getTimestamp("data_avaliacao").toLocalDateTime();
            }

            context.getLogger().log("Avaliação persistida com ID: " + id);

            // Criar response
            AvaliacaoResponse avaliacaoResponse = new AvaliacaoResponse(
                id,
                request.getRestaurante(),
                request.getNota(),
                request.getComentario(),
                dataAvaliacao,
                request.getEmailCliente()
            );

            response.put("statusCode", 200);
            response.put("body", gson.toJson(avaliacaoResponse));
            response.put("headers", Map.of(
                "Content-Type", "application/json",
                "Access-Control-Allow-Origin", "*"
            ));

            // Se for urgente
            if (request.getNota() != null && request.getNota() <= 2) {
                context.getLogger().log("Avaliação urgente detectada (nota " + request.getNota() + ")");
            }

        } catch (IllegalArgumentException e) {
            response.put("statusCode", 400);
            response.put("body", gson.toJson(Map.of(
                "error", "Erro de validação",
                "message", e.getMessage()
            )));
        } catch (Exception e) {
            context.getLogger().log("Erro ao processar avaliação: " + e.getMessage());
            e.printStackTrace();
            response.put("statusCode", 500);
            response.put("body", gson.toJson(Map.of(
                "error", "Erro interno do servidor",
                "message", e.getMessage()
            )));
        } finally {
            try {
                if (pstmt != null) pstmt.close();
                if (conn != null) conn.close();
            } catch (SQLException e) {
                context.getLogger().log("Erro ao fechar conexão: " + e.getMessage());
            }
        }

        return response;
    }

    private Connection getConnection() throws SQLException {
        String dbHost = System.getenv("DB_HOST");
        String dbPort = System.getenv("DB_PORT");
        String dbName = System.getenv("DB_NAME");
        String dbUser = System.getenv("DB_USERNAME");
        String dbPassword = System.getenv("DB_PASSWORD");

        String url = String.format("jdbc:postgresql://%s:%s/%s", dbHost, dbPort, dbName);

        return DriverManager.getConnection(url, dbUser, dbPassword);
    }

    private void createTableIfNotExists(Connection conn) throws SQLException {
        String sql = "CREATE TABLE IF NOT EXISTS avaliacoes (" +
                    "id BIGSERIAL PRIMARY KEY, " +
                    "restaurante VARCHAR(200) NOT NULL, " +
                    "nota INTEGER NOT NULL, " +
                    "comentario TEXT, " +
                    "email_cliente VARCHAR(200), " +
                    "data_avaliacao TIMESTAMP NOT NULL, " +
                    "processada BOOLEAN DEFAULT false)";

        try (Statement stmt = conn.createStatement()) {
            stmt.execute(sql);
        }
    }

    private void validarAvaliacao(AvaliacaoRequest request) {
        if (request.getRestaurante() == null || request.getRestaurante().trim().isEmpty()) {
            throw new IllegalArgumentException("Nome do restaurante é obrigatório");
        }
        if (request.getNota() == null || request.getNota() < 1 || request.getNota() > 5) {
            throw new IllegalArgumentException("Nota deve estar entre 1 e 5");
        }
    }
}

