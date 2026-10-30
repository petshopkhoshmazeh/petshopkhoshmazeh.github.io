/* Petshop Khoshmazeh: progressive local image recovery (2026-10-30).
   WebP -> JPG -> unobtrusive text placeholder, without external image hosts.
   Does not touch payment, invoices or cart data. */
(function(){
  'use strict';
  var productFile=/^product-(\d+)(?:-card)?\.(?:webp|jpe?g)$/i;
  function fileOf(img){
    try {
      var url=new URL(img.getAttribute('src')||'',document.baseURI);
      if(url.origin!==location.origin) return null;
      var name=url.pathname.split('/').pop();
      var match=name.match(productFile);
      return match ? {id:match[1],name:name} : null;
    }catch(_){return null;}
  }
  function showFallback(img){
    if(img.dataset.khzFallbackDone==='yes')return;
    img.dataset.khzFallbackDone='yes';
    img.hidden=true;
    img.style.display='none';
    var text=document.createElement('span');
    text.className='khz-image-unavailable';
    text.setAttribute('role','img');
    text.setAttribute('aria-label','تصویر این محصول در حال حاضر قابل نمایش نیست');
    text.textContent='تصویر محصول موقتاً در دسترس نیست';
    text.style.cssText='display:flex;align-items:center;justify-content:center;max-width:100%;min-height:72px;padding:12px 18px;text-align:center;direction:rtl;color:#64748b;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:12px;font:600 12px/1.8 system-ui,sans-serif;';
    if(img.parentNode)img.parentNode.insertBefore(text,img.nextSibling);
  }
  function recover(img){
    var f=fileOf(img);
    if(!f || img.dataset.khzFallbackDone==='yes')return;
    // Avoid toggling forever between JPG/WebP, including offline and 404 cases.
    if(img.dataset.khzTriedBackup==='yes') { showFallback(img);return; }
    img.dataset.khzTriedBackup='yes';
    var replacement=/\.webp$/i.test(f.name)
      ? 'product-'+f.id+'.jpg'
      : 'product-'+f.id+'-card.webp';
    img.src=replacement+'?v=20261030a';
  }
  document.addEventListener('error',function(e){
    if(e.target && e.target.tagName==='IMG')recover(e.target);
  },true);
  function scan(){
    document.querySelectorAll('img[src*="product-"]').forEach(function(img){
      if(img.complete && img.naturalWidth===0)recover(img);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan,{once:true});
  else scan();
})();
