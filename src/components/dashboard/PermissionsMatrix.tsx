import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Check, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import apiClient from "@/lib/apiClient";

interface AdminPermissionMatrix {
    id: string;
    email: string;
    full_name: string;
    role: string;
    permissions: Record<string, boolean>;
}

const PermissionsMatrix: React.FC = () => {
    const { language } = useLanguage();
    const [matrix, setMatrix] = useState<AdminPermissionMatrix[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const isAr = language === 'ar';

    const permissions = [
        'manage_universities', 'manage_colleges', 'manage_departments',
        'manage_users', 'manage_announcements', 'manage_jobs',
        'manage_research', 'manage_graduates', 'manage_fees',
        'view_reports', 'advanced_settings'
    ];

    useEffect(() => {
        fetchMatrix();
    }, []);

    const fetchMatrix = async () => {
        try {
            const data = await apiClient('/permissions/matrix');
            setMatrix(data as AdminPermissionMatrix[]);
        } catch (err) {
            console.error('Fetch matrix error:', err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = matrix.filter(m => {
        const name = (m.full_name || '').toLowerCase();
        const email = (m.email || '').toLowerCase();
        const searchTerm = (search || '').toLowerCase();
        return name.includes(searchTerm) || email.includes(searchTerm);
    });

    return (
        <Card className="border-gold/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Shield className="h-5 w-5 text-gold" />
                            {isAr ? 'مصفوفة الصلاحيات' : 'Permissions Matrix'}
                        </CardTitle>
                        <CardDescription>
                            {isAr ? 'عرض شامل لجميع المسؤولين وصلاحياتهم الفعلية' : 'Comprehensive view of all admins and their effective permissions'}
                        </CardDescription>
                    </div>
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={isAr ? 'بحث عن مسؤول...' : 'Search admin...'}
                            className="pl-9 border-gold/20"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableCell className="font-semibold text-gold min-w-[200px] sticky left-0 bg-muted/50 z-10">
                                {isAr ? 'المسؤول' : 'Administrator'}
                            </TableCell>
                            {permissions.map(p => (
                                <TableCell key={p} className="text-center font-semibold text-gold text-xs whitespace-nowrap px-4">
                                    {p.replace(/_/g, ' ').replace('manage ', '').toUpperCase()}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={permissions.length + 1} className="text-center py-8">
                                    {isAr ? 'جاري التحميل...' : 'Loading...'}
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={permissions.length + 1} className="text-center py-8">
                                    {isAr ? 'لا يوجد بيانات' : 'No data found'}
                                </TableCell>
                            </TableRow>
                        ) : filtered.map(item => (
                            <TableRow key={item.id} className="hover:bg-accent/5">
                                <TableCell className="font-medium sticky left-0 bg-background/80 backdrop-blur-sm z-10 border-e">
                                    <div className="flex flex-col">
                                        <span>{item.full_name || (isAr ? 'بدون اسم' : 'No name')}</span>
                                        <span className="text-xs text-muted-foreground uppercase">{item.role}</span>
                                    </div>
                                </TableCell>
                                {permissions.map(p => {
                                    const isGranted = item.permissions[p];
                                    return (
                                        <TableCell key={p} className="text-center">
                                            <div className="flex justify-center">
                                                {isGranted ? (
                                                    <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                                                        <Check className="h-3.5 w-3.5" />
                                                    </div>
                                                ) : (
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

export default PermissionsMatrix;
