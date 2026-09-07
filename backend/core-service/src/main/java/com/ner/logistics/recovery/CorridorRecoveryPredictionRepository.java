package com.ner.logistics.recovery;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CorridorRecoveryPredictionRepository extends JpaRepository<CorridorRecoveryPrediction, Long> {
    Optional<CorridorRecoveryPrediction> findTopByCorridorIdOrderByGeneratedAtDesc(String corridorId);
    Optional<CorridorRecoveryPrediction> findByPredictionId(String predictionId);
    Optional<CorridorRecoveryPrediction> findByIncidentId(Long incidentId);
}
