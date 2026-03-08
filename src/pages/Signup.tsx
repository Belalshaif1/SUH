import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { GraduationCap, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Signup: React.FC = () => {
  const { t, language } = useLanguage();
  const { signUp } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(1); // 1: Identity, 2: Verification, 3: Password
  const [regType, setRegType] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setStep(2);
        toast({ title: t('auth.code_sent'), description: "Mock code is 1234" });
      }, 800);
    } else if (step === 2) {
      if (verificationCode === '1234') {
        setStep(3);
      } else {
        toast({ title: "Invalid code", variant: 'destructive' });
      }
    } else if (step === 3) {
      setLoading(true);
      const { error } = await signUp(
        regType === 'email' ? email : null,
        regType === 'phone' ? phone : null,
        password,
        fullName
      );
      setLoading(false);
      if (error) {
        toast({ title: error.message, variant: 'destructive' });
      } else {
        setSuccess(true);
      }
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleNextStep} className="space-y-6">
            <div className="flex bg-slate-100/50 p-1.5 rounded-2xl gap-2">
              <Button
                type="button"
                variant={regType === 'email' ? 'default' : 'ghost'}
                onClick={() => setRegType('email')}
                className={`flex-1 h-12 rounded-xl font-bold transition-all ${regType === 'email' ? 'bg-primary text-white shadow-lg' : 'text-primary/60 hover:text-primary hover:bg-white'}`}
              >
                {t('auth.email')}
              </Button>
              <Button
                type="button"
                variant={regType === 'phone' ? 'default' : 'ghost'}
                onClick={() => setRegType('phone')}
                className={`flex-1 h-12 rounded-xl font-bold transition-all ${regType === 'phone' ? 'bg-primary text-white shadow-lg' : 'text-primary/60 hover:text-primary hover:bg-white'}`}
              >
                {t('auth.phone')}
              </Button>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-bold text-primary/80 ms-1">{t('auth.full_name')}</Label>
              <Input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                placeholder={language === 'ar' ? 'مثلاً: علاء الدين' : 'John Doe'}
                className="h-14 rounded-2xl border-2 border-border/30 bg-white/50 focus-visible:ring-primary/10 focus-visible:border-primary/30 transition-all font-bold"
              />
            </div>

            {regType === 'email' ? (
              <div className="space-y-3">
                <Label className="text-sm font-bold text-primary/80 ms-1">{t('auth.email')}</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="email@example.com"
                  className="h-14 rounded-2xl border-2 border-border/30 bg-white/50 focus-visible:ring-primary/10 focus-visible:border-primary/30 transition-all font-bold"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <Label className="text-sm font-bold text-primary/80 ms-1">{t('auth.phone')}</Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  placeholder="+964..."
                  className="h-14 rounded-2xl border-2 border-border/30 bg-white/50 focus-visible:ring-primary/10 focus-visible:border-primary/30 transition-all font-bold"
                />
              </div>
            )}

            <Button type="submit" className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98]" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {t('common.loading')}
                </div>
              ) : t('auth.next')}
            </Button>
          </form>
        );
      case 2:
        return (
          <form onSubmit={handleNextStep} className="space-y-6">
            <div className="text-center bg-gold/5 p-6 rounded-[2rem] border border-gold/20">
              <p className="text-sm font-black text-primary">
                {language === 'ar' ? `أدخل رمز التحقق المرسل إلى ${regType === 'email' ? email : phone}` : `Enter verification code sent to ${regType === 'email' ? email : phone}`}
              </p>
            </div>
            <div className="space-y-4">
              <Label className="text-sm font-bold text-primary/80 block text-center uppercase tracking-[0.2em]">{t('auth.verify_code')}</Label>
              <Input
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value)}
                required
                placeholder="0000"
                className="h-20 text-center text-4xl tracking-[0.5em] font-black rounded-3xl border-2 border-border/30 bg-white shadow-inner focus-visible:ring-primary/20 focus-visible:border-primary"
                maxLength={4}
              />
            </div>
            <div className="space-y-2">
              <Button type="submit" className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
                {t('auth.next')}
              </Button>
              <Button type="button" variant="ghost" className="w-full h-12 rounded-xl text-primary/60 font-bold hover:bg-slate-50" onClick={() => setStep(1)}>
                {t('universities.back')}
              </Button>
            </div>
          </form>
        );
      case 3:
        return (
          <form onSubmit={handleNextStep} className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-bold text-primary/80 ms-1">{t('auth.password')}</Label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-14 rounded-2xl border-2 border-border/30 bg-white/50 focus-visible:ring-primary/10 focus-visible:border-primary/30 transition-all font-bold"
              />
            </div>
            <div className="space-y-2">
              <Button type="submit" className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98]" disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    {t('common.loading')}
                  </div>
                ) : t('auth.signup')}
              </Button>
              <Button type="button" variant="ghost" className="w-full h-12 rounded-xl text-primary/60 font-bold hover:bg-slate-50" onClick={() => setStep(2)}>
                {t('universities.back')}
              </Button>
            </div>
          </form>
        );
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[90vh] items-center justify-center px-4 animate-fade-in py-20 relative overflow-hidden">
        <div className="absolute inset-0 gradient-academic opacity-[0.02] z-0" />
        <Card className="card-premium w-full max-w-md text-center relative z-10 bg-white/80 backdrop-blur-xl border border-border/50 shadow-2xl">
          <CardContent className="py-16 px-8">
            <div className="mx-auto mb-8 h-24 w-24 rounded-full bg-primary/5 flex items-center justify-center border-4 border-slate-50 shadow-xl">
              <CheckCircle className="h-12 w-12 text-gold animate-bounce" />
            </div>
            <h2 className="text-3xl font-bold text-primary mb-4">{t('auth.check_email')}</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-10">
              {language === 'ar' ? 'لقد تم إنشاء حسابك بنجاح. يرجى التحقق من بريدك الإلكتروني لتنشيط الحساب.' : 'Your account has been created successfully. Please check your email to activate it.'}
            </p>
            <Link to="/login">
              <Button className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
                {t('auth.login')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[90vh] items-center justify-center px-4 animate-fade-in py-20 relative overflow-hidden">
      <div className="absolute inset-0 gradient-academic opacity-[0.02] z-0" />

      <Card className="card-premium w-full max-w-md relative z-10 bg-white/80 backdrop-blur-xl border border-border/50 shadow-2xl shadow-primary/10 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 z-0" />

        <CardHeader className="text-center pb-10 relative z-10 px-8">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-white shadow-2xl border-4 border-slate-50 group hover:rotate-6 transition-transform duration-500">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary tracking-tight mb-8">{t('auth.signup')}</CardTitle>

          <div className="flex items-center justify-between px-2 relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-2xl border-4 transition-all duration-500 ${step === s ? 'bg-primary text-white border-white shadow-xl scale-125' :
                  step > s ? 'bg-gold border-white text-white shadow-lg' : 'bg-white border-slate-100 text-slate-300'
                  }`}
              >
                {step > s ? <CheckCircle className="h-6 w-6" /> : <span className="text-lg font-black">{s}</span>}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="relative z-10 px-8 pb-10">
          {renderStepContent()}
          <p className="mt-8 text-center text-sm font-bold text-muted-foreground">
            {t('auth.has_account')} <Link to="/login" className="text-gold hover:text-primary transition-colors">{t('auth.login')}</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
