
// app/settings/PrivacySettings.js
import { View, Text } from 'react-native';
import React from 'react';

export default function PrivacySettings() {
  return (
    <View className="flex-1 p-4">
      <Text className="text-lg font-semibold mb-2">Privacy Dashboard</Text>
      <Text>Manage your data, cookies, and sharing preferences here.</Text>
    </View>
  );
}
