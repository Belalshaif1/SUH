/**
 * @file src/components/dashboard/tabs/JobsTab.tsx
 * @description Renders the Job Postings management section of the Admin Dashboard.
 *              Displays job title, application deadline, and pin status.
 *              Also provides a dedicated "View Applicants" button via onViewApplications.
 */

import React from 'react';                               // React for JSX and FC type
import { useLanguage } from '@/contexts/LanguageContext'; // Translation and language direction
import { Button }      from '@/components/ui/button';    // Shadcn button
import { Card, CardContent } from '@/components/ui/card'; // Shadcn card layout
import { Plus, Edit, Trash2, Pin, Briefcase, Users } from 'lucide-react'; // Icon set
import { Job } from '@/types/dashboard';                  // TypeScript entity interface

// ─── Props ────────────────────────────────────────────────────────────────

/** All externally-controlled callbacks and data for the Jobs tab */
interface JobsTabProps {
    jobs: Job[];                                            // The pre-filtered list of job postings
    onAdd: () => void;                                      // Opens the Add Job dialog
    onEdit: (item: Job) => void;                            // Opens Edit pre-filled with this job
    onDelete: (id: string, title: string) => void;          // Arms the delete confirmation dialog
    onViewApplications: (id: string) => void;               // Opens the JobApplicationsViewer for this job's UUID
    processData: (data: any[]) => any[];                    // Sort/pin utility from useDashboardData
    canAdd?: boolean;    // Show the Add button
    canEdit?: boolean;   // Show Edit buttons on cards
    canDelete?: boolean; // Show Delete buttons on cards
}

// ─── Component ────────────────────────────────────────────────────────────

export const JobsTab: React.FC<JobsTabProps> = ({
    jobs, onAdd, onEdit, onDelete, onViewApplications, processData,
    canAdd = false, canEdit = false, canDelete = false
}) => {
    const { t, language } = useLanguage(); // t() for labels, language for title and date format

    // Apply pinning and sort order before rendering
    const processedList = processData(jobs);

    return (
        <div className="p-6"> {/* Standard section padding */}

            {/* ── Section header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    {/* Section title */}
                    <h2 className="text-2xl font-black text-primary mb-1">
                        {t('dashboard.manage_jobs')} {/* "إدارة الوظائف" / "Manage Jobs" */}
                    </h2>
                    {/* Descriptive subtitle */}
                    <p className="text-sm text-primary/40 font-bold">
                        {language === 'ar'
                            ? 'نشر وإدارة التوظيف الأكاديمي'
                            : 'Management of academic recruitment and job postings'
                        }
                    </p>
                </div>

                {/* Add button — only shown when canAdd is true */}
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

            {/* ── Job cards grid ── Two-column layout for larger card footprint */}
            <div className="grid gap-6 md:grid-cols-2">
                {processedList.map((j: Job) => (
                    <Card
                        key={j.id} // Stable React key using the job's UUID
                        className="card-premium group hover:scale-[1.01] transition-all duration-300 border-none shadow-lg overflow-hidden flex flex-col"
                    >
                        <CardContent className="p-8 flex-1">

                            {/* ── Card header: icon + title + deadline ── */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    {/* Pinned = gold pin badge, not-pinned = briefcase icon */}
                                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${
                                        j.is_pinned ? 'bg-gold/10 text-gold' : 'bg-primary/5 text-primary/20'
                                    }`}>
                                        {j.is_pinned
                                            ? <Pin className="h-7 w-7" />       // Gold pin for featured jobs
                                            : <Briefcase className="h-7 w-7" /> // Default briefcase icon
                                        }
                                    </div>

                                    {/* Job title and deadline */}
                                    <div>
                                        {/* Job title — Arabic or English based on current language */}
                                        <h3 className="text-xl font-black text-primary leading-tight">
                                            {language === 'ar' ? j.title_ar : (j.title_en || j.title_ar)}
                                        </h3>
                                        {/* Application deadline with localised date format */}
                                        <p className="text-[11px] font-black text-primary/30 uppercase tracking-[0.2em] mt-1">
                                            {language === 'ar' ? 'الموعد النهائي: ' : 'Deadline: '}
                                            {j.deadline
                                                ? new Date(j.deadline).toLocaleDateString(
                                                    language === 'ar' ? 'ar-IQ' : 'en-US' // Localised date format
                                                )
                                                : (language === 'ar' ? 'غير محدد' : 'N/A') // Fallback if no deadline set
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* ── Card action toolbar ── */}
                            {/* Uses `mt-auto` to push this section to the bottom of flex column cards */}
                            <div className="flex flex-wrap items-center gap-3 mt-auto pt-6 border-t border-slate-50">

                                {/* "View Applicants" primary action — always visible regardless of canEdit/canDelete */}
                                <Button
                                    onClick={() => onViewApplications(j.id)} // Pass job UUID to open the applicants viewer
                                    className="flex-1 h-11 rounded-xl bg-primary/5 text-primary font-black hover:bg-primary hover:text-white transition-all gap-2"
                                >
                                    <Users className="h-4 w-4" /> {/* People icon for applicants */}
                                    {language === 'ar' ? 'عرض المتقدمين' : 'Applicants'}
                                </Button>

                                {/* Secondary CRUD actions */}
                                <div className="flex gap-2">
                                    {/* Edit button — conditionally rendered by canEdit */}
                                    {canEdit && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(j)} // Pass full job object for form pre-filling
                                            className="h-11 w-11 rounded-xl text-primary/40 hover:text-primary hover:bg-primary/5"
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
                                                j.id, // UUID for the DELETE API call
                                                language === 'ar' ? j.title_ar : (j.title_en || j.title_ar) // Title for confirm dialog
                                            )}
                                            className="h-11 w-11 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50"
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
