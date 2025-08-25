// src/index.js
import React from 'react'; //
import { createRoot } from 'react-dom/client'; //
import { BrowserRouter as Router } from 'react-router-dom'; //
import App from './App'; //
import { AuthProvider } from './contexts/AuthContext'; //
import { MaterialsProvider } from './contexts/MaterialsContext'; //
import { LabourProvider } from './contexts/LabourContext'; //
import { CustomersProvider } from './contexts/CustomersContext'; //
import { ColorKeywordsProvider } from './contexts/ColorKeywordsContext'; //
import './index.css'; //

const container = document.getElementById('root'); //
const root = createRoot(container); //

root.render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <ColorKeywordsProvider>
          <CustomersProvider>
            <MaterialsProvider>
              <LabourProvider>
                <App />
              </LabourProvider>
            </MaterialsProvider>
          </CustomersProvider>
        </ColorKeywordsProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
); //