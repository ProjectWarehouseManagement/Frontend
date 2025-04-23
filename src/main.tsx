import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { BrowserRouter } from 'react-router-dom';
import NavigationBar from './Navbar/navbar.tsx';
import { AuthProvider } from './AuthContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <NavigationBar />
        <App />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);