/**
 * @file pages/Dashboard.tsx
 * @description The main orchestrator for the Admin Dashboard.
 * This component follows Clean Architecture by decoupling business logic (hooks) 
 * from the presentation layer (modular components).
 */

import React from 'react'; // React library for building UI
import { useNavigate } from 'react-router-dom'; // Navigation hook
import { useLanguage } from '@/contexts/LanguageContext'; // Lang context
import { useAuth } from '@/contexts/AuthContext'; // Auth context
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Navigation tabs
import {
  UserCog, Shield, Building2, BookOpen, FileText, Megaphone,
  Briefcase, GraduationCap, DollarSign, Info, AlertTriangle, Users, Check, Archive
} from 'lucide-react'; // Visual icons


// --- Custom Hooks (Business Logic) ---
import { useDashboardData } from '@/hooks/useDashboardData'; // Data fetching & state
import { useDashboardActions } from '@/hooks/useDashboardActions'; // CRUD & Uploads
import { useDashboardDialogs } from '@/hooks/useDashboardDialogs'; // Dialog & Form state

// --- Modular UI Components ---
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'; // Header & Welcome
import { StatsOverview } from '@/components/dashboard/StatsOverview'; // Stats cards
import { EntityDialog } from '@/components/dashboard/EntityDialog'; // Unified Form/Dialog
import { DeleteConfirmDialog } from '@/components/dashboard/DeleteConfirmDialog'; // Premium confirm dialog
import AdminManagement from '@/components/dashboard/AdminManagement'; // Admin table
import UserManagementTable from '@/components/dashboard/UserManagementTable'; // User table
import RolePermissions from '@/components/dashboard/RolePermissions'; // Role settings
import PermissionsMatrix from '@/components/dashboard/PermissionsMatrix'; // Permission grid
import SecurityTab from '@/components/dashboard/SecurityTab'; // Password settings

// --- Domain Tab Components ---
import { UniversityTab } from '@/components/dashboard/tabs/UniversityTab';
import { CollegeTab } from '@/components/dashboard/tabs/CollegeTab';
import { DepartmentTab } from '@/components/dashboard/tabs/DepartmentTab';
import { AnnouncementsTab } from '@/components/dashboard/tabs/AnnouncementsTab';
import { JobsTab } from '@/components/dashboard/tabs/JobsTab';
import { GraduatesTab } from '@/components/dashboard/tabs/GraduatesTab';
import { ResearchTab } from '@/components/dashboard/tabs/ResearchTab';
import { FeesTab } from '@/components/dashboard/tabs/FeesTab';
import { ErrorLogsTab } from '@/components/dashboard/tabs/ErrorLogsTab';
import { BackupTab } from '@/components/dashboard/tabs/BackupTab';
import { AboutUsTab } from '@/components/dashboard/tabs/AboutUsTab';



/**
 * Dashboard Orchestrator
 */
const Dashboard: React.FC = () => {
  const { t, language } = useLanguage(); // Localized strings
  const { user, userRole, loading: authLoading, hasPermission, signOut: logout } = useAuth(); // Session info
  const navigate = useNavigate(); // Navigation engine

  const data = useDashboardData(); // Business State
  const dialogs = useDashboardDialogs(); // Modal State
  const actions = useDashboardActions(data.fetchData, dialogs.close); // CRUD Operations

  // Security Guard: Ensure authenticated access
  React.useEffect(() => {
    if (!authLoading && (!user || !userRole)) {
      navigate('/login');
    }
  }, [user, userRole, authLoading, navigate]);

  if (authLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground">{t('common.loading')}</div>;
  if (!user || !userRole) return null;

  const role = userRole.role; // Helper for RBAC tags

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-500">

      {/* 1. Header & Welcome Section */}
      <DashboardHeader onLogout={logout} />

      {/* 2. Key Metrics Snapshot */}
      <StatsOverview stats={data.stats} role={role} hasPermission={hasPermission} />

      {/* 3. Main Operational Tabs */}
      <main className="px-6 pb-20 relative">
        {data.loading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#F8FAFC]/70 dark:bg-slate-950/70 backdrop-blur-sm rounded-[2.5rem] mt-6 mx-6 mb-20">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <h2 className="text-2xl font-black text-foreground">
              {language === 'ar' ? 'الرجاء الانتظار...' : 'Please Wait...'}
            </h2>
            <p className="text-sm font-medium text-muted-foreground mt-2">
              {language === 'ar' ? 'جاري تحميل وعرض البيانات' : 'Loading and rendering data'}
            </p>
          </div>
        )}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-primary/5 border border-white/50 dark:border-white/5 overflow-hidden min-h-[500px]">

          <Tabs defaultValue={role === 'super_admin' ? 'users' : 'admins'} className="w-full">

            {/* Unified Navigation List */}
            <div className="px-6 pt-6 border-b border-primary/5 bg-slate-50/30">
              <TabsList className="flex flex-wrap gap-2 h-auto mb-4 bg-transparent p-0">
                {role === 'super_admin' && hasPermission('manage_users') && <TabsTrigger value="users" className="tab-trigger-premium"><Users className="h-4 w-4" />{language === 'ar' ? 'المستخدمين' : 'Users'}</TabsTrigger>}
                {(role === 'super_admin' || role === 'university_admin' || role === 'college_admin') && <TabsTrigger value="admins" className="tab-trigger-premium"><UserCog className="h-4 w-4" />{t('dashboard.manage_admins')}</TabsTrigger>}

                {role === 'super_admin' && <TabsTrigger value="permissions" className="tab-trigger-premium"><Shield className="h-4 w-4" />{language === 'ar' ? 'الأدوار' : 'Roles'}</TabsTrigger>}
                {role === 'super_admin' && <TabsTrigger value="permissions_matrix" className="tab-trigger-premium"><Shield className="h-4 w-4" />{language === 'ar' ? 'مصفوفة الصلاحيات' : 'Permissions Matrix'}</TabsTrigger>}



                {hasPermission('manage_universities') && <TabsTrigger value="universities" className="tab-trigger-premium"><Building2 className="h-4 w-4" />{t('nav.universities')}</TabsTrigger>}
                {hasPermission('manage_colleges') && <TabsTrigger value="colleges" className="tab-trigger-premium"><BookOpen className="h-4 w-4" />{t('universities.colleges')}</TabsTrigger>}
                {hasPermission('manage_departments') && <TabsTrigger value="departments" className="tab-trigger-premium"><FileText className="h-4 w-4" />{t('universities.departments')}</TabsTrigger>}
                {hasPermission('manage_announcements') && <TabsTrigger value="announcements" className="tab-trigger-premium"><Megaphone className="h-4 w-4" />{t('nav.announcements')}</TabsTrigger>}
                {hasPermission('manage_jobs') && <TabsTrigger value="jobs" className="tab-trigger-premium"><Briefcase className="h-4 w-4" />{t('nav.jobs')}</TabsTrigger>}
                {hasPermission('manage_graduates') && <TabsTrigger value="graduates" className="tab-trigger-premium"><GraduationCap className="h-4 w-4" />{t('nav.graduates')}</TabsTrigger>}
                {hasPermission('manage_research') && <TabsTrigger value="research" className="tab-trigger-premium"><FileText className="h-4 w-4" />{t('nav.research')}</TabsTrigger>}
                {hasPermission('manage_fees') && <TabsTrigger value="fees" className="tab-trigger-premium"><DollarSign className="h-4 w-4" />{t('nav.fees')}</TabsTrigger>}
                {role === 'super_admin' && <TabsTrigger value="error_logs" className="tab-trigger-premium text-red-500"><AlertTriangle className="h-4 w-4" />{language === 'ar' ? 'الأخطاء' : 'Logs'}</TabsTrigger>}
                {role === 'super_admin' && <TabsTrigger value="backup" className="tab-trigger-premium text-amber-600"><Archive className="h-4 w-4" />{language === 'ar' ? 'النسخ' : 'Backup'}</TabsTrigger>}
                {role === 'super_admin' && <TabsTrigger value="about_us" className="tab-trigger-premium"><Info className="h-4 w-4" />{language === 'ar' ? 'إدارة من نحن' : 'Manage About Us'}</TabsTrigger>}




                <TabsTrigger value="security" className="tab-trigger-premium"><Shield className="h-4 w-4" />{language === 'ar' ? 'الأمان' : 'Security'}</TabsTrigger>

              </TabsList>
            </div>

            {/* Content Injection (Domain Components) */}
            <TabsContent value="users"><UserManagementTable onAddAdmin={() => document.querySelector<HTMLElement>('[data-value="admins"]')?.click()} /></TabsContent>
            <TabsContent value="admins"><AdminManagement universities={data.universities} colleges={data.colleges} departments={data.departments} /></TabsContent>
            <TabsContent value="permissions">
              <div className="p-6">
                <RolePermissions />
              </div>
            </TabsContent>
            <TabsContent value="permissions_matrix">
              <div className="p-6">
                <PermissionsMatrix />
              </div>
            </TabsContent>

            <TabsContent value="universities">
              <UniversityTab
                universities={data.universities}
                onAdd={() => dialogs.openAdd('university')}
                onEdit={(i) => dialogs.openEdit('university', i)}
                onDelete={(id, name) => actions.requestDelete('universities', id, name)}
                processData={data.processData}
                role={role} userRole={userRole}
                canAdd={hasPermission('manage_universities')}
                canEdit={hasPermission('manage_universities')}
                canDelete={hasPermission('manage_universities')}
              />
            </TabsContent>
            <TabsContent value="colleges">
              <CollegeTab
                colleges={data.colleges}
                onAdd={() => dialogs.openAdd('college')}
                onEdit={(i) => dialogs.openEdit('college', i)}
                onDelete={(id, name) => actions.requestDelete('colleges', id, name)}
                processData={data.processData}
                role={role} userRole={userRole}
                canAdd={hasPermission('manage_colleges')}
                canEdit={hasPermission('manage_colleges')}
                canDelete={hasPermission('manage_colleges')}
              />
            </TabsContent>
            <TabsContent value="departments">
              <DepartmentTab
                departments={data.departments}
                onAdd={() => dialogs.openAdd('department')}
                onEdit={(i) => dialogs.openEdit('department', i)}
                onDelete={(id, name) => actions.requestDelete('departments', id, name)}
                processData={data.processData}
                role={role} userRole={userRole}
                canAdd={hasPermission('manage_departments')}
                canEdit={hasPermission('manage_departments')}
                canDelete={hasPermission('manage_departments')}
              />
            </TabsContent>
            <TabsContent value="announcements">
              <AnnouncementsTab 
                announcements={data.announcements} 
                onAdd={() => dialogs.openAdd('announcement')} 
                onEdit={(i) => dialogs.openEdit('announcement', i)} 
                onDelete={(id, title) => actions.requestDelete('announcements', id, title)} 
                processData={data.processData} 
                role={role} 
                canAdd={hasPermission('manage_announcements')}
                canEdit={hasPermission('manage_announcements')}
                canDelete={hasPermission('manage_announcements')}
              />
            </TabsContent>

            <TabsContent value="jobs">
              <JobsTab 
                jobs={data.jobs} 
                onAdd={() => dialogs.openAdd('job')} 
                onEdit={(i) => dialogs.openEdit('job', i)} 
                onDelete={(id, title) => actions.requestDelete('jobs', id, title)} 
                onViewApplications={(id) => dialogs.setViewingJobId(id)} 
                processData={data.processData} 
                canAdd={hasPermission('manage_jobs')}
                canEdit={hasPermission('manage_jobs')}
                canDelete={hasPermission('manage_jobs')}
              />
            </TabsContent>
            
            <TabsContent value="graduates">
              <GraduatesTab 
                graduates={data.graduates} 
                onAdd={() => dialogs.openAdd('graduate')} 
                onEdit={(i) => dialogs.openEdit('graduate', i)} 
                onDelete={(id, name) => actions.requestDelete('graduates', id, name)} 
                processData={data.processData} 
                canAdd={hasPermission('manage_graduates')}
                canEdit={hasPermission('manage_graduates')}
                canDelete={hasPermission('manage_graduates')}
              />
            </TabsContent>
            
            <TabsContent value="research">
              <ResearchTab 
                research={data.research} 
                onAdd={() => dialogs.openAdd('research')} 
                onEdit={(i) => dialogs.openEdit('research', i)} 
                onDelete={(id, title) => actions.requestDelete('research', id, title)} 
                processData={data.processData} 
                canAdd={hasPermission('manage_research')}
                canEdit={hasPermission('manage_research')}
                canDelete={hasPermission('manage_research')}
              />
            </TabsContent>
            
            <TabsContent value="fees">
              <FeesTab 
                fees={data.fees} 
                departments={data.departments} 
                onAdd={() => dialogs.openAdd('fee')} 
                onEdit={(i) => dialogs.openEdit('fee', i)} 
                onDelete={(id, name) => actions.requestDelete('fees', id, name)} 
                canAdd={hasPermission('manage_fees')}
                canEdit={hasPermission('manage_fees')}
                canDelete={hasPermission('manage_fees')}
              />
            </TabsContent>
            <TabsContent value="error_logs"><ErrorLogsTab errorLogs={data.errorLogs} /></TabsContent>
            <TabsContent value="backup"><BackupTab /></TabsContent>
            {role === 'super_admin' && (
              <TabsContent value="about_us"><AboutUsTab aboutData={data.aboutData} onSaved={data.fetchData} /></TabsContent>
            )}
            <TabsContent value="security"><SecurityTab userId={user.id} language={language} /></TabsContent>


          </Tabs>
        </div>
      </main>

      {/* --- Global Action Dialogs --- */}
      <EntityDialog
        isOpen={dialogs.dialogOpen} onClose={dialogs.close} activeForm={dialogs.activeForm}
        formData={dialogs.formData} setFormData={dialogs.setFormData}
        onSave={() => actions.handleSave(dialogs.activeForm, dialogs.formData, dialogs.editId, role, userRole)}
        loading={actions.loading} editId={dialogs.editId} universities={data.universities}
        colleges={data.colleges} departments={data.departments} role={role}
      />

      <DeleteConfirmDialog
        isOpen={!!actions.deleteConfirm}
        onClose={actions.cancelDelete}
        onConfirm={actions.confirmDelete}
        itemName={actions.deleteConfirm?.name || ''}
      />
    </div>
  );
};

export default Dashboard;
