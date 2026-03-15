/**
 * @file components/dashboard/tabs/BackupTab.tsx
 * @description Backup management UI for Super Admin.
 * Allows triggering, downloading, and managing system backups.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import apiClient from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    Download, HardDrive, RefreshCw, Trash2,
    CheckCircle, XCircle, Clock, Archive
} from 'lucide-react';

interface BackupLog {
    id: string;
    filename: string;
    size_bytes: number;
    status: string;
    triggered_by: string;
    created_at: string;
}

interface BackupFile {
    filename: string;
    size_bytes: number;
    created_at: string;
}

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatDate = (dateStr: string, lang: string) => {
    return new Date(dateStr).toLocaleString(lang === 'ar' ? 'ar-IQ' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

export const BackupTab: React.FC = () => {
    const { language } = useLanguage();
    const { toast } = useToast();
    const isAr = language === 'ar';

    const [logs, setLogs] = useState<BackupLog[]>([]);
    const [files, setFiles] = useState<BackupFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [triggering, setTriggering] = useState(false);
    const [deletingFile, setDeletingFile] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [logsData, filesData] = await Promise.all([
                apiClient('/backup/logs'),
                apiClient('/backup/list'),
            ]);
            setLogs(Array.isArray(logsData) ? logsData : []);
            setFiles(Array.isArray(filesData) ? filesData : []);
        } catch (err: any) {
            toast({ title: isAr ? 'خطأ في تحميل البيانات' : 'Error loading backup data', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [isAr, toast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const triggerBackup = async () => {
        setTriggering(true);
        try {
            const result = await apiClient('/backup/trigger', { method: 'POST' });
            toast({
                title: isAr ? '✅ تم إنشاء النسخة الاحتياطية' : '✅ Backup Created',
                description: `${result.filename} (${formatBytes(result.size_bytes)})`
            });
            await fetchData();
        } catch (err: any) {
            toast({ title: isAr ? 'فشل إنشاء النسخة الاحتياطية' : 'Backup failed', description: err.message, variant: 'destructive' });
        } finally {
            setTriggering(false);
        }
    };

    const downloadBackup = (filename: string) => {
        const token = localStorage.getItem('token');
        const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/backup/download/${filename}`;
        // Create a temporary link with auth header by opening in JS
        fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.blob())
            .then(blob => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = filename;
                a.click();
                URL.revokeObjectURL(a.href);
            })
            .catch(() => toast({ title: isAr ? 'فشل التحميل' : 'Download failed', variant: 'destructive' }));
    };

    const deleteBackup = async (filename: string) => {
        if (!confirm(isAr ? `هل تريد حذف ${filename}؟` : `Delete ${filename}?`)) return;
        setDeletingFile(filename);
        try {
            await apiClient(`/backup/${filename}`, { method: 'DELETE' });
            toast({ title: isAr ? 'تم حذف النسخة' : 'Backup deleted' });
            await fetchData();
        } catch (err: any) {
            toast({ title: isAr ? 'فشل الحذف' : 'Delete failed', description: err.message, variant: 'destructive' });
        } finally {
            setDeletingFile(null);
        }
    };

    if (loading) {
        return <div className="text-center py-16 text-muted-foreground">{isAr ? 'جاري التحميل...' : 'Loading...'}</div>;
    }

    return (
        <div className="space-y-8 p-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-black flex items-center gap-3">
                        <Archive className="h-6 w-6 text-primary" />
                        {isAr ? 'النسخ الاحتياطي' : 'Backup System'}
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        {isAr
                            ? 'يتم عمل نسخ احتياطي تلقائي يومياً في الساعة 02:00 صباحاً'
                            : 'Automatic daily backups at 02:00 AM server time'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchData}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={triggerBackup}
                        disabled={triggering}
                        className="bg-primary text-primary-foreground gap-2"
                    >
                        <HardDrive className="h-4 w-4" />
                        {triggering
                            ? (isAr ? 'جاري الإنشاء...' : 'Creating...')
                            : (isAr ? 'نسخ احتياطي الآن' : 'Backup Now')}
                    </Button>
                </div>
            </div>

            {/* Available Backup Files */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Download className="h-5 w-5 text-primary" />
                        {isAr ? 'ملفات النسخ الاحتياطي' : 'Backup Files'}
                    </CardTitle>
                    <CardDescription>
                        {isAr ? `${files.length} ملف متاح (نحتفظ بآخر 10 نسخ)` : `${files.length} files available (last 10 kept)`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {files.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Archive className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p>{isAr ? 'لا توجد نسخ احتياطية حتى الآن' : 'No backups yet'}</p>
                            <p className="text-xs mt-1">{isAr ? 'اضغط "نسخ احتياطي الآن" لإنشاء أول نسخة' : 'Click "Backup Now" to create your first backup'}</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {files.map((file, idx) => (
                                <div key={file.filename} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/60 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Archive className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-mono text-sm font-bold">{file.filename}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatBytes(file.size_bytes)} • {formatDate(file.created_at, language)}
                                            </p>
                                        </div>
                                        {idx === 0 && <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/20">{isAr ? 'الأحدث' : 'Latest'}</Badge>}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => downloadBackup(file.filename)}>
                                            <Download className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10"
                                            disabled={deletingFile === file.filename}
                                            onClick={() => deleteBackup(file.filename)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Backup Logs */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        {isAr ? 'سجل العمليات' : 'Operation Log'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {logs.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground text-sm">{isAr ? 'لا توجد سجلات' : 'No logs yet'}</p>
                    ) : (
                        <div className="space-y-1">
                            {logs.map(log => (
                                <div key={log.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/30 text-sm">
                                    <div className="flex items-center gap-3">
                                        {log.status === 'success'
                                            ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                            : <XCircle className="h-4 w-4 text-destructive shrink-0" />
                                        }
                                        <span className="font-mono text-xs truncate max-w-[300px]">{log.filename}</span>
                                        <Badge variant="outline" className="text-[10px]">
                                            {log.triggered_by === 'scheduler' ? (isAr ? 'تلقائي' : 'Auto') : (isAr ? 'يدوي' : 'Manual')}
                                        </Badge>
                                    </div>
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
