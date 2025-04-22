import React from "react";
import { View, StyleSheet } from "react-native";
import { GraphPoint } from "../types/payout";
import { LineChart, Grid } from "react-native-svg-charts";
import { Line } from "react-native-svg";

interface PayoutGraphProps {
  data: GraphPoint[];
}

const PayoutGraph: React.FC<PayoutGraphProps> = ({ data }) => {
  const points = data.map((point) => point.value);

  return (
    <View style={styles.container}>
      <LineChart
        style={{ height: 200 }}
        data={points}
        svg={{ stroke: "rgb(134, 65, 244)" }}
        contentInset={{ top: 20, bottom: 20 }}
      >
        <Grid />
        <Line />
      </LineChart>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default PayoutGraph;
