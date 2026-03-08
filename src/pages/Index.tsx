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
      {/* Hero Section */}
      <section className="relative py-32 text-center overflow-hidden min-h-[70vh] flex items-center bg-slate-50/50">
        <div className="absolute inset-0 gradient-academic opacity-[0.03]" />
        <div className="container mx-auto px-4 relative z-10">
          <Badge variant="outline" className="px-6 py-2 rounded-full border-gold/30 text-gold bg-gold/5 mb-10 font-bold text-sm uppercase tracking-[0.2em] shadow-sm backdrop-blur-sm">
            <GraduationCap className="h-5 w-5 me-2 inline" />
            {isAr ? 'منصة التعليم الجامعي الذكي' : 'SMART UNIVERSITY PLATFORM'}
          </Badge>
          <h1 className="mb-10 text-5xl md:text-8xl font-bold tracking-tight text-primary leading-[1.1]">
            {t('home.welcome')}
          </h1>
          <p className="mx-auto mb-12 max-w-3xl text-xl md:text-2xl text-muted-foreground leading-relaxed">
            {t('home.subtitle')}
          </p>
          <Link to="/universities">
            <Button size="lg" className="h-16 px-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl shadow-xl shadow-primary/20 text-xl font-bold transition-all hover:scale-105 active:scale-95 group">
              {t('home.explore')}
              <Arrow className="ms-3 h-7 w-7 transition-transform group-hover:translate-x-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto -mt-12 px-4 relative z-20">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {statItems.map((item) => (
            <Card key={item.key} className="card-premium border border-border/50 bg-white/80 backdrop-blur-md">
              <CardContent className="flex flex-col items-center p-8 text-center">
                <div className="p-4 rounded-2xl bg-primary/5 mb-4 group-hover:bg-primary/10 transition-colors">
                  <item.icon className={`h-8 w-8 text-primary`} />
                </div>
                <span className="text-4xl font-bold text-primary mb-1">{stats[item.key as keyof typeof stats]}</span>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none">
                  {t(`home.stats.${item.key}`)}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Access Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="flex items-center gap-3 mb-12">
          <div className="h-8 w-2 bg-gold rounded-full" />
          <h2 className="text-3xl font-bold text-primary">{t('home.quick_links')}</h2>
        </div>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {[
            { path: '/universities', label: t('nav.universities'), icon: Building2 },
            { path: '/research', label: t('nav.research'), icon: FileText },
            { path: '/jobs', label: t('nav.jobs'), icon: GraduationCap },
            { path: '/fees', label: t('nav.fees'), icon: BookOpen },
          ].map((link) => (
            <Link key={link.path} to={link.path}>
              <Card className="card-premium group hover:border-gold/30 border-2 border-transparent bg-white h-full">
                <CardContent className="flex flex-col items-center gap-8 p-12">
                  <div className="h-24 w-24 rounded-[2.5rem] bg-primary/5 flex items-center justify-center group-hover:bg-primary transition-all duration-500 shadow-inner">
                    <link.icon className="h-12 w-12 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-2xl font-bold text-primary group-hover:text-gold transition-colors">{link.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Announcements Section */}
      {announcements.length > 0 && (
        <section className="container mx-auto px-4 pb-32">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="space-y-4">
              <Badge variant="outline" className="px-4 py-1.5 rounded-full border-gold/40 text-gold bg-gold/5 font-bold text-xs uppercase tracking-widest">
                <Sparkles className="h-4 w-4 me-2" />
                {t('home.latest_announcements')}
              </Badge>
              <h2 className="text-4xl md:text-6xl font-bold text-primary">{t('home.latest_announcements')}</h2>
            </div>
            <Link to="/announcements">
              <Button variant="ghost" className="text-primary font-bold hover:text-primary hover:bg-primary/5 rounded-2xl h-14 px-8 group/all text-lg">
                {t('common.view_all')}
                <Arrow className="ms-2 h-6 w-6 transition-transform group-hover/all:translate-x-1" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {announcements.map((a) => (
              <Card key={a.id} className="card-premium group relative bg-white border border-border/50 overflow-hidden flex flex-col h-full hover:border-gold/30">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700 z-0" />

                <CardContent className="p-10 flex flex-col flex-grow relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <Badge className="bg-primary text-primary-foreground border-none rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/10">
                      {a.scope === 'global' ? (language === 'ar' ? 'عام' : 'Global') : (language === 'ar' ? 'مؤسسي' : 'Institutional')}
                    </Badge>
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <Calendar className="h-4 w-4 text-gold" />
                      <span>{new Date(a.created_at).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-primary mb-4 line-clamp-2 leading-tight group-hover:text-gold transition-colors duration-300">
                    {language === 'ar' ? a.title_ar : (a.title_en || a.title_ar)}
                  </h3>

                  <p className="text-muted-foreground text-base leading-relaxed mb-10 line-clamp-3">
                    {language === 'ar' ? a.content_ar : (a.content_en || a.content_ar)}
                  </p>

                  <Link to="/announcements" className="mt-auto flex items-center justify-between group/btn">
                    <span className="text-lg font-bold text-primary group-hover/btn:text-gold transition-colors">
                      {language === 'ar' ? 'اقرأ المزيد' : 'Read More'}
                    </span>
                    <div className="h-14 w-14 rounded-2xl border-2 border-primary/10 flex items-center justify-center bg-primary/5 group-hover/btn:bg-primary group-hover/btn:border-primary transition-all duration-300">
                      <Arrow className={`h-7 w-7 text-primary group-hover/btn:text-white transition-colors ${isRTL ? 'rotate-180' : ''}`} />
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
