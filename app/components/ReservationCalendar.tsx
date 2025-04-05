import dayjs from "dayjs";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { CalendarProvider, WeekCalendar } from "react-native-calendars";
import { getTheme, lightThemeColor, themeColor } from "./theme";
import { RentalApi, Reservations } from "../api/rental_api";
import { MarkedDates } from "react-native-calendars/src/types";
import { useFocusEffect } from "expo-router";
import { useUserContext } from "../hooks/UserContextProvider";
import { useTenantContext } from "../hooks/TenantContextProvider";

import auth from "@react-native-firebase/auth";
import { StyleSheet, View } from "react-native";
import { RentalList } from "./RentalList";

export interface ReservationCalendarProps {
  states: string[];
}
export interface Interval {
  from: dayjs.Dayjs;
  to: dayjs.Dayjs;
}
export const ReservationCalendar = ({ states }: ReservationCalendarProps) => {
  const { user } = useUserContext();
  const { tenant } = useTenantContext();
  const theme = useRef(getTheme());
  const todayBtnTheme = useRef({
    todayButtonTextColor: themeColor,
  });

  const [reservations, setReservations] = useState<Reservations | undefined>(
    undefined
  );

  const [interval, setInterval] = React.useState<Interval>({
    from: dayjs().day(1),
    to: dayjs().add(1, "week").day(0),
  });
  const [day, setDay] = React.useState<dayjs.Dayjs>(dayjs());

  const reloadData = React.useCallback(
    (fromDate: dayjs.Dayjs, toDate: dayjs.Dayjs) => {
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
            console.log("newReservations", newReservations);
            setReservations(newReservations);
          })
          .catch((error) => {
            console.log("rental error");
            console.log(error);
          });
    },
    [tenant, user, states]
  );

  // Add focus effect to reload data when screen comes into focus
  // useFocusEffect(
  //   React.useCallback(() => {
  //     reloadData(interval.from, interval.to);
  //   }, [interval])
  // );

  useFocusEffect(
    React.useCallback(() => {
      if (!reservations || !isDataInInterval(day, interval.from, interval.to)) {
        console.log("data is not in interval");
        const newFrom = day.day(1).startOf("day");
        const newTo = day.add(1, "week").day(0).endOf("day");
        setReservations(undefined);
        const newInterval = {
          from: newFrom,
          to: newTo,
        };
        console.log("updating fucking interval", JSON.stringify(newInterval));
        setInterval(newInterval);
        reloadData(newInterval.from, newInterval.to);
      }
    }, [day])
  );

  const isDataInInterval = (
    day: dayjs.Dayjs,
    from: dayjs.Dayjs,
    to: dayjs.Dayjs
  ) =>
    ((day.isAfter(from) || day.isSame(from)) && day.isBefore(to)) ||
    day.isSame(to);

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

  let marked: MarkedDates = {};
  let d = interval.from;
  while (d.isBefore(interval.to)) {
    marked[d.format("YYYY-MM-DD")] = {
      marked: false,
      inactive: false,
      disabled: false,
      dotColor: themeColor,
    };
    d = d.add(1, "day");
  }
  reservations?.bookings_grouped_by_day.forEach((rental) => {
    marked[rental.day] = {
      marked: rental.rentals.length > 0,
      inactive: false,
      disabled: false,
      dotColor: themeColor,
    };
  });

  const onDateChanged = useRef((date: string) => {
    const newDay = dayjs(date).startOf("day");
    setDay(newDay);
    console.log("new day: ", date);
    console.log("existing interval:", JSON.stringify(interval));
    console.log("existing reservations", reservations);
  });

  console.log("rerender: interval is", JSON.stringify(interval));

  return (
    <CalendarProvider
      date={dayjs().format("YYYY-MM-DD")}
      showTodayButton={false}
      theme={todayBtnTheme.current}
      onDateChanged={(day) => {
        onDateChanged.current(day);
      }}
    >
      <View style={styles.container}>
        <WeekCalendar
          disabledDaysIndexes={[]}
          disabledByWeekDays={[]}
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
              ? reservations?.bookings_grouped_by_day.filter(
                  (booking) => booking.day === day.format("YYYY-MM-DD")
                )
              : undefined
          }
          day={day}
        />
      </View>
    </CalendarProvider>
  );
};
