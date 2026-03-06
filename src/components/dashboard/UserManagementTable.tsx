import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, UserCheck, Shield, Search, Plus, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserWithRole {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  role?: string;
  is_active?: boolean;
}

interface Props {
  onAddAdmin: () => void;
}

const UserManagementTable: React.FC<Props> = ({ onAddAdmin }) => {
  const { toast } = useToast();
  const { language } = useLanguage();
  const { user, userRole, hasPermission } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    phone: '',
    role: '',
    is_active: true
  });
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'user',
    university_id: '',
    college_id: '',
    department_id: ''
  });
  const isAr = language === 'ar';

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active !== false).length,
    admins: users.filter(u => u.role).length,
    inactive: users.filter(u => u.is_active === false).length,
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const isSuperAdmin = userRole?.role === 'super_admin';

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiClient('/auth/users');
      setUsers(data as UserWithRole[]);
    } catch (err: any) {
      console.error('Fetch users error:', err);
    }
    setLoading(false);
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await apiClient(`/auth/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !currentStatus })
      });
      toast({ title: isAr ? 'تم تحديث الحالة' : 'Status updated' });
      fetchUsers();
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا المستخدم؟' : 'Are you sure you want to delete this user?')) return;
    try {
      await apiClient(`/auth/users/${userId}`, { method: 'DELETE' });
      toast({ title: isAr ? 'تم حذف المستخدم' : 'User deleted' });
      fetchUsers();
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' });
    }
  };

  const handleEditClick = (u: UserWithRole) => {
    setSelectedUser(u);
    setEditFormData({
      full_name: u.full_name || '',
      phone: u.phone || '',
      role: u.role || 'user',
      is_active: u.is_active !== false
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      await apiClient(`/auth/users/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData)
      });
      toast({ title: isAr ? 'تم تحديث البيانات' : 'User updated successfully' });
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' });
    }
  };

  const handleAddUser = async () => {
    if (!newUserForm.email || !newUserForm.password) {
      toast({ title: isAr ? 'البريد الإلكتروني وكلمة المرور مطلوبان' : 'Email and Password are required', variant: 'destructive' });
      return;
    }
    try {
      await apiClient('/auth/users', {
        method: 'POST',
        body: JSON.stringify(newUserForm)
      });
      toast({ title: isAr ? 'تم إضافة المستخدم بنجاح' : 'User added successfully' });
      setIsAddUserDialogOpen(false);
      setNewUserForm({ email: '', password: '', full_name: '', phone: '', role: 'user', university_id: '', college_id: '', department_id: '' });
      fetchUsers();
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' });
    }
  };

  const getRoleName = (r?: string) => {
    if (!r) return isAr ? 'مستخدم' : 'User';
    const names: Record<string, Record<string, string>> = {
      super_admin: { ar: 'مدير النظام', en: 'Super Admin' },
      university_admin: { ar: 'مدير جامعة', en: 'University Admin' },
      college_admin: { ar: 'مدير كلية', en: 'College Admin' },
      department_admin: { ar: 'مدير قسم', en: 'Department Admin' },
    };
    return names[r]?.[language] || r;
  };

  const getRoleBadgeVariant = (r?: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (!r) return 'outline';
    if (r === 'super_admin') return 'destructive';
    return 'default';
  };

  const filtered = users.filter(u =>
    !search || u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const statCards = [
    { icon: Users, label: isAr ? 'إجمالي المستخدمين' : 'Total Users', value: stats.total, color: 'text-primary' },
    { icon: UserCheck, label: isAr ? 'مستخدمين نشطين' : 'Active Users', value: stats.active, color: 'text-green-600' },
    { icon: Shield, label: isAr ? 'مديري النظام' : 'Admins', value: stats.admins, color: 'text-accent' },
    { icon: Users, label: isAr ? 'مستخدمين موقوفين' : 'Inactive', value: stats.inactive, color: 'text-destructive' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`rounded-full p-2 bg-muted`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {hasPermission('manage_users') && (
          <Button onClick={() => setIsAddUserDialogOpen(true)} className="bg-accent text-accent-foreground">
            <Plus className="h-4 w-4 me-1" />
            {isAr ? 'إضافة مستخدم' : 'Add User'}
          </Button>
        )}
        <div className="relative w-full sm:w-64">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isAr ? 'بحث...' : 'Search...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableCell className="font-semibold text-gold">{isAr ? 'المستخدم' : 'User'}</TableCell>
                <TableCell className="font-semibold text-gold">{isAr ? 'الدور' : 'Role'}</TableCell>
                <TableCell className="font-semibold text-gold">{isAr ? 'تاريخ الانضمام' : 'Joined'}</TableCell>
                <TableCell className="font-semibold text-gold">{isAr ? 'الحالة' : 'Status'}</TableCell>
                {hasPermission('manage_users') && <TableCell className="font-semibold text-gold">{isAr ? 'إجراءات' : 'Actions'}</TableCell>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={hasPermission('manage_users') ? 5 : 4} className="text-center py-8 text-muted-foreground">
                    {isAr ? 'جاري التحميل...' : 'Loading...'}
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={hasPermission('manage_users') ? 5 : 4} className="text-center py-8 text-muted-foreground">
                    {isAr ? 'لا يوجد مستخدمين' : 'No users found'}
                  </TableCell>
                </TableRow>
              ) : filtered.map(u => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.avatar_url || ''} />
                        <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                          {u.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{u.full_name || (isAr ? 'بدون اسم' : 'No name')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(u.role)} className="text-xs">
                      {getRoleName(u.role)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.is_active ? 'default' : 'destructive'}
                      className={cn("cursor-pointer", hasPermission('manage_users') && "hover:opacity-80")}
                      onClick={() => hasPermission('manage_users') && handleToggleStatus(u.id, !!u.is_active)}
                    >
                      {u.is_active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'غير نشط' : 'Inactive')}
                    </Badge>
                  </TableCell>
                  {hasPermission('manage_users') && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="text-accent h-8 w-8" onClick={() => handleEditClick(u)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDeleteUser(u.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? 'تعديل بيانات المستخدم' : 'Edit User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{isAr ? 'الاسم الكامل' : 'Full Name'}</Label>
              <Input
                placeholder={isAr ? 'اسم المستخدم...' : 'User full name...'}
                value={editFormData.full_name}
                onChange={e => setEditFormData({ ...editFormData, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'رقم الهاتف' : 'Phone'}</Label>
              <Input
                placeholder="09..."
                value={editFormData.phone}
                onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
              <p className="text-[10px] text-muted-foreground italic px-1">{isAr ? 'رقم التواصل للتنسيق مع المستخدم.' : 'Contact number for coordination with the user.'}</p>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'الدور' : 'Role'}</Label>
              <Select
                value={editFormData.role}
                onValueChange={v => setEditFormData({ ...editFormData, role: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{isAr ? 'مستخدم عادي' : 'Regular User'}</SelectItem>
                  <SelectItem value="department_admin">{isAr ? 'مدير قسم' : 'Department Admin'}</SelectItem>
                  <SelectItem value="college_admin">{isAr ? 'مدير كلية' : 'College Admin'}</SelectItem>
                  <SelectItem value="university_admin">{isAr ? 'مدير جامعة' : 'University Admin'}</SelectItem>
                  <SelectItem value="super_admin">{isAr ? 'مدير الموقع العام' : 'Super Admin'}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground italic px-1">{isAr ? 'تغيير الدور يمنح المستخدم صلاحيات إدارية مختلفة.' : 'Changing the role grants the user different administrative permissions.'}</p>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button onClick={handleUpdateUser} className="bg-accent text-accent-foreground">
                {isAr ? 'حفظ التغييرات' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isAr ? 'إضافة مستخدم جديد' : 'Add New User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isAr ? 'الاسم الكامل' : 'Full Name'}</Label>
                <Input
                  placeholder={isAr ? 'الاسم...' : 'Name...'}
                  value={newUserForm.full_name}
                  onChange={e => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? 'رقم الهاتف' : 'Phone'}</Label>
                <Input
                  placeholder="09..."
                  value={newUserForm.phone}
                  onChange={e => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'البريد الإلكتروني' : 'Email'} *</Label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={newUserForm.email}
                onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
              />
              <p className="text-[10px] text-muted-foreground italic px-1">{isAr ? 'سيستخدم للدخول إلى التطبيق.' : 'Used to log into the application.'}</p>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'كلمة المرور' : 'Password'} *</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newUserForm.password}
                onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'الدور' : 'Role'}</Label>
              <Select value={newUserForm.role} onValueChange={v => setNewUserForm({ ...newUserForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{isAr ? 'مستخدم عادي' : 'Regular User'}</SelectItem>
                  <SelectItem value="department_admin">{isAr ? 'مدير قسم' : 'Department Admin'}</SelectItem>
                  <SelectItem value="college_admin">{isAr ? 'مدير كلية' : 'College Admin'}</SelectItem>
                  <SelectItem value="university_admin">{isAr ? 'مدير جامعة' : 'University Admin'}</SelectItem>
                  <SelectItem value="super_admin">{isAr ? 'مدير الموقع العام' : 'Super Admin'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button onClick={handleAddUser} className="bg-accent text-accent-foreground">
                {isAr ? 'إضافة مستخدم' : 'Add User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementTable;
