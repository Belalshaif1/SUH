/**
 * @file src/components/dashboard/tabs/ErrorLogsTab.tsx
 * @description Renders the System Error Logs tab — visible to super_admin only.
 *              Displays each error's message, source, stack trace, timestamp, and user context.
 *              Shows a "system healthy" empty state when no errors exist.
 */

import React from 'react';                               // React for JSX and FC type
import { useLanguage } from '@/contexts/LanguageContext'; // Language for date localisation
import { Card, CardContent } from '@/components/ui/card'; // Shadcn card layout
import { AlertTriangle, ShieldCheck, Users } from 'lucide-react'; // Icon set
import { ErrorLog } from '@/types/dashboard';             // TypeScript entity interface

// ─── Props ────────────────────────────────────────────────────────────────

/** Props for ErrorLogsTab — only needs the pre-fetched error logs array */
interface ErrorLogsTabProps {
    errorLogs: ErrorLog[]; // Array of error records fetched from the server (super_admin only)
}

// ─── Component ────────────────────────────────────────────────────────────

export const ErrorLogsTab: React.FC<ErrorLogsTabProps> = ({ errorLogs }) => {
    const { language } = useLanguage(); // Language for date formatting (ar-IQ vs en-US)

    return (
        <div className="p-6"> {/* Standard section padding matches all other tabs */}

            {/* ── Section header ── */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    {/* Red title to emphasize that this section shows errors/alerts */}
                    <h2 className="text-2xl font-black text-red-500 mb-1 flex items-center gap-3">
                        {/* Red triangle icon badge for visual alarm signal */}
                        <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6 text-red-500" />
                        </div>
                        {language === 'ar' ? 'سجل الأخطاء النظامية' : 'System Error Logs'}
                    </h2>
                    {/* Contextual subtitle */}
                    <p className="text-sm text-primary/40 font-bold">
                        {language === 'ar'
                            ? 'مراقبة أخطاء النظام والبرمجيات'
                            : 'Monitor system and software errors for maintenance'
                        }
                    </p>
                </div>
            </div>

            {/* ── Conditional render: empty state OR log list ── */}
            {errorLogs.length === 0 ? (

                // ── "System healthy" empty state ──────────────────────────────
                // Only shown when there are no errors in the database — positive feedback for admins
                <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                    {/* Green shield icon — communicates "all clear" */}
                    <ShieldCheck className="h-20 w-20 text-green-500/10 mx-auto mb-6" />
                    <p className="text-green-600/40 text-xl font-black">
                        {language === 'ar' ? 'النظام يعمل بشكل مثالي' : 'System is running perfectly'}
                    </p>
                </div>

            ) : (

                // ── Error log list ────────────────────────────────────────────
                <div className="space-y-4">
                    {errorLogs.map((log: ErrorLog) => (
                        <Card
                            key={log.id} // Stable React key using the log's UUID
                            className="card-premium border-none border-s-4 border-s-red-500 shadow-lg overflow-hidden group hover:translate-x-1 transition-all"
                            // `border-s-4 border-s-red-500` = left (start) red accent stripe for quick visual scanning
                        >
                            <CardContent className="p-6">

                                {/* ── Error message + source badge + timestamp ── */}
                                <div className="flex justify-between items-start gap-4 mb-4">
                                    <div className="flex-1">
                                        {/* The main error message — large and red for immediate attention */}
                                        <span className="font-black text-red-600 text-lg">
                                            {log.message} {/* Human-readable error description */}
                                        </span>

                                        {/* Metadata row: source badge + timestamp */}
                                        <div className="flex items-center gap-3 mt-1">
                                            {/* Source badge — indicates where the error originated (frontend/backend) */}
                                            <span className="px-2 py-0.5 rounded-md bg-red-50 text-[10px] font-black text-red-500 uppercase tracking-wider">
                                                {log.source || 'CLIENT'} {/* e.g. 'frontend_apiClient', 'backend' */}
                                            </span>
                                            {/* Localised timestamp of when the error was logged */}
                                            <span className="text-[10px] font-bold text-primary/20 uppercase tracking-widest">
                                                {new Date(log.created_at).toLocaleString(
                                                    language === 'ar' ? 'ar-IQ' : 'en-US' // Arabic or English locale
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Stack trace code block ── */}
                                {/* Dark background + monospace font makes stack traces readable */}
                                <div className="bg-slate-900 p-4 rounded-xl font-mono text-[11px] text-red-400 overflow-auto max-h-40 whitespace-pre-wrap shadow-inner border border-white/5 selection:bg-red-500 selection:text-white">
                                    {log.stack_trace || 'No detailed stack trace available'}
                                    {/* Fallback text shown when no stack trace was captured with the error */}
                                </div>

                                {/* ── Attribution footer: user who triggered the error ── */}
                                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap justify-between items-center gap-4">
                                    {/* User display name or "Anonymous" */}
                                    <div className="flex items-center gap-2">
                                        <Users className="h-3 w-3 text-primary/20" /> {/* People icon for user context */}
                                        <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest leading-none">
                                            {log.user_name
                                                ? log.user_name // Display name if captured
                                                : (language === 'ar' ? 'مستخدم مجهول' : 'Anonymous User') // Fallback
                                            }
                                        </span>
                                    </div>
                                    {/* User ID for more precise lookup if needed */}
                                    <span className="text-[10px] font-bold text-primary/20 uppercase tracking-widest">
                                        {log.user_id} {/* Usually 'authenticated' or 'anonymous' for frontend errors */}
                                    </span>
                                </div>

                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

        </div>
    );
};
