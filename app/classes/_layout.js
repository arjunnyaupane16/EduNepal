// app/classes/_layout.js
import { Stack } from 'expo-router';

export default function ClassesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
