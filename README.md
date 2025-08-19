# Inventory Management App

A modern, minimalist inventory management application built with React Native and Expo.

## Features

### 📊 Dashboard
- Real-time inventory overview with key metrics
- Quick actions for common operations
- Low stock alerts and notifications
- Recent activity tracking

### 📦 Product Management
- List and grid view toggle for product catalog
- Advanced search and filtering capabilities
- Add, edit, and manage products
- Real-time stock status indicators
- Category-based organization

### 🔄 Inventory Operations
- Stock in/out tracking
- Transfer between locations
- Stock adjustments and corrections
- Transaction history with detailed logs
- Period-based filtering (Today, Week, Month, Year)

### ⚙️ Settings
- User profile management
- Preferences and notifications
- Dark/Light mode support
- Backup and sync options

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Language**: TypeScript
- **Backend**: Convex (ready for integration)
- **Styling**: StyleSheet with dynamic theming
- **Icons**: @expo/vector-icons (Ionicons)

## Design Philosophy

The app follows a modern minimalist design approach with:
- Clean, uncluttered interfaces
- Consistent spacing and typography
- Subtle shadows and borders
- Intuitive navigation patterns
- Color-coded status indicators

## Project Structure

```
app/
├── (auth)/          # Authentication screens
├── (tabs)/          # Main app tabs
│   ├── dashboard.tsx
│   ├── products.tsx
│   ├── inventory.tsx
│   └── settings.tsx
├── add-product.tsx  # Product creation
└── _layout.tsx      # Root layout

components/
├── ProductCard.tsx  # Reusable product card
├── SearchBar.tsx    # Search component
├── Button.tsx       # Custom button
├── Input.tsx        # Custom input
└── ...

constants/
└── Colors.ts        # Theme colors

convex/             # Backend configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator

### Installation

1. Clone the repository:
```bash
git clone https://github.com/shohanux1/inventory-app.git
cd inventory-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npx expo start
```

4. Run on your preferred platform:
- Press `i` for iOS
- Press `a` for Android
- Scan QR code with Expo Go app

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run in web browser
- `npm test` - Run tests

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Author

Created with ❤️ by [shohanux1](https://github.com/shohanux1)

---

Built with React Native, Expo, and modern development practices for efficient inventory management.