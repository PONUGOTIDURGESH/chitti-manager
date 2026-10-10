import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import App from './App.tsx';
import { installToastAlerts } from './lib/notify';
import './index.css';

installToastAlerts();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
      richColors
      closeButton
      position="top-center"
      toastOptions={{ style: { whiteSpace: 'pre-line' } }}
    />
  </StrictMode>
);