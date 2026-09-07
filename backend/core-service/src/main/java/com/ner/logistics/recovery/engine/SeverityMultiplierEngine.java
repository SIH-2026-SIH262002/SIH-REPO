package com.ner.logistics.recovery.engine;

import org.springframework.stereotype.Component;

/**
 * Non-Linear Severity Multiplier Engine.
 * Scales clearance duration exponentially for critical severity scores (> 80).
 */
@Component
public class SeverityMultiplierEngine {

    public double calculateSeverityMultiplier(int severityScore) {
        int score = Math.max(0, Math.min(100, severityScore));

        if (score >= 90) {
            return 2.5 + ((score - 90) * 0.05); // 2.5x to 3.0x
        } else if (score >= 80) {
            return 1.8 + ((score - 80) * 0.07); // 1.8x to 2.5x
        } else if (score >= 50) {
            return 1.0 + ((score - 50) * 0.0267); // 1.0x to 1.8x
        } else if (score >= 25) {
            return 0.75 + ((score - 25) * 0.01); // 0.75x to 1.0x
        } else {
            return 0.5; // Minor blockage: 0.5x
        }
    }
}
