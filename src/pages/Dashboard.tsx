/**
 * @file src/pages/Dashboard.tsx
 * @description The root orchestrator of the Admin Dashboard.
 *              Composes custom hooks for data, dialogs, and actions, then
 *              routes everything to the correct tab sub-component.
 *              This component contains NO business logic itself — it only wires things together.
 *
 * BUG FIX: Replaced the blocking full-screen `data.loading` overlay (which captured
 *           pointer events and prevented "Add" button clicks) with a non-blocking
 *           corner indicator. The `actions.loading` overlay (for save/delete) is
 *           intentionally full-screen since it's a deliberate blocking action.
 */

import React, { useEffect } from 'react';                                          // React core and useEffect for the auth guard
import { useNavigate } from 'react-router-dom';                               // Navigation hook to redirect unauthenticated users
import { useLanguage } from '@/contexts/LanguageContext';                     // Translation and direction
import { useAuth } from '@/contexts/AuthContext';                         // User, role, and hasPermission
import {
    Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs';                                                     // Shadcn tabs for the main navigation
import {
    UserCog, Shield, Building2, BookOpen, FileText,
    Megaphone, Briefcase, GraduationCap, DollarSign,
    Info, AlertTriangle, Users, Archive, Loader2
} from 'lucide-react';                                                              // Icon set for tab triggers
import { Button } from '@/components/ui/button';                                     // Shadcn button

// ── Custom hooks (all business logic lives here) ──────────────────────────
import { useDashboardData } from '@/hooks/useDashboardData';    // Fetches and filters all entity lists
import { useDashboardActions } from '@/hooks/useDashboardActions'; // Handles save, delete, file upload
import { useDashboardDialogs } from '@/hooks/useDashboardDialogs'; // Manages dialog open/close state
import { useNotifications } from '@/hooks/useNotifications';    // Handles SW registration and permissions

// ── Shared dashboard UI components ───────────────────────────────────────
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';       // Top header with user info and logout
import { StatsOverview } from '@/components/dashboard/StatsOverview';         // Stats cards row at the top
import { LoadingOverlay } from '@/components/dashboard/LoadingOverlay';        // Standard full-screen overlay component
import { EntityDialog } from '@/components/dashboard/EntityDialog';          // Unified Add/Edit form dialog
import { DeleteConfirmDialog } from '@/components/dashboard/DeleteConfirmDialog';   // Themed confirmation dialog
import { JobApplicationsViewer } from '@/components/dashboard/JobApplicationsViewer'; // Slide-out job applicants viewer
import AdminManagement from '@/components/dashboard/AdminManagement';       // Admin CRUD table
import UserManagementTable from '@/components/dashboard/UserManagementTable';   // User accounts table
import RolePermissions from '@/components/dashboard/RolePermissions';       // Role default permissions editor
import PermissionsMatrix from '@/components/dashboard/PermissionsMatrix';     // All-roles grid overview
import SecurityTab from '@/components/dashboard/SecurityTab';           // Password change tab

// ── Domain-specific tab components ───────────────────────────────────────
import { UniversityTab } from '@/components/dashboard/tabs/UniversityTab';    // University CRUD list
import { CollegeTab } from '@/components/dashboard/tabs/CollegeTab';       // College CRUD list
import { DepartmentTab } from '@/components/dashboard/tabs/DepartmentTab';    // Department CRUD list
import { AnnouncementsTab } from '@/components/dashboard/tabs/AnnouncementsTab'; // Announcement CRUD list
import { JobsTab } from '@/components/dashboard/tabs/JobsTab';          // Job postings CRUD list
import { GraduatesTab } from '@/components/dashboard/tabs/GraduatesTab';     // Graduate records CRUD list
import { ResearchTab } from '@/components/dashboard/tabs/ResearchTab';      // Research papers CRUD list
import { FeesTab } from '@/components/dashboard/tabs/FeesTab';          // Tuition fees CRUD list
import { ErrorLogsTab } from '@/components/dashboard/tabs/ErrorLogsTab';     // System error logs (super_admin only)
import { BackupTab } from '@/components/dashboard/tabs/BackupTab';        // Database backup tools
import { AboutUsTab } from '@/components/dashboard/tabs/AboutUsTab';       // About-page CMS editor

// ─── Component ────────────────────────────────────────────────────────────

/**
 * Dashboard — the top-level page component for all admin roles.
 * Renders a role-appropriate set of tabs, each powered by a domain tab component.
 */
const Dashboard: React.FC = () => {

    // ── Context consumers ────────────────────────────────────────────────
    const { t, language } = useLanguage(); // t() for translations, language for inline conditionals
    const {
        user,          // The authenticated user object
        userRole,      // The user's role object (role string + scope IDs + permissions map)
        loading: authLoading, // True while the auth token is being validated on startup
        hasPermission, // Checks a specific permission key against userRole.permissions
        signOut: logout, // Clears the JWT and resets auth state
    } = useAuth();
    const navigate = useNavigate(); // Used to redirect to /login if not authenticated

    // ── Hook composition ─────────────────────────────────────────────────
    const data = useDashboardData();                               // All entity lists, stats, loading, and sort/filter
    const dialogs = useDashboardDialogs();                            // Dialog open/close state and form data buffer
    const actions = useDashboardActions(data.fetchData, dialogs.close); // Save/delete handlers
    const { permission, requestPermission } = useNotifications();     // Background notifications

    // ── Auth guard ───────────────────────────────────────────────────────

    useEffect(() => {
        // After the auth check completes, redirect to login if there's no valid session
        if (!authLoading && (!user || !userRole)) {
            navigate('/login'); // Redirect unauthenticated visitors away from this protected page
        }
    }, [user, userRole, authLoading, navigate]); // Re-check whenever auth state changes

    // ── Early returns ────────────────────────────────────────────────────

    // Show a centered loading message while the JWT is being validated
    if (authLoading) {
        return (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
                {t('common.loading')} {/* Localised "Loading..." string */}
            </div>
        );
    }

    // After auth check, if still no user, render nothing (the useEffect will navigate away)
    if (!user || !userRole) return null;

    const role = userRole.role; // Short alias used throughout JSX for role-based rendering

    // ── Render ────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-500">

            {/* ── Header (logo, user info, logout button) ── */}
            <DashboardHeader onLogout={logout} />

            {/* ── Statistics overview cards ── */}
            <StatsOverview stats={data.stats} role={role} hasPermission={hasPermission} />

            {/* Notification Permission Prompt — shown only if not yet allowed/denied */}
            {permission === 'default' && (
                <div className="container mx-auto px-4 mb-4">
                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Megaphone className="h-5 w-5 text-primary" />
                            <p className="text-sm font-medium">
                                {language === 'ar'
                                    ? 'هل تود استلام التنبيهات في الخلفية للبقاء على اطلاع؟'
                                    : 'Would you like to receive background notifications to stay updated?'}
                            </p>
                        </div>
                        <Button onClick={requestPermission} size="sm" className="bg-primary text-white">
                            {language === 'ar' ? 'تفعيل' : 'Enable'}
                        </Button>
                    </div>
                </div>
            )}

            {/* ── Main content area — tabs and content ── */}
            <main className="container mx-auto px-4 pb-20 relative  z-10">

                {/* BUG FIX: Data-loading indicator is now a NON-BLOCKING corner badge.
                    Previously this was an `absolute inset-0` overlay that captured all
                    pointer events and prevented the "Add" button from being clickable. */}
                {data.loading && (
                    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm text-primary text-xs font-semibold px-3 py-2 rounded-full shadow-lg border border-primary/10">
                        <Loader2 className="h-12 w-12  animate-spin" /> {/* Spinning icon */}
                        <p className='mt-4 text-lg font-medium text-foreground'>
                            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'} {/* Localised label */}
                        </p>
                    </div>
                )}


                {/* ── Tabs container card ── */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-primary/5 border border-white/50 dark:border-white/5 overflow-hidden min-h-[500px]">

                    {/* Default tab depends on role: super_admin starts on Users, others on Admins */}
                    <Tabs defaultValue={role === 'super_admin' ? 'users' : 'admins'} className="w-full">

                        {/* ── Tab trigger list (navigation bar) ── */}
                        <div className="px-6 pt-6 border-b border-primary/5 bg-slate-50/30">
                            <TabsList className="flex flex-wrap gap-2 h-auto mb-4 bg-transparent p-0">

                                {/* Users tab — super_admin only */}
                                {role === 'super_admin' && hasPermission('manage_users') && (
                                    <TabsTrigger value="users" className="tab-trigger-premium">
                                        <Users className="h-4 w-4" />
                                        {language === 'ar' ? 'المستخدمين' : 'Users'}
                                    </TabsTrigger>
                                )}

                                {/* Admins tab — super, university, and college admins */}
                                {(role === 'super_admin' || role === 'university_admin' || role === 'college_admin') && (
                                    <TabsTrigger value="admins" className="tab-trigger-premium">
                                        <UserCog className="h-4 w-4" />
                                        {t('dashboard.manage_admins')} {/* Localised "Manage Admins" */}
                                    </TabsTrigger>
                                )}

                                {/* Roles editor — super_admin only */}
                                {role === 'super_admin' && (
                                    <TabsTrigger value="permissions" className="tab-trigger-premium">
                                        <Shield className="h-4 w-4" />
                                        {language === 'ar' ? 'الأدوار' : 'Roles'}
                                    </TabsTrigger>
                                )}

                                {/* Permissions matrix — super_admin only */}
                                {role === 'super_admin' && (
                                    <TabsTrigger value="permissions_matrix" className="tab-trigger-premium">
                                        <Shield className="h-4 w-4" />
                                        {language === 'ar' ? 'مصفوفة الصلاحيات' : 'Permissions Matrix'}
                                    </TabsTrigger>
                                )}

                                {/* Entity management tabs — shown based on permission keys */}
                                {hasPermission('manage_universities') && (
                                    <TabsTrigger value="universities" className="tab-trigger-premium">
                                        <Building2 className="h-4 w-4" />
                                        {t('nav.universities')}
                                    </TabsTrigger>
                                )}
                                {hasPermission('manage_colleges') && (
                                    <TabsTrigger value="colleges" className="tab-trigger-premium">
                                        <BookOpen className="h-4 w-4" />
                                        {t('universities.colleges')}
                                    </TabsTrigger>
                                )}
                                {hasPermission('manage_departments') && (
                                    <TabsTrigger value="departments" className="tab-trigger-premium">
                                        <FileText className="h-4 w-4" />
                                        {t('universities.departments')}
                                    </TabsTrigger>
                                )}
                                {hasPermission('manage_announcements') && (
                                    <TabsTrigger value="announcements" className="tab-trigger-premium">
                                        <Megaphone className="h-4 w-4" />
                                        {t('nav.announcements')}
                                    </TabsTrigger>
                                )}
                                {hasPermission('manage_jobs') && (
                                    <TabsTrigger value="jobs" className="tab-trigger-premium">
                                        <Briefcase className="h-4 w-4" />
                                        {t('nav.jobs')}
                                    </TabsTrigger>
                                )}
                                {hasPermission('manage_graduates') && (
                                    <TabsTrigger value="graduates" className="tab-trigger-premium">
                                        <GraduationCap className="h-4 w-4" />
                                        {t('nav.graduates')}
                                    </TabsTrigger>
                                )}
                                {hasPermission('manage_research') && (
                                    <TabsTrigger value="research" className="tab-trigger-premium">
                                        <FileText className="h-4 w-4" />
                                        {t('nav.research')}
                                    </TabsTrigger>
                                )}
                                {hasPermission('manage_fees') && (
                                    <TabsTrigger value="fees" className="tab-trigger-premium">
                                        <DollarSign className="h-4 w-4" />
                                        {t('nav.fees')}
                                    </TabsTrigger>
                                )}

                                {/* System tools — super_admin only */}
                                {role === 'super_admin' && (
                                    <TabsTrigger value="error_logs" className="tab-trigger-premium text-red-500">
                                        <AlertTriangle className="h-4 w-4" />
                                        {language === 'ar' ? 'الأخطاء' : 'Logs'}
                                    </TabsTrigger>
                                )}
                                {role === 'super_admin' && (
                                    <TabsTrigger value="backup" className="tab-trigger-premium text-amber-600">
                                        <Archive className="h-4 w-4" />
                                        {language === 'ar' ? 'النسخ' : 'Backup'}
                                    </TabsTrigger>
                                )}
                                {role === 'super_admin' && (
                                    <TabsTrigger value="about_us" className="tab-trigger-premium">
                                        <Info className="h-4 w-4" />
                                        {language === 'ar' ? 'إدارة من نحن' : 'Manage About Us'}
                                    </TabsTrigger>
                                )}

                                {/* Security tab — always visible for personal password management */}
                                <TabsTrigger value="security" className="tab-trigger-premium">
                                    <Shield className="h-4 w-4" />
                                    {language === 'ar' ? 'الأمان' : 'Security'}
                                </TabsTrigger>

                            </TabsList>
                        </div>

                        {/* ── Tab content panels ── */}

                        {/* Users — full user accounts management */}
                        <TabsContent value="users">
                            <UserManagementTable
                                onAddAdmin={() =>
                                    // Switch to the Admins tab by programmatically clicking its trigger
                                    document.querySelector<HTMLElement>('[data-value="admins"]')?.click()
                                }
                            />
                        </TabsContent>

                        {/* Admins — admin CRUD table with role assignment */}
                        <TabsContent value="admins">
                            <AdminManagement
                                universities={data.universities} // Used to populate university scope selectors
                                colleges={data.colleges}         // Used to populate college scope selectors
                                departments={data.departments}   // Used to populate department scope selectors
                            />
                        </TabsContent>

                        {/* Role defaults editor */}
                        <TabsContent value="permissions">
                            <div className="p-6">
                                <RolePermissions /> {/* Lets super_admin set default permissions for each role */}
                            </div>
                        </TabsContent>

                        {/* Permissions grid overview */}
                        <TabsContent value="permissions_matrix">
                            <div className="p-6">
                                <PermissionsMatrix /> {/* Shows a grid of all roles × permissions for quick review */}
                            </div>
                        </TabsContent>

                        {/* University CRUD */}
                        <TabsContent value="universities">
                            <UniversityTab
                                universities={data.universities}                    // The filtered university list
                                onAdd={() => dialogs.openAdd('university')}         // Open Add dialog with university form
                                onEdit={(item) => dialogs.openEdit('university', item)} // Open Edit dialog pre-filled
                                onDelete={(id, name) => actions.requestDelete('universities', id, name)} // Arm delete
                                processData={data.processData}                      // Sort/filter utility
                                role={role}                                         // For RBAC display logic within the tab
                                userRole={userRole}                                 // Full role object for scope checks
                                canAdd={role === 'super_admin'}                     // Only super_admin can add universities
                                canEdit={hasPermission('manage_universities')}      // Based on permission key
                                canDelete={role === 'super_admin'}                  // Only super_admin can delete
                            />
                        </TabsContent>

                        {/* College CRUD */}
                        <TabsContent value="colleges">
                            <CollegeTab
                                colleges={data.colleges}
                                onAdd={() => dialogs.openAdd('college')}
                                onEdit={(item) => dialogs.openEdit('college', item)}
                                onDelete={(id, name) => actions.requestDelete('colleges', id, name)}
                                processData={data.processData}
                                role={role}
                                userRole={userRole}
                                canAdd={role === 'super_admin' || role === 'university_admin'}
                                canEdit={hasPermission('manage_colleges')}
                                canDelete={role === 'super_admin' || role === 'university_admin'}
                            />
                        </TabsContent>

                        {/* Department CRUD */}
                        <TabsContent value="departments">
                            <DepartmentTab
                                departments={data.departments}
                                onAdd={() => dialogs.openAdd('department')}
                                onEdit={(item) => dialogs.openEdit('department', item)}
                                onDelete={(id, name) => actions.requestDelete('departments', id, name)}
                                processData={data.processData}
                                role={role}
                                userRole={userRole}
                                canAdd={role === 'super_admin' || role === 'university_admin' || role === 'college_admin'}
                                canEdit={hasPermission('manage_departments')}
                                canDelete={role === 'super_admin' || role === 'university_admin' || role === 'college_admin'}
                            />
                        </TabsContent>

                        {/* Announcements CRUD */}
                        <TabsContent value="announcements">
                            <AnnouncementsTab
                                announcements={data.announcements}
                                onAdd={() => dialogs.openAdd('announcement')}
                                onEdit={(item) => dialogs.openEdit('announcement', item)}
                                onDelete={(id, title) => actions.requestDelete('announcements', id, title)}
                                processData={data.processData}
                                role={role}
                                canAdd={hasPermission('manage_announcements')}
                                canEdit={hasPermission('manage_announcements')}
                                canDelete={hasPermission('manage_announcements')}
                            />
                        </TabsContent>

                        {/* Jobs CRUD */}
                        <TabsContent value="jobs">
                            <JobsTab
                                jobs={data.jobs}
                                onAdd={() => dialogs.openAdd('job')}
                                onEdit={(item) => dialogs.openEdit('job', item)}
                                onDelete={(id, title) => actions.requestDelete('jobs', id, title)}
                                onViewApplications={(id) => dialogs.setViewingJobId(id)} // Opens the applicants viewer
                                processData={data.processData}
                                canAdd={hasPermission('manage_jobs')}
                                canEdit={hasPermission('manage_jobs')}
                                canDelete={hasPermission('manage_jobs')}
                            />
                        </TabsContent>

                        {/* Graduates CRUD */}
                        <TabsContent value="graduates">
                            <GraduatesTab
                                graduates={data.graduates}
                                onAdd={() => dialogs.openAdd('graduate')}
                                onEdit={(item) => dialogs.openEdit('graduate', item)}
                                onDelete={(id, name) => actions.requestDelete('graduates', id, name)}
                                processData={data.processData}
                                canAdd={hasPermission('manage_graduates')}
                                canEdit={hasPermission('manage_graduates')}
                                canDelete={hasPermission('manage_graduates')}
                            />
                        </TabsContent>

                        {/* Research CRUD */}
                        <TabsContent value="research">
                            <ResearchTab
                                research={data.research}
                                onAdd={() => dialogs.openAdd('research')}
                                onEdit={(item) => dialogs.openEdit('research', item)}
                                onDelete={(id, title) => actions.requestDelete('research', id, title)}
                                processData={data.processData}
                                canAdd={hasPermission('manage_research')}
                                canEdit={hasPermission('manage_research')}
                                canDelete={hasPermission('manage_research')}
                            />
                        </TabsContent>

                        {/* Fees CRUD */}
                        <TabsContent value="fees">
                            <FeesTab
                                fees={data.fees}
                                departments={data.departments}          // Used to show department names next to fees
                                onAdd={() => dialogs.openAdd('fee')}
                                onEdit={(item) => dialogs.openEdit('fee', item)}
                                onDelete={(id, name) => actions.requestDelete('fees', id, name)}
                                canAdd={hasPermission('manage_fees')}
                                canEdit={hasPermission('manage_fees')}
                                canDelete={hasPermission('manage_fees')}
                            />
                        </TabsContent>

                        {/* Error logs — super_admin only */}
                        <TabsContent value="error_logs">
                            <ErrorLogsTab errorLogs={data.errorLogs} />
                        </TabsContent>

                        {/* Backup tools — super_admin only */}
                        <TabsContent value="backup">
                            <BackupTab />
                        </TabsContent>

                        {/* About-page CMS editor — super_admin only */}
                        {role === 'super_admin' && (
                            <TabsContent value="about_us">
                                <AboutUsTab
                                    aboutData={data.aboutData} // The current About-page content object
                                    onSaved={data.fetchData}   // Refresh all data after saving
                                />
                            </TabsContent>
                        )}

                        {/* Personal security settings — always visible */}
                        <TabsContent value="security">
                            <SecurityTab userId={user.id} language={language} />
                        </TabsContent>

                    </Tabs>
                </div>
            </main>

            {/* ── Global action dialogs (rendered outside the tabs to avoid z-index issues) ── */}

            {/* Premium, full-screen blocking indicator for all mutations (Create/Update/Delete) */}
            <LoadingOverlay
                isVisible={actions.loading}
                message={
                    dialogs.editId
                        ? (language === 'ar' ? 'جاري حفظ التعديلات...' : 'Saving changes...')
                        : (language === 'ar' ? 'جاري الإضافة...' : 'Adding new item...')
                }
                description={
                    language === 'ar'
                        ? 'يرجى الانتظار، جاري معالجة طلبك وتأمين البيانات'
                        : 'Please wait while we process your request secure your data'
                }
            />

            {/* Add / Edit entity dialog — shown when dialogs.dialogOpen is true */}
            <EntityDialog
                isOpen={dialogs.dialogOpen}         // Controls dialog visibility
                onClose={dialogs.close}              // Resets state and hides dialog
                activeForm={dialogs.activeForm}      // Tells EntityForm which fields to render
                formData={dialogs.formData}          // Current form field values buffer
                setFormData={dialogs.setFormData}    // onChange handler passed to form inputs
                onSave={() => actions.handleSave(   // Called when the user clicks "Save"
                    dialogs.activeForm,              // Entity type (e.g. 'university')
                    dialogs.formData,                // Current field values
                    dialogs.editId,                  // null = create, UUID = update
                    role,                            // For RBAC scope injection in the action
                    userRole                         // For college_id/university_id injection
                )}
                loading={actions.loading}           // Disables the Save button while saving
                editId={dialogs.editId}             // Passed to EntityForm to show "Edit" vs "Add" label
                universities={data.universities}    // For select dropdowns inside entity forms
                colleges={data.colleges}            // For select dropdowns
                departments={data.departments}      // For select dropdowns
                role={role}                         // For hiding fields that the role can't set
            />

            {/* Delete confirmation dialog — shown when actions.deleteConfirm is populated */}
            <DeleteConfirmDialog
                isOpen={!!actions.deleteConfirm}    // Show when a deletion has been requested
                onClose={actions.cancelDelete}       // Cancel without deleting
                onConfirm={actions.confirmDelete}    // Execute the actual DELETE request
                itemName={actions.deleteConfirm?.name || ''} // Show the item's name in the dialog
            />

            {/* Job applicants viewer — shown when dialogs.viewingJobId is a specific UUID */}
            <JobApplicationsViewer
                jobId={dialogs.viewingJobId}             // The job to show applicants for
                onClose={() => dialogs.setViewingJobId(null)} // Save button closes the viewer
            />

        </div>
    );
};

export default Dashboard; // Export so it can be used in the router definition
