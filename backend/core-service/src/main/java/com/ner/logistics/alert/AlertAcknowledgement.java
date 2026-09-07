package com.ner.logistics.alert;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "alert_acknowledgements")
public class AlertAcknowledgement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String alertId;

    @Column(nullable = false)
    private String alertType;

    @Column(nullable = false)
    private String acknowledgedBy;

    private LocalDateTime acknowledgedAt;

    @Enumerated(EnumType.STRING)
    private NotificationChannel channel;

    public enum NotificationChannel {
        WEBSOCKET,
        SMS,
        WHATSAPP,
        PUSH
    }

    public AlertAcknowledgement() {
        this.acknowledgedAt = LocalDateTime.now();
        this.channel = NotificationChannel.WEBSOCKET;
    }

    public AlertAcknowledgement(String alertId, String alertType, String acknowledgedBy) {
        this();
        this.alertId = alertId;
        this.alertType = alertType;
        this.acknowledgedBy = acknowledgedBy;
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getAlertId() { return alertId; }
    public void setAlertId(String alertId) { this.alertId = alertId; }

    public String getAlertType() { return alertType; }
    public void setAlertType(String alertType) { this.alertType = alertType; }

    public String getAcknowledgedBy() { return acknowledgedBy; }
    public void setAcknowledgedBy(String acknowledgedBy) { this.acknowledgedBy = acknowledgedBy; }

    public LocalDateTime getAcknowledgedAt() { return acknowledgedAt; }
    public void setAcknowledgedAt(LocalDateTime acknowledgedAt) { this.acknowledgedAt = acknowledgedAt; }

    public NotificationChannel getChannel() { return channel; }
    public void setChannel(NotificationChannel channel) { this.channel = channel; }
}
