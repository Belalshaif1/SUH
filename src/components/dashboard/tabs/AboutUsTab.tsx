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
import { Info, Save, RefreshCw } from 'lucide-react';

interface AboutUsTabProps {
    aboutData: any;
    onSaved?: () => void;
}

export const AboutUsTab: React.FC<AboutUsTabProps> = ({ aboutData, onSaved }) => {
    const { language } = useLanguage();
    const { toast } = useToast();
    const isAr = language === 'ar';
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        content_ar: '',
        content_en: '',
        developer_name_ar: '',
        developer_name_en: '',
        developer_bio_ar: '',
        developer_bio_en: '',
        developer_image_url: '',
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
            });
        }
    }, [aboutData]);

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
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        {f('developer_name_ar', isAr ? 'اسم المطور (عربي)' : 'Developer Name (Arabic)')}
                        {f('developer_name_en', isAr ? 'اسم المطور (إنجليزي)' : 'Developer Name (English)')}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        {f('developer_bio_ar', isAr ? 'السيرة الذاتية (عربي)' : 'Bio (Arabic)', true)}
                        {f('developer_bio_en', isAr ? 'السيرة الذاتية (إنجليزي)' : 'Bio (English)', true)}
                    </div>
                    {f('developer_image_url', isAr ? 'رابط صورة المطور' : 'Developer Image URL')}
                    {form.developer_image_url && (
                        <div className="flex items-center gap-3 mt-2">
                            <img
                                src={form.developer_image_url}
                                alt="Developer"
                                className="h-16 w-16 rounded-full object-cover border-2 border-primary/20"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            <p className="text-xs text-muted-foreground">{isAr ? 'معاينة الصورة' : 'Image preview'}</p>
                        </div>
                    )}
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

