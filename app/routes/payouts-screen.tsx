import dayjs from "dayjs";
import React, { useCallback, useState } from "react";
import { PayoutDto, PayoutsResponse } from "../types/payout";
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
} from "react-native";
import PayoutGraph from "../components/PayoutGraph";
import { H3, P } from "@/components/ui/typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const [payouts, setPayouts] = React.useState<PayoutsResponse | undefined>(
    undefined
  );
  const dataPoints = React.useMemo(() => {
    return payouts?.payouts.map((payout) => {
      return {
        value: payout.items.reduce((l, r) => l + r.amount, 0),
        date: dayjs(payout.date).toDate(),
      };
    });
  }, [payouts]);

  const total = React.useMemo(() => {
    return payouts?.payouts
      .map((payout) => {
        return payout.items.reduce((l, r) => l + r.amount, 0);
      })
      .reduce((l, r) => l + r, 0);
  }, [payouts]);

  const futurePayouts = React.useMemo(() => {
    return payouts?.payouts
      .map((payout) => {
        return payout.items.reduce(
          (l, r) => (l + r.status === "pending" ? r.amount : 0),
          0
        );
      })
      .reduce((l, r) => l + r, 0);
  }, [payouts]);
  //const [displayMode, setDisplayMode] = React.useState<GraphDisplayMode>("1w");

  // const handleDisplayModeChange = (mode: GraphDisplayMode) => {
  //   setDisplayMode(mode);
  //   if (payouts) {
  //     const now = dayjs();
  //     let filteredPayouts: GraphPoint[];

  //     switch (mode) {
  //       case "6h":
  //         filteredPayouts = payouts.filter((payout) =>
  //           dayjs(payout.date).isAfter(now.subtract(6, "hour"))
  //         );
  //         break;
  //       case "1d":
  //         filteredPayouts = payouts.filter((payout) =>
  //           dayjs(payout.date).isAfter(now.subtract(1, "day"))
  //         );
  //         break;
  //       case "1w":
  //         filteredPayouts = payouts.filter((payout) =>
  //           dayjs(payout.date).isAfter(now.subtract(1, "week"))
  //         );
  //         break;
  //       case "1m":
  //         filteredPayouts = payouts.filter((payout) =>
  //           dayjs(payout.date).isAfter(now.subtract(1, "month"))
  //         );
  //         break;
  //       case "3m":
  //         filteredPayouts = payouts.filter((payout) =>
  //           dayjs(payout.date).isAfter(now.subtract(3, "month"))
  //         );
  //         break;
  //       default:
  //         filteredPayouts = payouts;
  //     }

  //     setPayouts(filteredPayouts);
  //   }
  // };
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
        setPayouts(data);
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
                <P>€{total}</P>
              </CardContent>
            </Card>
          </View>
          <FlatList
            className="h-full"
            ListEmptyComponent={() => (
              <View className="flex justify-center items-center mt-16">
                <P>Oops, aucun paiement pour l'instant</P>
              </View>
            )}
            renderItem={({ item }) => (
              <View>
                <H3>{item.id}</H3>
                <View>
                  <P>{item.amount / 100}</P>
                  <P>Status {item.status}</P>
                </View>
              </View>
            )}
            data={payouts.payouts.flatMap((p) => p.items)}
            keyExtractor={(item) => `${item.id}`}
          />
        </View>
      )}
    </View>
  );
};
