// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { initializeFrontendLogger } from '../../backend/utils/frontendLogger.js'; // 🆕 Import logger

initializeFrontendLogger(); // 🆕 Init global error handler

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
