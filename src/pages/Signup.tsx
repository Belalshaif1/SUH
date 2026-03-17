// 1. استيراد المكتبات والمكونات اللازمة
import React, { useState } from 'react'; // مكتبة ريأكت وإدارة الحالة
import { Link } from 'react-router-dom'; // مكون الروابط للتنقل بين الصفحات
import { useLanguage } from '@/contexts/LanguageContext'; // سياق اللغة (عربي/إنجليزي)
import { useAuth } from '@/contexts/AuthContext'; // سياق المصادقة (تسجيل، دخول)
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // مكونات البطاقة الجمالية
import { Input } from '@/components/ui/input'; // مكون حقول الإدخال
import { Button } from '@/components/ui/button'; // مكون الأزرار
import { Label } from '@/components/ui/label'; // مكون عناوين الحقول
import { GraduationCap, CheckCircle } from 'lucide-react'; // أيقونات جمالية
import { useToast } from '@/hooks/use-toast'; // أداة إظهار رسائل التنبيه الجانبية
import apiClient from '@/lib/apiClient'; // أداة الاتصال بالسيرفر

const Signup: React.FC = () => {
  // 2. تهيئة الدوال الأساسية من السياقات
  const { t, language } = useLanguage(); // دالة الترجمة واللغة الحالية
  const { signUp } = useAuth(); // دالة إنشاء الحساب من الـ AuthContext
  const { toast } = useToast(); // دالة إظهار الإشعارات

  // 3. تعريف حالات المكون (State Management)
  const [step, setStep] = useState(1); // تتبع الخطوة الحالية (1: البيانات، 2: التحقق، 3: كلمة المرور)
  const [regType, setRegType] = useState<'email' | 'phone'>('email'); // نوع التسجيل (إيميل أو هاتف)
  const [email, setEmail] = useState(''); // تخزين الإيميل
  const [phone, setPhone] = useState(''); // تخزين رقم الهاتف
  const [fullName, setFullName] = useState(''); // تخزين الاسم الكامل
  const [verificationCode, setVerificationCode] = useState(''); // تخزين الكود المدخل من المستخدم
  const [password, setPassword] = useState(''); // تخزين كلمة المرور
  const [loading, setLoading] = useState(false); // حالة التحميل (لتعطيل الأزرار أثناء الطلب)
  const [success, setSuccess] = useState(false); // حالة نجاح العملية بالكامل
  const [expectedCode, setExpectedCode] = useState(''); // الكود الصحيح القادم من السيرفر للمقارنة

  // 4. معالجة الانتقال بين الخطوات
  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault(); // منع الصفحة من إعادة التحميل عند ضغط الزر
    
    // الخطوة الأولى: إرسال كود التحقق بناءً على الإيميل أو الهاتف
    if (step === 1) {
      setLoading(true); // بدء حالة التحميل
      try {
        // طلب إرسال الكود من السيرفر
        const res = await apiClient('/auth/send-register-code', {
            method: 'POST',
            body: JSON.stringify(regType === 'email' ? { email } : { phone }),
        });
        setExpectedCode(res.code); // حفظ الكود القادم (للتطوير المحلي)
        setStep(2); // الانتقال للخطوة التالية
        toast({ title: t('auth.code_sent'), description: language === 'ar' ? 'تم إرسال رمز التحقق' : 'Verification code sent' });
      } catch (err: any) {
        // إظهار خطأ في حال فشل الإرسال
        toast({ title: err.message || "Error", variant: 'destructive' });
      } finally {
        setLoading(false); // إنهاء حالة التحميل
      }
    } 
    // الخطوة الثانية: مقارنة الكود المدخل بالكود المتوقع
    else if (step === 2) {
      if (verificationCode === expectedCode) {
        setStep(3); // الانتقال لخطوة تعيين كلمة المرور في حال مطابقة الكود
      } else {
        toast({ title: language === 'ar' ? 'رمز غير صحيح' : 'Invalid code', variant: 'destructive' });
      }
    } 
    // الخطوة الثالثة: إتمام عملية التسجيل النهائية وحفظ البيانات
    else if (step === 3) {
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
        setSuccess(true); // إظهار واجهة النجاح
      }
    }
  };

  // 5. دالة مسؤولة عن عرض محتوى كل خطوة (تُستخدم داخل الجسم الرئيسي للمكون)
  const renderStepContent = () => {
    switch (step) {
      case 1:
        // الخطوة 1: اختيار وسيلة التسجيل وإدخال الاسم والبيانات الأساسية
        return (
          <form onSubmit={handleNextStep} className="space-y-6">
            {/* أزرار التبديل بين البريد الإلكتروني ورقم الهاتف */}
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

            {/* حقل الاسم الكامل */}
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

            {/* إظهار حقل الإيميل أو الهاتف بناءً على الاختيار */}
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

            {/* زر الانتقال للخطوة التالية */}
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
        // الخطوة 2: إدخال رمز التحقق
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
                maxLength={6}
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
        // الخطوة 3: تعيين كلمة المرور النهائية لتنفيذ التسجيل
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
