# Mortgage Recast Calculator

A React TypeScript application for calculating mortgage recast scenarios with extra payments and amortization schedules.

## Features

- **Mortgage Calculations**: Calculate monthly payments, interest, and principal breakdowns
- **Extra Payments**: Add lump sum payments at specific months
- **Recast Simulation**: Automatically recast loans when extra payments are made
- **Visual Charts**: Interactive balance over time charts using Recharts
- **Amortization Schedule**: Detailed month-by-month breakdown with CSV export
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS

## Development Setup

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Project Structure

```
src/
├── components/
│   └── MortgageRecastCalculator.tsx  # Main calculator component
├── App.tsx                           # Root app component
├── main.tsx                          # Application entry point
└── index.css                         # Global styles with Tailwind
```

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Usage

1. Enter your loan details (principal, interest rate, term)
2. Add extra payments for specific months
3. Configure recast options (automatic or manual)
4. View the amortization schedule and charts
5. Export results to CSV for further analysis

## Notes

This calculator is for planning purposes only and does not constitute financial advice. Actual loan terms and recast policies may vary by lender.