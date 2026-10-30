پتشاپ خوشمزه — اصلاحات براساس پیام‌های پشتیبانی ترب و ایمالز
تاریخ: ۲۹ اکتبر ۲۰۲۶
دامنه: https://petshopkhoshmazeh.ir

اصلاحات و کنترل‌ها:
1) در همهٔ ۱۲۴ صفحهٔ محصول، متاتگ استاندارد شناسهٔ یکتای ترب در ابتدای <head> قرار دارد:
   <meta name="product_id" content="83">
   شناسهٔ هر صفحه مطابق نام فایل محصول است (مثلاً product-195.html شناسهٔ 195).
   متاتگ قیمت، نام، عکس و موجودی موجود و مستقل از اجرای جاوااسکریپت است.
2) /list.json و /emalls.json هر دو دارای تمام ۱۲۴ محصول و فیلدهای لازم ایمالز هستند:
   success (boolean), products (array), total_items (integer), pages_count (integer),
   item_per_page (integer), page_num (integer).
   هر آیتم: title, id, price, category, image, is_available, url؛ brand نیز در list.json موجود است.
   قیمت عدد صحیح به تومان است. old_price، رنگ و گارانتی صرفاً در صورت وجود دادهٔ معتبر ارسال می‌شوند.
3) نمونه‌های JSON صفحه‌بندی‌شده: /emalls/page-1.json (50 کالا)، page-2.json (50)، page-3.json (24).
4) هر ۱۲۴ آدرس محصول، عکس، قیمت و شناسه کنترل شد. موجودی: ۴۴ آماده، ۷۱ پیش‌سفارش، ۹ ناموجود.

نکته خیلی مهم درباره درخواست ایمالز:
- هاست فعلی GitHub Pages ایستا است و پارامترهای ?page= و ?item_per_page= را در /list.json پردازش نمی‌کند.
- بنابراین /list.json (حتی با query string) همیشه خروجی کامل یک‌صفحه‌ای ۱۲۴ محصول می‌دهد.
- اگر ایمالز حتماً درخواست صفحه‌بندی پویا یا POST می‌فرستد، فقط بارگذاری ZIP روی GitHub Pages کافی نیست.
- به همین منظور کد سرورلس integrations/emalls-cloudflare-worker.js (فایل واقعی زیر integrations/) افزوده شده.
  این Worker پس از استقرار روی Cloudflare و اتصال دامنه از طریق Cloudflare Proxy
  باید به مسیر petshopkhoshmazeh.ir/list.json* متصل شود؛ سپس پارامترها واقعاً اجرا می‌شوند.
  تنظیم DNS / اتصال Cloudflare باید توسط مدیر دامنه انجام شود؛ این فایل به‌خودی‌خود Worker را فعال نمی‌کند.
  اگر سایت روی Cloudflare نیست، جایگزین آن یک بک‌اند/تابع سرورلس با همین الگوریتم است.

مراحل استقرار:
1) از سایت فعلی نسخه پشتیبان بگیرید؛ محتویات پوشه اصلی همین ZIP را در ریشه Repository مربوط به دامنه منتشر کنید.
2) پس از به‌روزرسانی GitHub Pages بررسی کنید:
   https://petshopkhoshmazeh.ir/product-83.html  -> View Source -> product_id = 83
   https://petshopkhoshmazeh.ir/product-195.html -> View Source -> product_id = 195
   https://petshopkhoshmazeh.ir/list.json       -> success:true, total_items:124
   https://petshopkhoshmazeh.ir/emalls/page-1.json -> تعداد 50 محصول
3) اگر ایمالز از page=1&item_per_page=50 استفاده می‌کند، یک سرویس پویا لازم است.
   با Worker فعال‌شده تست کنید:
   https://petshopkhoshmazeh.ir/list.json?page=1&item_per_page=50 -> 50 کالا
   https://petshopkhoshmazeh.ir/list.json?page=2&item_per_page=50 -> 50 کالا
   https://petshopkhoshmazeh.ir/list.json?page=3&item_per_page=50 -> 24 کالا
4) برای ترب تیکت قبلی را باز/جدید ایجاد کنید و لینک صفحه محصول و نمونه متاتگ را بفرستید.
5) برای ایمالز همان آدرس /list.json را برای بررسی مجدد بفرستید. اگر صفحه‌بندی پویا خواسته‌اند،
   فقط پس از استقرار Worker یا سرویس مشابه اعلام کنید پیاده‌سازی API تکمیل شده است.
6) پس از تغییر قیمت یا موجودی، لازم است تمام فایل‌های سایت/فیدها به‌روز شوند. این هاست سینک خودکار ندارد.

متن پیشنهادی ترب:
سلام، مطابق اعلام قبلی، متاتگ <meta name="product_id" content="83"> در HTML سمت سرور صفحات محصول قرار گرفته است. نمونه: https://petshopkhoshmazeh.ir/product-83.html . لطفاً پس از انتشار آخرین نسخه، خزش و بررسی مجدد انجام دهید.

متن پیشنهادی ایمالز (پس از انتشار):
سلام، خروجی JSON محصولات در https://petshopkhoshmazeh.ir/list.json در دسترس قرار گرفت که شامل success، products، total_items، pages_count، item_per_page و page_num و مشخصات ۱۲۴ محصول است. لطفاً ساختار را بررسی کرده و در صورت لزوم، نیاز به صفحه‌بندی پویا (GET/POST) را اعلام فرمایید.

شفافیت:
محصولات در پلتفرم‌های مقصد صرفاً با ایجاد فایل ثبت یا تأیید نمی‌شوند. بررسی و تأیید با ترب و ایمالز است.
