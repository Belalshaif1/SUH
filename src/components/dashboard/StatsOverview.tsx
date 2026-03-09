/**
 * @file components/dashboard/StatsOverview.tsx
 * @description Renders a grid of numeric statistics for the Admin Dashboard.
 * Dynamically displays cards based on user permissions and academic context.
 */

import React from 'react'; // React library for UI
import { useLanguage } from '@/contexts/LanguageContext'; // For internationalization
import { Card, CardContent } from '@/components/ui/card'; // UI Card component
import { DashboardStats } from '@/types/dashboard'; // Type definitions
import { Building2, BookOpen, FileText, GraduationCap, Users } from 'lucide-react'; // Icons

/**
 * Props for StatsOverview
 */
interface StatsOverviewProps {
    stats: DashboardStats; // The numeric data for the cards
    role: string | undefined; // Current user role for conditional display
    hasPermission: (p: string) => boolean; // Permission check utility
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, role, hasPermission }) => {
    const { t, language } = useLanguage(); // User localization preference

    /**
     * statCards - Configuration array for the statistics display
     * Defines which cards should be shown based on RBAC rules.
     */
    const statCards = [
        {
            key: 'users',
            icon: Users,
            label: language === 'ar' ? 'المستخدمين' : 'Users',
            value: stats.users,
            show: (role === 'super_admin' || role === 'university_admin' || role === 'college_admin') && hasPermission('manage_users')
        },
        {
            key: 'universities',
            icon: Building2,
            label: t('home.stats.universities'),
            value: stats.universities,
            show: (role === 'super_admin' || role === 'university_admin') && hasPermission('manage_universities')
        },
        {
            key: 'colleges',
            icon: BookOpen,
            label: t('home.stats.colleges'),
            value: stats.colleges,
            show: (role !== 'department_admin') && hasPermission('manage_colleges')
        },
        {
            key: 'departments',
            icon: FileText,
            label: t('home.stats.departments'),
            value: stats.departments,
            show: hasPermission('manage_departments')
        },
        {
            key: 'graduates',
            icon: GraduationCap,
            label: t('home.stats.graduates'),
            value: stats.graduates,
            show: hasPermission('manage_graduates')
        },
        {
            key: 'research',
            icon: FileText,
            label: t('home.stats.research'),
            value: stats.research,
            show: hasPermission('manage_research')
        },
    ].filter(s => s.show); // Filtering ensures the user only sees what they are authorized to manage

    return (
        <div className="px-6 pb-8">
            {/* Grid layout with responsive column counts (1 on mobile, 2 on tablet, up to 6 on desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {statCards.map((card) => (
                    <Card key={card.key} className="card-premium group hover:scale-[1.05] transition-all duration-300 border-none shadow-xl shadow-primary/5 bg-white/50 backdrop-blur-sm">
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                            {/* Visual Icon Badge */}
                            <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary/40 group-hover:bg-primary group-hover:text-white transition-all duration-300 mb-3">
                                <card.icon className="h-6 w-6" />
                            </div>
                            {/* Statistic Label */}
                            <span className="text-[10px] font-black text-primary/30 uppercase tracking-[0.2em]">
                                {card.label}
                            </span>
                            {/* Statistic Numeric Value */}
                            <span className="text-2xl font-black text-primary mt-1">
                                {card.value.toLocaleString()}
                            </span>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};
