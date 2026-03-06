import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Building2, BarChart3, FileText, UserCog, UserPlus, Users, Edit, Trash2, Plus, LogOut, Check, X, Shield, Megaphone, Save, GraduationCap, Briefcase, DollarSign, Info, AlertTriangle, Pin, PinOff } from 'lucide-react';
import AdminManagement from '@/components/dashboard/AdminManagement';
import UserManagementTable from '@/components/dashboard/UserManagementTable';
import RolePermissions from '@/components/dashboard/RolePermissions';
import PermissionsMatrix from '@/components/dashboard/PermissionsMatrix';
import SecurityTab from '@/components/dashboard/SecurityTab';

const Dashboard: React.FC = () => {
  const { t, language } = useLanguage();
  const isAr = language === 'ar';
  const { user, userRole, loading: authLoading, hasPermission } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState({ universities: 0, colleges: 0, departments: 0, graduates: 0, research: 0, users: 0 });
  const [universities, setUniversities] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [graduates, setGraduates] = useState<any[]>([]);
  const [research, setResearch] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [aboutData, setAboutData] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeForm, setActiveForm] = useState('');
  const [formData, setFormData] = useState<any>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Job Applications tracking
  const [viewingJobId, setViewingJobId] = useState<string | null>(null);
  const [jobApplications, setJobApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  // Sorting and Filtering states for Admin Dashboard
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [uniFilter, setUniFilter] = useState<string>('all');
  const [collegeFilter, setCollegeFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && (!user || !userRole)) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, userRole, authLoading]);

  const fetchData = async () => {
    if (!user || !userRole) return;
    const role = userRole.role;

    try {
      const [uRes, cRes, dRes, gRes, rRes, jRes, aRes, aboutRes, logsRes, fRes] = await Promise.all([
        apiClient('/universities'),
        apiClient('/colleges'),
        apiClient('/departments'),
        apiClient('/graduates'),
        apiClient('/research'),
        apiClient('/jobs'),
        apiClient('/announcements'),
        apiClient('/about'),
        role === 'super_admin' ? apiClient('/error_logs') : Promise.resolve([]),
        apiClient('/fees')
      ]);

      if (role === 'super_admin') {
        setUniversities(uRes || []);
        setColleges(cRes || []);
        setDepartments(dRes || []);
        setGraduates(gRes || []);
        setResearch(rRes || []);
        setJobs(jRes || []);
        setAnnouncements(aRes || []);
        setFees(fRes || []);
        setErrorLogs(logsRes || []);
        setAboutData(aboutRes);

        setStats({
          universities: uRes.length || 0,
          colleges: cRes.length || 0,
          departments: dRes.length || 0,
          graduates: gRes.length || 0,
          research: rRes.length || 0,
          users: 0
        });
      } else if (role === 'university_admin') {
        const uid = userRole.university_id;
        const filteredUniversities = (uRes || []).filter((u: any) => u.id === uid);
        const filteredColleges = (cRes || []).filter((c: any) => c.university_id === uid);
        const filteredDepartments = (dRes || []).filter((d: any) => d.university_id === uid);
        const collegeIds = filteredColleges.map((c: any) => c.id);
        const filteredJobs = (jRes || []).filter((j: any) => collegeIds.includes(j.college_id));
        const filteredAnnouncements = (aRes || []).filter((a: any) => a.scope === 'university' && a.university_id === uid || (a.scope === 'college' && collegeIds.includes(a.college_id)));
        const filteredGraduates = (gRes || []).filter((g: any) => filteredDepartments.some((d: any) => d.id === g.department_id));
        const filteredResearch = (rRes || []).filter((r: any) => filteredDepartments.some((d: any) => d.id === r.department_id));
        const filteredFees = (fRes || []).filter((f: any) => filteredDepartments.some((d: any) => d.id === f.department_id));

        setUniversities(filteredUniversities);
        setColleges(filteredColleges);
        setDepartments(filteredDepartments);
        setGraduates(filteredGraduates);
        setResearch(filteredResearch);
        setJobs(filteredJobs);
        setAnnouncements(filteredAnnouncements);
        setFees(filteredFees);

        setStats({
          universities: 1,
          colleges: filteredColleges.length,
          departments: filteredDepartments.length,
          graduates: filteredGraduates.length,
          research: filteredResearch.length,
          users: 0
        });
      } else if (role === 'college_admin') {
        const filteredColleges = (cRes || []).filter((c: any) => c.id === userRole.college_id);
        const filteredDepartments = (dRes || []).filter((d: any) => d.college_id === userRole.college_id);
        const filteredJobs = (jRes || []).filter((j: any) => j.college_id === userRole.college_id);
        const filteredAnnouncements = (aRes || []).filter((a: any) => a.scope === 'college' && a.college_id === userRole.college_id);
        const filteredGraduates = (gRes || []).filter((g: any) => filteredDepartments.some((d: any) => d.id === g.department_id));
        const filteredResearch = (rRes || []).filter((r: any) => filteredDepartments.some((d: any) => d.id === r.department_id));
        const filteredFees = (fRes || []).filter((f: any) => filteredDepartments.some((d: any) => d.id === f.department_id));

        setColleges(filteredColleges);
        setDepartments(filteredDepartments);
        setGraduates(filteredGraduates);
        setResearch(filteredResearch);
        setJobs(filteredJobs);
        setAnnouncements(filteredAnnouncements);
        setFees(filteredFees);

        setStats({
          universities: 0,
          colleges: 1,
          departments: filteredDepartments.length,
          graduates: filteredGraduates.length,
          research: filteredResearch.length,
          users: 0
        });
      } else if (role === 'department_admin') {
        const filteredDepartments = (dRes || []).filter((d: any) => d.id === userRole.department_id);
        const filteredAnnouncements = (aRes || []).filter((a: any) => a.scope === 'department' && a.department_id === userRole.department_id);
        const filteredGraduates = (gRes || []).filter((g: any) => g.department_id === userRole.department_id);
        const filteredResearch = (rRes || []).filter((r: any) => r.department_id === userRole.department_id);
        const filteredFees = (fRes || []).filter((f: any) => f.department_id === userRole.department_id);

        setDepartments(filteredDepartments);
        setAnnouncements(filteredAnnouncements);
        setGraduates(filteredGraduates);
        setResearch(filteredResearch);
        setFees(filteredFees);

        setStats({
          universities: 0,
          colleges: 0,
          departments: 1,
          graduates: filteredGraduates.length,
          research: filteredResearch.length,
          users: 0
        });
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  const processData = (data: any[], type: 'general' | 'entity' = 'general') => {
    let result = [...data];

    // Apply Filters (for Graduates/Research etc)
    if (uniFilter !== 'all') {
      result = result.filter(item => {
        if (item.university_id) return item.university_id === uniFilter;
        if (item.department_id) {
          const dept = departments.find(d => d.id === item.department_id);
          return dept?.university_id === uniFilter;
        }
        if (item.college_id) {
          const coll = colleges.find(c => c.id === item.college_id);
          return coll?.university_id === uniFilter;
        }
        return true;
      });
    }
    if (collegeFilter !== 'all') {
      result = result.filter(item => {
        if (item.college_id) return item.college_id === collegeFilter;
        if (item.department_id) {
          const dept = departments.find(d => d.id === item.department_id);
          return dept?.college_id === collegeFilter;
        }
        return true;
      });
    }
    if (deptFilter !== 'all') {
      result = result.filter(item => !item.department_id || item.department_id === deptFilter);
    }

    result.sort((a, b) => {
      // Pinning takes precedence
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;

      if (sortOrder === 'newest') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      if (sortOrder === 'oldest') return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      if (sortOrder === 'name') {
        const nameA = (language === 'ar' ? (a.name_ar || a.full_name_ar || a.title_ar) : (a.name_en || a.full_name_en || a.title_en || a.name_ar || a.full_name_ar || a.title_ar))?.toLowerCase() || '';
        const nameB = (language === 'ar' ? (b.name_ar || b.full_name_ar || b.title_ar) : (b.name_en || b.full_name_en || b.title_en || b.name_ar || b.full_name_ar || b.title_ar))?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
      }
      return 0;
    });
    return result;
  };

  const getName = (item: any) => language === 'ar' ? item.name_ar : (item.name_en || item.name_ar);

  const openAdd = (type: string) => {
    setActiveForm(type);
    setFormData({});
    setEditId(null);
    setDialogOpen(true);
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const data = await apiClient('/upload', {
      method: 'POST',
      body: formData
    });
    return data.url;
  };

  const openEdit = (type: string, item: any) => {
    setActiveForm(type);
    setFormData(item);
    setEditId(item.id);
    setDialogOpen(true);
  };

  const loadJobApplications = async (jobId: string) => {
    setViewingJobId(jobId);
    setLoadingApps(true);
    try {
      const apps = await apiClient(`/job_applications/job/${jobId}`);
      setJobApplications(apps || []);
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' });
      setJobApplications([]);
    } finally {
      setLoadingApps(false);
    }
  };

  const handleApplicationStatus = async (appId: string, status: string) => {
    try {
      await apiClient(`/job_applications/${appId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      setJobApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
      toast({ title: language === 'ar' ? 'تم تحديث الحالة' : 'Status updated' });
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      if (activeForm === 'university') {
        let guideUrl = formData.guide_pdf_url;
        let logoUrl = formData.logo_url;
        if (formData._guide_file) {
          guideUrl = await handleFileUpload(formData._guide_file);
        }
        if (formData._logo_file) {
          logoUrl = await handleFileUpload(formData._logo_file);
        }
        const payload: any = {
          name_ar: formData.name_ar,
          name_en: formData.name_en,
          description_ar: formData.description_ar,
          description_en: formData.description_en,
          guide_pdf_url: guideUrl,
          logo_url: logoUrl
        };
        if (role === 'super_admin') payload.is_pinned = formData.is_pinned ? 1 : 0;
        if (editId) {
          await apiClient(`/universities/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
        } else {
          await apiClient('/universities', { method: 'POST', body: JSON.stringify(payload) });
        }
      } else if (activeForm === 'college') {
        const universityId = role === 'university_admin' ? userRole.university_id : formData.university_id;
        let guideUrl = formData.guide_pdf_url;
        let logoUrl = formData.logo_url;
        if (formData._guide_file) {
          guideUrl = await handleFileUpload(formData._guide_file);
        }
        if (formData._logo_file) {
          logoUrl = await handleFileUpload(formData._logo_file);
        }
        const payload: any = {
          name_ar: formData.name_ar,
          name_en: formData.name_en,
          description_ar: formData.description_ar,
          description_en: formData.description_en,
          university_id: universityId,
          guide_pdf_url: guideUrl,
          logo_url: logoUrl
        };
        if (role === 'super_admin') payload.is_pinned = formData.is_pinned ? 1 : 0;
        if (editId) {
          await apiClient(`/colleges/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
        } else {
          await apiClient('/colleges', { method: 'POST', body: JSON.stringify(payload) });
        }
      } else if (activeForm === 'department') {
        const collegeId = role === 'college_admin' ? userRole.college_id : formData.college_id;
        let planUrl = formData.study_plan_url;
        let logoUrl = formData.logo_url;
        if (formData._plan_file) {
          planUrl = await handleFileUpload(formData._plan_file);
        }
        if (formData._logo_file) {
          logoUrl = await handleFileUpload(formData._logo_file);
        }
        const payload = {
          name_ar: formData.name_ar,
          name_en: formData.name_en,
          description_ar: formData.description_ar,
          description_en: formData.description_en,
          college_id: collegeId,
          study_plan_url: planUrl,
          logo_url: logoUrl
        };
        if (editId) {
          await apiClient(`/departments/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
        } else {
          await apiClient('/departments', { method: 'POST', body: JSON.stringify(payload) });
        }
      } else if (activeForm === 'announcement') {
        let imageUrl = formData.image_url;
        let fileUrl = formData.file_url;

        if (formData._image_file) {
          imageUrl = await handleFileUpload(formData._image_file);
        }
        if (formData._attachment_file) {
          fileUrl = await handleFileUpload(formData._attachment_file);
        }

        const payload: any = {
          title_ar: formData.title_ar,
          title_en: formData.title_en,
          content_ar: formData.content_ar,
          content_en: formData.content_en,
          scope: formData.scope || 'global',
          university_id: formData.university_id || null,
          college_id: formData.college_id || null,
          image_url: imageUrl,
          file_url: fileUrl,
          created_by: user!.id
        };
        if (role === 'super_admin') payload.is_pinned = formData.is_pinned ? 1 : 0;
        if (editId) {
          await apiClient(`/announcements/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
        } else {
          await apiClient('/announcements', { method: 'POST', body: JSON.stringify(payload) });
        }
      } else if (activeForm === 'graduate') {
        const payload = {
          full_name_ar: formData.full_name_ar,
          full_name_en: formData.full_name_en,
          department_id: formData.department_id,
          graduation_year: parseInt(formData.graduation_year),
          gpa: formData.gpa ? parseFloat(formData.gpa) : null,
          specialization_ar: formData.specialization_ar,
          specialization_en: formData.specialization_en
        };
        if (editId) {
          await apiClient(`/graduates/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
        } else {
          await apiClient('/graduates', { method: 'POST', body: JSON.stringify(payload) });
        }
      } else if (activeForm === 'research') {
        let pdfUrl = formData.pdf_url;
        if (formData._pdf_file) {
          pdfUrl = await handleFileUpload(formData._pdf_file);
        }
        const payload = {
          title_ar: formData.title_ar,
          title_en: formData.title_en,
          abstract_ar: formData.abstract_ar,
          abstract_en: formData.abstract_en,
          author_name: formData.author_name,
          department_id: formData.department_id,
          published: formData.published !== false,
          pdf_url: pdfUrl,
          students: formData.students || []
        };
        if (editId) {
          await apiClient(`/research/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
        } else {
          await apiClient('/research', { method: 'POST', body: JSON.stringify(payload) });
        }
      } else if (activeForm === 'job') {
        const payload = {
          title_ar: formData.title_ar,
          title_en: formData.title_en,
          description_ar: formData.description_ar,
          description_en: formData.description_en,
          college_id: formData.college_id,
          deadline: formData.deadline || null,
          is_pinned: formData.is_pinned ? 1 : 0
        };
        if (editId) {
          await apiClient(`/jobs/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
        } else {
          await apiClient('/jobs', { method: 'POST', body: JSON.stringify(payload) });
        }
      } else if (activeForm === 'fee') {
        const payload = {
          department_id: formData.department_id,
          fee_type: formData.fee_type || 'public',
          amount: parseFloat(formData.amount),
          academic_year: formData.academic_year
        };
        if (editId) {
          await apiClient(`/fees/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
        } else {
          await apiClient('/fees', { method: 'POST', body: JSON.stringify(payload) });
        }
      } else if (activeForm === 'profile_password') {
        await apiClient('/auth/update-password', {
          method: 'POST',
          body: JSON.stringify({ new_password: formData.new_password })
        });
      } else if (activeForm === 'about') {
        let imageUrl = formData.developer_image_url;
        if (formData._image_file) {
          imageUrl = await handleFileUpload(formData._image_file);
        }
        const payload = {
          content_ar: formData.content_ar,
          content_en: formData.content_en,
          developer_name_ar: formData.developer_name_ar,
          developer_name_en: formData.developer_name_en,
          developer_bio_ar: formData.developer_bio_ar,
          developer_bio_en: formData.developer_bio_en,
          developer_image_url: imageUrl
        };
        await apiClient('/about', { method: 'PUT', body: JSON.stringify(payload) });
      }
      toast({ title: language === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully' });
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (table: string, id: string) => {
    if (!confirm(t('common.confirm_delete'))) return;
    try {
      await apiClient(`/${table}/${id}`, { method: 'DELETE' });
      toast({ title: language === 'ar' ? 'تم الحذف' : 'Deleted' });
      fetchData();
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' });
    }
  };

  const role = userRole?.role;
  if (authLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground">{t('common.loading')}</div>;
  if (!user || !userRole) return null;

  const statCards = [
    { key: 'users', icon: Users, label: language === 'ar' ? 'المستخدمين' : 'Users', show: (role === 'super_admin' || role === 'university_admin' || role === 'college_admin') && hasPermission('manage_users') },
    { key: 'universities', icon: Building2, label: t('home.stats.universities'), show: (role === 'super_admin' || role === 'university_admin') && hasPermission('manage_universities') },
    { key: 'colleges', icon: BookOpen, label: t('home.stats.colleges'), show: (role !== 'department_admin') && hasPermission('manage_colleges') },
    { key: 'departments', icon: FileText, label: t('home.stats.departments'), show: hasPermission('manage_departments') },
    { key: 'graduates', icon: GraduationCap, label: t('home.stats.graduates'), show: hasPermission('manage_graduates') },
    { key: 'research', icon: FileText, label: t('home.stats.research'), show: hasPermission('manage_research') },
  ].filter(s => s.show);

  const renderForm = () => {
    const f = (key: string, label: string, type = 'text', required = false, placeholder = '', desc = '') => (
      <div className="space-y-1" key={key}>
        <div className="flex items-center justify-between">
          <Label>{label}</Label>
          {required && <span className="text-[10px] text-red-500 font-bold uppercase">{language === 'ar' ? 'مطلوب' : 'Required'}</span>}
        </div>
        {type === 'textarea' ? (
          <Textarea
            placeholder={placeholder || label}
            value={formData[key] || ''}
            onChange={e => setFormData({ ...formData, [key]: e.target.value })}
            required={required}
            className="min-h-[100px] resize-none focus-visible:ring-gold/30"
          />
        ) : (
          <Input
            type={type}
            placeholder={placeholder || label}
            value={formData[key] || ''}
            onChange={e => setFormData({ ...formData, [key]: e.target.value })}
            required={required}
            className="focus-visible:ring-gold/30"
          />
        )}
        {desc && <p className="text-[11px] text-muted-foreground leading-tight px-1 italic">{desc}</p>}
      </div>
    );

    const pinField = () => (
      role === 'super_admin' ? (
        <div className="flex items-center gap-2 pt-2 border-t mt-4">
          <input
            type="checkbox"
            id="is_pinned"
            checked={!!formData.is_pinned}
            onChange={e => setFormData({ ...formData, is_pinned: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-gold focus:ring-gold"
          />
          <Label htmlFor="is_pinned" className="cursor-pointer font-bold text-gold flex items-center gap-1">
            <Pin className="h-3 w-3" />
            {language === 'ar' ? 'تثبيت في أعلى القائمة' : 'Pin to top of the list'}
          </Label>
        </div>
      ) : null
    );

    const selectField = (key: string, label: string, options: any[], desc = '') => (
      <div className="space-y-1" key={key}>
        <Label>{label}</Label>
        <Select value={formData[key] || ''} onValueChange={v => setFormData({ ...formData, [key]: v })}>
          <SelectTrigger className="focus:ring-gold/30"><SelectValue placeholder={language === 'ar' ? 'اختر من القائمة...' : 'Select from list...'} /></SelectTrigger>
          <SelectContent>
            {options.map(o => <SelectItem key={o.id} value={o.id}>{language === 'ar' ? o.name_ar : (o.name_en || o.name_ar)}</SelectItem>)}
          </SelectContent>
        </Select>
        {desc && <p className="text-[11px] text-muted-foreground leading-tight px-1 italic">{desc}</p>}
        {desc && <p className="text-[11px] text-muted-foreground italic px-1">{desc}</p>}
      </div>
    );

    switch (activeForm) {
      case 'university':
        return <>
          {(role === 'super_admin' || role === 'university_admin') && (
            <>
              {f('name_ar', t('common.name_ar'), 'text', true, language === 'ar' ? 'نموذج: جامعة الملك فيصل' : 'e.g. King Faisal University')}
              {f('name_en', t('common.name_en'), 'text', false, 'e.g. King Faisal University')}
            </>
          )}
          {f('description_ar', t('common.description_ar'), 'textarea', false, language === 'ar' ? 'اكتب نبذة عن الجامعة...' : 'Write about the university...')}
          {f('description_en', t('common.description_en'), 'textarea', false, 'Write about the university...')}
          <div className="space-y-1">
            <Label>{language === 'ar' ? 'صورة بروفيل الجامعة' : 'University Profile Image'}</Label>
            <Input type="file" accept="image/*" onChange={e => setFormData({ ...formData, _logo_file: e.target.files?.[0] })} />
            {formData.logo_url && <p className="text-xs text-muted-foreground mt-1">✓ {language === 'ar' ? 'صورة موجودة' : 'Existing image'}</p>}
            <p className="text-[11px] text-muted-foreground italic px-1">{language === 'ar' ? 'صورة الشعار أو البروفيل الرسمي للجامعة.' : 'The official logo or profile image of the university.'}</p>
          </div>
          <div className="space-y-1">
            <Label>{language === 'ar' ? 'دليل الجامعة (PDF)' : 'University Guide (PDF)'}</Label>
            <Input type="file" accept=".pdf" onChange={e => setFormData({ ...formData, _guide_file: e.target.files?.[0] })} />
            {formData.guide_pdf_url && <p className="text-xs text-muted-foreground mt-1">✓ {language === 'ar' ? 'ملف موجود' : 'Existing file'}</p>}
            <p className="text-[11px] text-muted-foreground italic px-1">{language === 'ar' ? 'قم برفع ملف PDF يحتوي على دليل الطالب أو معلومات الجامعة.' : 'Upload a PDF file containing the student guide or university info.'}</p>
          </div>
          {pinField()}
        </>;
      case 'college':
        return <>
          {(role === 'super_admin' || role === 'university_admin' || role === 'college_admin') && (
            <>
              {role === 'super_admin' && selectField('university_id', t('nav.universities') + ' > ' + t('universities.colleges'), universities, language === 'ar' ? 'اختر الجامعة التي تنتمي إليها هذه الكلية.' : 'Select the university this college belongs to.')}
              {f('name_ar', t('common.name_ar'), 'text', true, language === 'ar' ? 'نموذج: كلية الهندسة' : 'e.g. College of Engineering')}
              {f('name_en', t('common.name_en'), 'text', false, 'e.g. College of Engineering')}
            </>
          )}
          {f('description_ar', t('common.description_ar'), 'textarea', false, language === 'ar' ? 'اكتب نبذة عن الكلية...' : 'Write about the college...')}
          {f('description_en', t('common.description_en'), 'textarea', false, 'Write about the college...')}
          <div className="space-y-1">
            <Label>{language === 'ar' ? 'صورة بروفيل الكلية' : 'College Profile Image'}</Label>
            <Input type="file" accept="image/*" onChange={e => setFormData({ ...formData, _logo_file: e.target.files?.[0] })} />
            {formData.logo_url && <p className="text-xs text-muted-foreground mt-1">✓ {language === 'ar' ? 'صورة موجودة' : 'Existing image'}</p>}
            <p className="text-[11px] text-muted-foreground italic px-1">{language === 'ar' ? 'صورة الشعار أو البروفيل الرسمي للكلية.' : 'The official logo or profile image of the college.'}</p>
          </div>
          <div className="space-y-1">
            <Label>{language === 'ar' ? 'دليل الكلية (PDF)' : 'College Guide (PDF)'}</Label>
            <Input type="file" accept=".pdf" onChange={e => setFormData({ ...formData, _guide_file: e.target.files?.[0] })} />
            {formData.guide_pdf_url && <p className="text-xs text-muted-foreground mt-1">✓ {language === 'ar' ? 'ملف موجود' : 'Existing file'}</p>}
            <p className="text-[11px] text-muted-foreground italic px-1">{language === 'ar' ? 'قم برفع ملف PDF يحتوي على تخصصات الكلية ومعلومات القبول.' : 'Upload a PDF file containing college majors and admission info.'}</p>
          </div>
          {pinField()}
        </>;
      case 'department':
        return <>
          {(role === 'super_admin' || role === 'university_admin' || role === 'college_admin' || role === 'department_admin') && (
            <>
              {role === 'super_admin' && selectField('college_id', t('nav.universities') + ' > ' + t('universities.colleges'), colleges, language === 'ar' ? 'اختر الكلية التي ينتمي إليها هذا القسم.' : 'Select the college this department belongs to.')}
              {role === 'university_admin' && selectField('college_id', t('universities.colleges'), colleges.filter((c: any) => c.university_id === userRole.university_id), language === 'ar' ? 'اختر الكلية التي ينتمي إليها هذا القسم.' : 'Select the college this department belongs to.')}
              {f('name_ar', t('common.name_ar'), 'text', true, language === 'ar' ? 'نموذج: قسم علوم الحاسب' : 'e.g. Computer Science Department')}
              {f('name_en', t('common.name_en'), 'text', false, 'e.g. Computer Science Department')}
            </>
          )}
          {f('description_ar', t('common.description_ar'), 'textarea', false, language === 'ar' ? 'اكتب وصفاً للقسم وتخصصاته...' : 'Write about the department and its majors...')}
          {f('description_en', t('common.description_en'), 'textarea', false, 'Write about the department and its majors...')}
          <div className="space-y-1">
            <Label>{language === 'ar' ? 'صورة بروفيل القسم' : 'Department Profile Image'}</Label>
            <Input type="file" accept="image/*" onChange={e => setFormData({ ...formData, _logo_file: e.target.files?.[0] })} />
            {formData.logo_url && <p className="text-xs text-muted-foreground mt-1">✓ {language === 'ar' ? 'صورة موجودة' : 'Existing image'}</p>}
            <p className="text-[11px] text-muted-foreground italic px-1">{language === 'ar' ? 'صورة الشعار أو البروفيل الرسمي للقسم.' : 'The official logo or profile image of the department.'}</p>
          </div>
          <div className="space-y-1">
            <Label>{language === 'ar' ? 'الخطة الدراسية (PDF)' : 'Study Plan (PDF)'}</Label>
            <Input type="file" accept=".pdf" onChange={e => setFormData({ ...formData, _plan_file: e.target.files?.[0] })} />
            {formData.study_plan_url && <p className="text-xs text-muted-foreground mt-1">✓ {language === 'ar' ? 'ملف موجود' : 'Existing file'}</p>}
            <p className="text-[11px] text-muted-foreground italic px-1">{language === 'ar' ? 'قم برفع ملف PDF يحتوي على الخريطة الدراسية للقسم.' : 'Upload a PDF file containing the department curriculum map.'}</p>
          </div>
        </>;
      case 'announcement':
        return <>
          {f('title_ar', t('common.name_ar'), 'text', true, language === 'ar' ? 'عنوان الإعلان...' : 'Announcement Title...')}
          {f('title_en', t('common.name_en'), 'text', false, 'Announcement Title...')}
          {f('content_ar', t('common.description_ar'), 'textarea', false, language === 'ar' ? 'محتوى الإعلان...' : 'Announcement Content...')}
          {f('content_en', t('common.description_en'), 'textarea', false, 'Write announcement content here...')}
          <div className="space-y-1">
            <Label>{language === 'ar' ? 'صورة الإعلان' : 'Announcement Image'}</Label>
            <Input type="file" accept="image/*" onChange={e => setFormData({ ...formData, _image_file: e.target.files?.[0] })} />
            {formData.image_url && <p className="text-xs text-muted-foreground mt-1">✓ {language === 'ar' ? 'صورة موجودة' : 'Existing image'}</p>}
            <p className="text-[11px] text-muted-foreground italic px-1">{language === 'ar' ? 'صورة اختيارية لتظهر في واجهة الإعلانات.' : 'Optional image to display in the announcements view.'}</p>
          </div>
          <div className="space-y-1">
            <Label>{language === 'ar' ? 'ملف مرفق' : 'Attachment'}</Label>
            <Input type="file" onChange={e => setFormData({ ...formData, _attachment_file: e.target.files?.[0] })} />
            {formData.file_url && <p className="text-xs text-muted-foreground mt-1">✓ {language === 'ar' ? 'ملف موجود' : 'Existing file'}</p>}
            <p className="text-[11px] text-muted-foreground italic px-1">{language === 'ar' ? 'يمكنك إرفاق ملف PDF أو مستند إضافي مع الإعلان.' : 'You can attach an additional PDF or document with the announcement.'}</p>
          </div>
          {pinField()}
        </>;
      case 'graduate':
        return <>
          {selectField('department_id', t('universities.departments'), departments, language === 'ar' ? 'اختر القسم الذي تخرج منه الطالب.' : 'Select the department the student graduated from.')}
          {f('full_name_ar', t('common.name_ar'), 'text', true, language === 'ar' ? 'اسم الخريج كاملاً...' : 'Full Graduate Name...')}
          {f('full_name_en', t('common.name_en'), 'text', false, 'Full Graduate Name...')}
          {f('graduation_year', t('graduates.year'), 'number', true, '2024', language === 'ar' ? 'سنة التخرج (مثلاً 2024).' : 'Year of graduation (e.g. 2024).')}
          {f('gpa', t('graduates.gpa'), 'number', false, '4.00', language === 'ar' ? 'المعدل التراكمي (اختياري).' : 'Cumulative GPA (optional).')}
        </>;
      case 'research':
        return <>
          {selectField('department_id', t('universities.departments'), departments, language === 'ar' ? 'اختر القسم الذي يتبع له هذا البحث.' : 'Select the department this research belongs to.')}
          {f('title_ar', t('common.name_ar'), 'text', true, language === 'ar' ? 'عنوان البحث (عربي)...' : 'Research Title (AR)...')}
          {f('title_en', t('common.name_en'), 'text', false, 'Research Title (EN)...')}
          {f('author_name', t('research.author'), 'text', true, language === 'ar' ? 'اسم الباحث الرئيسي...' : 'Main Author Name...')}
          {f('abstract_ar', t('common.description_ar'), 'textarea', false, language === 'ar' ? 'ملخص البحث ووصف مختصر للنتائج...' : 'Research abstract and brief description...')}
          <div className="space-y-1">
            <Label>{language === 'ar' ? 'ملف البحث (PDF)' : 'Research PDF'}</Label>
            <Input type="file" accept=".pdf" onChange={e => setFormData({ ...formData, _pdf_file: e.target.files?.[0] })} />
            {formData.pdf_url && <p className="text-xs text-muted-foreground mt-1">✓ {language === 'ar' ? 'ملف موجود' : 'Existing file'}</p>}
            <p className="text-[11px] text-muted-foreground italic px-1">{language === 'ar' ? 'ارفع النسخة الكاملة من البحث بصيغة PDF.' : 'Upload the full research paper in PDF format.'}</p>
          </div>
          <div className="space-y-2 border p-3 rounded-md bg-muted/20">
            <Label className="text-xs font-bold uppercase tracking-wider opacity-70">{language === 'ar' ? 'الطلاب المشاركون' : 'Participating Students'}</Label>
            {(formData.students || []).map((s: any, i: number) => (
              <div key={i} className="flex gap-2">
                <Input placeholder={language === 'ar' ? 'اسم الطالب' : 'Student Name'} value={s.full_name || ''} onChange={e => {
                  const news = [...formData.students];
                  news[i].full_name = e.target.value;
                  setFormData({ ...formData, students: news });
                }} className="h-8 text-xs" />
                <Input size={10} placeholder={language === 'ar' ? 'الدرجة' : 'Degree'} value={s.degree || ''} onChange={e => {
                  const news = [...formData.students];
                  news[i].degree = e.target.value;
                  setFormData({ ...formData, students: news });
                }} className="h-8 text-xs w-24" />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                  const news = formData.students.filter((_: any, idx: number) => idx !== i);
                  setFormData({ ...formData, students: news });
                }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full text-[11px] h-7 border-dashed" onClick={() => setFormData({ ...formData, students: [...(formData.students || []), { full_name: '', degree: '' }] })}>
              <Plus className="h-3.5 w-3.5 me-1" /> {language === 'ar' ? 'إضافة طالب مشارك' : 'Add Participating Student'}
            </Button>
          </div>
        </>;
      case 'job':
        return <>
          {selectField('college_id', t('universities.colleges'), colleges, language === 'ar' ? 'اختر الكلية التي توفر هذه الوظيفة.' : 'Select the college offering this job.')}
          {f('title_ar', t('common.name_ar'), 'text', true, language === 'ar' ? 'المسمى الوظيفي (عربي)...' : 'Job Title (AR)...')}
          {f('title_en', t('common.name_en'), 'text', false, 'Job Title (EN)...')}
          {f('description_ar', t('common.description_ar'), 'textarea', true, language === 'ar' ? 'متطلبات الوظيفة ووصف المهام...' : 'Job requirements and task description...')}
          {f('deadline', t('jobs.deadline'), 'date', false, '', language === 'ar' ? 'آخر موعد للتقديم على الوظيفة.' : 'The last day to apply for this job.')}
          {pinField()}
        </>;
      case 'fee':
        return <>
          {selectField('department_id', t('universities.departments'), departments, language === 'ar' ? 'القسم الذي تتبع له هذه الرسوم الدراسية.' : 'The department these tuition fees belong to.')}
          {f('amount', t('fees.amount'), 'number', true, '5000', language === 'ar' ? 'المبلغ الإجمالي بالعملة المحلية.' : 'The total amount in local currency.')}
          {f('academic_year', language === 'ar' ? 'السنة الدراسية' : 'Academic Year', 'text', false, '2024/2025', 'e.g. 2024/2025')}
          <div className="space-y-1">
            <Label>{language === 'ar' ? 'نوع التعليم' : 'Education Type'}</Label>
            <Select value={formData.fee_type || 'public'} onValueChange={v => setFormData({ ...formData, fee_type: v })}>
              <SelectTrigger className="focus:ring-gold/30"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="public">{t('fees.public')}</SelectItem>
                <SelectItem value="private">{t('fees.private')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground italic px-1">{language === 'ar' ? 'حدد ما إذا كانت الرسوم للتعليم العام أو الموازي.' : 'Specify if fees are for public or private/parallel education.'}</p>
          </div>
        </>;
      case 'about':
        return <>
          {f('content_ar', language === 'ar' ? 'محتوى "عن المشروع" (عربي)' : 'About Project (AR)', 'textarea', true, language === 'ar' ? 'تحدث عن رؤية وأهداف المشروع...' : 'Talk about the project vision and goals...')}
          {f('content_en', language === 'ar' ? 'محتوى "عن المشروع" (إنجليزي)' : 'About Project (EN)', 'textarea', false, 'Talk about the project vision and goals...')}
          {f('developer_name_ar', language === 'ar' ? 'اسم المطور (عربي)' : 'Dev Name (AR)', 'text', true, 'Belal')}
          {f('developer_name_en', language === 'ar' ? 'اسم المطور (إنجليزي)' : 'Dev Name (EN)', 'text')}
          {f('developer_bio_ar', language === 'ar' ? 'نبذة عن المطور (عربي)' : 'Dev Bio (AR)', 'textarea')}
          {f('developer_bio_en', language === 'ar' ? 'نبذة عن المطور (إنجليزي)' : 'Dev Bio (EN)', 'textarea')}
          <div className="space-y-1">
            <Label>{language === 'ar' ? 'صورة المطور' : 'Dev Photo'}</Label>
            <Input type="file" accept="image/*" onChange={e => setFormData({ ...formData, _image_file: e.target.files?.[0] })} />
            <p className="text-[11px] text-muted-foreground italic px-1">{language === 'ar' ? 'صورة شخصية للمطور تظهر في صفحة "من نحن".' : 'A profile photo of the developer to show in the About page.'}</p>
          </div>
        </>;
      default: return null;
    }
  };

  const formTitle: Record<string, string> = {
    university: t('dashboard.manage_universities'),
    college: t('dashboard.manage_colleges'),
    department: t('dashboard.manage_departments'),
    announcement: t('dashboard.manage_announcements'),
    graduate: t('dashboard.manage_graduates'),
    research: t('dashboard.manage_research'),
    job: t('dashboard.manage_jobs'),
    fee: t('dashboard.manage_fees'),
    about: language === 'ar' ? 'إدارة صفحة "من نحن"' : 'Manage About Us',
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <h1 className="mb-2 text-3xl font-bold text-foreground flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-gold" />
        {t('dashboard.title')}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {language === 'ar' ? `الدور: ${role === 'super_admin' ? 'مدير الموقع' : role === 'university_admin' ? 'مدير جامعة' : role === 'college_admin' ? 'مدير كلية' : 'مدير قسم'}` : `Role: ${role?.replace('_', ' ')}`}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map(s => (
          <Card key={s.key}>
            <CardContent className="flex flex-col items-center p-4 text-center">
              <s.icon className="mb-2 h-6 w-6 text-gold" />
              <span className="text-2xl font-bold">{stats[s.key as keyof typeof stats]}</span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue={role === 'super_admin' ? 'users' : 'admins'}>
        <TabsList className="flex flex-wrap gap-1 h-auto mb-6">
          {hasPermission('manage_users') && role === 'super_admin' && <TabsTrigger value="users"><Users className="h-4 w-4 me-1" />{language === 'ar' ? 'إدارة المستخدمين' : 'User Management'}</TabsTrigger>}
          {(role === 'super_admin' || role === 'university_admin' || role === 'college_admin') && <TabsTrigger value="admins"><UserCog className="h-4 w-4 me-1" />{t('dashboard.manage_admins')}</TabsTrigger>}
          {role === 'super_admin' && hasPermission('advanced_settings') && <TabsTrigger value="permissions"><Shield className="h-4 w-4 me-1" />{language === 'ar' ? 'الأدوار والصلاحيات' : 'Roles & Permissions'}</TabsTrigger>}
          {(role === 'super_admin' || role === 'university_admin') && <TabsTrigger value="universities"><Building2 className="h-4 w-4 me-1" />{t('nav.universities')}</TabsTrigger>}
          {(role === 'super_admin' || role === 'university_admin' || role === 'college_admin') && hasPermission('manage_colleges') && <TabsTrigger value="colleges"><BookOpen className="h-4 w-4 me-1" />{t('universities.colleges')}</TabsTrigger>}
          {hasPermission('manage_departments') && <TabsTrigger value="departments"><FileText className="h-4 w-4 me-1" />{t('universities.departments')}</TabsTrigger>}
          {role === 'super_admin' && (
            <TabsTrigger value="matrix" className="data-[state=active]:bg-gold data-[state=active]:text-gold-foreground">{language === 'ar' ? 'مصفوفة الصلاحيات' : 'Permissions Matrix'}</TabsTrigger>
          )}
          {hasPermission('manage_announcements') && <TabsTrigger value="announcements"><Megaphone className="h-4 w-4 me-1" />{t('nav.announcements')}</TabsTrigger>}
          {hasPermission('manage_jobs') && (role === 'college_admin' || role === 'super_admin' || role === 'university_admin') && <TabsTrigger value="jobs"><Briefcase className="h-4 w-4 me-1" />{t('nav.jobs')}</TabsTrigger>}
          {hasPermission('manage_graduates') && <TabsTrigger value="graduates"><GraduationCap className="h-4 w-4 me-1" />{t('nav.graduates')}</TabsTrigger>}
          {hasPermission('manage_research') && <TabsTrigger value="research"><FileText className="h-4 w-4 me-1" />{t('nav.research')}</TabsTrigger>}
          {hasPermission('manage_fees') && (role === 'super_admin' || role === 'university_admin') && <TabsTrigger value="fees"><DollarSign className="h-4 w-4 me-1" />{t('nav.fees')}</TabsTrigger>}
          {role === 'super_admin' && <TabsTrigger value="about_mgmt"><Info className="h-4 w-4 me-1" />{language === 'ar' ? 'صفحة من نحن' : 'About Page'}</TabsTrigger>}
          {role === 'super_admin' && <TabsTrigger value="error_logs" className="text-red-500 data-[state=active]:bg-destructive data-[state=active]:text-white"><AlertTriangle className="h-4 w-4 me-1" />{language === 'ar' ? 'سجل الأخطاء' : 'Error Logs'}</TabsTrigger>}
          <TabsTrigger value="security"><Shield className="h-4 w-4 me-1" />{language === 'ar' ? 'الأمان' : 'Security'}</TabsTrigger>
        </TabsList>

        {/* User Management */}
        {role === 'super_admin' && (
          <TabsContent value="users">
            <UserManagementTable onAddAdmin={() => {
              const adminsTab = document.querySelector('[data-value="admins"]') as HTMLElement;
              adminsTab?.click();
            }} />
          </TabsContent>
        )}

        {/* Admins */}
        {(role === 'super_admin' || role === 'university_admin' || role === 'college_admin') && (
          <TabsContent value="admins">
            <AdminManagement universities={universities} colleges={colleges} departments={departments} />
          </TabsContent>
        )}

        {/* Roles & Permissions */}
        {role === 'super_admin' && (
          <TabsContent value="permissions">
            <RolePermissions />
          </TabsContent>
        )}

        {/* Permissions Matrix */}
        {role === 'super_admin' && (
          <TabsContent value="matrix">
            <PermissionsMatrix />
          </TabsContent>
        )}

        {/* Universities */}
        {(role === 'super_admin' || role === 'university_admin') && (
          <TabsContent value="universities">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-xl font-bold">{t('dashboard.manage_universities')}</h2>
              <div className="flex flex-wrap gap-3">
                <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={isAr ? 'ترتيب حسب' : 'Sort by'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{isAr ? 'الأحدث' : 'Newest'}</SelectItem>
                    <SelectItem value="oldest">{isAr ? 'الأقدم' : 'Oldest'}</SelectItem>
                    <SelectItem value="name">{isAr ? 'الاسم' : 'Name'}</SelectItem>
                  </SelectContent>
                </Select>
                {role === 'super_admin' && (
                  <Button onClick={() => openAdd('university')} className="bg-gold text-gold-foreground">
                    <Plus className="h-4 w-4 me-1" />{t('common.add')}
                  </Button>
                )}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {processData(universities
                .filter(u => role === 'super_admin' || u.id === userRole.university_id))
                .map(u => (
                  <Card key={u.id}>
                    <CardContent className="flex items-center justify-between p-4 relative overflow-hidden">
                      {u.is_pinned === 1 && (
                        <div className="absolute top-0 right-0 p-1 bg-gold/10 rounded-bl-lg">
                          <Pin className="h-3 w-3 text-gold" />
                        </div>
                      )}
                      <span className="font-semibold">{getName(u)}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit('university', u)}><Edit className="h-4 w-4" /></Button>
                        {role === 'super_admin' && (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete('universities', u.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        )}

        {/* Colleges */}
        {(role === 'super_admin' || role === 'university_admin' || role === 'college_admin') && hasPermission('manage_colleges') && (
          <TabsContent value="colleges">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-xl font-bold">{t('dashboard.manage_colleges')}</h2>
              <div className="flex flex-wrap gap-3">
                <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={isAr ? 'ترتيب حسب' : 'Sort by'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{isAr ? 'الأحدث' : 'Newest'}</SelectItem>
                    <SelectItem value="oldest">{isAr ? 'الأقدم' : 'Oldest'}</SelectItem>
                    <SelectItem value="name">{isAr ? 'الاسم' : 'Name'}</SelectItem>
                  </SelectContent>
                </Select>
                {hasPermission('manage_colleges') && (
                  <Button onClick={() => openAdd('college')} className="bg-gold text-gold-foreground">
                    <Plus className="h-4 w-4 me-1" />{t('common.add')}
                  </Button>
                )}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {processData(colleges
                .filter(c => {
                  if (role === 'super_admin') return true;
                  if (role === 'university_admin') return c.university_id === userRole.university_id;
                  if (role === 'college_admin') return c.id === userRole.college_id;
                  return false;
                }))
                .map(c => (
                  <Card key={c.id} className="relative">
                    <CardContent className="flex items-center justify-between p-4 overflow-hidden">
                      {c.is_pinned === 1 && (
                        <div className="absolute top-0 right-0 p-1 bg-gold/10 rounded-bl-lg">
                          <Pin className="h-3 w-3 text-gold" />
                        </div>
                      )}
                      <div>
                        <span className="font-semibold">{getName(c)}</span>
                        {c.universities && <span className="block text-xs text-muted-foreground">{getName(c.universities)}</span>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit('college', c)}><Edit className="h-4 w-4" /></Button>
                        {(role === 'super_admin' || role === 'university_admin') && (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete('colleges', c.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        )}

        {/* Departments */}
        {hasPermission('manage_departments') && (
          <TabsContent value="departments">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t('dashboard.manage_departments')}</h2>
              {hasPermission('manage_departments') && role !== 'department_admin' && (
                <Button onClick={() => openAdd('department')} className="bg-gold text-gold-foreground"><Plus className="h-4 w-4 me-1" />{t('common.add')}</Button>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {departments
                .filter(d => {
                  if (role === 'super_admin') return true;
                  if (role === 'university_admin') return d.university_id === userRole.university_id;
                  if (role === 'college_admin') return d.college_id === userRole.college_id;
                  if (role === 'department_admin') return d.id === userRole.department_id;
                  return false;
                })
                .map(d => (
                  <Card key={d.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <span className="font-semibold">{getName(d)}</span>
                        {d.colleges && <span className="block text-xs text-muted-foreground">{getName(d.colleges)}</span>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit('department', d)}><Edit className="h-4 w-4" /></Button>
                        {(role === 'super_admin' || role === 'university_admin' || role === 'college_admin') && (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete('departments', d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        )}

        {/* Announcements */}
        {
          hasPermission('manage_announcements') && (
            <TabsContent value="announcements">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h2 className="text-xl font-bold">{t('dashboard.manage_announcements')}</h2>
                <div className="flex flex-wrap gap-3">
                  <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={isAr ? 'ترتيب حسب' : 'Sort by'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">{isAr ? 'الأحدث' : 'Newest'}</SelectItem>
                      <SelectItem value="oldest">{isAr ? 'الأقدم' : 'Oldest'}</SelectItem>
                      <SelectItem value="name">{isAr ? 'الاسم' : 'Name'}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => openAdd('announcement')} className="bg-gold text-gold-foreground">
                    <Plus className="h-4 w-4 me-1" />{t('common.add')}
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {processData(announcements).map((a: any) => (
                  <Card key={a.id} className="relative">
                    <CardContent className="p-4 overflow-hidden">
                      {a.is_pinned === 1 && (
                        <div className="absolute top-0 right-0 p-1 bg-gold/10 rounded-bl-lg">
                          <Pin className="h-3 w-3 text-gold" />
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold">{language === 'ar' ? a.title_ar : a.title_en}</h3>
                          <span className="text-xs text-muted-foreground mr-2">{t(`scopes.${a.scope}`)}</span>
                        </div>
                        {(role === 'super_admin' || a.created_by === user.id) && (
                          <div className="flex gap-1">
                            <Button variant="outline" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50" onClick={() => openEdit('announcement', a)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete('announcements', a.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{language === 'ar' ? a.content_ar : a.content_en}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )
        }

        {/* Jobs */}
        <TabsContent value="jobs">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-xl font-bold">{t('dashboard.manage_jobs')}</h2>
            <div className="flex flex-wrap gap-3">
              <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={isAr ? 'ترتيب حسب' : 'Sort by'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{isAr ? 'الأحدث' : 'Newest'}</SelectItem>
                  <SelectItem value="oldest">{isAr ? 'الأقدم' : 'Oldest'}</SelectItem>
                  <SelectItem value="name">{isAr ? 'الاسم' : 'Name'}</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => openAdd('job')} className="bg-gold text-gold-foreground">
                <Plus className="h-4 w-4 me-1" />{t('common.add')}
              </Button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {processData(jobs).map((j: any) => (
              <Card key={j.id} className="relative">
                <CardContent className="p-4 overflow-hidden">
                  {j.is_pinned === 1 && (
                    <div className="absolute top-0 right-0 p-1 bg-gold/10 rounded-bl-lg">
                      <Pin className="h-3 w-3 text-gold" />
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold">{language === 'ar' ? j.title_ar : j.title_en}</h3>
                    <div className="flex gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50" onClick={() => loadJobApplications(j.id)}>
                        <Users className="h-4 w-4" />
                      </Button>

                      {(role === 'super_admin' || role === 'university_admin' || role === 'college_admin') && (
                        <>
                          <Button variant="outline" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50" onClick={() => openEdit('job', j)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete('jobs', j.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{language === 'ar' ? j.description_ar : j.description_en}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Graduates */}
        <TabsContent value="graduates">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">{t('dashboard.manage_graduates')}</h2>
              <Button onClick={() => openAdd('graduate')} className="bg-gold text-gold-foreground">
                <Plus className="h-4 w-4 me-1" />{t('common.add')}
              </Button>
            </div>

            <div className="flex flex-wrap gap-3 p-4 bg-muted/30 rounded-xl">
              <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={isAr ? 'الترتيب' : 'Sort'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{isAr ? 'الأحدث' : 'Newest'}</SelectItem>
                  <SelectItem value="oldest">{isAr ? 'الأقدم' : 'Oldest'}</SelectItem>
                  <SelectItem value="name">{isAr ? 'الاسم' : 'Name'}</SelectItem>
                </SelectContent>
              </Select>

              {role === 'super_admin' && (
                <Select value={uniFilter} onValueChange={(v) => { setUniFilter(v); setCollegeFilter('all'); setDeptFilter('all'); }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={isAr ? 'كل الجامعات' : 'All Universities'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? 'كل الجامعات' : 'All Universities'}</SelectItem>
                    {universities.map(u => <SelectItem key={u.id} value={u.id}>{getName(u)}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}

              {(role === 'super_admin' || role === 'university_admin') && (
                <Select value={collegeFilter} onValueChange={(v) => { setCollegeFilter(v); setDeptFilter('all'); }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={isAr ? 'كل الكليات' : 'All Colleges'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? 'كل الكليات' : 'All Colleges'}</SelectItem>
                    {colleges
                      .filter(c => uniFilter === 'all' || c.university_id === uniFilter)
                      .map(c => <SelectItem key={c.id} value={c.id}>{getName(c)}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}

              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={isAr ? 'كل الأقسام' : 'All Departments'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? 'كل الأقسام' : 'All Departments'}</SelectItem>
                  {departments
                    .filter(d => collegeFilter === 'all' || d.college_id === collegeFilter)
                    .map(d => <SelectItem key={d.id} value={d.id}>{getName(d)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {processData(graduates).map((g: any) => (
              <Card key={g.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <span className="font-semibold">{language === 'ar' ? g.full_name_ar : (g.full_name_en || g.full_name_ar)}</span>
                    <span className="block text-xs text-muted-foreground">{g.graduation_year} - {departments.find(d => d.id === g.department_id)?.name_ar || ''}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit('graduate', g)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete('graduates', g.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Research */}
        <TabsContent value="research">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">{t('dashboard.manage_research')}</h2>
              <Button onClick={() => openAdd('research')} className="bg-gold text-gold-foreground">
                <Plus className="h-4 w-4 me-1" />{t('common.add')}
              </Button>
            </div>

            <div className="flex flex-wrap gap-3 p-4 bg-muted/30 rounded-xl">
              <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={isAr ? 'الترتيب' : 'Sort'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{isAr ? 'الأحدث' : 'Newest'}</SelectItem>
                  <SelectItem value="oldest">{isAr ? 'الأقدم' : 'Oldest'}</SelectItem>
                  <SelectItem value="name">{isAr ? 'الاسم' : 'Name'}</SelectItem>
                </SelectContent>
              </Select>

              {role === 'super_admin' && (
                <Select value={uniFilter} onValueChange={(v) => { setUniFilter(v); setCollegeFilter('all'); setDeptFilter('all'); }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={isAr ? 'كل الجامعات' : 'All Universities'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? 'كل الجامعات' : 'All Universities'}</SelectItem>
                    {universities.map(u => <SelectItem key={u.id} value={u.id}>{getName(u)}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}

              {(role === 'super_admin' || role === 'university_admin') && (
                <Select value={collegeFilter} onValueChange={(v) => { setCollegeFilter(v); setDeptFilter('all'); }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={isAr ? 'كل الكليات' : 'All Colleges'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? 'كل الكليات' : 'All Colleges'}</SelectItem>
                    {colleges
                      .filter(c => uniFilter === 'all' || c.university_id === uniFilter)
                      .map(c => <SelectItem key={c.id} value={c.id}>{getName(c)}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}

              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={isAr ? 'كل الأقسام' : 'All Departments'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? 'كل الأقسام' : 'All Departments'}</SelectItem>
                  {departments
                    .filter(d => collegeFilter === 'all' || d.college_id === collegeFilter)
                    .map(d => <SelectItem key={d.id} value={d.id}>{getName(d)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {processData(research).map((r: any) => (
              <Card key={r.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1 min-w-0 me-2">
                    <span className="font-semibold block truncate text-sm">{language === 'ar' ? r.title_ar : (r.title_en || r.title_ar)}</span>
                    <span className="block text-xs text-muted-foreground truncate">{r.author_name} - {departments.find(d => d.id === r.department_id)?.name_ar || ''}</span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit('research', r)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete('research', r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="fees">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{t('dashboard.manage_fees')}</h2>
            <Button onClick={() => openAdd('fee')} className="bg-gold text-gold-foreground"><Plus className="h-4 w-4 me-1" />{t('common.add')}</Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {fees.map((f: any) => (
              <Card key={f.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <span className="font-semibold">{f.amount?.toLocaleString()} {f.currency}</span>
                    <span className="block text-xs text-muted-foreground">{f.fee_type === 'public' ? t('fees.public') : t('fees.private')} - {departments.find(d => d.id === f.department_id)?.name_ar || ''}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit('fee', f)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete('fees', f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* About Page Management */}
        {
          role === 'super_admin' && (
            <TabsContent value="about_mgmt">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{language === 'ar' ? 'إدارة صفحة "من نحن"' : 'Manage About Us'}</h2>
                <Button onClick={() => {
                  if (aboutData) {
                    openEdit('about', aboutData);
                  } else {
                    openAdd('about');
                  }
                }} className="bg-gold text-gold-foreground">
                  <Edit className="h-4 w-4 me-1" />{language === 'ar' ? 'تعديل المحتوى' : 'Edit Content'}
                </Button>
              </div>
              {aboutData ? (
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h3 className="font-bold text-gold mb-2">{language === 'ar' ? 'عن المشروع:' : 'About Project:'}</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{getName(aboutData)}</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2">{language === 'ar' ? aboutData.content_ar : aboutData.content_en}</p>
                    </div>
                    <div className="pt-4 border-t">
                      <h3 className="font-bold text-gold mb-2">{language === 'ar' ? 'المطور:' : 'Developer:'}</h3>
                      <p className="text-sm font-semibold">{language === 'ar' ? aboutData.developer_name_ar : aboutData.developer_name_en}</p>
                      <p className="text-xs text-muted-foreground mt-1">{language === 'ar' ? aboutData.developer_bio_ar : aboutData.developer_bio_en}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <p className="text-center text-muted-foreground py-8">{language === 'ar' ? 'لا يوجد بيانات حالياً، اضغط على تعديل لإضافة البيانات' : 'No data available, click Edit to add content'}</p>
              )}
            </TabsContent>
          )
        }

        {/* Error Logs */}
        {role === 'super_admin' && (
          <TabsContent value="error_logs">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" />{language === 'ar' ? 'سجل الأخطاء' : 'Error Logs'}</h2>
            </div>
            {errorLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{language === 'ar' ? 'لا توجد أخطاء مسجلة حالياً' : 'No errors logged currently'}</p>
            ) : (
              <div className="space-y-3">
                {errorLogs.map((log: any) => (
                  <Card key={log.id} className="border-l-4 border-l-destructive">
                    <CardContent className="p-4 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-destructive">{log.message}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{new Date(log.created_at).toLocaleString(language === 'ar' ? 'ar-IQ' : 'en-US')}</span>
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded-md font-mono overflow-auto max-h-32 whitespace-pre-wrap">
                        {log.stack_trace || 'No stack trace available'}
                      </div>
                      <div className="text-xs text-muted-foreground flex justify-between mt-1 pt-2 border-t">
                        <span><span className="font-semibold">{language === 'ar' ? 'المصدر:' : 'Source:'}</span> {log.source}</span>
                        <span><span className="font-semibold">{language === 'ar' ? 'المستخدم:' : 'User ID:'}</span> {log.user_name ? `${log.user_name} (${log.user_email || 'No email'})` : log.user_id || 'Unknown/Anonymous'}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* Security - Change Password */}
        <TabsContent value="security">
          <SecurityTab userId={user?.id || ''} language={language} />
        </TabsContent>

      </Tabs>

      {/* Add/Edit Dialog */}
      < Dialog open={dialogOpen} onOpenChange={setDialogOpen} >
        <DialogContent className="max-h-[80vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{editId ? t('common.edit') : t('common.add')} - {formTitle[activeForm]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {renderForm()}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={loading}>{t('common.cancel')}</Button>
              <Button onClick={handleSave} className="bg-gold text-gold-foreground" disabled={loading}>
                {loading ? t('common.loading') : (editId ? t('common.save') : t('common.add'))}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog >

      {/* Job Applications Dialog */}
      <Dialog open={!!viewingJobId} onOpenChange={(open) => !open && setViewingJobId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'المتقدمين للوظيفة' : 'Job Applicants'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {loadingApps ? (
              <p className="text-center text-muted-foreground py-8">{t('common.loading')}</p>
            ) : jobApplications.length === 0 ? (
              <div className="text-center py-10 bg-muted/30 rounded-lg border-dashed border-2">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground font-medium">{language === 'ar' ? 'لا يوجد متقدمين حتى الآن' : 'No applicants yet'}</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {jobApplications.map(app => (
                  <Card key={app.id} className="overflow-hidden">
                    <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div>
                        <h4 className="font-bold text-foreground">{app.applicant_name || (language === 'ar' ? 'مستخدم غير معروف' : 'Unknown User')}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{app.applicant_email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(app.created_at).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US')}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${app.status === 'approved' ? 'bg-green-100 text-green-700' :
                            app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {app.status === 'approved' ? (language === 'ar' ? 'مقبول' : 'Approved') :
                              app.status === 'rejected' ? (language === 'ar' ? 'مرفوض' : 'Rejected') :
                                (language === 'ar' ? 'قيد الانتظار' : 'Pending')}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-border/50">
                        <a
                          href={app.file_url.startsWith('http') ? app.file_url : `http://localhost:5000${app.file_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-md flex-1 sm:flex-none text-center"
                        >
                          {language === 'ar' ? 'عرض السيرة' : 'View CV'}
                        </a>
                        <Select value={app.status} onValueChange={(val) => handleApplicationStatus(app.id, val)}>
                          <SelectTrigger className="h-8 text-xs w-[110px] flex-1 sm:flex-none">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</SelectItem>
                            <SelectItem value="approved">{language === 'ar' ? 'قبول' : 'Approve'}</SelectItem>
                            <SelectItem value="rejected">{language === 'ar' ? 'رفض' : 'Reject'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div >
  );
};

export default Dashboard;
