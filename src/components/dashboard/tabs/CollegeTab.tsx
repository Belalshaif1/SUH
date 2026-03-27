/**
 * @file src/components/dashboard/tabs/CollegeTab.tsx
 * @description Renders the Colleges management section of the Admin Dashboard.
 *              Supports role-based filtering so university admins only see their
 *              own colleges, and college admins see only their single college.
 */

import React from 'react';                               // React for JSX and FC type
import { useLanguage } from '@/contexts/LanguageContext'; // Translation and current language
import { Button }      from '@/components/ui/button';    // Shadcn button
import { Card, CardContent } from '@/components/ui/card'; // Shadcn card layout
import { Plus, Edit, Trash2, Pin, BookOpen } from 'lucide-react'; // Icon set
import { College } from '@/types/dashboard';              // TypeScript entity interface

// ─── Props ────────────────────────────────────────────────────────────────

/** All externally-controlled callbacks and data for the Colleges tab */
interface CollegeTabProps {
    colleges: College[];                                // Full filtered list from useDashboardData
    onAdd: () => void;                                  // Opens the Add College dialog
    onEdit: (item: College) => void;                    // Opens Edit pre-filled with this college
    onDelete: (id: string, name: string) => void;       // Arms the delete confirmation dialog
    processData: (data: any[]) => any[];                // Sort and pin utility from useDashboardData
    role?: string;                                      // Current user's role string for local filtering
    userRole?: any;                                     // Full role object for scope-based filtering
    canAdd?: boolean;    // Whether the Add button is visible
    canEdit?: boolean;   // Whether Edit buttons appear on cards
    canDelete?: boolean; // Whether Delete buttons appear on cards
}

// ─── Component ────────────────────────────────────────────────────────────

export const CollegeTab: React.FC<CollegeTabProps> = ({
    colleges, onAdd, onEdit, onDelete, processData,
    role, userRole, canAdd, canEdit, canDelete
}) => {
    const { t, language } = useLanguage(); // t() for labels, language for name display choice

    // ── Role-based filtering ───────────────────────────────────────────

    const filteredColleges = colleges.filter(c => {
        if (role === 'super_admin')      return true;                                 // Super admin sees all colleges
        if (role === 'university_admin') return c.university_id === userRole?.university_id; // Their university's colleges
        if (role === 'college_admin')    return c.id === userRole?.college_id;        // Only their single college
        return false;                                                                  // Unexpected role — hide everything
    });

    // Apply pinning and sort order from the parent's processData utility
    const processedList = processData(filteredColleges);

    return (
        <div className="p-6"> {/* Standard section padding */}

            {/* ── Section header with title and Add button ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    {/* Bold section title */}
                    <h2 className="text-2xl font-black text-primary mb-1">
                        {t('dashboard.manage_colleges')} {/* "إدارة الكليات" / "Manage Colleges" */}
                    </h2>
                    {/* Muted contextual subtitle */}
                    <p className="text-sm text-primary/40 font-bold">
                        {language === 'ar'
                            ? 'إدارة الكليات والأقسام العلمية'
                            : 'Manage academic colleges and departments'
                        }
                    </p>
                </div>

                {/* Add button — only rendered when canAdd is explicitly true */}
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

            {/* ── College cards grid ── */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {processedList.map((c: College) => (
                    <Card
                        key={c.id} // Stable React key using the college's UUID
                        className="card-premium group hover:scale-[1.02] transition-all duration-300 border-none shadow-lg"
                    >
                        <CardContent className="flex items-center justify-between gap-2 p-6">

                            {/* Left: icon badge + name — flex-1 min-w-0 prevents overflow */}
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                {/* Gold pin badge for pinned colleges, default book icon otherwise */}
                                {c.is_pinned ? (
                                    <div className="h-10 w-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold shadow-inner border border-gold/10 shrink-0">
                                        <Pin className="h-5 w-5" /> {/* Pinned / featured indicator */}
                                    </div>
                                ) : (
                                    <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary/20 shrink-0">
                                        <BookOpen className="h-5 w-5" /> {/* Default college icon */}
                                    </div>
                                )}

                                {/* Name and type label — min-w-0 allows text to truncate */}
                                <div className="flex flex-col min-w-0">
                                    {/* Arabic or English name based on the current language setting */}
                                    <span className="font-black text-primary leading-tight truncate">
                                        {language === 'ar' ? c.name_ar : (c.name_en || c.name_ar)}
                                    </span>
                                    {/* Small all-caps decorative label below the name */}
                                    <span className="text-[10px] font-bold text-primary/20 uppercase tracking-widest mt-0.5 truncate">
                                        {language === 'ar' ? 'صرح تعليمي' : 'EDUCATIONAL FACULTY'}
                                    </span>
                                </div>
                            </div>

                            {/* Right: Edit and Delete buttons — shrink-0 keeps them always visible */}
                            <div className="flex gap-2 shrink-0">
                                {/* Edit button — hidden when canEdit is false */}
                                {canEdit && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEdit(c)} // Pass full college object for form pre-filling
                                        className="h-10 w-10 rounded-xl text-primary/40 hover:text-primary hover:bg-primary/5"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                )}

                                {/* Delete button — hidden when canDelete is false */}
                                {canDelete && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDelete(
                                            c.id, // UUID for the DELETE API request
                                            language === 'ar' ? c.name_ar : (c.name_en || c.name_ar) // Name for confirmation
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
