package com.ner.logistics.shipment.reroute;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RerouteOrderRepository extends JpaRepository<RerouteOrder, Long> {
    List<RerouteOrder> findByApprovalStatus(RerouteOrder.RerouteStatus status);
    List<RerouteOrder> findByVehicleCode(String vehicleCode);
}
