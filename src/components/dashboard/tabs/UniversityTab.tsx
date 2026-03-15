/**
 * @file components/dashboard/tabs/UniversityTab.tsx
 * @description Renders the Universities management section for the Admin Dashboard.
 * It uses the premium academic design tokens and provides CRUD interfaces.
 */

import React from 'react'; // Import React for component definition
import { useLanguage } from '@/contexts/LanguageContext'; // For internationalization (ar/en)
import { Button } from '@/components/ui/button'; // Reusable UI Button component
import { Card, CardContent } from '@/components/ui/card'; // Reusable UI Card components for layout
import { Plus, Edit, Trash2, Pin } from 'lucide-react'; // Modern icons for actions
import { University } from '@/types/dashboard'; // Type safety for the University entity

/**
 * Props for the UniversityTab component
 */
interface UniversityTabProps {
    universities: University[]; // List of universities to display
    onAdd: () => void; // Trigger for "Add New University" dialog
    onEdit: (item: University) => void; // Trigger for "Edit University" dialog
    onDelete: (id: string, name: string) => void; // Trigger for deletion logic
    processData: (data: any[]) => any[]; // Utility to sort/pin data before rendering
    role?: string;
    userRole?: any;
    canAdd?: boolean;    // السماح بالإضافة
    canEdit?: boolean;   // السماح بالتعديل
    canDelete?: boolean; // السماح بالحذف
}


export const UniversityTab: React.FC<UniversityTabProps> = ({
    universities, onAdd, onEdit, onDelete, processData, role, userRole,
    canAdd, canEdit, canDelete // استقبال خصائص الصلاحيات الجديدة
}) => {

    const { t, language } = useLanguage(); // Access translation function and current language

    // Filter based on role
    const filteredUnis = universities.filter(u => {
        if (role === 'super_admin') return true;
        if (role === 'university_admin') return u.id === userRole?.university_id;
        return false; // Other admins shouldn't see university tab content or will have empty list
    });

    // Pre-process the list (Handling pinning and sorting)
    const processedList = processData(filteredUnis);

    return (
        <div className="p-6"> {/* Main container with standard padding */}

            {/* --- Section Header --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    {/* Main Title - Uses Black weight for premium academic look */}
                    <h2 className="text-2xl font-black text-primary mb-1">{t('dashboard.manage_universities')}</h2>
                    {/* Subtitle - Uses semi-transparent primary color for hierarchy */}
                    <p className="text-sm text-primary/40 font-bold">
                        {language === 'ar' ? 'إدارة المؤسسات التعليمية المسجلة' : 'Manage registered educational institutions'}
                    </p>
                </div>
                {/* Call to Action Button - مبني على الصلاحيات الممنوحة */}
                {canAdd && (
                    <Button onClick={onAdd} className="h-12 px-6 rounded-xl bg-gold text-white font-bold shadow-xl shadow-gold/20 transition-all hover:scale-105 active:scale-95">
                        <Plus className="h-5 w-5 me-2" /> {t('common.add')}
                    </Button>
                )}
            </div>


            {/* --- Universities Grid --- */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {processedList.map((u: University) => (
                    <Card key={u.id} className="card-premium group hover:scale-[1.02] transition-all duration-300 border-none shadow-lg">
                        <CardContent className="flex items-center justify-between p-6">
                            <div className="flex items-center gap-4">
                                {/* Visual indicator for pinned items (Super Admin priority) */}
                                {u.is_pinned ? (
                                    <div className="h-10 w-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold shadow-inner border border-gold/10">
                                        <Pin className="h-5 w-5" />
                                    </div>
                                ) : (
                                    <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary/20">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                )}
                                {/* University Name - Swaps between AR/EN based on context */}
                                <div className="flex flex-col">
                                    <span className="font-black text-primary leading-tight">
                                        {language === 'ar' ? u.name_ar : (u.name_en || u.name_ar)}
                                    </span>
                                    <span className="text-[10px] font-bold text-primary/20 uppercase tracking-widest mt-0.5">
                                        {language === 'ar' ? 'مؤسسة أكاديمية' : 'ACADEMIC INSTITUTION'}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons - Grouped for clean look */}
                            <div className="flex gap-2">
                                {/* زر التعديل */}
                                {canEdit && (
                                    <Button variant="ghost" size="icon" onClick={() => onEdit(u)} className="h-10 w-10 rounded-xl text-primary/40 hover:text-primary hover:bg-primary/5">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                )}
                                {/* زر الحذف */}
                                {canDelete && (
                                    <Button variant="ghost" size="icon" onClick={() => onDelete(u.id, language === 'ar' ? u.name_ar : (u.name_en || u.name_ar))} className="h-10 w-10 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50">
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

// Internal Import for icons (if needed specifically for this file)
import { Building2 } from 'lucide-react'; 
