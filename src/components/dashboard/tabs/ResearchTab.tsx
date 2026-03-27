/**
 * @file src/components/dashboard/tabs/ResearchTab.tsx
 * @description Renders the Research Papers management section of the Admin Dashboard.
 *              Displays research titles, author names, and pinned status.
 *              Add/Edit/Delete controls are gated by the canAdd/canEdit/canDelete props.
 */

import React from 'react';                               // React for JSX and FC type
import { useLanguage } from '@/contexts/LanguageContext'; // Translation and language direction
import { Button }      from '@/components/ui/button';    // Shadcn button
import { Card, CardContent } from '@/components/ui/card'; // Shadcn card layout
import { Plus, Edit, Trash2, FileText, Pin } from 'lucide-react'; // Icon set
import { Research } from '@/types/dashboard';             // TypeScript entity interface

// ─── Props ────────────────────────────────────────────────────────────────

/** All externally-controlled callbacks and data for the Research tab */
interface ResearchTabProps {
    research: Research[];                               // The pre-filtered list of research paper records
    onAdd: () => void;                                  // Opens the Add Research dialog
    onEdit: (item: Research) => void;                   // Opens Edit pre-filled with this paper
    onDelete: (id: string, title: string) => void;      // Arms the delete confirmation dialog
    processData: (data: any[]) => any[];                // Sort/pin utility from useDashboardData
    canAdd?: boolean;    // Show the Add button
    canEdit?: boolean;   // Show Edit buttons on cards
    canDelete?: boolean; // Show Delete buttons on cards
}

// ─── Component ────────────────────────────────────────────────────────────

export const ResearchTab: React.FC<ResearchTabProps> = ({
    research, onAdd, onEdit, onDelete, processData,
    canAdd = false, canEdit = false, canDelete = false // Defaults to hidden for safety
}) => {
    const { t, language } = useLanguage(); // t() for translated labels, language for title selection

    // Apply pinning and sort order before rendering
    const processedList = processData(research);

    return (
        <div className="p-6"> {/* Standard dashboard section padding */}

            {/* ── Section header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    {/* Section title */}
                    <h2 className="text-2xl font-black text-primary mb-1">
                        {t('dashboard.manage_research')} {/* "إدارة الأبحاث" / "Manage Research" */}
                    </h2>
                    {/* Descriptive subtitle */}
                    <p className="text-sm text-primary/40 font-bold">
                        {language === 'ar'
                            ? 'إدارة ونشر البحوث العلمية والمقالات'
                            : 'Manage and publish scientific research and articles'
                        }
                    </p>
                </div>

                {/* Add button — only shown when the caller grants canAdd */}
                {canAdd && (
                    <Button
                        onClick={onAdd} // Direct reference — no arrow wrapper needed
                        className="h-12 px-6 rounded-xl bg-gold text-white font-bold shadow-xl shadow-gold/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="h-5 w-5 me-2" />
                        {t('common.add')} {/* "إضافة" / "Add" */}
                    </Button>
                )}
            </div>

            {/* ── Research paper cards grid ── */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {processedList.map((r: Research) => (
                    <Card
                        key={r.id} // Stable React key using the research paper's UUID
                        className="card-premium group hover:scale-[1.02] transition-all duration-300 border-none shadow-lg"
                    >
                        <CardContent className="p-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6">

                                {/* Left: icon badge + title/author — flex-1 min-w-0 ensures text truncates before buttons overflow */}
                                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                    {/* Gold pin badge for pinned, file icon for regular papers */}
                                    <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0 ${
                                        r.is_pinned ? 'bg-gold/10 text-gold' : 'bg-primary/5 text-primary/20'
                                    }`}>
                                        {/* Switch icon based on pinned state */}
                                        {r.is_pinned
                                            ? <Pin className="h-4.5 w-4.5 sm:h-5 sm:w-5" />        // Gold pin icon for featured papers
                                            : <FileText className="h-4.5 w-4.5 sm:h-5 sm:w-5" />   // Default document icon
                                        }
                                    </div>

                                    {/* Title and author metadata — min-w-0 allows text truncation inside flex */}
                                    <div className="flex flex-col min-w-0">
                                        {/* Research paper title — truncated to prevent card overflow */}
                                        <span className="font-black text-primary leading-tight truncate text-sm sm:text-base">
                                            {language === 'ar' ? r.title_ar : (r.title_en || r.title_ar)}
                                        </span>
                                        {/* Author attribution label */}
                                        <span className="text-[9px] sm:text-[10px] font-bold text-primary/20 uppercase tracking-widest mt-0.5 truncate">
                                            {language === 'ar' ? 'بواسطة: ' : 'BY: '}
                                            {r.author_name} {/* Author's full name from the database */}
                                        </span>
                                    </div>
                                </div>

                                {/* Right: Edit and Delete action buttons — shrink-0 prevents buttons from being squished */}
                                <div className="flex gap-2 shrink-0 justify-end mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-none border-primary/5">
                                    {/* Edit button — conditionally rendered by canEdit */}
                                    {canEdit && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(r)} // Pass full research object for form pre-filling
                                            className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl text-primary/40 hover:text-primary hover:bg-primary/5"
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
                                                r.id, // UUID for the DELETE API call
                                                language === 'ar' ? r.title_ar : (r.title_en || r.title_ar) // Title for confirm dialog
                                            )}
                                            className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

        </div>
    );
};
