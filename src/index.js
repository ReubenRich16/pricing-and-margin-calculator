// --- Entry Point for React App ---
// Renders the main App component into the root DOM node.
// Uses React 18+ createRoot API.
// Optionally imports global styles from index.css.

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Optional: Only if you have custom global styles

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
