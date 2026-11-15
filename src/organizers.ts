import '../organizers.css'

type Professional = Record<string,unknown> & {id:string; name:string; reviewStatus?:string; photoUrl?:string; companies?:string[];roles?:string[];topics?:string[]}
type Editable = {key:string; label:string; multi?:boolean; wide?:boolean}
const FIELDS:Editable[] = [
  {key:'name',label:'Full name'}, {key:'status',label:'Current status'}, {key:'title',label:'Job title'},
  {key:'organization',label:'Organization'}, {key:'faculty',label:'Faculty'}, {key:'major',label:'Major / program',wide:true},
  {key:'graduationYear',label:'Graduation year'}, {key:'industry',label:'Industry'},
  {key:'companies',label:'Co-op companies (comma separated)',multi:true,wide:true},
  {key:'roles',label:'Co-op roles (comma separated)',multi:true,wide:true},
  {key:'topics',label:'Talk to me about (comma separated)',multi:true,wide:true},
  {key:'otherInterests',label:'Other interests',wide:true}, {key:'advice',label:'Advice',wide:true},
  {key:'linkedin',label:'LinkedIn URL',wide:true}
];
const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const login=el<HTMLElement>('login-panel');const dashboard=el<HTMLElement>('dashboard');const feedback=el<HTMLElement>('feedback');
const dialog=el<HTMLDialogElement>('edit-dialog');const profileList=el<HTMLElement>('profiles');
let profiles:Professional[]=[];let selected:Professional|null=null;
const say=(message:string)=>{feedback.textContent=message};
async function api(url:string,options:RequestInit={}){
  const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...options});
  const data=await response.json().catch(()=>({error:'Invalid server response'}));
  if(response.status===401){showLogin();throw Error(data.error||'Session expired. Sign in again.')}
  if(!response.ok)throw Error(data.error||'Request failed');
  return data;
}
function showLogin(){dashboard.hidden=true;login.hidden=false;el<HTMLButtonElement>('logout').hidden=true}
function showDashboard(){dashboard.hidden=false;login.hidden=true;el<HTMLButtonElement>('logout').hidden=false}
async function bootstrap(){
  try{const res=await api('/api/admin/session');if(res.authenticated){showDashboard();await refresh()}else showLogin()}
  catch(e){say(String(e));showLogin()}
}
const review=(p:Professional)=>p.reviewStatus||'published';
function make<K extends keyof HTMLElementTagNameMap>(tag:K,cls='',text=''){
  const item=document.createElement(tag);if(cls)item.className=cls;if(text)item.textContent=text;return item;
}
function button(text:string,cls:string,handler:()=>void){const b=make('button','button '+cls,text);b.type='button';b.addEventListener('click',handler);return b}
function render(){
  const query=el<HTMLInputElement>('search').value.toLowerCase().trim();const state=el<HTMLSelectElement>('status').value;
  const filtered=profiles.filter(p=>(state==='all'||review(p)===state)&&(!query||[p.name,p.title,p.faculty,p.major,p.organization,...(p.companies||[])].join(' ').toLowerCase().includes(query)));
  profileList.replaceChildren();
  if(!filtered.length){profileList.append(make('p','empty','No submissions match these filters.'));return}
  for(const p of filtered){
    const card=make('article','profile-card');
    const head=make('div','profile-head');const avatar=make('div','avatar');
    if(p.photoUrl){const img=make('img') as HTMLImageElement;img.src='/api/admin/photo?id='+encodeURIComponent(p.id);img.alt='Profile photo for '+p.name;img.loading='lazy';avatar.append(img)}
    else avatar.textContent=p.name.split(' ').slice(0,2).map(v=>v[0]).join('').toUpperCase();
    const info=make('div');info.append(make('h3','',p.name),make('span','status '+review(p),review(p).toUpperCase()));head.append(avatar,info);
    card.append(head,make('p','',String(p.title||p.status||'')+' · '+String(p.organization||'')),make('p','label',String(p.faculty||'')+' · '+String(p.major||'')));
    const actions=make('div','row-actions');
    actions.append(button('Edit','ghost',()=>edit(p)));
    if(review(p)!=='published')actions.append(button('Approve','primary',()=>void changeStatus(p,'published')));
    if(review(p)!=='hidden')actions.append(button('Hide','ghost',()=>void changeStatus(p,'hidden')));
    actions.append(button('Delete','danger',()=>void remove(p)));
    card.append(actions);profileList.append(card);
  }
}
async function refresh(){
  const data=await api('/api/admin/profiles');profiles=Array.isArray(data.profiles)?data.profiles:[];
  profiles.sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
  el<HTMLElement>('total').textContent=String(profiles.length);
  for(const state of ['pending','published','hidden'])el<HTMLElement>(state).textContent=String(profiles.filter(p=>review(p)===state).length);
  el<HTMLElement>('review-mode').textContent=data.reviewRequired?'Approval queue enabled: new submissions await your review.':'Automatic publishing is currently enabled. Set PROFILE_REVIEW_REQUIRED=true in Netlify to hold future submissions for review.';
  render();
}
async function changeStatus(p:Professional,reviewStatus:string){
  try{await api('/api/admin/profiles',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,reviewStatus})});say(`${p.name}: ${reviewStatus}`);await refresh()}
  catch(e){say(e instanceof Error?e.message:'Update failed')}
}
async function remove(p:Professional){
  if(!confirm(`Permanently delete ${p.name} and their uploaded photo? This cannot be undone.`))return;
  try{await api('/api/admin/profiles',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id})});say(`${p.name} deleted.`);await refresh()}
  catch(e){say(e instanceof Error?e.message:'Deletion failed')}
}
function edit(p:Professional){
  selected=p;el<HTMLElement>('edit-title').textContent='Edit '+p.name;
  const root=el<HTMLElement>('edit-fields');root.replaceChildren();
  for(const f of FIELDS){
    const label=make('label',f.wide?'wide':'');label.textContent=f.label;
    const input=make('input') as HTMLInputElement;input.name=f.key;
    input.value=f.multi?(Array.isArray(p[f.key])?p[f.key] as string[]:[]).join(', '):String(p[f.key]??'');
    if(f.key==='name'||['faculty','major','industry','status'].includes(f.key))input.required=true;
    label.append(input);root.append(label);
  }
  const form=el<HTMLFormElement>('edit-form');
  (form.elements.namedItem('reviewStatus') as HTMLSelectElement).value=review(p);
  (form.elements.namedItem('linkedinConsent') as HTMLInputElement).checked=Boolean(p.linkedin);
  (form.elements.namedItem('removePhoto') as HTMLInputElement).checked=false;
  (form.elements.namedItem('photo') as HTMLInputElement).value='';
  dialog.showModal();
}
async function fileToData(file:File){
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>1_500_000)throw Error('Photo must be JPG/PNG/WebP and up to 1.5 MB');
  return new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error('Unable to read image'));reader.readAsDataURL(file)});
}
el<HTMLFormElement>('login-form').addEventListener('submit',async e=>{
  e.preventDefault();const input=el<HTMLInputElement>('token');const token=input.value;
  try{const data=await api('/api/admin/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})});input.value='';if(data.authenticated){showDashboard();await refresh();say('Signed in successfully.')}}
  catch(err){say(err instanceof Error?err.message:'Sign-in failed')}
});
el<HTMLButtonElement>('logout').addEventListener('click',async()=>{try{await api('/api/admin/session',{method:'DELETE'});showLogin();say('Signed out')}catch(e){say(String(e))}});
el<HTMLInputElement>('search').addEventListener('input',render);el<HTMLSelectElement>('status').addEventListener('change',render);
el<HTMLButtonElement>('refresh').addEventListener('click',()=>void refresh().catch(e=>say(e.message)));
el<HTMLButtonElement>('close-edit').addEventListener('click',()=>dialog.close());el<HTMLButtonElement>('cancel-edit').addEventListener('click',()=>dialog.close());
el<HTMLFormElement>('edit-form').addEventListener('submit',async e=>{
  e.preventDefault();if(!selected)return;
  const form=e.currentTarget as HTMLFormElement;const fd=new FormData(form);
  const profile:Record<string,unknown>={};
  for(const f of FIELDS){const raw=String(fd.get(f.key)||'');profile[f.key]=f.multi?raw.split(/[,;\n]+/).map(s=>s.trim()).filter(Boolean):raw}
  profile.linkedinConsent=fd.get('linkedinConsent')==='on';
  const image=fd.get('photo');
  try{
    const photoData=image instanceof File && image.size>0?await fileToData(image):undefined;
    await api('/api/admin/profiles',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:selected.id,profile,reviewStatus:fd.get('reviewStatus'),removePhoto:fd.get('removePhoto')==='on',photoData})});
    dialog.close();say('Profile updated successfully');await refresh();
  }catch(err){say(err instanceof Error?err.message:'Unable to save profile')}
});
void bootstrap();
