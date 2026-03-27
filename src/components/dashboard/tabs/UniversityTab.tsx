/**
 * @file src/components/dashboard/tabs/UniversityTab.tsx
 * @description Renders the Universities management section of the Admin Dashboard.
 *              Displays a responsive card grid with Add, Edit, and Delete controls
 *              gated behind the role-based `canAdd`, `canEdit`, `canDelete` props.
 *
 * BUG FIX: Moved the `import { Building2 }` that was placed at the bottom of the
 *           file (after the component export) to the top with the other imports.
 *           Having an import after an export is technically valid in ES modules but
 *           causes linting errors and is confusing — it now lives at the top.
 */

import React from 'react';                            // React for JSX and FC type
import { useLanguage } from '@/contexts/LanguageContext'; // For t() translation and language direction
import { Button }      from '@/components/ui/button';    // Shadcn button
import { Card, CardContent } from '@/components/ui/card'; // Shadcn card layout
import { Plus, Edit, Trash2, Pin, Building2 } from 'lucide-react'; // Icons — Building2 moved here from bottom
import { University } from '@/types/dashboard';            // TypeScript entity interface

// ─── Props ────────────────────────────────────────────────────────────────

/** All externally-controlled data and callbacks for the Universities tab */
interface UniversityTabProps {
    universities: University[];                     // The filtered list of universities to display
    onAdd: () => void;                              // Called when user clicks "Add" — opens the Add dialog
    onEdit: (item: University) => void;             // Called with the university object to edit
    onDelete: (id: string, name: string) => void;  // Called with uuid + display name for confirm dialog
    processData: (data: any[]) => any[];            // Sort/pin processing before rendering the list
    role?: string;                                  // The current user's role string (for local display logic)
    userRole?: any;                                 // Full role object (for scope filtering within the tab)
    canAdd?: boolean;    // Whether the "Add" button should be visible
    canEdit?: boolean;   // Whether the "Edit" button should appear on each card
    canDelete?: boolean; // Whether the "Delete" button should appear on each card
}

// ─── Component ────────────────────────────────────────────────────────────

export const UniversityTab: React.FC<UniversityTabProps> = ({
    universities, onAdd, onEdit, onDelete, processData,
    role, userRole, canAdd, canEdit, canDelete
}) => {
    const { t, language } = useLanguage(); // t() for translated strings, language for inline conditionals

    // ── Role-based filtering ───────────────────────────────────────────

    // Filter the list down to what this admin is allowed to see
    const filteredUnis = universities.filter(u => {
        if (role === 'super_admin') return true;                     // Super admin sees all universities
        if (role === 'university_admin') return u.id === userRole?.university_id; // Uni admin sees only their own
        return false;                                                 // Other roles don't see this tab
    });

    // Apply sort order and pinning from the parent's processData utility
    const processedList = processData(filteredUnis);

    // ── Render ────────────────────────────────────────────────────────

    return (
        <div className="p-6"> {/* Standard dashboard section padding */}

            {/* ── Section header with title and Add button ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    {/* Bold section title using the primary brand colour */}
                    <h2 className="text-2xl font-black text-primary mb-1">
                        {t('dashboard.manage_universities')} {/* "إدارة الجامعات" / "Manage Universities" */}
                    </h2>
                    {/* Muted subtitle giving context for the section */}
                    <p className="text-sm text-primary/40 font-bold">
                        {language === 'ar'
                            ? 'إدارة المؤسسات التعليمية المسجلة'
                            : 'Manage registered educational institutions'
                        }
                    </p>
                </div>

                {/* "Add" button — only rendered when the caller grants canAdd permission */}
                {canAdd && (
                    <Button
                        onClick={onAdd} // BUG FIX: direct call — no wrapper needed, onAdd is already a stable function
                        className="h-12 px-6 rounded-xl bg-gold text-white font-bold shadow-xl shadow-gold/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="h-5 w-5 me-2" /> {/* Plus icon before the text */}
                        {t('common.add')} {/* "إضافة" / "Add" */}
                    </Button>
                )}
            </div>

            {/* ── Universities card grid ── */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {processedList.map((u: University) => (
                    <Card
                        key={u.id} // React requires a stable unique key for list items
                        className="card-premium group hover:scale-[1.02] transition-all duration-300 border-none shadow-lg"
                    >
                        <CardContent className="flex items-center justify-between gap-2 p-6">

                            {/* Left side: icon badge + name — flex-1 min-w-0 ensures text truncates before overflowing */}
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                {/* Show a gold pin badge for pinned items, or a default icon for normal items */}
                                {u.is_pinned ? (
                                    <div className="h-10 w-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold shadow-inner border border-gold/10 shrink-0">
                                        <Pin className="h-5 w-5" /> {/* Gold pin indicates pinned / featured */}
                                    </div>
                                ) : (
                                    <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary/20 shrink-0">
                                        <Building2 className="h-5 w-5" /> {/* Default building icon */}
                                    </div>
                                )}

                                {/* Name and type label — min-w-0 allows text to truncate inside flex */}
                                <div className="flex flex-col min-w-0">
                                    {/* Display Arabic or English name based on current UI language */}
                                    <span className="font-black text-primary leading-tight truncate">
                                        {language === 'ar' ? u.name_ar : (u.name_en || u.name_ar)}
                                    </span>
                                    {/* Decorative sub-label */}
                                    <span className="text-[10px] font-bold text-primary/20 uppercase tracking-widest mt-0.5 truncate">
                                        {language === 'ar' ? 'مؤسسة أكاديمية' : 'ACADEMIC INSTITUTION'}
                                    </span>
                                </div>
                            </div>

                            {/* Right side: action buttons — shrink-0 keeps buttons always visible */}
                            <div className="flex gap-2 shrink-0">
                                {/* Edit button — only shown when canEdit is true */}
                                {canEdit && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEdit(u)} // Pass the full university object so the form pre-fills
                                        className="h-10 w-10 rounded-xl text-primary/40 hover:text-primary hover:bg-primary/5"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                )}

                                {/* Delete button — only shown when canDelete is true */}
                                {canDelete && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDelete(
                                            u.id,                                           // UUID for the DELETE request
                                            language === 'ar' ? u.name_ar : (u.name_en || u.name_ar) // Name for the confirm dialog
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
