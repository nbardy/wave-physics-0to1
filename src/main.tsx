import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import 'katex/dist/katex.min.css'
import AnalyticsTracker from './analytics/Tracker'

const root = document.getElementById('root')
if (!root) throw new Error('#root element missing from index.html')

createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AnalyticsTracker />
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
