# GitHub Copilot Instructions

## Project Overview
Government Agency Booking System Admin Portal - A React TypeScript application for managing government service appointments with role-based access control (Admin vs Officer).

## Architecture Patterns
- API Documention *API Documentation.md* - Detailed API endpoints and usage. Don't forget to update this as the API evolves. Feel free to change UI according to API changes.
- Project Details : Readme.md - Overview of the project structure, setup instructions, and development guidelines. Read 

### State Management
- **Zustand stores**: `authStore.ts` (auth/user) and `appStore.ts` (global data)
- **Persistence**: Auth state persists with key `'gov-portal-auth'`
- **Pattern**: Use `useAuthStore()` and `useAppStore()` hooks, avoid direct store manipulation

### Role-Based Access Control
```typescript
// Standard pattern for role checking
const user = useAuthStore((state) => state.user);
const isAdmin = user?.role === 'admin';

// Route protection in AppRoutes.tsx
<AdminRoute> // Admin-only pages (departments, services)
<ProtectedRoute> // Auth-required (both admin/officer)
```

### UI Component System
- **Location**: `src/components/ui/` - reusable components with consistent API
- **Styling**: Tailwind CSS with centralized theme in `tailwind.config.js` + `src/constants/theme.ts`
- **Pattern**: All components use `variant`, `size`, `loading` props where applicable
- **Icons**: Lucide React (already optimized in vite.config.ts)

### Data Flow & Types
- **Types**: All interfaces in `src/types/index.ts` - extend these, don't create new files
- **Relationships**: Entities use optional nested objects (e.g., `appointment.citizen?`, `service.department?`)
- **Status enums**: Use exact string literals from type definitions

## Key Development Patterns

### Page Structure
```typescript
// Standard page component pattern
export const PageName: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  
  // Role-based data filtering
  const filteredData = isAdmin ? allData : userDepartmentData;
  
  // Statistics cards + filters + table/content
  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {/* Filters */}
      {/* Main Content */}
    </div>
  );
};
```

### Modal Patterns
- Use `Modal` component from `ui/Modal.tsx`
- Follow view/edit modal pattern from `Appointments.tsx`
- Handle state with `useState` for modal open/close and selected items

### Table Implementation
- Use `Table` component from `ui/Table.tsx` 
- Define columns with `cell` functions for custom rendering
- Include action buttons (view/edit) in last column

## Theme Customization
- **CRITICAL**: Update colors in BOTH `tailwind.config.js` AND `src/constants/theme.ts`
- Use Tailwind classes (`bg-primary-500`) for components, hex values from theme.ts for libraries like Recharts
- Current theme: Government green (#4C9B6F primary, #A8D4B9 secondary)

## Development Workflow
```bash
npm run dev    # Development server (Vite)
npm run build  # Production build
npm run lint   # ESLint check
```

## Integration Points
- **Charts**: Recharts with colors from `CHART_COLORS` array
- **Forms**: React Hook Form + Zod validation (already configured)
- **Routing**: React Router with nested protection routes
- **Authentication**: JWT token stored in Zustand with persistence

## Naming Conventions
- **Files**: PascalCase for components, camelCase for utilities
- **API**: Snake_case field names (matches backend - `citizen_id`, `date_time`, etc.)
- **Constants**: UPPER_SNAKE_CASE in `constants/theme.ts`

## API
- Don't use mock data - integrate with real API endpoints.
- Use API Documentation.md for API Endpoints and Usage.


## Quick Wins
- Extend existing UI components rather than creating new ones
- Copy filtering/search patterns from `Appointments.tsx`
- Use `StatCard` component for metrics display
- Follow the layout pattern: Statistics → Filters → Table/Content
