import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Mortgage Modeler',
        short_name: 'Mortgage Modeler',
        description: 'A flexible and powerful mortgage calculator to help you plan your home loan, amortization schedule, and extra payments.',
        theme_color: '#3b82f6',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    }),
    ...(process.env.ANALYZE ? [visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })] : [])
  ],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // React vendor chunk
          'react-vendor': ['react', 'react-dom'],
          
          // Recharts vendor chunk (likely the largest dependency)
          'recharts-vendor': ['recharts'],
          
          // Utility chunks
          'utils-calculations': ['./src/utils/calculations'],
          'utils-serialization': ['./src/utils/serialization', './src/utils/validation'],
          'utils-formatters': ['./src/utils/formatters', './src/utils/csv'],
          
          // Component chunks
          'components-charts': ['./src/components/BalanceChart'],
          'components-tables': ['./src/components/AmortizationTable', './src/components/TableComponents'],
          'components-forms': ['./src/components/LoanInputs', './src/components/ExtraPayments'],
          'components-summary': ['./src/components/SummarySection', './src/components/SummaryCard'],
          'components-saved': ['./src/components/SavedConfigurations', './src/components/ConfigurationModal'],
          
          // Hook chunks
          'hooks-mortgage': ['./src/hooks/useMortgageCalculation'],
          'hooks-config': ['./src/hooks/useConfigurations', './src/hooks/useSavedConfigurations'],
          'hooks-fields': ['./src/hooks/useField', './src/hooks/useInputField', './src/hooks/useNumberField'],
          'hooks-storage': ['./src/hooks/useLocalStorage']
        }
      }
    }
  }
})