import * as React from "react";
import dayjs from "dayjs";
import { SectionList, View } from "react-native";
import { Text } from "@/components/ui/text";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { ProductUnit, Rental, RentalApi, Reservations } from "./api/rental_api";
import { H4, P } from "@/components/ui/typography";

interface ReservationViewProps {
  reservation: Rental;
}

const ReservationView = (props: ReservationViewProps) => {
  const [unit, setUnit] = React.useState<ProductUnit | undefined>(undefined);
  React.useEffect(() => {
    RentalApi.fetchUnitById(props.reservation.unit_id).then((unit) => {
      setUnit(unit);
    });
  }, [props.reservation.unit_id]);

  return (
    unit && (
      <Card>
        <CardHeader>
          <CardTitle>{props.reservation.customer_first_name}</CardTitle>
          <CardDescription>
            {unit.model.brand} - {unit.model.price_per_day / 100}€
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-4 native:gap-2">
          <CardDescription>
            <P>
              {dayjs(props.reservation.start_date).format("DD MMMM H:M")} -{" "}
              {dayjs(props.reservation.end_date).format("DD MMMM H:M")}
            </P>
          </CardDescription>
        </CardContent>
        <CardFooter className="gap-4 flex justify-end">
          <Button variant="default">
            <Text>Accepter</Text>
          </Button>
          <Button variant="secondary">
            <Text>Refuser</Text>
          </Button>
        </CardFooter>
      </Card>
    )
  );
  !unit && <Text>Loading...</Text>;
};
export default function Home() {
  const Tab = createBottomTabNavigator();
  interface ReservationProps {
    states: [string];
  }
  const PendingReservations = () => <ReservationsView states={["intended"]} />;
  const ConfirmedReservations = () => (
    <ReservationsView states={["confirmed"]} />
  );
  const ReservationsView = (reservationProps: ReservationProps) => {
    let previous: string | undefined = undefined;
    let next: string | undefined = undefined;

    const [reservations, setReservations] = React.useState<
      Reservations | undefined
    >(undefined);

    React.useEffect(() => {
      console.log("use effect");
      RentalApi.fetchRentals(next, reservationProps.states)
        .then((reservations) => {
          console.log("got reservations");
          console.log(reservations);
          setReservations(reservations);
          previous = reservations.previous;
          next = reservations.next;
        })
        .catch((error) => {
          console.log(error);
        });
    }, []);

    const data =
      reservations?.bookings_grouped_by_day.map((group) => {
        return { title: group.day, data: group.Rentals };
      }) || [];
    return (
      <SectionList
        className="gap-4 gap-y-4 p-4"
        sections={data}
        ItemSeparatorComponent={() => <View className="h-4"></View>}
        renderItem={({ item }) => <ReservationView reservation={item} />}
        renderSectionHeader={({ section }) => (
          <H4 className="m-2 bg-white w-full">
            {dayjs(section.title, "YYYY-MM-DD").format("DD MMMM")}
          </H4>
        )}
        keyExtractor={(item) => String(item.id)}
      ></SectionList>
    );
  };

  const Profile = () => (
    <View>
      <Text>Profile</Text>
    </View>
  );
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Pending Reservations"
        component={PendingReservations}
        options={{
          tabBarLabel: "Notifications",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="notifications" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Agenda"
        component={ConfirmedReservations}
        options={{
          tabBarLabel: "Agenda",
          tabBarIcon: ({ color, size }) => (
            <Entypo name="calendar" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
  // const [value, setValue] = React.useState("account");
  // return (
  //   <View className="flex-1 justify-center p-6">
  //     <Tabs
  //       value={value}
  //       onValueChange={setValue}
  //       className="w-full max-w-[400px] mx-auto flex-col gap-1.5"
  //     >
  //       <TabsList className="flex-row w-full">
  //         <TabsTrigger value="account" className="flex-1">
  //           <Text>Account</Text>
  //         </TabsTrigger>
  //         <TabsTrigger value="password" className="flex-1">
  //           <Text>Password</Text>
  //         </TabsTrigger>
  //       </TabsList>
  //       <TabsContent value="account">

  //       </TabsContent>
  //       <TabsContent value="password">
  //         <Card>
  //           <CardHeader>
  //             <CardTitle>Password</CardTitle>
  //             <CardDescription>
  //               Change your password here. After saving, you'll be logged out.
  //             </CardDescription>
  //           </CardHeader>
  //           <CardContent className="gap-4 native:gap-2">
  //             <View className="gap-1">
  //               <Label nativeID="current">Current password</Label>
  //               <Input
  //                 placeholder="********"
  //                 aria-labelledby="current"
  //                 secureTextEntry
  //               />
  //             </View>
  //             <View className="gap-1">
  //               <Label nativeID="new">New password</Label>
  //               <Input
  //                 placeholder="********"
  //                 aria-labelledby="new"
  //                 secureTextEntry
  //               />
  //             </View>
  //           </CardContent>
  //           <CardFooter>
  //             <Button>
  //               <Text>Save password</Text>
  //             </Button>
  //           </CardFooter>
  //         </Card>
  //       </TabsContent>
  //     </Tabs>
  //   </View>
  // );
}
