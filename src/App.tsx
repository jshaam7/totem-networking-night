import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDownAZ, ArrowRight, ArrowUpRight, Bookmark, BriefcaseBusiness, CalendarDays, Check, ChevronDown, Clock3, ExternalLink, GraduationCap, Heart, Linkedin, MapPin, Menu, RotateCcw, Search, SlidersHorizontal, Sparkles, X, Camera, UserPlus, ShieldCheck, Mail, Copy, MessageCircle, Navigation }  from 'lucide-react'
import profileData from './data/profiles.json'
import BroadcastTelevision from './BroadcastTelevision'

// EDIT HERE: change the resident RSVP form link in one place.
const RSVP_URL = 'https://forms.gle/BBkAb2iHsWVr68zU9'
const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=2525+West+Mall+Vancouver+BC+V6T+1W9'
// EDIT HERE: organizer contact data. Add Yash's Instagram URL when available.
const ORGANIZERS = [
  { name: 'Shaam Purushothaman Jayakumaran', role: 'SRA', location: '6th Floor, Nootka House', email: 'shaam.jayakumaran@ubc.ca', instagram: 'https://instagram.com/jshaam7', instagramHandle: '@jshaam7' },
  { name: 'Yash Vasdev', role: 'RA', location: 'Dene House', email: 'yash.vasdev@ubc.ca', instagram: 'https://instagram.com/yash_denera', instagramHandle: '@yash_denera' },
] as const

function OrganizerModal({onClose,returnFocus}:{onClose:()=>void;returnFocus:React.RefObject<HTMLButtonElement>}) {
  const dialogRef = useRef<HTMLElement>(null)
  const [copied,setCopied] = useState<string|null>(null)
  const confirmationTimer = useRef<ReturnType<typeof setTimeout>|null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  useEffect(()=>{
    const priorOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const dialog=dialogRef.current
    dialog?.querySelector<HTMLButtonElement>('.organizer-close')?.focus()
    const onKey = (event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();onCloseRef.current();return}
      if(event.key!=='Tab'||!dialog)return
      const all=Array.from(dialog.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(el=>el.getClientRects().length>0)
      if(!all.length){event.preventDefault();dialog.focus();return}
      const first=all[0],last=all[all.length-1]
      if(event.shiftKey&&(document.activeElement===first||!dialog.contains(document.activeElement))){event.preventDefault();last.focus()}
      else if(!event.shiftKey&&(document.activeElement===last||!dialog.contains(document.activeElement))){event.preventDefault();first.focus()}
    }
    document.addEventListener('keydown',onKey)
    return()=>{document.body.style.overflow=priorOverflow;document.removeEventListener('keydown',onKey);if(confirmationTimer.current)clearTimeout(confirmationTimer.current);requestAnimationFrame(()=>{const trigger=returnFocus.current;if(trigger&&trigger.getClientRects().length)trigger.focus();else document.querySelector<HTMLButtonElement>('.menu-toggle')?.focus()})}
  },[returnFocus])
  const copyEmail=async(email:string)=>{
    let copiedOk=false
    try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(email);copiedOk=true}}catch{/* fallback below */}
    if(!copiedOk){
      const input=document.createElement('textarea');input.value=email;input.setAttribute('readonly','');input.style.position='fixed';input.style.opacity='0';document.body.appendChild(input);input.select()
      try{copiedOk=document.execCommand('copy')}catch{/* user will see a failure message */}
      input.remove()
    }
    setCopied(copiedOk?email:'failed:'+email)
    if(confirmationTimer.current)clearTimeout(confirmationTimer.current)
    confirmationTimer.current=setTimeout(()=>setCopied(null),2000)
  }
  return <div className="organizer-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section ref={dialogRef} tabIndex={-1} className="organizer-modal" role="dialog" aria-modal="true" aria-labelledby="organizer-dialog-title" aria-describedby="organizer-dialog-intro">
    <button type="button" className="organizer-close" aria-label="Close contact organizers dialog" onClick={onClose}><X size={20}/></button>
    <span className="organizer-eyebrow">WE'RE HERE TO HELP</span><h2 id="organizer-dialog-title">Questions? <em>Ask the organizers.</em></h2><p id="organizer-dialog-intro">Not sure who to talk to, where to go, or what to expect? Send us a message!</p>
    <div className="organizer-list">{ORGANIZERS.map(person=><article className="organizer-person" key={person.email}><div className="organizer-person-top"><span className="organizer-person-avatar">{person.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</span><div><span className="organizer-role">{person.role}</span><h3>{person.name}</h3><p><MapPin size={14}/>{person.location}</p></div></div><div className="organizer-contact-line"><Mail size={16}/><a href={`mailto:${person.email}`}>{person.email}</a></div><div className="organizer-actions"><button type="button" className="organizer-copy" onClick={()=>void copyEmail(person.email)} aria-live="polite">{copied===person.email?<Check size={16}/>:<Copy size={16}/>} {copied===person.email?'Copied!':copied==='failed:'+person.email?'Copy unavailable':'Copy email'}</button><a className="organizer-send" href={`mailto:${person.email}`}><Mail size={16}/> Send email</a></div><div className="organizer-instagram"><MessageCircle size={15}/><span>Instagram:</span>{person.instagram?<a href={person.instagram} target="_blank" rel="noopener noreferrer">{person.instagramHandle||'Instagram'} <ExternalLink size={13}/></a>:<span className="organizer-coming-soon">coming soon</span>}</div></article>)}</div>
  </section></div>
}

type Profile = {
  id: string; name: string; fullName: string; status: string; title: string; organization: string;
  faculty: string; major: string; graduationYear: string; companies: string[]; roles: string[];
  industry: string; otherInterests: string; topics: string[]; advice: string; linkedin: string; isPlaceholder: boolean; photoUrl?: string
}
const seededProfiles = profileData as Profile[]
const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean))).sort((a,b) => a.localeCompare(b))

const initials = (name: string) => name.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase()
const palette = ['blue','peach','mint','lilac','gold','rose']
function Avatar({person,large=false}:{person:Profile;large?:boolean}) {
  const index = Math.max(0,person.name.length % palette.length)
  return <div className={`avatar ${palette[index % palette.length]} ${large?'avatar-lg':''}`} aria-hidden="true">{person.photoUrl?<img src={person.photoUrl} alt="" loading="lazy" referrerPolicy="no-referrer"/>:initials(person.name)}</div>
}
function SelectField({label,value,options,onChange}:{label:string;value:string;options:string[];onChange:(s:string)=>void}) {
  return <label className="select-field"><span>{label}</span><div className="select-wrap"><select value={value} onChange={e=>onChange(e.target.value)}><option value="">All {label.toLowerCase()}</option>{options.map(x=><option key={x} value={x}>{x}</option>)}</select><ChevronDown size={15}/></div></label>
}

type FormState={name:string;status:string;title:string;organization:string;faculty:string;major:string;graduationYear:string;companies:string;roles:string;industry:string;otherInterests:string;topics:string;advice:string;linkedin:string;publishConsent:boolean;linkedinConsent:boolean;website:string}
const startingForm:FormState={name:'',status:'',title:'',organization:'',faculty:'',major:'',graduationYear:'',companies:'',roles:'',industry:'',otherInterests:'',topics:'',advice:'',linkedin:'',publishConsent:false,linkedinConsent:false,website:''}
function ProfileForm({open,siteKey,onAdded}:{open:boolean;siteKey:string;onAdded:()=>Promise<void>}){
 const [form,setForm]=useState<FormState>(startingForm)
 const [photo,setPhoto]=useState('')
 const [error,setError]=useState('')
 const [sending,setSending]=useState(false)
 const [complete,setComplete]=useState(false)
 const [awaitingReview,setAwaitingReview]=useState(false)
 const token=useRef('')
 const widget=useRef<HTMLDivElement>(null)
 const initialized=useRef(false)
 const set=(key:keyof FormState,value:string|boolean)=>setForm(prev=>({...prev,[key]:value}))
 useEffect(()=>{
  if(!open||!siteKey||initialized.current||!widget.current)return;
  const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
  script.onload=()=>{const api=(window as unknown as {turnstile?:{render:(element:HTMLElement,options:Record<string,unknown>)=>void}}).turnstile;if(api&&widget.current){api.render(widget.current,{sitekey:siteKey,callback:(value:string)=>{token.current=value},'expired-callback':()=>{token.current=''},'error-callback':()=>{token.current=''}});initialized.current=true}};
  document.head.appendChild(script);
  return()=>{script.onload=null}
 },[open,siteKey])
 const photoChange=async(file?:File)=>{
  if(!file){setPhoto('');return}
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setError('Photo must be a JPG, PNG or WebP image.');return}
  if(file.size>1_500_000){setError('Photo must be smaller than 1.5 MB.');return}
  setError('');const reader=new FileReader();reader.onload=()=>setPhoto(String(reader.result||''));reader.readAsDataURL(file)
 }
 const send=async(event:React.FormEvent<HTMLFormElement>)=>{
  event.preventDefault();if(sending)return;setSending(true);setError('');
  try{
   const result=await fetch('/api/profiles',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,photoData:photo,turnstileToken:token.current})});
   const data=await result.json();if(!result.ok)throw Error(data.error||'Submission failed');
   setAwaitingReview(data.pending===true);setComplete(true);setForm(startingForm);setPhoto('');await onAdded();
  }catch(e){setError(e instanceof Error?e.message:'Something went wrong. Please try again.')}
  finally{setSending(false)}
 }
 return <section id="add-profile" className="add-profile-section"><div className="add-profile-inner"><div className="mini-heading"><span/> FOR UPPER-YEARS & NEW GRADS</div><h2>Been there? <em>Pass it on.</em></h2><p className="add-intro">Had a co-op, internship, or a few lessons worth sharing? Help a first-year feel a little more ready for what comes next. Your information will appear publicly once submitted.</p><p className="form-audience-note">This form is for upper-year UBC students and recent grads who want to be featured. First-year residents coming to the event? <a href={RSVP_URL} target="_blank" rel="noopener noreferrer">RSVP here <ExternalLink size={13}/></a>.</p>
 {!open?<div className="closed-notice"><ShieldCheck size={24}/><div><strong>Profile submissions are currently closed.</strong><p>The directory is read-only. You can still browse and save profiles.</p></div></div>:complete?<div className="success-notice" role="status"><Check size={30}/><div><h3>{awaitingReview?'Profile received — awaiting organizer review':'Your profile is published!'}</h3><p>{awaitingReview?'Thanks for sharing your experience! An organizer will review your submission before it appears in the directory.':'It now appears in the directory. Thank you for helping other UBC students.'}</p><button type="button" className="secondary-btn" onClick={()=>setComplete(false)}>Add another profile</button></div></div>:<form onSubmit={send} className="profile-form"><div className="form-grid">
 <label>Full name *<input required maxLength={100} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Alex Chen"/></label>
 <label>Current status *<select required value={form.status} onChange={e=>set('status',e.target.value)}><option value="">Choose one</option><option>Current student</option><option>Recent graduate</option><option>Working professional</option></select></label>
 <label>Current role / title<input maxLength={160} value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. Data Analyst Co-op"/></label>
 <label>Current company or organization<input maxLength={160} value={form.organization} onChange={e=>set('organization',e.target.value)}/></label>
 <label>UBC faculty *<select required value={form.faculty} onChange={e=>set('faculty',e.target.value)}><option value="">Choose faculty</option>{['Science','Applied Science','Arts','Commerce','Forestry','Land and Food Systems','Education','Other'].map(v=><option key={v}>{v}</option>)}</select></label>
 <label>Major / program *<input required maxLength={160} value={form.major} onChange={e=>set('major',e.target.value)} placeholder="e.g. Statistics"/></label>
 <label>Graduation year<input inputMode="numeric" maxLength={4} pattern="20[2-5][0-9]" value={form.graduationYear} onChange={e=>set('graduationYear',e.target.value)} placeholder="e.g. 2028"/></label>
 <label>Industry *<select required value={form.industry} onChange={e=>set('industry',e.target.value)}><option value="">Choose industry</option>{['Technology / AI / Data','Business / Consulting','Finance / Accounting','Government / Public Policy','Engineering','Healthcare / Life Sciences','Research / Academia','Marketing / Media','Environment / Sustainability','Other'].map(v=><option key={v}>{v}</option>)}</select></label>
 <label>Co-op / internship companies<small>Separate multiple companies with commas</small><input maxLength={600} value={form.companies} onChange={e=>set('companies',e.target.value)} placeholder="e.g. Microsoft, BC Public Service"/></label>
 <label>Co-op / internship roles<small>Same order as companies, separated by commas</small><input maxLength={600} value={form.roles} onChange={e=>set('roles',e.target.value)}/></label>
 <label>Topics students can ask you about<small>Separate topics with commas</small><input maxLength={600} value={form.topics} onChange={e=>set('topics',e.target.value)} placeholder="Interviews, applications, networking"/></label>
 <label>Other career interests<input maxLength={160} value={form.otherInterests} onChange={e=>set('otherInterests',e.target.value)}/></label>
 <label className="form-wide">Advice for first-year students<textarea rows={3} maxLength={400} value={form.advice} onChange={e=>set('advice',e.target.value)} placeholder="One thing you wish you knew earlier..."/></label>
 <label className="form-wide">LinkedIn URL (optional)<input type="url" maxLength={160} value={form.linkedin} onChange={e=>set('linkedin',e.target.value)} placeholder="https://www.linkedin.com/in/..."/></label>
 <label className="form-wide photo-label"><span><Camera size={18}/> Profile photo (optional, JPG/PNG/WebP, max 1.5 MB)</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>void photoChange(e.target.files?.[0])}/>{photo&&<img src={photo} alt="Photo preview" className="photo-preview"/>}</label>
 </div><div className="form-consents"><label><input type="checkbox" required checked={form.publishConsent} onChange={e=>set('publishConsent',e.target.checked)}/> I agree to display my name, photo (if added), education, career details and advice publicly on the event website. *</label><label><input type="checkbox" checked={form.linkedinConsent} onChange={e=>set('linkedinConsent',e.target.checked)}/> I agree to display my LinkedIn URL publicly (if supplied).</label></div><div className="honeypot" aria-hidden="true"><label>Leave this field blank<input tabIndex={-1} autoComplete="off" value={form.website} onChange={e=>set('website',e.target.value)}/></label></div><div ref={widget} className="turnstile-slot"/>{error&&<p className="form-error" role="alert">{error}</p>}<button type="submit" className="primary-btn" disabled={sending}>{sending?'Publishing...':'Publish my profile'} <UserPlus size={18}/></button><p className="form-fineprint">Only share details you're comfortable making public. Published profiles are visible to anyone with the link. Contact the organizers if you need a profile removed.</p></form>}</div></section>
}

function App(){
 const [liveProfiles,setLiveProfiles]=useState<Profile[]>([])
 const [submissionsOpen,setSubmissionsOpen]=useState(false)
 const [siteKey,setSiteKey]=useState('')
 const [apiWarning,setApiWarning]=useState('')
 const profiles=useMemo(()=>[...seededProfiles,...liveProfiles],[liveProfiles])
 const faculties=useMemo(()=>unique(profiles.map(p=>p.faculty)),[profiles])
 const industries=useMemo(()=>unique(profiles.map(p=>p.industry)),[profiles])
 const statuses=useMemo(()=>unique(profiles.map(p=>p.status)),[profiles])
 const companies=useMemo(()=>unique(profiles.flatMap(p=>p.companies)),[profiles])
 const refresh=async()=>{const response=await fetch('/api/profiles',{cache:'no-store'});if(!response.ok)throw Error('Profile service unavailable');const data=await response.json();setLiveProfiles(Array.isArray(data.profiles)?data.profiles:[])}
 useEffect(()=>{void Promise.all([fetch('/api/config',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Config unavailable');return r.json()}).then(data=>{setSubmissionsOpen(data.open===true);setSiteKey(data.siteKey||'')}),refresh()]).catch(()=>setApiWarning('Live submissions are unavailable in this preview. Deploy to Netlify to enable them.'))},[])
 const [search,setSearch] = useState('')
 const [faculty,setFaculty] = useState('')
 const [industry,setIndustry] = useState('')
 const [status,setStatus] = useState('')
 const [company,setCompany] = useState('')
 const [order,setOrder] = useState('featured')
 const [showFavorites,setShowFavorites] = useState(false)
 const [favorites,setFavorites] = useState<string[]>(()=>{try{return JSON.parse(localStorage.getItem('networking-favorites')||'[]') as string[]}catch{return []}})
 const [selected,setSelected] = useState<Profile|null>(null)
 const [mobileFilters,setMobileFilters] = useState(false)
 const [mobileMenu,setMobileMenu] = useState(false)
 const [organizersOpen,setOrganizersOpen] = useState(false)
 const contactTrigger=useRef<HTMLButtonElement>(null)
 const [showMobileRsvp,setShowMobileRsvp]=useState(true)
 useEffect(()=>{const section=document.getElementById('add-profile');if(!section||!('IntersectionObserver' in window))return;const observer=new IntersectionObserver(entries=>setShowMobileRsvp(!entries[0].isIntersecting),{threshold:0.08});observer.observe(section);return()=>observer.disconnect()},[])
 useEffect(()=>{localStorage.setItem('networking-favorites',JSON.stringify(favorites))},[favorites])
 useEffect(()=>{document.body.style.overflow=selected?'hidden':'';return()=>{document.body.style.overflow=''}},[selected])
 useEffect(()=>{if(!selected)return;const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setSelected(null)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[selected])
 const filtered = useMemo(()=>{
   const q=search.trim().toLocaleLowerCase()
   const result=profiles.filter(p=>(!q||[p.name,p.title,p.organization,p.faculty,p.major,p.industry,p.otherInterests,p.graduationYear,p.status,...p.companies,...p.roles,...p.topics].join(' ').toLocaleLowerCase().includes(q)) && (!faculty||p.faculty===faculty) && (!industry||p.industry===industry) && (!status||p.status===status) && (!company||p.companies.includes(company)) && (!showFavorites||favorites.includes(p.id)))
   if(order==='name')result.sort((a,b)=>a.name.localeCompare(b.name))
   if(order==='graduation')result.sort((a,b)=>(a.graduationYear||'9999').localeCompare(b.graduationYear||'9999'))
   if(order==='featured')result.sort((a,b)=>Number(a.isPlaceholder)-Number(b.isPlaceholder))
   return result
 },[profiles,search,faculty,industry,status,company,order,showFavorites,favorites])
 const activeCount=[faculty,industry,status,company].filter(Boolean).length+Number(showFavorites)
 const reset=()=>{setSearch('');setFaculty('');setIndustry('');setStatus('');setCompany('');setShowFavorites(false)}
 const toggleFavorite=(id:string)=>setFavorites(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id])
 return <>
  <div className="page-shell">
   <header className="nav"><a href="#top" className="brand" aria-label="Career Connections home"><span className="brand-mark"><span className="mark-dot"/><span className="mark-line"/><span className="mark-dot last"/></span><span className="brand-name">career<span>connections</span><small>UBC TOTEM PARK</small></span></a><nav className={mobileMenu?'nav-links open':'nav-links'} aria-label="Main navigation"><a onClick={()=>setMobileMenu(false)} href="#directory">Explore people</a><a onClick={()=>setMobileMenu(false)} href="#about">About the event</a><a onClick={()=>setMobileMenu(false)} href="#add-profile">Add my profile</a><button type="button" ref={contactTrigger} className="nav-contact" onClick={()=>{setMobileMenu(false);setOrganizersOpen(true)}}>Contact organizers <ArrowUpRight size={15}/></button></nav><button className="menu-toggle" aria-label="Toggle menu" aria-expanded={mobileMenu} onClick={()=>setMobileMenu(!mobileMenu)}>{mobileMenu?<X size={23}/>:<Menu size={23}/>}</button></header>
   <main id="top">
    <section className="hero" aria-labelledby="hero-title"><div className="hero-orb a"/><div className="hero-orb b"/><div className="hero-grid"/><div className="hero-main"><div className="eyebrow"><span className="eyebrow-indicator"/> NO PRESSURE. JUST POSSIBILITIES.</div><h1 id="hero-title">Your first co-op story<br/>starts with <em>“hi.”</em></h1><p>No suits. No awkward elevator pitches. Just upper-years and recent grads sharing the co-op stories, mistakes, and advice they wish they'd heard sooner. Come curious — you don't need to have it all figured out.</p><div className="hero-actions"><a className="primary-btn rsvp-primary" href={RSVP_URL} target="_blank" rel="noopener noreferrer">Save my spot <ExternalLink size={18}/></a><a className="secondary-btn hero-explore" href="#directory">Explore the people <ArrowRight size={17}/></a><a className="secondary-btn" href="#about">Event details <ArrowUpRight size={17}/></a></div><p className="rsvp-note">For first-year residents attending · Takes 1 minute. Helps us plan the food and drinks.</p></div><div className="hero-side"><div className="connection-art"><div className="art-circle big"/><div className="art-circle smaller"/><div className="floating-card one"><span className="tiny-symbol">✳</span><span>Explore possibilities<small>Start somewhere.</small></span></div><div className="floating-card two"><div className="tiny-avatars"><span>AM</span><span>JC</span><span>SK</span></div><span>Real conversations.<small>Real perspectives.</small></span></div><div className="art-lines"><i/><i/><i/></div><div className="star s1">✦</div><div className="star s2">✳</div></div><BroadcastTelevision className="hero-television"/></div></section>
    <div className="marquee marquee-round2" aria-label="Event topics"><div className="marquee-track"><div className="marquee-sequence"><span>SAY HI FIRST</span><i aria-hidden="true">➜</i><span>ASK THE REAL QUESTIONS</span><i aria-hidden="true">➜</i><span>STEAL THE GOOD ADVICE</span><i aria-hidden="true">➜</i><span>EXPLORE WHAT’S NEXT</span><i aria-hidden="true">➜</i></div><div className="marquee-sequence" aria-hidden="true"><span>SAY HI FIRST</span><i aria-hidden="true">➜</i><span>ASK THE REAL QUESTIONS</span><i aria-hidden="true">➜</i><span>STEAL THE GOOD ADVICE</span><i aria-hidden="true">➜</i><span>EXPLORE WHAT’S NEXT</span><i aria-hidden="true">➜</i></div></div></div>
    <section id="directory" className="directory"><div className="section-head"><div><div className="mini-heading"><span/> THE PEOPLE</div><h2>Good people. <em>Great stories.</em></h2><p>Browse upper-years and recent grads attending the event. See what they've done, what they're into, and what you can chat with them about.</p></div><div className="count-display"><strong>{profiles.length.toString().padStart(2,'0')}</strong><span>networking<br/>professionals</span></div></div>
     
     {apiWarning&&<p className="api-warning" role="status">{apiWarning}</p>}
     <div className="directory-layout"><aside className={`filters ${mobileFilters?'filter-open':''}`}><div className="filters-title"><span><SlidersHorizontal size={18}/> Filter people</span>{activeCount>0&&<button onClick={reset}>Clear all</button>}</div><div className="filter-stack"><SelectField label="Faculty" value={faculty} options={faculties} onChange={setFaculty}/><SelectField label="Industry" value={industry} options={industries} onChange={setIndustry}/><SelectField label="Current status" value={status} options={statuses} onChange={setStatus}/><SelectField label="Co-op company" value={company} options={companies} onChange={setCompany}/></div><div className="filter-divider"/><label className="toggle-row"><input type="checkbox" checked={showFavorites} onChange={e=>setShowFavorites(e.target.checked)}/><span className="custom-checkbox"><Check size={12}/></span><span>My saved people<small>{favorites.length} saved on this device</small></span></label><div className="filter-tip"><Sparkles size={16}/><p>Don't know who to approach? Pick someone with a different major and ask how they found their path.</p></div></aside>
      <div className="results-area"><div className="toolbar"><div className="search-wrap"><Search size={20}/><input aria-label="Search profiles" type="search" placeholder="Search by name, major, company, skills..." value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button aria-label="Clear search" onClick={()=>setSearch('')}><X size={16}/></button>}</div><button className="mobile-filter-btn" onClick={()=>setMobileFilters(!mobileFilters)}><SlidersHorizontal size={17}/> Filters {activeCount>0&&`(${activeCount})`}</button><div className="sort-wrap"><ArrowDownAZ size={17}/><select aria-label="Sort profiles" value={order} onChange={e=>setOrder(e.target.value)}><option value="featured">Featured first</option><option value="name">Name A–Z</option><option value="graduation">Graduation year</option></select><ChevronDown size={14}/></div></div><div className="result-meta"><span><strong>{filtered.length}</strong> {filtered.length===1?'person you could meet':'people you could meet'}</span>{(activeCount>0||search)&&<button onClick={reset}><RotateCcw size={13}/> Reset filters</button>}</div>
       {filtered.length>0?<div className="profile-grid">{filtered.map(p=><article className="profile-card" key={p.id}><div className="card-top"><Avatar person={p}/><button className={`save-btn ${favorites.includes(p.id)?'saved':''}`} aria-label={`${favorites.includes(p.id)?'Remove':'Save'} ${p.name}`} title={favorites.includes(p.id)?'Remove from saved':'Save person'} onClick={()=>toggleFavorite(p.id)}><Bookmark size={18} fill={favorites.includes(p.id)?'currentColor':'none'}/></button></div><h3>{p.name}</h3><p className="card-role">{p.title || p.status}</p><p className="card-org"><BriefcaseBusiness size={15}/>{p.organization||p.companies.join(', ')}</p><div className="card-rule"/><div className="card-detail"><GraduationCap size={16}/><span>{p.faculty}<small>{p.major}</small></span></div><div className="card-tags"><span>{p.industry}</span><span>Class of {p.graduationYear||'TBD'}</span></div><button className="profile-open" onClick={()=>setSelected(p)}>View profile <ArrowUpRight size={18}/></button></article>)}</div>:<div className="empty-state"><div><Search size={33}/></div><h3>Nobody here with those filters — try widening your search.</h3><p>Try removing a filter or searching for a broader topic. There are plenty of people to meet.</p><button onClick={reset}>Show everyone <ArrowRight size={17}/></button></div>}
      </div></div>
    </section>
    <ProfileForm open={submissionsOpen} siteKey={siteKey} onAdded={async()=>{await refresh();document.getElementById('directory')?.scrollIntoView({behavior:'smooth'})}}/>
    <section id="about" className="about"><div className="about-text"><div className="mini-heading"><span/> THE EVENT</div><h2>Come for the snacks.<br/><em>Stay for the stories.</em></h2><p>No perfect career plan required. Ask upper-year students about internships, co-ops, research, awkward interviews, and how they found their opportunities — across all faculties. Good conversations and free snacks included.</p><div className="about-pills"><span>First-year friendly</span><span>Zero-pressure networking</span><span>Free food & drinks</span></div></div><div className="about-event"><span className="event-card-top">SAVE THE DATE <span className="event-logo-plate"><img src="/images/residence-life-logo.webp" alt="UBC Residence Life logo"/></span></span><strong>24<span> NOV</span></strong><div className="about-event-rule"/><p><CalendarDays size={18}/> Tuesday, November 24, 2026</p><p><Clock3 size={18}/> 6:00–8:00 PM</p><p><MapPin size={18}/> Totem Park Ballroom · UBC</p><p className="event-address">2525 West Mall, Vancouver, BC V6T 1W9</p><a className="event-maps" href={MAPS_URL} target="_blank" rel="noopener noreferrer"><Navigation size={16}/> Get directions <ExternalLink size={14}/></a><a className="event-rsvp" href={RSVP_URL} target="_blank" rel="noopener noreferrer">Save my spot <ExternalLink size={16}/></a><span className="event-rsvp-note">Residents attending · RSVP helps us plan food & drinks.</span><small>Hosted by UBC Residence Life · First-Year Experience</small></div></section>
   </main><footer><div className="footer-brand">career<span>connections</span><small>TOTEM PARK NETWORKING NIGHT · UBC RESIDENCE LIFE</small></div><p>Meet people. Ask questions. Find your path.</p><div className="footer-right"><span className="footer-logo-plate"><img src="/images/residence-life-logo.webp" alt="UBC Residence Life logo"/></span><span>Hosted by UBC Residence Life · First-Year Experience</span><span>November 24, 2026 · Open to all faculties</span></div></footer>
  </div>
  {showMobileRsvp&&!organizersOpen&&!selected&&<a className="mobile-rsvp-sticky" href={RSVP_URL} target="_blank" rel="noopener noreferrer">Save my spot <ExternalLink size={16}/></a>}
  {organizersOpen&&<OrganizerModal onClose={()=>setOrganizersOpen(false)} returnFocus={contactTrigger}/>}
  {selected&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}} role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="modal-title" className="profile-modal"><button className="modal-close" aria-label="Close profile" onClick={()=>setSelected(null)}><X size={21}/></button><div className="modal-header"><Avatar person={selected} large/><div><h2 id="modal-title">{selected.name}</h2><p>{selected.title || selected.status}{selected.organization?` · ${selected.organization}`:''}</p></div></div><div className="modal-body"><div className="modal-facts"><div><span>FACULTY</span><strong>{selected.faculty}</strong></div><div><span>STUDYING</span><strong>{selected.major}</strong></div><div><span>GRADUATION</span><strong>{selected.graduationYear||'Not listed'}</strong></div><div><span>CURRENT STATUS</span><strong>{selected.status}</strong></div></div><h3>Co-op & internship journey</h3><div className="journey">{selected.companies.length?selected.companies.map((company,i)=><div className="journey-item" key={`${company}-${i}`}><span className="journey-pin"/><div><strong>{company}</strong>{selected.roles[i]&&<p>{selected.roles[i]}</p>}</div></div>):<p>No experience listed yet.</p>}</div><h3>Let's talk about</h3><div className="modal-tags">{(selected.topics.length?selected.topics:[selected.industry,selected.otherInterests].filter(Boolean)).map(t=><span key={t}>{t}</span>)}</div>{selected.advice&&<div className="advice"><span>A PIECE OF ADVICE</span><p>“{selected.advice}”</p></div>}{selected.isPlaceholder&&<p className="modal-disclaimer">This person and their experiences are fictional demonstration data. They are not confirmed for the event.</p>}</div><div className="modal-footer"><button onClick={()=>toggleFavorite(selected.id)} className="modal-save">{favorites.includes(selected.id)?<Check size={17}/>:<Heart size={17}/>} {favorites.includes(selected.id)?'Saved to your list':'Save this person'}</button>{selected.linkedin&&<a href={selected.linkedin} target="_blank" rel="noopener noreferrer" className="linkedin-btn"><Linkedin size={17}/> LinkedIn <ExternalLink size={15}/></a>}</div></section></div>}
 </>
}
export default App
