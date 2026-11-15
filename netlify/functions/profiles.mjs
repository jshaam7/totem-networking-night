import {getStore} from '@netlify/blobs';
import {json,clean,validate,imageInfo,originsMatch,storeName,photoStoreName,publicProfile} from './shared.mjs';
export default async function handler(request){
 try{
  if(request.method==='GET'){
   const store=getStore(storeName());
   const entries=[];
   for await(const page of store.list({paginate:true,prefix:'profile/'})){
    for(const blob of page.blobs){if(entries.length>=300)break;const p=await store.get(blob.key,{type:'json'});if(publicProfile(p))entries.push(p)}
    if(entries.length>=300)break;
   }
   return json({profiles:entries});
  }
  if(request.method!=='POST')return json({error:'Method not allowed'},405,{Allow:'GET, POST'});
  if(process.env.SUBMISSIONS_OPEN!=='true')return json({error:'Profile submissions are closed'},403);
  if(!process.env.TURNSTILE_SECRET_KEY||!process.env.TURNSTILE_SITE_KEY)return json({error:'Submission protection is not configured'},503);
  if(!originsMatch(request))return json({error:'Request origin does not match site'},403);
  if(Number(request.headers.get('content-length')||0)>2_300_000)return json({error:'Request too large'},413);
  const raw=await request.text();
  if(raw.length>2_300_000)return json({error:'Request too large'},413);
  const body=JSON.parse(raw);
  if(body.website)return json({error:'Invalid submission'},400);
  const token=clean(body.turnstileToken,2048);
  if(!token)return json({error:'Please complete the anti-spam check'},400);
  const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:process.env.TURNSTILE_SECRET_KEY,response:token})});
  if(!response.ok||(await response.json()).success!==true)return json({error:'Anti-spam verification failed; please try again'},403);
  const profile=validate(body);
  const photo=imageInfo(body.photoData);
  const id=`submitted-${crypto.randomUUID()}`;
  profile.id=id;
  profile.reviewStatus=process.env.PROFILE_REVIEW_REQUIRED==='true'?'pending':'published';
  profile.createdAt=new Date().toISOString();
  if(photo){await getStore(photoStoreName()).set(`photo/${id}`,new Blob([photo.data],{type:photo.mime}),{metadata:{mime:photo.mime}});profile.photoUrl=`/api/photo?id=${encodeURIComponent(id)}`}
  await getStore(storeName()).setJSON(`profile/${id}`,profile);
  return json({success:true,profile:profile.reviewStatus==='published'?profile:null,pending:profile.reviewStatus==='pending'},201);
 }catch(error){
  if(error instanceof SyntaxError)return json({error:'Invalid request data'},400);
  if(error instanceof Error&&/(Please|Photo|Permission|LinkedIn|Graduation|Invalid profile)/.test(error.message))return json({error:error.message},400);
  console.error('Profile API failed',error);
  return json({error:'Unable to save profile right now'},500);
 }
}
export const config={path:'/api/profiles'};
