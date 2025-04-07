import dayjs from "dayjs";
import { BookingsGroupedByDay, Rental, Reservations } from "../api/rental_api";
import { H4, Large, P } from "@/components/ui/typography";
import { FlatList, TouchableOpacity, View } from "react-native";
import { useCallback, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { router } from "expo-router";
import { Skeleton } from "@/components/ui/skeleton";

export interface RentalListProps {
  reservations: BookingsGroupedByDay[] | undefined;
  day: dayjs.Dayjs;
}

export const RentalList = ({ reservations, day }: RentalListProps) => {
  const count = reservations
    ? reservations.reduce((acc, b) => acc + b.rentals.length, 0)
    : null;

  const [textFilter, setTextFilter] = useState<string | undefined>(undefined);

  const filteredData = useMemo(
    () =>
      reservations
        ?.flatMap((booking) => booking.rentals)
        .filter((booking) => {
          if (!textFilter) {
            return true;
          }
          if (booking.customer_email.toLowerCase().includes(textFilter)) {
            return true;
          }
          if (
            booking.customer_phone_number.toLowerCase().includes(textFilter)
          ) {
            return true;
          }
          if (booking.customer_first_name.toLowerCase().includes(textFilter)) {
            return true;
          }
          if (booking.customer_last_name.toLowerCase().includes(textFilter)) {
            return true;
          }
        }),
    [reservations, day, textFilter]
  );

  const renderItem = useCallback(({ item }: { item: Rental }) => {
    const onPress = () => {
      console.log("reservation: " + item.id);
      router.push({
        pathname: "/routes/rental-details",
        params: { rentalId: item.id },
      });
    };
    return (
      <TouchableOpacity onPress={onPress}>
        <View className="flex flex-row justify-between items-center gap-4 p-4">
          <View>
            <Large>
              {item.customer_first_name} {item.customer_last_name}
            </Large>
            <P>{item.model}</P>
            <P>
              {dayjs(item.start_date).format("HH:mm")} -{" "}
              {dayjs(item.end_date).format("HH:mm")}
            </P>
          </View>

          <Button variant="default" onPress={onPress}>
            <Text>Détails </Text>
          </Button>
        </View>
      </TouchableOpacity>
    );
  }, []);

  console.log("reservations: ", reservations);
  console.log("coutn: ", count);

  if (!reservations && !count) {
    return <Skeleton className="h-20 w-full" />;
  } else if (reservations && count != null && count > 0) {
    return (
      <View className="m-4 gap-4 flex-1">
        {count > 0 ? (
          <H4>
            {count} reservation{count > 1 ? "s" : ""} on{" "}
            {day.format("dddd D MMMM")}
          </H4>
        ) : (
          <H4>No reservations on {day.format("dddd D MMMM")}</H4>
        )}

        <Input
          placeholder="Search reservations"
          onChangeText={(text) => {
            if (text === "") {
              setTextFilter(undefined);
            } else {
              setTextFilter(text.toLowerCase());
            }
          }}
          aria-labelledby="inputLabel"
          aria-errormessage="inputError"
        />

        {filteredData && filteredData.length > 0 ? (
          <View className="flex-1">
            <FlatList
              data={filteredData}
              renderItem={renderItem}
              keyExtractor={(item) => `${item.id}`}
            />
          </View>
        ) : (
          <View className="h-full m-4 gap-4">
            <H4>
              <Text>Aucunes réservations correspondant a la recherche</Text>
            </H4>
          </View>
        )}
      </View>
    );
  } else if (count != null && count === 0) {
    return (
      <H4 className="m-4">No reservations on {day.format("dddd D MMMM")}</H4>
    );
  }
};
