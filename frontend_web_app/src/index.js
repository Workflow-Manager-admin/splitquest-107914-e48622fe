import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <React.Suspense fallback={<div style={{textAlign:"center",padding:"2rem"}}>Loading app…</div>}>
      <App />
    </React.Suspense>
  </React.StrictMode>
);
