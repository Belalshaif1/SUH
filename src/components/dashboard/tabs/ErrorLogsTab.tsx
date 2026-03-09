/**
 * @file components/dashboard/tabs/ErrorLogsTab.tsx
 * @description Provides a diagnostic interface for Super Administrators.
 * Displays system-level errors with stack traces for debugging.
 */

import React from 'react'; // React library for components
import { useLanguage } from '@/contexts/LanguageContext'; // Global translation / localization context
import { Card, CardContent } from '@/components/ui/card'; // Card layout container
import { AlertTriangle, ShieldCheck, Users } from 'lucide-react'; // Visual assets
import { ErrorLog } from '@/types/dashboard'; // Type definitions for data safety

/**
 * Props for ErrorLogsTab
 */
interface ErrorLogsTabProps {
    errorLogs: ErrorLog[]; // Data source: list of system error logs
}

export const ErrorLogsTab: React.FC<ErrorLogsTabProps> = ({ errorLogs }) => {
    const { language } = useLanguage(); // User's preference (ar/en)

    return (
        <div className="p-6"> {/* Unified padding for consistency with other tabs */}

            {/* --- Section Header --- */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    {/* Main Title - Highlighted in red to emphasize importance/alert state */}
                    <h2 className="text-2xl font-black text-red-500 mb-1 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6 text-red-500" />
                        </div>
                        {language === 'ar' ? 'سجل الأخطاء النظامية' : 'System Error Logs'}
                    </h2>
                    {/* Subtitle - Informative hint for admins */}
                    <p className="text-sm text-primary/40 font-bold">
                        {language === 'ar' ? 'مراقبة أخطاء النظام والبرمجيات' : 'Monitor system and software errors for maintenance'}
                    </p>
                </div>
            </div>

            {/* --- Content Logic (Empty State vs List) --- */}
            {errorLogs.length === 0 ? (
                // Happy State: No errors detected
                <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                    <ShieldCheck className="h-20 w-20 text-green-500/10 mx-auto mb-6" />
                    <p className="text-green-600/40 text-xl font-black">
                        {language === 'ar' ? 'النظام يعمل بشكل مثالي' : 'System is running perfectly'}
                    </p>
                </div>
            ) : (
                // List State: Displaying individual log entries
                <div className="space-y-4">
                    {errorLogs.map((log: ErrorLog) => (
                        <Card key={log.id} className="card-premium border-none border-s-4 border-s-red-500 shadow-lg overflow-hidden group hover:translate-x-1 transition-all">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start gap-4 mb-4">
                                    <div className="flex-1">
                                        {/* Error Message - Key identifier */}
                                        <span className="font-black text-red-600 text-lg">{log.message}</span>
                                        <div className="flex items-center gap-3 mt-1">
                                            {/* Log Source (Client vs Server) */}
                                            <span className="px-2 py-0.5 rounded-md bg-red-50 text-[10px] font-black text-red-500 uppercase tracking-wider">
                                                {log.source || 'CLIENT'}
                                            </span>
                                            {/* Timestamp of occurrence */}
                                            <span className="text-[10px] font-bold text-primary/20 uppercase tracking-widest">
                                                {new Date(log.created_at).toLocaleString(language === 'ar' ? 'ar-IQ' : 'en-US')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {/* Code Block for Stack Trace - Mono font for readability */}
                                <div className="bg-slate-900 p-4 rounded-xl font-mono text-[11px] text-red-400 overflow-auto max-h-40 whitespace-pre-wrap shadow-inner border border-white/5 selection:bg-red-500 selection:text-white">
                                    {log.stack_trace || 'No detailed stack trace available'}
                                </div>
                                {/* Attribution Metadata */}
                                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap justify-between items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-3 w-3 text-primary/20" />
                                        <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest leading-none">
                                            {log.user_name ? `${log.user_name}` : (language === 'ar' ? 'مستخدم مجهول' : 'Anonymous User')}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-bold text-primary/20 uppercase tracking-widest">{log.user_id}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
