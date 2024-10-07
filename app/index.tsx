import { Button, Text, View } from "react-native";
import {
  Auth0Provider,
  LocalAuthenticationLevel,
  LocalAuthenticationOptions,
  LocalAuthenticationStrategy,
  useAuth0,
} from "react-native-auth0";

const localAuthOptions: LocalAuthenticationOptions = {
  title: "Authenticate to retreive your credentials",
  subtitle: "Please authenticate to continue",
  description: "We need to authenticate you to retrieve your credentials",
  cancelTitle: "Cancel",
  evaluationPolicy: LocalAuthenticationStrategy.deviceOwnerWithBiometrics,
  fallbackTitle: "Use Passcode",
  authenticationLevel: LocalAuthenticationLevel.strong,
  deviceCredentialFallback: true,
};
const config = {
  domain: "sauray-prod.eu.auth0.com",
  clientId: "BwsP8gtqDyiq26tuX9qGr5zqWjDMLcJW",
};
const App = () => {
  const { authorize, user, isLoading, error } = useAuth0();

  const login = async () => {
    await authorize();
  };

  if (isLoading) {
    return (
      <View>
        <Text>SDK is Loading</Text>
      </View>
    );
  }

  return (
    <View>
      {!user && <Button onPress={login} title="Log in" />}
      {user && <Text>Logged in as {user.name}</Text>}
      {error && <Text>{error.message}</Text>}
    </View>
  );
};

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <App />
    </View>
  );
}
