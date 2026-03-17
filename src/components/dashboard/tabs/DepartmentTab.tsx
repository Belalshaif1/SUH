/**
 * @file components/dashboard/tabs/DepartmentTab.tsx
 * @description Manages the Departments view in the Admin Dashboard.
 * Focuses on listing departments with their associated college info.
 */

import React from 'react'; // React for UI components
import { useLanguage } from '@/contexts/LanguageContext'; // For AR/EN support
import { Button } from '@/components/ui/button'; // Standard button
import { Card, CardContent } from '@/components/ui/card'; // Card layout container
import { Plus, Edit, Trash2, FileText } from 'lucide-react'; // Icons
import { Department } from '@/types/dashboard'; // Type safety

/**
 * Props for DepartmentTab
 */
interface DepartmentTabProps {
    departments: Department[]; // List of department records
    onAdd: () => void; // Function to trigger add dialog
    onEdit: (item: Department) => void; // Function to trigger edit dialog
    onDelete: (id: string, name: string) => void; // Function to handle deletion
    processData: (data: any[]) => any[]; // Utility for sorting and filtering logic
    role?: string;
    userRole?: any;
    canAdd?: boolean;    // السماح بالإضافة
    canEdit?: boolean;   // السماح بالتعديل
    canDelete?: boolean; // السماح بالحذف
}


export const DepartmentTab: React.FC<DepartmentTabProps> = ({
    departments, onAdd, onEdit, onDelete, processData, role, userRole,
    canAdd, canEdit, canDelete // استقبال الخصائص الجديدة
}) => {

    const { t, language } = useLanguage(); // Current language and localization tool

  // 1. تصفية الأقسام بناءً على دور المستخدم لتحديد ما يمكنه رؤيته
  const filteredDeps = departments.filter(d => {
    if (role === 'super_admin') return true; // المدير العام يرى جميع الأقسام
    if (role === 'university_admin') return true; // مدير الجامعة (يمكنه رؤية كل الأقسام حالياً)
    if (role === 'college_admin') return d.college_id === userRole?.college_id; // مدير الكلية يرى أقسام كليته فقط
    if (role === 'department_admin') return d.id === userRole?.department_id; // مدير القسم يرى قسمه فقط
    return false;
  });

  // 2. معالجة البيانات (الترتيب حسب الموضع أو الأبجدية)
  const processedList = processData(filteredDeps);

  return (
    <div className="p-6">
      {/* 3. الهيدر: العنوان وزر الإضافة */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-black text-primary mb-1">{t('dashboard.manage_departments')}</h2>
          <p className="text-sm text-primary/40 font-bold">
            {language === 'ar' ? 'إدارة الأقسام العلمية والبرامج الدراسية' : 'Manage academic departments and study programs'}
          </p>
        </div>
        {/* زر الإضافة (يظهر فقط لمن يملكون الصلاحية) */}
        {canAdd && (
          <Button onClick={onAdd} className="h-12 px-6 rounded-xl bg-gold text-white font-bold shadow-xl shadow-gold/20 transition-all hover:scale-105 active:scale-95">
            <Plus className="h-5 w-5 me-2" /> {t('common.add')}
          </Button>
        )}
      </div>

      {/* 4. شبكة عرض الأقسام */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {processedList.map((d: Department) => (
          <Card key={d.id} className="card-premium group hover:scale-[1.02] transition-all duration-300 border-none shadow-lg">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary/20">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  {/* اسم القسم باللغة المختارة */}
                  <span className="font-black text-primary leading-tight">
                    {language === 'ar' ? d.name_ar : (d.name_en || d.name_ar)}
                  </span>
                  <span className="text-[10px] font-bold text-primary/20 uppercase tracking-widest mt-0.5">
                    {language === 'ar' ? 'قسم علمي' : 'ACADEMIC DEPARTMENT'}
                  </span>
                </div>
              </div>

              {/* 5. التحكم بالقسم (تعديل / حذف) */}
              <div className="flex gap-2">
                {canEdit && (
                  <Button variant="ghost" size="icon" onClick={() => onEdit(d)} className="h-10 w-10 rounded-xl text-primary/40 hover:text-primary hover:bg-primary/5">
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {canDelete && (
                  <Button variant="ghost" size="icon" onClick={() => onDelete(d.id, language === 'ar' ? d.name_ar : (d.name_en || d.name_ar))} className="h-10 w-10 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
