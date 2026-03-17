import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. تحديد نوع اللغات المدعومة (عربي أو إنجليزي)
type Language = 'ar' | 'en';

// 2. تعريف هيكلية سياق اللغة (Language Context Structure)
interface LanguageContextType {
  language: Language;               // اللغة الحالية
  setLanguage: (lang: Language) => void; // دالة لتغيير اللغة
  t: (key: string) => string;       // دالة الترجمة (Translation Function)
  dir: 'rtl' | 'ltr';               // اتجاه النص (من اليمين أو اليسار)
  isRTL: boolean;                   // هل الاتجاه من اليمين لليسار؟ (True للعربي)
}

const translations: Record<string, Record<Language, string>> = {
  // Navigation
  'nav.home': { ar: 'الرئيسية', en: 'Home' },
  'nav.universities': { ar: 'الجامعات', en: 'Universities' },
  'nav.services': { ar: 'الخدمات', en: 'Services' },
  'nav.jobs': { ar: 'الوظائف', en: 'Jobs' },
  'nav.research': { ar: 'الأبحاث', en: 'Research' },
  'nav.graduates': { ar: 'الخريجون', en: 'Graduates' },
  'nav.fees': { ar: 'الرسوم', en: 'Fees' },
  'nav.announcements': { ar: 'الإعلانات', en: 'Announcements' },
  'nav.chat': { ar: 'المراسلة', en: 'Chat' },
  'nav.login': { ar: 'تسجيل الدخول', en: 'Login' },
  'nav.signup': { ar: 'إنشاء حساب', en: 'Sign Up' },
  'nav.dashboard': { ar: 'لوحة التحكم', en: 'Dashboard' },
  'nav.profile': { ar: 'الملف الشخصي', en: 'Profile' },
  'nav.logout': { ar: 'تسجيل الخروج', en: 'Logout' },
  'nav.more': { ar: 'المزيد', en: 'More' },

  // Home page
  'home.welcome': { ar: 'مرحباً بك في الدليل الجامعي', en: 'Welcome to University Guide' },
  'home.subtitle': { ar: 'دليلك الشامل للجامعات والكليات والأقسام الأكاديمية', en: 'Your comprehensive guide to universities, colleges, and academic departments' },
  'home.stats.universities': { ar: 'جامعة', en: 'Universities' },
  'home.stats.colleges': { ar: 'كلية', en: 'Colleges' },
  'home.stats.departments': { ar: 'قسم', en: 'Departments' },
  'home.stats.graduates': { ar: 'خريج', en: 'Graduates' },
  'home.stats.research': { ar: 'بحث', en: 'Research' },
  'home.latest_announcements': { ar: 'آخر الإعلانات', en: 'Latest Announcements' },
  'home.quick_links': { ar: 'روابط سريعة', en: 'Quick Links' },
  'home.explore': { ar: 'استكشف الآن', en: 'Explore Now' },

  // Universities
  'universities.title': { ar: 'الجامعات', en: 'Universities' },
  'universities.search': { ar: 'ابحث عن جامعة...', en: 'Search for a university...' },
  'universities.colleges': { ar: 'الكليات', en: 'Colleges' },
  'universities.departments': { ar: 'الأقسام', en: 'Departments' },
  'universities.view_colleges': { ar: 'عرض الكليات', en: 'View Colleges' },
  'universities.view_departments': { ar: 'عرض الأقسام', en: 'View Departments' },
  'universities.back': { ar: 'رجوع', en: 'Back' },

  // Services
  'services.title': { ar: 'الخدمات', en: 'Services' },
  'services.no_services': { ar: 'لا توجد خدمات متاحة', en: 'No services available' },

  // Jobs
  'jobs.title': { ar: 'الوظائف الشاغرة', en: 'Job Openings' },
  'jobs.deadline': { ar: 'الموعد النهائي', en: 'Deadline' },
  'jobs.requirements': { ar: 'المتطلبات', en: 'Requirements' },
  'jobs.no_jobs': { ar: 'لا توجد وظائف شاغرة', en: 'No job openings' },

  // Research
  'research.title': { ar: 'الأبحاث', en: 'Research' },
  'research.download': { ar: 'تحميل PDF', en: 'Download PDF' },
  'research.author': { ar: 'الباحث', en: 'Author' },
  'research.no_research': { ar: 'لا توجد أبحاث', en: 'No research available' },

  // Graduates
  'graduates.title': { ar: 'الخريجون', en: 'Graduates' },
  'graduates.year': { ar: 'سنة التخرج', en: 'Graduation Year' },
  'graduates.gpa': { ar: 'المعدل', en: 'GPA' },
  'graduates.no_graduates': { ar: 'لا يوجد خريجون', en: 'No graduates' },

  // Fees
  'fees.title': { ar: 'الرسوم الدراسية', en: 'Tuition Fees' },
  'fees.public': { ar: 'نظام عام', en: 'Public System' },
  'fees.private': { ar: 'نفقة خاصة', en: 'Private System' },
  'fees.college': { ar: 'الكلية', en: 'College' },
  'fees.department': { ar: 'القسم', en: 'Department' },
  'fees.amount': { ar: 'المبلغ', en: 'Amount' },
  'fees.no_fees': { ar: 'لا توجد رسوم', en: 'No fees available' },

  // Announcements
  'announcements.title': { ar: 'الإعلانات', en: 'Announcements' },
  'announcements.no_announcements': { ar: 'لا توجد إعلانات', en: 'No announcements' },

  // Chat
  'chat.title': { ar: 'المراسلة', en: 'Chat' },
  'chat.send': { ar: 'إرسال', en: 'Send' },
  'chat.placeholder': { ar: 'اكتب رسالتك...', en: 'Type your message...' },
  'chat.login_required': { ar: 'يجب تسجيل الدخول للمراسلة', en: 'Login required to chat' },

  // Auth
  'auth.login': { ar: 'تسجيل الدخول', en: 'Login' },
  'auth.signup': { ar: 'إنشاء حساب', en: 'Sign Up' },
  'auth.email': { ar: 'البريد الإلكتروني', en: 'Email' },
  'auth.password': { ar: 'كلمة المرور', en: 'Password' },
  'auth.full_name': { ar: 'الاسم الكامل', en: 'Full Name' },
  'auth.confirm_password': { ar: 'تأكيد كلمة المرور', en: 'Confirm Password' },
  'auth.no_account': { ar: 'ليس لديك حساب؟', en: "Don't have an account?" },
  'auth.has_account': { ar: 'لديك حساب بالفعل؟', en: 'Already have an account?' },
  'auth.check_email': { ar: 'تحقق من بريدك الإلكتروني لتأكيد الحساب', en: 'Check your email to confirm your account' },
  'auth.phone': { ar: 'رقم الهاتف', en: 'Phone Number' },
  'auth.forgot_password': { ar: 'نسيت كلمة المرور؟', en: 'Forgot Password?' },
  'auth.reset_password': { ar: 'إعادة تعيين كلمة المرور', en: 'Reset Password' },
  'auth.verify_code': { ar: 'رمز التحقق', en: 'Verification Code' },
  'auth.step_identity': { ar: 'الهوية', en: 'Identity' },
  'auth.step_verification': { ar: 'التحقق', en: 'Verification' },
  'auth.step_password': { ar: 'كلمة المرور', en: 'Password' },
  'auth.recovery_method': { ar: 'طريقة الاسترداد', en: 'Recovery Method' },
  'auth.send_code': { ar: 'إرسال الرمز', en: 'Send Code' },
  'auth.next': { ar: 'التالي', en: 'Next' },
  'auth.code_sent': { ar: 'تم إرسال رمز التحقق', en: 'Verification code sent' },

  // Dashboard
  'dashboard.title': { ar: 'لوحة التحكم', en: 'Dashboard' },
  'dashboard.manage_universities': { ar: 'إدارة الجامعات', en: 'Manage Universities' },
  'dashboard.manage_colleges': { ar: 'إدارة الكليات', en: 'Manage Colleges' },
  'dashboard.manage_departments': { ar: 'إدارة الأقسام', en: 'Manage Departments' },
  'dashboard.manage_graduates': { ar: 'إدارة الخريجين', en: 'Manage Graduates' },
  'dashboard.manage_research': { ar: 'إدارة الأبحاث', en: 'Manage Research' },
  'dashboard.manage_fees': { ar: 'إدارة الرسوم', en: 'Manage Fees' },
  'dashboard.manage_announcements': { ar: 'إدارة الإعلانات', en: 'Manage Announcements' },
  'dashboard.manage_jobs': { ar: 'إدارة الوظائف', en: 'Manage Jobs' },
  'dashboard.manage_admins': { ar: 'إدارة المدراء', en: 'Manage Admins' },
  'dashboard.statistics': { ar: 'الإحصائيات', en: 'Statistics' },

  // Common
  'common.add': { ar: 'إضافة', en: 'Add' },
  'common.edit': { ar: 'تعديل', en: 'Edit' },
  'common.delete': { ar: 'حذف', en: 'Delete' },
  'common.save': { ar: 'حفظ', en: 'Save' },
  'common.cancel': { ar: 'إلغاء', en: 'Cancel' },
  'common.search': { ar: 'بحث', en: 'Search' },
  'common.loading': { ar: 'جاري التحميل...', en: 'Loading...' },
  'common.no_data': { ar: 'لا توجد بيانات', en: 'No data available' },
  'common.confirm_delete': { ar: 'هل أنت متأكد من الحذف؟', en: 'Are you sure you want to delete?' },
  'common.name_ar': { ar: 'الاسم بالعربية', en: 'Name (Arabic)' },
  'common.name_en': { ar: 'الاسم بالإنجليزية', en: 'Name (English)' },
  'common.description_ar': { ar: 'الوصف بالعربية', en: 'Description (Arabic)' },
  'common.description_en': { ar: 'الوصف بالإنجليزية', en: 'Description (English)' },
  'common.view_all': { ar: 'عرض الكل', en: 'View All' },

  // Theme
  'theme.light': { ar: 'نهاري', en: 'Light' },
  'theme.dark': { ar: 'ليلي', en: 'Dark' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 4. مكون موفر اللغة (LanguageProvider)
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // تعريف حالة اللغة (الافتراضية عربية، أو استعادتها من التخزين المحلي)
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'ar';
  });

  // دالة تغيير اللغة وحفظها في التخزين المحلي للمتصفح
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  // دالة الترجمة: تأخذ مفتاحاً وتعيد النص المقابل له بناءً على اللغة الحالية
  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  // تحديد اتجاه الصفحة (RTL للعربي و LTR للإنجليزي)
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const isRTL = language === 'ar';

  // تحديث خصائص عنصر HTML الجذري عند تغير اللغة للتأثير على كامل الصفحة
  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language, dir]);

  return (
    // توفير سياق اللغة لكل المكونات الفرعية
    <LanguageContext.Provider value={{ language, setLanguage, t, dir, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

// خطاف مخصص لسهولة استخدام الترجمة واللغة في أي مكان بالتطبيق
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
