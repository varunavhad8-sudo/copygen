import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

// Simple bootstrapper to ensure no crashes during init
const container = document.getElementById('root');
if (!container) {
  console.error('Fatal: Root container not found');
} else {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}
