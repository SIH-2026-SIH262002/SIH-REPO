package com.ner.logistics.shipment.thermal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/shipments")
public class ThermalBudgetController {

    private final ThermalBudgetRepository repository;

    @Autowired
    public ThermalBudgetController(ThermalBudgetRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/{id}/thermal-status")
    public ResponseEntity<ThermalBudgetStatus> getThermalStatus(@PathVariable String id) {
        ThermalBudgetStatus status = repository.findByShipmentId(id)
                .orElseGet(() -> repository.save(new ThermalBudgetStatus(
                        id,
                        "VACCINE_COLD_CHAIN",
                        24.0,
                        12.0,
                        ThermalBudgetStatus.ThermalStatus.WARNING
                )));
        return ResponseEntity.ok(status);
    }
}
