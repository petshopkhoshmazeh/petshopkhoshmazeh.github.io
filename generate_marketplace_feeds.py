#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build static marketplace product feeds from list.json (Python 3, no dependencies)."""
import csv
import html
import json
import math
import re
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
import xml.etree.ElementTree as ET

BASE = Path(__file__).resolve().parent.parent
SITE = 'https://petshopkhoshmazeh.ir'
G = 'http://base.google.com/ns/1.0'
K = 'https://petshopkhoshmazeh.ir/ns/feed'
ET.register_namespace('g', G)
ET.register_namespace('k', K)

class PageMeta(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta = {}
    def handle_starttag(self, tag, attrs):
        if tag == 'meta':
            d = dict(attrs)
            key = d.get('name') or d.get('property')
            if key:
                self.meta[key] = d.get('content', '')

def dump_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def dump_csv(path, data):
    fields = ['id', 'title', 'brand', 'category', 'price_toman', 'price_irr', 'availability', 'orderable', 'image_url', 'product_url', 'description']
    with path.open('w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for x in data:
            w.writerow({
                'id': x['id'], 'title': x['title'], 'brand': x['brand'], 'category': x['category'],
                'price_toman': x['price'], 'price_irr': x['price'] * 10, 'availability': x['stock_status'],
                'orderable': 'yes' if x['is_available'] else 'no', 'image_url': x['image'],
                'product_url': x['url'], 'description': x['description']
            })

def dump_rss(path, products, channel_name):
    root = ET.Element('rss', {'version': '2.0'})
    channel = ET.SubElement(root, 'channel')
    for tag, val in [('title', f'پتشاپ خوشمزه — {channel_name}'), ('link', SITE + '/'), ('description', 'فهرست محصولات پتشاپ خوشمزه، قیمت تومان در k:price_toman و ریال در g:price'), ('language', 'fa-IR')]:
        ET.SubElement(channel, tag).text = val
    for p in products:
        item = ET.SubElement(channel, 'item')
        def s(key, value, ns=None):
            ET.SubElement(item, f'{{{ns}}}{key}' if ns else key).text = str(value)
        s('title', p['title']); s('link', p['url']); s('description', p['description']); s('guid',p['url'])
        s('id',p['id'],G);s('brand',p['brand'],G);s('product_type',p['category'],G)
        s('availability', {'instock':'in_stock','preorder':'preorder','outofstock':'out_of_stock'}[p['stock_status']],G)
        s('condition','new',G);s('price',f"{p['price']*10} IRR",G);s('image_link',p['image'],G)
        s('price_toman',p['price'],K);s('stock_status',p['stock_status'],K)
    ET.indent(root, space='  ')
    ET.ElementTree(root).write(path, encoding='utf-8', xml_declaration=True)

def render_catalog(path, products, name):
    cells=[]
    for p in products:
        status={'instock':'موجود','preorder':'قابل پیش‌سفارش','outofstock':'ناموجود'}[p['stock_status']]
        cells.append('<tr><td>'+html.escape(str(p['id']))+'</td><td><a href="'+html.escape(p['url'],quote=True)+'">'+html.escape(p['title'])+'</a></td><td>'+html.escape(p['brand'])+'</td><td>'+html.escape(p['category'])+'</td><td>'+format(p['price'],',')+' تومان</td><td>'+status+'</td></tr>')
    content = '''<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,follow"><title>فهرست محصولات برای '''+name+''' | پتشاپ خوشمزه</title><style>body{font-family:Tahoma,Arial,sans-serif;background:#f7f8fb;color:#25314a;line-height:1.8;margin:0}main{max-width:1150px;margin:auto;padding:24px}h1{font-size:25px}.links{display:flex;gap:12px;flex-wrap:wrap}.links a{background:#eceafc;padding:8px 14px;border-radius:8px}table{border-collapse:collapse;background:white;width:100%;min-width:750px}th,td{border-bottom:1px solid #e6e8ed;padding:10px;text-align:right}th{background:#eeeffa}a{color:#3947a3}.scroll{overflow:auto;border-radius:12px}small{color:#53657d}</style></head><body><main><h1>فهرست '''+name+''' — پتشاپ خوشمزه</h1><p>فهرست کامل <b>'''+str(len(products))+''' محصول</b>. قیمت‌ها به تومان هستند و وضعیت «قابل پیش‌سفارش» به معنی موجودی فوری نیست.</p><p class="links"><a href="/feeds.html">راهنمای فیدها</a><a href="/torob-feed.xml">فید XML ترب</a><a href="/emalls-feed.xml">فید XML ایمالز</a><a href="/sitemap.xml">نقشه سایت</a><a href="/">بازگشت به فروشگاه</a></p><div class="scroll"><table><thead><tr><th>شناسه</th><th>محصول</th><th>برند</th><th>دسته</th><th>قیمت</th><th>وضعیت</th></tr></thead><tbody>'''+''.join(cells)+'''</tbody></table></div><p><small>این صفحه برای بررسی داده‌هاست؛ پذیرش فید و زمان نمایش در موتور مقایسه قیمت به تایید سرویس مقصد وابسته است.</small></p></main></body></html>'''
    path.write_text(content,encoding='utf-8')

def main():
    feed = json.loads((BASE/'list.json').read_text(encoding='utf-8'))
    prods=feed['products']
    assert len(prods)==136, f'Expected 129 records, got {len(prods)}'
    assert len({x['id'] for x in prods})==len(prods)
    records=[]
    for x in prods:
        id=x['id']; page=BASE/f'product-{id}.html'; pic=BASE/f'product-{id}.jpg'
        assert page.is_file() and pic.is_file(), id
        a=PageMeta();a.feed(page.read_text(encoding='utf-8'))
        meta=a.meta
        assert int(meta['product_price'])==int(x['price']), f'Price conflict {id}'
        assert meta['product_name']==x['title'], f'Title conflict {id}'
        status=meta.get('availability','').lower()
        assert status in ('instock','preorder','outofstock'), (id,status)
        assert bool(x['is_available'])==(status!='outofstock'),(id,status)
        assert x['url']==f'{SITE}/product-{id}.html', id
        assert x['image']==f'{SITE}/product-{id}.jpg', id
        desc=meta.get('description') or x['title']
        records.append({**x,'stock_status':status,'description':desc.strip()})
    assert len(records)==136
    newest=sorted(records,key=lambda x:int(x['id']),reverse=True)
    torob=[]
    for p in newest:
        torob.append({
            'title':p['title'], 'page_unique':str(p['id']), 'current_price':p['price'],
            'availability':p['stock_status'], 'category_name':p['category'],
            'image_link':p['image'], 'image_links':[p['image']], 'page_url':p['url'],
            'short_desc':p['description'][:500], 'spec':{'brand':p['brand']}
        })
    dump_json(BASE/'torob-products.json',{'count':len(torob),'products':torob})
    (BASE/'torob').mkdir(exist_ok=True)
    pages=math.ceil(len(torob)/100)
    for i in range(pages):
        dump_json(BASE/'torob'/f'page-{i+1}.json',{'count':len(torob),'max_pages':pages,'products':torob[i*100:(i+1)*100]})
    # Format of Torob v2 sample data is provided for possible future backend integration;
    # these static JSON files do not implement its required POST endpoint.
    dump_rss(BASE/'torob-feed.xml',records,'ترب')
    dump_csv(BASE/'torob-products.csv',records)
    # Keep original Emalls JSON keys and pagination for backwards compatibility.
    def emalls_product(p):
        return {key:p[key] for key in ['title','id','price','category','image','is_available','url']}
    e=[emalls_product(p) for p in records]
    dump_json(BASE/'emalls.json',{'success':True,'products':e,'total_items':len(e),'pages_count':1,'item_per_page':len(e),'page_num':1})
    (BASE/'emalls').mkdir(exist_ok=True)
    # Emalls static pagination samples: 50 products per page. Dynamic query pagination needs a backend.
    for stale in (BASE/'emalls').glob('page-*.json'):
        stale.unlink()
    ec=math.ceil(len(e)/50)
    for i in range(ec):
        dump_json(BASE/'emalls'/f'page-{i+1}.json',{'success':True,'total_items':len(e),'pages_count':ec,'item_per_page':50,'page_num':i+1,'products':e[i*50:(i+1)*50]})
    render_catalog(BASE/'emalls-products.html',records,'ایمالز')
    render_catalog(BASE/'torob-products.html',records,'ترب')
    dump_rss(BASE/'emalls-feed.xml',records,'ایمالز')
    dump_csv(BASE/'emalls-products.csv',records)
    # Simplified crawlable text format.
    print('Generated feeds for',len(records),'items.',{k:sum(x['stock_status']==k for x in records) for k in ['instock','preorder','outofstock']})

if __name__=='__main__':
    main()
