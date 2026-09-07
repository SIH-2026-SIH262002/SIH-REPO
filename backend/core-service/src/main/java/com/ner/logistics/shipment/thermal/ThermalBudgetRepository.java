package com.ner.logistics.shipment.thermal;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ThermalBudgetRepository extends JpaRepository<ThermalBudgetStatus, Long> {
    Optional<ThermalBudgetStatus> findByShipmentId(String shipmentId);
}
