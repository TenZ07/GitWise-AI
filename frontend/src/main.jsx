import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import CustomCursor from './components/CustomCursor';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CustomCursor />
    <App />
  </React.StrictMode>,
)