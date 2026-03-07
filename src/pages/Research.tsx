import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import apiClient from '@/lib/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, User, Eye, Search, BookOpen, Calendar, Filter, SortAsc } from 'lucide-react';
import PDFViewer from '@/components/ui/PDFViewer';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Research: React.FC = () => {
  const { t, language } = useLanguage();
  const [research, setResearch] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewPdf, setPreviewPdf] = useState<{ url: string, title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [universities, setUniversities] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedUni, setSelectedUni] = useState<string>('all');
  const [selectedCollege, setSelectedCollege] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('newest');

  useEffect(() => {
    apiClient('/universities').then(setUniversities).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedUni !== 'all') {
      apiClient('/colleges', { params: { university_id: selectedUni } })
        .then(setColleges)
        .catch(console.error);
    } else {
      setColleges([]);
      setSelectedCollege('all');
      setDepartments([]);
      setSelectedDept('all');
    }
  }, [selectedUni]);

  useEffect(() => {
    if (selectedCollege !== 'all') {
      apiClient('/departments', { params: { college_id: selectedCollege } })
        .then(setDepartments)
        .catch(console.error);
    } else {
      setDepartments([]);
      setSelectedDept('all');
    }
  }, [selectedCollege]);

  useEffect(() => {
    setLoading(true);
    const params: any = {};
    if (selectedUni !== 'all') params.university_id = selectedUni;
    if (selectedCollege !== 'all') params.college_id = selectedCollege;
    if (selectedDept !== 'all') params.department_id = selectedDept;

    apiClient('/research', { params })
      .then(data => {
        let sorted = [...(data || [])];
        if (sortOrder === 'newest') sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        else if (sortOrder === 'oldest') sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        else if (sortOrder === 'name') sorted.sort((a, b) => {
          const nameA = language === 'ar' ? a.title_ar : (a.title_en || a.title_ar);
          const nameB = language === 'ar' ? b.title_ar : (b.title_en || b.title_ar);
          return nameA.localeCompare(nameB, language === 'ar' ? 'ar' : 'en');
        });
        setResearch(sorted);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching research:", err);
        setLoading(false);
      });
  }, [selectedUni, selectedCollege, selectedDept, sortOrder]);

  const isAr = language === 'ar';

  const filteredResearch = research.filter(r => {
    const title = isAr ? r.title_ar : (r.title_en || r.title_ar);
    const author = r.author_name || '';
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      author.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <>
      <div className="container mx-auto px-4 py-20 animate-in fade-in duration-1000 min-h-[80vh]">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-12 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-12 rounded-[3.5rem] border border-primary/5 relative overflow-hidden shadow-2xl shadow-primary/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />

          <div className="flex-1 text-center lg:text-start relative z-10 flex flex-col lg:flex-row items-center gap-10">
            {/* Entity Logo Overlay Logic for Research (Simplified for variety) */}
            <div className="shrink-0 h-36 w-36 rounded-[2.5rem] bg-white shadow-2xl p-5 flex items-center justify-center border-4 border-white group hover:rotate-3 transition-transform duration-500">
              <Search className="h-16 w-16 text-primary/20 group-hover:text-primary transition-colors" />
            </div>

            <div>
              <Badge variant="outline" className="px-6 py-2 rounded-full border-primary/30 text-primary bg-primary/5 mb-6 font-extrabold text-sm uppercase tracking-[0.2em] shadow-sm inline-flex">
                {isAr ? 'الأبحاث والابتكارات' : 'Research & Innovations'}
              </Badge>
              <h1 className="text-4xl md:text-6xl heading-premium mb-6">
                {t('research.title')}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl font-medium">
                {isAr ? 'اكتشف أحدث الأبحاث العلمية والمساهمات المعرفية من أعضاء هيئة التدريس والطلاب.'
                  : 'Discover the latest scientific research and knowledge contributions from faculty members and students.'}
              </p>
            </div>
          </div>

          <div className="relative w-full lg:w-96 group z-10">
            <Search className="absolute start-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={isAr ? 'بحث عن عنوان أو مؤلف...' : 'Search for title or author...'}
              className="h-16 ps-16 pe-6 text-lg rounded-2xl border-none shadow-2xl focus-visible:ring-2 focus-visible:ring-primary/20 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-12 p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-xs font-black uppercase text-muted-foreground">{isAr ? 'تصفية حسب:' : 'Filter By:'}</span>
          </div>

          <Select value={selectedUni} onValueChange={setSelectedUni}>
            <SelectTrigger className="w-full md:w-[200px] h-12 bg-white border-slate-200 rounded-xl shadow-sm focus:ring-primary/20">
              <SelectValue placeholder={isAr ? 'الجامعة' : 'University'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? 'كل الجامعات' : 'All Universities'}</SelectItem>
              {universities.map(u => (
                <SelectItem key={u.id} value={u.id}>{isAr ? u.name_ar : (u.name_en || u.name_ar)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCollege} onValueChange={setSelectedCollege} disabled={selectedUni === 'all'}>
            <SelectTrigger className="w-full md:w-[200px] h-12 bg-white border-slate-200 rounded-xl shadow-sm focus:ring-primary/20">
              <SelectValue placeholder={isAr ? 'الكلية' : 'College'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? 'كل الكليات' : 'All Colleges'}</SelectItem>
              {colleges.map(c => (
                <SelectItem key={c.id} value={c.id}>{isAr ? c.name_ar : (c.name_en || c.name_ar)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDept} onValueChange={setSelectedDept} disabled={selectedCollege === 'all'}>
            <SelectTrigger className="w-full md:w-[200px] h-12 bg-white border-slate-200 rounded-xl shadow-sm focus:ring-primary/20">
              <SelectValue placeholder={isAr ? 'القسم' : 'Department'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? 'كل الأقسام' : 'All Departments'}</SelectItem>
              {departments.map(d => (
                <SelectItem key={d.id} value={d.id}>{isAr ? d.name_ar : (d.name_en || d.name_ar)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ms-auto flex items-center gap-4 w-full md:w-auto">
            <div className="h-8 w-[1px] bg-slate-200 hidden md:block" />
            <div className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground whitespace-nowrap">
              <SortAsc className="h-4 w-4 text-primary" />
              {isAr ? 'ترتيب:' : 'Sort:'}
            </div>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full md:w-[150px] h-12 bg-white border-slate-200 rounded-xl shadow-sm focus:ring-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{isAr ? 'الأحدث' : 'Newest'}</SelectItem>
                <SelectItem value="oldest">{isAr ? 'الأقدم' : 'Oldest'}</SelectItem>
                <SelectItem value="name">{isAr ? 'الاسم' : 'Name'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-80 bg-muted/20 animate-pulse rounded-[3rem]" />
            ))}
          </div>
        ) : filteredResearch.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {filteredResearch.map(r => (
              <Card key={r.id} className="card-premium group relative bg-white overflow-hidden flex flex-col h-full rounded-[2.5rem] p-4">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 group-hover:scale-125 transition-transform duration-700" />

                <CardContent className="p-8 flex flex-col h-full relative z-10">
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Badge variant="outline" className="text-[10px] uppercase font-extrabold px-4 py-1.5 rounded-full border-primary/30 text-primary bg-primary/10 break-words max-w-full shadow-sm">
                      {isAr
                        ? `${r.university_name_ar || ''} > ${r.college_name_ar || ''} > ${r.department_name_ar || r.department_name || ''}`
                        : `${r.university_name_en || r.university_name_ar || ''} > ${r.college_name_en || r.college_name_ar || ''} > ${r.department_name_en || r.department_name_ar || r.department_name || ''}`
                      }
                    </Badge>
                    {r.publish_date && (
                      <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground bg-slate-50 px-4 py-2 rounded-full shadow-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        {new Date(r.publish_date).getFullYear()}
                      </div>
                    )}
                  </div>

                  <h3 className="text-2xl md:text-3xl font-extrabold text-foreground mb-4 group-hover:text-primary transition-colors duration-300 leading-tight tracking-tight">
                    {isAr ? r.title_ar : (r.title_en || r.title_ar)}
                  </h3>

                  <p className="text-muted-foreground text-base mb-8 line-clamp-3 flex-grow leading-relaxed">
                    {isAr ? r.abstract_ar : (r.abstract_en || r.abstract_ar)}
                  </p>

                  {r.students && r.students.length > 0 && (
                    <div className="mb-8 flex flex-wrap gap-3">
                      {r.students.map((s: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 text-sm font-bold text-muted-foreground">
                          <User className="h-4 w-4 text-primary" />
                          <span>{s.full_name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mt-auto pt-8 border-t border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-primary shadow-xl shadow-primary/20 flex items-center justify-center">
                        <User className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest leading-none mb-1">{isAr ? 'الباحث الرئيسي' : 'PRINCIPAL AUTHOR'}</span>
                        <span className="text-lg font-extrabold text-foreground leading-tight">{r.author_name}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {r.pdf_url && (
                        <>
                          <Button
                            className="flex-1 sm:flex-none h-14 px-8 rounded-2xl font-extrabold bg-primary shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95 text-base"
                            onClick={() => setPreviewPdf({
                              url: r.pdf_url.startsWith('http') ? r.pdf_url : `http://localhost:5000${r.pdf_url}`,
                              title: isAr ? r.title_ar : (r.title_en || r.title_ar)
                            })}
                          >
                            <Eye className="h-5 w-5 me-2" />{isAr ? 'معاينة' : 'Preview'}
                          </Button>
                          <a
                            href={r.pdf_url.startsWith('http') ? r.pdf_url : `http://localhost:5000${r.pdf_url}`}
                            download={`${isAr ? r.title_ar : (r.title_en || r.title_ar)}.pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-none"
                          >
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-14 w-14 rounded-2xl border-primary/20 hover:bg-primary/5 hover:border-primary transition-all shadow-sm"
                            >
                              <Download className="h-6 w-6 text-primary" />
                            </Button>
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-white/50 backdrop-blur-sm rounded-[4rem] border border-dashed border-primary/20 shadow-inner">
            <div className="h-24 w-24 rounded-full bg-primary/5 flex items-center justify-center mb-8 animate-bounce">
              <BookOpen className="h-12 w-12 text-primary/20" />
            </div>
            <h3 className="text-4xl font-black text-foreground mb-4 tracking-tight">{isAr ? 'لا توجد نتائج' : 'No Results Found'}</h3>
            <p className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
              {searchTerm
                ? (isAr ? `لم نجد أي أبحاث تطابق "${searchTerm}". جرب كلمات مفتاحية أخرى.` : `We couldn't find any research matching "${searchTerm}". Try different keywords.`)
                : (isAr ? 'لا توجد أبحاث متاحة في هذا القسم حالياً. يرجى مراجعة التصنيفات الأخرى.' : 'No research available in this section yet. Please check other categories.')}
            </p>
          </div>
        )}

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

export default Research;
