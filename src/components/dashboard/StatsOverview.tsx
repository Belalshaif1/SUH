/**
 * @file src/components/dashboard/StatsOverview.tsx
 * @description Renders a grid of numeric statistics at the top of the Admin Dashboard.
 *              Dynamically shows only the cards the current user is authorised to see,
 *              using role and hasPermission checks from the AuthContext.
 */

import React from 'react';                               // React for JSX and FC type
import { useLanguage } from '@/contexts/LanguageContext'; // Translation and language direction
import { Card, CardContent } from '@/components/ui/card'; // Shadcn card layout
import { DashboardStats } from '@/types/dashboard';        // TypeScript stats interface
import {
    Building2, BookOpen, FileText, GraduationCap, Users
} from 'lucide-react';                                    // One icon per stat category

// ─── Props ────────────────────────────────────────────────────────────────

/** Props for the StatsOverview component */
interface StatsOverviewProps {
    stats: DashboardStats;              // Numeric totals (from useDashboardData)
    role: string | undefined;           // Current user's role string for role-based visibility
    hasPermission: (p: string) => boolean; // Permission check function from AuthContext
}

// ─── Component ────────────────────────────────────────────────────────────

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, role, hasPermission }) => {
    const { t, language } = useLanguage(); // t() for translated labels, language for inline conditionals

    // ── Stat card configuration ────────────────────────────────────────

    /**
     * statCards — declarative array defining every possible stat card.
     * Each item specifies an icon, label, value, and the visibility condition.
     * The array is filtered before rendering so only permitted cards are shown.
     */
    const statCards = [
        {
            key:   'users',             // Unique key for React rendering
            icon:  Users,               // Lucide icon component (used as JSX element below)
            label: language === 'ar' ? 'المستخدمين' : 'Users', // Localised label
            value: stats.users,         // Numeric count from the server
            // Only visible to roles that manage users AND have the manage_users permission
            show: (
                role === 'super_admin' ||
                role === 'university_admin' ||
                role === 'college_admin'
            ) && hasPermission('manage_users'),
        },
        {
            key:   'universities',
            icon:  Building2,
            label: t('home.stats.universities'),    // Translated from the i18n resource file
            value: stats.universities,
            // Only visible to super/uni admins with the university management permission
            show: (
                role === 'super_admin' ||
                role === 'university_admin'
            ) && hasPermission('manage_universities'),
        },
        {
            key:   'colleges',
            icon:  BookOpen,
            label: t('home.stats.colleges'),
            value: stats.colleges,
            // Hidden for department admins since they can't see college data
            show: role !== 'department_admin' && hasPermission('manage_colleges'),
        },
        {
            key:   'departments',
            icon:  FileText,
            label: t('home.stats.departments'),
            value: stats.departments,
            show: hasPermission('manage_departments'), // Visible to any role with the permission
        },
        {
            key:   'graduates',
            icon:  GraduationCap,
            label: t('home.stats.graduates'),
            value: stats.graduates,
            show: hasPermission('manage_graduates'),
        },
        {
            key:   'research',
            icon:  FileText,               // Shares the FileText icon with departments
            label: t('home.stats.research'),
            value: stats.research,
            show: hasPermission('manage_research'),
        },
    ].filter(s => s.show); // Remove all cards where `show` is false — RBAC enforcement

    return (
        <div className="px-6 pb-8"> {/* Horizontal padding aligns with DashboardHeader below the banner */}

            {/* Responsive grid: 1 col on mobile → 2 on tablet → 3 on medium → up to 6 on xl */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {statCards.map(card => (
                    <Card
                        key={card.key} // Stable React key from the card's key string
                        className="card-premium group hover:scale-[1.05] transition-all duration-300 border-none shadow-xl shadow-primary/5 bg-white/50 backdrop-blur-sm"
                    >
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center">

                            {/* Icon badge — muted default colour, turns solid white on hover */}
                            <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary/40 group-hover:bg-primary group-hover:text-white transition-all duration-300 mb-3">
                                {/* card.icon is a Lucide component — render it as a JSX element */}
                                <card.icon className="h-6 w-6" />
                            </div>

                            {/* Stat label — uppercase tracking for a premium data-display feel */}
                            <span className="text-[10px] font-black text-primary/30 uppercase tracking-[0.2em]">
                                {card.label} {/* e.g. "Universities", "Graduates" */}
                            </span>

                            {/* Numeric value — large and bold as the primary information */}
                            <span className="text-2xl font-black text-primary mt-1">
                                {card.value.toLocaleString()} {/* Formats with thousands separators */}
                            </span>

                        </CardContent>
                    </Card>
                ))}
            </div>

        </div>
    );
};
