import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import Constants from "expo-constants";
import Config from "react-native-config";

const rootUrl = (Constants.expoConfig?.extra?.apiRootUrl as string) ?? "";

interface UploadResponse {
  id: string;
  path: string;
}

export const UploadApi = {
  uploadImage: async (
    file: { uri: string; type: string; name: string },
    user: FirebaseAuthTypes.User,
    signOut: () => Promise<void>
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);

    const idToken = await user.getIdToken();
    const response = await fetch(`${rootUrl}/api/v1/upload/image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      body: formData,
    });

    if (response.status === 401 || response.status === 403) {
      await signOut();
      throw new Error("Authentication failed");
    }

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    return response.json();
  },
};
