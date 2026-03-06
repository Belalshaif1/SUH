import React from 'react';
import Header from './Header';
import BottomNav from './BottomNav';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'react-router-dom';
import { useSync } from '@/hooks/useSync';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const location = useLocation();
  const { isSyncing } = useSync(); // تفعيل نظام المزامنة التلقائي
  const isAboutPage = location.pathname === '/about';


  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pb-20 md:pb-0">
        {children}
      </main>
      {isAboutPage && (
        <footer className="hidden md:block border-t bg-card py-4 text-center text-sm text-muted-foreground">
          {language === 'ar'
            ? 'تطوير م. بلال شائف © ' + new Date().getFullYear()
            : '© ' + new Date().getFullYear() + ' Developed by Eng. Belal Shaif'}
        </footer>
      )}
      <BottomNav />
    </div>
  );
};

export default AppLayout;
