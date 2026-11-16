import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from 'react'
import BroadcastTelevision from './BroadcastTelevision'

const INTRO_SEEN_KEY = 'totem-networking-tv-intro-seen-v3'

type IntroStage = 'establish' | 'zoom' | 'screen' | 'return' | 'exit'

type LandingGeometry = {
  left: number
  top: number
  width: number
  height: number
  zoomX: number
  zoomY: number
  zoomScale: number
}

const wait = (milliseconds: number) =>
  new Promise<void>(resolve => window.setTimeout(resolve, milliseconds))

function shouldShowIntro() {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  if (params.has('skipIntro')) return false
  if (params.has('replayIntro')) return true
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  return window.sessionStorage.getItem(INTRO_SEEN_KEY) !== 'true'
}

export default function IntroSequence() {
  const [visible, setVisible] = useState(shouldShowIntro)
  const [stage, setStage] = useState<IntroStage>('establish')
  const [copy, setCopy] = useState('')
  const [landing, setLanding] = useState<LandingGeometry | null>(null)
  const finishTimer = useRef<number | null>(null)

  useLayoutEffect(() => {
    if (!visible) return

    const syncLanding = () => {
      const television = document.querySelector<HTMLElement>('.hero-television')
      if (!television) return
      const rect = television.getBoundingClientRect()
      const screenWidth = rect.width * .468
      const screenHeight = rect.height * .68
      const zoomScale = Math.max(
        (window.innerWidth * 1.05) / screenWidth,
        (window.innerHeight * 1.05) / screenHeight,
      )
      const screenCenterX = rect.left + rect.width * .391
      const screenCenterY = rect.top + rect.height * .485
      setLanding({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        zoomX: window.innerWidth / 2 - screenCenterX,
        zoomY: window.innerHeight / 2 - screenCenterY,
        zoomScale,
      })
    }

    document.body.classList.add('tv-intro-active')
    syncLanding()
    const television = document.querySelector<HTMLElement>('.hero-television')
    const resizeObserver = television ? new ResizeObserver(syncLanding) : null
    if (television) resizeObserver?.observe(television)
    const animationFrame = window.requestAnimationFrame(syncLanding)
    window.addEventListener('resize', syncLanding)
    return () => {
      document.body.classList.remove('tv-intro-active')
      resizeObserver?.disconnect()
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', syncLanding)
    }
  }, [visible])

  useEffect(() => {
    if (!visible) return

    let cancelled = false
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const pause = async (milliseconds: number) => {
      await wait(milliseconds)
      return !cancelled
    }

    const type = async (text: string, speed: number) => {
      let current = ''
      setCopy('')
      for (const character of Array.from(text)) {
        if (cancelled) return false
        current += character
        setCopy(current)
        if (!(await pause(speed))) return false
      }
      return true
    }

    const erase = async (text: string, speed: number) => {
      let current = text
      while (current.length && !cancelled) {
        current = current.slice(0, -1)
        setCopy(current)
        if (!(await pause(speed))) return false
      }
      return !cancelled
    }

    const say = async (text: string, hold: number) => {
      if (!(await type(text, 42))) return false
      if (!(await pause(hold))) return false
      return erase(text, 15)
    }

    const play = async () => {
      if (!(await pause(1450))) return
      setStage('zoom')
      if (!(await pause(1550))) return
      setStage('screen')
      setCopy('')
      if (!(await pause(320))) return

      const opening = 'Are you a first-year student?'
      if (!(await say(opening, 1350))) return

      if (!(await say('Curious about internships?', 850))) return
      if (!(await say('Research experience?', 850))) return
      if (!(await say('Networking?', 720))) return
      if (!(await say('Clubs?', 650))) return
      if (!(await say('How to get involved?', 850))) return
      if (!(await say('Or just what to do next?', 1050))) return

      if (!(await pause(1800))) return
      if (!(await type('Come to Totem Park Networking Night.', 44))) return
      if (!(await pause(1900))) return

      setStage('return')
      if (!(await pause(1650))) return
      window.sessionStorage.setItem(INTRO_SEEN_KEY, 'true')
      setStage('exit')
      if (!(await pause(480))) return
      setVisible(false)
    }

    void play()

    return () => {
      cancelled = true
      document.body.style.overflow = previousOverflow
      if (finishTimer.current !== null) window.clearTimeout(finishTimer.current)
    }
  }, [visible])

  const skip = () => {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, 'true')
    setStage('exit')
    finishTimer.current = window.setTimeout(() => setVisible(false), 360)
  }

  if (!visible) return null

  const wrapperStyle = landing ? {
    left: landing.left,
    top: landing.top,
    width: landing.width,
    height: landing.height,
    '--intro-zoom-x': `${landing.zoomX}px`,
    '--intro-zoom-y': `${landing.zoomY}px`,
    '--intro-zoom-scale': landing.zoomScale,
  } as CSSProperties : undefined

  return (
    <div className={`intro-sequence intro-${stage} ${landing ? 'intro-ready' : ''}`} aria-label="Totem Park Networking Night introduction">
      <div className="intro-tv-wrap" style={wrapperStyle} aria-hidden="true">
        <BroadcastTelevision
          mode={stage === 'establish' ? 'details' : 'blank'}
        />
      </div>
      <div className="intro-screen-copy" aria-hidden="true">
        <p data-copy={copy}>
          <span className="intro-screen-copy-main">{copy}</span>
          {stage === 'screen' && <span className="intro-screen-cursor" />}
        </p>
      </div>
      <p className="intro-sr-only">Are you a first-year student? Curious about internships, research, networking, clubs, or getting involved? Come to Totem Park Networking Night.</p>
      <button className="intro-skip" type="button" onClick={skip}>Skip intro</button>
    </div>
  )
}
