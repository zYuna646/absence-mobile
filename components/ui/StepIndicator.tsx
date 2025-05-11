import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useThemeColor } from "@/constants/Colors";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

/**
 * StepIndicator component for showing progress in multi-step flows
 */
const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
}) => {
  const colors = useThemeColor();

  return (
    <View style={styles.container}>
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => {
          const isActive = index + 1 === currentStep;
          const isCompleted = index + 1 < currentStep;

          return (
            <React.Fragment key={index}>
              {index > 0 && (
                <View
                  style={[
                    styles.line,
                    {
                      backgroundColor: isCompleted
                        ? colors.tabIconSelected
                        : colors.tabIconSelected,
                    },
                  ]}
                />
              )}
              <View
                style={[
                  styles.step,
                  {
                    backgroundColor:
                      isActive || isCompleted
                        ? colors.tabIconSelected
                        : colors.tabIconDefault,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.stepText,
                    {
                      color:
                        isActive || isCompleted
                          ? colors.tabIconDefault
                          : colors.tabIconSelected,
                    },
                  ]}
                >
                  {index + 1}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>

      <View style={styles.labelsContainer}>
        {steps.map((step, index) => (
          <Text
            key={index}
            style={[
              styles.stepLabel,
              {
                color: index + 1 === currentStep ? colors.tint : colors.text,
                fontWeight: index + 1 === currentStep ? "bold" : "normal",
                maxWidth: `${100 / steps.length}%`,
              },
            ]}
            numberOfLines={1}
          >
            {step}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  stepsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  step: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  line: {
    flex: 1,
    height: 2,
  },
  labelsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  stepLabel: {
    textAlign: "center",
    fontSize: 12,
  },
});

export default StepIndicator;
