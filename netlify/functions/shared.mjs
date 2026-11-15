export const MAX_PHOTO_BYTES = 1_500_000;
export const fields = ['name','status','title','organization','faculty','major','graduationYear','industry','otherInterests','advice','linkedin'];
export const clean = (value,max=160)=>typeof value==='string'?value.trim().replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,max):'';
export const splitValues=(value,maxItems=8)=>clean(value,600).split(/[,;\n]+/).map(s=>clean(s,70)).filter(Boolean).slice(0,maxItems);
export function imageInfo(encoded){
 if(!encoded)return null;
 if(typeof encoded!=='string'||encoded.length>MAX_PHOTO_BYTES*1.4+100)throw new Error('Photo is too large');
 const match=/^data:image\/(jpeg|png|webp);base64,([a-zA-Z0-9+/]+={0,2})$/.exec(encoded);
 if(!match)throw new Error('Photo must be JPEG, PNG or WebP');
 const data=Buffer.from(match[2],'base64');
 if(data.length>MAX_PHOTO_BYTES||data.length<16)throw new Error('Photo must be between 16 bytes and 1.5 MB');
 const jpg=data[0]===0xff&&data[1]===0xd8&&data[2]===0xff;
 const png=data.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'));
 const webp=data.toString('ascii',0,4)==='RIFF'&&data.toString('ascii',8,12)==='WEBP';
 if(!(match[1]==='jpeg'&&jpg||match[1]==='png'&&png||match[1]==='webp'&&webp))throw new Error('Photo file content does not match its type');
 return {data,mime:`image/${match[1]}`};
}
export function validate(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Invalid profile');
 const p=Object.fromEntries(fields.map(f=>[f,clean(input[f],f==='advice'?400:160)]));
 if(p.name.length<2||p.name.length>100)throw new Error('Please enter a name (2–100 characters)');
 if(!p.faculty||!p.major||!p.industry||!p.status)throw new Error('Please fill in faculty, major, industry and current status');
 if(p.graduationYear&&!/^(20[2-5]\d)$/.test(p.graduationYear))throw new Error('Graduation year must be 2020–2059');
 if(p.linkedin){try{const url=new URL(p.linkedin);if(url.protocol!=='https:'||!['linkedin.com','www.linkedin.com'].includes(url.hostname))throw 0;p.linkedin=url.toString()}catch{throw new Error('LinkedIn must be an https://linkedin.com profile URL')}}
 if(input.publishConsent!==true)throw new Error('Permission to show your profile is required');
 if(input.linkedinConsent!==true)p.linkedin='';
 return {...p,fullName:p.name,companies:splitValues(input.companies),roles:splitValues(input.roles),topics:splitValues(input.topics),isPlaceholder:false,source:'self-submitted'};
}
export const json=(obj,status=200,extra={})=>new Response(JSON.stringify(obj),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});
export function originsMatch(request){
 const origin=request.headers.get('origin');
 if(!origin)return false;
 try{return new URL(origin).origin===new URL(request.url).origin}catch{return false}
}
export function storeName(){return process.env.CONTEXT==='production'?'networking-profiles-prod':'networking-profiles-preview'}
export function photoStoreName(){return process.env.CONTEXT==='production'?'networking-photos-prod':'networking-photos-preview'}

export const publicProfile=p=>Boolean(p)&&!(['pending','hidden'].includes(p.reviewStatus));
