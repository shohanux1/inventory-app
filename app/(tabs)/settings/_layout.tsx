import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="brands" />
      <Stack.Screen name="customers" />
      <Stack.Screen name="sales-history" />
      <Stack.Screen name="security" />
      <Stack.Screen name="support" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="terms" />
    </Stack>
  );
}