import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useThemeColor } from "@/constants/Colors";

interface AppLogoProps {
  size?: "small" | "medium" | "large";
  showSubtitle?: boolean;
}

/**
 * AppLogo component displays the application name and subtitle
 */
const AppLogo: React.FC<AppLogoProps> = ({ 
  size = "large", 
  showSubtitle = true 
}) => {
  const colors = useThemeColor();
  
  // Adjust font sizes based on logo size
  const getSizeStyles = () => {
    switch(size) {
      case "small":
        return {
          welcomeText: 16,
          logoText: 24,
          subtitleText: 12
        };
      case "medium":
        return {
          welcomeText: 18,
          logoText: 30,
          subtitleText: 14
        };
      case "large":
      default:
        return {
          welcomeText: 22,
          logoText: 36,
          subtitleText: 16
        };
    }
  };
  
  const sizeStyles = getSizeStyles();
  
  return (
    <View style={styles.logoContainer}>
      <Text 
        style={[
          styles.welcomeText, 
          { color: colors.text, fontSize: sizeStyles.welcomeText }
        ]}
      >
        Selamat Datang
      </Text>
      <Text 
        style={[
          styles.logoText, 
          { color: colors.tint, fontSize: sizeStyles.logoText }
        ]}
      >
        DI SIKAD
      </Text>
      {showSubtitle && (
        <Text 
          style={[
            styles.subtitleText, 
            { color: colors.tint, fontSize: sizeStyles.subtitleText }
          ]}
        >
          Sistem Informasi Kehadiran
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoText: {
    fontWeight: "bold",
  },
  welcomeText: {
    fontWeight: "bold",
    marginTop: 8,
  },
  subtitleText: {
    marginTop: 4,
  },
});

export default AppLogo; 