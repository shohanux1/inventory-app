import { Stack } from 'expo-router';

export default function ProductsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add-product" />
      <Stack.Screen name="product-details/[id]" />
    </Stack>
  );
}