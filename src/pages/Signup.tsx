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
  const { t } = useLanguage();
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
      // Simulate sending code
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

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleNextStep} className="space-y-4">
            <div className="flex justify-center space-x-2 mb-4">
              <Button
                type="button"
                variant={regType === 'email' ? 'default' : 'outline'}
                onClick={() => setRegType('email')}
                className="flex-1"
              >
                {t('auth.email')}
              </Button>
              <Button
                type="button"
                variant={regType === 'phone' ? 'default' : 'outline'}
                onClick={() => setRegType('phone')}
                className="flex-1"
              >
                {t('auth.phone')}
              </Button>
            </div>

            <div className="space-y-2">
              <Label>{t('auth.full_name')}</Label>
              <Input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                placeholder="John Doe"
              />
            </div>

            {regType === 'email' ? (
              <div className="space-y-2">
                <Label>{t('auth.email')}</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="email@example.com"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>{t('auth.phone')}</Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  placeholder="+1234567890"
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('common.loading') : t('auth.next')}
            </Button>
          </form>
        );
      case 2:
        return (
          <form onSubmit={handleNextStep} className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Enter the verification code sent to {regType === 'email' ? email : phone}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{t('auth.verify_code')}</Label>
              <Input
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value)}
                required
                placeholder="1234"
                className="text-center text-2xl tracking-[1em]"
                maxLength={4}
              />
            </div>
            <Button type="submit" className="w-full">
              {t('auth.next')}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setStep(1)}>
              {t('universities.back')}
            </Button>
          </form>
        );
      case 3:
        return (
          <form onSubmit={handleNextStep} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('auth.password')}</Label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('common.loading') : t('auth.signup')}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setStep(2)}>
              {t('universities.back')}
            </Button>
          </form>
        );
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 animate-fade-in">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-gold" />
            <h2 className="mb-2 text-xl font-bold">{t('auth.check_email')}</h2>
            <Link to="/login"><Button variant="outline" className="mt-4">{t('auth.login')}</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 animate-fade-in">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <GraduationCap className="h-8 w-8 text-gold" />
          </div>
          <CardTitle className="text-2xl">{t('auth.signup')}</CardTitle>
          <div className="flex justify-between mt-4 px-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${step === s ? 'bg-primary text-primary-foreground border-primary' :
                    step > s ? 'bg-primary border-primary text-primary-foreground' : 'border-muted text-muted-foreground'
                  }`}
              >
                {step > s ? '✓' : s}
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {renderStep()}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t('auth.has_account')} <Link to="/login" className="text-gold font-semibold hover:underline">{t('auth.login')}</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
