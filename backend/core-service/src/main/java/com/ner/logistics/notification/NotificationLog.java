package com.ner.logistics.notification;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notification_logs")
public class NotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String recipientType; // DRIVER, FIELD_OFFICER, EMERGENCY_OPERATOR

    @Column(nullable = false)
    private String recipientContact;

    @Column(nullable = false)
    private String channel; // SMS, WHATSAPP, PUSH, WEBSOCKET

    @Column(columnDefinition = "TEXT", nullable = false)
    private String messageContent;

    private LocalDateTime sentAt;

    @Column(nullable = false)
    private String deliveryStatus; // SENT_SIMULATED, DELIVERED, FAILED

    private String twilioMessageSid;

    public NotificationLog() {
        this.sentAt = LocalDateTime.now();
        this.deliveryStatus = "SENT_SIMULATED";
        this.twilioMessageSid = "SM_MOCK_" + System.currentTimeMillis();
    }

    public NotificationLog(String recipientType, String recipientContact, String channel, String messageContent) {
        this();
        this.recipientType = recipientType;
        this.recipientContact = recipientContact;
        this.channel = channel;
        this.messageContent = messageContent;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRecipientType() { return recipientType; }
    public void setRecipientType(String recipientType) { this.recipientType = recipientType; }

    public String getRecipientContact() { return recipientContact; }
    public void setRecipientContact(String recipientContact) { this.recipientContact = recipientContact; }

    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }

    public String getMessageContent() { return messageContent; }
    public void setMessageContent(String messageContent) { this.messageContent = messageContent; }

    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }

    public String getDeliveryStatus() { return deliveryStatus; }
    public void setDeliveryStatus(String deliveryStatus) { this.deliveryStatus = deliveryStatus; }

    public String getTwilioMessageSid() { return twilioMessageSid; }
    public void setTwilioMessageSid(String twilioMessageSid) { this.twilioMessageSid = twilioMessageSid; }
}
