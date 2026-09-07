package com.ner.logistics.shipment.thermal;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "thermal_budget_statuses")
public class ThermalBudgetStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String shipmentId;

    @Column(nullable = false)
    private String commodityType; // VACCINE_COLD_CHAIN, MEDICAL_OXYGEN, RATIONS

    private Double initialIcePackTempCelsius;
    private Double maxSafeHours;
    private Double currentCoreTempCelsius;
    private Double remainingThermalHours;

    @Enumerated(EnumType.STRING)
    private ThermalStatus thermalStatus; // SAFE, WARNING, CRITICAL, BREACHED

    private LocalDateTime lastCheckedAt;

    public enum ThermalStatus {
        SAFE,
        WARNING,
        CRITICAL,
        BREACHED
    }

    public ThermalBudgetStatus() {
        this.lastCheckedAt = LocalDateTime.now();
        this.thermalStatus = ThermalStatus.SAFE;
    }

    public ThermalBudgetStatus(String shipmentId, String commodityType, Double maxSafeHours, Double remainingThermalHours, ThermalStatus status) {
        this();
        this.shipmentId = shipmentId;
        this.commodityType = commodityType;
        this.maxSafeHours = maxSafeHours;
        this.remainingThermalHours = remainingThermalHours;
        this.thermalStatus = status;
        this.initialIcePackTempCelsius = -18.0;
        this.currentCoreTempCelsius = 4.2;
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getShipmentId() { return shipmentId; }
    public void setShipmentId(String shipmentId) { this.shipmentId = shipmentId; }

    public String getCommodityType() { return commodityType; }
    public void setCommodityType(String commodityType) { this.commodityType = commodityType; }

    public Double getInitialIcePackTempCelsius() { return initialIcePackTempCelsius; }
    public void setInitialIcePackTempCelsius(Double initialIcePackTempCelsius) { this.initialIcePackTempCelsius = initialIcePackTempCelsius; }

    public Double getMaxSafeHours() { return maxSafeHours; }
    public void setMaxSafeHours(Double maxSafeHours) { this.maxSafeHours = maxSafeHours; }

    public Double getCurrentCoreTempCelsius() { return currentCoreTempCelsius; }
    public void setCurrentCoreTempCelsius(Double currentCoreTempCelsius) { this.currentCoreTempCelsius = currentCoreTempCelsius; }

    public Double getRemainingThermalHours() { return remainingThermalHours; }
    public void setRemainingThermalHours(Double remainingThermalHours) { this.remainingThermalHours = remainingThermalHours; }

    public ThermalStatus getThermalStatus() { return thermalStatus; }
    public void setThermalStatus(ThermalStatus thermalStatus) { this.thermalStatus = thermalStatus; }

    public LocalDateTime getLastCheckedAt() { return lastCheckedAt; }
    public void setLastCheckedAt(LocalDateTime lastCheckedAt) { this.lastCheckedAt = lastCheckedAt; }
}
