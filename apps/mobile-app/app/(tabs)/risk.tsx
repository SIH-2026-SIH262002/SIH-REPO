import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { RiskBadge } from '../../src/components/RiskBadge';
import { riskApi } from '../../src/api/risk';
import { RiskPredictionResult, RiskCategory } from '../../src/types';
import { Spacing, BorderRadius, RiskColors } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { getApiErrorMessage } from '../../src/api/client';
import { Ionicons } from '@expo/vector-icons';

export default function RiskScreen() {
  // Input fields for ML Risk Calculator
  const [rainfall24h, setRainfall24h] = useState('85');
  const [rainfall72h, setRainfall72h] = useState('180');
  const [soilMoisture, setSoilMoisture] = useState('78');
  const [soilPorosity, setSoilPorosity] = useState('45');
  const [vibration, setVibration] = useState('3.8');
  const [slopeAngle, setSlopeAngle] = useState('35');

  const [prediction, setPrediction] = useState<RiskPredictionResult | null>(null);
  const [featureImportances, setFeatureImportances] = useState<Record<string, number>>({});
  const [calculating, setCalculating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { colors } = useTheme();

  const fetchFeatureImportance = async () => {
    try {
      const imp = await riskApi.getFeatureImportance();
      setFeatureImportances(imp);
    } catch (e) {
      console.warn('Failed to load feature importances:', e);
    }
  };

  useEffect(() => {
    fetchFeatureImportance();
    handlePredict(); // Run initial prediction
  }, []);

  const handlePredict = async () => {
    setCalculating(true);
    setErrorMsg('');
    try {
      const res = await riskApi.predictRisk({
        rainfall_mm_last_24h: parseFloat(rainfall24h) || 0,
        rainfall_mm_last_72h: parseFloat(rainfall72h) || 0,
        soil_moisture_pct: parseFloat(soilMoisture) || 0,
        soil_porosity_index: parseFloat(soilPorosity) || 0,
        vibration_intensity: parseFloat(vibration) || 0,
        slope_angle_deg: parseFloat(slopeAngle) || 0,
      });
      setPrediction(res);
    } catch (e) {
      setErrorMsg(getApiErrorMessage(e));
    } finally {
      setCalculating(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Header
        title="Landslide Risk AI"
        subtitle="Machine Learning Predictive Analysis"
        rightActionIcon="refresh-outline"
        onRightAction={handlePredict}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {errorMsg ? (
          <View style={[styles.errorBox, { backgroundColor: `${colors.sosRed}20` }]}>
            <Ionicons name="alert-circle" size={18} color={colors.sosRed} />
            <Text style={[styles.errorText, { color: colors.sosRed }]}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Prediction Result Gauge Card */}
        {prediction && (
          <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
            <View style={styles.resultHeader}>
              <Text style={[styles.resultTitle, { color: colors.textSubtle }]}>PREDICTED LANDSLIDE RISK</Text>
              <RiskBadge category={prediction.category} size="lg" />
            </View>

            <View style={styles.scoreRow}>
              <Text style={[styles.scoreNumber, { color: colors.text }]}>{prediction.risk_score.toFixed(0)}</Text>
              <Text style={[styles.scoreMax, { color: colors.textMuted }]}>/ 100</Text>
            </View>

            <View style={[styles.meterBarBg, { backgroundColor: colors.inputBg }]}>
              <View
                style={[
                  styles.meterBarFill,
                  {
                    width: `${Math.min(prediction.risk_score, 100)}%`,
                    backgroundColor: RiskColors[prediction.category as RiskCategory] || colors.primary,
                  },
                ]}
              />
            </View>

            {/* Contributing Factors */}
            <Text style={[styles.subSectionTitle, { color: colors.textMuted }]}>CONTRIBUTING SENSOR FACTORS</Text>
            {prediction.contributing_factors?.map((fact, idx) => (
              <View key={idx} style={styles.factorRow}>
                <Ionicons name="hardware-chip-outline" size={14} color={colors.primary} />
                <Text style={[styles.factorName, { color: colors.text }]}>{fact.factor}</Text>
                <Text style={[styles.factorImpact, { color: colors.primary }]}>{fact.impact}</Text>
              </View>
            ))}

            {/* AI Recommendations */}
            {prediction.recommendations?.length > 0 && (
              <View style={[styles.recBox, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
                <Text style={[styles.recTitle, { color: colors.warning }]}>AI SAFETY RECOMMENDATIONS:</Text>
                {prediction.recommendations.map((rec, i) => (
                  <Text key={i} style={[styles.recText, { color: colors.textMuted }]}>• {rec}</Text>
                ))}
              </View>
            )}
          </Card>
        )}

        {/* Interactive Risk Simulator Form */}
        <Card title="Simulate Risk Parameters" icon="calculator">
          <View style={styles.formGrid}>
            <View style={styles.inputCol}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>24h Rain (mm)</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.inputBg, borderColor: colors.cardBorder, color: colors.text },
                ]}
                value={rainfall24h}
                onChangeText={setRainfall24h}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputCol}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>72h Rain (mm)</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.inputBg, borderColor: colors.cardBorder, color: colors.text },
                ]}
                value={rainfall72h}
                onChangeText={setRainfall72h}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputCol}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Soil Moisture (%)</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.inputBg, borderColor: colors.cardBorder, color: colors.text },
                ]}
                value={soilMoisture}
                onChangeText={setSoilMoisture}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputCol}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Porosity Index</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.inputBg, borderColor: colors.cardBorder, color: colors.text },
                ]}
                value={soilPorosity}
                onChangeText={setSoilPorosity}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputCol}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Vibration (0-10)</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.inputBg, borderColor: colors.cardBorder, color: colors.text },
                ]}
                value={vibration}
                onChangeText={setVibration}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputCol}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Slope Angle (°)</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.inputBg, borderColor: colors.cardBorder, color: colors.text },
                ]}
                value={slopeAngle}
                onChangeText={setSlopeAngle}
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.calcBtn, { backgroundColor: colors.primary }, calculating && styles.btnDisabled]}
            onPress={handlePredict}
            disabled={calculating}
          >
            {calculating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="sparkles" size={16} color="#fff" />
                <Text style={styles.calcBtnText}>Run ML Risk Assessment</Text>
              </>
            )}
          </TouchableOpacity>
        </Card>

        {/* Feature Importance List */}
        {Object.keys(featureImportances).length > 0 && (
          <Card title="ML Model Feature Importances" icon="analytics">
            {Object.entries(featureImportances)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([feature, weight], idx) => (
                <View key={idx} style={styles.importanceRow}>
                  <Text style={[styles.featureName, { color: colors.text }]}>{feature.replace(/_/g, ' ')}</Text>
                  <View style={[styles.importanceBarBg, { backgroundColor: colors.inputBg }]}>
                    <View
                      style={[
                        styles.importanceBarFill,
                        {
                          width: `${Math.min(weight * 100 * 2.5, 100)}%`,
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.importanceVal, { color: colors.textMuted }]}>
                    {(weight * 100).toFixed(1)}%
                  </Text>
                </View>
              ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: Spacing.sm,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '900',
  },
  scoreMax: {
    fontSize: 18,
    marginLeft: 6,
  },
  meterBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  meterBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  factorName: {
    fontSize: 13,
    flex: 1,
  },
  factorImpact: {
    fontSize: 12,
    fontWeight: '700',
  },
  recBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  recTitle: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
  },
  recText: {
    fontSize: 12,
    marginTop: 2,
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  inputCol: {
    width: '48%',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  input: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    height: 40,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  calcBtn: {
    height: 44,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.md,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  calcBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  importanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  featureName: {
    fontSize: 12,
    width: 130,
    textTransform: 'capitalize',
  },
  importanceBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  importanceBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  importanceVal: {
    fontSize: 11,
    fontWeight: '700',
    width: 40,
    textAlign: 'right',
  },
});
