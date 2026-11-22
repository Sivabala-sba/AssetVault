# AssetVault

> Your home's memory for every bill, warranty, service, and renewal.

## Getting Started

```bash
# Install dependencies
npm install

# Start Expo dev server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator  
npm run android

# Run tests
npm test
```

## Project Structure

```
AssetVault/
├── app/                   # Expo Router screens
│   ├── _layout.tsx        # Root layout (DB init, theme, PaperProvider)
│   └── (tabs)/            # Bottom tab navigator
│       ├── _layout.tsx    # Tab bar configuration
│       ├── index.tsx      # Home screen
│       ├── assets.tsx     # Assets screen
│       ├── reminders.tsx  # Reminders screen
│       └── settings.tsx   # Settings screen
├── src/
│   ├── components/        # Reusable UI components
│   ├── constants/         # App-wide constants and category definitions
│   ├── data/              # Sample data
│   ├── db/                # SQLite client, migrations, repositories
│   ├── hooks/             # Custom React hooks
│   ├── i18n/              # Localisation (English + Tamil)
│   ├── logic/             # Pure business logic (warranty, formatting, etc.)
│   ├── store/             # Zustand state stores
│   ├── theme/             # Design tokens, light/dark themes
│   └── types/             # TypeScript interfaces
├── __tests__/             # Jest unit tests
└── __mocks__/             # Jest mocks (expo-sqlite, etc.)
```

## Running Tests

```bash
npm test
```

Tests cover:
- `src/logic/formatting.ts` — INR currency, Indian date, phone formatting
- `src/logic/warranty.ts` — Warranty status calculations

## Design System

- **Primary**: Blue #1A73E8 (trustworthy, calm)
- **Active**: Green #1E8E3E
- **Expiring Soon**: Amber #E37400  
- **Expired**: Red #C5221F
- Light and dark themes supported, respects system preference
- All text in `src/i18n/locales/en.json` (Tamil: `ta.json`)

## Indian Conventions

- Dates: DD MMM YYYY (e.g. 10 Jan 2026)
- Currency: ₹ with Indian grouping (e.g. ₹1,28,990)
- Phone: 98765 43210 or +91 98765 43210
