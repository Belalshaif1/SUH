/**
 * @file components/dashboard/tabs/AnnouncementsTab.tsx
 * @description Renders the Announcements management view.
 * It features scope-based badges and premium academic card styling.
 */

import React from 'react'; // React library
import { useLanguage } from '@/contexts/LanguageContext'; // For internationalization
import { Button } from '@/components/ui/button'; // Reusable UI button
import { Card, CardContent } from '@/components/ui/card'; // Reusable UI card
import { Plus, Edit, Trash2, Pin, Megaphone, Globe, Building2, BookOpen } from 'lucide-react'; // Icons for varying scopes
import { Announcement } from '@/types/dashboard'; // Type safety

/**
 * Props for AnnouncementsTab
 */
interface AnnouncementsTabProps {
    announcements: Announcement[]; // List of announcement records
    onAdd: () => void; // Trigger for add modal
    onEdit: (item: Announcement) => void; // Trigger for edit modal
    onDelete: (id: string, title: string) => void; // Handle deletion
    processData: (data: any[]) => any[]; // Logic for sorting/pinning
    role?: string;
    canAdd?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
}

export const AnnouncementsTab: React.FC<AnnouncementsTabProps> = ({
    announcements, onAdd, onEdit, onDelete, processData, role, canAdd = false, canEdit = false, canDelete = false
}) => {
    const { t, language } = useLanguage(); // User's language preference

    // Prepare data (logic extracted to hook but invoked here for clean render)
    const processedList = processData(announcements);

    /**
     * getScopeBadge - Returns a visual badge based on the announcement scope.
     * This improves legibility for administrators.
     */
    const getScopeBadge = (scope: string) => {
        switch (scope) {
            case 'global':
                return <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider">
                    <Globe className="h-3 w-3" /> {language === 'ar' ? 'عام' : 'Global'}
                </div>;
            case 'university':
                return <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/5 text-primary/60 text-[10px] font-black uppercase tracking-wider">
                    <Building2 className="h-3 w-3" /> {language === 'ar' ? 'جامعة' : 'University'}
                </div>;
            case 'college':
                return <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-gold/10 text-gold text-[10px] font-black uppercase tracking-wider">
                    <BookOpen className="h-3 w-3" /> {language === 'ar' ? 'كلية' : 'College'}
                </div>;
            default:
                return null; // For case safety
        }
    };

    return (
        <div className="p-6"> {/* Main layout container */}

            {/* --- Section Header --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-2xl font-black text-primary mb-1">{t('dashboard.manage_announcements')}</h2>
                    <p className="text-sm text-primary/40 font-bold">
                        {language === 'ar' ? 'نشر الإعلانات والأخبار الأكاديمية' : 'Publish academic news and announcements'}
                    </p>
                </div>
                {canAdd && (
                <Button onClick={() => onAdd()} className="h-12 px-6 rounded-xl bg-gold text-white font-bold shadow-xl shadow-gold/20 transition-all hover:scale-105 active:scale-95">
                    <Plus className="h-5 w-5 me-2" /> {t('common.add')}
                </Button>
                )}
            </div>

            {/* --- Announcements List --- */}
            <div className="space-y-4"> {/* Vertical list for better reading of titles */}
                {processedList.map((a: Announcement) => (
                    <Card key={a.id} className="card-premium group hover:translate-x-1 transition-all duration-300 border-none shadow-md overflow-hidden">
                        <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 gap-4">
                            <div className="flex items-start gap-4 flex-1">
                                {/* Visual identification */}
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${a.is_pinned ? 'bg-gold/10 text-gold' : 'bg-primary/5 text-primary/20'}`}>
                                    {a.is_pinned ? <Pin className="h-6 w-6" /> : <Megaphone className="h-6 w-6" />}
                                </div>

                                <div className="flex flex-col gap-1 min-w-0">
                                    {/* Title and Scope Row */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-black text-primary text-lg truncate">
                                            {language === 'ar' ? a.title_ar : (a.title_en || a.title_ar)}
                                        </span>
                                        {getScopeBadge(a.scope)}
                                    </div>

                                    {/* Metadata Row (Date & Creator) */}
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[10px] font-bold text-primary/20 uppercase tracking-widest">
                                            {new Date(a.created_at || 0).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US')}
                                        </span>
                                        <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest italic">
                                            {language === 'ar' ? 'آخر تحديث' : 'LAST UPDATE'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Interaction Row */}
                            <div className="flex gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0">
                                {canEdit && (
                                <Button variant="ghost" size="icon" onClick={() => onEdit(a)} className="h-10 w-10 rounded-xl text-primary/40 hover:text-primary hover:bg-primary/5">
                                    <Edit className="h-4 w-4" />
                                </Button>
                                )}
                                {canDelete && (
                                    <Button variant="ghost" size="icon" onClick={() => onDelete(a.id, language === 'ar' ? a.title_ar : (a.title_en || a.title_ar))} className="h-10 w-10 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50">
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
