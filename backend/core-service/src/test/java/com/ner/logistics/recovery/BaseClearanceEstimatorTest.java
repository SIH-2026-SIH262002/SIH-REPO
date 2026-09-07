package com.ner.logistics.recovery;

import com.ner.logistics.recovery.engine.BaseClearanceEstimator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class BaseClearanceEstimatorTest {

    private BaseClearanceEstimator estimator;

    @BeforeEach
    void setUp() {
        estimator = new BaseClearanceEstimator();
    }

    @Test
    void testHistoricalMedianCalculation() {
        CorridorRecoveryHistory h1 = CorridorRecoveryHistory.builder().blockageType("LANDSLIDE").actualClearanceHours(10.0).build();
        CorridorRecoveryHistory h2 = CorridorRecoveryHistory.builder().blockageType("LANDSLIDE").actualClearanceHours(14.0).build();
        CorridorRecoveryHistory h3 = CorridorRecoveryHistory.builder().blockageType("LANDSLIDE").actualClearanceHours(20.0).build();

        double base = estimator.estimateBaseClearanceHours("LANDSLIDE", "NATIONAL_HIGHWAY", List.of(h1, h2, h3));
        assertEquals(14.0, base);
    }

    @Test
    void testNationalHighwayDefaultFallback() {
        double base = estimator.estimateBaseClearanceHours("LANDSLIDE", "NATIONAL_HIGHWAY", Collections.emptyList());
        assertEquals(13.6, base, 0.01); // 16.0 * 0.85
    }

    @Test
    void testVillageRoadFloodingFallback() {
        double base = estimator.estimateBaseClearanceHours("FLOODING", "VILLAGE_ROAD", Collections.emptyList());
        assertEquals(32.0, base, 0.01); // 20.0 * 1.6
    }

    @Test
    void testBridgeCollapseFallback() {
        double base = estimator.estimateBaseClearanceHours("BRIDGE_COLLAPSE", "STATE_HIGHWAY", Collections.emptyList());
        assertEquals(36.0, base, 0.01);
    }
}
