package com.ner.logistics.recovery;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CorridorProfileRepository extends JpaRepository<CorridorProfile, Long> {
    Optional<CorridorProfile> findByCorridorId(String corridorId);
}
