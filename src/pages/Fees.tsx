import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import apiClient from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DollarSign, Search, Building2, GraduationCap, Filter, CreditCard, Wallet } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Fees: React.FC = () => {
  const { t, language } = useLanguage();
  const [fees, setFees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient('/fees')
      .then(data => {
        setFees(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching fees:", err);
        setLoading(false);
      });
  }, []);

  const isAr = language === 'ar';

  const filteredFees = fees.filter(f => {
    const deptName = f.departments ? (isAr ? f.departments.name_ar : (f.departments.name_en || f.departments.name_ar)) : '';
    const colName = f.departments?.colleges ? (isAr ? f.departments.colleges.name_ar : (f.departments.colleges.name_en || f.departments.colleges.name_ar)) : '';
    const matchesSearch = (deptName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (colName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || f.fee_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="container mx-auto px-4 py-16 animate-fade-in min-h-[80vh]">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-16 relative p-12 rounded-[3rem] border border-border/50 bg-white/50 backdrop-blur-md overflow-hidden shadow-2xl shadow-primary/5">
        <div className="absolute inset-0 gradient-academic opacity-[0.03] z-0" />

        <div className="flex-1 text-center lg:text-start relative z-10 flex flex-col lg:flex-row items-center gap-10">
          <div className="shrink-0 h-40 w-40 rounded-[2.5rem] bg-white shadow-2xl p-6 flex items-center justify-center border-4 border-slate-50 group hover:rotate-3 transition-transform duration-500">
            <DollarSign className="h-16 w-16 text-primary/10 group-hover:text-primary transition-colors" />
          </div>

          <div className="flex-1">
            <Badge variant="outline" className="px-6 py-2 rounded-full border-gold/30 text-gold bg-gold/5 mb-8 font-bold text-sm uppercase tracking-[0.2em] shadow-sm inline-flex">
              {isAr ? 'الرسوم الدراسية' : 'Tuition Fees'}
            </Badge>
            <h1 className="text-4xl md:text-7xl font-bold text-primary mb-6">
              {t('fees.title')}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              {isAr ? 'شفافية كاملة في الرسوم الدراسية لمساعدتك في التخطيط لمستقبلك الأكاديمي.'
                : 'Full transparency in tuition fees to help you plan your academic future.'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto z-10">
          <div className="relative flex-1 sm:w-80 group">
            <Search className="absolute start-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={isAr ? 'ابحث عن كلية أو قسم...' : 'Search for college or dept...'}
              className="h-16 ps-16 pe-6 text-lg rounded-2xl border-2 border-border/30 shadow-2xl focus-visible:ring-primary/10 bg-white/80 backdrop-blur-md transition-all group-focus-within:border-primary/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48 h-16 rounded-2xl bg-white/80 backdrop-blur-md border-2 border-border/30 shadow-2xl focus:ring-primary/10 transition-all font-bold">
              <Filter className="h-5 w-5 me-2 text-gold" />
              <SelectValue placeholder={isAr ? 'النوع' : 'Type'} />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">{isAr ? 'الكل' : 'All'}</SelectItem>
              <SelectItem value="public">{t('fees.public')}</SelectItem>
              <SelectItem value="private">{t('fees.private')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-slate-50/50 animate-pulse rounded-[3rem] border border-border/30" />
          ))}
        </div>
      ) : filteredFees.length > 0 ? (
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {filteredFees.map(f => (
            <Card key={f.id} className="card-premium group relative bg-white border border-border/50 overflow-hidden flex flex-col h-full hover:border-primary/30">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 z-0" />

              <CardContent className="p-10 flex flex-col h-full relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div className={`h - 16 w - 16 rounded - 2xl flex items - center justify - center shadow - inner transition - all duration - 500 overflow - hidden ${f.fee_type === 'public' ? 'bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground' : 'bg-gold/5 text-gold group-hover:bg-gold group-hover:text-white'} `}>
                    {f.fee_type === 'public' ? <Building2 className="h-8 w-8" /> : <Wallet className="h-8 w-8" />}
                  </div>
                  <Badge variant="outline" className={`rounded - full px - 5 py - 2 font - bold uppercase tracking - wider shadow - sm border - 2 ${f.fee_type === 'public' ? 'border-primary/20 text-primary bg-primary/5' : 'border-gold/20 text-gold bg-gold/5'} `}>
                    {f.fee_type === 'public' ? t('fees.public') : t('fees.private')}
                  </Badge>
                </div>

                <div className="mb-10 flex-1">
                  <h3 className="text-2xl font-bold text-primary group-hover:text-gold transition-colors mb-3">
                    {f.departments ? (isAr ? f.departments.name_ar : (f.departments.name_en || f.departments.name_ar)) : '-'}
                  </h3>
                  <div className="flex items-center gap-3 text-muted-foreground bg-slate-50 px-4 py-2.5 rounded-2xl border border-border/30 w-fit">
                    <GraduationCap className="h-5 w-5 text-gold" />
                    <span className="font-bold">
                      {f.departments?.colleges ? (isAr ? f.departments.colleges.name_ar : (f.departments.colleges.name_en || f.departments.colleges.name_ar)) : '-'}
                    </span>
                  </div>
                </div>

                <div className="pt-10 border-t border-border/30 flex justify-between items-end">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{isAr ? 'مبلغ القسط' : 'Tuition Amount'}</p>
                    <div className="text-4xl font-black text-primary group-hover:text-gold transition-colors flex items-baseline gap-2">
                      {f.amount?.toLocaleString()}
                      <span className="text-sm font-bold text-muted-foreground">{f.currency}</span>
                    </div>
                  </div>
                  <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-border/30 flex items-center justify-center text-gold shadow-sm group-hover:bg-gold group-hover:text-white group-hover:border-gold group-hover:rotate-12 transition-all duration-500">
                    <CreditCard className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-40 text-center bg-white/50 backdrop-blur-sm rounded-[4rem] border border-dashed border-primary/20 shadow-2xl shadow-primary/5">
          <div className="h-24 w-24 rounded-full bg-primary/5 flex items-center justify-center mb-10">
            <DollarSign className="h-12 w-12 text-primary/10" />
          </div>
          <h3 className="text-4xl font-bold text-primary mb-6">{isAr ? 'لا يوجد بيانات رسوم' : 'No Fees Data'}</h3>
          <p className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
            {searchTerm ? (isAr ? 'حاول البحث بكلمات أخرى.' : 'Try searching for other keywords.') : t('fees.no_fees')}
          </p>
        </div>
      )}
    </div>
  );
};

export default Fees;
