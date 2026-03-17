/**
 * @file components/dashboard/DashboardHeader.tsx
 * @description Renders the top navigation bar and the visual welcome banner for the Admin Dashboard.
 * Implements premium academic aesthetics and responsive layout.
 */

import React from 'react'; // استيراد مكتبة ريأكت لبناء واجهة المستخدم
import { useLanguage } from '@/contexts/LanguageContext'; // استيراد سياق اللغة لدعم العربية والإنجليزية
import { useAuth } from '@/contexts/AuthContext'; // استيراد سياق المصادقة لعرض بيانات المستخدم
import { Button } from '@/components/ui/button'; // استيراد مكون الزر القياسي
import { LogOut, Shield } from 'lucide-react'; // استيراد أيونات الخروج والحماية من مكتبة lucide-react

/**
 * Props for DashboardHeader
 */
interface DashboardHeaderProps { // تعريف واجهة الخصائص لمكون رأس لوحة القيادة
    onLogout: () => void; // دالة للتعامل مع عملية تسجيل الخروج
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onLogout }) => { // تعريف مكون رأس لوحة القيادة كمكون وظيفي
    const { t, language } = useLanguage(); // استخراج دالة الترجمة واللغة الحالية من سياق اللغة
    const { user, userRole } = useAuth(); // استخراج بيانات المستخدم ودوره من سياق المصادقة

    return ( // إرجاع هيكل واجهة المستخدم
        <div className="space-y-0"> {/* حاوية رئيسية بتباعد صفري للحفاظ على تلاحم الرأس والبانر */}

            {/* --- شريط التنقل العلوي --- */}
            <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 px-6 h-20 flex items-center justify-between"> {/* رأس الصفحة مع خلفية شفافة وتأثير ضبابي */}
                <div className="flex items-center gap-4"> {/* حاوية الشعار والعنوان */}
                    {/* شعار العلامة التجارية */}
                    <div className="h-10 w-10 rounded-xl bg-gold flex items-center justify-center text-white shadow-lg shadow-gold/20"> {/* حاوية أيقونة الشعار باللون الذهبي */}
                        <Shield className="h-6 w-6" /> {/* عرض أيقونة الحماية */}
                    </div>
                    <div> {/* حاوية النصوص الجانبية للشعار */}
                        <h1 className="text-xl font-black text-primary leading-none">{t('nav.dashboard')}</h1> {/* عرض عنوان لوحة القيادة المترجم */}
                        <span className="text-[10px] font-bold text-primary/20 uppercase tracking-widest leading-none"> {/* عرض وصف فرعي للبوابة */}
                            {language === 'ar' ? 'البوابة الإدارية المتكاملة' : 'Integrated Administrative Portal'} {/* نص الوصف حسب اللغة */}
                        </span>
                    </div>
                </div>

                {/* التحكم في الملف الشخصي والخروج */}
                <div className="flex items-center gap-4"> {/* حاوية أزرار التحكم وبيانات المستخدم */}
                    <div className="hidden md:flex flex-col items-end me-2"> {/* عرض اسم المستخدم ودوره في الشاشات المتوسطة وما فوق */}
                        <span className="text-sm font-black text-primary leading-none">{user?.full_name}</span> {/* عرض الاسم الكامل للمستخدم */}
                        <span className="text-[10px] font-bold text-primary/30 uppercase tracking-widest leading-none mt-1"> {/* عرض دور المستخدم */}
                            {userRole?.role?.replace('_', ' ')} {/* استبدال الشرطة السفلية بمسافة في اسم الدور */}
                        </span>
                    </div>
                    <Button // زر تسجيل الخروج
                        variant="ghost" // نمط الزر شفاف
                        size="icon" // حجم الزر مخصص للأيقونة
                        onClick={onLogout} // تنفيذ دالة الخروج عند النقر
                        className="h-12 w-12 rounded-2xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-all active:scale-90" // تنسيقات الزر والتأثيرات
                    >
                        <LogOut className="h-5 w-5" /> {/* أيقونة تسجيل الخروج */}
                    </Button>
                </div>
            </header>

            {/* --- بانر الترحيب المرئي --- */}
            <div className="px-6 py-8"> {/* حاوية البانر مع هوامش داخلية */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-10 text-white shadow-2xl shadow-primary/20"> {/* خلفية متدرجة مع زوايا مستديرة كبيرة وظلال */}
                    {/* عناصر زخرفية في الخلفية */}
                    <div className="absolute top-0 right-0 h-64 w-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" /> {/* دائرة زخرفية نبضية في الأعلى */}
                    <div className="absolute bottom-0 left-0 h-48 w-48 bg-gold/5 rounded-full -ml-24 -mb-24 blur-3xl" /> {/* دائرة زخرفية ثابتة في الأسفل */}

                    <div className="relative z-10 max-w-2xl"> {/* حاوية المحتوى النصي فوق العناصر الزخرفية */}
                        {/* مجموعة ترحيب محلية */}
                        <div className="flex items-center gap-3 mb-4"> {/* حاوية نص الترحيب العلوي مع خط زخرفي */}
                            <div className="h-px w-8 bg-gold/50" /> {/* خط أفقي ذهبي رفيع */}
                            <span className="text-xs font-black uppercase tracking-[0.3em] text-gold/80"> {/* نص "مرحباً بك مجدداً" */}
                                {language === 'ar' ? 'مرحباً بك مجدداً' : 'WELCOME BACK'} {/* الترجمة حسب اللغة */}
                            </span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight"> {/* عنوان ترحيبي كبير يحتوي على اسم المستخدم */}
                            {language === 'ar' ? `أهلاً بك، ${user?.full_name}` : `Hello, ${user?.full_name}`} {/* عرض التحية والاسم */}
                        </h2>

                        <p className="text-white/60 font-bold leading-relaxed max-w-lg"> {/* نص وصفي لوظيفة لوحة القيادة */}
                            {language === 'ar'
                                ? 'تحكم في كافة العمليات الأكاديمية والمؤسسات من لوحة قيادة واحدة ذكية ومتكاملة.' // الوصف بالعربي
                                : 'Control all academic operations and institutions from a single, smart, and integrated dashboard.'} // الوصف بالإنجليزي
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
