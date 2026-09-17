import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import 'katex/dist/katex.min.css'
import AnalyticsTracker from './analytics/Tracker'
import { AudienceProvider } from './lessons/AudienceContext'
import { readAudience } from './lessons/audience'

const root = document.getElementById('root')
if (!root) throw new Error('#root element missing from index.html')

// Decided once per page load; navigation inside the app keeps it.
const audience = readAudience(import.meta.env.DEV ? 'development' : 'production')

createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AudienceProvider audience={audience}>
        <AnalyticsTracker />
        <App />
      </AudienceProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
