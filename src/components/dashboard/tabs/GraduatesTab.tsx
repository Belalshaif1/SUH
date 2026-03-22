/**
 * @file src/components/dashboard/tabs/GraduatesTab.tsx
 * @description Renders the Graduates management section of the Admin Dashboard.
 *              Displays a responsive card grid showing graduate name, year, and specialisation.
 *              Add/Edit/Delete controls are gated by the canAdd/canEdit/canDelete props.
 */

import React from 'react';                               // React for JSX and FC type
import { useLanguage } from '@/contexts/LanguageContext'; // Translation and language direction
import { Button }      from '@/components/ui/button';    // Shadcn button component
import { Card, CardContent } from '@/components/ui/card'; // Shadcn card layout
import { Plus, Edit, Trash2, GraduationCap } from 'lucide-react'; // Icon set
import { Graduate } from '@/types/dashboard';             // TypeScript entity interface

// ─── Props ────────────────────────────────────────────────────────────────

/** All externally-controlled data and callbacks for the Graduates tab */
interface GraduatesTabProps {
    graduates: Graduate[];                              // The pre-filtered list of graduate records
    onAdd: () => void;                                  // Opens the Add Graduate dialog
    onEdit: (item: Graduate) => void;                   // Opens Edit pre-filled with this graduate
    onDelete: (id: string, name: string) => void;       // Arms the delete confirmation dialog
    processData: (data: any[]) => any[];                // Sort/filter utility from useDashboardData
    canAdd?: boolean;    // Show "Add" button
    canEdit?: boolean;   // Show "Edit" button on each card
    canDelete?: boolean; // Show "Delete" button on each card
}

// ─── Component ────────────────────────────────────────────────────────────

export const GraduatesTab: React.FC<GraduatesTabProps> = ({
    graduates, onAdd, onEdit, onDelete, processData,
    canAdd = false, canEdit = false, canDelete = false // Default to hidden for safety
}) => {
    const { t, language } = useLanguage(); // t() for labels, language for name display logic

    // Apply pinning and sort order before rendering the list
    const processedList = processData(graduates);

    return (
        <div className="p-6"> {/* Standard section padding matches all other tabs */}

            {/* ── Section header with title and Add button ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    {/* Bold section title */}
                    <h2 className="text-2xl font-black text-primary mb-1">
                        {t('dashboard.manage_graduates')} {/* "إدارة الخريجين" / "Manage Graduates" */}
                    </h2>
                    {/* Contextual subtitle */}
                    <p className="text-sm text-primary/40 font-bold">
                        {language === 'ar'
                            ? 'إدارة سجلات الخريجين والطلبة الأوائل'
                            : 'Manage graduate records and top students'
                        }
                    </p>
                </div>

                {/* Add button — only rendered when the calling component grants permission */}
                {canAdd && (
                    <Button
                        onClick={onAdd} // Direct reference — no redundant arrow wrapper needed
                        className="h-12 px-6 rounded-xl bg-gold text-white font-bold shadow-xl shadow-gold/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="h-5 w-5 me-2" /> {/* Plus icon */}
                        {t('common.add')} {/* "إضافة" / "Add" */}
                    </Button>
                )}
            </div>

            {/* ── Graduate cards grid ── */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {processedList.map((g: Graduate) => (
                    <Card
                        key={g.id} // Stable React key using the graduate's UUID
                        className="card-premium group hover:scale-[1.02] transition-all duration-300 border-none shadow-lg"
                    >
                        <CardContent className="flex items-center justify-between p-6">

                            {/* Left side: graduation cap icon badge + name/year */}
                            <div className="flex items-center gap-4">
                                {/* Decorative icon badge — uses muted primary for consistency */}
                                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary/20">
                                    <GraduationCap className="h-5 w-5" /> {/* Academic motif */}
                                </div>

                                {/* Text content: name + year/specialisation metadata */}
                                <div className="flex flex-col">
                                    {/* Full name — display Arabic or English based on user's language setting */}
                                    <span className="font-black text-primary leading-tight">
                                        {language === 'ar' ? g.full_name_ar : (g.full_name_en || g.full_name_ar)}
                                    </span>
                                    {/* Secondary metadata: graduation year + specialisation */}
                                    <span className="text-[10px] font-bold text-primary/20 uppercase tracking-widest mt-0.5">
                                        {g.graduation_year} {/* The numeric graduation year (e.g. 2023) */}
                                        {' | '}
                                        {/* Specialisation or a generic fallback label */}
                                        {language === 'ar'
                                            ? (g.specialization_ar || 'أكاديمي')
                                            : (g.specialization_en || 'Academic')
                                        }
                                    </span>
                                </div>
                            </div>

                            {/* Right side: Edit and Delete action buttons */}
                            <div className="flex gap-2">
                                {/* Edit button — conditionally rendered by canEdit */}
                                {canEdit && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEdit(g)} // Pass graduate object so form can pre-fill all fields
                                        className="h-10 w-10 rounded-xl text-primary/40 hover:text-primary hover:bg-primary/5"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                )}

                                {/* Delete button — conditionally rendered by canDelete */}
                                {canDelete && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDelete(
                                            g.id, // UUID used for the DELETE request
                                            language === 'ar' ? g.full_name_ar : (g.full_name_en || g.full_name_ar) // Name for the dialog
                                        )}
                                        className="h-10 w-10 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50"
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
