/**
 * @file src/components/dashboard/RolePermissions.tsx
 * @description Displays a grid of cards (one per admin role) listing all permissions
 *              as on/off switches. Changes are tracked locally until the admin clicks
 *              "Save Changes". Only modified permissions are sent to the server on save.
 *              super_admin switches are disabled since that role always has full access.
 */

import React, { useEffect, useState } from 'react'; // State for permissions list, loading, and modified set; Effect for initial fetch
import { useLanguage } from '@/contexts/LanguageContext'; // Language for all AR/EN labels
import apiClient from '@/lib/apiClient';                  // Authenticated HTTP client
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Card layout per role
import { Switch } from '@/components/ui/switch';  // Toggle switch for each permission
import { Badge }  from '@/components/ui/badge';   // Role badge in the card header
import { Button } from '@/components/ui/button';  // Save Changes button in the header bar
import { useToast } from '@/hooks/use-toast';     // Toast notifications
import { Shield, Save } from 'lucide-react';       // Shield for the section icon, Save for the button

// ─── Types ────────────────────────────────────────────────────────────────

/** A single permission row from the server */
interface Permission {
    id:             string;  // Primary key UUID
    role:           string;  // Role slug this permission belongs to
    permission_key: string;  // The permission identifier (e.g. 'manage_users')
    is_enabled:     boolean; // Whether this permission is currently enabled for the role
}

// ─── Static lookup tables ─────────────────────────────────────────────────

/** Localised labels for each permission key */
const PERMISSION_LABELS: Record<string, Record<string, string>> = {
    manage_universities: { ar: 'إدارة الجامعات',  en: 'Manage Universities' },
    manage_colleges:     { ar: 'إدارة الكليات',   en: 'Manage Colleges' },
    manage_departments:  { ar: 'إدارة الأقسام',   en: 'Manage Departments' },
    manage_users:        { ar: 'إدارة المستخدمين', en: 'Manage Users' },
    manage_announcements:{ ar: 'إدارة الإعلانات', en: 'Manage Announcements' },
    manage_jobs:         { ar: 'إدارة الوظائف',   en: 'Manage Jobs' },
    manage_research:     { ar: 'إدارة البحوث',    en: 'Manage Research' },
    manage_graduates:    { ar: 'إدارة الخريجين',  en: 'Manage Graduates' },
    manage_fees:         { ar: 'إدارة الرسوم',    en: 'Manage Fees' },
    view_reports:        { ar: 'عرض التقارير',    en: 'View Reports' },
    advanced_settings:   { ar: 'الإعدادات المتقدمة', en: 'Advanced Settings' },
};

/** Localised labels for each role slug */
const ROLE_LABELS: Record<string, Record<string, string>> = {
    super_admin:      { ar: 'مدير النظام', en: 'Super Admin' },
    university_admin: { ar: 'مدير جامعة',  en: 'University Admin' },
    college_admin:    { ar: 'مدير كلية',   en: 'College Admin' },
    department_admin: { ar: 'مدير قسم',    en: 'Department Admin' },
};

/** Tailwind badge colour classes per role */
const ROLE_COLORS: Record<string, string> = {
    super_admin:      'bg-destructive/10 text-destructive border-destructive/30',
    university_admin: 'bg-accent/10 text-accent-foreground border-accent/30',
    college_admin:    'bg-primary/10 text-primary border-primary/30',
    department_admin: 'bg-muted text-muted-foreground border-border',
};

// ─── Component ────────────────────────────────────────────────────────────

const RolePermissions: React.FC = () => {
    const { language } = useLanguage(); // Current UI language
    const { toast }    = useToast();    // Toast notification system

    const [permissions, setPermissions] = useState<Permission[]>([]); // All role permission rows
    const [modified,    setModified]    = useState<Set<string>>(new Set()); // IDs of permissions changed locally
    const [loading,     setLoading]     = useState(true);  // Initial fetch loading state
    const [saving,      setSaving]      = useState(false); // PUT request in-flight state

    const isAr = language === 'ar'; // Shorthand for AR/EN checks

    // ── Fetch ─────────────────────────────────────────────────────────

    useEffect(() => {
        fetchPermissions(); // Load permissions once on mount
    }, []); // Empty deps = run once

    /** fetchPermissions — retrieves all role permission rows from the server */
    const fetchPermissions = async (): Promise<void> => {
        try {
            const data = await apiClient('/permissions'); // GET /api/permissions — returns all role permission rows
            if (data) setPermissions(data as Permission[]); // Populate the list only if data was returned
        } catch (err: any) {
            console.error('Fetch permissions error:', err); // Log but don't toast — non-critical on init
        }
        setLoading(false); // Clear loading state whether the fetch succeeded or failed
    };

    // ── Toggle ────────────────────────────────────────────────────────

    /**
     * handleToggle — flips a single permission's is_enabled state locally
     * and records its ID in the `modified` set so the save button appears.
     *
     * @param id - UUID of the permission row to toggle
     */
    const handleToggle = (id: string): void => {
        setPermissions(prev =>
            prev.map(p => p.id === id ? { ...p, is_enabled: !p.is_enabled } : p) // Flip the target, leave others unchanged
        );
        setModified(prev => new Set(prev).add(id)); // Mark this permission as locally modified
    };

    // ── Save ──────────────────────────────────────────────────────────

    /**
     * handleSave — sends only the modified permission rows to the server via PUT.
     * Clears the modified set on success so the save button hides again.
     */
    const handleSave = async (): Promise<void> => {
        setSaving(true); // Disable the Save button during the request
        try {
            const toUpdate = permissions.filter(p => modified.has(p.id)); // Only send rows that were changed
            await apiClient('/permissions', {
                method: 'PUT',
                body:   JSON.stringify(toUpdate), // Array of permission rows with updated is_enabled values
            });
            setModified(new Set()); // Clear the diff set after a successful save
            toast({ title: isAr ? 'تم حفظ الصلاحيات' : 'Permissions saved' });
        } catch (err: any) {
            console.error('Save permissions error:', err);
            toast({
                title:       isAr ? 'فشل حفظ الصلاحيات' : 'Failed to save permissions',
                description: err.message,
                variant:     'destructive',
            });
        }
        setSaving(false); // Re-enable the Save button
    };

    // ── Data helpers ──────────────────────────────────────────────────

    /** All role slugs that will be shown as cards */
    const roles = ['super_admin','university_admin','college_admin','department_admin'];

    /** All permission key strings (derived from the lookup table) */
    const permissionKeys = Object.keys(PERMISSION_LABELS);

    /**
     * getPermission — finds the permission row for a specific role + key combination.
     *
     * @param role - Role slug
     * @param key  - Permission key string
     * @returns The matching Permission row or undefined if not found
     */
    const getPermission = (role: string, key: string): Permission | undefined =>
        permissions.find(p => p.role === role && p.permission_key === key);

    /**
     * getEnabledCount — counts how many permissions are currently enabled for a given role.
     *
     * @param role - Role slug to count for
     * @returns Number of enabled permissions
     */
    const getEnabledCount = (role: string): number =>
        permissions.filter(p => p.role === role && p.is_enabled).length;

    // ── Render ────────────────────────────────────────────────────────

    // Loading state — simple text in the centre of the section
    if (loading) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                {isAr ? 'جاري التحميل...' : 'Loading...'}
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* ── Section header + conditional Save button ── */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Shield className="h-5 w-5 text-accent" /> {/* Shield icon for the permissions section */}
                    {isAr ? 'الأدوار والصلاحيات' : 'Roles & Permissions'}
                </h2>
                {/* Save button — only visible when there are unsaved local changes */}
                {modified.size > 0 && (
                    <Button onClick={handleSave} disabled={saving} className="bg-accent text-accent-foreground">
                        <Save className="h-4 w-4 me-1" /> {/* Save icon */}
                        {saving
                            ? (isAr ? 'جاري الحفظ...' : 'Saving...')   // In-flight label
                            : (isAr ? 'حفظ التعديلات' : 'Save Changes') // Idle label
                        }
                    </Button>
                )}
            </div>

            {/* ── Role cards grid — one card per role ── */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {roles.map(role => (
                    <Card key={role} className="overflow-hidden">
                        {/* Card header: role name + enabled count + role badge */}
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">
                                    {ROLE_LABELS[role]?.[language] || role} {/* Localised role name */}
                                </CardTitle>
                                {/* Colour-coded badge per role hierarchy */}
                                <Badge className={`text-xs ${ROLE_COLORS[role]}`}>
                                    {isAr ? 'مسؤول' : 'Admin'}
                                </Badge>
                            </div>
                            {/* "X / 11 enabled" counter */}
                            <p className="text-xs text-muted-foreground">
                                {getEnabledCount(role)} / {permissionKeys.length}{' '}
                                {isAr ? 'صلاحية مفعّلة' : 'enabled'}
                            </p>
                        </CardHeader>

                        {/* Card body: one switch row per permission */}
                        <CardContent className="space-y-3 pt-0">
                            {permissionKeys.map(key => {
                                const perm = getPermission(role, key); // Look up this role's row for this key
                                if (!perm) return null;                // Skip if the server didn't return a row
                                const isSuperAdmin = role === 'super_admin'; // super_admin is always fully enabled
                                return (
                                    <div key={key} className="flex items-center justify-between">
                                        {/* Permission label */}
                                        <span className="text-sm">
                                            {PERMISSION_LABELS[key]?.[language] || key}
                                        </span>
                                        {/* Switch — disabled for super_admin (always on) */}
                                        <Switch
                                            checked={perm.is_enabled}             // Current local state
                                            onCheckedChange={() => handleToggle(perm.id)} // Toggle on click
                                            disabled={isSuperAdmin}               // super_admin switches are read-only
                                            className="data-[state=checked]:bg-accent" // Accent colour when on
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

export default RolePermissions; // Default export to match Dashboard.tsx import
