import {createHmac, timingSafeEqual} from 'node:crypto';
import {json, originsMatch} from './shared.mjs';

const COOKIE = 'cc_organizer_session';
const TTL = 60 * 60 * 4; // Four-hour, browser-session cookie.
const secret = () => process.env.ADMIN_REMOVE_TOKEN || '';
const digest = (message) => createHmac('sha256',secret()).update(message).digest('hex');
function safeCompare(a,b){
  const x=Buffer.from(String(a)); const y=Buffer.from(String(b));
  return x.length===y.length && timingSafeEqual(x,y);
}
export function isAuthorized(request){
  if(!secret()) return false;
  const cookies=request.headers.get('cookie')||'';
  const raw=cookies.split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
  if(!raw)return false;
  const match=/^(\d+)\.([a-f0-9]{64})$/.exec(raw);
  if(!match)return false;
  const exp=Number(match[1]);
  if(!Number.isSafeInteger(exp)||exp<=Math.floor(Date.now()/1000)||exp>Math.floor(Date.now()/1000)+TTL)return false;
  return safeCompare(match[2],digest(match[1]));
}
export function requireAdmin(request,write=false){
  if(!isAuthorized(request))return json({error:'Organizer sign-in required'},401);
  if(write&&!originsMatch(request))return json({error:'Invalid request origin'},403);
  return null;
}
export function sessionCookie(){
  const exp=Math.floor(Date.now()/1000)+TTL;
  return `${COOKIE}=${exp}.${digest(String(exp))}; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=${TTL}`;
}
export const expiredCookie = `${COOKIE}=; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
export function validateToken(token){return Boolean(secret())&&typeof token==='string'&&safeCompare(token,secret())}
export function noStoreJson(body,status=200,headers={}){return json(body,status,headers)}
