import { Toaster } from "@/components/ui/toaster"; // استيراد مكون التنبيهات الافتراضي
import { Toaster as Sonner } from "@/components/ui/sonner"; // استيراد مكون Sonner للتنبيهات المنبثقة
import { TooltipProvider } from "@/components/ui/tooltip"; // استيراد موفر خدمة تلميحات الأدوات (Tooltips)
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // استيراد مكتبة إدارة البيانات والطلبات (React Query)
import { BrowserRouter, Routes, Route } from "react-router-dom"; // استيراد أدوات التوجيه (Routing) للتنقل بين الصفحات
import { LanguageProvider } from "@/contexts/LanguageContext"; // استيراد موفر سياق اللغة لدعم تعدد اللغات
import { ThemeProvider } from "@/contexts/ThemeContext"; // استيراد موفر سياق السمة (داكن/فاتح)
import { AuthProvider } from "@/contexts/AuthContext"; // استيراد موفر سياق المصادقة لإدارة دخول المستخدمين
import AppLayout from "@/components/layout/AppLayout"; // استيراد التخطيط العام للتطبيق

import Index from "./pages/Index"; // استيراد الصفحة الرئيسية
import Universities from "./pages/Universities"; // استيراد صفحة الجامعات
import Services from "./pages/Services"; // استيراد صفحة الخدمات
import Jobs from "./pages/Jobs"; // استيراد صفحة الوظائف
import Research from "./pages/Research"; // استيراد صفحة الأبحاث
import Graduates from "./pages/Graduates"; // استيراد صفحة الخريجين
import Fees from "./pages/Fees"; // استيراد صفحة الرسوم
import Announcements from "./pages/Announcements"; // استيراد صفحة الإعلانات
import Chat from "./pages/Chat"; // استيراد صفحة الدردشة
import Login from "./pages/Login"; // استيراد صفحة تسجيل الدخول
import Signup from "./pages/Signup"; // استيراد صفحة إنشاء حساب
import ForgotPassword from "./pages/ForgotPassword"; // استيراد صفحة استعادة كلمة المرور
import Dashboard from "./pages/Dashboard"; // استيراد لوحة التحكم
import Profile from "./pages/Profile"; // استيراد صفحة الملف الشخصي
import More from "./pages/More"; // استيراد صفحة "المزيد"
import About from "./pages/About"; // استيراد صفحة "عن التطبيق"
import NotFound from "./pages/NotFound"; // استيراد صفحة الخطأ 404

const queryClient = new QueryClient(); // إنشاء عميل جديد لـ React Query لإدارة الذاكرة المؤقتة للبيانات

const App = () => ( // المكون الرئيسي للتطبيق (App)
  <QueryClientProvider client={queryClient}>
    {/* توفير عميل الطلبات لجميع مكونات التطبيق */}
    <LanguageProvider>
      {/* توفير سياق اللغة للتطبيق بالكامل */}
      <ThemeProvider>
        {/* توفير سياق السمة (الألوان) للتطبيق بالكامل */}
        <AuthProvider>
          {/* توفير سياق المصادقة للتطبيق بالكامل */}
          <TooltipProvider>
            {/* توفير سياق التلميحات للتطبيق بالكامل */}
            <Toaster />
            {/* عرض تنبيهات Toaster */}
            <Sonner />
            {/* عرض تنبيهات Sonner */}
            <BrowserRouter>
              {/* تفعيل نظام التوجيه باستخدام متصفح الويب */}
              <AppLayout>
                {/* تغليف الصفحات بالتخطيط العام (مثل الهيدر والفوتر) */}
                <Routes>
                  {/* تعريف قائمة المسارات (الروابط) */}
                  <Route path="/" element={<Index />} />
                  {/* مسار الصفحة الرئيسية */}
                  <Route path="/universities" element={<Universities />} />
                  {/* مسار الجامعات العام */}
                  <Route path="/universities/:universityId" element={<Universities />} />
                  {/* مسار جامعة محددة */}
                  <Route path="/universities/:universityId/colleges/:collegeId" element={<Universities />} />
                  {/* مسار كلية محددة داخل جامعة */}
                  <Route path="/services" element={<Services />} />
                  {/* مسار الخدمات */}
                  <Route path="/jobs" element={<Jobs />} />
                  {/* مسار الوظائف */}
                  <Route path="/research" element={<Research />} />
                  {/* مسار الأبحاث */}
                  <Route path="/graduates" element={<Graduates />} />
                  {/* مسار الخريجين */}
                  <Route path="/fees" element={<Fees />} />
                  {/* مسار الرسوم */}
                  <Route path="/announcements" element={<Announcements />} />
                  {/* مسار الإعلانات */}
                  <Route path="/chat" element={<Chat />} />
                  {/* مسار الدردشة */}
                  <Route path="/login" element={<Login />} />
                  {/* مسار تسجيل الدخول */}
                  <Route path="/signup" element={<Signup />} />
                  {/* مسار إنشاء حساب */}
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  {/* مسار استعادة كلمة المرور */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  {/* مسار لوحة التحكم */}
                  <Route path="/profile" element={<Profile />} />
                  {/* مسار الملف الشخصي */}
                  <Route path="/more" element={<More />} />
                  {/* مسار "المزيد" */}
                  <Route path="/about" element={<About />} />
                  {/* مسار صفحة عن التطبيق */}
                  <Route path="*" element={<NotFound />} />
                  {/* أي مسار غير معروف يؤدي لصفحة 404 */}
                </Routes>
              </AppLayout>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  </QueryClientProvider>
); // نهاية المكون الرئيسي

export default App; // تصدير المكون App ليكون متاحاً للاستخدام في ملفات أخرى
