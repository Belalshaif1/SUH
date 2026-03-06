import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import apiClient from '@/lib/apiClient';
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
        <div className="space-y-4">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-4 py-1 rounded-full font-bold">
            {isAr ? 'فرص وظيفية' : 'Career Opportunities'}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
            {t('jobs.title')}
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            {isAr ? 'انضم إلى فريق العمل المتميز في جامعتنا وساهم في بناء مستقبل التعليم.'
              : 'Join the distinguished team at our university and contribute to building the future of education.'}
          </p>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={isAr ? 'ابحث عن مسمى وظيفي أو جهة...' : 'Search for job title or entity...'}
            className="ps-12 py-7 bg-card border-border/60 focus:border-gold/50 rounded-2xl shadow-sm text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-8 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-64 bg-muted/20 animate-pulse rounded-[2rem]" />
          ))}
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-2">
          {filteredJobs.map(j => (
            <Card key={j.id} className="group border-none bg-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 rounded-[3rem] p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />

              <CardContent className="p-8 flex flex-col h-full relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all duration-500">
                    <Briefcase className="h-8 w-8 text-primary group-hover:text-white transition-colors" />
                  </div>
                  {j.deadline && (
                    <div className="flex items-center gap-2 text-xs font-bold text-destructive bg-destructive/5 px-4 py-2 rounded-full">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{t('jobs.deadline')}: {new Date(j.deadline).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</span>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <Badge variant="outline" className="text-[10px] uppercase font-black px-3 py-1 rounded-full border-primary/20 text-primary bg-primary/5 mb-2">
                    {language === 'ar'
                      ? `${j.universities?.name_ar || ''} ${j.colleges ? `> ${j.colleges.name_ar}` : ''}`
                      : `${j.universities?.name_en || j.universities?.name_ar || ''} ${j.colleges ? `> ${j.colleges.name_en || j.colleges.name_ar}` : ''}`}
                  </Badge>
                  <h3 className="text-2xl font-black text-foreground leading-tight group-hover:text-primary transition-colors">
                    {isAr ? j.title_ar : (j.title_en || j.title_ar)}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-2xl">
                    <MapPin className="h-4 w-4 text-primary/60" />
                    <span className="font-bold">{isAr ? 'عن بعد' : 'Remote'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-2xl">
                    <Clock className="h-4 w-4 text-primary/60" />
                    <span className="font-bold">{isAr ? 'دوام كامل' : 'Full-time'}</span>
                  </div>
                </div>

                <p className="text-muted-foreground text-sm leading-relaxed mb-8 line-clamp-3">
                  {isAr ? j.description_ar : (j.description_en || j.description_ar)}
                </p>

                <Button
                  className="w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all transform active:scale-95 mt-auto"
                  onClick={() => handleApplyClick(j.id)}
                >
                  {isAr ? 'التقديم لهذه الوظيفة' : 'Apply for this Job'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-card/20 rounded-[3rem] border border-dashed border-border/40">
          <Briefcase className="h-20 w-20 text-muted-foreground mb-6 opacity-20" />
          <h3 className="text-2xl font-bold text-foreground mb-2">{isAr ? 'لا توجد وظائف متاحة' : 'No Jobs Available'}</h3>
          <p className="text-muted-foreground max-w-sm">
            {searchTerm ? (isAr ? 'حاول البحث بكلمات أخرى.' : 'Try searching for other keywords.') : t('jobs.no_jobs')}
          </p>
        </div>
      )}

      <Dialog open={!!selectedJob} onOpenChange={(open) => { if (!open) { setSelectedJob(null); setCvFile(null); } }}>
        <DialogContent className="sm:max-w-md rounded-[2rem] p-8 border-none shadow-2xl overflow-hidden" aria-describedby={undefined}>
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-primary/50 to-primary" />
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center mb-2">
              {isAr ? 'إرسال طلب تقديم' : 'Submit Application'}
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              {isAr ? 'يرجى إرفاق سيرتك الذاتية (CV) للبدء في عملية التوظيف.'
                : 'Please attach your CV to start the hiring process.'}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-8 space-y-6">
            <div
              className={`relative py-10 flex flex-col items-center justify-center border-2 border-dashed rounded-[2rem] transition-all duration-300 ${cvFile ? 'border-primary bg-primary/5' : 'border-border/60 bg-muted/20 hover:bg-muted/30'}`}
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
              <label htmlFor="cv-upload" className="cursor-pointer flex flex-col items-center gap-4 w-full">
                <div className={`h-16 w-16 rounded-full flex items-center justify-center transition-all ${cvFile ? 'bg-primary text-white scale-110' : 'bg-background text-muted-foreground shadow-sm'}`}>
                  <Upload className="h-8 w-8" />
                </div>
                <div className="text-center px-4">
                  <span className="text-lg font-bold text-foreground block mb-1">
                    {cvFile ? cvFile.name : (isAr ? 'اختر ملف السيرة الذاتية' : 'Select CV file')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {cvFile ? (isAr ? 'تم اختيار الملف بنجاح' : 'File selected successfully') : (isAr ? 'أو قم بسحب الملف هنا' : 'or drag and drop here')}
                  </span>
                </div>
              </label>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                className="w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary/20"
                onClick={handleApply}
                disabled={!cvFile || isApplying}
              >
                {isApplying ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : (isAr ? 'إرسال الطلب الآن' : 'Submit Now')}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground h-12 rounded-xl"
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
