import {json} from './shared.mjs';
export default async()=>json({open:process.env.SUBMISSIONS_OPEN==='true'&&Boolean(process.env.TURNSTILE_SECRET_KEY)&&Boolean(process.env.TURNSTILE_SITE_KEY),siteKey:process.env.SUBMISSIONS_OPEN==='true'?process.env.TURNSTILE_SITE_KEY||'':'', photoLimitBytes:1500000});
export const config={path:'/api/config'};
