import { CalendarDays, Clock3, MapPin } from 'lucide-react'

type BroadcastTelevisionProps = {
  className?: string
  copy?: string
  cursor?: boolean
  mode?: 'copy' | 'details' | 'blank'
}

export default function BroadcastTelevision({
  className = '',
  copy = '',
  cursor = false,
  mode = 'details',
}: BroadcastTelevisionProps) {
  return (
    <div className={`broadcast-tv broadcast-tv-mode-${mode} ${className}`} data-ui>
      <div className="broadcast-tv-set">
        <img
          className="broadcast-tv-image"
          src="/images/tv/left-facing-crt.png"
          alt=""
          aria-hidden="true"
        />

        <div className="broadcast-tv-screen">
          <div className="broadcast-tv-copy" aria-hidden={mode !== 'copy'}>
            <p>{copy}{cursor && <span className="broadcast-tv-cursor" />}</p>
          </div>

          <div className="broadcast-tv-program" aria-hidden={mode !== 'details'}>
            <strong>Totem Park<br />Networking Night</strong>
            <div className="broadcast-tv-program-date"><b>24</b><span>NOV</span></div>
            <div className="broadcast-tv-program-facts">
              <span><CalendarDays /> Tuesday, Nov 24</span>
              <span><Clock3 /> 6–8 PM</span>
              <span><MapPin /> Totem Park Ballroom</span>
            </div>
          </div>

          <span className="broadcast-tv-glass" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
