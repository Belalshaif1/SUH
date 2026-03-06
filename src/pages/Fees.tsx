import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import apiClient from '@/lib/apiClient';
import { Card, CardContent } from '@/components/ui/card';
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
    const deptName = f.departments ? (isAr ? f.departments.name_ar : f.departments.name_en) : '';
    const colName = f.departments?.colleges ? (isAr ? f.departments.colleges.name_ar : f.departments.colleges.name_en) : '';
    const matchesSearch = deptName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      colName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || f.fee_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="container mx-auto px-4 py-16 animate-fade-in min-h-[80vh]">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
        <div className="space-y-4">
          <Badge className="bg-gold/10 text-gold hover:bg-gold/20 border-none px-4 py-1 rounded-full font-bold">
            {isAr ? 'الرسوم الدراسية' : 'Tuition Fees'}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
            {t('fees.title')}
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            {isAr ? 'شفافية كاملة في الرسوم الدراسية لمساعدتك في التخطيط لمستقبلك الأكاديمي.'
              : 'Full transparency in tuition fees to help you plan your academic future.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={isAr ? 'ابحث عن كلية أو قسم...' : 'Search for college or dept...'}
              className="ps-12 py-6 bg-card border-border/60 rounded-2xl shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-44 py-6 rounded-2xl bg-card border-border/60">
              <Filter className="h-4 w-4 me-2 opacity-50" />
              <SelectValue placeholder={isAr ? 'النوع' : 'Type'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? 'الكل' : 'All'}</SelectItem>
              <SelectItem value="public">{t('fees.public')}</SelectItem>
              <SelectItem value="private">{t('fees.private')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-muted/20 animate-pulse rounded-[2rem]" />
          ))}
        </div>
      ) : filteredFees.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredFees.map(f => (
            <Card key={f.id} className="group border-border/40 bg-card/40 backdrop-blur-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:border-gold/30 transition-all duration-500 rounded-[2.5rem] overflow-hidden flex flex-col border">
              <CardContent className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-2xl ${f.fee_type === 'public' ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-600'}`}>
                    {f.fee_type === 'public' ? <Building2 className="h-6 w-6" /> : <Wallet className="h-6 w-6" />}
                  </div>
                  <Badge variant="outline" className={`rounded-full px-3 ${f.fee_type === 'public' ? 'border-primary/20 text-primary' : 'border-emerald-500/20 text-emerald-600'}`}>
                    {f.fee_type === 'public' ? t('fees.public') : t('fees.private')}
                  </Badge>
                </div>

                <div className="space-y-4 mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {f.departments ? (isAr ? f.departments.name_ar : (f.departments.name_en || f.departments.name_ar)) : '-'}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                      <GraduationCap className="h-3.5 w-3.5" />
                      {f.departments?.colleges ? (isAr ? f.departments.colleges.name_ar : (f.departments.colleges.name_en || f.departments.colleges.name_ar)) : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
              <div className="mt-auto px-8 pb-8 flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{isAr ? 'مبلغ القسط' : 'Tuition Amount'}</p>
                  <div className="text-3xl font-black text-gold flex items-baseline gap-1">
                    {f.amount?.toLocaleString()}
                    <span className="text-sm font-bold text-muted-foreground">{f.currency}</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-gold/5 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-white transition-all duration-500">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-card/20 rounded-[3rem] border border-dashed border-border/40">
          <DollarSign className="h-20 w-20 text-muted-foreground mb-6 opacity-20" />
          <h3 className="text-2xl font-bold text-foreground mb-2">{isAr ? 'لا يوجد بيانات رسوم' : 'No Fees Data'}</h3>
          <p className="text-muted-foreground max-w-sm">
            {searchTerm ? (isAr ? 'حاول البحث بكلمات أخرى.' : 'Try searching for other keywords.') : t('fees.no_fees')}
          </p>
        </div>
      )
      }
    </div >
  );
};

export default Fees;
