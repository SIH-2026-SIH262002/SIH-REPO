package com.ner.logistics.alert;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AlertAcknowledgementRepository extends JpaRepository<AlertAcknowledgement, Long> {
    boolean existsByAlertId(String alertId);
}
