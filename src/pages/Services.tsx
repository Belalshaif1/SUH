import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import apiClient from '@/lib/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, ChevronRight } from 'lucide-react';

const Services: React.FC = () => {
  const { t, language } = useLanguage();
  const [services, setServices] = useState<any[]>([]);
  const isAr = language === 'ar';
  const Arrow = ChevronRight;

  useEffect(() => {
    apiClient('/services')
      .then(data => setServices(data || []))
      .catch(err => console.error("Error fetching services:", err));
  }, []);

  return (
    <div className="container mx-auto px-4 py-16 animate-fade-in min-h-[80vh]">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-16 relative p-12 rounded-[3rem] border border-border/50 bg-white/50 backdrop-blur-md overflow-hidden shadow-2xl shadow-primary/5">
        <div className="absolute inset-0 gradient-academic opacity-[0.03] z-0" />

        <div className="flex-1 text-center lg:text-start relative z-10 flex flex-col lg:flex-row items-center gap-10">
          <div className="shrink-0 h-40 w-40 rounded-[2.5rem] bg-white shadow-2xl p-6 flex items-center justify-center border-4 border-slate-50 group hover:rotate-3 transition-transform duration-500">
            <Wrench className="h-16 w-16 text-primary/10 group-hover:text-primary transition-colors" />
          </div>

          <div className="flex-1">
            <Badge variant="outline" className="px-6 py-2 rounded-full border-gold/30 text-gold bg-gold/5 mb-8 font-bold text-sm uppercase tracking-[0.2em] shadow-sm inline-flex">
              {isAr ? 'خدماتنا الرقمية' : 'Our Services'}
            </Badge>
            <h1 className="text-4xl md:text-7xl font-bold text-primary mb-6">
              {t('services.title')}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              {isAr ? 'مجموعة متكاملة من الخدمات الإلكترونية المصممة لتسهيل رحلتك الأكاديمية.'
                : 'A comprehensive set of electronic services designed to facilitate your academic journey.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        {services.map(s => (
          <Card key={s.id} className="card-premium group relative bg-white border border-border/50 overflow-hidden flex flex-col h-full hover:border-primary/30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 z-0" />

            <CardContent className="p-10 flex flex-col h-full relative z-10">
              <div className="flex items-center gap-6 mb-8">
                <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-primary/5 shadow-inner group-hover:bg-primary transition-all duration-500 overflow-hidden">
                  <Wrench className="h-10 w-10 text-primary group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-primary mb-2 group-hover:text-gold transition-colors duration-300 leading-tight">
                    {language === 'ar' ? s.title_ar : (s.title_en || s.title_ar)}
                  </h3>
                  <Badge variant="outline" className="border-primary/20 text-primary/60 text-[10px] uppercase font-bold px-3 py-1 rounded-full tracking-widest">
                    {language === 'ar' ? 'خدمة رقمية' : 'Digital Service'}
                  </Badge>
                </div>
              </div>

              <p className="text-muted-foreground text-lg leading-relaxed flex-1">
                {language === 'ar' ? s.description_ar : (s.description_en || s.description_ar)}
              </p>

              <div className="mt-10 pt-8 border-t border-border/30 flex items-center justify-between text-primary font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
                <span>{isAr ? 'استكشف الخدمة' : 'Explore Service'}</span>
                <Arrow className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
        {services.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-40 text-center bg-white/50 backdrop-blur-sm rounded-[4rem] border border-dashed border-primary/20 shadow-2xl shadow-primary/5">
            <div className="h-24 w-24 rounded-full bg-primary/5 flex items-center justify-center mb-10">
              <Wrench className="h-12 w-12 text-primary/10" />
            </div>
            <h3 className="text-4xl font-bold text-primary mb-6">{isAr ? 'لا توجد خدمات' : 'No Services Available'}</h3>
            <p className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
              {t('services.no_services')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Services;
