const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/scroll/.test(e.message))console.log('JSERR',e.message)});
let captured=null;
const w=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/',virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
  // fake API: echo back the example plan with a new name and 8 weeks / 3 phases
  w.fetch=async(url,opts)=>{ captured=JSON.parse(opts.body); const ex=JSON.parse(captured.messages[0].content.split('\n')[1]);
    const reply={name:'Sub 20 5km',distanceKm:5,currentPB:'21:00',goalTime:'19:59',weeks:8,phases:[{key:'phase1',label:'Base',start:1,detail:ex.phases[0].detail},{key:'phase2',label:'Sharpen',start:4,detail:ex.phases[2].detail},{key:'phase3',label:'Taper',start:8,detail:ex.phases[3].detail}],
      guides:{Easy:{what:'w',feel:'f',tip:'t',sessions:{phase1:['*Run* 30 min'],phase2:['*Run* 35 min'],phase3:['*Run* 15 min']}},Intervals:{what:'w',feel:'f',tip:'t',sessions:{phase1:['*Warm up* 10 min','*Reps* 8 x 400m at 1:36']}},Tempo:{what:'w',feel:'f',tip:'t',sessions:{}},Long:{what:'w',feel:'f',tip:'t',sessions:{phase3:['*Race day.* Go.']}}},notes:'Tip: keep easy days easy.'};
    return {ok:true,status:200,json:async()=>({content:[{type:'text',text:'```json\n'+JSON.stringify(reply)+'\n```'}]})}; };
}}).window;const d=w.document;
(async()=>{
  d.getElementById('openPlans').click();
  d.getElementById('aiGenerate').click(); await new Promise(r=>setTimeout(r,50));
  console.log('no key msg:',d.getElementById('aiStatus').textContent);
  d.getElementById('aiKey').value='sk-ant-test'; d.getElementById('aiBrief').value='sub 20 5k in 8 weeks';
  d.getElementById('aiGenerate').click(); await new Promise(r=>setTimeout(r,200));
  console.log('status:',JSON.stringify(d.getElementById('aiStatus').textContent),'| planStatus:',d.getElementById('planStatus').textContent);
  console.log('sent model:',captured.model,'| system mentions shape:',captured.system.includes('phases'),'| example included:',captured.messages[0].content.includes('"name":"5km Training Plan"'));
  console.log('active plan:',w.eval('plan.name'),'| weeks:',w.eval('plan.weeks'),'| phases:',w.eval('plan.phases.map(p=>p.label+"@"+p.start).join(",")'),'| pace:',w.eval('goalPace()'));
  console.log('intervals steps p1:',w.eval('plan.guides.Intervals.sessions[plan.phases[0].id].join(" | ")'));
  console.log('plans total:',w.eval('store.plans.length'),'| editor shows new plan:',d.querySelector('[data-bind="name"]').value);
  d.getElementById('closePlans').click(); console.log('tiles:',d.querySelectorAll('.tile').length,'(expect 56) | phase rows:',[...d.querySelectorAll('.phase-row')].map(x=>x.textContent).join(','));
})();
