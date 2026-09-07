package com.ner.logistics.risk.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskEvaluationResponse {

    private Integer currentRiskScore; // 0 to 100

    private String currentRiskLevel; // LOW, MEDIUM, HIGH, CRITICAL

    @Builder.Default
    private String assessmentType = "RULE_BASED_REAL_TIME";

    private List<FactorImpactDto> factors;

    private Double confidenceScore; // Dempster-Shafer fused confidence (0-100)

    private Double uncertaintyMetric; // Uncommitted belief mass

    private String explanation;
}
