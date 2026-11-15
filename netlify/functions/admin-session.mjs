import {json, originsMatch} from './shared.mjs';
import {isAuthorized, sessionCookie,expiredCookie,validateToken} from './admin-auth.mjs';
export default async function handler(request){
  if(request.method==='GET')return json({authenticated:isAuthorized(request),configured:Boolean(process.env.ADMIN_REMOVE_TOKEN)});
  if(request.method!=='POST'&&request.method!=='DELETE')return json({error:'Method not allowed'},405);
  if(!originsMatch(request))return json({error:'Invalid origin'},403);
  if(request.method==='DELETE')return json({authenticated:false},200,{'Set-Cookie':expiredCookie});
  if(Number(request.headers.get('content-length')||0)>2000)return json({error:'Request too large'},413);
  let data;try{data=JSON.parse(await request.text())}catch{return json({error:'Invalid sign-in request'},400)}
  if(!validateToken(data?.token))return json({error:'Invalid organizer token'},401);
  return json({authenticated:true},200,{'Set-Cookie':sessionCookie()});
}
export const config={path:'/api/admin/session'};
