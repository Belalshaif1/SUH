/**
 * @file components/dashboard/tabs/ResearchTab.tsx
 * @description Renders the Research papers management view.
 * Displays academic papers with PDF links and author details.
 */

import React from 'react'; // React library for components
import { useLanguage } from '@/contexts/LanguageContext'; // Translation context
import { Button } from '@/components/ui/button'; // Reusable button
import { Card, CardContent } from '@/components/ui/card'; // Card layout system
import { Plus, Edit, Trash2, FileText, Pin } from 'lucide-react'; // Assets for visualization
import { Research } from '@/types/dashboard'; // Type safety

/**
 * Props for ResearchTab
 */
interface ResearchTabProps {
    research: Research[]; // Array of research paper records
    onAdd: () => void; // Command to open add dialog
    onEdit: (item: Research) => void; // Command to open edit dialog
    onDelete: (id: string, name: string) => void; // Logic to remove a record
    processData: (data: any[]) => any[]; // Logic to sort/prioritize data
    canAdd?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
}

export const ResearchTab: React.FC<ResearchTabProps> = ({
    research, onAdd, onEdit, onDelete, processData, canAdd = false, canEdit = false, canDelete = false
}) => {
    const { t, language } = useLanguage(); // User's interface language

    // Pre-process research data (apply pinning and sort rules)
    const processedList = processData(research);

    return (
        <div className="p-6"> {/* Padding for standard admin module alignment */}

            {/* --- Section Header --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-2xl font-black text-primary mb-1">{t('dashboard.manage_research')}</h2>
                    <p className="text-sm text-primary/40 font-bold">
                        {language === 'ar' ? 'إدارة ونشر البحوث العلمية والمقالات' : 'Manage and publish scientific research and articles'}
                    </p>
                </div>
                {canAdd && (
                <Button onClick={onAdd} className="h-12 px-6 rounded-xl bg-gold text-white font-bold shadow-xl shadow-gold/20 transition-all hover:scale-105 active:scale-95">
                    <Plus className="h-5 w-5 me-2" /> {t('common.add')}
                </Button>
                )}
            </div>

            {/* --- Research List Grid --- */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {processedList.map((r: Research) => (
                    <Card key={r.id} className="card-premium group hover:scale-[1.02] transition-all duration-300 border-none shadow-lg">
                        <CardContent className="flex items-center justify-between p-6">
                            <div className="flex items-center gap-4">
                                {/* Visual Category Icon */}
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${r.is_pinned ? 'bg-gold/10 text-gold' : 'bg-primary/5 text-primary/20'}`}>
                                    {r.is_pinned ? <Pin className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                                </div>

                                <div className="flex flex-col min-w-0">
                                    {/* Research Title - Localized */}
                                    <span className="font-black text-primary leading-tight truncate">
                                        {language === 'ar' ? r.title_ar : (r.title_en || r.title_ar)}
                                    </span>
                                    {/* Author Name Detail */}
                                    <span className="text-[10px] font-bold text-primary/20 uppercase tracking-widest mt-0.5 truncate">
                                        {language === 'ar' ? 'بواسطة: ' : 'BY: '} {r.author_name}
                                    </span>
                                </div>
                            </div>

                            {/* Interaction Row */}
                            <div className="flex gap-2">
                                {canEdit && (
                                <Button variant="ghost" size="icon" onClick={() => onEdit(r)} className="h-10 w-10 rounded-xl text-primary/40 hover:text-primary hover:bg-primary/5">
                                    <Edit className="h-4 w-4" />
                                </Button>
                                )}
                                {canDelete && (
                                <Button variant="ghost" size="icon" onClick={() => onDelete(r.id, language === 'ar' ? r.title_ar : (r.title_en || r.title_ar))} className="h-10 w-10 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50">
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
