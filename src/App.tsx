import MortgageRecastCalculator from "./components/MortgageRecastCalculator";
import { ErrorBoundary } from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('App Error Boundary caught an error:', error, errorInfo);
        // In a real app, you might want to send this to an error reporting service
      }}
    >
      <MortgageRecastCalculator />
    </ErrorBoundary>
  );
}

export default App;