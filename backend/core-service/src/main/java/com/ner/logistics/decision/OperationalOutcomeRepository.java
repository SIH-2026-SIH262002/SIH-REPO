package com.ner.logistics.decision;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OperationalOutcomeRepository extends JpaRepository<OperationalOutcome, Long> {
    List<OperationalOutcome> findByCorridorId(String corridorId);
    List<OperationalOutcome> findByIsFalsePositiveTrue();
    List<OperationalOutcome> findByIsFalseNegativeTrue();
}
