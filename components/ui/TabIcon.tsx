import React from "react";
import { Ionicons } from "@expo/vector-icons";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

interface TabIconProps {
  name: IconName;
  color: string;
  size: number;
}

/**
 * TabIcon component for navigation tabs
 */
const TabIcon: React.FC<TabIconProps> = ({ name, color, size }) => {
  return <Ionicons name={name} size={size} color={color} />;
};

export default TabIcon; 