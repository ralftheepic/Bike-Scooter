// src/utils/frontendLogger.js

export function initializeFrontendLogger() {
    window.onerror = function (message, source, lineno, colno, error) {
      sendFrontendLog({
        level: 'error',
        message,
        source,
        lineno,
        colno,
        stack: error?.stack || 'No stack trace',
      });
    };
  
    window.onunhandledrejection = function (event) {
      sendFrontendLog({
        level: 'error',
        message: 'Unhandled promise rejection',
        reason: event.reason,
        stack: event.reason?.stack || 'No stack trace',
      });
    };
  }
  
  function sendFrontendLog(payload) {
    fetch('http://localhost:5000/api/frontend-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.warn('Failed to send frontend log', err);
    });
  }
  