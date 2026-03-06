import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import apiClient from '@/lib/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Megaphone, Calendar, ArrowRight, ArrowLeft, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Announcements: React.FC = () => {
  const { t, language, isRTL } = useLanguage();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    apiClient('/announcements')
      .then(data => {
        setAnnouncements(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching announcements:", err);
        setLoading(false);
      });
  }, []);

  const isAr = language === 'ar';
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  const getScopeLabel = (scope: string) => {
    if (scope === 'global') return isAr ? 'عام' : 'Global';
    if (scope === 'university') return isAr ? 'جامعة' : 'University';
    return isAr ? 'كلية' : 'College';
  };

  return (
    <div className="container mx-auto px-4 py-16 animate-fade-in min-h-[80vh]">
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
        <Badge variant="outline" className="px-4 py-1 rounded-full border-gold/30 text-gold bg-gold/5 mb-2 animate-bounce">
          <Sparkles className="h-3.5 w-3.5 me-2" />
          {isAr ? 'آخر المستجدات' : 'Latest Updates'}
        </Badge>
        <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
          {t('announcements.title')}
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          {isAr ? 'ابق على اطلاع بآخر الأخبار والفعاليات والقرارات الهامة في رحاب جامعتنا.'
            : 'Stay informed about the latest news, events, and important decisions within our university.'}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 bg-muted/20 animate-pulse rounded-[2.5rem]" />
          ))}
        </div>
      ) : announcements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {announcements.map((a) => (
            <Card key={a.id} className="group relative border-none bg-white shadow-xl hover:shadow-2xl transition-all duration-700 rounded-[3rem] overflow-hidden flex flex-col h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 z-20" />

              {/* Image Section */}
              <div className="relative h-64 overflow-hidden">
                {a.image_url ? (
                  <img
                    src={a.image_url.startsWith('http') ? a.image_url : `http://localhost:5000${a.image_url}`}
                    alt={isAr ? a.title_ar : a.title_en}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/5 to-muted/20 flex items-center justify-center">
                    <ImageIcon className="h-20 w-20 text-primary/10 group-hover:text-gold/20 transition-colors" />
                  </div>
                )}

                {/* Entity Logo Overlay */}
                {(a.universities?.logo_url || a.colleges?.logo_url) && (
                  <div className="absolute top-6 left-6 z-30 flex items-center gap-2">
                    <div className="h-12 w-12 rounded-2xl bg-white/90 backdrop-blur-md p-2 shadow-xl border border-white/50 group-hover:scale-110 transition-transform duration-500">
                      <img
                        src={(a.universities?.logo_url || a.colleges?.logo_url).startsWith('http') ? (a.universities?.logo_url || a.colleges?.logo_url) : `http://localhost:5000${a.universities?.logo_url || a.colleges?.logo_url}`}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                <div className="absolute top-6 right-6 flex gap-2 z-30">
                  <Badge className="bg-white/20 backdrop-blur-md border-white/30 text-white rounded-full px-5 py-1 font-black text-xs">
                    {getScopeLabel(a.scope).toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Content Section */}
              <CardContent className="p-10 flex flex-col flex-grow relative z-10">
                <div className="flex items-center gap-3 text-xs font-black text-muted-foreground mb-5 uppercase tracking-widest">
                  <div className="p-2 rounded-xl bg-gold/10">
                    <Calendar className="h-4 w-4 text-gold" />
                  </div>
                  <span>{new Date(a.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>

                <h3 className="text-2xl font-black text-foreground mb-6 line-clamp-2 leading-tight group-hover:text-gold transition-colors duration-300">
                  {isAr ? a.title_ar : (a.title_en || a.title_ar)}
                </h3>

                <p className={`text-muted-foreground text-lg leading-relaxed mb-8 transition-all duration-500 line-clamp-3`}>
                  {isAr ? a.content_ar : (a.content_en || a.content_ar)}
                </p>

                <div
                  className="mt-auto flex items-center justify-between group/btn cursor-pointer select-none"
                  onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                >
                  <span className="text-base font-black text-primary group-hover/btn:text-gold transition-colors">
                    {isAr ? 'اقرأ المزيد' : 'Read More'}
                  </span>
                  <div className="h-12 w-12 rounded-2xl border-2 border-primary/10 flex items-center justify-center group-hover/btn:bg-primary group-hover/btn:border-primary transition-all duration-300 transform group-hover/btn:rotate-45">
                    <Arrow className={`h-6 w-6 text-primary group-hover/btn:text-white transition-colors ${isRTL ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-card/20 rounded-[3rem] border border-dashed border-border/40">
          <div className="h-24 w-24 rounded-full bg-muted/10 flex items-center justify-center mb-6">
            <Megaphone className="h-12 w-12 text-muted-foreground opacity-20" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">{isAr ? 'لا توجد إعلانات حالياً' : 'No Announcements Yet'}</h3>
          <p className="text-muted-foreground max-w-sm">
            {isAr ? 'سيتم نشر الإعلانات الهامة هنا قريباً. يرجى المراجعة لاحقاً.'
              : 'Important announcements will be posted here soon. Please check back later.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Announcements;
