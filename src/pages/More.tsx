import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Wrench, FileText, GraduationCap, DollarSign, 
  Megaphone, MessageCircle, Building2, Briefcase 
} from 'lucide-react';

const More: React.FC = () => {
  const { t } = useLanguage();

  const items = [
    { path: '/services', icon: Wrench, label: t('nav.services') },
    { path: '/research', icon: FileText, label: t('nav.research') },
    { path: '/graduates', icon: GraduationCap, label: t('nav.graduates') },
    { path: '/fees', icon: DollarSign, label: t('nav.fees') },
    { path: '/announcements', icon: Megaphone, label: t('nav.announcements') },
    { path: '/chat', icon: MessageCircle, label: t('nav.chat') },
  ];

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <h1 className="mb-6 text-3xl font-bold text-foreground">{t('nav.more')}</h1>
      <div className="grid grid-cols-2 gap-4">
        {items.map(item => (
          <Link key={item.path} to={item.path}>
            <Card className="transition-all hover:shadow-lg hover:border-gold">
              <CardContent className="flex flex-col items-center gap-3 p-6">
                <item.icon className="h-8 w-8 text-gold" />
                <span className="font-semibold text-foreground text-center">{item.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default More;
