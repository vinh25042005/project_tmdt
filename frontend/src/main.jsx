import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

console.log('>>> [VN-MarketMap] main.jsx mounting App to #root...');

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
    console.log('>>> [VN-MarketMap] Render called successfully!');
  } catch (err) {
    console.error('>>> [VN-MarketMap] Error in main.jsx:', err);
    rootElement.innerHTML = `<div style="color:red;padding:20px;font-family:sans-serif;"><h2>Lỗi khởi động:</h2><pre>${err.message}\n${err.stack}</pre></div>`;
  }
} else {
  console.error('>>> [VN-MarketMap] Root element not found!');
}
