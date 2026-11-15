import {getStore} from '@netlify/blobs';
import {json,validate,imageInfo,storeName,photoStoreName} from './shared.mjs';
import {requireAdmin} from './admin-auth.mjs';

export const isSubmittedId=id=>typeof id==='string'&&/^submitted-[a-f0-9-]{36}$/.test(id);
export const reviewState=p=>p?.reviewStatus || 'published';
const statuses=new Set(['pending','published','hidden']);
export default async function handler(request){
  const write=request.method!=='GET';
  const denied=requireAdmin(request,write);if(denied)return denied;
  if(request.method==='GET'){
    const result=[]; const store=getStore(storeName());
    for await(const page of store.list({paginate:true,prefix:'profile/'})){
      for(const blob of page.blobs){const p=await store.get(blob.key,{type:'json'});if(p)result.push(p)}
      if(result.length>=2000)break;
    }
    return json({profiles:result,reviewRequired:process.env.PROFILE_REVIEW_REQUIRED==='true'});
  }
  if(!['PATCH','DELETE'].includes(request.method))return json({error:'Method not allowed'},405);
  if(Number(request.headers.get('content-length')||0)>2_300_000)return json({error:'Request too large'},413);
  let data;try{const raw=await request.text();if(raw.length>2_300_000)return json({error:'Request too large'},413);data=JSON.parse(raw)}catch{return json({error:'Invalid JSON'},400)}
  const id=data?.id;
  if(!isSubmittedId(id))return json({error:'Only submitted profiles can be managed'},400);
  const store=getStore(storeName());const photoStore=getStore(photoStoreName());
  const old=await store.get(`profile/${id}`,{type:'json'});
  if(!old)return json({error:'Profile not found'},404);
  if(request.method==='DELETE'){
    await store.delete(`profile/${id}`);
    await photoStore.delete(`photo/${id}`);
    return json({deleted:true});
  }
  if(data.reviewStatus!==undefined && !statuses.has(data.reviewStatus))return json({error:'Invalid review status'},400);
  try{
    // Sanitize and revalidate the edited profile; never permit arbitrary storage keys.
    const source=data.profile || {};
    const cleanInput={...old,...source,publishConsent:true,linkedinConsent:source.linkedinConsent===true || (source.linkedin===undefined && Boolean(old.linkedin))};
    for(const key of ['companies','roles','topics']) if(Array.isArray(cleanInput[key])) cleanInput[key]=cleanInput[key].join(', ');
    const next=validate(cleanInput);
    next.id=id;
    next.reviewStatus=data.reviewStatus ?? reviewState(old);
    next.source=old.source||'self-submitted';
    next.createdAt=old.createdAt;
    if(data.removePhoto===true){await photoStore.delete(`photo/${id}`)}
    else if(data.photoData){
      const photo=imageInfo(data.photoData);
      await photoStore.set(`photo/${id}`,new Blob([photo.data],{type:photo.mime}),{metadata:{mime:photo.mime}});
    }
    if(!data.removePhoto && (old.photoUrl||data.photoData))next.photoUrl=`/api/photo?id=${encodeURIComponent(id)}`;
    await store.setJSON(`profile/${id}`,next);
    return json({saved:true,profile:next});
  }catch(e){
    if(e instanceof Error && /^(Please|Photo|Permission|LinkedIn|Graduation|Invalid)/.test(e.message))return json({error:e.message},400);
    console.error('Organizer profile update failed',e);
    return json({error:'Unable to update profile'},500);
  }
}
export const config={path:'/api/admin/profiles'};
