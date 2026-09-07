package com.ner.logistics.simulation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SimulationScenarioRepository extends JpaRepository<SimulationScenario, Long> {
    Optional<SimulationScenario> findFirstByIsActiveTrueOrderByIdDesc();
}
