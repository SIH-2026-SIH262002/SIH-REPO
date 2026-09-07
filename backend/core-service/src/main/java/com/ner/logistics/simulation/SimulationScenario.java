package com.ner.logistics.simulation;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "simulation_scenarios")
public class SimulationScenario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String scenarioName; // NH27_Landslide_Monsoon_Training

    @Column(nullable = false)
    private Integer currentStep; // 1-5

    @Column(columnDefinition = "TEXT")
    private String stepConfigJson;

    private Boolean isActive;
    private String createdBy;
    private LocalDateTime lastSteppedAt;

    public SimulationScenario() {
        this.currentStep = 1;
        this.isActive = true;
        this.createdBy = "TRAINING_SIMULATOR";
        this.lastSteppedAt = LocalDateTime.now();
    }

    public SimulationScenario(String scenarioName) {
        this();
        this.scenarioName = scenarioName;
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getScenarioName() { return scenarioName; }
    public void setScenarioName(String scenarioName) { this.scenarioName = scenarioName; }

    public Integer getCurrentStep() { return currentStep; }
    public void setCurrentStep(Integer currentStep) { this.currentStep = currentStep; }

    public String getStepConfigJson() { return stepConfigJson; }
    public void setStepConfigJson(String stepConfigJson) { this.stepConfigJson = stepConfigJson; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getLastSteppedAt() { return lastSteppedAt; }
    public void setLastSteppedAt(LocalDateTime lastSteppedAt) { this.lastSteppedAt = lastSteppedAt; }
}
