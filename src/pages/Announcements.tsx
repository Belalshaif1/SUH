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
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-16 relative p-12 rounded-[3rem] border border-border/50 bg-white/50 backdrop-blur-md overflow-hidden shadow-2xl shadow-primary/5">
        <div className="absolute inset-0 gradient-academic opacity-[0.03] z-0" />

        <div className="flex-1 text-center lg:text-start relative z-10 flex flex-col lg:flex-row items-center gap-10">
          <div className="shrink-0 h-40 w-40 rounded-[2.5rem] bg-white shadow-2xl p-6 flex items-center justify-center border-4 border-slate-50 group hover:rotate-3 transition-transform duration-500">
            <Megaphone className="h-16 w-16 text-primary/10 group-hover:text-primary transition-colors" />
          </div>

          <div className="flex-1">
            <Badge variant="outline" className="px-6 py-2 rounded-full border-gold/30 text-gold bg-gold/5 mb-8 font-bold text-sm uppercase tracking-[0.2em] shadow-sm inline-flex">
              <Sparkles className="h-4 w-4 me-2 animate-bounce" />
              {isAr ? 'آخر المستجدات' : 'Latest Updates'}
            </Badge>
            <h1 className="text-4xl md:text-7xl font-bold text-primary mb-6">
              {t('announcements.title')}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              {isAr ? 'ابق على اطلاع بآخر الأخبار والفعاليات والقرارات الهامة في رحاب جامعتنا.'
                : 'Stay informed about the latest news, events, and important decisions within our university.'}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 bg-slate-50/50 animate-pulse rounded-[3rem] border border-border/30" />
          ))}
        </div>
      ) : announcements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {announcements.map((a) => (
            <Card key={a.id} className="card-premium group relative bg-white border border-border/50 overflow-hidden flex flex-col h-full hover:border-primary/30">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 z-20" />

              {/* Image Section */}
              <div className="relative h-64 overflow-hidden rounded-t-[2.5rem]">
                {a.image_url ? (
                  <img
                    src={a.image_url.startsWith('http') ? a.image_url : `http://localhost:5000${a.image_url}`}
                    alt={isAr ? a.title_ar : a.title_en}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/10 via-primary/5 to-gold/5 flex items-center justify-center">
                    <Megaphone className="h-20 w-20 text-primary/10 group-hover:text-gold/20 transition-colors" />
                  </div>
                )}

                {/* Entity Logo Overlay */}
                {(a.universities?.logo_url || a.colleges?.logo_url) && (
                  <div className="absolute top-6 left-6 z-30 flex items-center gap-2">
                    <div className="h-14 w-14 rounded-2xl bg-white/90 backdrop-blur-md p-2.5 shadow-2xl border border-white/50 group-hover:scale-110 transition-transform duration-500">
                      <img
                        src={(a.universities?.logo_url || a.colleges?.logo_url).startsWith('http') ? (a.universities?.logo_url || a.colleges?.logo_url) : `http://localhost:5000${a.universities?.logo_url || a.colleges?.logo_url}`}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-transparent opacity-60" />
                <div className="absolute top-6 right-6 flex gap-2 z-30">
                  <Badge className="bg-white/20 backdrop-blur-md border-white/40 text-white rounded-full px-5 py-2 font-bold text-xs tracking-widest shadow-lg uppercase">
                    {getScopeLabel(a.scope)}
                  </Badge>
                </div>
              </div>

              {/* Content Section */}
              <CardContent className="p-10 flex flex-col flex-grow relative z-10">
                <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground mb-6 uppercase tracking-[0.2em] bg-slate-50 self-start px-5 py-2.5 rounded-2xl border border-border/30 shadow-sm">
                  <Calendar className="h-4 w-4 text-gold" />
                  <span>{new Date(a.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>

                <h3 className="text-2xl font-bold text-primary mb-4 line-clamp-2 leading-tight group-hover:text-gold transition-colors duration-300">
                  {isAr ? a.title_ar : (a.title_en || a.title_ar)}
                </h3>

                <p className={`text-muted-foreground text-lg leading-relaxed mb-8 transition-all duration-500 line-clamp-3`}>
                  {isAr ? a.content_ar : (a.content_en || a.content_ar)}
                </p>

                <div
                  className="mt-auto flex items-center justify-between group/btn cursor-pointer select-none"
                  onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                >
                  <span className="text-lg font-bold text-primary group-hover/btn:text-gold transition-colors">
                    {isAr ? 'اقرأ المزيد' : 'Read More'}
                  </span>
                  <div className="h-14 w-14 rounded-2xl border-2 border-primary/10 bg-slate-50 flex items-center justify-center group-hover/btn:bg-primary group-hover/btn:border-primary transition-all duration-300 transform group-hover/btn:rotate-45 shadow-sm">
                    <Arrow className={`h-6 w-6 text-primary group-hover/btn:text-white transition-colors-transform duration-300 ${isRTL && isAr ? '' : ''} ${!isAr && isRTL ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-40 text-center bg-white/50 backdrop-blur-sm rounded-[4rem] border border-dashed border-primary/20 shadow-2xl shadow-primary/5">
          <div className="h-24 w-24 rounded-full bg-primary/5 flex items-center justify-center mb-10">
            <Megaphone className="h-12 w-12 text-primary/10" />
          </div>
          <h3 className="text-4xl font-bold text-primary mb-6">{isAr ? 'لا توجد إعلانات حالياً' : 'No Announcements Yet'}</h3>
          <p className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
            {isAr ? 'سيتم نشر الإعلانات الهامة هنا قريباً. يرجى المراجعة لاحقاً.'
              : 'Important announcements will be posted here soon. Please check back later.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Announcements;
