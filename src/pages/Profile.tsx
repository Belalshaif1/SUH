import React, { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/apiClient';
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
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploading(true);

    // In local server, we would normally use a separate upload endpoint
    // For now, let's assume we can pass the file or skip avatar upload for now 
    // since we need a backend endpoint for multi-part upload.
    // I will use a simple message for now.
    toast({
      title: language === 'ar' ? 'تحميل الصور غير متاح حالياً' : 'Image upload is not available yet',
      description: language === 'ar' ? 'سيتم تفعيل هذه الميزة قريباً' : 'This feature will be enabled soon'
    });
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await apiClient('/auth/update', {
        method: 'PUT',
        body: JSON.stringify({ full_name: fullName, phone, avatar_url: profile?.avatar_url }),
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
    <div className="container mx-auto max-w-lg px-4 py-8 animate-fade-in">
      <Card>
        <CardHeader className="text-center">
          <div className="relative mx-auto mb-4">
            <Avatar className="h-24 w-24 mx-auto">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="avatar" />}
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-1/2 translate-x-6 translate-y-1 flex h-8 w-8 items-center justify-center rounded-full bg-gold text-gold-foreground shadow-md hover:opacity-90 transition-opacity"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <CardTitle>{t('nav.profile')}</CardTitle>
          <p className="text-sm text-gold font-semibold">{roleLabel}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('auth.email')}</Label>
            <Input value={user?.email || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label>{t('auth.full_name')}</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{language === 'ar' ? 'الهاتف' : 'Phone'}</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <Button onClick={handleSave} className="w-full bg-gold text-gold-foreground" disabled={loading}>
            {loading ? t('common.loading') : t('common.save')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
