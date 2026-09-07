package com.ner.logistics.decision;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FeedbackLoopTest {

    @Mock
    private OperationalOutcomeRepository outcomeRepository;

    @Test
    void testClosedLoopFeedbackOutcomeTracking() {
        OperationalOutcome outcome = OperationalOutcome.builder()
                .predictionId("PRED-9901")
                .corridorId("CORRIDOR_NH27_HAFLONG")
                .predictedCategory("HIGH")
                .predictedScore(78.5)
                .decisionTaken("REROUTED")
                .actualOutcome("BLOCKED_BY_LANDSLIDE")
                .isFalsePositive(false)
                .isFalseNegative(false)
                .operatorId("OPERATOR_01")
                .outcomeTimestamp(LocalDateTime.now())
                .build();

        when(outcomeRepository.findByCorridorId("CORRIDOR_NH27_HAFLONG")).thenReturn(List.of(outcome));

        List<OperationalOutcome> results = outcomeRepository.findByCorridorId("CORRIDOR_NH27_HAFLONG");

        assertEquals(1, results.size());
        assertEquals("BLOCKED_BY_LANDSLIDE", results.get(0).getActualOutcome());
        assertFalse(results.get(0).getIsFalsePositive());
    }

    @Test
    void testFalsePositiveFeedbackDetection() {
        OperationalOutcome falsePositive = OperationalOutcome.builder()
                .predictionId("PRED-9902")
                .corridorId("CORRIDOR_NH27_HAFLONG")
                .predictedCategory("HIGH")
                .predictedScore(82.0)
                .decisionTaken("REROUTED")
                .actualOutcome("PASSABLE_NO_HAZARD")
                .isFalsePositive(true)
                .isFalseNegative(false)
                .outcomeTimestamp(LocalDateTime.now())
                .build();

        assertTrue(falsePositive.getIsFalsePositive());
        assertEquals("PASSABLE_NO_HAZARD", falsePositive.getActualOutcome());
    }
}
