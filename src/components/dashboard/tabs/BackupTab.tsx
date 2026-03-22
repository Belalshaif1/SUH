/**
 * @file src/components/dashboard/tabs/BackupTab.tsx
 * @description Backup management UI for the Super Admin dashboard tab.
 *              Features: trigger manual backups, list available backup files,
 *              download individual backups, delete backups, and view the operation log.
 *              Automatic daily backups run at 02:00 AM server time via a scheduler.
 *
 * BUG FIX: `fetchData` is wrapped in `useCallback` with stable `[isAr, toast]` deps
 *           so the `useEffect` does not re-create it on every render (prevents infinite loop).
 */

import React, { useState, useEffect, useCallback } from 'react'; // React hooks for state and effects
import { useLanguage }  from '@/contexts/LanguageContext';        // Current language
import apiClient        from '@/lib/apiClient';                   // HTTP client with auth
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card';                                    // Shadcn card components
import { Button }       from '@/components/ui/button';            // Shadcn button
import { Badge }        from '@/components/ui/badge';             // Shadcn badge for labels
import { useToast }     from '@/hooks/use-toast';                 // Toast notifications
import {
    Download, HardDrive, RefreshCw, Trash2,
    CheckCircle, XCircle, Clock, Archive
} from 'lucide-react';                                            // Icon set

// ─── Local Types ──────────────────────────────────────────────────────────

/** A single row from the backup_logs table — records each backup attempt */
interface BackupLog {
    id:           string; // UUID of this log row
    filename:     string; // The backup file that was created (or attempted)
    size_bytes:   number; // Size of the resulting backup file in bytes
    status:       string; // 'success' or 'error'
    triggered_by: string; // 'scheduler' (automated) or 'manual' (admin triggered)
    created_at:   string; // ISO timestamp of when this backup was attempted
}

/** One physical backup file on the server's filesystem */
interface BackupFile {
    filename:   string; // The file's name (used as the identifier for download and delete)
    size_bytes: number; // File size in bytes — displayed in human-readable format
    created_at: string; // ISO timestamp when the file was written
}

// ─── Utility Functions ────────────────────────────────────────────────────

/**
 * formatBytes — converts a raw byte count to a human-readable string.
 * Examples: 0 → '0 B', 1500 → '1.5 KB', 2500000 → '2.4 MB'
 *
 * @param bytes - The raw file size in bytes
 * @returns A formatted string like '2.4 MB'
 */
const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';                                // Handle zero case explicitly
    const k = 1024;                                               // Binary kilobyte
    const sizes = ['B', 'KB', 'MB', 'GB'];                       // Unit labels up to GB
    const i = Math.floor(Math.log(bytes) / Math.log(k));         // Calculate the correct unit tier
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`; // Format and return
};

/**
 * formatDate — localises an ISO date string to a readable date+time in the user's locale.
 *
 * @param dateStr - ISO date string from the server (e.g. '2024-01-15T14:32:00Z')
 * @param lang    - Current UI language string ('ar' or 'en')
 * @returns A localised date+time string
 */
const formatDate = (dateStr: string, lang: string): string => {
    return new Date(dateStr).toLocaleString(lang === 'ar' ? 'ar-IQ' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

// ─── Component ────────────────────────────────────────────────────────────

export const BackupTab: React.FC = () => {
    const { language } = useLanguage(); // Current UI language
    const { toast }    = useToast();    // Toast notification system
    const isAr         = language === 'ar'; // Shorthand for inline Arabic checks

    // ── State ─────────────────────────────────────────────────────────

    const [logs, setLogs]         = useState<BackupLog[]>([]);   // Recently logged backup operations
    const [files, setFiles]       = useState<BackupFile[]>([]);  // Physical backup files on the server
    const [loading, setLoading]   = useState(true);              // True while listing files and log rows
    const [triggering, setTriggering] = useState(false);         // True while creating a manual backup
    const [deletingFile, setDeletingFile] = useState<string | null>(null); // Filename of the backup being deleted

    // ── Data Fetch ────────────────────────────────────────────────────

    /**
     * fetchData — loads both the backup operation log and the list of physical files.
     * Wrapped in useCallback with stable deps to prevent the useEffect from re-running infinitely.
     */
    const fetchData = useCallback(async (): Promise<void> => {
        setLoading(true); // Show the loading indicator while both requests are in flight
        try {
            // Fire both API calls in parallel for efficiency
            const [logsData, filesData] = await Promise.all([
                apiClient('/backup/logs'),  // GET /api/backup/logs — operation history
                apiClient('/backup/list'),  // GET /api/backup/list — available files
            ]);
            setLogs(Array.isArray(logsData) ? logsData : []);  // Guard against non-array responses
            setFiles(Array.isArray(filesData) ? filesData : []); // Guard against non-array responses
        } catch {
            toast({
                title:   isAr ? 'خطأ في تحميل البيانات' : 'Error loading backup data', // Error notification
                variant: 'destructive',
            });
        } finally {
            setLoading(false); // Always clear loading, even on failure
        }
    }, [isAr, toast]); // Only recreate when language or toast changes

    // Load data when the component mounts
    useEffect(() => {
        fetchData(); // Initial data load
    }, [fetchData]); // Re-run only if fetchData itself changes (i.e., language changes)

    // ── Actions ───────────────────────────────────────────────────────

    /**
     * triggerBackup — sends a POST request to immediately create a new backup.
     * Shows a success toast with the filename + size, then refreshes the file list.
     */
    const triggerBackup = async (): Promise<void> => {
        setTriggering(true); // Disable the "Backup Now" button to prevent duplicate requests
        try {
            const result = await apiClient('/backup/trigger', { method: 'POST' }); // Trigger the backup
            toast({
                title: isAr ? '✅ تم إنشاء النسخة الاحتياطية' : '✅ Backup Created',
                description: `${result.filename} (${formatBytes(result.size_bytes)})`, // Show filename + size
            });
            await fetchData(); // Refresh the file list to show the new backup
        } catch (err: any) {
            toast({
                title:       isAr ? 'فشل إنشاء النسخة الاحتياطية' : 'Backup failed',
                description: err.message, // Show the server's error message
                variant:     'destructive',
            });
        } finally {
            setTriggering(false); // Re-enable the button regardless of outcome
        }
    };

    /**
     * downloadBackup — downloads a backup file by fetching it with the auth token
     * and creating a temporary anchor element to trigger the browser download.
     *
     * @param filename - The backup filename to download (used as the URL parameter)
     */
    const downloadBackup = (filename: string): void => {
        const token = localStorage.getItem('token'); // Read JWT for the Authentication header
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'; // API base URL
        const url = `${baseUrl}/backup/download/${filename}`; // Full download endpoint URL

        // Fetch the binary file with auth — can't use a plain <a href> because we need the token
        fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.blob())               // Convert the response to a binary Blob
            .then(blob => {
                const a = document.createElement('a'); // Create a temporary invisible anchor
                a.href = URL.createObjectURL(blob);     // Create a temporary object URL for the Blob
                a.download = filename;                  // Set the download filename
                a.click();                              // Programmatically click to start the download
                URL.revokeObjectURL(a.href);            // Clean up the temporary object URL
            })
            .catch(() => toast({
                title:   isAr ? 'فشل التحميل' : 'Download failed', // Error toast if fetch fails
                variant: 'destructive',
            }));
    };

    /**
     * deleteBackup — deletes a backup file after a native browser confirm dialog.
     * Uses window.confirm as a lightweight confirmation since this is a recoverable action.
     *
     * @param filename - The backup filename to delete (used as the URL parameter)
     */
    const deleteBackup = async (filename: string): Promise<void> => {
        // Use native browser confirm as a quick lightweight guard against accidental deletion
        if (!confirm(isAr ? `هل تريد حذف ${filename}؟` : `Delete ${filename}?`)) return;

        setDeletingFile(filename); // Mark this specific file as "being deleted" to show a spinner
        try {
            await apiClient(`/backup/${filename}`, { method: 'DELETE' }); // Send delete request
            toast({ title: isAr ? 'تم حذف النسخة' : 'Backup deleted' }); // Success notification
            await fetchData(); // Refresh the file list to remove the deleted entry
        } catch (err: any) {
            toast({
                title:       isAr ? 'فشل الحذف' : 'Delete failed',
                description: err.message, // Server's error reason
                variant:     'destructive',
            });
        } finally {
            setDeletingFile(null); // Clear the deleting indicator regardless of outcome
        }
    };

    // ── Loading State ─────────────────────────────────────────────────

    // Show a simple loading message while the initial fetch is in progress
    if (loading) {
        return (
            <div className="text-center py-16 text-muted-foreground">
                {isAr ? 'جاري التحميل...' : 'Loading...'}
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────

    return (
        <div className="space-y-8 p-6"> {/* Vertical sections with consistent spacing */}

            {/* ── Header: title + refresh + backup-now buttons ── */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    {/* Section title with archive icon */}
                    <h2 className="text-2xl font-black flex items-center gap-3">
                        <Archive className="h-6 w-6 text-primary" /> {/* Archive icon for backup context */}
                        {isAr ? 'النسخ الاحتياطي' : 'Backup System'}
                    </h2>
                    {/* Info about the automated backup schedule */}
                    <p className="text-muted-foreground text-sm mt-1">
                        {isAr
                            ? 'يتم عمل نسخ احتياطي تلقائي يومياً في الساعة 02:00 صباحاً'
                            : 'Automatic daily backups at 02:00 AM server time'
                        }
                    </p>
                </div>

                {/* Header action buttons */}
                <div className="flex gap-2">
                    {/* Refresh button — reloads the file list and log without triggering a new backup */}
                    <Button variant="outline" size="sm" onClick={fetchData}>
                        <RefreshCw className="h-4 w-4" /> {/* Refresh/reload icon */}
                    </Button>

                    {/* "Backup Now" button — triggers an immediate manual backup */}
                    <Button
                        onClick={triggerBackup}
                        disabled={triggering} // Prevent double-click during creation
                        className="bg-primary text-primary-foreground gap-2"
                    >
                        <HardDrive className="h-4 w-4" /> {/* Hard drive icon for backup context */}
                        {/* Show "Creating..." while in progress, normal label otherwise */}
                        {triggering
                            ? (isAr ? 'جاري الإنشاء...' : 'Creating...')
                            : (isAr ? 'نسخ احتياطي الآن' : 'Backup Now')
                        }
                    </Button>
                </div>
            </div>

            {/* ── Backup Files Card ── */}
            <Card>
                <CardHeader>
                    {/* Card title with download icon */}
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Download className="h-5 w-5 text-primary" />
                        {isAr ? 'ملفات النسخ الاحتياطي' : 'Backup Files'}
                    </CardTitle>
                    {/* Shows count and retention policy */}
                    <CardDescription>
                        {isAr
                            ? `${files.length} ملف متاح (نحتفظ بآخر 10 نسخ)`
                            : `${files.length} files available (last 10 kept)`
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {files.length === 0 ? (
                        // Empty state — no backup files exist yet
                        <div className="text-center py-12 text-muted-foreground">
                            <Archive className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p>{isAr ? 'لا توجد نسخ احتياطية حتى الآن' : 'No backups yet'}</p>
                            <p className="text-xs mt-1">
                                {isAr
                                    ? 'اضغط "نسخ احتياطي الآن" لإنشاء أول نسخة'
                                    : 'Click "Backup Now" to create your first backup'
                                }
                            </p>
                        </div>
                    ) : (
                        // File list
                        <div className="space-y-2">
                            {files.map((file, idx) => (
                                <div
                                    key={file.filename} // Filename is unique on the filesystem — use as key
                                    className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/60 transition-colors"
                                >
                                    {/* File info: icon + name + size + date */}
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Archive className="h-4 w-4 text-primary" /> {/* Archive icon */}
                                        </div>
                                        <div>
                                            {/* Monospace font for filenames for readability */}
                                            <p className="font-mono text-sm font-bold">{file.filename}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatBytes(file.size_bytes)} {/* Human-readable size */}
                                                {' • '}
                                                {formatDate(file.created_at, language)} {/* Localised date+time */}
                                            </p>
                                        </div>
                                        {/* "Latest" badge on the first (most recent) file */}
                                        {idx === 0 && (
                                            <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                                                {isAr ? 'الأحدث' : 'Latest'}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Download and Delete buttons */}
                                    <div className="flex gap-2">
                                        {/* Download button — fetches file with auth token */}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => downloadBackup(file.filename)}
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                        </Button>
                                        {/* Delete button — disabled while this file is being deleted */}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-destructive hover:bg-destructive/10"
                                            disabled={deletingFile === file.filename} // Prevent double-delete
                                            onClick={() => deleteBackup(file.filename)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Backup Operation Log Card ── */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" /> {/* Clock icon for history/log */}
                        {isAr ? 'سجل العمليات' : 'Operation Log'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {logs.length === 0 ? (
                        // Empty log state
                        <p className="text-center py-8 text-muted-foreground text-sm">
                            {isAr ? 'لا توجد سجلات' : 'No logs yet'}
                        </p>
                    ) : (
                        // Log rows
                        <div className="space-y-1">
                            {logs.map(log => (
                                <div
                                    key={log.id} // UUID from the backup_logs table
                                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/30 text-sm"
                                >
                                    {/* Left: status icon + filename + trigger type badge */}
                                    <div className="flex items-center gap-3">
                                        {/* Green check for success, red X for failure */}
                                        {log.status === 'success'
                                            ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                            : <XCircle    className="h-4 w-4 text-destructive shrink-0" />
                                        }
                                        {/* Truncated filename in monospace */}
                                        <span className="font-mono text-xs truncate max-w-[300px]">
                                            {log.filename}
                                        </span>
                                        {/* Badge for how the backup was triggered */}
                                        <Badge variant="outline" className="text-[10px]">
                                            {log.triggered_by === 'scheduler'
                                                ? (isAr ? 'تلقائي' : 'Auto')    // Scheduled/automated
                                                : (isAr ? 'يدوي' : 'Manual')    // Triggered by admin
                                            }
                                        </Badge>
                                    </div>

                                    {/* Right: file size + date */}
                                    <div className="flex items-center gap-4 text-muted-foreground">
                                        <span className="text-xs">{formatBytes(log.size_bytes || 0)}</span>
                                        <span className="text-xs">{formatDate(log.created_at, language)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    );
};
