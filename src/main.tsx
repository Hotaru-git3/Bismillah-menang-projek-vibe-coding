import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FirebaseProvider } from './components/FirebaseProvider';

// DEPLOYMENT NOTE: Ensure the following headers are set on Cloud Run:
// Content-Security-Policy, X-Frame-Options: DENY,
// X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin

if (import.meta.env.PROD) {
  const noop = () => {};
  console.log = noop;
  console.error = noop;
  console.warn = noop;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirebaseProvider>
      <App />
    </FirebaseProvider>
  </StrictMode>,
);
