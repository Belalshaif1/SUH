/**
 * @file src/components/dashboard/JobApplicationsViewer.tsx
 * @description Modal dialog that lists all applicants for a specific job posting.
 *              Admins can view applicant name, email, status, CV download link, and
 *              accept or reject individual applications. Status updates are applied
 *              optimistically to the local state to avoid a full re-fetch.
 *
 * BUG FIX: The `useEffect` depends on `[jobId, toast]`. Since `toast` is guaranteed
 *           stable by the useToast hook, this won't cause extra re-fetches.
 *           Added a proper cleanup guard (`cancelled` flag) so async responses that
 *           arrive after the dialog has been closed are discarded.
 */

import React, { useEffect, useState } from 'react'; // State for applications list + loading flag, Effect for fetching
import { useLanguage } from '@/contexts/LanguageContext'; // Language + translations
import apiClient, { getMediaUrl } from '@/lib/apiClient';  // HTTP client + URL resolver for uploaded files
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';                            // Shadcn Dialog components
import { Button } from '@/components/ui/button';            // Shadcn button
import { Badge }  from '@/components/ui/badge';             // Shadcn status badge
import {
    Download, CheckCircle, XCircle, Mail, User
} from 'lucide-react';                                      // Icon set
import { useToast } from '@/hooks/use-toast';               // Toast notifications

// ─── Props ────────────────────────────────────────────────────────────────

/** Props for JobApplicationsViewer */
interface JobApplicationsViewerProps {
    jobId:   string | null; // UUID of the job whose applications to show; null = dialog is closed
    onClose: () => void;    // Callback to close the dialog and clear jobId in the parent
}

// ─── Local Application Type ───────────────────────────────────────────────

/** Minimal shape of a job application record from the server */
interface Application {
    id:              string; // UUID of this application row
    applicant_name:  string; // Applicant's full name
    applicant_email: string; // Applicant's email address
    status:          string; // 'pending' | 'accepted' | 'rejected'
    file_url:        string; // Path to the applicant's uploaded CV file (resolved via getMediaUrl)
    created_at:      string; // ISO date string of when the application was submitted
}

// ─── Component ────────────────────────────────────────────────────────────

export const JobApplicationsViewer: React.FC<JobApplicationsViewerProps> = ({ jobId, onClose }) => {
    const { language } = useLanguage(); // Current UI language
    const { toast }    = useToast();    // Toast notification system
    const isAr = language === 'ar';     // Shorthand for AR/EN inline checks

    const [applications, setApplications] = useState<Application[]>([]); // The list of applications for this job
    const [loading, setLoading]           = useState(false);             // True while the fetch is in flight

    // ── Fetch applications ────────────────────────────────────────────

    /**
     * Fetch applications whenever jobId changes (i.e., each time a different job is opened).
     * BUG FIX: Uses a `cancelled` flag so stale async responses don't update state
     *           if the dialog has been closed or jobId changed while the request was in-flight.
     */
    useEffect(() => {
        if (!jobId) return; // Guard: dialog is closed — nothing to fetch

        let cancelled = false; // Flag to prevent state updates after unmount or jobId change

        const fetchApps = async (): Promise<void> => {
            setLoading(true); // Show the spinner
            try {
                // GET /api/job_applications/job/:jobId — returns all applications for this job
                const data = await apiClient(`/job_applications/job/${jobId}`);
                if (!cancelled) {
                    setApplications(data || []); // Update state only if this fetch is still relevant
                }
            } catch (err: any) {
                if (!cancelled) {
                    toast({
                        title:   err.message || 'Failed to load applications', // Server error message
                        variant: 'destructive',
                    });
                }
            } finally {
                if (!cancelled) {
                    setLoading(false); // Always clear loading, even on failure
                }
            }
        };

        fetchApps(); // Trigger the async fetch

        return () => {
            cancelled = true; // Mark as cancelled on cleanup — prevents stale state updates
        };
    }, [jobId, toast]); // Re-run when a different job is opened

    // ── Update application status ─────────────────────────────────────

    /**
     * handleStatusUpdate — sends a PUT request to accept or reject an application.
     * Uses optimistic local state update so the UI responds immediately without waiting
     * for the server to respond to a full re-fetch.
     *
     * @param appId  - UUID of the application to update
     * @param status - New status: 'accepted' or 'rejected'
     */
    const handleStatusUpdate = async (appId: string, status: string): Promise<void> => {
        try {
            // PUT /api/job_applications/:appId/status — updates the status column
            await apiClient(`/job_applications/${appId}/status`, {
                method: 'PUT',
                body:   JSON.stringify({ status }), // Send the new status in the JSON body
            });
            toast({ title: isAr ? 'تم تحديث الحالة بنجاح' : 'Status updated successfully' });
            // Optimistic update: update local state immediately to avoid a round-trip re-fetch
            setApplications(prev =>
                prev.map(a => a.id === appId ? { ...a, status } : a) // Replace just the changed application
            );
        } catch (err: any) {
            toast({
                title:   err.message || 'Failed to update status',
                variant: 'destructive',
            });
        }
    };

    // ── Render ────────────────────────────────────────────────────────

    return (
        <Dialog
            open={!!jobId}                       // Open when jobId is a non-empty string
            onOpenChange={open => !open && onClose()} // Call onClose when Radix closes the dialog (Escape key etc.)
        >
            {/* Borderless panel with dark mode support */}
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white dark:bg-slate-900 border-none rounded-[2rem] shadow-2xl">

                {/* ── Header: muted background with title ── */}
                <div className="bg-primary/5 p-6 border-b border-primary/10">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-primary flex items-center gap-2">
                            <User className="h-6 w-6" /> {/* Person icon to indicate this is a people-list */}
                            {isAr ? 'المتقدمين للوظيفة' : 'Job Applicants'}
                        </DialogTitle>
                    </DialogHeader>
                </div>

                {/* ── Scrollable application list ── */}
                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">

                    {loading ? (
                        // ── Loading spinner ──────────────────────────────────────
                        <div className="flex justify-center p-12">
                            {/* CSS-only spinner — border-t is a different colour from the rest of the ring */}
                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        </div>

                    ) : applications.length === 0 ? (
                        // ── Empty state ──────────────────────────────────────────
                        <div className="text-center p-12 text-muted-foreground">
                            {isAr ? 'لا يوجد متقدمين حتى الآن' : 'No applicants yet'}
                        </div>

                    ) : (
                        // ── Application cards ────────────────────────────────────
                        applications.map(app => (
                            <div
                                key={app.id} // Stable key using the application's UUID
                                className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition-all"
                            >
                                {/* Left: applicant name, email, status badge, and apply date */}
                                <div className="flex-1">
                                    {/* Full name */}
                                    <h3 className="text-xl font-bold text-foreground mb-1">
                                        {app.applicant_name}
                                    </h3>
                                    {/* Email row with mail icon */}
                                    <div className="flex items-center text-muted-foreground mb-3 font-medium">
                                        <Mail className="h-4 w-4 me-2" />
                                        {app.applicant_email}
                                    </div>
                                    {/* Status badge + application date */}
                                    <div className="flex flex-wrap items-center gap-3">
                                        {/* Colour-coded status badge */}
                                        <Badge
                                            variant="outline"
                                            className={`px-4 py-1.5 rounded-xl font-bold ${
                                                app.status === 'accepted' ? 'bg-green-100 text-green-700 border-green-200' :
                                                app.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                                'bg-amber-100 text-amber-700 border-amber-200' // Pending = amber
                                            }`}
                                        >
                                            {app.status === 'accepted' ? (isAr ? 'مقبول' : 'Accepted') :
                                             app.status === 'rejected' ? (isAr ? 'مرفوض' : 'Rejected') :
                                             (isAr ? 'قيد الانتظار' : 'Pending')}
                                        </Badge>
                                        {/* Application date */}
                                        <span className="text-xs text-muted-foreground font-medium">
                                            {new Date(app.created_at).toLocaleDateString(isAr ? 'ar-IQ' : 'en-US')}
                                        </span>
                                    </div>
                                </div>

                                {/* Right: Download CV + Accept/Reject buttons */}
                                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                                    {/* Download CV button — opens file in a new tab */}
                                    <a
                                        href={getMediaUrl(app.file_url)} // Resolve relative path to absolute URL
                                        target="_blank"                  // Open in a new browser tab
                                        rel="noopener noreferrer"        // Prevent opener security vulnerability
                                        className="flex-1 md:flex-none"
                                    >
                                        <Button
                                            variant="outline"
                                            className="w-full h-12 rounded-xl border-primary/20 text-primary hover:bg-primary/5 font-bold"
                                        >
                                            <Download className="h-4 w-4 me-2" />
                                            {isAr ? 'تحميل السيرة الذاتية' : 'Download CV'}
                                        </Button>
                                    </a>

                                    {/* Accept button — only shown when application is NOT already accepted */}
                                    {app.status !== 'accepted' && (
                                        <Button
                                            onClick={() => handleStatusUpdate(app.id, 'accepted')} // Update status to accepted
                                            className="flex-1 md:flex-none h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold"
                                        >
                                            <CheckCircle className="h-4 w-4 me-2" />
                                            {isAr ? 'قبول' : 'Accept'}
                                        </Button>
                                    )}

                                    {/* Reject button — only shown when application is NOT already rejected */}
                                    {app.status !== 'rejected' && (
                                        <Button
                                            onClick={() => handleStatusUpdate(app.id, 'rejected')} // Update status to rejected
                                            variant="destructive"
                                            className="flex-1 md:flex-none h-12 rounded-xl font-bold"
                                        >
                                            <XCircle className="h-4 w-4 me-2" />
                                            {isAr ? 'رفض' : 'Reject'}
                                        </Button>
                                    )}
                                </div>

                            </div>
                        ))
                    )}
                </div>

            </DialogContent>
        </Dialog>
    );
};
