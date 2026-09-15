// Start date + today highlight. Uses the real clock with dates relative to this week's Monday.
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const mk=(pre)=>{ const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/scroll/.test(e.message))console.log('JSERR',e.message,e.detail&&e.detail.stack)});
  return new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/',virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.confirm=()=>true;if(pre)pre(w);}}).window; };
let fails=0;
const ok=(name,cond,got)=>{ console.log((cond?'PASS ':'FAIL ')+name+(cond||got===undefined?'':'  (got: '+got+')')); if(!cond) fails++; };
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const shift=(d,n)=>{ const x=new Date(d); x.setDate(x.getDate()+n); return x; };
const long=d=>d.toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short'});
const short=d=>d.toLocaleDateString('en-AU',{day:'numeric',month:'short'});
const now=new Date(); now.setHours(12,0,0,0);
const todayName=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][now.getDay()];
const monday=shift(now,-((now.getDay()+6)%7));
const sel=w=>w.eval('JSON.stringify(selectedDay)');
const store=(plan)=>JSON.stringify({version:2,activeId:'p1',plans:[{plan:Object.assign({id:'p1',name:'Dated plan',weeks:10,distanceKm:5,currentPB:'25:15',goalTime:'24:30'},plan),state:{selectedDay:{week:1,day:'Mon'}}}]});

(async()=>{
// 1. Plan that started two weeks ago: today is in week 3.
let w=mk(w=>w.localStorage.setItem('5k-plan-store',store({startDate:iso(shift(monday,-14))}))); let d=w.document;
ok('opens on today', sel(w)===JSON.stringify({week:3,day:todayName}), sel(w));
const tt=d.querySelector('.tile.today');
ok('today tile marked', !!tt && tt.getAttribute('aria-label')==='Week 3 '+todayName && tt.getAttribute('aria-current')==='date', tt&&tt.getAttribute('aria-label'));
ok('only one today tile', d.querySelectorAll('.tile.today').length===1);
ok('current week number ringed', d.querySelectorAll('.wk-lbl.today').length===1 && d.querySelector('.wk-lbl.today').textContent==='3');
ok('header shows week of plan', /Week 3 of 10/.test(d.getElementById('planSub').textContent), d.getElementById('planSub').textContent);
let ttl=d.querySelector('#dayPanel .ttl');
ok('day panel shows date + Today', ttl.textContent.includes(short(now)) && !!ttl.querySelector('.today-pill'), ttl.textContent);
d.getElementById('prevDay').click(); ttl=d.querySelector('#dayPanel .ttl');
ok('yesterday: date shown, no Today pill', ttl.textContent.includes(short(shift(now,-1))) && !ttl.querySelector('.today-pill'), ttl.textContent);
// Reopened on a later day: jumps back to today.
w.eval("renderedDate='2000-01-01'"); d.dispatchEvent(new w.Event('visibilitychange'));
ok('reopen on a new day moves to today', sel(w)===JSON.stringify({week:3,day:todayName}), sel(w));
// Notes migration from the old "weeks aren't tied to calendar dates" wording.
w=mk(w=>w.localStorage.setItem('5k-plan-store',store({notes:"Note: weeks aren't tied to calendar dates — start at Week 1 whenever you begin. Keep going."}))); 
ok('old note reworded', w.eval('plan.notes')==='Note: add a start date in Plans & settings and the grid marks today. Keep going.', w.eval('plan.notes'));

// 2. Plan starting next Monday.
const next=shift(monday,7);
w=mk(w=>w.localStorage.setItem('5k-plan-store',store({startDate:iso(next)}))); d=w.document;
ok('future plan: no today tile', !d.querySelector('.tile.today') && !d.querySelector('.wk-lbl.today'));
ok('future plan: header says Starts', d.getElementById('planSub').textContent.includes('Starts '+long(next)), d.getElementById('planSub').textContent);
ok('future plan: keeps saved day', sel(w)===JSON.stringify({week:1,day:'Mon'}), sel(w));
ok('future plan: panel shows the date', d.querySelector('#dayPanel .ttl').textContent.includes(short(next)), d.querySelector('#dayPanel .ttl').textContent);

// 3. Plan that finished (started 12 weeks ago, 10 weeks long).
const old=shift(monday,-84);
w=mk(w=>w.localStorage.setItem('5k-plan-store',store({startDate:iso(old)}))); d=w.document;
ok('finished plan: no today tile', !d.querySelector('.tile.today'));
ok('finished plan: header says Finished', d.getElementById('planSub').textContent.includes('Finished '+long(shift(old,69))), d.getElementById('planSub').textContent);

// 4. A non-Monday stored date is normalised to that week's Monday on load.
w=mk(w=>w.localStorage.setItem('5k-plan-store',store({startDate:iso(shift(monday,3))}))); 
ok('stored Thursday snaps to Monday', w.eval('plan.startDate')===iso(monday), w.eval('plan.startDate'));

// 5. Fresh default plan: undated, then dated through the editor.
w=mk(); d=w.document;
ok('undated plan: header shows weeks, no today', /10 weeks/.test(d.getElementById('planSub').textContent) && !d.querySelector('.tile.today') && !d.querySelector('.today-pill'));
ok('undated plan: no date in panel title', d.querySelector('#dayPanel .ttl').textContent.trim()==='Week 1 · Monday', d.querySelector('#dayPanel .ttl').textContent);
d.getElementById('openPlans').click();
let inp=d.querySelector('[data-bind="startDate"]');
ok('start date is a date input, empty', !!inp && inp.type==='date' && inp.value==='');
d.getElementById('startThisWeek').click();
ok('Start this week fills in Monday', inp.value===iso(monday), inp.value);
inp.value=iso(shift(monday,2));  // Wednesday of this week
d.getElementById('savePlan').click();
ok('saved without error', d.getElementById('edErr').textContent==='' && !d.getElementById('viewPlan').hidden, d.getElementById('edErr').textContent);
ok('mid-week date snapped to Monday', w.eval('plan.startDate')===iso(monday), w.eval('plan.startDate'));
ok('saving a start date jumps to today', sel(w)===JSON.stringify({week:1,day:todayName}), sel(w));
ok('header now Week 1 of 10', /Week 1 of 10/.test(d.getElementById('planSub').textContent), d.getElementById('planSub').textContent);
ok('today tile in week 1', d.querySelector('.tile.today') && d.querySelector('.tile.today').getAttribute('aria-label')==='Week 1 '+todayName);
await new Promise(r=>setTimeout(r,300));
ok('start date persisted', JSON.parse(w.localStorage.getItem('5k-plan-store')).plans[0].plan.startDate===iso(monday));
// Copy drops the date; switching back to the dated plan lands on today again.
d.getElementById('openPlans').click(); d.getElementById('dupPlan').click();
ok('copied plan is undated', w.eval('plan.startDate')==='' && w.eval('store.plans.length')===2 && !d.querySelector('.tile.today'), w.eval('plan.startDate'));
[...d.querySelectorAll('.plan-card')].find(c=>!c.textContent.includes('copy')).querySelector('button').click();
ok('switching back lands on today', w.eval('plan.startDate')===iso(monday) && sel(w)===JSON.stringify({week:1,day:todayName}), sel(w));
// Clear the date.
d.getElementById('startClear').click(); d.getElementById('savePlan').click();
ok('cleared date: undated again', w.eval('plan.startDate')==='' && !d.querySelector('.tile.today') && /10 weeks/.test(d.getElementById('planSub').textContent), d.getElementById('planSub').textContent);
// Validation rejects a nonsense date without crashing.
ok('bad date rejected', /Start date/.test(w.eval("draft=JSON.parse(JSON.stringify(plan)); draft.startDate='2026-13-45'; validateDraft().join(' ')")));
// Backup round trip keeps the date.
w.eval("plan.startDate='"+iso(monday)+"'; render();");
const snap=w.eval('JSON.stringify(snapshot())'); const w3=mk(); w3.eval('applyData('+snap+')'); w3.render();
ok('import keeps start date and opens on today', w3.eval('plan.startDate')===iso(monday) && sel(w3)===JSON.stringify({week:1,day:todayName}), sel(w3));
// Existing tests still expect the plain sub line for undated plans.
ok('helpers: mondayOf / addDays', w.eval("mondayOf('2026-09-17')")==='2026-09-14' && w.eval("addDays('2026-09-14',69)")==='2026-11-22' && w.eval("mondayOf('nope')")==='');
if(fails){ console.log(fails+' FAILED'); process.exitCode=1; } else console.log('dates: all passed');
})();
