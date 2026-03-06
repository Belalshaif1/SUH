import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import apiClient from '@/lib/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

const Services: React.FC = () => {
  const { t, language } = useLanguage();
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    apiClient('/services')
      .then(data => setServices(data || []))
      .catch(err => console.error("Error fetching services:", err));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <h1 className="mb-6 text-3xl font-bold text-foreground">{t('services.title')}</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map(s => (
          <Card key={s.id} className="transition-all hover:shadow-lg hover:border-gold">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/10">
                <Wrench className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">{language === 'ar' ? s.title_ar : (s.title_en || s.title_ar)}</h3>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? s.description_ar : (s.description_en || s.description_ar)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {services.length === 0 && <p className="col-span-full text-center text-muted-foreground py-12">{t('services.no_services')}</p>}
      </div>
    </div>
  );
};

export default Services;
