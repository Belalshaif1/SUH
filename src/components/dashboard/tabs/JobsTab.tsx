/**
 * @file components/dashboard/tabs/JobsTab.tsx
 * @description Renders the Jobs management section.
 * It includes special functionality to view and manage job applications.
 */

import React from 'react'; // React library for UI logic
import { useLanguage } from '@/contexts/LanguageContext'; // Global translation support
import { Button } from '@/components/ui/button'; // Standardized button UI
import { Card, CardContent } from '@/components/ui/card'; // Card layout system
import { Plus, Edit, Trash2, Pin, Briefcase, Users } from 'lucide-react'; // Assets
import { Job } from '@/types/dashboard'; // Type safety

/**
 * Props for the JobsTab component
 */
interface JobsTabProps {
    jobs: Job[]; // List of available job objects
    onAdd: () => void; // Command to open the creation dialog
    onEdit: (item: Job) => void; // Command to open the edit dialog
    onDelete: (id: string, name: string) => void; // Command to delete a job
    onViewApplications: (id: string) => void; // Specialized command for viewing applicants
    processData: (data: any[]) => any[]; // Logic to apply sort/pin orders
}

export const JobsTab: React.FC<JobsTabProps> = ({
    jobs, onAdd, onEdit, onDelete, onViewApplications, processData
}) => {
    const { t, language } = useLanguage(); // User's preference

    // Process data based on business rules (extracted but invoked locally)
    const processedList = processData(jobs);

    return (
        <div className="p-6"> {/* Standardized padding for admin modules */}

            {/* --- Section Header --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-2xl font-black text-primary mb-1">{t('dashboard.manage_jobs')}</h2>
                    <p className="text-sm text-primary/40 font-bold">
                        {language === 'ar' ? 'نشر وإدارة التوظيف الأكاديمي' : 'Management of academic recruitment and job postings'}
                    </p>
                </div>
                <Button onClick={onAdd} className="h-12 px-6 rounded-xl bg-gold text-white font-bold shadow-xl shadow-gold/20 transition-all hover:scale-105 active:scale-95">
                    <Plus className="h-5 w-5 me-2" /> {t('common.add')}
                </Button>
            </div>

            {/* --- Jobs Grid --- */}
            <div className="grid gap-6 md:grid-cols-2"> {/* Two-column layout for larger card content */}
                {processedList.map((j: Job) => (
                    <Card key={j.id} className="card-premium group hover:scale-[1.01] transition-all duration-300 border-none shadow-lg overflow-hidden flex flex-col">
                        <CardContent className="p-8 flex-1">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    {/* Visual ID Badge */}
                                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${j.is_pinned ? 'bg-gold/10 text-gold' : 'bg-primary/5 text-primary/20'}`}>
                                        {j.is_pinned ? <Pin className="h-7 w-7" /> : <Briefcase className="h-7 w-7" />}
                                    </div>
                                    <div>
                                        {/* Job Title */}
                                        <h3 className="text-xl font-black text-primary leading-tight">
                                            {language === 'ar' ? j.title_ar : (j.title_en || j.title_ar)}
                                        </h3>
                                        {/* Deadline Metadata */}
                                        <p className="text-[11px] font-black text-primary/30 uppercase tracking-[0.2em] mt-1">
                                            {language === 'ar' ? 'الموعد النهائي: ' : 'Deadline: '}
                                            {j.deadline ? new Date(j.deadline).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US') : (language === 'ar' ? 'غير محدد' : 'N/A')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Toolbar */}
                            <div className="flex flex-wrap items-center gap-3 mt-auto pt-6 border-t border-slate-50">
                                {/* View Applicants - High priority button with icon */}
                                <Button
                                    onClick={() => onViewApplications(j.id)}
                                    className="flex-1 h-11 rounded-xl bg-primary/5 text-primary font-black hover:bg-primary hover:text-white transition-all gap-2"
                                >
                                    <Users className="h-4 w-4" /> {language === 'ar' ? 'عرض المتقدمين' : 'Applicants'}
                                </Button>

                                {/* Secondary Actions */}
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => onEdit(j)} className="h-11 w-11 rounded-xl text-primary/40 hover:text-primary hover:bg-primary/5">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => onDelete(j.id, language === 'ar' ? j.title_ar : (j.title_en || j.title_ar))} className="h-11 w-11 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};
