import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Building2, Briefcase, GraduationCap, Info, Megaphone, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const BottomNav: React.FC = () => {
  const { t, language } = useLanguage();
  const location = useLocation();

  const items = [
    { path: '/', icon: Home, label: t('nav.home') },
    { path: '/graduates', icon: GraduationCap, label: t('nav.graduates') },
    { path: '/announcements', icon: Megaphone, label: t('nav.announcements') },
    { path: '/chat', icon: MessageCircle, label: t('nav.chat') },
    // { path: '/about', icon: Info, label: language === 'ar' ? 'من نحن' : 'About Us' },
    { path: '/jobs', icon: Briefcase, label: t('nav.jobs') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-lg md:hidden">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors',
                isActive ? 'text-primary font-semibold' : 'text-muted-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'text-gold')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
