import {getStore} from '@netlify/blobs';
import {json,originsMatch,storeName,photoStoreName} from './shared.mjs';
import {timingSafeEqual} from 'node:crypto';
export default async function handler(request){
 if(request.method!=='DELETE')return json({error:'Method not allowed'},405);
 if(!originsMatch(request))return json({error:'Origin must match the site'},403);
 const secret=process.env.ADMIN_REMOVE_TOKEN||'';
 const supplied=(request.headers.get('authorization')||'').replace(/^Bearer /,'');
 if(!secret||!supplied||Buffer.byteLength(secret)!==Buffer.byteLength(supplied)||!timingSafeEqual(Buffer.from(secret),Buffer.from(supplied)))return json({error:'Unauthorized'},401);
 let id='';try{id=(await request.json()).id}catch{return json({error:'Invalid JSON'},400)}
 if(typeof id!=='string'||!/^submitted-[a-f0-9-]{36}$/.test(id))return json({error:'Only submitted profiles can be removed'},400);
 await getStore(storeName()).delete(`profile/${id}`);
 await getStore(photoStoreName()).delete(`photo/${id}`);
 return json({removed:true});
}
export const config={path:'/api/remove-profile'};
