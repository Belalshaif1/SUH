import React from "react"; // استيراد مكتبة React الأساسية
import { createRoot } from "react-dom/client"; // استيراد وظيفة createRoot لإنشاء جذر تطبيق React
import App from "./App.tsx"; // استيراد المكون الأساسي للتطبيق
import "./index.css"; // استيراد ملفات التنسيق العامة

createRoot(document.getElementById("root")!).render( // العثور على عنصر 'root' في HTML وبدء عرض التطبيق داخله
  <React.StrictMode> // استخدام الوضع الصارم لـ React للمساعدة في اكتشاف المشاكل المحتملة
    <App /> // عرض المكون الرئيسي للتطبيق
  </React.StrictMode> // إغلاق وسم الوضع الصارم
); // نهاية دالة العرض

if ('serviceWorker' in navigator) { // التحقق مما إذا كان المتصفح يدعم Service Worker
  window.addEventListener('load', () => { // انتظار تحميل نافذة المتصفح بالكامل قبل البدء
    navigator.serviceWorker.register('/sw.js').then(registration => { // تسجيل ملف sw.js لتفعيل ميزات التطبيق المتقدمة (PWA)
      // التحقق من وجود تحديثات عند كل تحميل
      registration.update(); // التحقق من وجود تحديثات لـ Service Worker عند كل تحميل

      registration.onupdatefound = () => { // في حال العثور على تحديث جديد
        const installingWorker = registration.installing; // الحصول على الـ worker الذي يتم تثبيته حالياً
        if (installingWorker) { // التأكد من وجود worker قيد التثبيت
          installingWorker.onstatechange = () => { // مراقبة تغير حالة التثبيت
            if (installingWorker.state === 'installed') { // إذا اكتمل التثبيت بنجاح
              if (navigator.serviceWorker.controller) { // إذا كان هناك Service Worker قديم يتحكم في الصفحة حالياً
                // محتوى جديد متاح؛ يرجى تحديث الصفحة.
                console.log('New content is available; please refresh.'); // طباعة رسالة تفيد بوجود محتوى جديد يتطلب تحديث الصفحة
              }
            }
          };
        }
      };
    }).catch(err => { // في حال فشل عملية التسجيل
      console.log('SW registration failed: ', err); // طباعة رسالة الخطأ في لوحة التحكم
    });
  });
}
