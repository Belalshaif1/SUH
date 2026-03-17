/**
 * @file components/dashboard/EntityDialog.tsx
 * @description Centralized Dialog orchestrator for Add/Edit operations.
 * It wraps the dynamic EntityForm with the premium UI Dialog shell.
 */

import React from 'react'; // استيراد مكتبة ريأكت لبناء واجهة المستخدم
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'; // استيراد مكونات الحوار من مكتبة واجهة المستخدم
import { Button } from '@/components/ui/button'; // استيراد مكون الزر القابل لإعادة الاستخدام
import { Save } from 'lucide-react'; // استيراد أيقونة الحفظ من مكتبة lucide-react
import { EntityForm } from './EntityForm'; // استيراد مكون النموذج الديناميكي الذي سيعرض داخل الحوار
import { useLanguage } from '@/contexts/LanguageContext'; // استيراد سياق اللغة لدعم تعدد اللغات

/**
 * Props for EntityDialog
 */
interface EntityDialogProps { // تعريف واجهة الخصائص لمكون الحوار
    isOpen: boolean; // حالة فتح أو إغلاق الحوار
    onClose: () => void; // دالة لإغلاق الحوار
    activeForm: string; // نوع الكيان الحالي الذي يتم التعامل معه (مثل جامعة، كلية...)
    formData: any; // الحالة الحالية لبيانات النموذج
    setFormData: (data: any) => void; // دالة لتحديث حالة بيانات النموذج
    onSave: () => void; // دالة لحفظ البيانات عند النقر على زر الحفظ
    loading: boolean; // حالة التحميل لإظهار مؤشر أثناء الحفظ
    editId: string | null; // معرف العنصر في حالة التعديل، يكون null في حالة الإضافة
    // البيانات المطلوبة للقوائم المنسدلة (يتم تمريرها لنموذج الكيان)
    universities: any[]; // قائمة الجامعات
    colleges: any[]; // قائمة الكليات
    departments: any[]; // قائمة الأقسام
    role: string | undefined; // دور المستخدم الحالي للتحقق من الصلاحيات
}

export const EntityDialog: React.FC<EntityDialogProps> = ({ // تعريف المكون وتفكيك الخصائص المستلمة
    isOpen, onClose, activeForm, formData, setFormData, onSave, loading, editId,
    universities, colleges, departments, role
}) => {
    const { t, language } = useLanguage(); // الحصول على دالة الترجمة واللغة الحالية من السياق

    return ( // إرجاع هيكل واجهة المستخدم للحوار
        <Dialog open={isOpen} onOpenChange={onClose}> {/* المكون الرئيسي للحوار مع التحكم في الفتح والإغلاق */}
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8 border-none shadow-2xl"> {/* حاوية محتوى الحوار بتنسيقات مخصصة */}
                <DialogHeader className="mb-6"> {/* رأس الحوار مع هامش سفلي */}
                    <DialogTitle className="text-3xl font-black text-primary flex items-center gap-3"> {/* عنوان الحوار */}
                        {/* عنوان شرطي - يتغير ديناميكياً بناءً على وضع التعديل أو الإضافة */}
                        {editId ? t('common.edit') : t('common.add')}
                        <span className="text-gold opacity-50">•</span>
                        <span className="text-primary/40 uppercase tracking-widest text-xs font-bold mt-1"> {/* عرض نوع الكيان الحالي */}
                            {activeForm.replace('_', ' ')}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                {/* --- حقن النموذج الديناميكي --- */}
                <EntityForm // استدعاء مكون النموذج وتمرير كافة الخصائص اللازمة له
                    activeForm={activeForm}
                    formData={formData}
                    setFormData={setFormData}
                    role={role}
                    universities={universities}
                    colleges={colleges}
                    departments={departments}
                    t={t}
                />

                {/* --- أزرار التحكم --- */}
                <div className="flex gap-4 mt-10"> {/* حاوية الأزرار مع تباعد وهامش علوي */}
                    {/* إجراء الحفظ الرئيسي - زر ذهبي بارز */}
                    <Button
                        onClick={onSave} // تنفيذ دالة الحفظ عند النقر
                        disabled={loading} // تعطيل الزر أثناء عملية التحميل
                        className="flex-1 h-14 rounded-2xl bg-gold text-white font-black text-lg shadow-xl shadow-gold/20 hover:scale-[1.02] active:scale-95 transition-all gap-3"
                    >
                        {loading ? ( // عرض حالة التحميل إذا كان جاري الحفظ
                            <span className="animate-pulse">{language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</span>
                        ) : ( // عرض أيقونة ونص الحفظ في الحالة الطبيعية
                            <><Save className="h-5 w-5" /> {t('common.save')}</>
                        )}
                    </Button>

                    {/* إجراء الإلغاء - زر شفاف وبسيط */}
                    <Button
                        variant="ghost" // نمط شفاف
                        onClick={onClose} // إغلاق الحوار عند النقر
                        className="h-14 px-8 rounded-2xl font-black text-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
                    >
                        {t('common.cancel')} {/* نص الإلغاء المترجم */}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
