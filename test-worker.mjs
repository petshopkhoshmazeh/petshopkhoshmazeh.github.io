import fs from 'node:fs';
import worker from './emalls-cloudflare-worker.mjs';
const payload=fs.readFileSync('/mnt/data/site_marketplace_approved_ready/emalls.json','utf-8');
globalThis.fetch=async () => new Response(payload,{status:200,headers:{'content-type':'application/json'}});
for (const n of [1,2,3,4]) {
  const req=new Request(`https://petshopkhoshmazeh.ir/list.json?page=${n}&item_per_page=50`);
  const res=await worker.fetch(req);
  const j=await res.json();
  console.log('GET',n,res.status,j.products.length,j.total_items,j.pages_count,j.item_per_page,j.page_num);
  if(j.products.length !== [50,50,24,0][n-1]) throw Error('Bad page');
}
const post=new Request('https://petshopkhoshmazeh.ir/list.json',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({page:2,item_per_page:25})});
const jj=await (await worker.fetch(post)).json();
console.log('POST',jj.products.length,jj.pages_count,jj.page_num,jj.item_per_page);
if(jj.products.length!==25 || jj.pages_count!==5)throw Error('POST bad');
