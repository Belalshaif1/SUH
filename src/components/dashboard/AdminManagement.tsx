/**
 * @file src/components/dashboard/AdminManagement.tsx
 * @description Manages admin role accounts (create, edit, toggle, delete, password reset,
 *              and per-user permission overrides). Scope-aware: a university admin can only
 *              manage admins within their own university; super_admin has full control.
 */

import React, { useEffect, useState } from 'react'; // State for lists/forms, Effect for initial fetch
import { useLanguage } from '@/contexts/LanguageContext'; // Language + AR/EN labels
import { useAuth }     from '@/contexts/AuthContext';     // Current user auth + permissions
import apiClient       from '@/lib/apiClient';            // Authenticated HTTP client
import { Card, CardContent } from '@/components/ui/card'; // Card layout
import { Button }   from '@/components/ui/button';        // Buttons
import { Input }    from '@/components/ui/input';         // Form inputs
import { Label }    from '@/components/ui/label';         // Form labels
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';                         // Dropdown selectors
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';                         // Modal dialogs
import { Badge }    from '@/components/ui/badge';         // Role badge
import { useToast } from '@/hooks/use-toast';             // Toasts
import {
    Plus, Shield, ShieldOff, KeyRound, UserCog, Trash2, Edit
} from 'lucide-react';                                   // Icons

// ─── Types ────────────────────────────────────────────────────────────────

/** Shape of a record from GET /api/admins */
interface AdminRole {
    id:            string;        // Primary key UUID
    email:         string;        // Login email
    full_name:     string | null; // Display name
    role:          string;        // Role slug (super_admin / university_admin / college_admin / department_admin)
    university_id: string | null; // University scope (null for super_admin)
    college_id:    string | null; // College scope
    department_id: string | null; // Department scope
    is_active:     boolean;       // Whether this account can log in
}

/** Props from Dashboard.tsx */
interface AdminManagementProps {
    universities: any[]; // All universities for scope selectors
    colleges:     any[]; // All colleges
    departments:  any[]; // All departments
}

// ─── Component ────────────────────────────────────────────────────────────

const AdminManagement: React.FC<AdminManagementProps> = ({ universities, colleges, departments }) => {
    const { language }                       = useLanguage(); // UI language
    const { user, userRole, hasPermission }  = useAuth();    // Role + permissions
    const { toast }                          = useToast();   // Notifications

    // ── State ─────────────────────────────────────────────────────────
    const [admins,  setAdmins]  = useState<AdminRole[]>([]); // Admin list from server
    const [loading, setLoading] = useState(false);            // True during mutations

    // -- Dialog visibility ------------------------------------------------
    const [dialogOpen,          setDialogOpen]          = useState(false);        // Create dialog
    const [editDialogOpen,      setEditDialogOpen]      = useState(false);        // Edit dialog
    const [passwordDialog,      setPasswordDialog]      = useState<string|null>(null); // adminId | null
    const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);   // Permissions dialog

    // -- Create form -------------------------------------------------------
    const [form, setForm] = useState({ email:'', password:'', full_name:'', role:'', university_id:'', college_id:'', department_id:'' });

    // -- Edit form ---------------------------------------------------------
    const [editingAdmin, setEditingAdmin] = useState<AdminRole|null>(null);      // Currently edited admin
    const [editForm, setEditForm] = useState({ full_name:'', email:'', role:'', university_id:'', college_id:'', department_id:'' });

    // -- Password reset ----------------------------------------------------
    const [newPassword, setNewPassword] = useState(''); // Target new password value

    // -- Per-user permission overrides ------------------------------------
    const [selectedAdminForPermissions, setSelectedAdminForPermissions] = useState<AdminRole|null>(null);
    const [userPermissions, setUserPermissions] = useState<any[]>([]); // User's override permission rows
    const [rolePermissions, setRolePermissions] = useState<any[]>([]); // Role's default permission rows

    const isAr = language === 'ar'; // Shorthand for all AR/EN checks
    const role  = userRole?.role;   // Current user's role slug

    // ── Fetch ─────────────────────────────────────────────────────────
    const fetchAdmins = async () => {
        try {
            const data = await apiClient('/admins'); // GET /api/admins – server filters by scope
            setAdmins(data as AdminRole[]);          // Replace list with fresh data
        } catch (err: any) { toast({ title: err.message, variant:'destructive' }); }
    };

    useEffect(() => {
        if (user && userRole) fetchAdmins(); // Fetch only after auth has resolved
    }, [user, userRole]); // Re-run if auth state changes

    // ── Scope helper: resolve IDs based on caller's role ─────────────
    const scopedIds = (f: typeof form) => ({
        university_id: role === 'super_admin'
            ? (f.university_id || null) : (userRole?.university_id || null),
        college_id: (role === 'super_admin' || role === 'university_admin')
            ? (f.college_id || null) : (userRole?.college_id || null),
        department_id: f.department_id || null,
    });

    // ── Create ────────────────────────────────────────────────────────
    const handleCreate = async () => {
        if (!form.email || !form.password || !form.role) {
            toast({ title: isAr ? 'أكمل جميع الحقول المطلوبة' : 'Fill all required fields', variant:'destructive' });
            return;
        }
        setLoading(true); // Show overlay
        try {
            await apiClient('/admins', { method:'POST', body: JSON.stringify({ ...form, ...scopedIds(form) }) });
            toast({ title: isAr ? 'تم إنشاء المدير بنجاح' : 'Admin created successfully' });
            setDialogOpen(false);
            setForm({ email:'', password:'', full_name:'', role:'', university_id:'', college_id:'', department_id:'' });
            fetchAdmins();
        } catch (err: any) { toast({ title: err.message, variant:'destructive' }); }
        setLoading(false);
    };

    // ── Toggle is_active ──────────────────────────────────────────────
    const handleToggle = async (roleId: string, isActive: boolean) => {
        try {
            await apiClient(`/admins/${roleId}/toggle`, { method:'PATCH', body: JSON.stringify({ is_active: !isActive }) });
            toast({ title: isAr ? (isActive ? 'تم إيقاف الحساب' : 'تم تفعيل الحساب') : (isActive ? 'Account deactivated' : 'Account activated') });
            fetchAdmins();
        } catch (err: any) { toast({ title: err.message, variant:'destructive' }); }
    };

    // ── Delete ────────────────────────────────────────────────────────
    const handleDelete = async (roleId: string) => {
        if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا المدير؟' : 'Are you sure you want to delete this admin?')) return;
        try {
            await apiClient(`/admins/${roleId}`, { method:'DELETE' });
            toast({ title: isAr ? 'تم حذف المدير' : 'Admin deleted' });
            fetchAdmins();
        } catch (err: any) { toast({ title: err.message, variant:'destructive' }); }
    };

    // ── Open edit dialog ──────────────────────────────────────────────
    const openEditDialog = (admin: AdminRole) => {
        setEditingAdmin(admin); // Track who is being edited
        setEditForm({ full_name: admin.full_name||'', email: admin.email||'', role: admin.role, university_id: admin.university_id||'', college_id: admin.college_id||'', department_id: admin.department_id||'' });
        setEditDialogOpen(true);
    };

    // ── Save edit ─────────────────────────────────────────────────────
    const handleEdit = async () => {
        if (!editingAdmin || !editForm.role) return;
        setLoading(true);
        try {
            await apiClient(`/admins/${editingAdmin.id}`, { method:'PUT', body: JSON.stringify({ ...editForm, ...scopedIds(editForm as typeof form) }) });
            toast({ title: isAr ? 'تم تعديل الدور بنجاح' : 'Role updated successfully' });
            setEditDialogOpen(false); setEditingAdmin(null); fetchAdmins();
        } catch (err: any) { toast({ title: err.message, variant:'destructive' }); }
        setLoading(false);
    };

    // ── Password reset ────────────────────────────────────────────────
    const handleChangePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            toast({ title: isAr ? 'على الأقل 6 أحرف' : 'At least 6 characters', variant:'destructive' });
            return;
        }
        try {
            await apiClient(`/admins/${passwordDialog}/password`, { method:'POST', body: JSON.stringify({ new_password: newPassword }) });
            toast({ title: isAr ? 'تم تغيير كلمة المرور' : 'Password changed' });
            setPasswordDialog(null); setNewPassword('');
        } catch (err: any) { toast({ title: err.message, variant:'destructive' }); }
    };

    // ── Open permissions dialog ──────────────────────────────────────
    const openPermissionsDialog = async (admin: AdminRole) => {
        setSelectedAdminForPermissions(admin);
        try {
            const data: any = await apiClient(`/permissions/user/${admin.id}`); // GET overrides + role defaults
            setRolePermissions(data.role_permissions || []); // Default permissions from role config
            setUserPermissions(data.overrides        || []); // Personal overrides for this admin
            setPermissionsDialogOpen(true);
        } catch (err: any) { toast({ title: err.message, variant:'destructive' }); }
    };

    // ── Save permission overrides ────────────────────────────────────
    const saveUserPermissions = async () => {
        if (!selectedAdminForPermissions) return;
        setLoading(true);
        try {
            await apiClient(`/permissions/user/${selectedAdminForPermissions.id}`, { method:'PUT', body: JSON.stringify({ overrides: userPermissions }) });
            toast({ title: isAr ? 'تم حفظ الصلاحيات بنجاح' : 'Permissions saved successfully' });
        } catch (err: any) { toast({ title: err.message, variant:'destructive' }); }
        setLoading(false);
    };

    // ── Toggle single permission override locally ────────────────────
    const handlePermissionToggle = (key: string, enabled: boolean) => {
        const existing = userPermissions.find(p => p.permission_key === key); // Check if override exists
        setUserPermissions(existing
            ? userPermissions.map(p => p.permission_key === key ? { ...p, is_enabled: enabled ? 1 : 0 } : p) // Update
            : [...userPermissions, { permission_key: key, is_enabled: enabled ? 1 : 0 }]);                   // Create
    };

    // ── Resolve effective permission from override then role default ──
    const getPermissionStatus = (key: string): boolean => {
        const override = userPermissions.find(p => p.permission_key === key); // User override takes priority
        if (override) return override.is_enabled === 1 || override.is_enabled === true;
        const roleP = rolePermissions.find(p => p.permission_key === key);   // Fall back to role default
        return roleP ? (roleP.is_enabled === 1 || roleP.is_enabled === true) : false;
    };

    // ── Localised role display name ──────────────────────────────────
    const getRoleName = (r: string) => ({
        super_admin:      { ar:'مدير الموقع',  en:'Super Admin' },
        university_admin: { ar:'مدير جامعة',   en:'University Admin' },
        college_admin:    { ar:'مدير كلية',    en:'College Admin' },
        department_admin: { ar:'مدير قسم',     en:'Department Admin' },
    })[r as keyof object]?.[language as 'ar'|'en'] || r;

    // ── Entity scope breadcrumb ──────────────────────────────────────
    const getEntityName = (admin: AdminRole): string => {
        if (admin.role === 'super_admin') return isAr ? 'إدارة الموقع كاملة' : 'Full Site Management';
        const parts: string[] = [];
        if (admin.department_id) {
            const dep = departments.find(d => d.id === admin.department_id);
            if (dep) {
                parts.push(isAr ? dep.name_ar : (dep.name_en||dep.name_ar)); // Department name
                const col = colleges.find(c => c.id === (admin.college_id||dep.college_id));
                if (col) {
                    parts.push(isAr ? col.name_ar : (col.name_en||col.name_ar)); // College name
                    const uni = universities.find(u => u.id === (admin.university_id||col.university_id));
                    if (uni) parts.push(isAr ? uni.name_ar : (uni.name_en||uni.name_ar)); // University name
                }
            }
        } else if (admin.college_id) {
            const col = colleges.find(c => c.id === admin.college_id);
            if (col) {
                parts.push(isAr ? col.name_ar : (col.name_en||col.name_ar));
                const uni = universities.find(u => u.id === (admin.university_id||col.university_id));
                if (uni) parts.push(isAr ? uni.name_ar : (uni.name_en||uni.name_ar));
            }
        } else if (admin.university_id) {
            const uni = universities.find(u => u.id === admin.university_id);
            if (uni) parts.push(isAr ? uni.name_ar : (uni.name_en||uni.name_ar));
        }
        return parts.join(' - '); // e.g. "CS dept - Engineering - State University"
    };

    // ── Roles creatable by current admin ─────────────────────────────
    const availableRoles = (): string[] => {
        if (role === 'super_admin')      return ['university_admin','college_admin','department_admin'];
        if (role === 'university_admin') return ['college_admin','department_admin'];
        if (role === 'college_admin')    return ['department_admin'];
        return []; // department_admin cannot create sub-admins
    };

    // ── Filtered dropdown options by selected parent ──────────────────
    const filtColleges = form.university_id ? colleges.filter(c => c.university_id === form.university_id) : colleges;
    const filtDepts    = form.college_id    ? departments.filter(d => d.college_id === form.college_id)   : departments;
    const editFiltColleges = editForm.university_id ? colleges.filter(c => c.university_id === editForm.university_id) : colleges;
    const editFiltDepts    = editForm.college_id    ? departments.filter(d => d.college_id === editForm.college_id)    : departments;

    // ── Reusable role + scope field renderer ─────────────────────────
    const renderRoleFields = (fs: any, set: (v: any) => void, fc: any[], fd: any[]) => (
        <>
            {/* Role selector */}
            <div className="space-y-1">
                <Label>{isAr ? 'الدور' : 'Role'} *</Label>
                <Select
                    value={fs.role}
                    disabled={editingAdmin?.id === user?.id && role !== 'super_admin'} // Prevent self-demotion
                    onValueChange={v => set({ ...fs, role:v, university_id:'', college_id:'', department_id:'' })}
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {availableRoles().map(r => (
                            <SelectItem key={r} value={r} disabled={editingAdmin?.id === user?.id && r !== editingAdmin?.role}>
                                {getRoleName(r)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* University selector — only for scoped roles when current user is super_admin */}
            {['university_admin','college_admin','department_admin'].includes(fs.role) && role === 'super_admin' && (
                <div className="space-y-1">
                    <Label>{isAr ? 'الجامعة' : 'University'}</Label>
                    <Select value={fs.university_id} disabled={editingAdmin?.id === user?.id}
                        onValueChange={v => set({ ...fs, university_id:v, college_id:'', department_id:'' })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{universities.map(u => <SelectItem key={u.id} value={u.id}>{isAr ? u.name_ar : (u.name_en||u.name_ar)}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            )}

            {/* College selector — for college_admin and department_admin */}
            {['college_admin','department_admin'].includes(fs.role) && (
                <div className="space-y-1">
                    <Label>{isAr ? 'الكلية' : 'College'}</Label>
                    <Select value={fs.college_id} disabled={editingAdmin?.id === user?.id}
                        onValueChange={v => set({ ...fs, college_id:v, department_id:'' })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{fc.map(c => <SelectItem key={c.id} value={c.id}>{isAr ? c.name_ar : (c.name_en||c.name_ar)}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            )}

            {/* Department selector — only for department_admin */}
            {fs.role === 'department_admin' && (
                <div className="space-y-1">
                    <Label>{isAr ? 'القسم' : 'Department'}</Label>
                    <Select value={fs.department_id} disabled={editingAdmin?.id === user?.id}
                        onValueChange={v => set({ ...fs, department_id:v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{fd.map(d => <SelectItem key={d.id} value={d.id}>{isAr ? d.name_ar : (d.name_en||d.name_ar)}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            )}
        </>
    );

    // ── All permission keys shown in the overrides dialog ────────────
    const PERM_KEYS = [
        'manage_universities','manage_colleges','manage_departments',
        'manage_users','manage_announcements','manage_jobs',
        'manage_research','manage_graduates','manage_fees',
        'view_reports','advanced_settings',
    ];

    // ─── Render ───────────────────────────────────────────────────────────

    return (
        <>
            {/* Global loading overlay — shown during mutations to block UI */}
            {loading && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/40 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-2xl flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-gold/30 border-t-gold rounded-full animate-spin mb-6" /> {/* Spinner */}
                        <h2 className="text-2xl font-black text-foreground mb-2">{isAr ? 'الرجاء الانتظار...' : 'Please Wait...'}</h2>
                        <p className="text-sm font-medium text-muted-foreground text-center max-w-xs">
                            {isAr ? 'جاري معالجة طلبك وتحديث البيانات في النظام' : 'Processing your request and updating system data'}
                        </p>
                    </div>
                </div>
            )}

            <div>
                {/* ── Header: title + Add Admin button ── */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <UserCog className="h-5 w-5 text-accent" /> {/* People with gear icon */}
                        {isAr ? 'إدارة المدراء' : 'Manage Admins'}
                    </h2>
                    {hasPermission('manage_users') && ( // Show Add button only for privileged users
                        <Button onClick={() => setDialogOpen(true)} className="bg-accent text-accent-foreground">
                            <Plus className="h-4 w-4 me-1" />
                            {isAr ? 'إضافة مدير' : 'Add Admin'}
                        </Button>
                    )}
                </div>

                {/* ── Admin cards grid ── */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {admins.map(admin => (
                        <Card key={admin.id} className="overflow-hidden transition-all hover:shadow-md border-border/60">
                            <CardContent className="p-0">
                                {/* Top colour bar: green = active, red = deactivated */}
                                <div className={`h-1.5 w-full ${admin.is_active ? 'bg-green-500' : 'bg-destructive'}`} />
                                <div className="p-5">
                                    {/* Avatar + name + email + role badge */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                                                <Shield className={`h-5 w-5 ${admin.is_active ? 'text-accent' : 'text-muted-foreground'}`} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-foreground leading-none mb-1">{admin.full_name || (isAr ? 'بدون اسم' : 'No name')}</h3>
                                                <p className="text-xs text-muted-foreground">{admin.email}</p>
                                            </div>
                                        </div>
                                        <Badge variant={admin.is_active ? 'secondary' : 'destructive'} className="text-[10px] h-5">{getRoleName(admin.role)}</Badge>
                                    </div>

                                    {/* Entity scope breadcrumb + active status */}
                                    <div className="space-y-3 mb-6">
                                        {getEntityName(admin) && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <div className="p-1 rounded bg-muted"><UserCog className="h-3.5 w-3.5 text-muted-foreground" /></div>
                                                <span className="text-muted-foreground font-medium">{isAr ? 'يدير:' : 'Manages:'}</span>
                                                <span className="text-foreground font-semibold">{getEntityName(admin)}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <div className={`h-2 w-2 rounded-full ${admin.is_active ? 'bg-green-500' : 'bg-destructive'}`} />
                                            <span>{admin.is_active ? (isAr ? 'الحساب مفعّل' : 'Account Active') : (isAr ? 'الحساب معطل' : 'Account Disabled')}</span>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                        <div className="flex gap-1">
                                            {/* Edit — requires manage_users permission */}
                                            {hasPermission('manage_users') && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => openEditDialog(admin)} title={isAr ? 'تعديل' : 'Edit'}>
                                                    <Edit className="h-4 w-4 text-primary" />
                                                </Button>
                                            )}
                                            {/* Custom permissions — super_admin only */}
                                            {role === 'super_admin' && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => openPermissionsDialog(admin)} title={isAr ? 'الصلاحيات' : 'Permissions'}>
                                                    <Shield className="h-4 w-4 text-accent" />
                                                </Button>
                                            )}
                                            {/* Toggle active/inactive — not for own account */}
                                            {hasPermission('manage_users') && admin.id !== user?.id && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleToggle(admin.id, admin.is_active)}
                                                    title={admin.is_active ? (isAr ? 'إيقاف' : 'Deactivate') : (isAr ? 'تفعيل' : 'Activate')}>
                                                    {admin.is_active ? <ShieldOff className="h-4 w-4 text-destructive" /> : <Shield className="h-4 w-4 text-green-600" />}
                                                </Button>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            {/* Password reset button */}
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => { setPasswordDialog(admin.id); setNewPassword(''); }} title={isAr ? 'تغيير كلمة المرور' : 'Change Password'}>
                                                <KeyRound className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                            {/* Delete — not for own account */}
                                            {hasPermission('manage_users') && admin.id !== user?.id && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-destructive/10" onClick={() => handleDelete(admin.id)} title={isAr ? 'حذف' : 'Delete'}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Empty state */}
                    {admins.length === 0 && (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center bg-muted/20 rounded-2xl border border-dashed border-border/60">
                            <UserCog className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                            <p className="text-muted-foreground font-medium">{isAr ? 'لا يوجد مدراء لعرضهم' : 'No admins found to display'}</p>
                        </div>
                    )}
                </div>

                {/* ── Create Admin Dialog ── */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-h-[80vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>{isAr ? 'إضافة مدير جديد' : 'Add New Admin'}</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <Label>{isAr ? 'الاسم الكامل' : 'Full Name'}</Label>
                                <Input placeholder={isAr ? 'أدخل الاسم الكامل...' : "Enter full name..."} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <Label>{isAr ? 'البريد الإلكتروني' : 'Email'} *</Label>
                                <Input type="email" placeholder="admin@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <Label>{isAr ? 'كلمة المرور' : 'Password'} *</Label>
                                <Input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                            </div>
                            {renderRoleFields(form, setForm, filtColleges, filtDepts)}
                            <div className="flex gap-2 justify-end pt-4 border-t">
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
                                <Button onClick={handleCreate} disabled={loading} className="bg-accent text-accent-foreground">
                                    {loading ? (isAr ? 'جاري الإنشاء...' : 'Creating...') : (isAr ? 'إنشاء المسؤول' : 'Create Admin')}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* ── Edit Admin Dialog ── */}
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogContent className="max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{isAr ? 'تعديل بيانات المسؤول' : 'Edit Admin Details'}</DialogTitle>
                            {editingAdmin && getEntityName(editingAdmin) && (
                                <div className="flex items-center gap-2 text-sm text-primary font-medium mt-1">
                                    <Shield className="h-4 w-4" />
                                    <span>{isAr ? 'يدير:' : 'Manages:'} {getEntityName(editingAdmin)}</span>
                                </div>
                            )}
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <Label>{isAr ? 'الاسم الكامل' : 'Full Name'}</Label>
                                <Input value={editForm.full_name} onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))} disabled={editingAdmin?.id === user?.id && role !== 'super_admin'} />
                            </div>
                            <div className="space-y-1">
                                <Label>{isAr ? 'البريد الإلكتروني' : 'Email Address'}</Label>
                                <Input type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
                            </div>
                            <div className="pt-2 border-t mt-4">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Shield className="h-3 w-3" />
                                    {isAr ? 'الصلاحيات والنطاق الإداري' : 'Role & Administrative Scope'}
                                </p>
                                {renderRoleFields(editForm, setEditForm, editFiltColleges, editFiltDepts)}
                            </div>
                            <div className="flex gap-2 justify-end pt-4 border-t">
                                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
                                <Button onClick={handleEdit} disabled={loading} className="bg-accent text-accent-foreground">
                                    {loading ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ التعديلات' : 'Save Changes')}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* ── Change Password Dialog ── */}
                <Dialog open={!!passwordDialog} onOpenChange={() => setPasswordDialog(null)}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>{isAr ? 'تغيير كلمة المرور' : 'Change Password'}</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <Label>{isAr ? 'كلمة المرور الجديدة' : 'New Password'}</Label>
                                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => setPasswordDialog(null)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
                                <Button onClick={handleChangePassword} className="bg-accent text-accent-foreground">{isAr ? 'تغيير' : 'Change'}</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* ── Per-user Permissions Override Dialog ── */}
                <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
                    <DialogContent className="max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {isAr ? `صلاحيات ${selectedAdminForPermissions?.full_name}` : `Permissions for ${selectedAdminForPermissions?.full_name}`}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-4">
                                {PERM_KEYS.map(perm => (
                                    <div key={perm} className="flex items-center justify-between p-2 border rounded-lg">
                                        <span className="text-sm font-medium">{perm.replace(/_/g, ' ').toUpperCase()}</span>
                                        <Button
                                            variant={getPermissionStatus(perm) ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => handlePermissionToggle(perm, !getPermissionStatus(perm))} // Flip the state
                                            className={getPermissionStatus(perm) ? 'bg-green-600 hover:bg-green-700' : ''}
                                        >
                                            {getPermissionStatus(perm) ? (isAr ? 'مسموح' : 'Allowed') : (isAr ? 'ممنوع' : 'Blocked')}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 justify-end sticky bottom-0 bg-background pt-4 border-t mt-4">
                                <Button variant="outline" onClick={() => setPermissionsDialogOpen(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
                                <Button onClick={saveUserPermissions} disabled={loading} className="bg-accent text-accent-foreground">
                                    {loading ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ الصلاحيات' : 'Save Permissions')}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
};

export default AdminManagement;
