import dayjs from "dayjs";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CalendarProvider,
  ExpandableCalendar,
  WeekCalendar,
} from "react-native-calendars";
import { getTheme, lightThemeColor, themeColor } from "./theme";
import { RentalApi, Reservations } from "../api/rental_api";
import { MarkedDates } from "react-native-calendars/src/types";
import { useFocusEffect } from "expo-router";
import { useUserContext } from "../hooks/UserContextProvider";
import { useTenantContext } from "../hooks/TenantContextProvider";

import auth from "@react-native-firebase/auth";
import { StyleSheet, View } from "react-native";
import { RentalList } from "./RentalList";
import { init } from "@amplitude/analytics-react-native";

const isoWeek = require("dayjs/plugin/isoWeek");
dayjs.extend(isoWeek);

//(ExpandableCalendar as any).defaultProps = undefined;

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
console.log("initial date ", initialDate.format());
console.log("initial from", initialFrom);
console.log("initial to", initialTo);

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

  const [day, setDay] = React.useState<dayjs.Dayjs>(initialDate);
  const [interval, setInterval] = React.useState<Interval>({
    from: initialFrom,
    to: initialTo,
  });

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
            console.log("updating marked dates");
          })
          .catch((error) => {
            console.log("rental error");
            console.log(error);
          });
    },
    [tenant, user, states]
  );

  useFocusEffect(
    React.useCallback(() => {
      let currentInterval = interval;
      let currentReservations = reservations;
      if (!isDataInInterval(day, interval.from, interval.to)) {
        console.log("data is not in interval");
        const newFrom = day.startOf("isoWeek").startOf("day");
        const newTo = newFrom.add(6, "day").endOf("day");
        currentReservations = undefined;
        setReservations(undefined);
        const newInterval = {
          from: newFrom,
          to: newTo,
        };
        console.log("updating fucking interval", JSON.stringify(newInterval));
        setInterval(newInterval);
        currentInterval = newInterval;
      }
      if (!currentReservations) {
        console.log("reservations is undefined");
        reloadData(currentInterval.from, currentInterval.to);
      }
    }, [day])
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
              ? bookingOnGivenDay
              : undefined
          }
          day={day}
        />
      </View>
    </CalendarProvider>
  );
};
