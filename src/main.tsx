import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import IntroSequence from './IntroSequence'
import './styles.css'
import './refresh.css'
import './round2.css'
import './tv-animation.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <>
    <IntroSequence />
    <React.StrictMode><App /></React.StrictMode>
  </>,
)
