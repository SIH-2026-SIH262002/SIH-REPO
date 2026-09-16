package com.ner.logistics.driver;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DriverProfileRepository extends JpaRepository<DriverProfile, Long> {

    Optional<DriverProfile> findByUserId(Long userId);

    Optional<DriverProfile> findByUserUsername(String username);

    Optional<DriverProfile> findByAssignedVehicleCode(String vehicleCode);

    List<DriverProfile> findByOperationalStatus(String operationalStatus);

    List<DriverProfile> findByOperationalStatusAndFitnessStatus(String operationalStatus, String fitnessStatus);
}
