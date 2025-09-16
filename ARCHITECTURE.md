# Architecture Overview

This document outlines the current architecture of the Mortgage Recast Calculator application, a React-based web application for calculating mortgage payments with recasting and extra payment scenarios.

## Technology Stack

- **Frontend Framework**: React 18.2.0 with TypeScript
- **Build Tool**: Vite 5.0.8
- **Styling**: Tailwind CSS 3.3.6
- **Charts**: Recharts 2.8.0
- **State Management**: React Context API + Custom Hooks
- **Persistence**: localStorage via custom hooks
- **Code Quality**: ESLint + Prettier

## Project Structure

```
src/
├── components/                    # React components
│   ├── MortgageRecastCalculator.tsx  # Main orchestrating component
│   ├── LoanInputs.tsx               # Loan parameter inputs (home price, down payment, rate, etc.)
│   ├── ExtraPayments.tsx            # Extra payments management with recurring support
│   ├── SummarySection.tsx           # Summary cards display
│   ├── PaymentSegments.tsx          # Payment timeline visualization
│   ├── BalanceChart.tsx             # Balance over time chart (Recharts)
│   ├── AmortizationTable.tsx        # Amortization schedule table
│   ├── SummaryCard.tsx              # Individual summary card component
│   ├── TableComponents.tsx          # Reusable table components (Th, Td)
│   ├── ConfigurationModal.tsx       # Modal for saving/editing configurations
│   ├── SavedConfigurations.tsx      # Configuration management interface
│   ├── SegmentedControl.tsx         # Reusable segmented control component
│   ├── ErrorBoundary.tsx            # Error boundary component
│   └── index.ts                     # Component exports
├── hooks/                      # Custom React hooks
│   ├── useMortgageCalculation.ts    # Main business logic and state management
│   ├── useLocalStorage.ts           # localStorage persistence hook
│   ├── useSavedConfigurations.ts    # Configuration management logic
│   └── index.ts                     # Hook exports
├── contexts/                   # React Context providers
│   └── ConfigurationsContext.tsx    # Configuration management context
├── utils/                      # Utility functions
│   ├── calculations.ts              # Core mortgage calculation algorithms
│   ├── formatters.ts                # Number and currency formatting
│   ├── csv.ts                       # CSV export utilities
│   ├── validation.ts                # Input validation functions
│   └── index.ts                     # Utility exports
├── types/                      # TypeScript type definitions
│   └── index.ts                     # All type definitions
├── constants/                  # Application constants
│   └── index.ts                     # Configuration constants and defaults
├── App.tsx                     # Root application component with providers
├── main.tsx                    # Application entry point
└── index.css                   # Global styles and Tailwind imports
```

## Architecture Patterns

### 1. **Context + Custom Hooks Pattern**
The application uses React Context API combined with custom hooks for state management:

- **`ConfigurationsContext`**: Manages saved loan configurations
- **`useMortgageCalculation`**: Central hook managing all calculation state and logic
- **`useSavedConfigurations`**: Handles configuration persistence
- **`useLocalStorage`**: Generic localStorage persistence hook

### 2. **Component Composition**
The main component orchestrates smaller, focused components:

```typescript
MortgageRecastCalculator (Main)
├── LoanInputs                    # Input form for loan parameters
├── ExtraPayments                 # Extra payment management
├── SavedConfigurations           # Configuration save/load interface
├── SummarySection                # Results summary cards
│   └── SummaryCard (multiple)    # Individual metric cards
├── BalanceChart                  # Recharts visualization
├── AmortizationTable             # Detailed payment schedule
└── PaymentSegments               # Payment timeline view
```

### 3. **Separation of Concerns**
- **Components**: Pure UI components with minimal business logic
- **Hooks**: Encapsulate state management and business logic
- **Utils**: Pure functions for calculations and data manipulation
- **Types**: Centralized TypeScript definitions
- **Contexts**: Cross-component state sharing

### 4. **Data Persistence Strategy**
- **localStorage**: User inputs and saved configurations
- **Migration Support**: Handles data structure changes gracefully
- **Caching**: Inputs are cached to preserve user data across sessions

## Data Flow

### 1. **User Input Flow**
```
User Input → Component → useMortgageCalculation → Calculations → Results → UI Update
```

### 2. **Configuration Management Flow**
```
User Action → SavedConfigurations → ConfigurationsContext → useSavedConfigurations → localStorage
```

### 3. **State Management Flow**
```
Component State → useMortgageCalculation → Calculations → Computed Values → Child Components
```

## Key Features

### **Mortgage Calculations**
- Principal and interest calculations with recasting
- Extra payment support (one-time and recurring)
- Property tax and insurance integration (PITI)
- Automatic recasting on extra payments
- Manual recasting at specified months

### **Data Visualization**
- Interactive balance chart using Recharts
- Payment segments timeline
- Comprehensive amortization table
- Summary metrics with comparison

### **Configuration Management**
- Save/load loan configurations
- Configuration editing and updates
- Unsaved changes tracking
- Data migration for backward compatibility

### **Export Capabilities**
- CSV export of amortization schedule
- Formatted data with proper currency formatting

## State Management Architecture

### **Primary State Hook: `useMortgageCalculation`**
This is the central state management hook that:
- Manages all input state (home price, rate, term, etc.)
- Handles extra payment management
- Performs calculations using utility functions
- Manages localStorage persistence
- Provides computed values to components

### **Configuration State: `ConfigurationsContext`**
- Manages saved loan configurations
- Provides CRUD operations for configurations
- Handles configuration loading and saving
- Tracks currently loaded configuration

### **Persistence Layer: `useLocalStorage`**
- Generic hook for localStorage operations
- Handles serialization/deserialization
- Provides migration support for data structure changes

## Type Safety

The application is fully typed with TypeScript:
- **Core Types**: `ExtraItem`, `Row`, `ScheduleResult`, `ScheduleParams`
- **UI Types**: `SummaryCardProps`, `TableCellProps`
- **Configuration Types**: `CachedInputs`, `SavedConfiguration`
- **Input Types**: `DownPaymentInput`, `RecurringFrequency`

## Error Handling

- **Error Boundary**: Catches and displays React errors gracefully
- **Input Validation**: Validates user inputs before calculations
- **Migration Safety**: Handles data structure changes without breaking the app
- **Calculation Guards**: Prevents infinite loops and invalid calculations

## Performance Considerations

### **Memoization**
- `useMemo` for expensive calculations
- `useCallback` for stable function references
- Computed values are memoized to prevent unnecessary recalculations

### **Component Optimization**
- Pure components where possible
- Minimal re-renders through proper prop management
- Efficient data structures for calculations

### **Bundle Optimization**
- Vite for fast builds and hot reload
- Tree shaking for unused code elimination
- Optimized imports and exports

## Build and Development

### **Development**
```bash
npm run dev          # Start development server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
```

### **Production**
```bash
npm run build        # Build for production
npm run preview      # Preview production build
```

## Key Design Decisions

1. **Custom Hook Pattern**: Centralized business logic in `useMortgageCalculation`
2. **Context for Cross-Cutting Concerns**: Configuration management via React Context
3. **Pure Utility Functions**: Calculations separated from React components
4. **Type-First Development**: TypeScript interfaces defined before implementation
5. **Progressive Enhancement**: Graceful handling of data migration and errors
6. **Component Composition**: Breaking down complex UI into focused, reusable components

## Benefits of This Architecture

### **Maintainability**
- Clear separation of concerns
- Focused, single-purpose components
- Centralized business logic
- Comprehensive type safety

### **Testability**
- Pure functions in utils are easily unit testable
- Custom hooks can be tested independently
- Components can be tested with mock props
- Clear data flow makes integration testing straightforward

### **Scalability**
- Easy to add new features by creating new components
- Business logic is centralized and reusable
- Type definitions make refactoring safe
- Context pattern allows for easy state sharing

### **Developer Experience**
- Clear file organization and naming conventions
- TypeScript provides excellent IDE support
- Consistent patterns across the codebase
- Hot reload for fast development iteration

This architecture follows React best practices and provides a solid foundation for a maintainable, testable, and scalable mortgage calculation application.