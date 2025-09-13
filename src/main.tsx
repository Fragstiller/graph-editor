import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router';
import './index.css'
import App from './App.tsx'
import { StrictMode } from 'react';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename='/graph-editor'>
    <StrictMode>
      <App />
    </StrictMode>
  </BrowserRouter>
)
