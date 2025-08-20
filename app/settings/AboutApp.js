

// app/settings/AboutApp.js
import { View, Text } from 'react-native';
import React from 'react';

export default function AboutApp() {
  return (
    <View className="flex-1 p-4">
      <Text className="text-lg font-bold mb-2">About This App</Text>
      <Text>Version: 1.2.3</Text>
      <Text>Made with ❤️ by Edunepal Team</Text>
    </View>
  );
}
