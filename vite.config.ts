import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({ plugins: [react(), {
 name: 'corepulse-offline',
 apply: 'build',
 generateBundle(_options, bundle) {
  const files = ['/', '/index.html', '/cplogo1.png', '/cpsymbol.png', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest', ...Object.keys(bundle).filter(name=>name.startsWith('assets/')).map(name=>'/'+name)];
  const version = 'corepulse-'+Date.now();
  this.emitFile({type:'asset',fileName:'sw.js',source:`
const CACHE = ${JSON.stringify(version)};
const FILES = ${JSON.stringify(files)};
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('corepulse-') && key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch', event => {
 if(event.request.method!=='GET' || new URL(event.request.url).origin!==self.location.origin) return;
 event.respondWith(caches.open(CACHE).then(async cache=> {
  const hit=await cache.match(event.request); if(hit) return hit;
  try { return await fetch(event.request); } catch(error) {
   if(event.request.mode==='navigate') return await cache.match('/index.html') || Response.error();
   return Response.error();
  }
 }));
});`});
 }
}] });
