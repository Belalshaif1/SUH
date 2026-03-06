import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import apiClient from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Shield, Save } from 'lucide-react';

interface Permission {
  id: string;
  role: string;
  permission_key: string;
  is_enabled: boolean;
}

const PERMISSION_LABELS: Record<string, Record<string, string>> = {
  manage_universities: { ar: 'إدارة الجامعات', en: 'Manage Universities' },
  manage_colleges: { ar: 'إدارة الكليات', en: 'Manage Colleges' },
  manage_departments: { ar: 'إدارة الأقسام', en: 'Manage Departments' },
  manage_users: { ar: 'إدارة المستخدمين', en: 'Manage Users' },
  manage_announcements: { ar: 'إدارة الإعلانات', en: 'Manage Announcements' },
  manage_jobs: { ar: 'إدارة الوظائف', en: 'Manage Jobs' },
  manage_research: { ar: 'إدارة البحوث', en: 'Manage Research' },
  manage_graduates: { ar: 'إدارة الخريجين', en: 'Manage Graduates' },
  manage_fees: { ar: 'إدارة الرسوم', en: 'Manage Fees' },
  view_reports: { ar: 'عرض التقارير', en: 'View Reports' },
  advanced_settings: { ar: 'الإعدادات المتقدمة', en: 'Advanced Settings' },
};

const ROLE_LABELS: Record<string, Record<string, string>> = {
  super_admin: { ar: 'مدير النظام', en: 'Super Admin' },
  university_admin: { ar: 'مدير جامعة', en: 'University Admin' },
  college_admin: { ar: 'مدير كلية', en: 'College Admin' },
  department_admin: { ar: 'مدير قسم', en: 'Department Admin' },
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-destructive/10 text-destructive border-destructive/30',
  university_admin: 'bg-accent/10 text-accent-foreground border-accent/30',
  college_admin: 'bg-primary/10 text-primary border-primary/30',
  department_admin: 'bg-muted text-muted-foreground border-border',
};

const RolePermissions: React.FC = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [modified, setModified] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isAr = language === 'ar';

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const data = await apiClient('/permissions');
      if (data) setPermissions(data as Permission[]);
    } catch (err: any) {
      console.error('Fetch permissions error:', err);
    }
    setLoading(false);
  };

  const handleToggle = (id: string) => {
    setPermissions(prev =>
      prev.map(p => p.id === id ? { ...p, is_enabled: !p.is_enabled } : p)
    );
    setModified(prev => new Set(prev).add(id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const toUpdate = permissions.filter(p => modified.has(p.id));
      await apiClient('/permissions', {
        method: 'PUT',
        body: JSON.stringify(toUpdate)
      });
      setModified(new Set());
      toast({ title: isAr ? 'تم حفظ الصلاحيات' : 'Permissions saved' });
    } catch (err: any) {
      console.error('Save permissions error:', err);
      toast({ title: isAr ? 'فشل حفظ الصلاحيات' : 'Failed to save permissions', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const roles = ['super_admin', 'university_admin', 'college_admin', 'department_admin'];
  const permissionKeys = Object.keys(PERMISSION_LABELS);

  const getPermission = (role: string, key: string) =>
    permissions.find(p => p.role === role && p.permission_key === key);

  const getEnabledCount = (role: string) =>
    permissions.filter(p => p.role === role && p.is_enabled).length;

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">{isAr ? 'جاري التحميل...' : 'Loading...'}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Shield className="h-5 w-5 text-accent" />
          {isAr ? 'الأدوار والصلاحيات' : 'Roles & Permissions'}
        </h2>
        {modified.size > 0 && (
          <Button onClick={handleSave} disabled={saving} className="bg-accent text-accent-foreground">
            <Save className="h-4 w-4 me-1" />
            {saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ التعديلات' : 'Save Changes')}
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {roles.map(role => (
          <Card key={role} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {ROLE_LABELS[role]?.[language] || role}
                </CardTitle>
                <Badge className={`text-xs ${ROLE_COLORS[role]}`}>
                  {isAr ? 'مسؤول' : 'Admin'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {getEnabledCount(role)} / {permissionKeys.length} {isAr ? 'صلاحية مفعّلة' : 'enabled'}
              </p>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {permissionKeys.map(key => {
                const perm = getPermission(role, key);
                if (!perm) return null;
                const isSuperAdmin = role === 'super_admin';
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm">{PERMISSION_LABELS[key]?.[language] || key}</span>
                    <Switch
                      checked={perm.is_enabled}
                      onCheckedChange={() => handleToggle(perm.id)}
                      disabled={isSuperAdmin}
                      className="data-[state=checked]:bg-accent"
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RolePermissions;
