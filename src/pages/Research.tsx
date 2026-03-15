import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import apiClient, { getMediaUrl } from '@/lib/apiClient';
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
      <div className="container mx-auto px-4 py-16 animate-fade-in min-h-[80vh]">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-16 relative p-12 rounded-[3rem] border border-border/50 bg-white/50 backdrop-blur-md overflow-hidden shadow-2xl shadow-primary/5">
          <div className="absolute inset-0 gradient-academic opacity-[0.03] z-0" />

          <div className="flex-1 text-center lg:text-start relative z-10 flex flex-col lg:flex-row items-center gap-10">
            <div className="shrink-0 h-40 w-40 rounded-[2.5rem] bg-white shadow-2xl p-6 flex items-center justify-center border-4 border-slate-50 group hover:rotate-3 transition-transform duration-500">
              <Search className="h-16 w-16 text-primary/10 group-hover:text-primary transition-colors" />
            </div>

            <div className="flex-1">
              <Badge variant="outline" className="px-6 py-2 rounded-full border-gold/30 text-gold bg-gold/5 mb-8 font-bold text-sm uppercase tracking-[0.2em] shadow-sm inline-flex">
                {isAr ? 'الأبحاث والابتكارات' : 'Research & Innovations'}
              </Badge>
              <h1 className="text-4xl md:text-7xl font-bold text-primary mb-6">
                {t('research.title')}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
                {isAr ? 'اكتشف أحدث الأبحاث العلمية والمساهمات المعرفية من أعضاء هيئة التدريس والطلاب.'
                  : 'Discover the latest scientific research and knowledge contributions from faculty members and students.'}
              </p>
            </div>
          </div>

          <div className="relative w-full lg:w-96 group z-10">
            <Search className="absolute start-8 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={isAr ? 'بحث عن عنوان أو مؤلف...' : 'Search for title or author...'}
              className="h-20 ps-20 pe-8 text-xl rounded-[2rem] border-2 border-border/30 shadow-2xl focus-visible:ring-primary/10 bg-white/80 backdrop-blur-md transition-all group-focus-within:border-primary/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Filters Area */}
        <div className="flex flex-wrap items-center gap-6 mb-16 p-8 bg-background/50 backdrop-blur-md rounded-[2.5rem] border border-border/50 shadow-xl shadow-primary/5">
          <div className="flex items-center gap-3 px-5 py-2.5 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/10">
            <Filter className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-widest">{isAr ? 'تصفية حسب:' : 'Filter By:'}</span>
          </div>

          <div className="flex flex-wrap gap-4 flex-1">
            <Select value={selectedUni} onValueChange={setSelectedUni}>
              <SelectTrigger className="w-full md:w-[220px] h-14 bg-background border-border/50 rounded-2xl shadow-sm focus:ring-primary/10 transition-all text-foreground">
                <SelectValue placeholder={isAr ? 'الجامعة' : 'University'} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">{isAr ? 'كل الجامعات' : 'All Universities'}</SelectItem>
                {universities.map(u => (
                  <SelectItem key={u.id} value={u.id}>{isAr ? u.name_ar : (u.name_en || u.name_ar)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCollege} onValueChange={setSelectedCollege} disabled={selectedUni === 'all'}>
              <SelectTrigger className="w-full md:w-[220px] h-14 bg-background border-border/50 rounded-2xl shadow-sm focus:ring-primary/10 transition-all text-foreground">
                <SelectValue placeholder={isAr ? 'الكلية' : 'College'} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">{isAr ? 'كل الكليات' : 'All Colleges'}</SelectItem>
                {colleges.map(c => (
                  <SelectItem key={c.id} value={c.id}>{isAr ? c.name_ar : (c.name_en || c.name_ar)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDept} onValueChange={setSelectedDept} disabled={selectedCollege === 'all'}>
              <SelectTrigger className="w-full md:w-[220px] h-14 bg-background border-border/50 rounded-2xl shadow-sm focus:ring-primary/10 transition-all text-foreground">
                <SelectValue placeholder={isAr ? 'القسم' : 'Department'} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">{isAr ? 'كل الأقسام' : 'All Departments'}</SelectItem>
                {departments.map(d => (
                  <SelectItem key={d.id} value={d.id}>{isAr ? d.name_ar : (d.name_en || d.name_ar)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto border-t md:border-t-0 md:border-l border-border/30 md:ps-6 pt-6 md:pt-0">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground whitespace-nowrap">
              <SortAsc className="h-5 w-5 text-gold" />
              {isAr ? 'ترتيب:' : 'Sort:'}
            </div>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full md:w-[160px] h-14 bg-background border-border/50 rounded-2xl shadow-sm focus:ring-primary/10 transition-all text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
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
              <div key={i} className="h-96 bg-slate-50/50 animate-pulse rounded-[3rem] border border-border/30" />
            ))}
          </div>
        ) : filteredResearch.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {filteredResearch.map(r => (
              <Card key={r.id} className="card-premium group relative bg-white border border-border/50 overflow-hidden flex flex-col h-full hover:border-primary/30">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 group-hover:scale-150 transition-transform duration-700 z-0" />

                <CardContent className="p-10 flex flex-col h-full relative z-10">
                  <div className="flex flex-wrap items-center gap-3 mb-8">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold px-4 py-1.5 rounded-full border-primary/20 text-primary bg-primary/5 break-words max-w-full shadow-sm">
                      {isAr
                        ? `${r.university_name_ar || ''} > ${r.college_name_ar || ''} > ${r.department_name_ar || r.department_name || ''}`
                        : `${r.university_name_en || r.university_name_ar || ''} > ${r.college_name_en || r.college_name_ar || ''} > ${r.department_name_en || r.department_name_ar || r.department_name || ''}`
                      }
                    </Badge>
                    {r.publish_date && (
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-slate-50 px-4 py-2 rounded-full border border-border/30">
                        <Calendar className="h-4 w-4 text-gold" />
                        {new Date(r.publish_date).getFullYear()}
                      </div>
                    )}
                  </div>

                  <h3 className="text-2xl md:text-4xl font-bold text-primary mb-6 group-hover:text-gold transition-colors duration-300 leading-tight tracking-tight">
                    {isAr ? r.title_ar : (r.title_en || r.title_ar)}
                  </h3>

                  <p className="text-muted-foreground text-lg mb-10 line-clamp-3 leading-relaxed">
                    {isAr ? r.abstract_ar : (r.abstract_en || r.abstract_ar)}
                  </p>

                  {r.students && r.students.length > 0 && (
                    <div className="mb-10 flex flex-wrap gap-3">
                      {r.students.map((s: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 bg-primary/5 px-4 py-2.5 rounded-2xl border border-primary/10 text-sm font-bold text-primary">
                          <User className="h-4 w-4" />
                          <span>{s.full_name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mt-auto pt-10 border-t border-border/30">
                    <div className="flex items-center gap-5">
                      <div className="h-16 w-16 rounded-2xl bg-primary shadow-xl shadow-primary/20 flex items-center justify-center border-4 border-slate-50 overflow-hidden">
                        <User className="h-9 w-9 text-primary-foreground opacity-50" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mb-2">{isAr ? 'الباحث الرئيسي' : 'PRINCIPAL AUTHOR'}</span>
                        <span className="text-xl font-bold text-primary leading-tight">{r.author_name}</span>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      {r.pdf_url && (
                        <>
                          <Button
                            className="flex-1 sm:flex-none h-16 px-10 rounded-2xl font-bold bg-primary text-primary-foreground shadow-2xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 text-lg"
                            onClick={() => setPreviewPdf({
                              url: getMediaUrl(r.pdf_url),
                              title: isAr ? r.title_ar : (r.title_en || r.title_ar)
                            })}
                          >
                            <Eye className="h-6 w-6 me-3" />{isAr ? 'معاينة' : 'Preview'}
                          </Button>
                          <a
                            href={getMediaUrl(r.pdf_url)}
                            download={`${isAr ? r.title_ar : (r.title_en || r.title_ar)}.pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-none"
                          >
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-16 w-16 rounded-2xl border-border/50 hover:bg-gold/5 hover:border-gold transition-all shadow-xl shadow-primary/5"
                            >
                              <Download className="h-7 w-7 text-gold" />
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
          <div className="flex flex-col items-center justify-center py-40 text-center bg-white/50 backdrop-blur-sm rounded-[4rem] border border-dashed border-primary/20 shadow-2xl shadow-primary/5">
            <div className="h-24 w-24 rounded-full bg-primary/5 flex items-center justify-center mb-10">
              <BookOpen className="h-12 w-12 text-primary/10" />
            </div>
            <h3 className="text-4xl font-bold text-primary mb-6 tracking-tight">{isAr ? 'لا توجد نتائج' : 'No Results Found'}</h3>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
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
