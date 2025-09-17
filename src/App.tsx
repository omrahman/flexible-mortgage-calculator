import { Routes, Route } from "react-router-dom";
import MortgageCalculator from "./components/MortgageCalculator";
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
        <Routes>
          <Route path="/" element={<MortgageCalculator />} />
          <Route path="/share/:encodedConfig" element={<MortgageCalculator />} />
        </Routes>
      </ConfigurationsProvider>
    </ErrorBoundary>
  );
}

export default App;