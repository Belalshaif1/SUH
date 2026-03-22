/**
 * @file src/components/dashboard/tabs/DepartmentTab.tsx
 * @description Renders the Departments management section of the Admin Dashboard.
 *              Supports role-based filtering: college admins see only their own college's
 *              departments, and department admins see only their single department.
 */

import React from 'react';                               // React for JSX and FC type
import { useLanguage } from '@/contexts/LanguageContext'; // Translation and language direction
import { Button }      from '@/components/ui/button';    // Shadcn button
import { Card, CardContent } from '@/components/ui/card'; // Shadcn card layout
import { Plus, Edit, Trash2, FileText } from 'lucide-react'; // Icon set
import { Department } from '@/types/dashboard';           // TypeScript entity interface

// ─── Props ────────────────────────────────────────────────────────────────

/** All externally-controlled callbacks and data for the Departments tab */
interface DepartmentTabProps {
    departments: Department[];                          // The pre-filtered list of department records
    onAdd: () => void;                                  // Opens the Add Department dialog
    onEdit: (item: Department) => void;                 // Opens Edit pre-filled with this department
    onDelete: (id: string, name: string) => void;       // Arms the delete confirmation dialog
    processData: (data: any[]) => any[];                // Sort/pin utility from useDashboardData
    role?: string;                                      // Current user's role string for local filtering
    userRole?: any;                                     // Full role object for scope-based display
    canAdd?: boolean;    // Show the Add button
    canEdit?: boolean;   // Show Edit buttons on cards
    canDelete?: boolean; // Show Delete buttons on cards
}

// ─── Component ────────────────────────────────────────────────────────────

export const DepartmentTab: React.FC<DepartmentTabProps> = ({
    departments, onAdd, onEdit, onDelete, processData,
    role, userRole, canAdd, canEdit, canDelete
}) => {
    const { t, language } = useLanguage(); // t() for translated labels, language for name display

    // ── Role-based filtering ───────────────────────────────────────────

    const filteredDepts = departments.filter(d => {
        if (role === 'super_admin')      return true;                              // Super admin sees all departments
        if (role === 'university_admin') return true;                              // Uni admin sees all departments in their uni (already filtered by hook)
        if (role === 'college_admin')    return d.college_id === userRole?.college_id; // College admin sees only their college's depts
        if (role === 'department_admin') return d.id === userRole?.department_id;  // Dept admin sees only their single department
        return false;                                                               // Unexpected role — hide everything
    });

    // Apply pinning and sort order before rendering
    const processedList = processData(filteredDepts);

    return (
        <div className="p-6"> {/* Standard section padding */}

            {/* ── Section header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    {/* Section title */}
                    <h2 className="text-2xl font-black text-primary mb-1">
                        {t('dashboard.manage_departments')} {/* "إدارة الأقسام" / "Manage Departments" */}
                    </h2>
                    {/* Descriptive subtitle */}
                    <p className="text-sm text-primary/40 font-bold">
                        {language === 'ar'
                            ? 'إدارة الأقسام العلمية والبرامج الدراسية'
                            : 'Manage academic departments and study programs'
                        }
                    </p>
                </div>

                {/* Add button — only shown when canAdd is true */}
                {canAdd && (
                    <Button
                        onClick={onAdd} // Direct reference — no arrow wrapper needed
                        className="h-12 px-6 rounded-xl bg-gold text-white font-bold shadow-xl shadow-gold/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="h-5 w-5 me-2" />
                        {t('common.add')} {/* "إضافة" / "Add" */}
                    </Button>
                )}
            </div>

            {/* ── Department cards grid ── */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {processedList.map((d: Department) => (
                    <Card
                        key={d.id} // Stable React key using the department's UUID
                        className="card-premium group hover:scale-[1.02] transition-all duration-300 border-none shadow-lg"
                    >
                        <CardContent className="flex items-center justify-between p-6">

                            {/* Left: icon badge + name */}
                            <div className="flex items-center gap-4">
                                {/* FileText icon — represents an academic department / program */}
                                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary/20">
                                    <FileText className="h-5 w-5" /> {/* Document icon for department */}
                                </div>

                                {/* Name and type label */}
                                <div className="flex flex-col">
                                    {/* Display Arabic or English name based on language */}
                                    <span className="font-black text-primary leading-tight">
                                        {language === 'ar' ? d.name_ar : (d.name_en || d.name_ar)}
                                    </span>
                                    {/* Decorative all-caps label below the name */}
                                    <span className="text-[10px] font-bold text-primary/20 uppercase tracking-widest mt-0.5">
                                        {language === 'ar' ? 'قسم علمي' : 'ACADEMIC DEPARTMENT'}
                                    </span>
                                </div>
                            </div>

                            {/* Right: Edit and Delete buttons */}
                            <div className="flex gap-2">
                                {/* Edit button — conditionally rendered by canEdit */}
                                {canEdit && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEdit(d)} // Pass full department object for form pre-filling
                                        className="h-10 w-10 rounded-xl text-primary/40 hover:text-primary hover:bg-primary/5"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                )}

                                {/* Delete button — conditionally rendered by canDelete */}
                                {canDelete && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDelete(
                                            d.id, // UUID for the DELETE API call
                                            language === 'ar' ? d.name_ar : (d.name_en || d.name_ar) // Name for confirm dialog
                                        )}
                                        className="h-10 w-10 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                        </CardContent>
                    </Card>
                ))}
            </div>

        </div>
    );
};
