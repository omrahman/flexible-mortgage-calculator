# Flexible Mortgage Calculator

A powerful, open-source mortgage calculator that allows for flexible scenario planning, including extra payments, recasting, and shareable configurations.

## Features

- **Comprehensive Mortgage Calculations**: Calculates monthly PITI (Principal, Interest, Taxes, and Insurance), total interest, and loan amortization schedules.
- **Scenario Management**: Save and load multiple mortgage scenarios to compare different strategies.
- **Share via URL**: Share your mortgage scenarios with others through a compressed, URL-safe link.
- **Flexible Extra Payments**: Add one-time or recurring extra payments (monthly, annually) to see how they impact your loan.
- **Advanced Recasting**: Simulate loan recasting automatically after extra payments or on specific, manually-defined months.
- **Visual Charts & Tables**: Interactive charts to visualize your loan balance over time and a detailed amortization table.
- **CSV Export**: Download your amortization schedule as a CSV file for further analysis.
- **Responsive Design**: A clean, mobile-friendly interface built with Tailwind CSS.

## Development Setup

### Prerequisites

- Node.js (version 18 or higher)
- npm (comes with Node.js)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/flexible-mortgage-calculator.git
    cd flexible-mortgage-calculator
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

4.  Open your browser and navigate to `http://localhost:3000`.

### Available Scripts

-   `npm run dev`: Starts the development server.
-   `npm run build`: Builds the application for production.
-   `npm run preview`: Previews the production build locally.
-   `npm run test`: Runs tests using Jest.
-   `npm run lint`: Lints the code using ESLint.
-   `npm run format`: Formats the code with Prettier.

## Project Structure

```
src/
├── components/     # React components
├── constants/      # Application constants
├── contexts/       # React contexts
├── hooks/          # Custom React hooks
├── logic/          # Core business logic
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── App.tsx         # Root application component
└── main.tsx        # Application entry point
```

## Technology Stack

-   **Framework**: React 18
-   **Language**: TypeScript
-   **Build Tool**: Vite
-   **Styling**: Tailwind CSS
-   **UI Components**: Headless UI
-   **Routing**: React Router
-   **Charts**: Recharts
-   **Testing**: Jest & React Testing Library
-   **Linting/Formatting**: ESLint & Prettier

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

## License

This project is licensed under the MIT License.