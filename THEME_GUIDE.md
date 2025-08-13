# Theme Customization Guide

This guide explains how to customize the color theme for the entire application.

## How to Change Colors

### 1. Main Theme Configuration
All theme colors are centralized in two files:

**`tailwind.config.js`** - Tailwind CSS theme configuration
**`src/constants/theme.ts`** - Theme constants for components that need direct hex values

### 2. Updating Colors

To change the app's color scheme, update the colors in **both** files:

#### In `tailwind.config.js`:
```javascript
colors: {
  primary: {
    500: '#YOUR_PRIMARY_COLOR',    // Main primary color
    600: '#YOUR_PRIMARY_DARK',     // Dark primary color
  },
  secondary: {
    500: '#YOUR_SECONDARY_COLOR',  // Main secondary color
    600: '#YOUR_SECONDARY_ACCENT', // Secondary accent
    700: '#YOUR_SECONDARY_DARK',   // Secondary dark
  },
}
```

#### In `src/constants/theme.ts`:
```typescript
export const THEME_COLORS = {
  primary: {
    500: '#YOUR_PRIMARY_COLOR',    // Must match tailwind.config.js
    600: '#YOUR_PRIMARY_DARK',     // Must match tailwind.config.js
  },
  secondary: {
    500: '#YOUR_SECONDARY_COLOR',  // Must match tailwind.config.js
    600: '#YOUR_SECONDARY_ACCENT', // Must match tailwind.config.js
    700: '#YOUR_SECONDARY_DARK',   // Must match tailwind.config.js
  },
}
```

### 3. Current Theme Colors

#### Primary Colors:
- **Primary 500**: `#4C9B6F` (Main green color)
- **Primary 600**: `#1A5E3A` (Dark green color)

#### Secondary Colors:
- **Secondary 500**: `#A8D4B9` (Light green color)
- **Secondary 600**: `#569099` (Teal accent)
- **Secondary 700**: `#3F838E` (Dark teal)

### 4. Components Using Theme Colors

The following components automatically use the centralized theme:

#### UI Components:
- `Button.tsx` - All button variants
- `Input.tsx` - Focus states
- `Select.tsx` - Focus states  
- `Modal.tsx` - Header text
- `StatCard.tsx` - Background colors
- `Table.tsx` - Loading spinner

#### Pages:
- `Login.tsx` - Background gradients, text colors, links
- `Dashboard.tsx` - Charts, headings, icons, loading spinners
- `Services.tsx` - Icons, headings, form focus states
- `Departments.tsx` - Icons, headings, form focus states

### 5. Adding New Colors

To add new theme colors:

1. Add to `tailwind.config.js` in the `colors.extend` section
2. Add to `src/constants/theme.ts` 
3. Export as constants for use in components that need hex values
4. Use Tailwind classes in components for automatic theming

### 6. Example: Changing to Blue Theme

To change from green to blue:

```javascript
// tailwind.config.js
primary: {
  500: '#3B82F6', // Blue-500
  600: '#1D4ED8', // Blue-700
}
```

```typescript
// src/constants/theme.ts  
primary: {
  500: '#3B82F6', // Must match tailwind.config.js
  600: '#1D4ED8', // Must match tailwind.config.js
}
```

After making these changes, the entire app will automatically use the new blue color scheme!

### 7. Development Tips

- Always keep `tailwind.config.js` and `src/constants/theme.ts` in sync
- Use Tailwind classes (e.g., `bg-primary-500`) instead of hardcoded hex values
- Test your changes by running the development server: `npm run dev`
- Use browser developer tools to inspect if colors are applied correctly
