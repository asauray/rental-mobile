import dayjs from "dayjs";
import React, { useCallback, useState } from "react";
import { PayoutDto, Payouts, PayoutsResponse } from "../types/payout";
import { useTenantContext } from "../hooks/TenantContextProvider";
import { UserContext, useUserContext } from "../hooks/UserContextProvider";
import { RentalApi } from "../api/rental_api";
import auth from "@react-native-firebase/auth";
import {
  Dimensions,
  LayoutChangeEvent,
  View,
  Button,
  StyleSheet,
  FlatList,
  Text,
} from "react-native";
import PayoutGraph from "../components/PayoutGraph";
import { H3, H4, P } from "@/components/ui/typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface TimeInterval {
  from: dayjs.Dayjs;
  to: dayjs.Dayjs;
}

export const SCREEN_WIDTH = Dimensions.get("window").width;
export const GRAPH_DISPLAY_MODES = ["6h", "1d", "1w", "1m", "3m"] as const;

export type GraphDisplayMode = (typeof GRAPH_DISPLAY_MODES)[number];

export const SPACING = 5;
export const ESTIMATED_BUTTON_WIDTH =
  (SCREEN_WIDTH - 50) / GRAPH_DISPLAY_MODES.length;

export interface GraphPoint {
  date: Date;
  value: number;
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
});

export const PayoutsScreen = () => {
  const [payouts, setPayouts] = React.useState<Payouts | undefined>(undefined);

  const total = React.useMemo(() => {
    return (
      (payouts?.payouts
        .map((payout) => {
          return payout.items.reduce((l, r) => l + r.amount, 0);
        })
        .reduce((l, r) => l + r, 0) ?? 0) / 100
    );
  }, [payouts]);

  const futurePayouts = React.useMemo(() => {
    return (
      (payouts?.payouts
        .map((payout) => {
          return payout.items.reduce(
            (l, r) =>
              l +
              (r.status === "pending" || r.status === "in_transit"
                ? r.amount
                : 0),
            0
          );
        })
        .reduce((l, r) => l + r, 0) ?? 0) / 100
    );
  }, [payouts]);

  const { tenant } = useTenantContext();
  const { user } = useUserContext();

  React.useEffect(() => {
    const fetchPayouts = async () => {
      console.log("fetch payouts");
      if (tenant && user) {
        const data = await RentalApi.fetchPayouts(
          dayjs().format(),
          dayjs().format(),
          tenant,
          user,
          () => auth().signOut()
        );

        console.log("payouts:" + JSON.stringify(data.payouts));
        setPayouts(mapToCore(data));
      }
    };

    fetchPayouts();
  }, [tenant, user]);
  return (
    <View style={styles.container}>
      {payouts && (
        <View>
          <View className="flex flex-wrap flex-row gap-4 justify-evenly">
            <Card className="basis-1/2">
              <CardHeader>
                <CardTitle>Total</CardTitle>
              </CardHeader>
              <CardContent>
                <P>€{total}</P>
              </CardContent>
            </Card>
            <Card className="basis-1/3">
              <CardHeader>
                <CardTitle>En attente</CardTitle>
              </CardHeader>
              <CardContent>
                <P>€{futurePayouts}</P>
              </CardContent>
            </Card>
          </View>
          <FlatList
            className="h-full mt-4"
            ListEmptyComponent={() => (
              <View className="flex justify-center items-center mt-16">
                <P>Oops, aucun paiement pour l'instant</P>
              </View>
            )}
            renderItem={({ item }) => (
              <View>
                <H4>{item.id}</H4>
                <View className="flex flex-row justify-between items-center">
                  <P>€{item.amount / 100}</P>
                  <Badge className="bg-blue-700">
                    <Text className="text-white ">En transit</Text>
                  </Badge>
                </View>

                <P>Prévu le {item.expectedArrivalDate.format("YYYY-MM-DD")}</P>
              </View>
            )}
            data={payouts.payouts.flatMap((p) =>
              p.items.filter(
                (i) => i.status == "pending" || i.status === "in_transit"
              )
            )}
            keyExtractor={(item) => `${item.id}`}
          />
        </View>
      )}
    </View>
  );
};
const mapToCore = (data: PayoutsResponse): Payouts => {
  const ret = data.payouts.map((payout) => {
    const items = payout.items.map((item) => {
      return {
        id: item.id,
        amount: item.amount,
        status: item.status,
        createdAt: dayjs(item.created_at),
        expectedArrivalDate: dayjs(item.arrival_date),
      };
    });
    return {
      date: dayjs(payout.date),
      items: items,
    };
  });
  return {
    payouts: ret,
  };
};
