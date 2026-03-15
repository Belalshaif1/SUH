/**
 * @file components/dashboard/tabs/CollegeTab.tsx
 * @description Manages the Colleges management view. 
 * Supports hierarchical filtering and premium academic styling.
 */

import React from 'react'; // React library for components
import { useLanguage } from '@/contexts/LanguageContext'; // Global translation context
import { Button } from '@/components/ui/button'; // Standardized button component
import { Card, CardContent } from '@/components/ui/card'; // Card layout system
import { Plus, Edit, Trash2, Pin, BookOpen } from 'lucide-react'; // Visual assets
import { College } from '@/types/dashboard'; // Type definition for College entity

/**
 * Props for the CollegeTab component
 */
interface CollegeTabProps {
    colleges: College[]; // Data source: list of colleges
    onAdd: () => void; // Trigger for add modal
    onEdit: (item: College) => void; // Trigger for edit modal
    onDelete: (id: string, name: string) => void; // Trigger for delete action
    processData: (data: any[]) => any[]; // Business logic wrapper for sorting/pinning
    role?: string;
    userRole?: any;
    canAdd?: boolean;    // السماح بالإضافة
    canEdit?: boolean;   // السماح بالتعديل
    canDelete?: boolean; // السماح بالحذف
}


export const CollegeTab: React.FC<CollegeTabProps> = ({
    colleges, onAdd, onEdit, onDelete, processData, role, userRole,
    canAdd, canEdit, canDelete // استقبال خصائص الصلاحيات الجديدة
}) => {

    const { t, language } = useLanguage(); // Current language settings

    // Filter based on role
    const filteredColleges = colleges.filter(c => {
        if (role === 'super_admin') return true;
        if (role === 'university_admin') return c.university_id === userRole?.university_id;
        if (role === 'college_admin') return c.id === userRole?.college_id;
        return false;
    });

    // Process data before rendering (apply pinning and sort order)
    const processedList = processData(filteredColleges);

    return (
        <div className="p-6"> {/* Container with standard admin board padding */}

            {/* --- Section Header --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    {/* Header Title - Black weight for high-end academic feel */}
                    <h2 className="text-2xl font-black text-primary mb-1">{t('dashboard.manage_colleges')}</h2>
                    {/* Decorative subtitle with reduced opacity */}
                    <p className="text-sm text-primary/40 font-bold">
                        {language === 'ar' ? 'إدارة الكليات والأقسام العلمية' : 'Manage academic colleges and departments'}
                    </p>
                </div>
                {/* Primary Action - مبني على الصلاحيات الممنوحة */}
                {canAdd && (
                    <Button onClick={onAdd} className="h-12 px-6 rounded-xl bg-gold text-white font-bold shadow-xl shadow-gold/20 transition-all hover:scale-105 active:scale-95">
                        <Plus className="h-5 w-5 me-2" /> {t('common.add')}
                    </Button>
                )}
            </div>


            {/* --- Colleges Grid --- */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {processedList.map((c: College) => (
                    <Card key={c.id} className="card-premium group hover:scale-[1.02] transition-all duration-300 border-none shadow-lg">
                        <CardContent className="flex items-center justify-between p-6">
                            <div className="flex items-center gap-4">
                                {/* Visual indicator for pinned colleges (Super Admin choice) */}
                                {c.is_pinned ? (
                                    <div className="h-10 w-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold shadow-inner border border-gold/10">
                                        <Pin className="h-5 w-5" />
                                    </div>
                                ) : (
                                    <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary/20">
                                        <BookOpen className="h-5 w-5" />
                                    </div>
                                )}
                                {/* Information Cluster */}
                                <div className="flex flex-col">
                                    <span className="font-black text-primary leading-tight">
                                        {language === 'ar' ? c.name_ar : (c.name_en || c.name_ar)}
                                    </span>
                                    <span className="text-[10px] font-bold text-primary/20 uppercase tracking-widest mt-0.5">
                                        {language === 'ar' ? 'صرح تعليمي' : 'EDUCATIONAL FACULTY'}
                                    </span>
                                </div>
                            </div>

                            {/* مجموعة أزرار التفاعل */}
                            <div className="flex gap-2">
                                {/* زر التعديل - يظهر فقط إذا كان مسموحاً */}
                                {canEdit && (
                                    <Button variant="ghost" size="icon" onClick={() => onEdit(c)} className="h-10 w-10 rounded-xl text-primary/40 hover:text-primary hover:bg-primary/5">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                )}
                                {/* زر الحذف - يظهر فقط إذا كان مسموحاً */}
                                {canDelete && (
                                    <Button variant="ghost" size="icon" onClick={() => onDelete(c.id, language === 'ar' ? c.name_ar : (c.name_en || c.name_ar))} className="h-10 w-10 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50">
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
