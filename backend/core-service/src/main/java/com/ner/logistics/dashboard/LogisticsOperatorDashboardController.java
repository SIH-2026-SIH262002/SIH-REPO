package com.ner.logistics.dashboard;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class LogisticsOperatorDashboardController {

    @GetMapping("/logistics-operator")
    public ResponseEntity<Map<String, Object>> getLogisticsOperatorDashboard() {
        return ResponseEntity.ok(Map.of(
                "activeConvoys", 5,
                "pendingReroutes", 1,
                "criticalThermalAlerts", 1,
                "unacknowledgedAlerts", 2,
                "districtAccessPercentage", 68.0,
                "highRiskCorridors", List.of("NH-27_HAFLONG_PASS", "SH-51_LUMDING_PASS", "NH-37_KAZIRANGA"),
                "recentIncidents", List.of(
                        Map.of(
                                "id", "inc-101",
                                "title", "Haflong Pass Landslide",
                                "severity", "CRITICAL",
                                "corridorId", "NH-27_HAFLONG_PASS",
                                "predictedClearanceHours", 18.0
                        )
                ),
                "simulationActive", true
        ));
    }
}
