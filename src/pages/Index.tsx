import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, GraduationCap, FileText, BookOpen, Megaphone, ArrowLeft, ArrowRight, Calendar, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import apiClient from '@/lib/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Index: React.FC = () => {
  const { t, language, isRTL } = useLanguage();
  const [stats, setStats] = useState({ universities: 0, colleges: 0, departments: 0, graduates: 0, research: 0 });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const isAr = language === 'ar';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [u, c, d, g, r] = await Promise.all([
          apiClient('/universities'),
          apiClient('/colleges'),
          apiClient('/departments'),
          apiClient('/graduates'),
          apiClient('/research'),
        ]);
        setStats({
          universities: u.length || 0,
          colleges: c.length || 0,
          departments: d.length || 0,
          graduates: g.length || 0,
          research: r.length || 0,
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
    const fetchAnnouncements = async () => {
      try {
        const data = await apiClient('/announcements', { params: { limit: '3' } });
        setAnnouncements(data || []);
      } catch (err) {
        console.error("Error fetching announcements:", err);
      }
    };
    fetchStats();
    fetchAnnouncements();
  }, []);

  const statItems = [
    { key: 'universities', icon: Building2, color: 'text-primary' },
    { key: 'colleges', icon: BookOpen, color: 'text-gold' },
    { key: 'departments', icon: FileText, color: 'text-primary' },
    { key: 'graduates', icon: GraduationCap, color: 'text-gold' },
    { key: 'research', icon: FileText, color: 'text-primary' },
  ];

  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative py-24 text-center overflow-hidden min-h-[60vh] flex items-center">
        <div className="absolute inset-0 gradient-academic opacity-10 animate-pulse" />
        <div className="container mx-auto px-4 relative z-10">
          <Badge variant="outline" className="px-6 py-2 rounded-full border-primary/30 text-primary bg-primary/5 mb-8 font-extrabold text-sm uppercase tracking-[0.2em] shadow-sm">
            <GraduationCap className="h-5 w-5 me-2 inline text-gold" />
            {isAr ? 'منصة التعليم الذكي' : 'SMART EDUCATION PLATFORM'}
          </Badge>
          <h1 className="mb-10 text-5xl md:text-8xl heading-premium leading-[1.1]">{t('home.welcome')}</h1>
          <p className="mx-auto mb-12 max-w-3xl text-xl md:text-2xl text-muted-foreground/80 leading-relaxed font-medium">{t('home.subtitle')}</p>
          <Link to="/universities">
            <Button size="lg" className="h-16 px-12 bg-gold text-gold-foreground hover:bg-gold/90 rounded-2xl shadow-2xl shadow-gold/30 text-xl font-black transition-all hover:scale-105 active:scale-95 group">
              {t('home.explore')}
              <Arrow className="ms-3 h-7 w-7 transition-transform group-hover:translate-x-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto -mt-8 px-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {statItems.map((item) => (
            <Card key={item.key} className="card-premium">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className={`p-3 rounded-2xl bg-slate-50 mb-3 group-hover:bg-white transition-colors`}>
                  <item.icon className={`h-8 w-8 ${item.color}`} />
                </div>
                <span className="text-3xl font-extrabold text-foreground mb-1">{stats[item.key as keyof typeof stats]}</span>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t(`home.stats.${item.key}`)}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick links */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold text-foreground">{t('home.quick_links')}</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { path: '/universities', label: t('nav.universities'), icon: Building2 },
            { path: '/research', label: t('nav.research'), icon: FileText },
            { path: '/jobs', label: t('nav.jobs'), icon: GraduationCap },
            { path: '/fees', label: t('nav.fees'), icon: BookOpen },
          ].map((link) => (
            <Link key={link.path} to={link.path}>
              <Card className="card-premium group hover:border-primary/20 border-2 border-transparent">
                <CardContent className="flex flex-col items-center gap-6 p-10">
                  <div className="h-20 w-20 rounded-[2.5rem] bg-gold/5 flex items-center justify-center group-hover:bg-gold transition-all duration-700 shadow-inner">
                    <link.icon className="h-10 w-10 text-gold group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">{link.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Announcements */}
      {announcements.length > 0 && (
        <section className="container mx-auto px-4 pb-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-4">
              <Badge variant="outline" className="px-4 py-1.5 rounded-full border-gold/40 text-gold bg-gold/10 font-extrabold text-xs uppercase tracking-widest shadow-sm">
                <Sparkles className="h-4 w-4 me-2 animate-pulse" />
                {t('home.latest_announcements')}
              </Badge>
              <h2 className="text-4xl md:text-5xl heading-premium">{t('home.latest_announcements')}</h2>
            </div>
            <Link to="/announcements">
              <Button variant="ghost" className="text-gold font-extrabold hover:text-gold hover:bg-gold/10 rounded-2xl h-12 px-6 group/all text-base">
                {t('common.view_all')}
                <Arrow className="ms-2 h-5 w-5 transition-transform group-hover/all:translate-x-1" />
              </Button>
            </Link>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {announcements.map((a) => (
              <Card key={a.id} className="card-premium group relative bg-white overflow-hidden flex flex-col h-full rounded-[2.5rem]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 z-0" />

                {/* Entity Logo Overlay */}
                {(a.universities?.logo_url || a.colleges?.logo_url) && (
                  <div className="absolute top-6 left-6 z-30 flex items-center gap-2">
                    <div className="h-10 w-10 rounded-2xl bg-white/90 backdrop-blur-md p-1.5 shadow-lg border border-white/50 group-hover:scale-110 transition-transform duration-500">
                      <img
                        src={(a.universities?.logo_url || a.colleges?.logo_url).startsWith('http') ? (a.universities?.logo_url || a.colleges?.logo_url) : `http://localhost:5000${a.universities?.logo_url || a.colleges?.logo_url}`}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}

                <CardContent className="p-8 flex flex-col flex-grow relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <Badge className="bg-primary/10 text-primary border-none rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest shadow-sm">
                      {a.scope === 'global' ? (language === 'ar' ? 'عام' : 'Global') : (language === 'ar' ? 'مؤسسي' : 'Institutional')}
                    </Badge>
                    <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground uppercase tracking-wider bg-slate-50 px-3 py-1.5 rounded-full">
                      <Calendar className="h-4 w-4 text-gold" />
                      <span>{new Date(a.created_at).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-extrabold text-foreground mb-4 line-clamp-2 leading-tight group-hover:text-gold transition-colors duration-300">
                    {language === 'ar' ? a.title_ar : (a.title_en || a.title_ar)}
                  </h3>

                  <p className="text-muted-foreground text-base leading-relaxed mb-8 line-clamp-3">
                    {language === 'ar' ? a.content_ar : (a.content_en || a.content_ar)}
                  </p>

                  <Link to="/announcements" className="mt-auto flex items-center justify-between group/btn">
                    <span className="text-base font-black text-primary group-hover/btn:text-gold transition-colors">
                      {language === 'ar' ? 'اقرأ المزيد' : 'Read More'}
                    </span>
                    <div className="h-12 w-12 rounded-2xl border-2 border-primary/10 flex items-center justify-center group-hover/btn:bg-primary group-hover/btn:border-primary transition-all duration-300 transform group-hover/btn:rotate-45">
                      <Arrow className={`h-6 w-6 text-primary group-hover/btn:text-white transition-colors ${isRTL ? 'rotate-180' : ''}`} />
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;
