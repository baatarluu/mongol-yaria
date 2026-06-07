import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthContext.jsx';
import { registerSW } from './pwa/install.js';
import './index.css';

registerSW();

// VITE_ROUTER=hash үед HashRouter ашиглана (GitHub Pages-ийн SPA deep-link
// 404 алдаанаас сэргийлнэ). Netlify/Vercel дээр default BrowserRouter — цэвэр URL.
const useHash = import.meta.env.VITE_ROUTER === 'hash';
const Router = useHash ? HashRouter : BrowserRouter;
const routerProps = useHash ? {} : { basename: import.meta.env.BASE_URL };

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router {...routerProps}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
