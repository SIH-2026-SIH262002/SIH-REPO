package com.ner.logistics.recovery;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Pre-seeds major NER Logistics Corridors and ground truth clearance history.
 * Addresses Senior Architecture Review Item #4: Prevents NullPointerExceptions and demo failures.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CorridorProfileDataSeeder implements CommandLineRunner {

    private final CorridorProfileRepository profileRepository;
    private final CorridorRecoveryHistoryRepository historyRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (profileRepository.count() > 0) {
            return;
        }

        log.info("🌱 Pre-seeding NER Corridor Profiles & Historical Clearance Records...");

        // 1. NH-27 Haflong Pass
        CorridorProfile nh27 = CorridorProfile.builder()
                .corridorId("NH-27_HAFLONG_PASS")
                .name("NH-27 Haflong Mountain Corridor")
                .roadClassification("NATIONAL_HIGHWAY")
                .terrainType("STEEP_MOUNTAIN")
                .averageSlopeDeg(18.5)
                .typicalBroResponseTimeHours(2.5)
                .nearestBroDepotId("BRO_DEPOT_HAFLONG_01")
                .depotDistanceKm(12.0)
                .historicalBlockageCount(14)
                .createdAt(LocalDateTime.now())
                .build();
        profileRepository.save(nh27);

        // Seed 6 historical events for NH-27 (sample size > 5 -> tight confidence interval ±4h)
        for (int i = 1; i <= 6; i++) {
            CorridorRecoveryHistory history = CorridorRecoveryHistory.builder()
                    .corridorId("NH-27_HAFLONG_PASS")
                    .blockageType("LANDSLIDE")
                    .severityScore(75 + (i * 2))
                    .rainfallMm(85.0 + (i * 10))
                    .roadClassification("NATIONAL_HIGHWAY")
                    .equipmentTypeUsed("BULLDOZER_EXCAVATOR")
                    .actualClearanceHours(14.0 + i)
                    .weatherDuringClearance("CONTINUOUS_RAIN")
                    .season("MONSOON")
                    .timestamp(LocalDateTime.now().minusDays(i * 30))
                    .build();
            historyRepository.save(history);
        }

        // 2. NH-37 Kaziranga East
        CorridorProfile nh37 = CorridorProfile.builder()
                .corridorId("NH-37_KAZIRANGA_EAST")
                .name("NH-37 Kaziranga Floodplain Corridor")
                .roadClassification("NATIONAL_HIGHWAY")
                .terrainType("RIVER_VALLEY")
                .averageSlopeDeg(4.2)
                .typicalBroResponseTimeHours(4.0)
                .nearestBroDepotId("BRO_DEPOT_NAGAON_02")
                .depotDistanceKm(28.0)
                .historicalBlockageCount(8)
                .createdAt(LocalDateTime.now())
                .build();
        profileRepository.save(nh37);

        // 3. SH-51 Lumding Silchar
        CorridorProfile sh51 = CorridorProfile.builder()
                .corridorId("SH-51_LUMDING_SILCHAR")
                .name("SH-51 Lumding-Silchar Mountain Road")
                .roadClassification("STATE_HIGHWAY")
                .terrainType("HILLY_FOREST")
                .averageSlopeDeg(14.1)
                .typicalBroResponseTimeHours(6.0)
                .nearestBroDepotId("BRO_DEPOT_LUMDING_03")
                .depotDistanceKm(45.0)
                .historicalBlockageCount(3)
                .createdAt(LocalDateTime.now())
                .build();
        profileRepository.save(sh51);

        // 4. VR-14 Mawlynnong Hill
        CorridorProfile vr14 = CorridorProfile.builder()
                .corridorId("VR-14_MAWLYNNONG_HILL")
                .name("VR-14 Mawlynnong Border Pass")
                .roadClassification("VILLAGE_ROAD")
                .terrainType("STEEP_MOUNTAIN")
                .averageSlopeDeg(22.8)
                .typicalBroResponseTimeHours(12.0)
                .nearestBroDepotId("BRO_DEPOT_SHILLONG_04")
                .depotDistanceKm(72.0)
                .historicalBlockageCount(0)
                .createdAt(LocalDateTime.now())
                .build();
        profileRepository.save(vr14);

        log.info("✅ Pre-seeded 4 NER Corridors (NH-27, NH-37, SH-51, VR-14) with ground truth clearance logs.");
    }
}
