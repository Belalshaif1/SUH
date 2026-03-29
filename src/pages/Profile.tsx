import React, { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import apiClient, { getMediaUrl } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Profile: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, profile, refreshProfile, userRole } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [coverUrl, setCoverUrl] = useState(profile?.cover_url || '');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: language === 'ar' ? 'يرجى اختيار صورة' : 'Please select an image', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: language === 'ar' ? 'حجم الصورة يجب أن يكون أقل من 2MB' : 'Image must be less than 2MB', variant: 'destructive' });
      return;
    }

    setUploading(type);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await apiClient('/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (type === 'avatar') {
        setAvatarUrl(data.url);
      } else {
        setCoverUrl(data.url);
      }
      
      toast({ title: language === 'ar' ? 'تم رفع الصورة بنجاح' : 'Image uploaded successfully' });
    } catch (error: any) {
      toast({ title: error.message, variant: 'destructive' });
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await apiClient('/auth/update', {
        method: 'PUT',
        body: JSON.stringify({ full_name: fullName, phone, avatar_url: avatarUrl, cover_url: coverUrl }),
      });
      toast({ title: language === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully' });
      refreshProfile();
    } catch (error: any) {
      toast({ title: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = userRole ? (
    language === 'ar'
      ? { super_admin: 'مدير الموقع', university_admin: 'مدير جامعة', college_admin: 'مدير كلية', department_admin: 'مدير قسم' }[userRole.role]
      : userRole.role.replace('_', ' ')
  ) : (language === 'ar' ? 'مستخدم' : 'User');

  const initials = profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="min-h-[90vh] pb-20 pt-10 px-4 animate-fade-in relative overflow-hidden">
      <div className="absolute inset-0 gradient-academic opacity-[0.02] z-0" />

      <div className="container mx-auto max-w-lg relative z-10">
        <Card className="card-premium overflow-hidden bg-white/80 backdrop-blur-xl border border-border/50 shadow-2xl shadow-primary/10">
          <div className="h-40 relative group/cover">
            {coverUrl ? (
              <img src={getMediaUrl(coverUrl)} alt="cover" className="h-full w-full object-cover transition-transform duration-700 group-hover/cover:scale-105" />
            ) : (
              <div className="absolute inset-0 gradient-academic opacity-80" />
            )}
            <div className="absolute inset-0 bg-black/10 transition-opacity group-hover/cover:opacity-100" />
            <button
              onClick={() => coverInputRef.current?.click()}
              className="absolute top-4 right-4 flex h-9 px-3 items-center gap-2 rounded-xl bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/40 transition-all opacity-0 group-hover/cover:opacity-100"
            >
              {uploading === 'cover' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              <span className="text-xs font-bold">{language === 'ar' ? 'تغيير الغلاف' : 'Change Cover'}</span>
            </button>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'cover')} />
          </div>

          <CardHeader className="text-center relative -mt-16 pb-6 px-8">
            <div className="relative mx-auto mb-6 group">
              <Avatar className="h-32 w-32 mx-auto border-8 border-white shadow-2xl transition-transform duration-500 group-hover:scale-105 overflow-hidden">
                {avatarUrl && <AvatarImage src={getMediaUrl(avatarUrl)} alt="avatar" className="object-cover" />}
                <AvatarFallback className="bg-primary text-white text-4xl font-black">{initials}</AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading === 'avatar'}
                className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-gold text-white shadow-xl hover:bg-primary transition-all duration-300 border-4 border-white active:scale-90"
              >
                {uploading === 'avatar' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'avatar')} />
            </div>

            <CardTitle className="text-3xl font-black text-primary tracking-tight">{t('nav.profile')}</CardTitle>
            <div className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full bg-gold/10 text-gold border border-gold/20">
              <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
              <p className="text-sm font-black uppercase tracking-wider">{roleLabel}</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-8 pb-10">
            <div className="grid gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-bold text-primary/80 ms-1 uppercase tracking-wider">{t('auth.email')}</Label>
                <div className="relative">
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="h-14 rounded-2xl border-2 border-border/20 bg-slate-50/50 text-slate-500 font-bold opacity-100 cursor-not-allowed"
                  />
                  <div className="absolute inset-y-0 end-4 flex items-center pointer-events-none opacity-20">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-bold text-primary/80 ms-1 uppercase tracking-wider">{t('auth.full_name')}</Label>
                <Input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder={language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                  className="h-14 rounded-2xl border-2 border-border/30 bg-white shadow-sm focus-visible:ring-primary/10 focus-visible:border-primary/40 transition-all font-bold text-primary"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-bold text-primary/80 ms-1 uppercase tracking-wider">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</Label>
                <Input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+964..."
                  className="h-14 rounded-2xl border-2 border-border/30 bg-white shadow-sm focus-visible:ring-primary/10 focus-visible:border-primary/40 transition-all font-bold text-primary"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSave}
                className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/95 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    {t('common.loading')}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{t('common.save')}</span>
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
