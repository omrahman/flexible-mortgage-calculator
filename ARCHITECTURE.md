# Architecture Overview

This document outlines the refactored architecture of the Mortgage Recast Calculator application.

## Project Structure

```
src/
├── components/           # React components
│   ├── MortgageRecastCalculator.tsx  # Main orchestrating component
│   ├── LoanInputs.tsx               # Loan parameter inputs
│   ├── ExtraPayments.tsx            # Extra payments management
│   ├── SummarySection.tsx           # Summary cards display
│   ├── BalanceChart.tsx             # Balance over time chart
│   ├── AmortizationTable.tsx        # Amortization schedule table
│   ├── SummaryCard.tsx              # Individual summary card
│   ├── TableComponents.tsx          # Reusable table components
│   └── index.ts                     # Component exports
├── hooks/               # Custom React hooks
│   ├── useMortgageCalculation.ts    # Main business logic hook
│   └── index.ts                     # Hook exports
├── utils/               # Utility functions
│   ├── formatters.ts                # Number and currency formatting
│   ├── calculations.ts              # Mortgage calculation logic
│   ├── csv.ts                       # CSV export utilities
│   └── index.ts                     # Utility exports
├── types/               # TypeScript type definitions
│   └── index.ts                     # All type definitions
├── constants/           # Application constants
│   └── index.ts                     # Configuration constants
├── App.tsx              # Root application component
├── main.tsx             # Application entry point
└── index.css            # Global styles
```

## Architecture Principles

### 1. **Separation of Concerns**
- **Components**: Pure UI components with minimal business logic
- **Hooks**: Encapsulate state management and business logic
- **Utils**: Pure functions for calculations and data manipulation
- **Types**: Centralized type definitions for type safety

### 2. **Single Responsibility Principle**
Each file has a single, well-defined purpose:
- `LoanInputs.tsx` - Only handles loan parameter input
- `ExtraPayments.tsx` - Only manages extra payment inputs
- `BalanceChart.tsx` - Only renders the balance chart
- `useMortgageCalculation.ts` - Only manages calculation state and logic

### 3. **Composition over Inheritance**
Components are composed together rather than using inheritance:
- Main component orchestrates smaller, focused components
- Reusable components like `SummaryCard` and `TableComponents`

### 4. **Custom Hooks for Logic Reuse**
- `useMortgageCalculation` encapsulates all calculation-related state and logic
- Makes the main component clean and focused on rendering
- Logic can be easily tested and reused

### 5. **Type Safety**
- All interfaces and types defined in `src/types/index.ts`
- Proper TypeScript throughout the application
- No `any` types used

## Component Hierarchy

```
MortgageRecastCalculator (Main)
├── LoanInputs
├── ExtraPayments
├── SummarySection
│   └── SummaryCard (multiple instances)
├── BalanceChart
└── AmortizationTable
    ├── Th (table header)
    └── Td (table data)
```

## Data Flow

1. **User Input** → Components capture user interactions
2. **State Updates** → `useMortgageCalculation` hook manages state
3. **Calculations** → Utility functions perform calculations
4. **Results** → Components receive props and render results
5. **Side Effects** → CSV download, chart updates, etc.

## Benefits of This Architecture

### **Maintainability**
- Each file is focused and easy to understand
- Changes to one feature don't affect others
- Clear separation between UI and business logic

### **Testability**
- Pure functions in utils are easy to unit test
- Custom hooks can be tested independently
- Components can be tested with mock props

### **Reusability**
- Components like `SummaryCard` can be reused
- Utility functions can be used across the app
- Custom hooks can be shared between components

### **Scalability**
- Easy to add new features by creating new components
- Business logic is centralized in hooks
- Type definitions make refactoring safe

### **Developer Experience**
- Clear file organization makes navigation easy
- TypeScript provides excellent IDE support
- Consistent patterns across the codebase

## Key Design Decisions

1. **Custom Hook Pattern**: Centralized business logic in `useMortgageCalculation`
2. **Component Composition**: Breaking down large component into focused pieces
3. **Utility Separation**: Pure functions separated from React components
4. **Type-First**: TypeScript interfaces defined before implementation
5. **Constants Management**: Configuration values centralized and typed

This architecture follows React best practices and makes the codebase maintainable, testable, and scalable.
