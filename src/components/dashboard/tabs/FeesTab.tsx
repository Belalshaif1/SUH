/**
 * @file src/components/dashboard/tabs/FeesTab.tsx
 * @description Renders the Fees management section of the Admin Dashboard.
 *              Shows each fee's amount (localised), type badge (public/private),
 *              and the parent department name resolved from the departments list.
 *              Add/Edit/Delete controls are gated by the canAdd/canEdit/canDelete props.
 */

import React from 'react';                               // React for JSX and FC type
import { useLanguage } from '@/contexts/LanguageContext'; // Translation + language direction
import { Button }      from '@/components/ui/button';    // Shadcn button
import { Card, CardContent } from '@/components/ui/card'; // Shadcn card layout
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react'; // Icon set
import { Fee, Department } from '@/types/dashboard';      // TypeScript entity interfaces

// ─── Props ────────────────────────────────────────────────────────────────

/** All externally-controlled callbacks and data for the Fees tab */
interface FeesTabProps {
    fees: Fee[];                                        // The pre-filtered list of fee records
    departments: Department[];                          // Used to look up department names by ID
    onAdd: () => void;                                  // Opens the Add Fee dialog
    onEdit: (item: Fee) => void;                        // Opens Edit pre-filled with this fee record
    onDelete: (id: string, label: string) => void;      // Arms the delete confirmation dialog
    canAdd?: boolean;    // Show the Add button
    canEdit?: boolean;   // Show Edit buttons on each card
    canDelete?: boolean; // Show Delete buttons on each card
}

// ─── Component ────────────────────────────────────────────────────────────

export const FeesTab: React.FC<FeesTabProps> = ({
    fees, departments, onAdd, onEdit, onDelete,
    canAdd = false, canEdit = false, canDelete = false // Default to hidden for RBAC safety
}) => {
    const { t, language } = useLanguage(); // t() for labels, language for locale-aware formatting

    return (
        <div className="p-6"> {/* Standard padding matches all other tabs */}

            {/* ── Section header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    {/* Section title */}
                    <h2 className="text-2xl font-black text-primary mb-1">
                        {t('dashboard.manage_fees')} {/* "إدارة الرسوم" / "Manage Fees" */}
                    </h2>
                    {/* Contextual subtitle */}
                    <p className="text-sm text-primary/40 font-bold">
                        {language === 'ar'
                            ? 'إدارة الرسوم الدراسية والتكاليف الأكاديمية'
                            : 'Manage academic tuition and operational fees'
                        }
                    </p>
                </div>

                {/* Add button — only rendered when canAdd is true */}
                {canAdd && (
                    <Button
                        onClick={onAdd} // Direct reference — no redundant arrow wrapper
                        className="h-12 px-6 rounded-xl bg-gold text-white font-bold shadow-xl shadow-gold/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="h-5 w-5 me-2" />
                        {t('common.add')} {/* "إضافة" / "Add" */}
                    </Button>
                )}
            </div>

            {/* ── Fee cards grid ── */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {fees.map((f: Fee) => (
                    <Card
                        key={f.id} // Stable React key using the fee record's UUID
                        className="card-premium group hover:scale-[1.02] transition-all duration-300 border-none shadow-lg"
                    >
                        <CardContent className="flex items-center justify-between p-6">

                            {/* Left: amount + type badge + department name */}
                            <div className="flex items-center gap-3">
                                {/* Currency icon badge */}
                                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary/20 shrink-0">
                                    <DollarSign className="h-5 w-5" /> {/* Generic currency icon */}
                                </div>

                                <div className="flex flex-col">
                                    {/* Localised amount with currency label */}
                                    <span className="font-black text-primary text-xl leading-tight mb-1">
                                        {f.amount?.toLocaleString()} {/* Format number with thousands separators */}
                                        {' '}
                                        {language === 'ar' ? 'د.ع' : 'IQD'} {/* Iraqi Dinar label, localised */}
                                    </span>

                                    <div className="flex items-center gap-2">
                                        {/* Fee type badge: different colour for public vs private */}
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                            f.fee_type === 'public'
                                                ? 'bg-primary/5 text-primary/60'   // Muted style for public fees
                                                : 'bg-gold/10 text-gold'           // Gold style for private fees
                                        }`}>
                                            {/* Display localised fee type label */}
                                            {f.fee_type === 'public' ? t('fees.public') : t('fees.private')}
                                        </span>

                                        {/* Department name — resolved by looking up the department_id in the departments prop */}
                                        <span className="text-[10px] font-bold text-primary/20 uppercase tracking-widest leading-tight truncate max-w-[120px]">
                                            {departments.find(d => d.id === f.department_id)?.name_ar // Try Arabic first
                                                ?? (language === 'ar' ? 'قسم غير معروف' : 'Unknown') // Fallback if dept not found
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Edit and Delete action buttons */}
                            <div className="flex gap-2">
                                {/* Edit button */}
                                {canEdit && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEdit(f)} // Pass full fee object for form pre-filling
                                        className="h-10 w-10 rounded-xl text-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                )}

                                {/* Delete button */}
                                {canDelete && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDelete(
                                            f.id, // UUID for the DELETE API call
                                            `${f.amount?.toLocaleString()} ${language === 'ar' ? 'د.ع' : 'IQD'}` // Human-readable label for dialog
                                        )}
                                        className="h-10 w-10 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                    >
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
