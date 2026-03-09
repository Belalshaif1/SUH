/**
 * @file components/dashboard/tabs/GraduatesTab.tsx
 * @description Renders the Graduates listing and management view.
 * Uses specialized premium cards for academic profile display.
 */

import React from 'react'; // React UI library
import { useLanguage } from '@/contexts/LanguageContext'; // Internationalization
import { Button } from '@/components/ui/button'; // Reusable button
import { Card, CardContent } from '@/components/ui/card'; // Card layout
import { Plus, Edit, Trash2, GraduationCap } from 'lucide-react'; // Icons
import { Graduate } from '@/types/dashboard'; // Type safety

/**
 * Props for GraduatesTab
 */
interface GraduatesTabProps {
    graduates: Graduate[]; // Data source
    onAdd: () => void; // Trigger for create
    onEdit: (item: Graduate) => void; // Trigger for edit
    onDelete: (id: string) => void; // Handle removal
    processData: (data: any[]) => any[]; // Logic wrapper for sort/filters
}

export const GraduatesTab: React.FC<GraduatesTabProps> = ({
    graduates, onAdd, onEdit, onDelete, processData
}) => {
    const { t, language } = useLanguage(); // User localization context

    // Data processing before mapping
    const processedList = processData(graduates);

    return (
        <div className="p-6"> {/* Standard container padding */}

            {/* --- Section Header --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-2xl font-black text-primary mb-1">{t('dashboard.manage_graduates')}</h2>
                    <p className="text-sm text-primary/40 font-bold">
                        {language === 'ar' ? 'إدارة سجلات الخريجين والطلبة الأوائل' : 'Manage graduate records and top students'}
                    </p>
                </div>
                <Button onClick={onAdd} className="h-12 px-6 rounded-xl bg-gold text-white font-bold shadow-xl shadow-gold/20 transition-all hover:scale-105 active:scale-95">
                    <Plus className="h-5 w-5 me-2" /> {t('common.add')}
                </Button>
            </div>

            {/* --- Graduates List --- */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {processedList.map((g: Graduate) => (
                    <Card key={g.id} className="card-premium group hover:scale-[1.02] transition-all duration-300 border-none shadow-lg">
                        <CardContent className="flex items-center justify-between p-6">
                            <div className="flex items-center gap-4">
                                {/* Academic Icon Badge */}
                                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary/20">
                                    <GraduationCap className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                    {/* Localized Full Name */}
                                    <span className="font-black text-primary leading-tight">
                                        {language === 'ar' ? g.full_name_ar : (g.full_name_en || g.full_name_ar)}
                                    </span>
                                    {/* Year and Specialization Metadata */}
                                    <span className="text-[10px] font-bold text-primary/20 uppercase tracking-widest mt-0.5">
                                        {g.graduation_year} | {language === 'ar' ? g.specialization_ar : (g.specialization_en || 'Academic')}
                                    </span>
                                </div>
                            </div>

                            {/* Toolbar */}
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => onEdit(g)} className="h-10 w-10 rounded-xl text-primary/40 hover:text-primary hover:bg-primary/5">
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => onDelete(g.id)} className="h-10 w-10 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};
