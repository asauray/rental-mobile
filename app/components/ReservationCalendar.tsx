import dayjs from "dayjs";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { CalendarProvider, ExpandableCalendar } from "react-native-calendars";
import { getTheme, lightThemeColor, themeColor } from "./theme";
import { RentalApi, Reservations } from "../api/rental_api";
import { MarkedDates } from "react-native-calendars/src/types";
import { router, useFocusEffect } from "expo-router";
import { useUserContext } from "../hooks/UserContextProvider";
import { useTenantContext } from "../hooks/TenantContextProvider";

import auth from "@react-native-firebase/auth";
import { TouchableOpacity, View } from "react-native";
import { RentalList } from "./RentalList";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StyleSheet } from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useNotification } from "../hooks/UseNotifications";
import { useAppLifeCycle } from "../hooks/UseAppLifecycle";
import { useBadgeCount } from "../hooks/UseBadgeCount";

const isoWeek = require("dayjs/plugin/isoWeek");
dayjs.extend(isoWeek);

(ExpandableCalendar as any).defaultProps = undefined;

export interface ReservationCalendarProps {
  states: string[];
}
export interface Interval {
  from: dayjs.Dayjs;
  to: dayjs.Dayjs;
}

const initialDate = dayjs().startOf("day");
const initialFrom = initialDate.startOf("isoWeek");
const initialTo = initialFrom.add(6, "day").endOf("day");

export const ReservationCalendar = ({ states }: ReservationCalendarProps) => {
  const { user } = useUserContext();
  const { tenant } = useTenantContext();
  const theme = useRef(getTheme());
  const todayBtnTheme = useRef({
    todayButtonTextColor: themeColor,
  });

  const { notification } = useNotification();
  const { badgeCount } = useBadgeCount();

  const [reservations, setReservations] = useState<Reservations | undefined>(
    undefined
  );

  const [pendingReservations, setPendingReservations] = useState<
    Reservations | undefined
  >(undefined);

  const roomsPendingBooking = useMemo<string>(
    () =>
      pendingReservations?.bookings_grouped_by_day
        .flatMap((item) => item.rentals)
        .reduce<string[]>((acc, current) => {
          if (!acc.includes(current.model)) {
            return [...acc, current.model];
          }
          return acc;
        }, [])
        .join(", ") || "",
    [pendingReservations]
  );

  const [day, setDay] = React.useState<dayjs.Dayjs>(initialDate);
  const [interval, setInterval] = React.useState<Interval>({
    from: initialFrom,
    to: initialTo,
  });

  const [calendarToggled, setCalendarToggled] = useState(false);

  const marked = useMemo<MarkedDates>(() => {
    let d = interval.from;
    let m: MarkedDates = {};
    while (d.isBefore(interval.to)) {
      m[d.format("YYYY-MM-DD")] = {
        marked: false,
        inactive: false,
        disabled: false,
        dotColor: themeColor,
      };
      d = d.add(1, "day");
    }
    reservations?.bookings_grouped_by_day.forEach((rental) => {
      m[rental.day] = {
        marked: rental.rentals.length > 0,
        inactive: false,
        disabled: false,
        dotColor: themeColor,
      };
    });
    return m;
  }, [reservations]);

  const bookingOnGivenDay = useMemo(
    () =>
      reservations?.bookings_grouped_by_day.filter(
        (booking) => booking.day === day.format("YYYY-MM-DD")
      ),
    [day, reservations]
  );

  const reloadData = React.useCallback(
    (fromDate: dayjs.Dayjs, toDate: dayjs.Dayjs) => {
      console.log("reloading data");
      tenant &&
        user &&
        RentalApi.fetchRentals(
          fromDate.format(),
          toDate.format(),
          states,
          "day",
          tenant,
          user,
          () => auth().signOut()
        )
          .then((newReservations) => {
            setReservations(newReservations);
          })
          .catch((error) => {
            console.log("rental error");
            console.log(error);
          });
    },
    [tenant, user, states, notification, badgeCount]
  );

  useFocusEffect(
    React.useCallback(() => {
      let currentInterval = interval;
      let currentReservations = reservations;
      if (calendarToggled) {
        currentInterval = {
          from: day.startOf("month"),
          to: day.endOf("month"),
        };
        currentReservations = undefined;
      } else if (!isDataInInterval(day, interval.from, interval.to)) {
        console.log("data is not in interval");
        const newFrom = day.startOf("isoWeek").startOf("day");
        const newTo = newFrom.add(6, "day").endOf("day");
        currentReservations = undefined;
        setReservations(undefined);
        const newInterval = {
          from: newFrom,
          to: newTo,
        };
        setInterval(newInterval);
        currentInterval = newInterval;
      }
      if (!currentReservations) {
        console.log("reservations is undefined");
        reloadData(currentInterval.from, currentInterval.to);
      }
    }, [calendarToggled, day])
  );

  useFocusEffect(
    React.useCallback(() => {
      if (tenant && user) {
        RentalApi.fetchRentals(
          dayjs().subtract(1, "day").format(),
          dayjs().add(14, "week").format(),
          ["pending_capture"],
          "purchase",
          tenant,
          user,
          () => auth().signOut()
        )
          .then((newPendingReservations) => {
            setPendingReservations(newPendingReservations);
          })
          .catch((error) => {
            console.log("notifications view", error);
          });
      }
    }, [tenant, user, notification, badgeCount])
  );

  const isDataInInterval = (
    day: dayjs.Dayjs,
    from: dayjs.Dayjs,
    to: dayjs.Dayjs
  ) => (day.isAfter(from) || day.isSame(from)) && day.isBefore(to);

  const styles = StyleSheet.create({
    calendar: {
      paddingLeft: 20,
      paddingRight: 20,
    },
    header: {
      backgroundColor: "lightgrey",
    },
    section: {
      backgroundColor: lightThemeColor,
      color: "grey",
      textTransform: "capitalize",
    },
    container: {
      flex: 1,
      height: "100%",
    },
    agendaList: {
      flex: 1,
    },
  });

  const onDateChanged = useRef((date: string) => {
    const newDay = dayjs(date).startOf("day");
    setDay(newDay);
    console.log("new day: ", date);
  });

  return (
    <CalendarProvider
      date={day.format("YYYY-MM-DD")}
      showTodayButton={false}
      theme={todayBtnTheme.current}
      onDateChanged={(day) => {
        onDateChanged.current(day);
      }}
    >
      <View style={styles.container}>
        {pendingReservations &&
        pendingReservations.bookings_grouped_by_day.length > 0 ? (
          <TouchableOpacity
            onPress={() => {
              router.push("/routes/pending-reservations");
            }}
          >
            <Card className="m-4 bg-black text-white">
              <CardHeader>
                <View>
                  <View className="flex-row items-center justify-between">
                    <CardTitle className="text-white">
                      {`${
                        pendingReservations.bookings_grouped_by_day.length
                      } réservation${
                        pendingReservations.bookings_grouped_by_day.length > 1
                          ? "s"
                          : ""
                      } en attente`}
                    </CardTitle>
                    <MaterialIcons
                      name="navigate-next"
                      size={24}
                      color="white"
                    />
                  </View>
                  <CardDescription className="text-white">
                    {roomsPendingBooking}
                  </CardDescription>
                </View>
              </CardHeader>
            </Card>
          </TouchableOpacity>
        ) : null}
        <ExpandableCalendar
          disabledDaysIndexes={[]}
          onCalendarToggled={(toggled) => {
            setCalendarToggled(toggled);
          }}
          theme={theme.current}
          disableAllTouchEventsForDisabledDays={true}
          disableAllTouchEventsForInactiveDays={true}
          disabledByDefault={false}
          firstDay={1}
          markedDates={marked}
        />
        <RentalList
          reservations={
            isDataInInterval(day, interval.from, interval.to)
              ? bookingOnGivenDay
              : undefined
          }
          day={day}
        />
      </View>
    </CalendarProvider>
  );
};
