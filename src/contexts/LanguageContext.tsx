/**
 * @file src/contexts/LanguageContext.tsx
 * @description Provides bilingual (Arabic / English) support to the entire app.
 *              Exposes the current language, a translation function `t()`, and
 *              text direction flags so any component can localise itself.
 */

import React, {
    createContext,  // Creates the context object
    useContext,     // Reads the nearest matching context value
    useState,       // Local state with re-render trigger
    useEffect,      // Side effect to sync HTML attributes with language state
    useMemo,        // Memoises derived values to avoid unnecessary recomputation
} from 'react';

// ─── Type Definitions ──────────────────────────────────────────────────────

/** The two supported UI languages */
type Language = 'ar' | 'en';

/** Everything the context exposes to consuming components */
interface LanguageContextType {
    language: Language;                    // Currently active language code
    setLanguage: (lang: Language) => void; // Switch the active language and persist to localStorage
    t: (key: string) => string;            // Translate a dot-notation key into the current language
    dir: 'rtl' | 'ltr';                   // CSS direction value — 'rtl' for Arabic, 'ltr' for English
    isRTL: boolean;                        // Convenience boolean — true when language is 'ar'
}

// ─── Translation Table ─────────────────────────────────────────────────────

/**
 * Static lookup table of all translated strings.
 * Keys use a dot-notation namespace: 'section.item'
 * Each key maps to an object with 'ar' and 'en' string values.
 */
const translations: Record<string, Record<Language, string>> = {
    // ── Navigation labels shown in the header and bottom nav ───────────
    'nav.home':          { ar: 'الرئيسية',         en: 'Home' },
    'nav.universities':  { ar: 'الجامعات',          en: 'Universities' },
    'nav.services':      { ar: 'الخدمات',           en: 'Services' },
    'nav.jobs':          { ar: 'الوظائف',           en: 'Jobs' },
    'nav.research':      { ar: 'الأبحاث',           en: 'Research' },
    'nav.graduates':     { ar: 'الخريجون',          en: 'Graduates' },
    'nav.fees':          { ar: 'الرسوم',            en: 'Fees' },
    'nav.announcements': { ar: 'الإعلانات',         en: 'Announcements' },
    'nav.chat':          { ar: 'المراسلة',          en: 'Chat' },
    'nav.login':         { ar: 'تسجيل الدخول',      en: 'Login' },
    'nav.signup':        { ar: 'إنشاء حساب',        en: 'Sign Up' },
    'nav.dashboard':     { ar: 'لوحة التحكم',       en: 'Dashboard' },
    'nav.profile':       { ar: 'الملف الشخصي',      en: 'Profile' },
    'nav.logout':        { ar: 'تسجيل الخروج',      en: 'Logout' },
    'nav.more':          { ar: 'المزيد',            en: 'More' },

    // ── Home page hero and stats section ───────────────────────────────
    'home.welcome':              { ar: 'مرحباً بك في الدليل الجامعي', en: 'Welcome to University Guide' },
    'home.subtitle':             { ar: 'دليلك الشامل للجامعات والكليات والأقسام الأكاديمية', en: 'Your comprehensive guide to universities, colleges, and academic departments' },
    'home.stats.universities':   { ar: 'جامعة',    en: 'Universities' },
    'home.stats.colleges':       { ar: 'كلية',     en: 'Colleges' },
    'home.stats.departments':    { ar: 'قسم',      en: 'Departments' },
    'home.stats.graduates':      { ar: 'خريج',     en: 'Graduates' },
    'home.stats.research':       { ar: 'بحث',      en: 'Research' },
    'home.latest_announcements': { ar: 'آخر الإعلانات', en: 'Latest Announcements' },
    'home.quick_links':          { ar: 'روابط سريعة',   en: 'Quick Links' },
    'home.explore':              { ar: 'استكشف الآن',   en: 'Explore Now' },

    // ── Universities page ───────────────────────────────────────────────
    'universities.title':            { ar: 'الجامعات',          en: 'Universities' },
    'universities.search':           { ar: 'ابحث عن جامعة...', en: 'Search for a university...' },
    'universities.colleges':         { ar: 'الكليات',           en: 'Colleges' },
    'universities.departments':      { ar: 'الأقسام',           en: 'Departments' },
    'universities.view_colleges':    { ar: 'عرض الكليات',       en: 'View Colleges' },
    'universities.view_departments': { ar: 'عرض الأقسام',       en: 'View Departments' },
    'universities.back':             { ar: 'رجوع',              en: 'Back' },

    // ── Services page ───────────────────────────────────────────────────
    'services.title':       { ar: 'الخدمات',              en: 'Services' },
    'services.no_services': { ar: 'لا توجد خدمات متاحة', en: 'No services available' },

    // ── Jobs page ───────────────────────────────────────────────────────
    'jobs.title':        { ar: 'الوظائف الشاغرة',    en: 'Job Openings' },
    'jobs.deadline':     { ar: 'الموعد النهائي',      en: 'Deadline' },
    'jobs.requirements': { ar: 'المتطلبات',           en: 'Requirements' },
    'jobs.no_jobs':      { ar: 'لا توجد وظائف شاغرة', en: 'No job openings' },

    // ── Research page ───────────────────────────────────────────────────
    'research.title':       { ar: 'الأبحاث',        en: 'Research' },
    'research.download':    { ar: 'تحميل PDF',       en: 'Download PDF' },
    'research.author':      { ar: 'الباحث',          en: 'Author' },
    'research.no_research': { ar: 'لا توجد أبحاث',  en: 'No research available' },

    // ── Graduates page ──────────────────────────────────────────────────
    'graduates.title':        { ar: 'الخريجون',       en: 'Graduates' },
    'graduates.year':         { ar: 'سنة التخرج',     en: 'Graduation Year' },
    'graduates.gpa':          { ar: 'المعدل',         en: 'GPA' },
    'graduates.no_graduates': { ar: 'لا يوجد خريجون', en: 'No graduates' },

    // ── Fees page ───────────────────────────────────────────────────────
    'fees.title':      { ar: 'الرسوم الدراسية',    en: 'Tuition Fees' },
    'fees.public':     { ar: 'نظام عام',            en: 'Public System' },
    'fees.private':    { ar: 'نفقة خاصة',           en: 'Private System' },
    'fees.college':    { ar: 'الكلية',              en: 'College' },
    'fees.department': { ar: 'القسم',               en: 'Department' },
    'fees.amount':     { ar: 'المبلغ',              en: 'Amount' },
    'fees.no_fees':    { ar: 'لا توجد رسوم',        en: 'No fees available' },

    // ── Announcements page ──────────────────────────────────────────────
    'announcements.title':           { ar: 'الإعلانات',        en: 'Announcements' },
    'announcements.no_announcements': { ar: 'لا توجد إعلانات', en: 'No announcements' },

    // ── Chat page ──────────────────────────────────────────────────────
    'chat.title':         { ar: 'المراسلة',                        en: 'Chat' },
    'chat.send':          { ar: 'إرسال',                           en: 'Send' },
    'chat.placeholder':   { ar: 'اكتب رسالتك...',                  en: 'Type your message...' },
    'chat.login_required':{ ar: 'يجب تسجيل الدخول للمراسلة',       en: 'Login required to chat' },

    // ── Auth forms ─────────────────────────────────────────────────────
    'auth.login':            { ar: 'تسجيل الدخول',          en: 'Login' },
    'auth.signup':           { ar: 'إنشاء حساب',            en: 'Sign Up' },
    'auth.email':            { ar: 'البريد الإلكتروني',      en: 'Email' },
    'auth.password':         { ar: 'كلمة المرور',            en: 'Password' },
    'auth.full_name':        { ar: 'الاسم الكامل',           en: 'Full Name' },
    'auth.confirm_password': { ar: 'تأكيد كلمة المرور',     en: 'Confirm Password' },
    'auth.no_account':       { ar: 'ليس لديك حساب؟',         en: "Don't have an account?" },
    'auth.has_account':      { ar: 'لديك حساب بالفعل؟',      en: 'Already have an account?' },
    'auth.check_email':      { ar: 'تحقق من بريدك الإلكتروني لتأكيد الحساب', en: 'Check your email to confirm your account' },
    'auth.phone':            { ar: 'رقم الهاتف',             en: 'Phone Number' },
    'auth.forgot_password':  { ar: 'نسيت كلمة المرور؟',     en: 'Forgot Password?' },
    'auth.reset_password':   { ar: 'إعادة تعيين كلمة المرور', en: 'Reset Password' },
    'auth.verify_code':      { ar: 'رمز التحقق',             en: 'Verification Code' },
    'auth.step_identity':    { ar: 'الهوية',                 en: 'Identity' },
    'auth.step_verification':{ ar: 'التحقق',                 en: 'Verification' },
    'auth.step_password':    { ar: 'كلمة المرور',            en: 'Password' },
    'auth.recovery_method':  { ar: 'طريقة الاسترداد',        en: 'Recovery Method' },
    'auth.send_code':        { ar: 'إرسال الرمز',            en: 'Send Code' },
    'auth.next':             { ar: 'التالي',                  en: 'Next' },
    'auth.code_sent':        { ar: 'تم إرسال رمز التحقق',    en: 'Verification code sent' },

    // ── Dashboard tab headers and management labels ────────────────────
    'dashboard.title':               { ar: 'لوحة التحكم',         en: 'Dashboard' },
    'dashboard.manage_universities': { ar: 'إدارة الجامعات',       en: 'Manage Universities' },
    'dashboard.manage_colleges':     { ar: 'إدارة الكليات',        en: 'Manage Colleges' },
    'dashboard.manage_departments':  { ar: 'إدارة الأقسام',        en: 'Manage Departments' },
    'dashboard.manage_graduates':    { ar: 'إدارة الخريجين',       en: 'Manage Graduates' },
    'dashboard.manage_research':     { ar: 'إدارة الأبحاث',        en: 'Manage Research' },
    'dashboard.manage_fees':         { ar: 'إدارة الرسوم',         en: 'Manage Fees' },
    'dashboard.manage_announcements':{ ar: 'إدارة الإعلانات',      en: 'Manage Announcements' },
    'dashboard.manage_jobs':         { ar: 'إدارة الوظائف',        en: 'Manage Jobs' },
    'dashboard.manage_admins':       { ar: 'إدارة المدراء',        en: 'Manage Admins' },
    'dashboard.statistics':          { ar: 'الإحصائيات',           en: 'Statistics' },

    // ── Reusable action labels used across all forms and tables ───────
    'common.add':            { ar: 'إضافة',                    en: 'Add' },
    'common.edit':           { ar: 'تعديل',                    en: 'Edit' },
    'common.delete':         { ar: 'حذف',                      en: 'Delete' },
    'common.save':           { ar: 'حفظ',                      en: 'Save' },
    'common.cancel':         { ar: 'إلغاء',                    en: 'Cancel' },
    'common.search':         { ar: 'بحث',                      en: 'Search' },
    'common.loading':        { ar: 'جاري التحميل...',           en: 'Loading...' },
    'common.no_data':        { ar: 'لا توجد بيانات',           en: 'No data available' },
    'common.confirm_delete': { ar: 'هل أنت متأكد من الحذف؟', en: 'Are you sure you want to delete?' },
    'common.name_ar':        { ar: 'الاسم بالعربية',           en: 'Name (Arabic)' },
    'common.name_en':        { ar: 'الاسم بالإنجليزية',        en: 'Name (English)' },
    'common.description_ar': { ar: 'الوصف بالعربية',           en: 'Description (Arabic)' },
    'common.description_en': { ar: 'الوصف بالإنجليزية',        en: 'Description (English)' },
    'common.content_ar':     { ar: 'المحتوى بالعربية',          en: 'Content (Arabic)' },
    'common.content_en':     { ar: 'المحتوى بالإنجليزية',       en: 'Content (English)' },
    'common.title_ar':       { ar: 'العنوان بالعربية',          en: 'Title (Arabic)' },
    'common.title_en':       { ar: 'العنوان بالإنجليزية',       en: 'Title (English)' },
    'common.view_all':       { ar: 'عرض الكل',                 en: 'View All' },

    // ── Theme toggle labels ────────────────────────────────────────────
    'theme.light': { ar: 'نهاري', en: 'Light' },
    'theme.dark':  { ar: 'ليلي',  en: 'Dark' },
};

// ─── Context Object ────────────────────────────────────────────────────────

/** Do not import this directly — use the useLanguage() hook */
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ─── LanguageProvider Component ────────────────────────────────────────────

/** Wrap the app root with this to enable language switching everywhere */
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Read the previously saved language from localStorage, default to Arabic
    const [language, setLanguageState] = useState<Language>(() => {
        return (localStorage.getItem('language') as Language) || 'ar'; // Cast from string to Language type
    });

    /**
     * Switches the active language and persists the choice to localStorage.
     * Exposed as `setLanguage` in the context so any component can change the language.
     */
    const setLanguage = (lang: Language): void => {
        setLanguageState(lang);           // Update the React state, triggering a re-render
        localStorage.setItem('language', lang); // Persist so the choice survives a page refresh
    };

    /**
     * Translation function — looks up a dot-notation key and returns the string for
     * the current language. Falls back to the raw key if no translation is found.
     */
    const t = useMemo(() => (key: string): string => {
        return translations[key]?.[language] ?? key; // Return key itself as a fallback
    }, [language]); // Only recreate when the language changes

    const dir: 'rtl' | 'ltr' = language === 'ar' ? 'rtl' : 'ltr'; // CSS direction for the whole page
    const isRTL = language === 'ar';                // Convenience boolean for conditional styling

    // Sync the <html> element's `dir` and `lang` attributes whenever the language changes
    useEffect(() => {
        document.documentElement.dir = dir;      // Sets text direction for the entire page
        document.documentElement.lang = language; // Sets the accessibility language attribute
    }, [language, dir]); // Re-run whenever language or direction changes

    // Build the context value object once (it changes only when language changes)
    const contextValue = useMemo(() => ({
        language,     // The active language code
        setLanguage,  // Function to switch language
        t,            // Translation function
        dir,          // CSS direction string
        isRTL,        // Boolean direction flag
    }), [language, t, dir, isRTL]); // Recalculate only when language-derived values change

    return (
        // Provide language state and helpers to all children
        <LanguageContext.Provider value={contextValue}>
            {children}  {/* Render the rest of the app inside the provider */}
        </LanguageContext.Provider>
    );
};

// ─── useLanguage Hook ──────────────────────────────────────────────────────

/**
 * Custom hook for consuming the LanguageContext.
 * Throws a descriptive error if used outside of a <LanguageProvider>.
 */
export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext); // Read the nearest LanguageContext value
    if (!context) {
        throw new Error('[useLanguage] must be used inside a <LanguageProvider> component');
    }
    return context; // Return the full context so the component gets all language helpers
};
