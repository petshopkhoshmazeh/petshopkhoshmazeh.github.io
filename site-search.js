/* Pat Shop Khoshmazeh: accessible, offline-compatible product search across all pages. */
(()=>{
  'use strict';
  const catalog = window.KHOSHMAZEH_SEARCH_CATALOG;
  if (!Array.isArray(catalog) || window.__khzSearchReady) return;
  window.__khzSearchReady = true;
  let modal=null,shade=null,input=null,results=null,count=null,lastFocus=null,live=false;
  const aliases = [
    ['رویال کنین','royal canin'],['جوسرا','josera'],['اوریجن','orijen'],
    ['گورمت','gourmet'],['گورمه','gourmet'],['هیلز','hills'],['هیلز','hill s'],
    ['ویسکاس','whiskas'],['پورینا','purina'],['پروپلن','pro plan'],
    ['بولداگ','bulldog'],['کوکر','cocker'],['مینی','mini'],
    ['پاپی','puppy'],['توله','puppy'],['کیتن','kitten'],
    ['نچرکت','naturecat'],['نچرال','naturelle'],['گربه','cat'],['سگ','dog']
  ];
  function norm(v){
    return String(v??'').normalize('NFKC')
      .replace(/[۰-۹]/g,c=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(c))
      .replace(/[٠-٩]/g,c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c))
      .replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[ۀة]/g,'ه')
      .replace(/[\u064b-\u065f\u0670\u200c\u200d\u200e\u200f]/g,' ')
      .replace(/ـ/g,'').replace(/&/g,' and ')
      .replace(/[^\p{L}\p{N}]+/gu,' ').replace(/\s+/g,' ').trim().toLowerCase();
  }
  const aliasKeys=aliases.map(([a,b])=>[norm(a),norm(b)]);
  const enriched=catalog.map(p=>{
    const title=norm(p.name+' '+p.brand);
    const extra=norm(p.category+' '+p.description+' '+p.id);
    let words=title+' '+extra;
    for(const [fa,en] of aliasKeys){if(words.includes(fa)||words.includes(en)) words+=' '+fa+' '+en;}
    return {p,title,words};
  });
  function termsOf(query){
    const t=norm(query);return t ? t.split(' ').filter(Boolean):[];
  }
  function matchScores(query){
    const terms=termsOf(query);
    if(!terms.length)return [];
    return enriched.map(x=>{
      let score=0;
      for(const term of terms){
        const variants=[term];
        for(const [fa,en] of aliasKeys){
          if(fa===term || en===term || (term.length>=3 && en.split(' ').includes(term))){variants.push(fa,en);}
        }
        const match=variants.some(v=>v&&x.words.includes(v));
        if(!match)return null;
        score+=variants.some(v=>v&&x.title.includes(v)) ? 10:2;
      }
      if(x.title.includes(norm(query)))score+=25;
      return {p:x.p,score};
    }).filter(Boolean).sort((a,b)=>b.score-a.score||a.p.id-b.p.id);
  }
  const fmt=n=>Number(n).toLocaleString('fa-IR');
  const htmlEsc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function init(){
    if(modal)return;
    const style=document.createElement('style');
    style.id='khz-search-modal-style';
    style.textContent=`
      #khzSearchShade{position:fixed;inset:0;z-index:2147483100;background:rgba(15,20,39,.75);display:none}
      #khzSearchModal{position:fixed;z-index:2147483101;top:6vh;bottom:6vh;left:max(12px,calc((100vw - 740px)/2));right:max(12px,calc((100vw - 740px)/2));border-radius:18px;background:#fff;color:#1c2434;padding:18px;display:none;overflow:auto;box-shadow:0 20px 60px #0008;direction:rtl;font-family:Vazirmatn,Tahoma,Arial,sans-serif}
      #khzSearchModal.kh-on,#khzSearchShade.kh-on{display:block}
      #khzSearchModal *{box-sizing:border-box}
      #khzSearchModal .khz-top{display:flex;gap:8px;align-items:center;position:sticky;top:-18px;z-index:2;background:#fff;padding:5px 0 12px}
      #khzSearchModal .khz-q{flex:1;width:100%;min-width:0;border:1.5px solid #c5cbd4;border-radius:12px;background:#fff;color:#182332;font:inherit;font-size:16px;padding:12px;outline:none}
      #khzSearchModal .khz-q:focus{border-color:#6366f1;box-shadow:0 0 0 3px #6366f122}
      #khzSearchModal .khz-x{border:1px solid #d7dae1;background:#f8fafc;color:#1e293b;border-radius:11px;min-height:47px;min-width:47px;font-size:24px;cursor:pointer}
      #khzSearchModal .khz-count{color:#475569;margin:4px 2px 14px;font-size:14px;min-height:23px}
      #khzSearchModal .khz-results{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:9px}
      #khzSearchModal .khz-item{display:flex;gap:11px;align-items:center;min-height:96px;border:1px solid #e4e7ed;border-radius:13px;background:#fff;color:#1e293b;padding:10px;text-decoration:none;transition:border .16s,background .16s}
      #khzSearchModal .khz-item:hover,#khzSearchModal .khz-item:focus{border-color:#7779e4;background:#f6f6ff;outline:none}
      #khzSearchModal .khz-item img{width:65px;height:77px;object-fit:contain;flex-shrink:0;border-radius:7px;background:#fff}
      #khzSearchModal .khz-item-body{flex:1;min-width:0}
      #khzSearchModal .khz-item-name{font-size:13px;font-weight:750;line-height:1.9;color:#1e293b}
      #khzSearchModal .khz-item-price{font-size:13px;font-weight:750;margin-top:5px;color:#176452}
      #khzSearchModal .khz-unavailable{color:#ac2525;font-weight:750;font-size:12px}
      #khzSearchModal .khz-empty{grid-column:1/-1;padding:25px 12px;text-align:center;color:#475569;background:#f8fafc;border-radius:12px}
      .khzSearchOpen{position:fixed!important;left:16px;bottom:20px;z-index:1002;border:0;border-radius:999px;background:#5555cb;color:white;box-shadow:0 4px 18px #0005;padding:10px 15px;display:flex;align-items:center;gap:6px;font-family:Vazirmatn,Tahoma,Arial,sans-serif;font-size:13px;font-weight:750;cursor:pointer}
      .khzSearchGo{position:absolute;right:0;top:0;height:100%;width:42px;border:0;background:transparent;color:inherit;cursor:pointer;z-index:2;display:flex;align-items:center;justify-content:center}
      .khzSearchGo svg{width:19px;height:19px;stroke:currentColor}
      .search-wrap>.search-icon{visibility:hidden!important;pointer-events:none}
      @media(max-width:600px){#khzSearchModal{inset:0;border-radius:0;padding:12px}#khzSearchModal .khz-top{top:-12px}#khzSearchModal .khz-results{grid-template-columns:1fr}#khzSearchModal .khz-item{min-height:83px} .khzSearchOpen{bottom:12px;left:12px}}
    `;
    document.head.appendChild(style);
    shade=document.createElement('div');shade.id='khzSearchShade';shade.addEventListener('click',close);
    modal=document.createElement('section');modal.id='khzSearchModal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','جستجوی محصولات');
    modal.innerHTML='<div class="khz-top"><input class="khz-q" type="search" placeholder="نام محصول یا برند را جست‌وجو کنید…" aria-label="جستجوی محصولات"><button class="khz-x" aria-label="بستن جست‌وجو" type="button">×</button></div><div class="khz-count" aria-live="polite"></div><div class="khz-results"></div>';
    input=modal.querySelector('.khz-q');results=modal.querySelector('.khz-results');count=modal.querySelector('.khz-count');
    modal.querySelector('.khz-x').addEventListener('click',close);
    input.addEventListener('input',()=>draw(input.value));
    input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();draw(input.value);input.blur();}});
    document.body.append(shade,modal);
  }
  function draw(q){
    const matches=matchScores(q);
    results.replaceChildren();
    if(!termsOf(q).length){count.textContent='نام محصول یا برند را بنویسید.';return;}
    count.textContent=fmt(matches.length)+' محصول پیدا شد';
    if(!matches.length){results.innerHTML='<div class="khz-empty">محصولی پیدا نشد. نام برند یا مدل را کوتاه‌تر جست‌وجو کنید.</div>';return;}
    const fragment=document.createDocumentFragment();
    for(const {p} of matches){
      const a=document.createElement('a');a.href=p.url;a.className='khz-item';
      const status=p.stock?'<div class="khz-item-price">'+fmt(p.price)+' تومان</div>':'<div class="khz-unavailable">ناموجود</div>';
      a.innerHTML='<img src="'+htmlEsc(p.image)+'" loading="lazy" alt=""><span class="khz-item-body"><span class="khz-item-name">'+htmlEsc(p.name)+'</span>'+status+'</span>';
      fragment.appendChild(a);
    }
    results.appendChild(fragment);
  }
  function open(q,origin){
    lastFocus=origin||document.activeElement;init();
    input.value=q||'';shade.classList.add('kh-on');modal.classList.add('kh-on');
    live=true;draw(input.value);
    input.focus({preventScroll:true});
    try{input.setSelectionRange(input.value.length,input.value.length)}catch(e){}
  }
  function close(){
    if(!live)return;live=false;shade.classList.remove('kh-on');modal.classList.remove('kh-on');
    if(lastFocus&&lastFocus.isConnected)lastFocus.focus({preventScroll:true});
  }
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&live){e.stopPropagation();e.preventDefault();close();}},true);
  const headerSearch=document.getElementById('searchInput');
  if(headerSearch){
    headerSearch.addEventListener('input',e=>{if(!live&&e.target.value.trim())open(e.target.value,e.target);},true);
    headerSearch.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();open(headerSearch.value,headerSearch);}},true);
    const holder=headerSearch.closest('.search-wrap');
    if(holder){
      const go=document.createElement('button');go.type='button';go.className='khzSearchGo';go.setAttribute('aria-label','نمایش نتایج جست‌وجو');go.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke-width="2.3" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7"></circle><path d="m16 16 5 5"></path></svg>';
      go.addEventListener('click',()=>open(headerSearch.value,headerSearch));holder.appendChild(go);
    }
  } else {
    // Make the same search available on category and product pages, without editing their header layouts.
    const btn=document.createElement('button');btn.type='button';btn.className='khzSearchOpen';btn.textContent='🔎 جستجوی محصولات';btn.addEventListener('click',()=>open('',btn));document.body.appendChild(btn);
  }
  window.KhoshmazehSearch={open,normalize:norm,match:matchScores};
})();
