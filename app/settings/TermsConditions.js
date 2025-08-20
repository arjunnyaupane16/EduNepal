// app/settings/TermsConditions.js
import { View, Text, ScrollView } from 'react-native';
import React from 'react';

export default function TermsConditions() {
  return (
    <ScrollView className="flex-1 p-4">
      <Text className="text-lg font-bold mb-2">Terms & Conditions</Text>
      <Text>Full text of Terms and Conditions goes here...</Text>
    </ScrollView>
  );
}
