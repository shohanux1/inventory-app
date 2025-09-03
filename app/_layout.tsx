import { Slot } from "expo-router";
import { AuthProvider } from "../contexts/AuthContext";
import { ToastProvider } from "../contexts/ToastContext";
import { ProductProvider } from "../contexts/ProductContext";
import { InventoryProvider } from "../contexts/InventoryContext";
import { CustomerProvider } from "../contexts/CustomerContext";
import { CurrencyProvider } from "../contexts/CurrencyContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CurrencyProvider>
          <ProductProvider>
            <InventoryProvider>
              <CustomerProvider>
                <Slot />
              </CustomerProvider>
            </InventoryProvider>
          </ProductProvider>
        </CurrencyProvider>
      </ToastProvider>
    </AuthProvider>
  );
}