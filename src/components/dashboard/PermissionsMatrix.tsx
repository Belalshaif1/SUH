/**
 * @file src/components/dashboard/PermissionsMatrix.tsx
 * @description Read-only table showing the effective permissions of every admin account.
 *              Each row represents one admin; each column represents one permission.
 *              Cells show a green checkmark (granted) or a muted red X (not granted).
 *              The first column is sticky so admin identity is always visible on scroll.
 *
 * Data source: GET /api/permissions/matrix — server returns each admin with a pre-computed
 * `permissions` map of { [permission_key]: boolean } reflecting both role defaults and
 * any per-user overrides.
 */

import React, { useState, useEffect } from 'react'; // State for matrix data + search + loading; Effect for initial fetch
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card';                    // Card container with header and body
import {
    Table, TableBody, TableCell, TableHeader, TableRow
} from '@/components/ui/table';                   // Shadcn table primitives
import { Shield, Check, X, Search } from 'lucide-react'; // Icons: shield for header, Check/X for cells
import { Input }       from '@/components/ui/input';   // Search field
import { useLanguage } from '@/contexts/LanguageContext'; // Language for AR/EN labels
import apiClient       from '@/lib/apiClient';            // Authenticated HTTP client

// ─── Types ────────────────────────────────────────────────────────────────

/** Shape of one row from GET /api/permissions/matrix */
interface AdminPermissionMatrix {
    id:          string;                      // Admin's user ID
    email:       string;                      // Admin's login email (used in search)
    full_name:   string;                      // Admin's display name (used in search)
    role:        string;                      // Admin's role slug (shown under the name)
    permissions: Record<string, boolean>;     // Map of permission_key → effective grant status
}

// ─── Static list of all permission columns ────────────────────────────────

const PERMISSION_KEYS = [
    'manage_universities', 'manage_colleges', 'manage_departments',
    'manage_users', 'manage_announcements', 'manage_jobs',
    'manage_research', 'manage_graduates', 'manage_fees',
    'view_reports', 'advanced_settings',
];

// ─── Component ────────────────────────────────────────────────────────────

const PermissionsMatrix: React.FC = () => {
    const { language } = useLanguage(); // Current UI language

    const [matrix,  setMatrix]  = useState<AdminPermissionMatrix[]>([]); // Full list from server
    const [loading, setLoading] = useState(true);  // True while the initial fetch is in-flight
    const [search,  setSearch]  = useState('');    // Name/email filter string

    const isAr = language === 'ar'; // Shorthand

    // ── Fetch ─────────────────────────────────────────────────────────

    useEffect(() => {
        fetchMatrix(); // Load once on mount
    }, []); // Empty deps = run only on mount

    /** fetchMatrix — retrieves the full permissions matrix from the server */
    const fetchMatrix = async (): Promise<void> => {
        try {
            const data = await apiClient('/permissions/matrix'); // GET /api/permissions/matrix
            setMatrix(data as AdminPermissionMatrix[]);          // Replace list with server data
        } catch (err) {
            console.error('Fetch matrix error:', err); // Log but don't toast (background/read-only)
        } finally {
            setLoading(false); // Always clear loading, even on failure
        }
    };

    // ── Filter ────────────────────────────────────────────────────────

    // Case-insensitive search by admin name or email
    const filtered = matrix.filter(m => {
        const name       = (m.full_name || '').toLowerCase(); // Normalise name for comparison
        const email      = (m.email     || '').toLowerCase(); // Normalise email
        const searchTerm = (search      || '').toLowerCase(); // Normalise query
        return name.includes(searchTerm) || email.includes(searchTerm); // Match if either contains the query
    });

    // ── Render ────────────────────────────────────────────────────────

    return (
        <Card className="border-gold/20 bg-card/50 backdrop-blur-sm"> {/* Subtle gold border for visual consistency */}
            {/* ── Card header: title + description + search ── */}
            <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Shield className="h-5 w-5 text-gold" /> {/* Gold shield icon */}
                            {isAr ? 'مصفوفة الصلاحيات' : 'Permissions Matrix'}
                        </CardTitle>
                        <CardDescription>
                            {isAr
                                ? 'عرض شامل لجميع المسؤولين وصلاحياتهم الفعلية'
                                : 'Comprehensive view of all admins and their effective permissions'
                            }
                        </CardDescription>
                    </div>
                    {/* Search field — filters by admin name or email */}
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /> {/* Search icon inside field */}
                        <Input
                            placeholder={isAr ? 'بحث عن مسؤول...' : 'Search admin...'}
                            className="pl-9 border-gold/20"    // Left padding to clear the icon
                            value={search}
                            onChange={e => setSearch(e.target.value)} // Update filter on every keystroke
                        />
                    </div>
                </div>
            </CardHeader>

            {/* ── Horizontally scrollable matrix table ── */}
            <CardContent className="p-0 overflow-x-auto"> {/* overflow-x-auto for wide tables on small screens */}
                <Table>
                    {/* ── Column headers ── */}
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            {/* Sticky "Administrator" column — stays visible while scrolling horizontally */}
                            <TableCell className="font-semibold text-gold min-w-[200px] sticky left-0 bg-muted/50 z-10">
                                {isAr ? 'المسؤول' : 'Administrator'}
                            </TableCell>
                            {/* One header cell per permission — shows a short slug label */}
                            {PERMISSION_KEYS.map(p => (
                                <TableCell key={p} className="text-center font-semibold text-gold text-xs whitespace-nowrap px-4">
                                    {p.replace(/_/g, ' ').replace('manage ', '').toUpperCase()} {/* Trim 'manage_' prefix and uppercase */}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHeader>

                    {/* ── Table rows ── */}
                    <TableBody>
                        {loading ? (
                            // ── Loading state ─────────────────────────────
                            <TableRow>
                                <TableCell colSpan={PERMISSION_KEYS.length + 1} className="text-center py-8">
                                    {isAr ? 'جاري التحميل...' : 'Loading...'}
                                </TableCell>
                            </TableRow>

                        ) : filtered.length === 0 ? (
                            // ── Empty state ───────────────────────────────
                            <TableRow>
                                <TableCell colSpan={PERMISSION_KEYS.length + 1} className="text-center py-8">
                                    {isAr ? 'لا يوجد بيانات' : 'No data found'}
                                </TableCell>
                            </TableRow>

                        ) : filtered.map(item => (
                            // ── Data rows: one per admin ──────────────────
                            <TableRow key={item.id} className="hover:bg-accent/5">
                                {/* Sticky first cell: admin name + role slug */}
                                <TableCell className="font-medium sticky left-0 bg-background/80 backdrop-blur-sm z-10 border-e">
                                    <div className="flex flex-col">
                                        <span>{item.full_name || (isAr ? 'بدون اسم' : 'No name')}</span>
                                        <span className="text-xs text-muted-foreground uppercase">{item.role}</span>
                                    </div>
                                </TableCell>

                                {/* One cell per permission — green check or muted red X */}
                                {PERMISSION_KEYS.map(p => {
                                    const isGranted = item.permissions[p]; // Effective boolean from the server
                                    return (
                                        <TableCell key={p} className="text-center">
                                            <div className="flex justify-center">
                                                {isGranted ? (
                                                    // Granted — green circular badge with a checkmark
                                                    <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                                                        <Check className="h-3.5 w-3.5" />
                                                    </div>
                                                ) : (
                                                    // Not granted — muted red circular badge with an X
                                                    <div className="h-6 w-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-500/50">
                                                        <X className="h-3.5 w-3.5" />
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default PermissionsMatrix; // Default export to match Dashboard.tsx import
