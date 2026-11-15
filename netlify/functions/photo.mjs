import {getStore} from '@netlify/blobs';
import {photoStoreName,storeName,json,publicProfile} from './shared.mjs';
export default async function handler(request){
 if(request.method!=='GET')return json({error:'Method not allowed'},405);
 const id=new URL(request.url).searchParams.get('id')||'';
 if(!/^submitted-[a-f0-9-]{36}$/.test(id))return json({error:'Not found'},404);
 try{
  const profile=await getStore(storeName()).get(`profile/${id}`,{type:'json'});
  if(!publicProfile(profile))return json({error:'Not found'},404);
  const store=getStore(photoStoreName());
  const item=await store.getWithMetadata(`photo/${id}`,{type:'arrayBuffer'});
  if(!item?.data)return json({error:'Not found'},404);
  const mime=['image/jpeg','image/png','image/webp'].includes(item.metadata?.mime)?item.metadata.mime:'application/octet-stream';
  return new Response(item.data,{status:200,headers:{'Content-Type':mime,'X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",'Cache-Control':'public, max-age=3600'}});
 }catch{return json({error:'Unable to retrieve photo'},500)}
}
export const config={path:'/api/photo'};
