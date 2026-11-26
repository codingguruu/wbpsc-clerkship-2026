'use strict';
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const bn = new Intl.NumberFormat('bn-BD',{maximumFractionDigits:2});
function load(key, fallback){try{const v=localStorage.getItem('clerkship26:'+key);return v===null?fallback:JSON.parse(v);}catch{return fallback;}}
function save(key,val){try{localStorage.setItem('clerkship26:'+key,JSON.stringify(val));}catch{/* storage blocked */}}
const chapters=$$('.chapter');
const validIds=new Set(chapters.map(c=>c.id));
function loadIds(k){const a=load(k,[]);return new Set(Array.isArray(a)?a.filter(x=>validIds.has(x)):[]);}
const saved=loadIds('saved'), read=loadIds('read');
let filter='all';
function theme(dark){document.documentElement.classList.toggle('dark',dark);$('#theme').setAttribute('aria-pressed',String(dark));save('dark',dark);}
theme(load('dark',window.matchMedia('(prefers-color-scheme:dark)').matches)===true);
$('#theme').addEventListener('click',()=>theme(!document.documentElement.classList.contains('dark')));
function menu(open){$('#sidebar').classList.toggle('open',open);$('#menu-toggle').setAttribute('aria-expanded',String(open));}
$('#menu-toggle').addEventListener('click',()=>menu(!$('#sidebar').classList.contains('open')));
document.addEventListener('keydown',e=>{if(e.key==='Escape')menu(false);});
function refreshMarks(){
  $$('[data-save]').forEach(b=>{const on=saved.has(b.dataset.save);b.setAttribute('aria-pressed',String(on));b.textContent=on?'★':'☆';b.setAttribute('aria-label',on?'বুকমার্ক সরাও':'বুকমার্ক করো');});
  $$('[data-read]').forEach(b=>{const on=read.has(b.dataset.read);b.setAttribute('aria-pressed',String(on));b.textContent=on?'✓ পড়া হয়েছে':'✓ পড়া শেষ';});
  $('#progress-fill').style.width=100*read.size/chapters.length+'%';$('#progress-label').textContent=`${bn.format(read.size)} / ${bn.format(chapters.length)} অধ্যায়`;
}
const normalize=s=>s.normalize('NFC').toLocaleLowerCase().trim();
function applyFilter(){
 const words=normalize($('#search').value).split(/\s+/).filter(Boolean);let count=0;
 for(const c of chapters){const pass=filter==='all'||filter===c.dataset.group||(filter==='saved'&&saved.has(c.id));const matches=words.every(w=>normalize(c.textContent).includes(w));c.hidden=!(pass&&matches);if(!c.hidden)count++;
   const title=normalize($('.chapter-head',c).textContent);const titleMatches=words.every(w=>title.includes(w));
   $$('.fact',c).forEach(f=>f.hidden=words.length>0&&!titleMatches&&!words.every(w=>normalize(f.textContent).includes(w)));
   // If words matched across different facts, keep the chapter readable.
   const facts=$$('.fact',c);if(matches&&facts.length&&facts.every(f=>f.hidden))facts.forEach(f=>f.hidden=false);
 }
 $('#result-count').textContent=`${bn.format(count)}টি অধ্যায়`;$('#no-results').hidden=count!==0;
 $$('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)));
}
$$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;applyFilter();}));
$('#search').addEventListener('input',applyFilter);
$$('[data-save]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.save;saved.has(id)?saved.delete(id):saved.add(id);save('saved',[...saved]);refreshMarks();applyFilter();}));
$$('[data-read]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.read;read.has(id)?read.delete(id):read.add(id);save('read',[...read]);refreshMarks();}));
$$('#sidebar nav a').forEach(a=>a.addEventListener('click',()=>{if(a.dataset.group||a.hash==='#notes'){filter=a.dataset.group||'all';$('#search').value='';applyFilter();}menu(false);}));
refreshMarks();applyFilter();
if(location.hash&&validIds.has(location.hash.slice(1)))requestAnimationFrame(()=>document.getElementById(location.hash.slice(1)).scrollIntoView());
const bank=JSON.parse($('#quiz-data').textContent);let current=[],done=false;
function el(tag,cls,text){const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;}
function checked(i){const node=$(`input[name="q${i}"]:checked`);return node?Number(node.value):null;}
function status(){const n=current.filter((q,i)=>checked(i)!==null).length;$('#quiz-status').textContent=`উত্তর দেওয়া হয়েছে: ${bn.format(n)} / ${bn.format(current.length)}`;}
function start(){const mode=$('#quiz-mode').value;current=bank.filter(q=>mode==='all'||q.group===mode);done=false;const box=$('#questions');box.replaceChildren();$('#score').hidden=true;$('#score').replaceChildren();$('#submit-quiz').disabled=false;$('#quiz-panel').hidden=false;
 current.forEach((q,i)=>{const field=el('fieldset','quiz-q');field.append(el('legend','',`${bn.format(i+1)}. ${q.q}`));const opts=el('div','quiz-options');q.options.forEach((o,j)=>{const label=el('label','option');const input=el('input');input.type='radio';input.name=`q${i}`;input.value=String(j);input.addEventListener('change',status);label.append(input,el('span','',`${String.fromCharCode(65+j)}. ${o}`));opts.append(label);});field.append(opts);box.append(field);});status();}
$('#start-quiz').addEventListener('click',start);$('#reset-quiz').addEventListener('click',()=>{start();$('#quiz-panel').scrollIntoView({block:'start'});});
$('#submit-quiz').addEventListener('click',()=>{if(done)return;done=true;let correct=0,wrong=0,blank=0;const fields=$$('.quiz-q');current.forEach((q,i)=>{const choice=checked(i);if(choice===null)blank++;else if(choice===q.answer)correct++;else wrong++;const options=$$('.option',fields[i]);options[q.answer].classList.add('correct');if(choice!==null&&choice!==q.answer)options[choice].classList.add('wrong');$$('input',fields[i]).forEach(x=>x.disabled=true);fields[i].append(el('p','feedback',`সঠিক উত্তর: ${String.fromCharCode(65+q.answer)}. ${q.options[q.answer]}`));});
 const score=correct-wrong*.25;const result=$('#score');result.replaceChildren(el('div','','তোমার প্রাপ্ত নম্বর'),el('strong','',`${bn.format(score)} / ${bn.format(current.length)}`),el('p','',`সঠিক: ${bn.format(correct)}  •  ভুল: ${bn.format(wrong)}  •  না দেওয়া: ${bn.format(blank)}`),el('p','','প্রতিটি প্রশ্নের সঠিক উত্তর উপরে দেখানো হয়েছে।'));result.hidden=false;$('#submit-quiz').disabled=true;result.scrollIntoView({block:'nearest'});
});