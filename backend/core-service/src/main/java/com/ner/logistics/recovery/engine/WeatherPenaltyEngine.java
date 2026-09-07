package com.ner.logistics.recovery.engine;

import org.springframework.stereotype.Component;

/**
 * Weather Penalty Engine.
 * Calculates clearance delay hours based on rainfall intensity, forecast continuation, and soil saturation.
 */
@Component
public class WeatherPenaltyEngine {

    public double calculateWeatherPenaltyHours(WeatherContractAdapter.WeatherReading reading) {
        double penalty = 0.0;
        double rain = reading.getRainfallMmPerHour();

        if (rain > 100.0) {
            penalty += 12.0; // Torrential rain
        } else if (rain > 50.0) {
            penalty += 6.0 + ((rain - 50.0) * 0.12); // +6h to +12h
        } else if (rain > 20.0) {
            penalty += 3.0;
        }

        if (reading.isForecastRainContinuation()) {
            penalty += 4.0;
        }

        if (reading.isSoilSaturated()) {
            penalty += 4.0;
        }

        return Math.round(penalty * 10.0) / 10.0;
    }
}
