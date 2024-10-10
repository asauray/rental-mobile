import { Button } from "@/components/ui/button";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { Image, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/text";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useContext, useEffect, useState } from "react";
import { RentalApi, Tenant } from "./api/rental_api";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TenantContext } from "./TenantContextProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SelectTenantView } from "./SelectTenantView";

export interface ProfileViewProps {
  user: FirebaseAuthTypes.User;
}

const styles = StyleSheet.create({
  profilePicture: {
    height: 150,
    aspectRatio: 1.0,
    resizeMode: "contain",
  },
});

export const ProfileView = ({ user }: ProfileViewProps) => {
  return (
    <View className="p-4 h-full flex justify-between items-cente">
      <Card>
        <CardHeader className="p-4 flex justify-between items-center">
          <CardTitle>{user.email}</CardTitle>
          <Image
            defaultSource={require("~/assets/images/avatar-placeholder.jpg")}
            style={styles.profilePicture}
            src={user.photoURL || undefined}
          />
        </CardHeader>
      </Card>

      <SelectTenantView user={user} />
      <Button
        className="w-full"
        onPress={() => {
          auth().signOut();
        }}
      >
        <Text>Se Deconnecter</Text>
      </Button>
    </View>
  );
};
