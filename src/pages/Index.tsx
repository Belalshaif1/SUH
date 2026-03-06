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
      <section className="gradient-academic py-16 text-center text-primary-foreground md:py-24">
        <div className="container mx-auto px-4">
          <GraduationCap className="mx-auto mb-4 h-16 w-16 text-gold" />
          <h1 className="mb-4 text-3xl font-bold md:text-5xl">{t('home.welcome')}</h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg opacity-90">{t('home.subtitle')}</p>
          <Link to="/universities">
            <Button size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90">
              {t('home.explore')}
              <Arrow className="ms-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto -mt-8 px-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {statItems.map((item) => (
            <Card key={item.key} className="border-none shadow-lg">
              <CardContent className="flex flex-col items-center p-4 text-center">
                <item.icon className={`mb-2 h-8 w-8 ${item.color}`} />
                <span className="text-2xl font-bold text-foreground">{stats[item.key as keyof typeof stats]}</span>
                <span className="text-sm text-muted-foreground">{t(`home.stats.${item.key}`)}</span>
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
              <Card className="transition-all hover:shadow-lg hover:border-gold">
                <CardContent className="flex flex-col items-center gap-2 p-6">
                  <link.icon className="h-8 w-8 text-gold" />
                  <span className="font-semibold text-foreground">{link.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Announcements */}
      {announcements.length > 0 && (
        <section className="container mx-auto px-4 pb-24">
          <div className="flex items-center justify-between mb-12">
            <div className="space-y-2">
              <Badge variant="outline" className="px-3 py-0.5 rounded-full border-gold/30 text-gold bg-gold/5 mb-2 font-black text-[10px] uppercase tracking-wider">
                <Sparkles className="h-3 w-3 me-2 animate-pulse" />
                {t('home.latest_announcements')}
              </Badge>
              <h2 className="text-4xl font-black text-foreground tracking-tight">{t('home.latest_announcements')}</h2>
            </div>
            <Link to="/announcements">
              <Button variant="ghost" className="text-gold font-bold hover:text-gold hover:bg-gold/5 rounded-2xl group/all">
                {t('common.view_all')}
                <Arrow className="ms-2 h-4 w-4 transition-transform group-hover/all:translate-x-1" />
              </Button>
            </Link>
          </div>
          <div className="grid gap-10 md:grid-cols-3">
            {announcements.map((a) => (
              <Card key={a.id} className="group relative border-none bg-white shadow-xl hover:shadow-2xl transition-all duration-700 rounded-[3rem] overflow-hidden flex flex-col h-full">
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

                <CardContent className="p-10 flex flex-col flex-grow relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <Badge className="bg-primary/5 text-primary border-none rounded-full px-4 py-1 text-[11px] font-black uppercase tracking-widest">
                      {a.scope === 'global' ? (language === 'ar' ? 'عام' : 'Global') : (language === 'ar' ? 'مؤسسي' : 'Institutional')}
                    </Badge>
                    <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase">
                      <Calendar className="h-4 w-4 text-gold/60" />
                      <span>{new Date(a.created_at).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-foreground mb-5 line-clamp-2 leading-tight group-hover:text-gold transition-colors duration-300">
                    {language === 'ar' ? a.title_ar : (a.title_en || a.title_ar)}
                  </h3>

                  <p className="text-muted-foreground text-lg leading-relaxed mb-8 line-clamp-3">
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
