import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/jetbrains-mono/400.css';
import './styles/app.css';
import App from './app/App';
import { ErrorBoundary } from './components/primitives';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {/* Live external-store updates must not interrupt a deferred route switch. */}
      <BrowserRouter useTransitions={false}>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
