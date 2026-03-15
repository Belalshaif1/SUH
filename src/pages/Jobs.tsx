import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import apiClient, { getMediaUrl } from '@/lib/apiClient';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, Calendar, Upload, Search, Building2, MapPin, DollarSign, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';

const Jobs: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient('/jobs')
      .then(data => {
        setJobs(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching jobs:", err);
        setLoading(false);
      });
  }, []);

  const isAr = language === 'ar';

  const filteredJobs = jobs.filter(j => {
    const title = isAr ? j.title_ar : (j.title_en || j.title_ar);
    const company = j.universities ? (language === 'ar' ? j.universities.name_ar : j.universities.name_en) : '';
    return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleApplyClick = (jobId: string) => {
    if (!user) {
      toast({ title: isAr ? 'الرجاء تسجيل الدخول للتقديم' : 'Please log in to apply', variant: 'destructive' });
      navigate('/login');
      return;
    }
    setSelectedJob(jobId);
  };

  const handleApply = async () => {
    if (!selectedJob || !cvFile) {
      toast({ title: isAr ? 'الرجاء اختيار ملف' : 'Please select a file', variant: 'destructive' });
      return;
    }

    setIsApplying(true);
    try {
      const formData = new FormData();
      formData.append('file', cvFile);
      const uploadData = await apiClient('/upload', { method: 'POST', body: formData });

      await apiClient('/job_applications', {
        method: 'POST',
        body: JSON.stringify({ job_id: selectedJob, file_url: uploadData.url })
      });

      toast({ title: isAr ? 'تم التقديم بنجاح' : 'Applied successfully' });
      setSelectedJob(null);
      setCvFile(null);
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' });
    }
    setIsApplying(false);
  };

  return (
    <div className="container mx-auto px-4 py-16 animate-fade-in min-h-[80vh]">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-16 relative p-12 rounded-[3rem] border border-border/50 bg-white/50 backdrop-blur-md overflow-hidden shadow-2xl shadow-primary/5">
        <div className="absolute inset-0 gradient-academic opacity-[0.03] z-0" />

        <div className="flex-1 text-center lg:text-start relative z-10 flex flex-col lg:flex-row items-center gap-10">
          <div className="shrink-0 h-40 w-40 rounded-[2.5rem] bg-white shadow-2xl p-6 flex items-center justify-center border-4 border-slate-50 group hover:rotate-3 transition-transform duration-500">
            <Briefcase className="h-16 w-16 text-primary/10 group-hover:text-primary transition-colors" />
          </div>

          <div className="flex-1">
            <Badge variant="outline" className="px-6 py-2 rounded-full border-gold/30 text-gold bg-gold/5 mb-8 font-bold text-sm uppercase tracking-[0.2em] shadow-sm inline-flex">
              {isAr ? 'فرص وظيفية' : 'Career Opportunities'}
            </Badge>
            <h1 className="text-4xl md:text-7xl font-bold text-primary mb-6">
              {t('jobs.title')}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              {isAr ? 'انضم إلى فريق العمل المتميز في جامعتنا وساهم في بناء مستقبل التعليم.'
                : 'Join the distinguished team at our university and contribute to building the future of education.'}
            </p>
          </div>
        </div>

        <div className="relative w-full lg:w-96 group z-10">
          <Search className="absolute start-8 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder={isAr ? 'ابحث عن مسمى وظيفي أو جهة...' : 'Search for job title or entity...'}
            className="h-20 ps-20 pe-8 text-xl rounded-[2rem] border-2 border-border/30 shadow-2xl focus-visible:ring-primary/10 bg-background/80 text-foreground backdrop-blur-md transition-all group-focus-within:border-primary/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-10 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-96 bg-slate-50/50 animate-pulse rounded-[3rem] border border-border/30" />
          ))}
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="grid gap-10 md:grid-cols-2">
          {filteredJobs.map(j => (
            <Card key={j.id} className="card-premium group relative bg-white border border-border/50 overflow-hidden flex flex-col h-full hover:border-primary/30">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 z-0" />

              <CardContent className="p-10 flex flex-col h-full relative z-10">
                <div className="flex items-start justify-between mb-8">
                  <div className="h-20 w-20 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary transition-all duration-500 overflow-hidden p-4 shadow-inner">
                    {j.universities?.logo_url ? (
                      <img src={getMediaUrl(j.universities.logo_url)} alt="Logo" className="max-w-full max-h-full object-contain group-hover:brightness-0 group-hover:invert transition-all" />
                    ) : (
                      <Briefcase className="h-10 w-10 text-primary group-hover:text-white transition-colors" />
                    )}
                  </div>
                  {j.deadline && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-destructive bg-destructive/5 px-4 py-2 rounded-full uppercase tracking-widest border border-destructive/20 shadow-sm">
                      <Calendar className="h-4 w-4" />
                      <span>{t('jobs.deadline')}: {new Date(j.deadline).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</span>
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold px-4 py-1.5 rounded-full border-primary/20 text-primary bg-primary/5 mb-4 tracking-wider shadow-sm">
                    {language === 'ar'
                      ? `${j.universities?.name_ar || ''} ${j.colleges ? `> ${j.colleges.name_ar}` : ''}`
                      : `${j.universities?.name_en || j.universities?.name_ar || ''} ${j.colleges ? `> ${j.colleges.name_en || j.colleges.name_ar}` : ''}`}
                  </Badge>
                  <h3 className="text-2xl md:text-4xl font-bold text-primary leading-tight group-hover:text-gold transition-colors mb-4">
                    {isAr ? j.title_ar : (j.title_en || j.title_ar)}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-4 mb-8">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-slate-50 px-4 py-2.5 rounded-2xl border border-border/30">
                    <MapPin className="h-4 w-4 text-gold" />
                    <span className="font-bold">{isAr ? 'عن بعد' : 'Remote'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-slate-50 px-4 py-2.5 rounded-2xl border border-border/30">
                    <Clock className="h-4 w-4 text-gold" />
                    <span className="font-bold">{isAr ? 'دوام كامل' : 'Full-time'}</span>
                  </div>
                </div>

                <p className="text-muted-foreground text-lg leading-relaxed mb-10 line-clamp-3">
                  {isAr ? j.description_ar : (j.description_en || j.description_ar)}
                </p>

                <Button
                  className="w-full h-16 rounded-2xl text-lg font-bold shadow-2xl shadow-primary/20 hover:bg-primary/90 transition-all transform active:scale-95 mt-auto bg-primary text-primary-foreground"
                  onClick={() => handleApplyClick(j.id)}
                >
                  {isAr ? 'التقديم لهذه الوظيفة' : 'Apply for this Job'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-40 text-center bg-white/50 backdrop-blur-sm rounded-[4rem] border border-dashed border-primary/20 shadow-2xl shadow-primary/5">
          <div className="h-24 w-24 rounded-full bg-primary/5 flex items-center justify-center mb-10">
            <Briefcase className="h-12 w-12 text-primary/10" />
          </div>
          <h3 className="text-4xl font-bold text-primary mb-6">{isAr ? 'لا توجد وظائف متاحة' : 'No Jobs Available'}</h3>
          <p className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
            {searchTerm ? (isAr ? 'حاول البحث بكلمات أخرى.' : 'Try searching for other keywords.') : t('jobs.no_jobs')}
          </p>
        </div>
      )}

      <Dialog open={!!selectedJob} onOpenChange={(open) => { if (!open) { setSelectedJob(null); setCvFile(null); } }}>
        <DialogContent className="sm:max-w-md rounded-[3rem] p-10 border-none shadow-2xl overflow-hidden bg-white" aria-describedby={undefined}>
          <div className="absolute top-0 left-0 w-full h-3 gradient-academic" />
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-primary text-center mb-4">
              {isAr ? 'إرسال طلب تقديم' : 'Submit Application'}
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground text-lg leading-relaxed">
              {isAr ? 'يرجى إرفاق سيرتك الذاتية (CV) للبدء في عملية التوظيف.'
                : 'Please attach your CV to start the hiring process.'}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-10 space-y-8">
            <div
              className={`relative py-12 flex flex-col items-center justify-center border-4 border-dashed rounded-[2.5rem] transition-all duration-300 ${cvFile ? 'border-primary bg-primary/5' : 'border-border/30 bg-slate-50/50 hover:bg-slate-50'}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                setCvFile(e.dataTransfer.files?.[0] || null);
              }}
            >
              <input
                type="file"
                id="cv-upload"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setCvFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="cv-upload" className="cursor-pointer flex flex-col items-center gap-6 w-full">
                <div className={`h-20 w-20 rounded-full flex items-center justify-center transition-all shadow-xl ${cvFile ? 'bg-primary text-primary-foreground scale-110' : 'bg-white text-muted-foreground'}`}>
                  <Upload className="h-10 w-10" />
                </div>
                <div className="text-center px-6">
                  <span className="text-xl font-bold text-primary block mb-2">
                    {cvFile ? cvFile.name : (isAr ? 'اختر ملف السيرة الذاتية' : 'Select CV file')}
                  </span>
                  <span className="text-base text-muted-foreground">
                    {cvFile ? (isAr ? 'تم اختيار الملف بنجاح' : 'File selected successfully') : (isAr ? 'أو قم بسحب الملف هنا' : 'or drag and drop here')}
                  </span>
                </div>
              </label>
            </div>

            <div className="flex flex-col gap-4">
              <Button
                className="w-full h-16 rounded-2xl text-xl font-bold shadow-2xl shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleApply}
                disabled={!cvFile || isApplying}
              >
                {isApplying ? <div className="animate-spin rounded-full h-7 w-7 border-4 border-white border-t-transparent" /> : (isAr ? 'إرسال الطلب الآن' : 'Submit Now')}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground h-14 rounded-2xl text-lg hover:bg-primary/5 hover:text-primary"
                onClick={() => { setSelectedJob(null); setCvFile(null); }}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Jobs;
