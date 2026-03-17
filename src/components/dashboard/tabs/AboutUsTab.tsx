/**
 * @file components/dashboard/tabs/AboutUsTab.tsx
 * @description About Us management tab for Super Admin only.
 * Allows editing the About Us page content and developer info.
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import apiClient from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Info, Save, RefreshCw, Upload, FileText, X, Image as ImageIcon } from 'lucide-react';

interface AboutUsTabProps {
    aboutData: any;
    onSaved?: () => void;
}

export const AboutUsTab: React.FC<AboutUsTabProps> = ({ aboutData, onSaved }) => {
    const { language } = useLanguage();
    const { toast } = useToast();
    const isAr = language === 'ar';
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);

    const [form, setForm] = useState({
        content_ar: '',
        content_en: '',
        developer_name_ar: '',
        developer_name_en: '',
        developer_bio_ar: '',
        developer_bio_en: '',
        developer_image_url: '',
        developer_cv_url: '',
    });

    // Sync form with incoming data
    useEffect(() => {
        if (aboutData) {
            setForm({
                content_ar: aboutData.content_ar || '',
                content_en: aboutData.content_en || '',
                developer_name_ar: aboutData.developer_name_ar || '',
                developer_name_en: aboutData.developer_name_en || '',
                developer_bio_ar: aboutData.developer_bio_ar || '',
                developer_bio_en: aboutData.developer_bio_en || '',
                developer_image_url: aboutData.developer_image_url || '',
                developer_cv_url: aboutData.developer_cv_url || '',
            });
        }
    }, [aboutData]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'developer_image_url' | 'developer_cv_url') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(field);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/upload`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Upload failed');
            const data = await response.json();
            setForm(prev => ({ ...prev, [field]: data.url }));
            toast({ title: isAr ? '✅ تم رفع الملف بنجاح' : '✅ File uploaded successfully' });
        } catch (err: any) {
            toast({ title: isAr ? '❌ فشل الرفع' : '❌ Upload failed', variant: 'destructive' });
        } finally {
            setUploading(null);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await apiClient('/about', {
                method: 'PUT',
                body: JSON.stringify(form),
            });
            toast({ title: isAr ? '✅ تم الحفظ بنجاح' : '✅ Saved successfully' });
            onSaved?.();
        } catch (err: any) {
            toast({ title: err.message || (isAr ? 'فشل الحفظ' : 'Save failed'), variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const f = (key: keyof typeof form, label: string, multiline = false) => (
        <div className="space-y-1.5" key={key}>
            <Label className="font-bold text-sm">{label}</Label>
            {multiline ? (
                <Textarea
                    value={form[key]}
                    onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                    className="min-h-[120px] resize-none rounded-xl"
                    placeholder={label}
                />
            ) : (
                <Input
                    value={form[key]}
                    onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                    className="rounded-xl h-11"
                    placeholder={label}
                />
            )}
        </div>
    );

    return (
        <div className="p-6 space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-black flex items-center gap-3">
                        <Info className="h-6 w-6 text-primary" />
                        {isAr ? 'إدارة صفحة "من نحن"' : 'Manage "About Us" Page'}
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        {isAr ? 'تحديث محتوى صفحة التعريف التي تظهر للزوار' : 'Update the About Us page content visible to visitors'}
                    </p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ التغييرات' : 'Save Changes')}
                </Button>
            </div>

            {/* Page Content */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{isAr ? '📝 محتوى الصفحة' : '📝 Page Content'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        {f('content_ar', isAr ? 'المحتوى (عربي)' : 'Content (Arabic)', true)}
                        {f('content_en', isAr ? 'المحتوى (إنجليزي)' : 'Content (English)', true)}
                    </div>
                </CardContent>
            </Card>

            {/* Developer Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{isAr ? '👨‍💻 معلومات المطور' : '👨‍💻 Developer Info'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        {f('developer_name_ar', isAr ? 'اسم المطور (عربي)' : 'Developer Name (Arabic)')}
                        {f('developer_name_en', isAr ? 'اسم المطور (إنجليزي)' : 'Developer Name (English)')}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        {f('developer_bio_ar', isAr ? 'السيرة الذاتية (عربي)' : 'Bio (Arabic)', true)}
                        {f('developer_bio_en', isAr ? 'السيرة الذاتية (إنجليزي)' : 'Bio (English)', true)}
                    </div>

                    {/* Developer Image Upload */}
                    <div className="space-y-3 p-4 border rounded-2xl bg-muted/30">
                        <Label className="font-bold">{isAr ? '🖼️ صورة المطور' : '🖼️ Developer Image'}</Label>
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <div className="h-24 w-24 rounded-2xl overflow-hidden border-2 border-dashed border-primary/20 flex items-center justify-center bg-background">
                                    {form.developer_image_url ? (
                                        <img
                                            src={form.developer_image_url}
                                            alt="Developer"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                                    )}
                                </div>
                                {form.developer_image_url && (
                                    <button 
                                        onClick={() => setForm(prev => ({ ...prev, developer_image_url: '' }))}
                                        className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {isAr 
                                        ? 'يفضل استخدام صورة مربعة بحجم 400x400 بكسل على الأقل للحصول على أفضل دقة.' 
                                        : 'A square image of at least 400x400 pixels is recommended for best quality.'}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="file"
                                        id="dev-image-upload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e, 'developer_image_url')}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-xl gap-2 h-10"
                                        disabled={uploading === 'developer_image_url'}
                                        onClick={() => document.getElementById('dev-image-upload')?.click()}
                                    >
                                        {uploading === 'developer_image_url' 
                                            ? <RefreshCw className="h-4 w-4 animate-spin" /> 
                                            : <Upload className="h-4 w-4" />
                                        }
                                        {isAr ? 'رفع صورة' : 'Upload Image'}
                                    </Button>
                                    {form.developer_image_url && (
                                        <span className="text-[10px] bg-green-500/10 text-green-600 px-2 py-1 rounded-full font-bold">
                                            {isAr ? 'تم الرفع' : 'Uploaded'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Developer CV Upload */}
                    <div className="space-y-3 p-4 border rounded-2xl bg-muted/30">
                        <Label className="font-bold">{isAr ? '📄 ملف السيرة الذاتية (CV)' : '📄 CV File'}</Label>
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                {form.developer_cv_url ? (
                                    <div className="flex items-center justify-between bg-background p-2 pr-3 rounded-xl border">
                                        <a 
                                            href={form.developer_cv_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-xs font-medium text-primary hover:underline truncate max-w-[200px]"
                                        >
                                            {form.developer_cv_url.split('/').pop()}
                                        </a>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7 text-destructive"
                                            onClick={() => setForm(prev => ({ ...prev, developer_cv_url: '' }))}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        {isAr ? 'لم يتم رفع ملف حتى الآن' : 'No file uploaded yet'}
                                    </p>
                                )}
                            </div>
                            <Input
                                type="file"
                                id="dev-cv-upload"
                                className="hidden"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => handleFileUpload(e, 'developer_cv_url')}
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                className="rounded-xl gap-2"
                                disabled={uploading === 'developer_cv_url'}
                                onClick={() => document.getElementById('dev-cv-upload')?.click()}
                            >
                                {uploading === 'developer_cv_url' 
                                    ? <RefreshCw className="h-4 w-4 animate-spin" /> 
                                    : <Upload className="h-4 w-4" />
                                }
                                {isAr ? 'رفع ملف' : 'Upload CV'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Save Footer */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2 rounded-xl px-8">
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ جميع التغييرات' : 'Save All Changes')}
                </Button>
            </div>
        </div>
    );
};

