import { ExpoConfig, ConfigContext } from "expo/config";
let rootConfig: ExpoConfig = {
  name: "Bon Cowork",
  slug: "BonCowork",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/Logo_App_IOS_Ordinateur.png",
  scheme: "boncowork",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/splash.png",
    resizeMode: "contain",
    backgroundColor: "#000",
  },
  ios: {
    buildNumber: "1.0.0",
    entitlements: {
      "aps-environment": "production",
    },
    config: {
      usesNonExemptEncryption: false,
    },
    supportsTablet: true,
    bundleIdentifier: "net.sauray.booking.cowork",
    associatedDomains: ["applinks:api.boncowork.com", "applinks:boncowork.com"],
    googleServicesFile: "./GoogleService-Info.plist",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/Logo_App_IOS_Ordinateur.png",
      backgroundColor: "#ffffff",
    },
    package: "net.sauray.booking.cowork",
    googleServicesFile: "./google-services.json",
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "@react-native-firebase/app",
    "@react-native-firebase/auth",
    "@react-native-firebase/crashlytics",
    [
      "expo-build-properties",
      {
        ios: {
          useFrameworks: "static",
        },
      },
    ],
    "expo-font",
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {},
};

if (process.env.ENVIRONMENT === "prod") {
  rootConfig.extra = {
    eas: {
      projectId: "c3006282-3bc0-4b89-a3bb-64e9c4413d1f",
    },
    apiRootUrl: "https://api.boncowork.com",
  };
  rootConfig.name = "Bon Cowork";
} else if (process.env.ENVIRONMENT === "dev") {
  rootConfig.extra = {
    eas: {
      projectId: "c3006282-3bc0-4b89-a3bb-64e9c4413d1f",
    },
    apiRootUrl: "http://192.168.1.41:8080",
  };
} else {
  throw new Error(
    "ENVIRONMENT not set or incorrect: expecting 'prod' or 'dev'"
  );
}

export default ({}) => rootConfig;
