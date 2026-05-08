import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css';

// Ping the backend on load so Render's free tier wakes up before the user tries to log in
fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'}/auth/login`, { method: 'OPTIONS' }).catch(() => {});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
