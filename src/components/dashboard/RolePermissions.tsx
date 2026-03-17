import React, { useEffect, useState } from 'react'; // استيراد React ووظائف useEffect و useState من مكتبة React
import { useLanguage } from '@/contexts/LanguageContext'; // استيراد وظيفة useLanguage للتحكم في لغة التطبيق
import apiClient from '@/lib/apiClient'; // استيراد عميل الـ API لإرسال الطلبات للخادم
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // استيراد مكونات البطاقة (Card) من مكتبة واجهة المستخدم
import { Switch } from '@/components/ui/switch'; // استيراد مكون المفتاح (Switch) للتبديل بين التفعيل والتعطيل
import { Badge } from '@/components/ui/badge'; // استيراد مكون الشارة (Badge) لعرض تسميات صغيرة
import { Button } from '@/components/ui/button'; // استيراد مكون الزر (Button) للتفاعل مع المستخدم
import { useToast } from '@/hooks/use-toast'; // استيراد وظيفة useToast لعرض تنبيهات منبثقة
import { Shield, Save } from 'lucide-react'; // استيراد أيقونات الدرع والحفظ من مكتبة lucide-react

interface Permission { // تعريف واجهة بيانات (Interface) للصلاحية
  id: string; // معرف فريد للصلاحية
  role: string; // الدور المرتبط بهذه الصلاحية (مثلاً: مدير)
  permission_key: string; // مفتاح الصلاحية (مثلاً: إدارة المستخدمين)
  is_enabled: boolean; // حالة التفعيل (مفعلة أم لا)
}

const PERMISSION_LABELS: Record<string, Record<string, string>> = { // قاموس لترجمة مفاتيح الصلاحيات للغتين العربية والإنجليزية
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

const ROLE_LABELS: Record<string, Record<string, string>> = { // قاموس لترجمة أسماء الأدوار (Roles)
  super_admin: { ar: 'مدير النظام', en: 'Super Admin' },
  university_admin: { ar: 'مدير جامعة', en: 'University Admin' },
  college_admin: { ar: 'مدير كلية', en: 'College Admin' },
  department_admin: { ar: 'مدير قسم', en: 'Department Admin' },
};

const ROLE_COLORS: Record<string, string> = { // قاموس لتحديد ألوان التنسيق لكل دور
  super_admin: 'bg-destructive/10 text-destructive border-destructive/30',
  university_admin: 'bg-accent/10 text-accent-foreground border-accent/30',
  college_admin: 'bg-primary/10 text-primary border-primary/30',
  department_admin: 'bg-muted text-muted-foreground border-border',
};

const RolePermissions: React.FC = () => { // تعريف مكون React الوظيفي لإدارة صلاحيات الأدوار
  const { language } = useLanguage(); // الحصول على اللغة الحالية من السياق
  const { toast } = useToast(); // الحصول على وظيفة عرض التنبيهات
  const [permissions, setPermissions] = useState<Permission[]>([]); // حالة لتخزين قائمة الصلاحيات
  const [modified, setModified] = useState<Set<string>>(new Set()); // حالة لتتبع المعرفات التي تم تعديلها ولم تحفظ بعد
  const [loading, setLoading] = useState(true); // حالة لتتبع ما إذا كانت البيانات قيد التحميل
  const [saving, setSaving] = useState(false); // حالة لتتبع ما إذا كانت عملية الحفظ قيد التنفيذ
  const isAr = language === 'ar'; // متغير بولياني للتحقق مما إذا كانت اللغة هي العربية

  useEffect(() => { // تنفيذ وظيفة عند تحميل المكون لأول مرة
    fetchPermissions(); // استدعاء دالة جلب الصلاحيات من الخادم
  }, []); // مصفوفة الاعتمادية فارغة لضمان التنفيذ مرة واحدة فقط

  const fetchPermissions = async () => { // دالة غير متزامنة لجلب الصلاحيات
    try { // محاولة تنفيذ الطلب
      const data = await apiClient('/permissions'); // إرسال طلب GET لمسار الصلاحيات
      if (data) setPermissions(data as Permission[]); // تحديث الحالة بالبيانات المستلمة إذا وجدت
    } catch (err: any) { // معالجة الخطأ في حال فشل الطلب
      console.error('Fetch permissions error:', err); // طباعة الخطأ في لوحة التحكم
    }
    setLoading(false); // إنهاء حالة التحميل سواء نجح الطلب أو فشل
  };

  const handleToggle = (id: string) => { // دالة لتبديل حالة الصلاحية (تفعيل/تعطيل)
    setPermissions(prev => // تحديث حالة الصلاحيات
      prev.map(p => p.id === id ? { ...p, is_enabled: !p.is_enabled } : p) // عكس حالة is_enabled للصلاحية المحددة
    );
    setModified(prev => new Set(prev).add(id)); // إضافة معرف الصلاحية لقائمة التعديلات غير المحفوظة
  };

  const handleSave = async () => { // دالة غير متزامنة لحفظ التعديلات في الخادم
    setSaving(true); // بدء حالة الحفظ
    try { // محاولة إرسال البيانات
      const toUpdate = permissions.filter(p => modified.has(p.id)); // تصفية الصلاحيات التي تم تعديلها فقط
      await apiClient('/permissions', { // إرسال طلب PUT لتحديث الصلاحيات
        method: 'PUT', // تحديد طريقة الطلب
        body: JSON.stringify(toUpdate) // تحويل البيانات المعدلة إلى نص JSON
      });
      setModified(new Set()); // تفريغ قائمة التعديلات بعد النجاح
      toast({ title: isAr ? 'تم حفظ الصلاحيات' : 'Permissions saved' }); // عرض رسالة نجاح
    } catch (err: any) { // معالجة خطأ الحفظ
      console.error('Save permissions error:', err); // تسجيل الخطأ
      toast({ title: isAr ? 'فشل حفظ الصلاحيات' : 'Failed to save permissions', description: err.message, variant: 'destructive' }); // عرض رسالة فشل
    }
    setSaving(false); // إنهاء حالة الحفظ
  };

  const roles = ['super_admin', 'university_admin', 'college_admin', 'department_admin']; // قائمة الأدوار المتاحة للعرض
  const permissionKeys = Object.keys(PERMISSION_LABELS); // استخراج مفاتيح الصلاحيات من القاموس

  const getPermission = (role: string, key: string) => // دالة للبحث عن صلاحية محددة بناءً على الدور والمفتاح
    permissions.find(p => p.role === role && p.permission_key === key);

  const getEnabledCount = (role: string) => // دالة لحساب عدد الصلاحيات المفعلة لدور معين
    permissions.filter(p => p.role === role && p.is_enabled).length;

  if (loading) { // عرض رسالة تحميل إذا كانت البيانات لا تزال قيد الجلب
    return <div className="text-center py-8 text-muted-foreground">{isAr ? 'جاري التحميل...' : 'Loading...'}</div>;
  }

  return ( // واجهة المكون
    <div className="space-y-6"> {/* حاوية بتباعد عمودي */}
      <div className="flex items-center justify-between"> {/* شريط علوي يحتوي على العنوان وزر الحفظ */}
        <h2 className="text-xl font-bold flex items-center gap-2"> {/* عنوان الصفحة */}
          <Shield className="h-5 w-5 text-accent" /> {/* أيقونة الدرع */}
          {isAr ? 'الأدوار والصلاحيات' : 'Roles & Permissions'} {/* نص العنوان بناءً على اللغة */}
        </h2>
        {modified.size > 0 && ( // إظهار زر الحفظ فقط إذا كانت هناك تعديلات غير محفوظة
          <Button onClick={handleSave} disabled={saving} className="bg-accent text-accent-foreground">
            <Save className="h-4 w-4 me-1" /> {/* أيقونة الحفظ */}
            {saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ التعديلات' : 'Save Changes')} {/* نص الزر حسب الحالة */}
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"> {/* شبكة لعرض بطاقات الأدوار */}
        {roles.map(role => ( // التكرار عبر قائمة الأدوار لإنشاء بطاقة لكل دور
          <Card key={role} className="overflow-hidden"> {/* بطاقة الدور */}
            <CardHeader className="pb-3"> {/* ترويسة البطاقة */}
              <div className="flex items-center justify-between">
                <CardTitle className="text-base"> {/* اسم الدور */}
                  {ROLE_LABELS[role]?.[language] || role}
                </CardTitle>
                <Badge className={`text-xs ${ROLE_COLORS[role]}`}> {/* شارة توضح نوع الدور ولونه */}
                  {isAr ? 'مسؤول' : 'Admin'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground"> {/* إحصائية الصلاحيات المفعلة */}
                {getEnabledCount(role)} / {permissionKeys.length} {isAr ? 'صلاحية مفعّلة' : 'enabled'}
              </p>
            </CardHeader>
            <CardContent className="space-y-3 pt-0"> {/* محتوى البطاقة (قائمة الصلاحيات) */}
              {permissionKeys.map(key => { // التكرار عبر مفاتيح الصلاحيات
                const perm = getPermission(role, key); // جلب كائن الصلاحية لهذا الدور وهذا المفتاح
                if (!perm) return null; // تخطي إذا لم توجد بيانات لهذه الصلاحية
                const isSuperAdmin = role === 'super_admin'; // تحقق إذا كان الدور هو مدير نظام (لمنع تعديل صلاحياته)
                return (
                  <div key={key} className="flex items-center justify-between"> {/* سطر الصلاحية */}
                    <span className="text-sm">{PERMISSION_LABELS[key]?.[language] || key}</span> {/* اسم الصلاحية */}
                    <Switch
                      checked={perm.is_enabled} // حالة المفتاح
                      onCheckedChange={() => handleToggle(perm.id)} // حدث عند تغيير الحالة
                      disabled={isSuperAdmin} // تعطيل المفتاح لمدير النظام
                      className="data-[state=checked]:bg-accent" // لون المفتاح عند التفعيل
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

export default RolePermissions; // تصدير المكون لاستخدامه في أجزاء أخرى من التطبيق
