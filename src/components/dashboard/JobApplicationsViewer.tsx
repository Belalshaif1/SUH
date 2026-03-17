import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import apiClient, { getMediaUrl } from '@/lib/apiClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, CheckCircle, XCircle, Mail, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Props {
  jobId: string | null;
  onClose: () => void;
}

export const JobApplicationsViewer: React.FC<Props> = ({ jobId, onClose }) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const isAr = language === 'ar';

  useEffect(() => {
    if (!jobId) return;
    const fetchApps = async () => {
      setLoading(true);
      try {
        const data = await apiClient(`/job_applications/job/${jobId}`);
        setApplications(data || []);
      } catch (err: any) {
        toast({ title: err.message || "Failed to load applications", variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, [jobId]);

  const handleStatusUpdate = async (appId: string, status: string) => {
    try {
      await apiClient(`/job_applications/${appId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      toast({ title: isAr ? 'تم تحديث الحالة بنجاح' : 'Status updated successfully' });
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
    } catch (err: any) {
      toast({ title: err.message || "Failed to update status", variant: 'destructive' });
    }
  };

  return (
    <Dialog open={!!jobId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white dark:bg-slate-900 border-none rounded-[2rem] shadow-2xl">
        <div className="bg-primary/5 p-6 border-b border-primary/10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-primary flex items-center gap-2">
              <User className="h-6 w-6" />
              {isAr ? 'المتقدمين للوظيفة' : 'Job Applicants'}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground">
              {isAr ? 'لا يوجد متقدمين حتى الآن' : 'No applicants yet'}
            </div>
          ) : (
            applications.map(app => (
              <div key={app.id} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition-all">
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-1">{app.applicant_name}</h3>
                  <div className="flex items-center text-muted-foreground mb-3 font-medium">
                    <Mail className="h-4 w-4 me-2" />
                    {app.applicant_email}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline" className={`px-4 py-1.5 rounded-xl font-bold ${
                      app.status === 'accepted' ? 'bg-green-100 text-green-700 border-green-200' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                      'bg-amber-100 text-amber-700 border-amber-200'
                    }`}>
                      {app.status === 'accepted' ? (isAr ? 'مقبول' : 'Accepted') :
                       app.status === 'rejected' ? (isAr ? 'مرفوض' : 'Rejected') :
                       (isAr ? 'قيد الانتظار' : 'Pending')}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-medium">
                      {new Date(app.created_at).toLocaleDateString(isAr ? 'ar-IQ' : 'en-US')}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <a href={getMediaUrl(app.file_url)} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none">
                    <Button variant="outline" className="w-full h-12 rounded-xl border-primary/20 text-primary hover:bg-primary/5 font-bold">
                      <Download className="h-4 w-4 me-2" />
                      {isAr ? 'تحميل السيرة الذاتية' : 'Download CV'}
                    </Button>
                  </a>
                  
                  {app.status !== 'accepted' && (
                    <Button 
                      onClick={() => handleStatusUpdate(app.id, 'accepted')}
                      className="flex-1 md:flex-none h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold"
                    >
                      <CheckCircle className="h-4 w-4 me-2" />
                      {isAr ? 'قبول' : 'Accept'}
                    </Button>
                  )}
                  
                  {app.status !== 'rejected' && (
                    <Button 
                      onClick={() => handleStatusUpdate(app.id, 'rejected')}
                      variant="destructive"
                      className="flex-1 md:flex-none h-12 rounded-xl font-bold"
                    >
                      <XCircle className="h-4 w-4 me-2" />
                      {isAr ? 'رفض' : 'Reject'}
                    </Button>
                  )}
                </div>

              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
