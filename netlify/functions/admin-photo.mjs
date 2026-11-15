import {getStore} from '@netlify/blobs';
import {json,photoStoreName} from './shared.mjs';
import {requireAdmin} from './admin-auth.mjs';
export default async function handler(request){
 const denied=requireAdmin(request);if(denied)return denied;
 if(request.method!=='GET')return json({error:'Method not allowed'},405);
 const id=new URL(request.url).searchParams.get('id');
 if(!/^submitted-[a-f0-9-]{36}$/.test(id||''))return json({error:'Not found'},404);
 const item=await getStore(photoStoreName()).getWithMetadata(`photo/${id}`,{type:'arrayBuffer'});
 if(!item?.data)return json({error:'Not found'},404);
 const mime=['image/jpeg','image/png','image/webp'].includes(item.metadata?.mime)?item.metadata.mime:'application/octet-stream';
 return new Response(item.data,{headers:{'Content-Type':mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});
}
export const config={path:'/api/admin/photo'};
