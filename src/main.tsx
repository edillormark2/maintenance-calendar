import '@fontsource-variable/public-sans'
import './styles.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { loadPortfolio } from './data/portfolio'
import { getToday } from './lib/today'

const root = document.getElementById('root')
if (!root) throw new Error('index.html needs an element with id="root"')

// Both are read once, when the page loads.
const portfolio = loadPortfolio()
const today = getToday(window.location.search, new Date())

createRoot(root).render(
  <StrictMode>
    <App portfolio={portfolio} today={today} />
  </StrictMode>,
)
