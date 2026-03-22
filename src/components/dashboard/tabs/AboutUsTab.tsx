/**
 * @file src/components/dashboard/tabs/AboutUsTab.tsx
 * @description "About Us" management tab — visible to Super Admin only.
 *              Lets the super admin edit the About Us page content (Arabic + English)
 *              and the developer profile (name, bio, profile image, CV file).
 *
 * BUG NOTE: The `useEffect` here depends explicitly on `[aboutData]`, which is a prop
 *           passed from the parent. As long as the parent doesn't re-create `aboutData`
 *           on every render (it should be memoised or from state), this will not loop.
 */

import React, { useState, useEffect } from 'react'; // State for form fields, effect for syncing prop to state
import { useLanguage } from '@/contexts/LanguageContext'; // Current UI language
import apiClient        from '@/lib/apiClient';            // HTTP client with auth header
import {
    Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';                             // Shadcn card
import { Button }   from '@/components/ui/button';         // Shadcn button
import { Input }    from '@/components/ui/input';          // Shadcn text input
import { Label }    from '@/components/ui/label';          // Shadcn label
import { Textarea } from '@/components/ui/textarea';       // Shadcn multiline text input
import { useToast } from '@/hooks/use-toast';              // Toast notification hook
import {
    Info, Save, RefreshCw, Upload, FileText, X, Image as ImageIcon
} from 'lucide-react';                                     // Icon set

// ─── Props ────────────────────────────────────────────────────────────────

/** Props for the AboutUsTab component */
interface AboutUsTabProps {
    aboutData: any;       // The current About Us record from the database (passed from useDashboardData)
    onSaved?: () => void; // Optional callback to trigger a parent data refresh after a successful save
}

// ─── Form State Type ──────────────────────────────────────────────────────

/** Shape of the editable form fields — mirrors the `about_us` database columns */
interface AboutUsForm {
    content_ar:            string; // Arabic page content shown on the About Us page
    content_en:            string; // English page content shown on the About Us page
    developer_name_ar:     string; // Developer's name in Arabic
    developer_name_en:     string; // Developer's name in English
    developer_bio_ar:      string; // Developer's biography in Arabic
    developer_bio_en:      string; // Developer's biography in English
    developer_image_url:   string; // URL of the developer's uploaded profile photo
    developer_cv_url:      string; // URL of the developer's uploaded CV file (PDF/Word)
}

// ─── Component ────────────────────────────────────────────────────────────

export const AboutUsTab: React.FC<AboutUsTabProps> = ({ aboutData, onSaved }) => {
    const { language } = useLanguage(); // Current language for inline AR/EN checks
    const { toast }    = useToast();    // Toast notification system
    const isAr         = language === 'ar'; // Shorthand to avoid repeated comparisons

    const [saving,   setSaving]   = useState(false);          // True while the PUT request is in flight
    const [uploading, setUploading] = useState<string | null>(null); // Field name being uploaded, or null

    // ── Form state ────────────────────────────────────────────────────

    // Initialise with empty strings so inputs are always controlled (never undefined)
    const [form, setForm] = useState<AboutUsForm>({
        content_ar:          '', // Will be populated by the useEffect below
        content_en:          '',
        developer_name_ar:   '',
        developer_name_en:   '',
        developer_bio_ar:    '',
        developer_bio_en:    '',
        developer_image_url: '',
        developer_cv_url:    '',
    });

    // ── Sync prop → form state ────────────────────────────────────────

    /**
     * When `aboutData` prop updates (e.g., after the parent re-fetches), update the form
     * so the fields always reflect the latest values from the database.
     */
    useEffect(() => {
        if (!aboutData) return; // Guard: do nothing if no data has been fetched yet
        setForm({
            content_ar:          aboutData.content_ar          || '',
            content_en:          aboutData.content_en          || '',
            developer_name_ar:   aboutData.developer_name_ar   || '',
            developer_name_en:   aboutData.developer_name_en   || '',
            developer_bio_ar:    aboutData.developer_bio_ar    || '',
            developer_bio_en:    aboutData.developer_bio_en    || '',
            developer_image_url: aboutData.developer_image_url || '',
            developer_cv_url:    aboutData.developer_cv_url    || '',
        });
    }, [aboutData]); // Re-run whenever the parent passes a new aboutData object

    // ── File Upload Handler ───────────────────────────────────────────

    /**
     * handleFileUpload — POSTs a selected file to /api/upload and stores the
     * returned URL in the appropriate form field.
     *
     * @param e     - The file input change event containing the selected file
     * @param field - The form field key to update with the uploaded file's URL
     */
    const handleFileUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        field: 'developer_image_url' | 'developer_cv_url'
    ): Promise<void> => {
        const file = e.target.files?.[0]; // First selected file (only one allowed)
        if (!file) return;                 // Guard: user cancelled the file picker

        setUploading(field); // Mark this specific field as "uploading" to show a spinner

        const formData = new FormData(); // FormData allows multipart/form-data submission
        formData.append('file', file);   // Attach the file under the key the server expects

        try {
            // Manually call fetch (not apiClient) because we need multipart/form-data, not JSON
            const baseUrl  = import.meta.env.VITE_API_URL || ''; // API base URL from env
            const response = await fetch(`${baseUrl}/api/upload`, {
                method:  'POST',
                body:    formData,
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, // JWT auth
            });

            if (!response.ok) throw new Error('Upload failed'); // Treat non-2xx as an error

            const data = await response.json(); // Server returns { url: <public_url> }
            // Update only the relevant field in the form state
            setForm(prev => ({ ...prev, [field]: data.url }));
            toast({ title: isAr ? '✅ تم رفع الملف بنجاح' : '✅ File uploaded successfully' });
        } catch {
            toast({ title: isAr ? '❌ فشل الرفع' : '❌ Upload failed', variant: 'destructive' });
        } finally {
            setUploading(null); // Always clear the uploading indicator
        }
    };

    // ── Save Handler ──────────────────────────────────────────────────

    /** handleSave — sends the full form state as a PUT request to update the About Us page */
    const handleSave = async (): Promise<void> => {
        setSaving(true); // Show spinner on save button and prevent duplicate saves
        try {
            await apiClient('/about', {
                method: 'PUT',
                body:   JSON.stringify(form), // Serialise the whole form to JSON
            });
            toast({ title: isAr ? '✅ تم الحفظ بنجاح' : '✅ Saved successfully' });
            onSaved?.(); // Trigger parent data refresh (optional — not all callers need this)
        } catch (err: any) {
            toast({
                title:   err.message || (isAr ? 'فشل الحفظ' : 'Save failed'),
                variant: 'destructive',
            });
        } finally {
            setSaving(false); // Always clear saving indicator
        }
    };

    // ── Field Renderer ────────────────────────────────────────────────

    /**
     * renderField — returns a labelled Input or Textarea for a given form field key.
     * Defined as a local helper to avoid repeating the label+input pattern 8 times.
     *
     * @param key       - Key of the form field to bind
     * @param label     - Human-readable label text shown above the input
     * @param multiline - If true, renders a Textarea instead of an Input
     */
    const renderField = (
        key: keyof AboutUsForm,
        label: string,
        multiline = false
    ): JSX.Element => (
        <div className="space-y-1.5" key={key}>
            <Label className="font-bold text-sm">{label}</Label>
            {multiline ? (
                <Textarea
                    value={form[key]} // Controlled value from state
                    onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))} // Update only this field
                    className="min-h-[120px] resize-none rounded-xl"
                    placeholder={label}
                />
            ) : (
                <Input
                    value={form[key]} // Controlled value from state
                    onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))} // Update only this field
                    className="rounded-xl h-11"
                    placeholder={label}
                />
            )}
        </div>
    );

    // ── Render ────────────────────────────────────────────────────────

    return (
        <div className="p-6 space-y-8 max-w-4xl mx-auto"> {/* Centred form with consistent vertical spacing */}

            {/* ── Page header ── */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-black flex items-center gap-3">
                        <Info className="h-6 w-6 text-primary" /> {/* Info icon for "About" context */}
                        {isAr ? 'إدارة صفحة "من نحن"' : 'Manage "About Us" Page'}
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        {isAr
                            ? 'تحديث محتوى صفحة التعريف التي تظهر للزوار'
                            : 'Update the About Us page content visible to visitors'
                        }
                    </p>
                </div>
                {/* Top save button — duplicate of the bottom footer button for convenience */}
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving
                        ? <RefreshCw className="h-4 w-4 animate-spin" /> // Spinning icon while saving
                        : <Save className="h-4 w-4" />                    // Save icon when idle
                    }
                    {saving
                        ? (isAr ? 'جاري الحفظ...' : 'Saving...')    // "Saving..." label while in flight
                        : (isAr ? 'حفظ التغييرات' : 'Save Changes') // Normal label
                    }
                </Button>
            </div>

            {/* ── Page Content Card ── */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        {isAr ? '📝 محتوى الصفحة' : '📝 Page Content'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Side-by-side Arabic and English content textareas */}
                    <div className="grid md:grid-cols-2 gap-4">
                        {renderField('content_ar', isAr ? 'المحتوى (عربي)' : 'Content (Arabic)', true)}
                        {renderField('content_en', isAr ? 'المحتوى (إنجليزي)' : 'Content (English)', true)}
                    </div>
                </CardContent>
            </Card>

            {/* ── Developer Info Card ── */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        {isAr ? '👨‍💻 معلومات المطور' : '👨‍💻 Developer Info'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Developer names in both languages */}
                    <div className="grid md:grid-cols-2 gap-4">
                        {renderField('developer_name_ar', isAr ? 'اسم المطور (عربي)' : 'Developer Name (Arabic)')}
                        {renderField('developer_name_en', isAr ? 'اسم المطور (إنجليزي)' : 'Developer Name (English)')}
                    </div>
                    {/* Developer bios in both languages */}
                    <div className="grid md:grid-cols-2 gap-4">
                        {renderField('developer_bio_ar', isAr ? 'السيرة الذاتية (عربي)' : 'Bio (Arabic)', true)}
                        {renderField('developer_bio_en', isAr ? 'السيرة الذاتية (إنجليزي)' : 'Bio (English)', true)}
                    </div>

                    {/* ── Developer Image Upload ── */}
                    <div className="space-y-3 p-4 border rounded-2xl bg-muted/30">
                        <Label className="font-bold">{isAr ? '🖼️ صورة المطور' : '🖼️ Developer Image'}</Label>
                        <div className="flex items-center gap-6">
                            {/* Image preview with an "X" remove button on hover */}
                            <div className="relative group">
                                <div className="h-24 w-24 rounded-2xl overflow-hidden border-2 border-dashed border-primary/20 flex items-center justify-center bg-background">
                                    {form.developer_image_url ? (
                                        /* Show the uploaded image when a URL has been stored */
                                        <img
                                            src={form.developer_image_url}
                                            alt="Developer profile" // Descriptive alt for accessibility
                                            className="h-full w-full object-cover" // Crop and fill the preview box
                                        />
                                    ) : (
                                        /* Placeholder icon when no image has been uploaded */
                                        <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                                    )}
                                </div>
                                {/* Remove button — only rendered when an image URL exists */}
                                {form.developer_image_url && (
                                    <button
                                        onClick={() => setForm(prev => ({ ...prev, developer_image_url: '' }))} // Clear the URL
                                        className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        // opacity-0 group-hover:opacity-100 = hide until user hovers the preview
                                    >
                                        <X className="h-3 w-3" /> {/* Small X icon */}
                                    </button>
                                )}
                            </div>

                            {/* Upload button and size recommendation hint */}
                            <div className="flex-1 space-y-2">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {isAr
                                        ? 'يفضل استخدام صورة مربعة بحجم 400x400 بكسل على الأقل للحصول على أفضل دقة.'
                                        : 'A square image of at least 400x400 pixels is recommended for best quality.'
                                    }
                                </p>
                                <div className="flex items-center gap-2">
                                    {/* Hidden file input — triggered programmatically by the styled button below */}
                                    <Input
                                        type="file"
                                        id="dev-image-upload"
                                        className="hidden" // Native file input is invisible; the Button triggers it
                                        accept="image/*"   // Only allow image files
                                        onChange={e => handleFileUpload(e, 'developer_image_url')}
                                    />
                                    {/* Styled upload button that triggers the hidden file input */}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-xl gap-2 h-10"
                                        disabled={uploading === 'developer_image_url'} // Prevent re-upload mid-flight
                                        onClick={() => document.getElementById('dev-image-upload')?.click()} // Trigger file picker
                                    >
                                        {uploading === 'developer_image_url'
                                            ? <RefreshCw className="h-4 w-4 animate-spin" /> // Spinner during upload
                                            : <Upload className="h-4 w-4" />                  // Upload icon when idle
                                        }
                                        {isAr ? 'رفع صورة' : 'Upload Image'}
                                    </Button>
                                    {/* Green "Uploaded" badge shown after a successful upload */}
                                    {form.developer_image_url && (
                                        <span className="text-[10px] bg-green-500/10 text-green-600 px-2 py-1 rounded-full font-bold">
                                            {isAr ? 'تم الرفع' : 'Uploaded'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Developer CV Upload ── */}
                    <div className="space-y-3 p-4 border rounded-2xl bg-muted/30">
                        <Label className="font-bold">{isAr ? '📄 ملف السيرة الذاتية (CV)' : '📄 CV File'}</Label>
                        <div className="flex items-center gap-4">
                            {/* Document icon badge */}
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <FileText className="h-6 w-6" />
                            </div>
                            {/* CV file name link (when uploaded) or placeholder text */}
                            <div className="flex-1">
                                {form.developer_cv_url ? (
                                    /* Show filename as a link + a remove button */
                                    <div className="flex items-center justify-between bg-background p-2 pr-3 rounded-xl border">
                                        <a
                                            href={form.developer_cv_url}   // Direct URL to the uploaded file
                                            target="_blank"                // Open in new tab
                                            rel="noopener noreferrer"      // Security: prevent opener access
                                            className="text-xs font-medium text-primary hover:underline truncate max-w-[200px]"
                                        >
                                            {form.developer_cv_url.split('/').pop()} {/* Show just the filename, not the full URL */}
                                        </a>
                                        {/* Remove CV button */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive"
                                            onClick={() => setForm(prev => ({ ...prev, developer_cv_url: '' }))} // Clear the URL
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    /* Placeholder text when no CV has been uploaded */
                                    <p className="text-xs text-muted-foreground">
                                        {isAr ? 'لم يتم رفع ملف حتى الآن' : 'No file uploaded yet'}
                                    </p>
                                )}
                            </div>
                            {/* Hidden file input for CV — triggered by the styled button */}
                            <Input
                                type="file"
                                id="dev-cv-upload"
                                className="hidden"                 // Hidden — triggered programmatically
                                accept=".pdf,.doc,.docx"           // Restrict to document types only
                                onChange={e => handleFileUpload(e, 'developer_cv_url')}
                            />
                            {/* CV upload trigger button */}
                            <Button
                                type="button"
                                variant="secondary"
                                className="rounded-xl gap-2"
                                disabled={uploading === 'developer_cv_url'} // Prevent re-submit mid-upload
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

            {/* ── Footer save button ── */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2 rounded-xl px-8">
                    {saving
                        ? <RefreshCw className="h-4 w-4 animate-spin" />
                        : <Save className="h-4 w-4" />
                    }
                    {saving
                        ? (isAr ? 'جاري الحفظ...' : 'Saving...')
                        : (isAr ? 'حفظ جميع التغييرات' : 'Save All Changes')
                    }
                </Button>
            </div>

        </div>
    );
};
