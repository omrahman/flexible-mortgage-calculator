# Application Architecture

This document provides a high-level overview of the architecture of the Flexible Mortgage Calculator application.

## Table of Contents

- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Component Architecture](#component-architecture)
- [State Management](#state-management)
- [Business Logic](#business-logic)
- [Data Flow](#data-flow)
- [Testing](#testing)

## Technology Stack

- **Framework:** [React](https://reactjs.org/) (using [Vite](https://vitejs.dev/) for the build tooling)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Testing:** [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

## Project Structure

The project follows a standard structure for a React application. The key directories are:

- `src/`: This directory contains all the source code for the application.
  - `components/`: Contains all the React components, which are the building blocks of the UI.
  - `constants/`: Stores constant values used throughout the application.
  - `contexts/`: Holds React Context providers for managing global state.
  - `hooks/`: Contains custom React hooks that encapsulate reusable logic and state management.
  - `logic/`: Includes the core business logic for mortgage calculations, decoupled from the UI.
  - `types/`: Defines TypeScript types and interfaces.
  - `utils/`: A set of utility functions for tasks like calculations, formatting, and validation.
- `src/__tests__/`: Contains tests for the different parts of the application.

## Component Architecture

The application is built with a component-based architecture. The main components are:

- `App.tsx`: The root component of the application. It sets up the error boundary and context providers.
- `MortgageCalculator.tsx`: The primary UI component that assembles all the other components to create the calculator interface.
- **Input Components:** (`LoanInputs.tsx`, `ExtraPayments.tsx`) for user data entry.
- **Display Components:** (`SummarySection.tsx`, `AmortizationTable.tsx`, `BalanceChart.tsx`) for showing the calculation results.

Heavy components like `AmortizationTable` and `BalanceChart` are lazy-loaded to improve the initial page load performance.

## State Management

The application employs a combination of React's built-in state management features and custom hooks:

- **React Context:** The `ConfigurationsContext` is used to manage and provide access to saved mortgage configurations across the application.
- **Custom Hooks:**
  - `useMortgageCalculation`: A central hook that manages the state of the calculator's inputs and orchestrates the mortgage calculations.
  - `useConfigurations`: A hook for interacting with the `ConfigurationsContext` to manage saved configurations.
  - `useLocalStorage`: A hook that persists state to the browser's `localStorage`, allowing user inputs to be saved between sessions.

This approach keeps the state management logic well-organized and decoupled from the UI components.

## Business Logic

The core business logic for mortgage calculations is intentionally separated from the React components and UI. This logic resides in `src/logic/mortgageLogic.ts`.

- **`mortgageLogic.ts`**: This file contains pure functions for performing calculations, such as determining the loan principal, calculating PITI, and generating amortization schedules.
- **`utils/calculations.ts`**: Contains the `buildSchedule` function, which is the heart of the amortization schedule generation.

By keeping the business logic separate, it is easier to test, maintain, and reason about.

## Data Flow

The data flow in the application is unidirectional, which is a core principle of React:

1.  **User Input:** The user enters data into the input components.
2.  **State Update:** The `onChange` event handlers in the input components call state update functions provided by the `useMortgageCalculation` hook.
3.  **Recalculation:** The state update triggers a recalculation of the mortgage schedule. This is done within the `useMortgageCalculation` hook, and the results are memoized for performance.
4.  **UI Update:** The new calculation results are passed as props to the display components, which then re-render to show the updated information to the user.

This ensures a predictable and easy-to-understand flow of data throughout the application.

## Testing

The project includes a suite of unit tests to ensure the correctness of the business logic and utility functions.

-   Tests for the core mortgage logic are located in `src/logic/__tests__/mortgageLogic.test.ts`.
-   Tests for utility functions can be found in `src/utils/__tests__/`.

The tests are written using Vitest and React Testing Library, which provide a modern and efficient testing framework.
