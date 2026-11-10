import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDownAZ, ArrowRight, ArrowUpRight, Bookmark, BriefcaseBusiness, CalendarDays, Check, ChevronDown, Clock3, ExternalLink, GraduationCap, Heart, Linkedin, MapPin, Menu, RotateCcw, Search, SlidersHorizontal, Sparkles, X, Camera, UserPlus, ShieldCheck }  from 'lucide-react'
import profileData from './data/profiles.json'

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
   setComplete(true);setForm(startingForm);setPhoto('');await onAdded();
  }catch(e){setError(e instanceof Error?e.message:'Something went wrong. Please try again.')}
  finally{setSending(false)}
 }
 return <section id="add-profile" className="add-profile-section"><div className="add-profile-inner"><div className="mini-heading"><span/> JOIN THE DIRECTORY</div><h2>Add <em>your profile.</em></h2><p className="add-intro">Completed a co-op or internship? Share your experience so first-year students can find you at Networking Night. Your information will appear publicly once submitted.</p>
 {!open?<div className="closed-notice"><ShieldCheck size={24}/><div><strong>Profile submissions are currently closed.</strong><p>The directory is read-only. You can still browse and save profiles.</p></div></div>:complete?<div className="success-notice" role="status"><Check size={30}/><div><h3>Your profile is published!</h3><p>It now appears in the directory. Thank you for helping other UBC students.</p><button type="button" className="secondary-btn" onClick={()=>setComplete(false)}>Add another profile</button></div></div>:<form onSubmit={send} className="profile-form"><div className="form-grid">
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
 const [showOnlyReal,setShowOnlyReal] = useState(false)
 const [showFavorites,setShowFavorites] = useState(false)
 const [favorites,setFavorites] = useState<string[]>(()=>{try{return JSON.parse(localStorage.getItem('networking-favorites')||'[]') as string[]}catch{return []}})
 const [selected,setSelected] = useState<Profile|null>(null)
 const [mobileFilters,setMobileFilters] = useState(false)
 const [mobileMenu,setMobileMenu] = useState(false)
 useEffect(()=>{localStorage.setItem('networking-favorites',JSON.stringify(favorites))},[favorites])
 useEffect(()=>{document.body.style.overflow=selected?'hidden':'';return()=>{document.body.style.overflow=''}},[selected])
 useEffect(()=>{if(!selected)return;const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setSelected(null)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[selected])
 const filtered = useMemo(()=>{
   const q=search.trim().toLocaleLowerCase()
   const result=profiles.filter(p=>(!q||[p.name,p.title,p.organization,p.faculty,p.major,p.industry,p.otherInterests,p.graduationYear,p.status,...p.companies,...p.roles,...p.topics].join(' ').toLocaleLowerCase().includes(q)) && (!faculty||p.faculty===faculty) && (!industry||p.industry===industry) && (!status||p.status===status) && (!company||p.companies.includes(company)) && (!showOnlyReal||!p.isPlaceholder) && (!showFavorites||favorites.includes(p.id)))
   if(order==='name')result.sort((a,b)=>a.name.localeCompare(b.name))
   if(order==='graduation')result.sort((a,b)=>(a.graduationYear||'9999').localeCompare(b.graduationYear||'9999'))
   if(order==='featured')result.sort((a,b)=>Number(a.isPlaceholder)-Number(b.isPlaceholder))
   return result
 },[profiles,search,faculty,industry,status,company,order,showOnlyReal,showFavorites,favorites])
 const activeCount=[faculty,industry,status,company].filter(Boolean).length+Number(showOnlyReal)+Number(showFavorites)
 const reset=()=>{setSearch('');setFaculty('');setIndustry('');setStatus('');setCompany('');setShowOnlyReal(false);setShowFavorites(false)}
 const toggleFavorite=(id:string)=>setFavorites(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id])
 return <>
  <div className="page-shell">
   <header className="nav"><a href="#top" className="brand" aria-label="Career Connections home"><span className="brand-mark"><span className="mark-dot"/><span className="mark-line"/><span className="mark-dot last"/></span><span className="brand-name">career<span>connections</span><small>UBC TOTEM PARK</small></span></a><nav className={mobileMenu?'nav-links open':'nav-links'} aria-label="Main navigation"><a onClick={()=>setMobileMenu(false)} href="#directory">Explore people</a><a onClick={()=>setMobileMenu(false)} href="#about">About the event</a><a onClick={()=>setMobileMenu(false)} href="#add-profile">Add my profile</a><a className="nav-contact" href="mailto:?subject=Networking%20Night%20-%20Question">Contact organizers <ArrowUpRight size={15}/></a></nav><button className="menu-toggle" aria-label="Toggle menu" aria-expanded={mobileMenu} onClick={()=>setMobileMenu(!mobileMenu)}>{mobileMenu?<X size={23}/>:<Menu size={23}/>}</button></header>
   <main id="top">
    <section className="hero" aria-labelledby="hero-title"><div className="hero-orb a"/><div className="hero-orb b"/><div className="hero-grid"/><div className="hero-main"><div className="eyebrow"><span className="eyebrow-indicator"/> THE NEXT STEP STARTS WITH A CONVERSATION</div><h1 id="hero-title">Your future is<br/><em>one conversation</em><br/>away<span className="period">.</span></h1><p>Meet upper-year students and recent grads who've been where you are. Discover their co-op journeys, ask real questions, and find your next direction.</p><div className="hero-actions"><a className="primary-btn" href="#directory">Find someone to meet <ArrowRight size={18}/></a><a className="secondary-btn" href="#about">Event details <ArrowUpRight size={17}/></a></div></div><div className="hero-side"><div className="connection-art"><div className="art-circle big"/><div className="art-circle smaller"/><div className="floating-card one"><span className="tiny-symbol">✳</span><span>Explore possibilities<small>Start somewhere.</small></span></div><div className="floating-card two"><div className="tiny-avatars"><span>AM</span><span>JC</span><span>SK</span></div><span>Real conversations.<small>Real perspectives.</small></span></div><div className="art-lines"><i/><i/><i/></div><div className="star s1">✦</div><div className="star s2">✳</div></div><div className="hero-event-tag"><span className="tag-label">YOUR INVITATION</span><span><CalendarDays size={17}/> Tuesday, Nov 24, 2026</span><span><Clock3 size={17}/> 6:00 – 8:00 PM</span><span><MapPin size={17}/> Totem Park Ballroom, UBC</span></div></div></section>
    <div className="marquee" aria-label="Event topics"><div><span>FIND YOUR PEOPLE</span><i>✳</i><span>ASK BETTER QUESTIONS</span><i>✳</i><span>EXPLORE WHAT'S NEXT</span><i>✳</i><span>LEARN FROM EXPERIENCE</span><i>✳</i><span>FIND YOUR PEOPLE</span></div></div>
    <section id="directory" className="directory"><div className="section-head"><div><div className="mini-heading"><span/> THE PEOPLE</div><h2>People worth <em>meeting.</em></h2><p>Different backgrounds, different paths, and a lot of lessons to share. Find someone whose experience sparks your curiosity.</p></div><div className="count-display"><strong>{profiles.length.toString().padStart(2,'0')}</strong><span>profiles in<br/>this preview</span></div></div>
     <div className="demo-banner"><Sparkles size={19}/><div><strong>Preview mode</strong><span>One profile comes from the organizer's provided sheet; {profiles.filter(p=>p.isPlaceholder).length} profiles are fictional examples for demonstrating the website. Demo profiles are not confirmed event guests.</span></div></div>
     {apiWarning&&<p className="api-warning" role="status">{apiWarning}</p>}
     <div className="directory-layout"><aside className={`filters ${mobileFilters?'filter-open':''}`}><div className="filters-title"><span><SlidersHorizontal size={18}/> Filter people</span>{activeCount>0&&<button onClick={reset}>Clear all</button>}</div><div className="filter-stack"><SelectField label="Faculty" value={faculty} options={faculties} onChange={setFaculty}/><SelectField label="Industry" value={industry} options={industries} onChange={setIndustry}/><SelectField label="Current status" value={status} options={statuses} onChange={setStatus}/><SelectField label="Co-op company" value={company} options={companies} onChange={setCompany}/></div><div className="filter-divider"/><label className="toggle-row"><input type="checkbox" checked={showOnlyReal} onChange={e=>setShowOnlyReal(e.target.checked)}/><span className="custom-checkbox"><Check size={12}/></span><span>Confirmed profiles only<small>Hide fictional examples</small></span></label><label className="toggle-row"><input type="checkbox" checked={showFavorites} onChange={e=>setShowFavorites(e.target.checked)}/><span className="custom-checkbox"><Check size={12}/></span><span>My saved people<small>{favorites.length} saved on this device</small></span></label><div className="filter-tip"><Sparkles size={16}/><p>Not sure who to talk to? Try a different faculty or industry. The best connections are sometimes unexpected.</p></div></aside>
      <div className="results-area"><div className="toolbar"><div className="search-wrap"><Search size={20}/><input aria-label="Search profiles" type="search" placeholder="Search by name, major, company, skills..." value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button aria-label="Clear search" onClick={()=>setSearch('')}><X size={16}/></button>}</div><button className="mobile-filter-btn" onClick={()=>setMobileFilters(!mobileFilters)}><SlidersHorizontal size={17}/> Filters {activeCount>0&&`(${activeCount})`}</button><div className="sort-wrap"><ArrowDownAZ size={17}/><select aria-label="Sort profiles" value={order} onChange={e=>setOrder(e.target.value)}><option value="featured">Featured first</option><option value="name">Name A–Z</option><option value="graduation">Graduation year</option></select><ChevronDown size={14}/></div></div><div className="result-meta"><span><strong>{filtered.length}</strong> {filtered.length===1?'person':'people'} to discover</span>{(activeCount>0||search)&&<button onClick={reset}><RotateCcw size={13}/> Reset filters</button>}</div>
       {filtered.length>0?<div className="profile-grid">{filtered.map(p=><article className="profile-card" key={p.id}><div className="card-top"><Avatar person={p}/><button className={`save-btn ${favorites.includes(p.id)?'saved':''}`} aria-label={`${favorites.includes(p.id)?'Remove':'Save'} ${p.name}`} title={favorites.includes(p.id)?'Remove from saved':'Save person'} onClick={()=>toggleFavorite(p.id)}><Bookmark size={18} fill={favorites.includes(p.id)?'currentColor':'none'}/></button></div><div className="card-meta"><span className={`profile-status ${p.isPlaceholder?'sample':''}`}>{p.isPlaceholder?'DEMO PROFILE':p.id.startsWith('submitted-')?'PROFESSIONAL PROFILE':'PROFILE FROM SHEET'}</span></div><h3>{p.name}</h3><p className="card-role">{p.title || p.status}</p><p className="card-org"><BriefcaseBusiness size={15}/>{p.organization||p.companies.join(', ')}</p><div className="card-rule"/><div className="card-detail"><GraduationCap size={16}/><span>{p.faculty}<small>{p.major}</small></span></div><div className="card-tags"><span>{p.industry}</span><span>Class of {p.graduationYear||'TBD'}</span></div><button className="profile-open" onClick={()=>setSelected(p)}>View profile <ArrowUpRight size={18}/></button></article>)}</div>:<div className="empty-state"><div><Search size={33}/></div><h3>No matches this time.</h3><p>Try removing a filter or searching for a broader topic.</p><button onClick={reset}>Show everyone <ArrowRight size={17}/></button></div>}
      </div></div>
    </section>
    <ProfileForm open={submissionsOpen} siteKey={siteKey} onAdded={async()=>{await refresh();document.getElementById('directory')?.scrollIntoView({behavior:'smooth'})}}/>
    <section id="about" className="about"><div className="about-text"><div className="mini-heading"><span/> THE EVENT</div><h2>Good advice.<br/><em>Great company.</em></h2><p>Career paths aren't always linear. Come hear how other UBC students found their first internships, handled rejections, built skills, and figured out what to try next.</p><div className="about-pills"><span>For first-year students</span><span>Relaxed networking</span><span>Food & beverages</span></div></div><div className="about-event"><span className="event-card-top">SAVE THE DATE <span>✳</span></span><strong>24<span> NOV</span></strong><div className="about-event-rule"/><p><CalendarDays size={18}/> Tuesday, November 24, 2026</p><p><Clock3 size={18}/> 6:00 PM – 8:00 PM</p><p><MapPin size={18}/> Totem Park Ballroom · UBC</p><small>Organized by the Totem Park residence team</small></div></section>
   </main><footer><div className="footer-brand">career<span>connections</span><small>AN RA NETWORKING NIGHT AT UBC</small></div><p>Meet people. Ask questions. Find your path.</p><div className="footer-right">Built for Totem Park • 2026<br/><span>Prototype for organizer review</span></div></footer>
  </div>
  {selected&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}} role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="modal-title" className="profile-modal"><button className="modal-close" aria-label="Close profile" onClick={()=>setSelected(null)}><X size={21}/></button><div className="modal-header"><Avatar person={selected} large/><div><span className={`profile-status ${selected.isPlaceholder?'sample':''}`}>{selected.isPlaceholder?'FICTIONAL DEMO PROFILE':selected.id.startsWith('submitted-')?'PROFESSIONAL PROFILE':'PROFILE FROM ORGANIZER SHEET'}</span><h2 id="modal-title">{selected.name}</h2><p>{selected.title || selected.status}{selected.organization?` · ${selected.organization}`:''}</p></div></div><div className="modal-body"><div className="modal-facts"><div><span>FACULTY</span><strong>{selected.faculty}</strong></div><div><span>STUDYING</span><strong>{selected.major}</strong></div><div><span>GRADUATION</span><strong>{selected.graduationYear||'Not listed'}</strong></div><div><span>CURRENT STATUS</span><strong>{selected.status}</strong></div></div><h3>Co-op & internship journey</h3><div className="journey">{selected.companies.length?selected.companies.map((company,i)=><div className="journey-item" key={`${company}-${i}`}><span className="journey-pin"/><div><strong>{company}</strong>{selected.roles[i]&&<p>{selected.roles[i]}</p>}</div></div>):<p>No experience listed yet.</p>}</div><h3>Let's talk about</h3><div className="modal-tags">{(selected.topics.length?selected.topics:[selected.industry,selected.otherInterests].filter(Boolean)).map(t=><span key={t}>{t}</span>)}</div>{selected.advice&&<div className="advice"><span>A PIECE OF ADVICE</span><p>“{selected.advice}”</p></div>}{selected.isPlaceholder&&<p className="modal-disclaimer">This person and their experiences are fictional demonstration data. They are not confirmed for the event.</p>}</div><div className="modal-footer"><button onClick={()=>toggleFavorite(selected.id)} className="modal-save">{favorites.includes(selected.id)?<Check size={17}/>:<Heart size={17}/>} {favorites.includes(selected.id)?'Saved to your list':'Save this person'}</button>{selected.linkedin&&<a href={selected.linkedin} target="_blank" rel="noopener noreferrer" className="linkedin-btn"><Linkedin size={17}/> LinkedIn <ExternalLink size={15}/></a>}</div></section></div>}
 </>
}
export default App
