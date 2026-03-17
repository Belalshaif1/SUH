import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Building2, Briefcase, GraduationCap, FileText,
  Megaphone, DollarSign, Wrench, MessageCircle, Moon, Sun,
  Globe, LogIn, LogOut, User, LayoutDashboard, Menu, Info, Download
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const Header: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { toggleTheme, isDark } = useTheme();
  const { user, profile, userRole, signOut } = useAuth();
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  React.useEffect(() => {
    if (user) {
      const fetchUnread = async () => {
        try {
          const msgs = await apiClient('/messages');
          // For simplicity, we count all messages where user is receiver
          // Real apps would have an 'is_read' flag
          setUnreadCount(msgs.length);
        } catch (err) {
          console.error("Error fetching messages:", err);
        }
      };
      fetchUnread();
      const interval = setInterval(fetchUnread, 30000); // Check every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  const navItems = [
    { path: '/', icon: Home, label: t('nav.home') },
    { path: '/universities', icon: Building2, label: t('nav.universities') },
    { path: '/services', icon: Wrench, label: t('nav.services') },
    { path: '/jobs', icon: Briefcase, label: t('nav.jobs') },
    { path: '/research', icon: FileText, label: t('nav.research') },
    { path: '/graduates', icon: GraduationCap, label: t('nav.graduates') },
    { path: '/fees', icon: DollarSign, label: t('nav.fees') },
    { path: '/announcements', icon: Megaphone, label: t('nav.announcements') },
    { path: '/chat', icon: MessageCircle, label: t('nav.chat') },
    { path: '/about', icon: Info, label: language === 'ar' ? 'من نحن' : 'About' },
  ];

  const avatarUrl = profile?.avatar_url;
  const initials = profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-lg">
      <div className="container mx-auto flex items-center px-4 py-3">
        {/* Left section: Mobile Menu */}
        <div className="flex flex-1 items-center">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={language === 'ar' ? 'right' : 'left'} className="w-72 p-0 flex flex-col">
              {/* User section at top */}
              <div className="p-4 border-b bg-muted/30">
                {user ? (
                  <Link to="/profile" onClick={() => setSheetOpen(false)} className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      {avatarUrl && <AvatarImage src={avatarUrl} alt="avatar" />}
                      <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{profile?.full_name || user.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </Link>
                ) : (
                  <Link to="/login" onClick={() => setSheetOpen(false)}>
                    <Button className="w-full bg-primary text-primary-foreground">
                      <LogIn className="h-4 w-4 me-2" />
                      {t('nav.login')}
                    </Button>
                  </Link>
                )}
              </div>

              {/* Dashboard link */}
              {user && user.role !== 'user' && (
                <Link
                  to="/dashboard"
                  onClick={() => setSheetOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 border-b text-sm font-medium transition-colors',
                    location.pathname === '/dashboard' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                  )}
                >
                  <LayoutDashboard className="h-5 w-5" />
                  {t('nav.dashboard')}
                </Link>
              )}

              {/* Nav items */}
              <div className="flex-1 overflow-y-auto py-2">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path ||
                    (item.path !== '/' && location.pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSheetOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 text-sm transition-colors relative',
                        isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                      {item.path === '/chat' && unreadCount > 0 && (
                        <span className="absolute end-4 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Bottom controls */}
              <div className="border-t p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}>
                    <Globe className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'English' : 'العربية'}
                  </Button>
                  <Button variant="outline" size="icon" onClick={toggleTheme}>
                    {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </div>
                {user && (
                  <Button variant="destructive" size="sm" className="w-full" onClick={() => { signOut(); setSheetOpen(false); }}>
                    <LogOut className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Center section: App Name */}
        <div className="flex items-center justify-center md:flex-initial">
          <Link to="/" className="flex items-center">
            <span className="text-lg font-bold text-foreground text-center">
              {language === 'ar' ? 'الدليل الجامعي' : 'UniGuide'}
            </span>
          </Link>
        </div>

        {/* Right section: Logo & Controls */}
        <div className="flex flex-1 items-center justify-end gap-2">
          <Link to="/" className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shrink-0 transition-transform hover:scale-105 active:scale-95">
            <GraduationCap className="h-6 w-6 text-gold" />
          </Link>
          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors relative',
                    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                  {item.path === '/chat' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center border-2 border-background">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}>
              <Globe className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {user ? (
              <div className="flex items-center gap-2">
                {user.role !== 'user' && (
                  <Link to="/dashboard">
                    <Button variant="outline" size="sm">
                      <LayoutDashboard className="h-4 w-4" />
                      <span className="hidden lg:inline ms-1">{t('nav.dashboard')}</span>
                    </Button>
                  </Link>
                )}
                <Link to="/profile">
                  <Avatar className="h-8 w-8 cursor-pointer">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt="avatar" />}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
                  </Avatar>
                </Link>
                <Button variant="ghost" size="icon" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button size="sm" className="bg-primary text-primary-foreground">
                  <LogIn className="h-4 w-4" />
                  <span className="ms-1">{t('nav.login')}</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
