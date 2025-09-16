import MortgageRecastCalculator from "./components/MortgageRecastCalculator";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ConfigurationsProvider } from "./contexts/ConfigurationsContext";

function App() {
  return (
    <ErrorBoundary
      onError={(error: Error, errorInfo: React.ErrorInfo) => {
        console.error('App Error Boundary caught an error:', error, errorInfo);
        // In a real app, you might want to send this to an error reporting service
      }}
    >
      <ConfigurationsProvider>
        <MortgageRecastCalculator />
      </ConfigurationsProvider>
    </ErrorBoundary>
  );
}

export default App;