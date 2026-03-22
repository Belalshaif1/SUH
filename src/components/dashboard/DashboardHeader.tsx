/**
 * @file src/components/dashboard/DashboardHeader.tsx
 * @description Renders the sticky top navigation bar and the visual welcome banner
 *              at the top of the Admin Dashboard page.
 *              - The nav bar shows the shield brand logo, dashboard title, username, role, and logout.
 *              - The banner is a large decorative gradient block greeting the logged-in user.
 */

import React from 'react';                               // React for JSX and FC type
import { useLanguage } from '@/contexts/LanguageContext'; // Translation + language direction
import { useAuth }     from '@/contexts/AuthContext';     // User's name and role for the banner
import { Button }      from '@/components/ui/button';    // Shadcn button for logout
import { LogOut, Shield } from 'lucide-react';           // Shield for brand logo, LogOut for logout button

// ─── Props ────────────────────────────────────────────────────────────────

/** Props for the DashboardHeader component */
interface DashboardHeaderProps {
    onLogout: () => void; // Callback that logs the user out and redirects to /login
}

// ─── Component ────────────────────────────────────────────────────────────

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onLogout }) => {
    const { t, language } = useLanguage(); // t() for translated nav title, language for inline checks
    const { user, userRole } = useAuth();  // user.full_name for the banner, userRole.role for subtitle

    return (
        <div className="space-y-0"> {/* Zero spacing keeps the nav and banner flush with each other */}

            {/* ── Sticky navigation bar ── */}
            <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 px-6 h-20 flex items-center justify-between">
                {/*
                  * sticky top-0 z-50 = stays at the top of the viewport while scrolling
                  * backdrop-blur-xl = frosted glass effect when content scrolls underneath
                  * h-20 = 80px tall header to provide enough tap area
                */}

                {/* Left: brand shield icon + "Dashboard" title */}
                <div className="flex items-center gap-4">
                    {/* Gold shield badge — brand identity mark for the admin portal */}
                    <div className="h-10 w-10 rounded-xl bg-gold flex items-center justify-center text-white shadow-lg shadow-gold/20">
                        <Shield className="h-6 w-6" /> {/* Shield icon represents the admin role */}
                    </div>

                    {/* Title text block */}
                    <div>
                        {/* Main dashboard title — translated via the i18n context */}
                        <h1 className="text-xl font-black text-primary leading-none">
                            {t('nav.dashboard')} {/* "لوحة التحكم" / "Dashboard" */}
                        </h1>
                        {/* Decorative subtitle — less prominent, provides context */}
                        <span className="text-[10px] font-bold text-primary/20 uppercase tracking-widest leading-none">
                            {language === 'ar'
                                ? 'البوابة الإدارية المتكاملة'
                                : 'Integrated Administrative Portal'
                            }
                        </span>
                    </div>
                </div>

                {/* Right: user name + role + logout button */}
                <div className="flex items-center gap-4">
                    {/* Name and role block — hidden on small screens to save space */}
                    <div className="hidden md:flex flex-col items-end me-2">
                        {/* User's full name — retrieved from AuthContext */}
                        <span className="text-sm font-black text-primary leading-none">
                            {user?.full_name} {/* e.g. "Ahmad Al-Rasheed" */}
                        </span>
                        {/* Role slug — replace underscores with spaces for readability */}
                        <span className="text-[10px] font-bold text-primary/30 uppercase tracking-widest leading-none mt-1">
                            {userRole?.role?.replace('_', ' ')} {/* e.g. "super admin" */}
                        </span>
                    </div>

                    {/* Logout button — red to visually distinguish it as a destructive action */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onLogout} // Delegates to the logout logic in Dashboard.tsx
                        className="h-12 w-12 rounded-2xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-all active:scale-90"
                        // active:scale-90 = satisfying press feedback animation
                    >
                        <LogOut className="h-5 w-5" /> {/* Standard log-out arrow icon */}
                    </Button>
                </div>
            </header>

            {/* ── Welcome banner ── */}
            <div className="px-6 py-8"> {/* Padding gives the banner breathing room from the nav bar */}
                {/* Gradient card with large rounded corners for a premium academic feel */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-10 text-white shadow-2xl shadow-primary/20">

                    {/* Background decorative blobs — purely visual, no interactivity */}
                    <div className="absolute top-0 right-0 h-64 w-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
                    {/* animate-pulse makes this blob slowly fade in and out for a subtle living effect */}
                    <div className="absolute bottom-0 left-0 h-48 w-48 bg-gold/5 rounded-full -ml-24 -mb-24 blur-3xl" />

                    {/* Text content — positioned above the blobs via z-10 */}
                    <div className="relative z-10 max-w-2xl">

                        {/* "Welcome back" micro-label with gold decorative line */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-px w-8 bg-gold/50" /> {/* Thin horizontal gold rule */}
                            <span className="text-xs font-black uppercase tracking-[0.3em] text-gold/80">
                                {language === 'ar' ? 'مرحباً بك مجدداً' : 'WELCOME BACK'}
                            </span>
                        </div>

                        {/* Large personalised greeting with the logged-in user's name */}
                        <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
                            {language === 'ar'
                                ? `أهلاً بك، ${user?.full_name}`
                                : `Hello, ${user?.full_name}`
                            }
                        </h2>

                        {/* Descriptive tagline — explains what the dashboard does */}
                        <p className="text-white/60 font-bold leading-relaxed max-w-lg">
                            {language === 'ar'
                                ? 'تحكم في كافة العمليات الأكاديمية والمؤسسات من لوحة قيادة واحدة ذكية ومتكاملة.'
                                : 'Control all academic operations and institutions from a single, smart, and integrated dashboard.'
                            }
                        </p>

                    </div>
                </div>
            </div>

        </div>
    );
};
