import { Image, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  tinyLogo: {
    height: 200,
    aspectRatio: 1.5,
    resizeMode: "contain",
  },
});

export const Logo = () => (
  <Image style={styles.tinyLogo} source={require("~/assets/images/logo.png")} />
);
