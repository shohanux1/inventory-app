import { Stack } from "expo-router";

export default function InventoryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="stock-history" />
      <Stack.Screen name="stock-history-details" />
    </Stack>
  );
}