package com.ner.logistics.incident;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface IncidentRepository extends JpaRepository<Incident, Long> {
    List<Incident> findByStatus(String status);
    List<Incident> findByReportedSeverityAndStatus(String reportedSeverity, String status);
    java.util.Optional<Incident> findByClientGeneratedId(String clientGeneratedId);

    @Query(value = "SELECT * FROM incidents i WHERE ST_DWithin(i.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :distanceMeters)", nativeQuery = true)
    List<Incident> findIncidentsNearLocation(@Param("lat") double lat, @Param("lng") double lng, @Param("distanceMeters") double distanceMeters);
}

