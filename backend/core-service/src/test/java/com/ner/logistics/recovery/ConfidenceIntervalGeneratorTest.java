package com.ner.logistics.recovery;

import com.ner.logistics.recovery.engine.ConfidenceIntervalGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class ConfidenceIntervalGeneratorTest {

    private ConfidenceIntervalGenerator generator;

    @BeforeEach
    void setUp() {
        generator = new ConfidenceIntervalGenerator();
    }

    @Test
    void testTightIntervalForLargeSampleHistory() {
        ConfidenceIntervalGenerator.ConfidenceBounds bounds = generator.generateBounds(18.0, 7); // > 5 events
        assertEquals(4.0, bounds.getMarginOfErrorHours());
        assertEquals(14.0, bounds.getConfidenceLowHours());
        assertEquals(22.0, bounds.getConfidenceHighHours());
        assertEquals("HIGH_CONFIDENCE", bounds.getConfidenceRating());
    }

    @Test
    void testModerateIntervalForSparseHistory() {
        ConfidenceIntervalGenerator.ConfidenceBounds bounds = generator.generateBounds(18.0, 3); // 1-5 events
        assertEquals(8.0, bounds.getMarginOfErrorHours());
        assertEquals(10.0, bounds.getConfidenceLowHours());
        assertEquals(26.0, bounds.getConfidenceHighHours());
        assertEquals("MODERATE_CONFIDENCE", bounds.getConfidenceRating());
    }

    @Test
    void testWideIntervalForZeroHistory() {
        ConfidenceIntervalGenerator.ConfidenceBounds bounds = generator.generateBounds(18.0, 0); // 0 events
        assertEquals(16.0, bounds.getMarginOfErrorHours());
        assertEquals(2.0, bounds.getConfidenceLowHours());
        assertEquals(34.0, bounds.getConfidenceHighHours());
        assertEquals("WIDE_INTERVAL_UNCERTAIN", bounds.getConfidenceRating());
    }
}
