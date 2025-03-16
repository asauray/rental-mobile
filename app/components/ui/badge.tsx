import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export const Badge = ({ children, className }: BadgeProps) => {
  return (
    <View className={cn("px-2.5 py-0.5 rounded-full", className)}>
      <Text className="text-xs font-semibold text-white">{children}</Text>
    </View>
  );
};

export default Badge;
