import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { installFetchTransactionInterceptor } from './utils/transactionTracking';
import './styles/global.css';

installFetchTransactionInterceptor();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
