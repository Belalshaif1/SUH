import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import apiClient, { getMediaUrl } from '@/lib/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Search, User, Calendar, BookOpen, Award, Filter, SortAsc } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Graduates: React.FC = () => {
  const { t, language } = useLanguage();
  const [graduates, setGraduates] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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

    apiClient('/graduates', { params })
      .then(data => {
        let sorted = [...(data || [])];
        if (sortOrder === 'newest') sorted.sort((a, b) => new Date(b.created_at || b.id).getTime() - new Date(a.created_at || a.id).getTime());
        else if (sortOrder === 'oldest') sorted.sort((a, b) => new Date(a.created_at || a.id).getTime() - new Date(b.created_at || b.id).getTime());
        else if (sortOrder === 'name') sorted.sort((a, b) => {
          const nameA = (isAr ? a.full_name_ar : (a.full_name_en || a.full_name_ar)) || '';
          const nameB = (isAr ? b.full_name_ar : (b.full_name_en || b.full_name_ar)) || '';
          return nameA.localeCompare(nameB, isAr ? 'ar' : 'en');
        });
        setGraduates(sorted);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching graduates:", err);
        setLoading(false);
      });
  }, [selectedUni, selectedCollege, selectedDept, sortOrder, language]); // Added language to dependencies as it affects sorting by name

  const isAr = language === 'ar';

  const filteredGraduates = graduates.filter(g => {
    const name = (isAr ? g.full_name_ar : (g.full_name_en || g.full_name_ar)) || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="container mx-auto px-4 py-16 animate-fade-in min-h-[80vh]">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-16 relative p-12 rounded-[3rem] border border-border/50 bg-white/50 backdrop-blur-md overflow-hidden shadow-2xl shadow-primary/5">
        <div className="absolute inset-0 gradient-academic opacity-[0.03] z-0" />

        <div className="flex-1 text-center lg:text-start relative z-10 flex flex-col lg:flex-row items-center gap-10">
          {(selectedDept !== 'all' || selectedCollege !== 'all' || selectedUni !== 'all') ? (
            <div className="shrink-0 h-40 w-40 rounded-[2.5rem] bg-white shadow-2xl p-6 flex items-center justify-center border-4 border-slate-50 group hover:rotate-3 transition-transform duration-500">
              <img
                src={getMediaUrl(
                  (selectedDept !== 'all' ? departments.find(d => d.id === selectedDept)?.logo_url : null) ||
                  (selectedCollege !== 'all' ? colleges.find(c => c.id === selectedCollege)?.logo_url : null) ||
                  (selectedUni !== 'all' ? universities.find(u => u.id === selectedUni)?.logo_url : null)
                )}
                alt="Entity Logo"
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="shrink-0 h-40 w-40 rounded-[2.5rem] bg-white shadow-2xl p-6 flex items-center justify-center border-4 border-slate-50 group hover:rotate-3 transition-transform duration-500">
              <GraduationCap className="h-16 w-16 text-primary/10 group-hover:text-primary transition-colors" />
            </div>
          )}

          <div className="flex-1">
            <Badge variant="outline" className="px-6 py-2 rounded-full border-gold/30 text-gold bg-gold/5 mb-8 font-bold text-sm uppercase tracking-[0.2em] shadow-sm inline-flex">
              {isAr ? 'خريجون متميزون' : 'Distinguished Graduates'}
            </Badge>
            <h1 className="text-4xl md:text-7xl font-bold text-primary mb-6">
              {t('graduates.title')}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              {isAr ? 'قائمة المبدعين الذين تخرجوا من جامعتنا وتركوا بصمة علمية مميزة.' : 'List of creative minds who graduated from our university and left a distinguished scientific mark.'}
            </p>
          </div>
        </div>

        <div className="relative w-full lg:w-96 group z-10">
          <Search className="absolute start-8 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder={isAr ? 'بحث عن خريج...' : 'Search for graduate...'}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-slate-50/50 animate-pulse rounded-[3rem] border border-border/30" />
          ))}
        </div>
      ) : filteredGraduates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredGraduates.map(g => (
            <Card key={g.id} className="card-premium group relative bg-white border border-border/50 overflow-hidden flex flex-col h-full hover:border-primary/30">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 z-0" />

              <CardContent className="p-10 flex flex-col h-full relative z-10">
                <div className="flex items-start justify-between mb-8">
                  <div className="h-16 w-16 rounded-2xl bg-primary/5 shadow-inner flex items-center justify-center group-hover:bg-primary transition-all duration-500 overflow-hidden p-3">
                    {g.department_logo_url || g.college_logo_url ? (
                      <img src={getMediaUrl(g.department_logo_url || g.college_logo_url)} alt="Logo" className="max-w-full max-h-full object-contain group-hover:brightness-0 group-hover:invert transition-all" />
                    ) : (
                      <User className="h-7 w-7 text-primary group-hover:text-white transition-colors" />
                    )}
                  </div>
                  {g.gpa && (
                    <Badge variant="outline" className="border-gold/30 text-gold bg-gold/5 font-bold text-xs px-4 py-1.5 rounded-full shadow-sm tracking-widest uppercase">
                      {g.gpa} GPA
                    </Badge>
                  )}
                </div>

                <div className="mb-6">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold px-4 py-1.5 rounded-full border-primary/20 text-primary bg-primary/5 mb-4 break-words max-w-full block w-fit shadow-sm tracking-widest">
                    {isAr
                      ? `${g.university_name_ar || ''} > ${g.college_name_ar || ''} > ${g.department_name_ar || g.department_name || ''}`
                      : `${g.university_name_en || g.university_name_ar || ''} > ${g.college_name_en || g.college_name_ar || ''} > ${g.department_name_en || g.department_name_ar || g.department_name || ''}`
                    }
                  </Badge>
                  <h3 className="text-2xl font-bold text-primary mb-2 group-hover:text-gold transition-colors duration-300 leading-tight">
                    {isAr ? g.full_name_ar : (g.full_name_en || g.full_name_ar)}
                  </h3>
                </div>

                <div className="space-y-4 mb-4 mt-auto">
                  <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground bg-slate-50 p-3 rounded-2xl border border-border/30 shadow-sm">
                    <Calendar className="h-4 w-4 text-gold" />
                    <span className="tracking-wider uppercase">{isAr ? 'دفعة' : 'Class of'} {g.graduation_year}</span>
                  </div>
                  {(g.specialization_ar || g.specialization_en) && (
                    <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground bg-slate-50 p-3 rounded-2xl border border-border/30 shadow-sm">
                      <Award className="h-4 w-4 text-gold" />
                      <span className="line-clamp-1 truncate">{isAr ? g.specialization_ar : (g.specialization_en || g.specialization_ar)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-40 text-center bg-white/50 backdrop-blur-sm rounded-[4rem] border border-dashed border-primary/20 shadow-2xl shadow-primary/5">
          <div className="h-24 w-24 rounded-full bg-primary/5 flex items-center justify-center mb-10">
            <GraduationCap className="h-12 w-12 text-primary/10" />
          </div>
          <h3 className="text-4xl font-bold text-primary mb-6 tracking-tight">{isAr ? 'لا توجد نتائج' : 'No Results Found'}</h3>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
            {searchTerm
              ? (isAr ? `لم نجد أي خريجين يطابقون "${searchTerm}". جرب أسماء أخرى.` : `We couldn't find any graduates matching "${searchTerm}". Try different names.`)
              : (isAr ? 'لا يوجد خريجون مسجلون في هذا القسم حالياً. يرجى مراجعة التصنيفات الأخرى.' : 'No graduates registered in this section yet. Please check other categories.')}
          </p>
        </div>
      )}
    </div>
  );
};

export default Graduates;
