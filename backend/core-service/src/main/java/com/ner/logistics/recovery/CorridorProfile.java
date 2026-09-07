package com.ner.logistics.recovery;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "corridor_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CorridorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String corridorId; // e.g. NH-27_HAFLONG_PASS

    private String name;

    private String roadClassification; // NATIONAL_HIGHWAY, STATE_HIGHWAY, DISTRICT_ROAD, VILLAGE_ROAD

    private String terrainType; // STEEP_MOUNTAIN, MOUNTAIN_PASS, HILLY_FOREST, RIVER_VALLEY

    private Double averageSlopeDeg;

    private Double typicalBroResponseTimeHours;

    private String nearestBroDepotId;

    private Double depotDistanceKm;

    private Integer historicalBlockageCount;

    private LocalDateTime createdAt;
}
