/**
 * Optional Cloudflare Worker for Emalls JSON API /list.json
 * Origin is a STATIC GitHub Pages website. The worker handles GET/POST query pagination.
 * Before use, connect your domain through Cloudflare (orange-cloud proxy)
 * and attach ONLY the path route: petshopkhoshmazeh.ir/list.json*
 * No authentication is used because the product feed is public data.
 */
const SOURCE = 'https://petshopkhoshmazeh.ir/emalls.json';
const LIMIT = 500;
function asInt(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (!/^\d+$/.test(String(value))) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}
function jsonReply(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=120',
      'access-control-allow-origin': '*'
    }
  });
}
export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return new Response(null, {status:204, headers:{'access-control-allow-origin':'*','access-control-allow-methods':'GET, POST, OPTIONS','access-control-allow-headers':'content-type'}});
    if (request.method !== 'GET' && request.method !== 'POST') return jsonReply({success:false, error:'Method not allowed'},405);
    const url = new URL(request.url);
    const params = new URLSearchParams(url.search);
    if (request.method === 'POST') {
      const kind=(request.headers.get('content-type')||'').toLowerCase();
      try {
        if (kind.includes('application/json')) {
          const body = await request.json();
          for (const key of ['page','item_per_page']) if (body?.[key] != null) params.set(key, String(body[key]));
        } else if (kind.includes('application/x-www-form-urlencoded')) {
          const body = new URLSearchParams(await request.text());
          for (const key of ['page','item_per_page']) if (body.has(key)) params.set(key, body.get(key));
        }
      } catch { return jsonReply({success:false,error:'Invalid POST body'},400); }
    }
    const page=asInt(params.get('page'),1);
    const perPage=asInt(params.get('item_per_page'),50);
    if (!page || !perPage || perPage > LIMIT) return jsonReply({success:false,error:'Invalid page or item_per_page'},400);
    let upstream;
    try {upstream = await fetch(SOURCE, {headers:{'accept':'application/json'}});}
    catch {return jsonReply({success:false,error:'Catalog unavailable'},502);}
    if (!upstream.ok) return jsonReply({success:false,error:'Catalog unavailable'},502);
    let source;
    try {source = await upstream.json();}
    catch {return jsonReply({success:false,error:'Invalid catalog JSON'},502);}
    if (source.success !== true || !Array.isArray(source.products)) return jsonReply({success:false,error:'Invalid catalog schema'},502);
    const total=source.products.length;
    const pagesCount=Math.max(1,Math.ceil(total/perPage));
    const start=(page-1)*perPage;
    return jsonReply({
      success:true,
      products:source.products.slice(start,start+perPage),
      total_items:total,
      pages_count:pagesCount,
      item_per_page:perPage,
      page_num:page
    });
  }
};
