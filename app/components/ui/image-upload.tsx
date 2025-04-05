import React, { useState } from "react";
import { View, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import * as ImagePicker from "expo-image-picker";
import { UploadApi } from "../../api/upload_api";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  placeholder?: string;
  currentUser: FirebaseAuthTypes.User;
  signOut: () => Promise<void>;
}

export const ImageUpload = ({
  value,
  onChange,
  placeholder = "Sélectionner une image",
  currentUser,
  signOut,
}: ImageUploadProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        setLoading(true);
        setError(null);
        try {
          const file = {
            uri: result.assets[0].uri,
            type: "image/jpeg",
            name: "upload.jpg",
          };

          const response = await UploadApi.uploadImage(
            file,
            currentUser,
            signOut
          );
          onChange(response.path);
        } catch (err) {
          setError("Échec du téléchargement de l'image");
          console.error("Upload failed:", err);
        } finally {
          setLoading(false);
        }
      }
    } catch (err) {
      setError("Impossible d'accéder à la galerie");
      console.error("Image picker error:", err);
    }
  };

  return (
    <View className="w-full">
      {value ? (
        <View className="relative">
          <Image
            source={{ uri: value }}
            className="w-full h-48 rounded-lg"
            resizeMode="cover"
          />
          <View className="absolute top-2 right-2 flex-row gap-2">
            <TouchableOpacity
              onPress={pickImage}
              className="bg-white rounded-full p-2"
            >
              <MaterialIcons name="edit" size={20} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onChange("")}
              className="bg-white rounded-full p-2"
            >
              <MaterialIcons name="delete" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View className="min-h-28">
          <Button
            onPress={pickImage}
            variant="outline"
            disabled={loading}
            className="min-h-28 flex items-center justify-center border-dashed"
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
              <View className="items-center">
                <MaterialIcons
                  name="add-photo-alternate"
                  size={24}
                  color="#666"
                />
                <Text className="text-gray-500 mt-2">{placeholder}</Text>
              </View>
            )}
          </Button>
        </View>
      )}
      {error && <Text className="text-red-500 mt-1 text-sm">{error}</Text>}
    </View>
  );
};
