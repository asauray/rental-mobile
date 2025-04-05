import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateBrand, DayOpenHours } from "../types/brand";
import { BrandApi } from "../api/brand_api";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { router } from "expo-router";
import { ImageUpload } from "../components/ui/image-upload";

interface CreateBrandFormProps {
  tenant: number;
  currentUser: FirebaseAuthTypes.User;
}

interface TimeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const TimeInput = ({ label, value, onChange }: TimeInputProps) => (
  <View className="flex-1">
    <Text className="text-sm mb-1">{label}</Text>
    <Input
      value={value}
      onChangeText={onChange}
      placeholder="HH:MM"
      keyboardType="numbers-and-punctuation"
    />
  </View>
);

const DayOpenHoursInput = ({
  day,
  hours,
  onChange,
}: {
  day: string;
  hours: DayOpenHours;
  onChange: (hours: DayOpenHours) => void;
}) => (
  <View className="mb-4">
    <Text className="font-semibold mb-2">{day}</Text>
    <View className="flex-row gap-4">
      <TimeInput
        label="Ouverture"
        value={hours.open}
        onChange={(open) => onChange({ ...hours, open })}
      />
      <TimeInput
        label="Fermeture"
        value={hours.close}
        onChange={(close) => onChange({ ...hours, close })}
      />
    </View>
  </View>
);

export const CreateBrandForm = ({
  tenant,
  currentUser,
}: CreateBrandFormProps) => {
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState("");
  const [logo, setLogo] = useState("");
  const [humanReadableId, setHumanReadableId] = useState("");
  const [images, setImages] = useState({
    image1: "",
    image2: "",
    image3: "",
    image4: "",
  });
  const [openHours, setOpenHours] = useState({
    monday: { open: "", close: "" },
    tuesday: { open: "", close: "" },
    wednesday: { open: "", close: "" },
    thursday: { open: "", close: "" },
    friday: { open: "", close: "" },
    saturday: { open: "", close: "" },
    sunday: { open: "", close: "" },
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const createBrandDto: CreateBrand = {
        brand,
        logo,
        humanReadableId,
        imageSet: images,
        openHours,
      };

      await BrandApi.createBrand(createBrandDto, tenant, currentUser, () =>
        auth().signOut()
      );

      // Navigate back after successful creation
      router.back();
    } catch (error) {
      console.error("Failed to create brand:", error);
      // You might want to show an error message to the user here
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="h-full">
      <View className="flex flex-wrap h-full justify-center p-4 gap-4">
        <View>
          <Text className="text-lg font-semibold mb-4">
            Informations de base
          </Text>
          <Input
            placeholder="Nom de l'espace de coworking"
            value={brand}
            onChangeText={setBrand}
          />
          <View className="mt-2">
            <Text className="text-sm mb-2">Logo</Text>
            <ImageUpload
              value={logo}
              onChange={setLogo}
              placeholder="Sélectionner un logo"
              currentUser={currentUser}
              signOut={() => auth().signOut()}
            />
          </View>
          <Input
            placeholder="Identifiant public (pour créer votre propre site)"
            value={humanReadableId}
            onChangeText={setHumanReadableId}
            className="mt-2"
          />
        </View>

        <View>
          <Text className="text-lg font-semibold mb-4">Images</Text>
          <View className="space-y-4">
            {[1, 2, 3, 4].map((num) => (
              <View key={num}>
                <Text className="text-sm mb-2">Image {num}</Text>
                <ImageUpload
                  value={images[`image${num}` as keyof typeof images]}
                  onChange={(url) =>
                    setImages({ ...images, [`image${num}`]: url })
                  }
                  placeholder={`Sélectionner l'image ${num}`}
                  currentUser={currentUser}
                  signOut={() => auth().signOut()}
                />
              </View>
            ))}
          </View>
        </View>

        <View>
          <Text className="text-lg font-semibold mb-4">
            Horaires d'ouverture
          </Text>
          {Object.entries(openHours).map(([day, hours]) => (
            <DayOpenHoursInput
              key={day}
              day={day.charAt(0).toUpperCase() + day.slice(1)}
              hours={hours}
              onChange={(newHours) =>
                setOpenHours({ ...openHours, [day]: newHours })
              }
            />
          ))}
        </View>

        <Button
          onPress={handleSubmit}
          disabled={loading}
          className="w-full mt-4 mb-8"
        >
          <Text className="text-white">
            {loading ? "Création en cours..." : "Créer l'espace de coworking"}
          </Text>
        </Button>
      </View>
    </ScrollView>
  );
};
