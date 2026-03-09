/**
 * @file components/dashboard/DashboardHeader.tsx
 * @description Renders the top navigation bar and the visual welcome banner for the Admin Dashboard.
 * Implements premium academic aesthetics and responsive layout.
 */

import React from 'react'; // React library for UI
import { useLanguage } from '@/contexts/LanguageContext'; // For AR/EN support
import { useAuth } from '@/contexts/AuthContext'; // For user data display
import { Button } from '@/components/ui/button'; // Standardized button
import { LogOut, Shield } from 'lucide-react'; // Visual assets

/**
 * Props for DashboardHeader
 */
interface DashboardHeaderProps {
    onLogout: () => void; // Command to handle user logout
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onLogout }) => {
    const { t, language } = useLanguage(); // User language preference
    const { user, userRole } = useAuth(); // Current logged-in user details

    return (
        <div className="space-y-0"> {/* Parent container with zero spacing to maintain tight header/banner bond */}

            {/* --- Top Navigation Bar --- */}
            <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Logo / Brand Identification */}
                    <div className="h-10 w-10 rounded-xl bg-gold flex items-center justify-center text-white shadow-lg shadow-gold/20">
                        <Shield className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-primary leading-none">{t('nav.dashboard')}</h1>
                        <span className="text-[10px] font-bold text-primary/20 uppercase tracking-widest leading-none">
                            {language === 'ar' ? 'البوابة الإدارية المتكاملة' : 'Integrated Administrative Portal'}
                        </span>
                    </div>
                </div>

                {/* User Profile and Exit Controls */}
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end me-2">
                        <span className="text-sm font-black text-primary leading-none">{user?.full_name}</span>
                        <span className="text-[10px] font-bold text-primary/30 uppercase tracking-widest leading-none mt-1">
                            {userRole?.role?.replace('_', ' ')}
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onLogout}
                        className="h-12 w-12 rounded-2xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-all active:scale-90"
                    >
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            {/* --- Visual Welcome Banner --- */}
            <div className="px-6 py-8">
                <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-10 text-white shadow-2xl shadow-primary/20">
                    {/* Decorative Background Elements (Glassmorphic) */}
                    <div className="absolute top-0 right-0 h-64 w-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 left-0 h-48 w-48 bg-gold/5 rounded-full -ml-24 -mb-24 blur-3xl" />

                    <div className="relative z-10 max-w-2xl">
                        {/* Localized Greeting Cluster */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-px w-8 bg-gold/50" />
                            <span className="text-xs font-black uppercase tracking-[0.3em] text-gold/80">
                                {language === 'ar' ? 'مرحباً بك مجدداً' : 'WELCOME BACK'}
                            </span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
                            {language === 'ar' ? `أهلاً بك، ${user?.full_name}` : `Hello, ${user?.full_name}`}
                        </h2>

                        <p className="text-white/60 font-bold leading-relaxed max-w-lg">
                            {language === 'ar'
                                ? 'تحكم في كافة العمليات الأكاديمية والمؤسسات من لوحة قيادة واحدة ذكية ومتكاملة.'
                                : 'Control all academic operations and institutions from a single, smart, and integrated dashboard.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
