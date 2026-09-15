// Inside the iOS app (Capacitor) a backup goes through the native share sheet; on the web it is still a download.
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
let fails=0; const ok=(n,c,g)=>{ console.log((c?'PASS ':'FAIL ')+n+(c||g===undefined?'':'  (got: '+g+')')); if(!c) fails++; };
const mk=(pre)=>{ const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/scroll/.test(e.message))console.log('JSERR',e.message)});
  return new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/',virtualConsole:vc,beforeParse(w){
    w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.confirm=()=>true;
    w.URL.createObjectURL=()=>'blob:test'; w.URL.revokeObjectURL=()=>{};
    w.__clicks=[]; w.HTMLAnchorElement.prototype.click=function(){ w.__clicks.push(this.getAttribute('download')); };
    if(pre) pre(w);
  }}).window; };
(async()=>{
  // Native: fake the bridge the Capacitor runtime injects.
  const calls={};
  let w=mk(w=>{ w.Capacitor={ isNativePlatform:()=>true, Plugins:{
    Filesystem:{ writeFile:async o=>{ calls.write=o; return {uri:'file:///caches/'+o.path}; } },
    Share:{ share:async o=>{ calls.share=o; } } } }; });
  let d=w.document;
  d.getElementById('openPlans').click(); d.getElementById('saveBtn').click(); await new Promise(r=>setTimeout(r,150));
  ok('native: backup written to the cache folder as utf8 JSON', calls.write && calls.write.directory==='CACHE' && calls.write.encoding==='utf8' && calls.write.path==='5km-training-plan-backup.json', JSON.stringify(calls.write&&{d:calls.write.directory,e:calls.write.encoding,p:calls.write.path}));
  ok('native: backup holds the plan store', (()=>{ try{ const j=JSON.parse(calls.write.data); return j.version===2 && j.plans.length===1 && Array.isArray(j.progress); }catch(e){ return false; } })());
  ok('native: share sheet gets the file', calls.share && calls.share.url==='file:///caches/5km-training-plan-backup.json' && /backup/i.test(calls.share.title), JSON.stringify(calls.share));
  ok('native: no download link clicked', w.__clicks.length===0, w.__clicks.length);
  ok('native: status says shared', d.getElementById('saveStatus').textContent==='Backup shared', d.getElementById('saveStatus').textContent);
  // Cancelling the share sheet is not an error.
  w.Capacitor.Plugins.Share.share=async()=>{ throw new Error('Share canceled'); };
  d.getElementById('saveBtn').click(); await new Promise(r=>setTimeout(r,150));
  ok('native: cancelled share shows no error', d.getElementById('saveStatus').textContent==='', d.getElementById('saveStatus').textContent);
  // Web: unchanged download path.
  w=mk(); d=w.document;
  ok('web: bridge is null', w.eval('nativeBridge()')===null);
  d.getElementById('openPlans').click(); d.getElementById('saveBtn').click(); await new Promise(r=>setTimeout(r,150));
  ok('web: download link clicked with backup name', w.__clicks.length===1 && w.__clicks[0]==='5km-training-plan-backup.json', JSON.stringify(w.__clicks));
  ok('web: status says downloaded', d.getElementById('saveStatus').textContent==='Backup downloaded', d.getElementById('saveStatus').textContent);
  ok('fonts are bundled, not fetched from Google', !html.includes('fonts.googleapis.com') && html.includes('fonts/fraunces-latin.woff2') && html.includes('fonts/inter-latin.woff2') && fs.existsSync(require('path').join(__dirname,'..','fonts','inter-latin.woff2')));
  ok('service worker only registers on http(s)', /serviceWorker' in navigator && \/\^https\?:\$\/\.test\(location\.protocol\)/.test(html));
  if(fails){ console.log(fails+' FAILED'); process.exitCode=1; } else console.log('native: all passed');
})();
