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
    <div className="flex min-h-[80vh] items-center justify-center px-4 animate-fade-in py-12">
      <Card className="card-premium w-full max-w-md p-6">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-xl shadow-primary/20">
            <GraduationCap className="h-10 w-10 text-gold" />
          </div>
          <CardTitle className="text-3xl heading-premium">{t('auth.login')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'البريد الإلكتروني أو رقم الهاتف' : 'Email or Phone'}</Label>
              <Input
                type="text"
                placeholder={language === 'ar' ? 'example@mail.com أو 077...' : 'example@mail.com or 077...'}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('auth.password')}</Label>
                <Link to="/forgot-password" title="Recover Password" className="text-xs text-gold hover:underline">
                  {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                </Link>
              </div>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('common.loading') : t('auth.login')}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t('auth.no_account')} <Link to="/signup" className="text-gold font-semibold hover:underline">{t('auth.signup')}</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
