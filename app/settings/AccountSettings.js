

// app/settings/AccountSettings.js
import { View, Text } from 'react-native';
import React from 'react';

export default function AccountSettings() {
  return (
    <View className="flex-1 p-4">
      <Text className="text-xl font-bold mb-4">Account: Alice Johnson</Text>
      <Text>Email: alice@example.com</Text>
    </View>
  );
}
