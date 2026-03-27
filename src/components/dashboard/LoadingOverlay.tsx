/**
 * @file src/components/dashboard/LoadingOverlay.tsx
 * @description A reusable, full-screen, motion-blur loading overlay used to block
 *              the UI during critical asynchronous operations (save, delete, sync).
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LoadingOverlayProps {
    isVisible: boolean;    // Whether to show the overlay
    message?:   string;     // Custom message (optional)
    description?: string; // Custom description (optional)
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible, message, description }) => {
    const { language } = useLanguage();
    const isAr = language === 'ar';

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500">
            <div className="relative group">
                {/* Decorative outer glow */}
                <div className="absolute -inset-4 bg-gold/20 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl flex flex-col items-center border border-white/20 min-w-[320px]">
                    {/* Pulsing ring around the loader */}
                    <div className="absolute top-10 flex items-center justify-center">
                        <div className="absolute w-20 h-20 rounded-full border-4 border-gold/10 animate-ping" />
                    </div>

                    {/* Large, gold-coloured spinner */}
                    <Loader2 className="w-16 h-16 text-gold animate-spin mb-8 relative z-10" />
                    
                    {/* Main title message — extra bold and premium */}
                    <h2 className="text-2xl font-black text-primary dark:text-white mb-3 tracking-tight text-center">
                        {message || (isAr ? 'جاري المعالجة...' : 'Processing...')}
                    </h2>
                    
                    {/* Smaller help/status text */}
                    <p className="text-sm font-bold text-primary/40 dark:text-white/40 text-center max-w-[240px] leading-relaxed italic">
                        {description || (isAr 
                            ? 'يرجى الانتظار قليلاً، نعمل على تحديث بياناتك' 
                            : 'Please wait, we are updating your records now'
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
};
