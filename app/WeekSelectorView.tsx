import { Button } from "@/components/ui/button";
import { P } from "@/components/ui/typography";
import dayjs from "dayjs";
import { useState } from "react";
import { Text, View } from "react-native";

export interface WeekSelectorViewProps {
  initialDay: dayjs.Dayjs;
  onSelect: (from: dayjs.Dayjs, to: dayjs.Dayjs) => void;
}
export const WeekSelectorView = ({
  onSelect,
  initialDay,
}: WeekSelectorViewProps) => {
  const [from, setFrom] = useState(initialDay.startOf("week"));
  const [to, setTo] = useState(initialDay.add(1, "week").endOf("week"));
  onSelect(from, to);

  const previousWeek = () => {
    setFrom(from.subtract(1, "week"));
    setTo(to.subtract(1, "week"));
    onSelect(from, to);
  };

  const nextWeek = () => {
    setFrom(from.add(1, "week"));
    setTo(to.add(1, "week"));
    onSelect(from, to);
  };

  return (
    <View className="flex flex-row ml-4 mr-4 justify-between items-center gap-4">
      <Button variant="outline" onPress={() => previousWeek()}>
        <Text>Precedent</Text>
      </Button>

      <Button variant="outline" onPress={() => nextWeek()}>
        <Text>Suivant</Text>
      </Button>
    </View>
  );
};
