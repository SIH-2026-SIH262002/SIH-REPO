package com.ner.logistics.notification;

import com.ner.logistics.alert.AlertAcknowledgement;
import com.ner.logistics.alert.AlertAcknowledgementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class NotificationController {

    private final MockNotificationAdapter notificationAdapter;
    private final AlertAcknowledgementRepository alertAckRepository;

    @Autowired
    public NotificationController(MockNotificationAdapter notificationAdapter, AlertAcknowledgementRepository alertAckRepository) {
        this.notificationAdapter = notificationAdapter;
        this.alertAckRepository = alertAckRepository;
    }

    @GetMapping("/notifications/outbox")
    public ResponseEntity<List<NotificationLog>> getOutboxLogs() {
        return ResponseEntity.ok(notificationAdapter.getOutboxLogs());
    }

    @PostMapping("/alerts/{id}/acknowledge")
    public ResponseEntity<AlertAcknowledgement> acknowledgeAlert(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body) {
        String username = (body != null && body.containsKey("username")) ? body.get("username") : "OPERATOR_ADMIN";
        String alertType = (body != null && body.containsKey("alertType")) ? body.get("alertType") : "LANDSLIDE_DISRUPTION";

        AlertAcknowledgement ack = new AlertAcknowledgement(id, alertType, username);
        return ResponseEntity.ok(alertAckRepository.save(ack));
    }
}
