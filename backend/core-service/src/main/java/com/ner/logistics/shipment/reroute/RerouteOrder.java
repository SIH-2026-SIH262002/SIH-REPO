package com.ner.logistics.shipment.reroute;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reroute_orders")
public class RerouteOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String shipmentId;

    @Column(nullable = false)
    private String vehicleCode;

    @Column(nullable = false)
    private String originalCorridorId;

    @Column(nullable = false)
    private String aiRecommendedCorridorId;

    private Double aiConfidenceScore;

    private String operatorSelectedCorridorId;

    @Column(columnDefinition = "TEXT")
    private String operatorInstructions;

    private String approvedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RerouteStatus approvalStatus;

    private LocalDateTime createdAt;
    private LocalDateTime dispatchedAt;
    private LocalDateTime driverNotifiedAt;

    public enum RerouteStatus {
        PENDING,
        APPROVED,
        REJECTED,
        EMERGENCY_OVERRIDE
    }

    public RerouteOrder() {
        this.createdAt = LocalDateTime.now();
        this.approvalStatus = RerouteStatus.PENDING;
    }

    public RerouteOrder(String shipmentId, String vehicleCode, String originalCorridorId, String aiRecommendedCorridorId, Double aiConfidenceScore) {
        this();
        this.shipmentId = shipmentId;
        this.vehicleCode = vehicleCode;
        this.originalCorridorId = originalCorridorId;
        this.aiRecommendedCorridorId = aiRecommendedCorridorId;
        this.aiConfidenceScore = aiConfidenceScore;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getShipmentId() { return shipmentId; }
    public void setShipmentId(String shipmentId) { this.shipmentId = shipmentId; }

    public String getVehicleCode() { return vehicleCode; }
    public void setVehicleCode(String vehicleCode) { this.vehicleCode = vehicleCode; }

    public String getOriginalCorridorId() { return originalCorridorId; }
    public void setOriginalCorridorId(String originalCorridorId) { this.originalCorridorId = originalCorridorId; }

    public String getAiRecommendedCorridorId() { return aiRecommendedCorridorId; }
    public void setAiRecommendedCorridorId(String aiRecommendedCorridorId) { this.aiRecommendedCorridorId = aiRecommendedCorridorId; }

    public Double getAiConfidenceScore() { return aiConfidenceScore; }
    public void setAiConfidenceScore(Double aiConfidenceScore) { this.aiConfidenceScore = aiConfidenceScore; }

    public String getOperatorSelectedCorridorId() { return operatorSelectedCorridorId; }
    public void setOperatorSelectedCorridorId(String operatorSelectedCorridorId) { this.operatorSelectedCorridorId = operatorSelectedCorridorId; }

    public String getOperatorInstructions() { return operatorInstructions; }
    public void setOperatorInstructions(String operatorInstructions) { this.operatorInstructions = operatorInstructions; }

    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }

    public RerouteStatus getApprovalStatus() { return approvalStatus; }
    public void setApprovalStatus(RerouteStatus approvalStatus) { this.approvalStatus = approvalStatus; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getDispatchedAt() { return dispatchedAt; }
    public void setDispatchedAt(LocalDateTime dispatchedAt) { this.dispatchedAt = dispatchedAt; }

    public LocalDateTime getDriverNotifiedAt() { return driverNotifiedAt; }
    public void setDriverNotifiedAt(LocalDateTime driverNotifiedAt) { this.driverNotifiedAt = driverNotifiedAt; }
}
