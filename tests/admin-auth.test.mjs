import test from 'node:test';
import assert from 'node:assert/strict';
import {validateToken,sessionCookie,isAuthorized,requireAdmin} from '../netlify/functions/admin-auth.mjs';
import {publicProfile} from '../netlify/functions/shared.mjs';
process.env.ADMIN_REMOVE_TOKEN='test-secret-that-is-not-for-production-012345678901';
test('admin token compare accepts only exact token',()=>{
 assert.equal(validateToken(process.env.ADMIN_REMOVE_TOKEN),true);
 assert.equal(validateToken('incorrect'),false);
 assert.equal(validateToken(''),false);
});
test('session requires signed secure cookie',()=>{
 const cookie=sessionCookie();assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Strict/);assert.match(cookie,/Secure/);
 const raw=cookie.split(';')[0];
 const request=new Request('https://example.net/api/admin/profiles',{headers:{cookie:raw}});
 assert.equal(isAuthorized(request),true);
 const tampered=new Request('https://example.net/api/admin/profiles',{headers:{cookie:raw.replace(/.$/,c=>c==='a'?'b':'a')}});
 assert.equal(isAuthorized(tampered),false);
});
test('admin write requires same-origin request',()=>{
 const cookie=sessionCookie().split(';')[0];
 const req=new Request('https://example.net/api/admin/profiles',{headers:{cookie,origin:'https://another.site'}});
 assert.equal(requireAdmin(req,true).status,403);
});
test('public directory omits pending and hidden entries but retains old published entries',()=>{
 assert.equal(publicProfile({name:'existing'}),true);
 assert.equal(publicProfile({reviewStatus:'published'}),true);
 assert.equal(publicProfile({reviewStatus:'pending'}),false);
 assert.equal(publicProfile({reviewStatus:'hidden'}),false);
});
