package br.com.nassautickets;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class TicketService {
    private static final ZoneId RECIFE = ZoneId.of("America/Recife");
    private final JdbcTemplate jdbc;
    private final TransactionTemplate transactions;
    private final boolean enforceBusinessHours;

    public TicketService(JdbcTemplate jdbc, PlatformTransactionManager transactionManager,
            @Value("${nassau.enforce-business-hours:true}") boolean enforceBusinessHours) {
        this.jdbc = jdbc;
        this.transactions = new TransactionTemplate(transactionManager);
        this.enforceBusinessHours = enforceBusinessHours;
    }

    public Map<String, Object> createTicket(String type) {
        ensureBusinessHours();
        if (!List.of("SP", "SE", "SG").contains(type)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tipo de senha inválido.");
        }
        return transactions.execute(status -> {
            LocalDate today = LocalDate.now(ZoneOffset.UTC);
            jdbc.update("INSERT INTO ticket_sequences(issue_date,type,next_sequence) VALUES(?,?,2) "
                    + "ON DUPLICATE KEY UPDATE next_sequence=next_sequence+1", today, type);
            Integer sequence = jdbc.queryForObject(
                    "SELECT next_sequence-1 FROM ticket_sequences WHERE issue_date=? AND type=? FOR UPDATE",
                    Integer.class, today, type);
            String number = today.format(DateTimeFormatter.ofPattern("yyMMdd")) + "-" + type
                    + String.format("%03d", sequence);
            String id = UUID.randomUUID().toString();
            LocalDateTime now = LocalDateTime.now(ZoneId.systemDefault());
            jdbc.update("INSERT INTO tickets(id,number,type,sequence_number,issue_date,status,issued_at) "
                    + "VALUES(?,?,?,?,?,'AGUARDANDO',?)", id, number, type, sequence, today, now);
            jdbc.update("INSERT INTO audit_events(ticket_id,action,metadata) VALUES(?,'EMISSAO',JSON_OBJECT('type',?,'number',?))",
                    id, type, number);
            return Map.of("id", id, "number", number, "type", type, "status", "AGUARDANDO", "issued_at", now);
        });
    }

    public Map<String, Object> callNext(String userId, int counter) {
        ensureBusinessHours();
        if (counter < 1 || counter > 99) throw new ApiException(HttpStatus.CONFLICT, "Guichê inválido.");
        return transactions.execute(status -> {
            List<Map<String, Object>> activeRows = jdbc.queryForList(
                    "SELECT id,number,status FROM tickets WHERE attendant_id=? "
                            + "AND status IN ('CHAMADA','CHAMADA_NOVAMENTE','EM_ATENDIMENTO') "
                            + "ORDER BY first_call_at DESC LIMIT 1 FOR UPDATE", userId);
            if (!activeRows.isEmpty()) {
                Map<String, Object> active = activeRows.get(0);
                if ("CHAMADA_NOVAMENTE".equals(active.get("status"))) {
                    jdbc.update("UPDATE tickets SET status='NAO_COMPARECEU' WHERE id=?", active.get("id"));
                    jdbc.update("INSERT INTO audit_events(ticket_id,actor_user_id,action,metadata) "
                                    + "VALUES(?,?,'NAO_COMPARECEU',JSON_OBJECT('reason','segunda chamada sem comparecimento'))",
                            active.get("id"), userId);
                } else {
                    throw new ApiException(HttpStatus.CONFLICT,
                            "Finalize o atendimento da senha " + active.get("number") + " antes de chamar outra.");
                }
            }
            Map<String, Object> control = jdbc.queryForMap("SELECT last_type FROM queue_control WHERE id=1 FOR UPDATE");
            String lastType = (String) control.get("last_type");
            List<String> candidates = "SP".equals(lastType) ? List.of("SE", "SG", "SP") : List.of("SP", "SE", "SG");
            Map<String, Object> selected = null;
            for (String type : candidates) {
                List<Map<String, Object>> rows = jdbc.queryForList(
                        "SELECT id,type FROM tickets WHERE status='AGUARDANDO' AND type=? "
                                + "ORDER BY issued_at ASC LIMIT 1 FOR UPDATE", type);
                if (!rows.isEmpty()) { selected = rows.get(0); break; }
            }
            if (selected == null) throw new ApiException(HttpStatus.CONFLICT, "Não há senhas aguardando atendimento.");
            LocalDateTime now = LocalDateTime.now();
            jdbc.update("UPDATE tickets SET status='CHAMADA',first_call_at=?,call_count=1,counter=?,attendant_id=? "
                    + "WHERE id=? AND status='AGUARDANDO'", now, counter, userId, selected.get("id"));
            jdbc.update("UPDATE queue_control SET last_type=? WHERE id=1", selected.get("type"));
            jdbc.update("INSERT INTO audit_events(ticket_id,actor_user_id,counter,action) VALUES(?,?,?,'CHAMADA')",
                    selected.get("id"), userId, counter);
            return jdbc.queryForMap("SELECT * FROM tickets WHERE id=?", selected.get("id"));
        });
    }

    public Map<String, Object> repeatCall(String userId, String ticketId) {
        return transactions.execute(status -> {
            List<Map<String, Object>> rows = jdbc.queryForList(
                    "SELECT * FROM tickets WHERE id=? AND attendant_id=? FOR UPDATE", ticketId, userId);
            if (rows.isEmpty()) throw new ApiException(HttpStatus.CONFLICT, "Senha não encontrada para este atendente.");
            Map<String, Object> ticket = rows.get(0);
            String currentStatus = String.valueOf(ticket.get("status"));
            if (!List.of("CHAMADA", "CHAMADA_NOVAMENTE").contains(currentStatus)) {
                throw new ApiException(HttpStatus.CONFLICT, "A senha não pode ser chamada novamente neste estado.");
            }
            int calls = ((Number) ticket.get("call_count")).intValue();
            if (calls >= 2) {
                jdbc.update("UPDATE tickets SET status='NAO_COMPARECEU' WHERE id=?", ticketId);
                jdbc.update("INSERT INTO audit_events(ticket_id,actor_user_id,counter,action) VALUES(?,?,?,'NAO_COMPARECEU')",
                        ticketId, userId, ticket.get("counter"));
                ticket.put("status", "NAO_COMPARECEU");
                return ticket;
            }
            jdbc.update("UPDATE tickets SET status='CHAMADA_NOVAMENTE',second_call_at=?,call_count=2 WHERE id=?", LocalDateTime.now(), ticketId);
            jdbc.update("INSERT INTO audit_events(ticket_id,actor_user_id,counter,action) VALUES(?,?,?,'CHAMADA_NOVAMENTE')",
                    ticketId, userId, ticket.get("counter"));
            return jdbc.queryForMap("SELECT * FROM tickets WHERE id=?", ticketId);
        });
    }

    public Map<String, Object> startTicket(String userId, String ticketId) {
        return updateTicketState(userId, ticketId, "EM_ATENDIMENTO", "started_at", List.of("CHAMADA", "CHAMADA_NOVAMENTE"), "INICIO_ATENDIMENTO",
                "A senha não está disponível para início.");
    }

    public Map<String, Object> finishTicket(String userId, String ticketId) {
        return updateTicketState(userId, ticketId, "ATENDIDA", "finished_at", List.of("EM_ATENDIMENTO"), "FINALIZACAO_ATENDIMENTO",
                "A senha não está em atendimento.");
    }

    private Map<String, Object> updateTicketState(String userId, String ticketId, String nextStatus,
            String timestampColumn, List<String> allowedStatuses, String auditAction, String errorMessage) {
        return transactions.execute(status -> {
            String placeholders = String.join(",", java.util.Collections.nCopies(allowedStatuses.size(), "?"));
            Object[] params = new Object[allowedStatuses.size() + 4];
            params[0] = nextStatus;
            params[1] = LocalDateTime.now();
            params[2] = ticketId;
            params[3] = userId;
            System.arraycopy(allowedStatuses.toArray(), 0, params, 4, allowedStatuses.size());
            int changed = jdbc.update("UPDATE tickets SET status=?," + timestampColumn + "=? "
                    + "WHERE id=? AND attendant_id=? AND status IN (" + placeholders + ")", params);
            if (changed == 0) throw new ApiException(HttpStatus.CONFLICT, errorMessage);
            jdbc.update("INSERT INTO audit_events(ticket_id,actor_user_id,counter,action) "
                            + "SELECT id,attendant_id,counter,? FROM tickets WHERE id=?", auditAction, ticketId);
            return jdbc.queryForMap("SELECT * FROM tickets WHERE id=?", ticketId);
        });
    }

    public Map<String, Object> queue() {
        List<Map<String, Object>> waiting = jdbc.queryForList(
                "SELECT id,number,type,status,issued_at FROM tickets WHERE status='AGUARDANDO' ORDER BY issued_at ASC");
        List<Map<String, Object>> history = jdbc.queryForList(
                "SELECT t.id,t.number,t.type,t.counter,t.status,t.first_call_at AS called_at FROM tickets t "
                        + "WHERE t.first_call_at IS NOT NULL ORDER BY t.first_call_at DESC LIMIT 5");
        List<Map<String, Object>> currentRows = jdbc.queryForList(
                "SELECT t.id,t.number,t.type,t.counter,t.status,t.call_count FROM tickets t "
                        + "WHERE t.first_call_at IS NOT NULL ORDER BY t.first_call_at DESC LIMIT 1");
        Map<String, Object> response = new java.util.LinkedHashMap<>();
        response.put("waiting", waiting);
        response.put("current", currentRows.isEmpty() ? null : currentRows.get(0));
        response.put("history", history);
        return response;
    }

    private void ensureBusinessHours() {
        if (!enforceBusinessHours) return;
        int hour = LocalDateTime.now(RECIFE).getHour();
        if (hour < 7 || hour >= 17) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Atendimento fora do expediente. O horário de operação é das 07:00 às 17:00.");
        }
    }
}
