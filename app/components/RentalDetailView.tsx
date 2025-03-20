import React from "react";
import { View, Linking } from "react-native";
import { Rental, RentalApi } from "../api/rental_api";
import { Text } from "@/components/ui/text";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import dayjs from "dayjs";
import { Muted, P } from "@/components/ui/typography";
import { Badge } from "../components/ui/badge";
import { Button } from "@/components/ui/button";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface RentalDetailViewProps {
  rental: Rental;
  tenant: number;
  currentUser: FirebaseAuthTypes.User;
}

const getStatusColor = (state: string) => {
  switch (state) {
    case "confirmed":
      return "bg-green-500";
    case "pending_capture":
      return "bg-yellow-500";
    case "cancelled":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

export const RentalDetailView = ({
  rental,
  tenant,
  currentUser,
}: RentalDetailViewProps) => {
  const handleCall = () => {
    Linking.openURL(`tel:${rental.customer_phone_number}`);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${rental.customer_email}`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <View className="flex flex-row justify-between items-center">
          <CardTitle className="text-xl">Réservation #{rental.id}</CardTitle>
          <Badge className={getStatusColor(rental.state)}>{rental.state}</Badge>
        </View>
      </CardHeader>
      <CardContent>
        <View className="space-y-4">
          {/* Customer Information */}
          <View className="space-y-2">
            <Text className="font-semibold text-lg">Client</Text>
            <View className="bg-gray-50 p-4 rounded-lg">
              <P>
                {rental.customer_first_name} {rental.customer_last_name}
              </P>
              <View className="flex flex-row items-center justify-between mt-2">
                <View className="flex-1">
                  <Muted>{rental.customer_email}</Muted>
                  <Muted>{rental.customer_phone_number}</Muted>
                </View>
                <View className="flex flex-row gap-2">
                  <Button variant="outline" size="sm" onPress={handleCall}>
                    <MaterialIcons name="phone" size={20} color="#000" />
                  </Button>
                  <Button variant="outline" size="sm" onPress={handleEmail}>
                    <MaterialIcons name="email" size={20} color="#000" />
                  </Button>
                </View>
              </View>
            </View>
          </View>

          {/* Booking Details */}
          <View className="space-y-2">
            <Text className="font-semibold text-lg">
              Détails de la réservation
            </Text>
            <View className="bg-gray-50 p-4 rounded-lg space-y-2">
              <View className="flex flex-row justify-between">
                <Muted>Début</Muted>
                <P>{dayjs(rental.start_date).format("DD MMMM YYYY HH:mm")}</P>
              </View>
              <View className="flex flex-row justify-between">
                <Muted>Fin</Muted>
                <P>{dayjs(rental.end_date).format("DD MMMM YYYY HH:mm")}</P>
              </View>
              <View className="flex flex-row justify-between">
                <Muted>Durée</Muted>
                <P>
                  {dayjs(rental.end_date).diff(
                    dayjs(rental.start_date),
                    "hours"
                  )}{" "}
                  heures
                </P>
              </View>
            </View>
          </View>

          {/* Payment Information */}
          <View className="space-y-2">
            <Text className="font-semibold text-lg">Paiement</Text>
            <View className="bg-gray-50 p-4 rounded-lg space-y-2">
              <View className="flex flex-row justify-between">
                <Muted>Montant</Muted>
                <P>{rental.formatted_price}</P>
              </View>
              <View className="flex flex-row justify-between">
                <Muted>Devise</Muted>
                <P>{rental.currency}</P>
              </View>
            </View>
          </View>

          {/* Additional Information */}
          <View className="space-y-2">
            <Text className="font-semibold text-lg">
              Informations additionnelles
            </Text>
            <View className="bg-gray-50 p-4 rounded-lg space-y-2">
              <View className="flex flex-row justify-between">
                <Muted>Créé le</Muted>
                <P>{dayjs(rental.created_at).format("DD MMMM YYYY HH:mm")}</P>
              </View>
              <View className="flex flex-row justify-between">
                <Muted>Unité</Muted>
                <P>#{rental.unit_id}</P>
              </View>
            </View>
          </View>
        </View>
      </CardContent>
      {rental.state === "confirmed" && (
        <CardFooter className="flex justify-end">
          <Button
            variant="destructive"
            onPress={() => {
              console.log("replying to reservation: " + rental.id);
              RentalApi.replyToReservation(
                rental.id,
                "cancel",
                tenant,
                currentUser,
                () => auth().signOut()
              ).then(() => {
                // Navigate back to previous screen
                router.back();
              });
            }}
          >
            <Text>Annuler</Text>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default RentalDetailView;
