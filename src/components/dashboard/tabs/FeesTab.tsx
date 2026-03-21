/**
 * @file components/dashboard/tabs/FeesTab.tsx
 * @description Manages the display and administration of academic fees.
 * Implements currency localization and premium academic styling.
 */

import React from 'react'; // React library for components
import { useLanguage } from '@/contexts/LanguageContext'; // Global translation / localization context
import { Button } from '@/components/ui/button'; // Standardized button component
import { Card, CardContent } from '@/components/ui/card'; // Card layout container
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react'; // Visual assets
import { Fee, Department } from '@/types/dashboard'; // Type definitions for data safety

/**
 * Props for FeesTab
 */
interface FeesTabProps {
    fees: Fee[]; // Data source: list of fee records
    departments: Department[]; // List of departments for ID-to-Name resolution
    onAdd: () => void; // Trigger for creating a new fee record
    onEdit: (item: Fee) => void; // Trigger for editing an existing record
    onDelete: (id: string, name: string) => void; // Trigger for deletion logic
    canAdd?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
}

export const FeesTab: React.FC<FeesTabProps> = ({
    fees, departments, onAdd, onEdit, onDelete, canAdd = false, canEdit = false, canDelete = false
}) => {
    const { t, language } = useLanguage(); // User's preference (ar/en)

    return (
        <div className="p-6"> {/* Unified padding for consistency with other tabs */}

            {/* --- Section Header --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    {/* Main Title - Premium Bold Typography */}
                    <h2 className="text-2xl font-black text-primary mb-1">{t('dashboard.manage_fees')}</h2>
                    {/* Subtitle - Informative hint for admins */}
                    <p className="text-sm text-primary/40 font-bold">
                        {language === 'ar' ? 'إدارة الرسوم الدراسية والتكاليف الأكاديمية' : 'Manage academic tuition and operational fees'}
                    </p>
                </div>
                {/* Creation Action - Standardized Gold theme */}
                {canAdd && (
                <Button onClick={() => onAdd()} className="h-12 px-6 rounded-xl bg-gold text-white font-bold shadow-xl shadow-gold/20 transition-all hover:scale-105 active:scale-95">
                    <Plus className="h-5 w-5 me-2" />{t('common.add')}
                </Button>
                )}
            </div>

            {/* --- Fees Grid --- */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {fees.map((f: Fee) => (
                    <Card key={f.id} className="card-premium group hover:scale-[1.02] transition-all duration-300 border-none shadow-lg">
                        <CardContent className="flex items-center justify-between p-6">
                            <div className="flex flex-col">
                                {/* Localized Price Display (IQD for Arabic, generic currency for English) */}
                                <span className="font-black text-primary text-xl leading-tight mb-1">
                                    {f.amount?.toLocaleString()} {language === 'ar' ? 'د.ع' : 'IQD'}
                                </span>

                                <div className="flex items-center gap-2">
                                    {/* Scope Badge (Public vs Private) */}
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${f.fee_type === 'public' ? 'bg-primary/5 text-primary/60' : 'bg-gold/10 text-gold'}`}>
                                        {f.fee_type === 'public' ? t('fees.public') : t('fees.private')}
                                    </span>

                                    {/* Department Mapping - Resolved from the departments list passed via props */}
                                    <span className="text-[10px] font-bold text-primary/20 uppercase tracking-widest leading-tight truncate max-w-[120px]">
                                        {departments.find(d => d.id === f.department_id)?.name_ar || (language === 'ar' ? 'قسم غير معروف' : 'Unknown')}
                                    </span>
                                </div>
                            </div>

                            {/* Toolbar Actions */}
                            <div className="flex gap-2">
                                {canEdit && (
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-primary/40 hover:text-primary hover:bg-primary/5 transition-all" onClick={() => onEdit(f)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                )}
                                {canDelete && (
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-all" onClick={() => onDelete(f.id, `${f.amount?.toLocaleString()} ${language === 'ar' ? 'د.ع' : 'IQD'}`)}>
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
