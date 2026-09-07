package com.ner.logistics.notification;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class MockNotificationAdapter {

    private final NotificationLogRepository repository;

    @Autowired
    public MockNotificationAdapter(NotificationLogRepository repository) {
        this.repository = repository;
    }

    public NotificationLog sendSms(String recipientType, String contactNumber, String textMessage) {
        NotificationLog log = new NotificationLog(recipientType, contactNumber, "SMS", textMessage);
        log.setDeliveryStatus("SENT_SIMULATED");
        return repository.save(log);
    }

    public NotificationLog sendWhatsApp(String recipientType, String contactNumber, String textMessage) {
        NotificationLog log = new NotificationLog(recipientType, contactNumber, "WHATSAPP", textMessage);
        log.setDeliveryStatus("DELIVERED_SIMULATED");
        return repository.save(log);
    }

    public List<NotificationLog> getOutboxLogs() {
        List<NotificationLog> logs = repository.findTop20ByOrderByIdDesc();
        if (logs.isEmpty()) {
            // Pre-seed mock log entries for realistic demo
            repository.save(new NotificationLog("DRIVER", "+919876543213", "WHATSAPP", "🚨 CRITICAL ALERT: NH-27 Haflong Pass blocked by Landslide. Alternate route R2 assigned to vehicle NER-07."));
            repository.save(new NotificationLog("FIELD_OFFICER", "+919876543214", "SMS", "[NER LOGISENSE] Weather Warning: Heavy rain (145mm/24h) in Dima Hasao Sector."));
            logs = repository.findTop20ByOrderByIdDesc();
        }
        return logs;
    }
}
