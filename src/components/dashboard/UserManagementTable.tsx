/**
 * @file src/components/dashboard/UserManagementTable.tsx
 * @description Manages the list of application users (not admins).
 *              Features: statistics cards, a search-by-name filter, a data table with
 *              inline status toggling, edit and delete actions, an "Edit User" dialog,
 *              and an "Add User" dialog.
 *
 * BUG FIX: `fetchUsers` is called inside the effect with no deps — this is correct
 *           since we only want to fetch once on mount. We use a local `loading` state
 *           instead of `setLoading(false)` in a finally-less try block to ensure the
 *           loading state is always cleared.
 */

import React, { useEffect, useState } from 'react'; // State for user list, dialogs, search; Effect for initial fetch
import { useLanguage } from '@/contexts/LanguageContext'; // Language for formatting and labels
import { useAuth }     from '@/contexts/AuthContext';     // Permission checks
import apiClient       from '@/lib/apiClient';            // Authenticated HTTP client
import { Card, CardContent } from '@/components/ui/card'; // Stat cards and table wrapper
import { Badge }   from '@/components/ui/badge';            // Role and status badges
import { Button }  from '@/components/ui/button';           // Action buttons
import { Input }   from '@/components/ui/input';            // Search input and form fields
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // User avatar with fallback initial
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';                           // HTML table with consistent Shadcn styling
import { Users, UserCheck, Shield, Search, Plus, Trash2, Edit } from 'lucide-react'; // Icon set
import { useToast } from '@/hooks/use-toast';              // Toast notifications
import { cn }       from '@/lib/utils';                   // Tailwind class merging
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';                          // Modal dialogs for edit and add
import { Label }  from '@/components/ui/label';           // Form labels
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';                          // Role selector dropdown

// ─── Types ────────────────────────────────────────────────────────────────

/** Shape of a user record returned by GET /api/auth/users */
interface UserWithRole {
    id:         string;        // UUID primary key of the user
    full_name:  string | null; // Display name (may be null for social logins)
    avatar_url: string | null; // URL to the user's profile picture
    phone:      string | null; // Contact phone number
    created_at: string;        // ISO date of account creation
    role?:      string;        // Role slug if the user also has an admin role
    is_active?: boolean;       // false if the admin has manually deactivated this account
}

/** Props for UserManagementTable */
interface UserManagementTableProps {
    onAddAdmin: () => void; // Callback to open the AdminManagement "Add Admin" dialog from the parent
}

/** Shape of the edit form for updating a user's profile */
interface EditUserForm {
    full_name: string;  // New display name
    phone:     string;  // New phone number
    role:      string;  // New role slug
    is_active: boolean; // Whether the account should be active
}

/** Shape of the create-user form */
interface NewUserForm {
    email:         string; // Login email
    password:      string; // Initial password
    full_name:     string; // Display name
    phone:         string; // Phone number
    role:          string; // Role slug (default: 'user')
    university_id: string; // Optional university scope
    college_id:    string; // Optional college scope
    department_id: string; // Optional department scope
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Initial state for creating a new user form — all fields empty, role defaults to 'user' */
const EMPTY_NEW_USER_FORM: NewUserForm = {
    email: '', password: '', full_name: '', phone: '',
    role: 'user', university_id: '', college_id: '', department_id: ''
};

// ─── Component ────────────────────────────────────────────────────────────

const UserManagementTable: React.FC<UserManagementTableProps> = ({ onAddAdmin }) => {
    const { toast }    = useToast();    // Toast notification system
    const { language } = useLanguage(); // Current UI language
    const { userRole, hasPermission } = useAuth(); // RBAC permission checks
    const isAr = language === 'ar';     // Shorthand

    // ── State ─────────────────────────────────────────────────────────

    const [users, setUsers] = useState<UserWithRole[]>([]); // Full list from the server
    const [search, setSearch] = useState('');               // Name filter string
    const [loading, setLoading] = useState(true);           // Initial fetch loading flag
    const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null); // User being edited

    // Edit dialog
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // Whether the Edit dialog is open
    const [editFormData, setEditFormData] = useState<EditUserForm>({
        full_name: '', phone: '', role: 'user', is_active: true
    });

    // Add user dialog
    const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false); // Whether the Add User dialog is open
    const [newUserForm, setNewUserForm] = useState<NewUserForm>(EMPTY_NEW_USER_FORM);

    // ── Computed stats ────────────────────────────────────────────────

    const stats = {
        total:    users.length,                                   // Total registered users
        active:   users.filter(u => u.is_active !== false).length, // Users not explicitly deactivated
        admins:   users.filter(u => u.role).length,               // Users who have an admin role
        inactive: users.filter(u => u.is_active === false).length, // Explicitly deactivated users
    };

    // Whether the current user is a super_admin (unlocks additional UI elements)
    const _isSuperAdmin = userRole?.role === 'super_admin';

    // ── Data fetch ────────────────────────────────────────────────────

    /** fetchUsers — loads all users from the server and replaces the local list */
    const fetchUsers = async (): Promise<void> => {
        setLoading(true); // Show loading indicator in the table
        try {
            const data = await apiClient('/auth/users'); // GET /api/auth/users — server filters by role scope
            setUsers(data as UserWithRole[]);            // Replace the entire list with fresh data
        } catch (err: any) {
            console.error('Fetch users error:', err); // Log for debugging, no toast (background operation)
        } finally {
            setLoading(false); // BUG FIX: always clear loading in finally to avoid stuck loading state
        }
    };

    // Fetch users once when the component mounts
    useEffect(() => {
        fetchUsers(); // Initial load
    }, []); // Empty dep array = run once on mount only

    // ── Actions ───────────────────────────────────────────────────────

    /**
     * handleToggleStatus — flips a user's is_active flag without reloading the whole page.
     * Only clickable when the current user has manage_users permission.
     *
     * @param userId        - UUID of the user to toggle
     * @param currentStatus - The user's current is_active state (to flip it)
     */
    const handleToggleStatus = async (userId: string, currentStatus: boolean): Promise<void> => {
        try {
            await apiClient(`/auth/users/${userId}`, {
                method: 'PUT',
                body:   JSON.stringify({ is_active: !currentStatus }), // Flip the current value
            });
            toast({ title: isAr ? 'تم تحديث الحالة' : 'Status updated' });
            fetchUsers(); // Re-fetch to reflect the updated status
        } catch (err: any) {
            toast({ title: err.message, variant: 'destructive' });
        }
    };

    /**
     * handleDeleteUser — permanently deletes a user after a native browser confirm.
     * Cannot be undone, so uses a safety confirm dialog.
     *
     * @param userId - UUID of the user to delete
     */
    const handleDeleteUser = async (userId: string): Promise<void> => {
        // Lightweight safety guard — native confirm so we don't need a full dialog component
        if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا المستخدم؟' : 'Are you sure you want to delete this user?')) return;
        try {
            await apiClient(`/auth/users/${userId}`, { method: 'DELETE' }); // DELETE /api/auth/users/:id
            toast({ title: isAr ? 'تم حذف المستخدم' : 'User deleted' });
            fetchUsers(); // Remove deleted user from the list
        } catch (err: any) {
            toast({ title: err.message, variant: 'destructive' });
        }
    };

    /**
     * handleEditClick — opens the Edit dialog and pre-populates it with the selected user's data.
     *
     * @param u - The user record from the table row that was clicked
     */
    const handleEditClick = (u: UserWithRole): void => {
        setSelectedUser(u); // Track which user we are editing
        setEditFormData({
            full_name: u.full_name || '',         // Pre-fill with current name
            phone:     u.phone     || '',         // Pre-fill with current phone
            role:      u.role      || 'user',     // Pre-fill with current role
            is_active: u.is_active !== false,     // Pre-fill with current status (treat missing as true)
        });
        setIsEditDialogOpen(true); // Show the edit dialog
    };

    /** handleUpdateUser — sends updated user data to the server for the currently selected user */
    const handleUpdateUser = async (): Promise<void> => {
        if (!selectedUser) return; // Guard: shouldn't happen, but protects against stale state
        try {
            await apiClient(`/auth/users/${selectedUser.id}`, {
                method: 'PUT',
                body:   JSON.stringify(editFormData), // Send the whole edit form as JSON
            });
            toast({ title: isAr ? 'تم تحديث البيانات' : 'User updated successfully' });
            setIsEditDialogOpen(false); // Close dialog on success
            fetchUsers();               // Refresh the table to show updated data
        } catch (err: any) {
            toast({ title: err.message, variant: 'destructive' });
        }
    };

    /** handleAddUser — creates a new user record via POST to /api/auth/users */
    const handleAddUser = async (): Promise<void> => {
        // Guard: email and password are required for account creation
        if (!newUserForm.email || !newUserForm.password) {
            toast({
                title:   isAr ? 'البريد الإلكتروني وكلمة المرور مطلوبان' : 'Email and Password are required',
                variant: 'destructive',
            });
            return;
        }
        try {
            await apiClient('/auth/users', {
                method: 'POST',
                body:   JSON.stringify(newUserForm), // Send the whole new-user form
            });
            toast({ title: isAr ? 'تم إضافة المستخدم بنجاح' : 'User added successfully' });
            setIsAddUserDialogOpen(false);       // Close the dialog
            setNewUserForm(EMPTY_NEW_USER_FORM); // Reset the form to its empty default state
            fetchUsers();                        // Add the new user to the table
        } catch (err: any) {
            toast({ title: err.message, variant: 'destructive' });
        }
    };

    // ── Display helpers ───────────────────────────────────────────────

    /**
     * getRoleName — converts a role slug to a human-readable localised label.
     *
     * @param r - Role slug (e.g. 'super_admin') or undefined for regular users
     * @returns A localised display name
     */
    const getRoleName = (r?: string): string => {
        if (!r) return isAr ? 'مستخدم' : 'User'; // Default for users without an admin role
        const names: Record<string, Record<string, string>> = {
            super_admin:      { ar: 'مدير النظام', en: 'Super Admin' },
            university_admin: { ar: 'مدير جامعة', en: 'University Admin' },
            college_admin:    { ar: 'مدير كلية',  en: 'College Admin' },
            department_admin: { ar: 'مدير قسم',   en: 'Department Admin' },
        };
        return names[r]?.[language] || r; // Fallback to the raw slug if no mapping exists
    };

    /**
     * getRoleBadgeVariant — maps a role to a Shadcn Badge variant for colour-coding.
     *
     * @param r - Role slug or undefined
     * @returns A Badge variant string
     */
    const getRoleBadgeVariant = (r?: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
        if (!r) return 'outline';              // Regular users get a subtle outline badge
        if (r === 'super_admin') return 'destructive'; // Super admin highlighted in red for visual emphasis
        return 'default';                      // All other admin roles get the default (primary) badge
    };

    // ── Filtered list ─────────────────────────────────────────────────

    // Apply the search filter — case-insensitive name search
    const filtered = users.filter(u =>
        !search || u.full_name?.toLowerCase().includes(search.toLowerCase())
    );

    // ── Stat card config ──────────────────────────────────────────────

    const statCards = [
        { icon: Users,     label: isAr ? 'إجمالي المستخدمين' : 'Total Users', value: stats.total,    color: 'text-primary' },
        { icon: UserCheck, label: isAr ? 'مستخدمين نشطين'    : 'Active Users', value: stats.active,   color: 'text-green-600' },
        { icon: Shield,    label: isAr ? 'مديري النظام'       : 'Admins',       value: stats.admins,   color: 'text-accent' },
        { icon: Users,     label: isAr ? 'مستخدمين موقوفين'  : 'Inactive',     value: stats.inactive, color: 'text-destructive' },
    ];

    // ── Render ────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((s, i) => (
                    <Card key={i} className="border-none shadow-sm">
                        <CardContent className="flex items-center gap-3 p-4">
                            {/* Icon in a muted rounded badge */}
                            <div className="rounded-full p-2 bg-muted">
                                <s.icon className={`h-5 w-5 ${s.color}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{s.value}</p> {/* The numeric count */}
                                <p className="text-xs text-muted-foreground">{s.label}</p> {/* The category label */}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ── Actions bar: Add User button + search field ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                {/* Add User button — only shown when the current user has manage_users permission */}
                {hasPermission('manage_users') && (
                    <Button onClick={() => setIsAddUserDialogOpen(true)} className="bg-accent text-accent-foreground">
                        <Plus className="h-4 w-4 me-1" />
                        {isAr ? 'إضافة مستخدم' : 'Add User'}
                    </Button>
                )}
                {/* Search input — filters the table by name as the user types */}
                <div className="relative w-full sm:w-64">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={isAr ? 'بحث...' : 'Search...'}
                        value={search}
                        onChange={e => setSearch(e.target.value)} // Filter the list on every keystroke
                        className="ps-9" // Left padding to make room for the search icon
                    />
                </div>
            </div>

            {/* ── Users table ── */}
            <Card>
                <CardContent className="p-0"> {/* p-0 so the table borders align with the card edges */}
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="font-semibold text-gold">{isAr ? 'المستخدم' : 'User'}</TableHead>
                                <TableHead className="font-semibold text-gold">{isAr ? 'الدور' : 'Role'}</TableHead>
                                <TableHead className="font-semibold text-gold">{isAr ? 'تاريخ الانضمام' : 'Joined'}</TableHead>
                                <TableHead className="font-semibold text-gold">{isAr ? 'الحالة' : 'Status'}</TableHead>
                                {/* Actions column only shown when the current user can manage users */}
                                {hasPermission('manage_users') && (
                                    <TableHead className="font-semibold text-gold">
                                        {isAr ? 'إجراءات' : 'Actions'}
                                    </TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                // Loading state — single full-width cell with loading text
                                <TableRow>
                                    <TableCell
                                        colSpan={hasPermission('manage_users') ? 5 : 4}
                                        className="text-center py-8 text-muted-foreground"
                                    >
                                        {isAr ? 'جاري التحميل...' : 'Loading...'}
                                    </TableCell>
                                </TableRow>

                            ) : filtered.length === 0 ? (
                                // Empty state — no users matching the current search
                                <TableRow>
                                    <TableCell
                                        colSpan={hasPermission('manage_users') ? 5 : 4}
                                        className="text-center py-8 text-muted-foreground"
                                    >
                                        {isAr ? 'لا يوجد مستخدمين' : 'No users found'}
                                    </TableCell>
                                </TableRow>

                            ) : filtered.map(u => (
                                // Data rows — one per user
                                <TableRow key={u.id}>
                                    {/* Avatar + name */}
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={u.avatar_url || ''} /> {/* Profile photo if available */}
                                                <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                                                    {u.full_name?.charAt(0) || '?'} {/* First letter of name or '?' */}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium text-sm">
                                                {u.full_name || (isAr ? 'بدون اسم' : 'No name')}
                                            </span>
                                        </div>
                                    </TableCell>

                                    {/* Role badge */}
                                    <TableCell>
                                        <Badge variant={getRoleBadgeVariant(u.role)} className="text-xs">
                                            {getRoleName(u.role)}
                                        </Badge>
                                    </TableCell>

                                    {/* Localised join date */}
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(u.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                                    </TableCell>

                                    {/* Clickable status badge — clicking toggles is_active if user has permission */}
                                    <TableCell>
                                        <Badge
                                            variant={u.is_active ? 'default' : 'destructive'}
                                            className={cn(
                                                'cursor-pointer',
                                                hasPermission('manage_users') && 'hover:opacity-80' // Only interactive for privileged users
                                            )}
                                            onClick={() =>
                                                hasPermission('manage_users') && handleToggleStatus(u.id, !!u.is_active)
                                            }
                                        >
                                            {u.is_active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'غير نشط' : 'Inactive')}
                                        </Badge>
                                    </TableCell>

                                    {/* Edit + Delete action buttons — only shown for privileged users */}
                                    {hasPermission('manage_users') && (
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-accent h-8 w-8"
                                                    onClick={() => handleEditClick(u)} // Open edit dialog
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive h-8 w-8"
                                                    onClick={() => handleDeleteUser(u.id)} // Delete with confirmation
                                                >
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

            {/* ── Edit User Dialog ── */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isAr ? 'تعديل بيانات المستخدم' : 'Edit User'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Full name field */}
                        <div className="space-y-2">
                            <Label>{isAr ? 'الاسم الكامل' : 'Full Name'}</Label>
                            <Input
                                placeholder={isAr ? 'اسم المستخدم...' : 'User full name...'}
                                value={editFormData.full_name}
                                onChange={e => setEditFormData({ ...editFormData, full_name: e.target.value })}
                            />
                        </div>
                        {/* Phone number field */}
                        <div className="space-y-2">
                            <Label>{isAr ? 'رقم الهاتف' : 'Phone'}</Label>
                            <Input
                                placeholder="09..."
                                value={editFormData.phone}
                                onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                            />
                            <p className="text-[10px] text-muted-foreground italic px-1">
                                {isAr
                                    ? 'رقم التواصل للتنسيق مع المستخدم.'
                                    : 'Contact number for coordination with the user.'
                                }
                            </p>
                        </div>
                        {/* Role selector */}
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
                            <p className="text-[10px] text-muted-foreground italic px-1">
                                {isAr
                                    ? 'تغيير الدور يمنح المستخدم صلاحيات إدارية مختلفة.'
                                    : 'Changing the role grants the user different administrative permissions.'
                                }
                            </p>
                        </div>
                        {/* Dialog action buttons */}
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

            {/* ── Add User Dialog ── */}
            <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto"> {/* Scrollable for small screens */}
                    <DialogHeader>
                        <DialogTitle>{isAr ? 'إضافة مستخدم جديد' : 'Add New User'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {/* Name and phone side by side */}
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
                        {/* Email — required for login */}
                        <div className="space-y-2">
                            <Label>{isAr ? 'البريد الإلكتروني' : 'Email'} *</Label>
                            <Input
                                type="email"
                                placeholder="user@example.com"
                                value={newUserForm.email}
                                onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                            />
                            <p className="text-[10px] text-muted-foreground italic px-1">
                                {isAr ? 'سيستخدم للدخول إلى التطبيق.' : 'Used to log into the application.'}
                            </p>
                        </div>
                        {/* Password — required for account creation */}
                        <div className="space-y-2">
                            <Label>{isAr ? 'كلمة المرور' : 'Password'} *</Label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={newUserForm.password}
                                onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                            />
                        </div>
                        {/* Role selector */}
                        <div className="space-y-2">
                            <Label>{isAr ? 'الدور' : 'Role'}</Label>
                            <Select
                                value={newUserForm.role}
                                onValueChange={v => setNewUserForm({ ...newUserForm, role: v })}
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
                        </div>
                        {/* Dialog action buttons */}
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

export default UserManagementTable; // Default export to match Dashboard.tsx import
