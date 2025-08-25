// --- Entry Point for React App ---
// Renders the main App component into the root DOM node.
// Uses React 18+ createRoot API.
// Optionally imports global styles from index.css.

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// (Optional) You can now run testFirestoreWrite() in the browser console.
// Remove these two lines (import + window assignment) once done.



