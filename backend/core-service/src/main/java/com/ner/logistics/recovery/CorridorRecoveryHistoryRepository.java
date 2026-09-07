package com.ner.logistics.recovery;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CorridorRecoveryHistoryRepository extends JpaRepository<CorridorRecoveryHistory, Long> {
    List<CorridorRecoveryHistory> findByCorridorId(String corridorId);
    List<CorridorRecoveryHistory> findByCorridorIdAndBlockageType(String corridorId, String blockageType);
}
