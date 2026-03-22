/**
 * @file src/components/dashboard/tabs/AnnouncementsTab.tsx
 * @description Renders the Announcements management section of the Admin Dashboard.
 *              Shows announcement title, scope badge (global/university/college), creation date,
 *              and pinned status. Uses a vertical list layout since titles can be long.
 */

import React from 'react';                               // React for JSX and FC type
import { useLanguage } from '@/contexts/LanguageContext'; // Translation and language direction
import { Button }      from '@/components/ui/button';    // Shadcn button
import { Card, CardContent } from '@/components/ui/card'; // Shadcn card layout
import {
    Plus, Edit, Trash2, Pin, Megaphone, Globe, Building2, BookOpen
} from 'lucide-react';                                    // Icon set — one per scope type
import { Announcement } from '@/types/dashboard';         // TypeScript entity interface

// ─── Props ────────────────────────────────────────────────────────────────

/** All externally-controlled callbacks and data for the Announcements tab */
interface AnnouncementsTabProps {
    announcements: Announcement[];                          // The pre-filtered list of announcements
    onAdd: () => void;                                      // Opens the Add Announcement dialog
    onEdit: (item: Announcement) => void;                   // Opens Edit pre-filled with this announcement
    onDelete: (id: string, title: string) => void;          // Arms the delete confirmation dialog
    processData: (data: any[]) => any[];                    // Sort/pin utility from useDashboardData
    role?: string;                                          // For potential role-specific UI differences
    canAdd?: boolean;    // Show the Add button
    canEdit?: boolean;   // Show Edit buttons on cards
    canDelete?: boolean; // Show Delete buttons on cards
}

// ─── Helper ───────────────────────────────────────────────────────────────

/**
 * getScopeBadge — returns a colour-coded badge JSX element for the announcement scope.
 * Global = blue, University = primary, College = gold.
 * Returns null for unrecognised scopes so no broken UI is shown.
 *
 * @param scope    - The announcement's scope string from the database
 * @param language - Current UI language for the badge label
 */
const getScopeBadge = (scope: string, language: string): JSX.Element | null => {
    switch (scope) {
        case 'global':
            // Blue badge — shown to all users across all entities (system-wide)
            return (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider">
                    <Globe className="h-3 w-3" /> {/* Globe icon represents system-wide scope */}
                    {language === 'ar' ? 'عام' : 'Global'}
                </div>
            );
        case 'university':
            // Muted primary badge — scoped to a single university
            return (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/5 text-primary/60 text-[10px] font-black uppercase tracking-wider">
                    <Building2 className="h-3 w-3" /> {/* Building icon for university scope */}
                    {language === 'ar' ? 'جامعة' : 'University'}
                </div>
            );
        case 'college':
            // Gold badge — scoped to a single college within a university
            return (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-gold/10 text-gold text-[10px] font-black uppercase tracking-wider">
                    <BookOpen className="h-3 w-3" /> {/* Book icon for college scope */}
                    {language === 'ar' ? 'كلية' : 'College'}
                </div>
            );
        default:
            return null; // Unrecognised scope — render nothing rather than broken UI
    }
};

// ─── Component ────────────────────────────────────────────────────────────

export const AnnouncementsTab: React.FC<AnnouncementsTabProps> = ({
    announcements, onAdd, onEdit, onDelete, processData,
    role, canAdd = false, canEdit = false, canDelete = false
}) => {
    const { t, language } = useLanguage(); // t() for labels, language for title/date localisation

    // Apply pinning and sort order before rendering
    const processedList = processData(announcements);

    return (
        <div className="p-6"> {/* Standard section padding */}

            {/* ── Section header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    {/* Section title */}
                    <h2 className="text-2xl font-black text-primary mb-1">
                        {t('dashboard.manage_announcements')} {/* "إدارة الإعلانات" / "Manage Announcements" */}
                    </h2>
                    {/* Contextual subtitle */}
                    <p className="text-sm text-primary/40 font-bold">
                        {language === 'ar'
                            ? 'نشر الإعلانات والأخبار الأكاديمية'
                            : 'Publish academic news and announcements'
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

            {/* ── Announcements vertical list ── */}
            {/* Uses space-y-4 (vertical stacking) instead of a grid because announcement titles can be long */}
            <div className="space-y-4">
                {processedList.map((a: Announcement) => (
                    <Card
                        key={a.id} // Stable React key using the announcement's UUID
                        className="card-premium group hover:translate-x-1 transition-all duration-300 border-none shadow-md overflow-hidden"
                    >
                        <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 gap-4">

                            {/* Left: icon + title + scope badge + date */}
                            <div className="flex items-start gap-4 flex-1">
                                {/* Pinned = gold pin icon, not-pinned = megaphone icon */}
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                                    a.is_pinned ? 'bg-gold/10 text-gold' : 'bg-primary/5 text-primary/20'
                                }`}>
                                    {a.is_pinned
                                        ? <Pin className="h-6 w-6" />       // Gold pin for featured announcements
                                        : <Megaphone className="h-6 w-6" /> // Default megaphone icon
                                    }
                                </div>

                                {/* Title, scope badge, and metadata — min-w-0 enables text truncation */}
                                <div className="flex flex-col gap-1 min-w-0">
                                    {/* Title row with scope badge */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-black text-primary text-lg truncate">
                                            {language === 'ar' ? a.title_ar : (a.title_en || a.title_ar)}
                                        </span>
                                        {/* Colour-coded scope badge (global / university / college) */}
                                        {getScopeBadge(a.scope, language)}
                                    </div>

                                    {/* Metadata: localised creation date */}
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[10px] font-bold text-primary/20 uppercase tracking-widest">
                                            {/* Format date in ar-IQ or en-US locale */}
                                            {new Date(a.created_at || 0).toLocaleDateString(
                                                language === 'ar' ? 'ar-IQ' : 'en-US'
                                            )}
                                        </span>
                                        <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest italic">
                                            {language === 'ar' ? 'آخر تحديث' : 'LAST UPDATE'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Edit and Delete buttons — separated from the text on mobile with a border */}
                            <div className="flex gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0">
                                {/* Edit button — conditionally rendered by canEdit */}
                                {canEdit && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEdit(a)} // Pass full announcement object for form pre-filling
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
                                            a.id, // UUID for the DELETE API call
                                            language === 'ar' ? a.title_ar : (a.title_en || a.title_ar) // Title for confirm dialog
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
