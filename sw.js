const CACHE_NAME = 'raqeem-offline-v1';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    'https://unpkg.com/docx@7.3.0/build/index.js',
    'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Tajawal:wght@400;500;700;800&family=Reem+Kufi:wght@400;700&display=swap'
];

// تثبيت ملفات الكاش أول مرة
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log('تم حفظ الملفات للعمل أوفلاين');
            return cache.addAll(urlsToCache);
        })
    );
});

// تشغيل الموقع من الكاش في حال عدم وجود إنترنت
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
        .then(response => {
            // إذا الملف موجود بالكاش، رجعه.. وإذا لا، حمله من النت
            return response || fetch(event.request);
        })
    );
});
