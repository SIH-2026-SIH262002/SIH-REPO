package com.ner.logistics.handover;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TripHandoverRepository extends JpaRepository<TripHandover, Long> {

    Optional<TripHandover> findByHandoverNumber(String handoverNumber);

    List<TripHandover> findByStatus(String status);

    List<TripHandover> findByStatusNot(String status);

    List<TripHandover> findByShipmentId(Long shipmentId);

    List<TripHandover> findByVehicleCode(String vehicleCode);

    List<TripHandover> findByOriginalDriverId(Long driverId);

    List<TripHandover> findByReplacementDriverId(Long driverId);
}
