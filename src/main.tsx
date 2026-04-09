import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App.tsx'
import { AuthProvider } from './app/AuthContext.tsx'
import { ThemeProvider } from './ThemeProvider.tsx'
import { Toaster } from 'sonner'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <Toaster position="top-center" richColors />
        <App />
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
);