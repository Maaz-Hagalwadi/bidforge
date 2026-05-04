import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Ping the backend on load so Render's free tier wakes up before the user tries to log in
fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}/auth/login`, { method: 'OPTIONS' }).catch(() => {});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
