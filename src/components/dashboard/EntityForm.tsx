/**
 * @file components/dashboard/EntityForm.tsx
 * @description Centralized dynamic form engine for all dashboard entities.
 * It manages field visibility, validation requirements, and localized labels.
 */

import React from 'react'; // Import React for building UI components
import { useLanguage } from '@/contexts/LanguageContext'; // Import language context for localization
import { Label } from '@/components/ui/label'; // Import Label component for form labels
import { Input } from '@/components/ui/input'; // Import Input component for text fields
import { Textarea } from '@/components/ui/textarea'; // Import Textarea component for multiline text fields
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select components for dropdowns
import { Pin } from 'lucide-react'; // Import Pin icon for pinning functionality

/**
 * Props for EntityForm
 */
interface EntityFormProps {
    activeForm: string; // The type of entity being edited (e.g., 'university')
    formData: any; // The current form state
    setFormData: (data: any) => void; // State updater function
    role: string | undefined; // Current user role for RBAC checks
    universities: any[]; // Data for university-select dropdowns
    colleges: any[]; // Data for college-select dropdowns
    departments: any[]; // Data for department-select dropdowns
    t: (key: string) => string; // Translation function
}

/**
 * EntityForm Component
 * @description Renders dynamic forms based on the activeForm prop.
 */
export const EntityForm: React.FC<EntityFormProps> = ({
    activeForm, formData, setFormData, role, universities, colleges, departments, t
}) => {
    const { language } = useLanguage(); // Get the current language preference

    /**
     * f - Standard Field Generator
     * @description Utility to reduce boilerplate when creating text/textarea fields.
     */
    const f = (key: string, label: string, type = 'text', required = false, placeholder = '', desc = '', disabled = false) => (
        <div className="space-y-1" key={key}>
            {/* Label and Required Indicator */}
            <div className="flex items-center justify-between">
                <Label className="font-bold text-primary/80">{label}</Label>
                {required && <span className="text-[10px] text-red-500 font-black uppercase">{language === 'ar' ? 'مطلوب' : 'Required'}</span>}
            </div>
            {/* Input or Textarea Field */}
            {type === 'textarea' ? (
                <Textarea
                    placeholder={placeholder || label} // Placeholder text
                    value={formData[key] || ''} // Bind value to formData
                    onChange={e => setFormData({ ...formData, [key]: e.target.value })} // Update state on change
                    required={required} // Mark as required if applicable
                    disabled={disabled} // Disable field if applicable
                    className="min-h-[120px] resize-none focus-visible:ring-primary/20 rounded-xl"
                />
            ) : (
                <Input
                    type={type} // Input type (e.g., text, number)
                    placeholder={placeholder || label} // Placeholder text
                    value={formData[key] || ''} // Bind value to formData
                    onChange={e => setFormData({ ...formData, [key]: e.target.value })} // Update state on change
                    required={required} // Mark as required if applicable
                    disabled={disabled} // Disable field if applicable
                    className="h-12 focus-visible:ring-primary/20 rounded-xl"
                />
            )}
            {/* Description Text */}
            {desc && <p className="text-[11px] text-primary/30 leading-tight px-1 italic">{desc}</p>}
        </div>
    );

    /**
     * pinField - Renders a pinning toggle for administrative priority
     */
    const pinField = () => (
        role === 'super_admin' ? (
            <div className="flex items-center gap-2 pt-4 border-t mt-6 bg-slate-50/50 p-4 rounded-xl">
                <input
                    type="checkbox" // Checkbox input
                    id="is_pinned" // Unique ID for the checkbox
                    checked={!!formData.is_pinned} // Bind checked state to formData
                    onChange={e => setFormData({ ...formData, is_pinned: e.target.checked })} // Update state on change
                    className="h-5 w-5 rounded-lg border-primary/20 text-primary focus:ring-primary/20"
                />
                <Label htmlFor="is_pinned" className="cursor-pointer font-black text-primary flex items-center gap-2">
                    <Pin className="h-4 w-4" /> {/* Pin icon */}
                    {language === 'ar' ? 'تثبيت في أعلى القائمة' : 'Pin to top of the list (Priority)'}
                </Label>
            </div>
        ) : null
    );

    /**
     * selectField - Dynamic selection dropdown
     */
    const selectField = (key: string, label: string, options: any[], desc = '') => (
        <div className="space-y-1" key={key}>
            <Label className="font-bold text-primary/80">{label}</Label>
            <Select value={formData[key] || ''} onValueChange={v => setFormData({ ...formData, [key]: v })}>
                <SelectTrigger className="h-12 focus:ring-primary/20 rounded-xl">
                    <SelectValue placeholder={language === 'ar' ? 'اختر من القائمة...' : 'Select from list...'} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                    {(options || []).map(o => (
                        <SelectItem key={o.id} value={o.id} className="font-bold">
                            {language === 'ar' ? o.name_ar : (o.name_en || o.name_ar)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {desc && <p className="text-[11px] text-primary/30 leading-tight px-1 italic">{desc}</p>}
        </div>
    );

    // --- Recursive form logic based on active selection ---
    switch (activeForm) {
        case 'university':
            const isUniAdmin = role === 'university_admin';
            return (
                <div className="space-y-6">
                    {f('name_ar', t('common.name_ar'), 'text', true, 'اسم الجامعة  ', '', isUniAdmin)}
                    {f('name_en', t('common.name_en'), 'text', false, '', '', isUniAdmin)}
                    {f('description_ar', t('common.description_ar'), 'textarea')}
                    {f('description_en', t('common.description_en'), 'textarea')}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="font-bold">{language === 'ar' ? 'دليل الجامعة (PDF)' : 'University Guide (PDF)'}</Label>
                            <Input type="file" accept=".pdf" onChange={e => setFormData({ ...formData, _guide_file: e.target.files?.[0] })} className="rounded-xl h-11" />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">{language === 'ar' ? 'شعار الجامعة' : 'University Logo'}</Label>
                            <Input type="file" accept="image/*" onChange={e => setFormData({ ...formData, _logo_file: e.target.files?.[0] })} className="rounded-xl h-11" />
                        </div>
                    </div>
                    {pinField()}
                </div>
            );

        case 'college':
            const isCollegeAdmin = role === 'college_admin';
            return (
                <div className="space-y-6">
                    {role === 'super_admin' && selectField('university_id', t('nav.universities'), universities)}
                    {f('name_ar', t('common.name_ar'), 'text', true, ' اسم الكلية ', '', isCollegeAdmin)}
                    {f('name_en', t('common.name_en'), 'text', false, '', '', isCollegeAdmin)}
                    {f('description_ar', t('common.description_ar'), 'textarea')}
                    {f('description_en', t('common.description_en'), 'textarea')}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="font-bold">{language === 'ar' ? 'دليل الكلية (PDF)' : 'College Guide (PDF)'}</Label>
                            <Input type="file" accept=".pdf" onChange={e => setFormData({ ...formData, _guide_file: e.target.files?.[0] })} className="rounded-xl h-11" />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">{language === 'ar' ? 'شعار الكلية' : 'College Logo'}</Label>
                            <Input type="file" accept="image/*" onChange={e => setFormData({ ...formData, _logo_file: e.target.files?.[0] })} className="rounded-xl h-11" />
                        </div>
                    </div>
                    {pinField()}
                </div>
            );

        case 'department':
            const isDeptAdmin = role === 'department_admin';
            return (
                <div className="space-y-6">
                    {role !== 'college_admin' && selectField('college_id', t('universities.colleges'), colleges)}
                    {f('name_ar', t('common.name_ar'), 'text', true, ' اسم القسم ', '', isDeptAdmin)}
                    {f('name_en', t('common.name_en'), 'text', false, '', '', isDeptAdmin)}
                    {f('description_ar', t('common.description_ar'), 'textarea')}
                    {f('description_en', t('common.description_en'), 'textarea')}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="font-bold">{language === 'ar' ? 'الخطة الدراسية (PDF)' : 'Study Plan (PDF)'}</Label>
                            <Input type="file" accept=".pdf" onChange={e => setFormData({ ...formData, _plan_file: e.target.files?.[0] })} className="rounded-xl h-11" />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">{language === 'ar' ? 'شعار القسم' : 'Department Logo'}</Label>
                            <Input type="file" accept="image/*" onChange={e => setFormData({ ...formData, _logo_file: e.target.files?.[0] })} className="rounded-xl h-11" />
                        </div>
                    </div>
                </div>
            );

        case 'announcement':
            return (
                <div className="space-y-6">
                    {f('title_ar', t('common.title_ar'), 'text', true)}
                    {f('title_en', t('common.title_en'))}
                    {f('content_ar', t('common.content_ar'), 'textarea', true)}
                    {f('content_en', t('common.content_en'), 'textarea')}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="font-bold">{language === 'ar' ? 'صورة الإعلان' : 'Announcement Image'}</Label>
                            <Input type="file" accept="image/*" onChange={e => setFormData({ ...formData, _image_file: e.target.files?.[0] })} className="rounded-xl h-11" />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">{language === 'ar' ? 'ملف مرفق (PDF)' : 'Attachment (PDF)'}</Label>
                            <Input type="file" accept=".pdf" onChange={e => setFormData({ ...formData, _attachment_file: e.target.files?.[0] })} className="rounded-xl h-11" />
                        </div>
                    </div>
                    {selectField('scope', language === 'ar' ? 'نطاق الإعلان' : 'Scope', [
                        { id: 'global', name_ar: 'عام', name_en: 'Global' },
                        { id: 'university', name_ar: 'جامعة', name_en: 'University' },
                        { id: 'college', name_ar: 'كلية', name_en: 'College' }
                    ])}
                    {pinField()}
                </div>
            );

        case 'job':
            return (
                <div className="space-y-6">
                    {role !== 'college_admin' && selectField('college_id', t('universities.colleges'), colleges)}
                    {f('title_ar', t('common.title_ar'), 'text', true)}
                    {f('title_en', t('common.title_en'))}
                    {f('description_ar', t('common.description_ar'), 'textarea', true)}
                    {f('description_en', t('common.description_en'), 'textarea')}
                    {f('deadline', language === 'ar' ? 'الموعد النهائي' : 'Deadline', 'date')}
                    {pinField()}

                </div>
            );

        case 'graduate':
            return (
                <div className="space-y-6">
                    {f('full_name_ar', t('common.name_ar'), 'text', true)}
                    {f('full_name_en', t('common.name_en'))}
                    {role !== 'department_admin' && selectField('department_id', t('universities.departments'), departments)}
                    {f('graduation_year', language === 'ar' ? 'سنة التخرج' : 'Graduation Year', 'number')}
                    {f('gpa', 'GPA', 'number')}
                </div>
            );

        case 'research':
            return (
                <div className="space-y-6">
                    {f('title_ar', t('common.title_ar'), 'text', true)}
                    {f('title_en', t('common.title_en'))}
                    {f('author_name', language === 'ar' ? 'اسم الباحث (أو الباحثين)' : 'Author(s) Name', 'text', true)}
                    {role !== 'department_admin' && selectField('department_id', t('universities.departments'), departments)}
                    <div className="space-y-2">
                        <Label className="font-bold">{language === 'ar' ? 'ملف البحث (PDF)' : 'Research File (PDF)'}</Label>
                        <Input type="file" accept=".pdf" onChange={e => setFormData({ ...formData, _pdf_file: e.target.files?.[0] })} className="rounded-xl h-11" />
                    </div>
                </div>
            );

        case 'fee':
            return (
                <div className="space-y-6">
                    {role !== 'department_admin' && selectField('department_id', t('universities.departments'), departments)}
                    {f('amount', language === 'ar' ? 'المبلغ' : 'Amount', 'number', true)}
                    {selectField('fee_type', language === 'ar' ? 'نوع الرسوم' : 'Fee Type', [
                        { id: 'public', name_ar: 'حكومي', name_en: 'Public' },
                        { id: 'private', name_ar: 'أهلي/موازي', name_en: 'Private' }
                    ])}
                </div>
            );

        case 'about':
            return (
                <div className="space-y-6">
                    {f('content_ar', t('common.content_ar'), 'textarea', true)}
                    {f('content_en', t('common.content_en'), 'textarea')}
                    {f('developer_name_ar', language === 'ar' ? 'اسم المطور' : "Developer's Name", 'text')}
                    {f('developer_bio_ar', language === 'ar' ? 'نبذة عن المطور' : "Developer's Bio", 'textarea')}
                </div>
            );

        case 'service':
            return (
                <div className="space-y-6">
                    {f('title_ar', t('common.title_ar'), 'text', true)}
                    {f('title_en', t('common.title_en'))}
                    {f('description_ar', t('common.description_ar'), 'textarea')}
                    {f('description_en', t('common.description_en'), 'textarea')}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="font-bold">{language === 'ar' ? 'أيقونة الخدمة' : 'Service Icon/Image'}</Label>
                            <Input type="file" accept="image/*" onChange={e => setFormData({ ...formData, _icon_file: e.target.files?.[0] })} className="rounded-xl h-11" />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">{language === 'ar' ? 'رابط الخدمة' : 'Service Link'}</Label>
                            <Input value={formData.link || ''} onChange={e => setFormData({ ...formData, link: e.target.value })} placeholder="https://..." className="rounded-xl h-11" />
                        </div>
                    </div>
                </div>
            );

        default:
            return <p className="text-center py-10 text-primary/20 font-bold">{language === 'ar' ? 'نموذج غير معروف' : 'Unknown Form Type'}</p>;
    }
};
