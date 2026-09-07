package com.ner.logistics.simulation;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/simulations")
public class SimulationScenarioController {

    private final SimulationScenarioRepository repository;

    @Autowired
    public SimulationScenarioController(SimulationScenarioRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/active")
    public ResponseEntity<SimulationScenario> getActiveScenario() {
        SimulationScenario scenario = repository.findFirstByIsActiveTrueOrderByIdDesc()
                .orElseGet(() -> repository.save(new SimulationScenario("NH27_Landslide_Monsoon_Training")));
        return ResponseEntity.ok(scenario);
    }

    @PostMapping("/{id}/step")
    public ResponseEntity<SimulationScenario> setStep(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> body) {
        Integer step = body.getOrDefault("step", 1);
        SimulationScenario scenario = repository.findById(id)
                .orElseGet(() -> new SimulationScenario("NH27_Landslide_Monsoon_Training"));

        scenario.setCurrentStep(step);
        scenario.setLastSteppedAt(LocalDateTime.now());
        return ResponseEntity.ok(repository.save(scenario));
    }

    @PostMapping("/{id}/reset")
    public ResponseEntity<SimulationScenario> resetScenario(@PathVariable Long id) {
        SimulationScenario scenario = repository.findById(id)
                .orElseGet(() -> new SimulationScenario("NH27_Landslide_Monsoon_Training"));

        scenario.setCurrentStep(1);
        scenario.setLastSteppedAt(LocalDateTime.now());
        return ResponseEntity.ok(repository.save(scenario));
    }
}
