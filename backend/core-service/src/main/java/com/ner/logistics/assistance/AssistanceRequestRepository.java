package com.ner.logistics.assistance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssistanceRequestRepository extends JpaRepository<AssistanceRequest, Long> {

    Optional<AssistanceRequest> findByRequestNumber(String requestNumber);

    List<AssistanceRequest> findByStatus(String status);

    List<AssistanceRequest> findByStatusNot(String status);

    List<AssistanceRequest> findByDriverId(Long driverId);

    List<AssistanceRequest> findByVehicleCode(String vehicleCode);

    Optional<AssistanceRequest> findBySosEventId(Long sosEventId);
}
