import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, ArrowRight, ArrowLeft, Search, FileText, Download, Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import apiClient from '@/lib/apiClient';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PDFViewer from '@/components/ui/PDFViewer';

const Universities: React.FC = () => {
  const { t, language, isRTL } = useLanguage();
  const { universityId, collegeId } = useParams();
  const [universities, setUniversities] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [search, setSearch] = useState('');
  const [currentUni, setCurrentUni] = useState<any>(null);
  const [currentCollege, setCurrentCollege] = useState<any>(null);
  const [previewPdf, setPreviewPdf] = useState<{ url: string, title: string } | null>(null);
  const isAr = language === 'ar';
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (collegeId) {
          const deps = await apiClient('/departments', { params: { college_id: collegeId } });
          setDepartments(deps || []);
          const college = await apiClient(`/colleges/${collegeId}`);
          setCurrentCollege(college);
        } else if (universityId) {
          const cols = await apiClient('/colleges', { params: { university_id: universityId } });
          setColleges(cols || []);
          const uni = await apiClient(`/universities/${universityId}`);
          setCurrentUni(uni);
        } else {
          const unis = await apiClient('/universities', { params: { sort: sortBy } });
          setUniversities(unis || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, [universityId, collegeId, sortBy]);

  const getName = (item: any) => language === 'ar' ? item.name_ar : (item.name_en || item.name_ar);
  const getDesc = (item: any) => language === 'ar' ? item.description_ar : (item.description_en || item.description_ar);

  const filteredUniversities = universities.filter(u =>
    getName(u).toLowerCase().includes(search.toLowerCase())
  );

  // Show departments for a college
  if (collegeId) {
    return (
      <div className="container mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Link to={`/universities/${currentCollege?.university_id}`}>
          <Button variant="ghost" className="mb-8 hover:bg-primary/10 rounded-full group transition-all">
            <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''} me-2 group-hover:-translate-x-1 transition-transform`} />
            {t('universities.back')}
          </Button>
        </Link>

        <div className="flex flex-col lg:flex-row items-center gap-12 mb-20 bg-gradient-to-br from-gold/10 to-transparent p-12 rounded-[3rem] border border-gold/5">
          <div className="flex-1 text-center lg:text-start">
            <Badge className="bg-gold/10 text-gold hover:bg-gold/20 border-none px-4 py-1 rounded-full font-bold mb-4">
              {isAr ? 'عرض الكلية' : 'College View'}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tight mb-6">
              {currentCollege && getName(currentCollege)}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 max-w-3xl">
              {currentCollege && getDesc(currentCollege)}
            </p>
          </div>
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-[3.5rem] bg-white shadow-2xl flex items-center justify-center border-8 border-gold/5 overflow-hidden p-10 group relative transition-all duration-700 hover:rotate-3">
            <div className="absolute inset-0 bg-gradient-to-tr from-gold/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            {currentCollege?.logo_url ? (
              <img src={currentCollege.logo_url.startsWith('http') ? currentCollege.logo_url : `http://localhost:5000${currentCollege.logo_url}`} alt="Logo" className="max-w-full max-h-full object-contain relative z-10" />
            ) : (
              <Building2 className="h-24 w-24 text-gold/20 relative z-10" />
            )}
          </div>
        </div>

        <div className="mb-8 flex items-center gap-4">
          <div className="h-8 w-1.5 bg-gold rounded-full" />
          <h2 className="text-3xl font-bold">{t('universities.departments')}</h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {departments.map((d, index) => (
            <Card key={d.id} className="group overflow-hidden border-none bg-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 rounded-[2.5rem] p-4 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
              <CardContent className="p-8 h-full flex flex-col relative z-10">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/5 shadow-inner mb-6 group-hover:scale-110 group-hover:bg-gold transition-all duration-500 overflow-hidden p-3">
                  {d.logo_url ? (
                    <img src={d.logo_url.startsWith('http') ? d.logo_url : `http://localhost:5000${d.logo_url}`} alt="Logo" className="max-w-full max-h-full object-contain group-hover:brightness-0 group-hover:invert transition-all" />
                  ) : (
                    <FileText className="h-8 w-8 text-gold group-hover:text-white transition-colors" />
                  )}
                </div>
                <h3 className="text-2xl font-black mb-4 group-hover:text-gold transition-colors">{getName(d)}</h3>
                <p className="text-muted-foreground leading-relaxed mb-8 line-clamp-3 flex-grow">
                  {getDesc(d) || t('common.no_data')}
                </p>
                {d.study_plan_url && (
                  <div className="flex gap-4 mt-auto">
                    <Button
                      className="flex-1 h-12 rounded-2xl font-black bg-gold text-white shadow-lg shadow-gold/20 hover:shadow-gold/40 transition-all active:scale-95"
                      onClick={() => setPreviewPdf({
                        url: d.study_plan_url.startsWith('http') ? d.study_plan_url : `http://localhost:5000${d.study_plan_url}`,
                        title: getName(d)
                      })}
                    >
                      <Eye className="h-4 w-4 me-2" />{isAr ? 'خطة دراسية' : 'Study Plan'}
                    </Button>
                    <a
                      href={d.study_plan_url.startsWith('http') ? d.study_plan_url : `http://localhost:5000${d.study_plan_url}`}
                      download={`${getName(d)}_Plan.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-gold/20 hover:bg-gold/5 hover:border-gold transition-all">
                        <Download className="h-5 w-5 text-gold" />
                      </Button>
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {departments.length === 0 && (
            <div className="col-span-full py-24 text-center bg-muted/20 rounded-[3rem] border border-dashed border-border/40">
              <FileText className="h-20 w-20 text-muted-foreground/10 mx-auto mb-6" />
              <p className="text-2xl font-medium text-muted-foreground">{t('common.no_data')}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show colleges for a university
  if (universityId) {
    return (
      <div className="container mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Link to="/universities">
          <Button variant="ghost" className="mb-8 hover:bg-primary/10 rounded-full group transition-all">
            <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''} me-2 group-hover:-translate-x-1 transition-transform`} />
            {t('universities.back')}
          </Button>
        </Link>

        <div className="flex flex-col lg:flex-row items-center gap-12 mb-20 bg-gradient-to-br from-primary/10 to-transparent p-12 rounded-[3rem] border border-primary/5">
          <div className="flex-1 text-center lg:text-start">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-4 py-1 rounded-full font-bold mb-4">
              {isAr ? 'عرض الجامعة' : 'University View'}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tight mb-6">
              {currentUni && getName(currentUni)}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 max-w-3xl">
              {currentUni && getDesc(currentUni)}
            </p>
            {currentUni?.guide_pdf_url && (
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <Button
                  className="h-14 px-10 rounded-2xl text-lg font-black bg-primary shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95"
                  onClick={() => setPreviewPdf({ url: currentUni.guide_pdf_url.startsWith('http') ? currentUni.guide_pdf_url : `http://localhost:5000${currentUni.guide_pdf_url}`, title: getName(currentUni) })}
                >
                  <Eye className="h-5 w-5 me-2" />{isAr ? 'دليل الجامعة' : 'University Guide'}
                </Button>
              </div>
            )}
          </div>
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-[3.5rem] bg-white shadow-2xl flex items-center justify-center border-8 border-primary/5 overflow-hidden p-10 group relative transition-all duration-700 hover:-rotate-3">
            <div className="absolute inset-0 bg-gradient-to-bl from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            {currentUni?.logo_url ? (
              <img src={currentUni.logo_url.startsWith('http') ? currentUni.logo_url : `http://localhost:5000${currentUni.logo_url}`} alt="Logo" className="max-w-full max-h-full object-contain relative z-10 font-black" />
            ) : (
              <Building2 className="h-24 w-24 text-primary/20 relative z-10" />
            )}
          </div>
        </div>

        <div className="mb-8 flex items-center gap-4">
          <div className="h-8 w-1.5 bg-primary rounded-full" />
          <h2 className="text-3xl font-bold">{t('universities.colleges')}</h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {colleges.map(c => (
            <Link key={c.id} to={`/universities/${universityId}/colleges/${c.id}`} className="group">
              <Card className="h-full overflow-hidden border-none bg-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 rounded-[2.5rem] p-4 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                <CardContent className="p-8 relative z-10 h-full flex flex-col">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 shadow-inner mb-8 group-hover:bg-primary group-hover:scale-110 transition-all duration-500 overflow-hidden p-3">
                    {c.logo_url ? (
                      <img src={c.logo_url.startsWith('http') ? c.logo_url : `http://localhost:5000${c.logo_url}`} alt="Logo" className="max-w-full max-h-full object-contain group-hover:brightness-0 group-hover:invert transition-all" />
                    ) : (
                      <Building2 className="h-8 w-8 text-primary group-hover:text-white transition-colors" />
                    )}
                  </div>
                  <h3 className="text-2xl font-black mb-4 group-hover:text-primary transition-colors">{getName(c)}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-8 line-clamp-3 flex-grow">
                    {getDesc(c) || ''}
                  </p>
                  <div className="flex items-center text-primary font-black group-hover:translate-x-2 transition-transform mt-auto pt-4 border-t border-slate-50">
                    <span>{isAr ? 'عرض الأقسام' : 'View Departments'}</span>
                    <Arrow className="h-6 w-6 ms-2" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {colleges.length === 0 && (
            <div className="col-span-full py-24 text-center bg-muted/20 rounded-[3rem] border border-dashed border-border/40">
              <Building2 className="h-20 w-20 text-muted-foreground/10 mx-auto mb-6" />
              <p className="text-2xl font-medium text-muted-foreground">{t('common.no_data')}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show all universities
  return (
    <>
      <div className="container mx-auto px-4 py-16 animate-in fade-in duration-1000">
        <div className="text-center mb-16">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-4 py-1 rounded-full font-bold mb-4">
            {isAr ? 'دليل الجامعات الذكي' : 'Smart University Guide'}
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tight mb-8">
            {t('universities.title')}
          </h1>
          <div className="h-2 w-32 bg-primary mx-auto rounded-full mb-12 shadow-xl shadow-primary/20" />
          <div className="max-w-2xl mx-auto group">
            <div className="relative group">
              <Search className="absolute start-6 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder={t('universities.search')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-16 ps-16 pe-6 text-lg rounded-[2.5rem] border-none shadow-2xl focus-visible:ring-2 focus-visible:ring-primary/20 bg-white"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
          {filteredUniversities.map(u => (
            <Link key={u.id} to={`/universities/${u.id}`} className="group">
              <Card className={`h-full overflow-hidden border-none bg-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 rounded-[3.5rem] p-6 relative ${u.is_pinned ? 'ring-4 ring-gold/20' : ''}`}>
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 group-hover:scale-125 transition-transform duration-700" />

                {u.is_pinned && (
                  <div className="absolute top-8 right-8 z-10 bg-gold text-white p-2 rounded-2xl shadow-lg shadow-gold/30">
                    <Building2 className="h-6 w-6" />
                  </div>
                )}

                <div className="relative p-4">
                  <div className="flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-slate-50 shadow-inner mb-10 group-hover:scale-110 group-hover:bg-primary transition-all duration-500 p-5 overflow-hidden">
                    {u.logo_url ? (
                      <img src={u.logo_url.startsWith('http') ? u.logo_url : `http://localhost:5000${u.logo_url}`} alt="Logo" className="max-w-full max-h-full object-contain group-hover:brightness-0 group-hover:invert transition-all" />
                    ) : (
                      <Building2 className="h-12 w-12 text-primary group-hover:text-white transition-colors" />
                    )}
                  </div>

                  <CardTitle className="text-3xl font-black mb-6 group-hover:text-primary transition-colors tracking-tight leading-tight">
                    {getName(u)}
                  </CardTitle>

                  <p className="text-muted-foreground text-lg leading-relaxed mb-12 line-clamp-3">
                    {getDesc(u) || ''}
                  </p>

                  <div className="flex items-center justify-between pt-8 border-t border-slate-100">
                    <span className="text-primary font-black text-xl group-hover:translate-x-2 transition-transform inline-flex items-center">
                      {isAr ? 'اكتشف المزيد' : 'Discover More'}
                      <Arrow className="h-7 w-7 ms-2" />
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
          {filteredUniversities.length === 0 && (
            <div className="col-span-full py-40 text-center bg-muted/20 rounded-[4rem] border border-dashed border-border/60">
              <Search className="h-24 w-24 text-muted-foreground/5 mx-auto mb-8" />
              <h3 className="text-3xl font-bold text-muted-foreground tracking-tight">{t('common.no_data')}</h3>
            </div>
          )}
        </div>
      </div>

      <PDFViewer
        isOpen={!!previewPdf}
        onClose={() => setPreviewPdf(null)}
        url={previewPdf?.url || ''}
        title={previewPdf?.title || ''}
        language={language}
      />
    </>
  );
};

export default Universities;
