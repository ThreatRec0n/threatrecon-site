if (typeof window !== 'undefined') {
  console.log(
    '%c⚠ STOP',
    'color:#ff3b3b;background:#060a12;font-size:24px;font-weight:bold;padding:12px 24px;',
  )
  console.log(
    '%cThis browser feature is for developers only. ThreatRecon.io © All Rights Reserved.',
    'color:#5e9bff;background:#060a12;font-size:13px;padding:4px 12px;',
  )
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
/* Self-hosted fonts (no external Google Fonts request) */
import '@fontsource/geist-mono/400.css'
import '@fontsource/geist-mono/500.css'
import '@fontsource/geist-mono/700.css'
import '@fontsource-variable/bricolage-grotesque/index.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
