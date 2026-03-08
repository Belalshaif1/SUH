import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login: React.FC = () => {
  const { t, language } = useLanguage();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: error.message, variant: 'destructive' });
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex min-h-[90vh] items-center justify-center px-4 animate-fade-in py-20 relative overflow-hidden">
      <div className="absolute inset-0 gradient-academic opacity-[0.02] z-0" />

      <Card className="card-premium w-full max-w-md relative z-10 bg-white/80 backdrop-blur-xl border border-border/50 shadow-2xl shadow-primary/10 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 z-0" />

        <CardHeader className="text-center pb-10 relative z-10">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white shadow-2xl border-4 border-slate-50 group hover:rotate-6 transition-transform duration-500">
            <GraduationCap className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-4xl font-bold text-primary tracking-tight">{t('auth.login')}</CardTitle>
          <p className="text-muted-foreground mt-2 font-medium">
            {language === 'ar' ? 'مرحباً بك مجدداً في دليلك الذكي' : 'Welcome back to your smart guide'}
          </p>
        </CardHeader>

        <CardContent className="relative z-10 px-8 pb-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-bold text-primary/80 ms-1">{language === 'ar' ? 'البريد الإلكتروني أو رقم الهاتف' : 'Email or Phone'}</Label>
              <Input
                type="text"
                placeholder={language === 'ar' ? 'example@mail.com أو 077...' : 'example@mail.com or 077...'}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="h-14 rounded-2xl border-2 border-border/30 bg-white/50 focus-visible:ring-primary/10 focus-visible:border-primary/30 transition-all font-bold"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <Label className="text-sm font-bold text-primary/80">{t('auth.password')}</Label>
                <Link to="/forgot-password" title="Recover Password" className="text-sm font-bold text-gold hover:text-primary transition-colors">
                  {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                </Link>
              </div>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="h-14 rounded-2xl border-2 border-border/30 bg-white/50 focus-visible:ring-primary/10 focus-visible:border-primary/30 transition-all font-bold"
              />
            </div>
            <Button type="submit" className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98]" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {t('common.loading')}
                </div>
              ) : t('auth.login')}
            </Button>
          </form>
          <p className="mt-8 text-center text-sm font-bold text-muted-foreground">
            {t('auth.no_account')} <Link to="/signup" className="text-gold hover:text-primary transition-colors">{t('auth.signup')}</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
