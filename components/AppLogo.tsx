import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useThemeColor } from "@/constants/Colors";

interface AppLogoProps {
  size?: "small" | "medium" | "large";
  showSubtitle?: boolean;
}

/**
 * AppLogo component displays the application logo and name
 */
const AppLogo: React.FC<AppLogoProps> = ({ 
  size = "large", 
  showSubtitle = true 
}) => {
  const colors = useThemeColor();
  
  // Adjust sizes based on logo size
  const getSizeStyles = () => {
    switch(size) {
      case "small":
        return {
          logoSize: 80,
          welcomeText: 16,
          logoText: 24,
          subtitleText: 12
        };
      case "medium":
        return {
          logoSize: 100,
          welcomeText: 18,
          logoText: 30,
          subtitleText: 14
        };
      case "large":
      default:
        return {
          logoSize: 120,
          welcomeText: 22,
          logoText: 36,
          subtitleText: 16
        };
    }
  };
  
  const sizeStyles = getSizeStyles();
  
  return (
    <View style={styles.logoContainer}>
      <Image 
        source={require("@/assets/images/logo.png")}
        style={[styles.logo, { width: sizeStyles.logoSize, height: sizeStyles.logoSize }]}
        resizeMode="contain"
      />
      <Text 
        style={[
          styles.welcomeText, 
          { color: colors.text, fontSize: sizeStyles.welcomeText }
        ]}
      >
        Selamat Datang di
      </Text>
      <Text 
        style={[
          styles.logoText, 
          { color: colors.tint, fontSize: sizeStyles.logoText }
        ]}
      >
        MAKUTA
      </Text>
      {showSubtitle && (
        <Text 
          style={[
            styles.subtitleText, 
            { color: colors.tint, fontSize: sizeStyles.subtitleText }
          ]}
        >
          Manajemen Kegiatan dan Unggah Tugas Akademik
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
  logo: {
    marginBottom: 16,
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
    textAlign: "center",
  },
});

export default AppLogo; 