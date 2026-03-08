import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { GraduationCap, KeyRound, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/apiClient';

const ForgotPassword: React.FC = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [step, setStep] = useState(1); // 1: Identifier, 2: Verification, 3: New Password
    const [identifier, setIdentifier] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [contextId, setContextId] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleIdentifierSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await apiClient('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ identifier }),
            });
            setContextId(data.context_id);
            setStep(2);
            toast({ title: t('auth.code_sent'), description: "Mock code is 1234" });
        } catch (error: any) {
            toast({ title: error.message || "User not found", variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (verificationCode === '1234') {
            setStep(3);
        } else {
            toast({ title: "Invalid code", variant: 'destructive' });
        }
    };

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiClient('/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({
                    context_id: contextId,
                    code: verificationCode,
                    new_password: newPassword
                }),
            });
            setSuccess(true);
            toast({ title: "Password reset successful" });
        } catch (error: any) {
            toast({ title: error.message || "Reset failed", variant: 'destructive' });
        } finally {
            setLoading(false);
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
                        <h2 className="text-3xl font-bold text-primary mb-4">{t('auth.reset_password')}</h2>
                        <p className="text-muted-foreground text-lg leading-relaxed mb-10">
                            {language === 'ar' ? 'لقد تم تغيير كلمة المرور الخاصة بك بنجاح.' : 'Your password has been changed successfully.'}
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
                    <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white shadow-2xl border-4 border-slate-50 group hover:rotate-6 transition-transform duration-500">
                        <KeyRound className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-primary tracking-tight">{t('auth.forgot_password')}</CardTitle>
                    <div className="mt-8 flex items-center justify-center px-2 relative">
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-xl border-2 transition-all duration-500 ${step === s ? 'bg-primary text-white border-white shadow-lg scale-110' :
                                    step > s ? 'bg-gold border-white text-white shadow-sm' : 'bg-white border-slate-100 text-slate-300'
                                    }`}
                            >
                                {step > s ? <CheckCircle className="h-5 w-5" /> : <span className="text-sm font-black">{s}</span>}
                            </div>
                        ))}
                    </div>
                </CardHeader>

                <CardContent className="relative z-10 px-8 pb-10">
                    {step === 1 && (
                        <form onSubmit={handleIdentifierSubmit} className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-primary/80 ms-1 uppercase tracking-wider">{t('auth.email')} / {t('auth.phone')}</Label>
                                <Input
                                    value={identifier}
                                    onChange={e => setIdentifier(e.target.value)}
                                    required
                                    placeholder={language === 'ar' ? 'البريد الإلكتروني أو رقم الهاتف' : 'Enter your email or phone'}
                                    className="h-14 rounded-2xl border-2 border-border/30 bg-white shadow-sm focus-visible:ring-primary/10 transition-all font-bold text-primary"
                                />
                            </div>
                            <Button type="submit" className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/95 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98]" disabled={loading}>
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                        {t('common.loading')}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span>{t('auth.send_code')}</span>
                                    </div>
                                )}
                            </Button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleVerifySubmit} className="space-y-6">
                            <div className="text-center bg-gold/5 p-6 rounded-[2rem] border border-gold/20">
                                <p className="text-sm font-black text-primary">
                                    {language === 'ar' ? `أدخل رمز التحقق المرسل` : `Enter the verification code sent`}
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
                            <Button type="submit" className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/95 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
                                {t('auth.next')}
                            </Button>
                        </form>
                    )}

                    {step === 3 && (
                        <form onSubmit={handleResetSubmit} className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-primary/80 ms-1 uppercase tracking-wider">{language === 'ar' ? 'كلمة المرور الجديدة' : `New ${t('auth.password')}`}</Label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="h-14 rounded-2xl border-2 border-border/30 bg-white shadow-sm focus-visible:ring-primary/10 transition-all font-bold text-primary"
                                />
                            </div>
                            <Button type="submit" className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/95 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98]" disabled={loading}>
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                        {t('common.loading')}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span>{t('auth.reset_password')}</span>
                                    </div>
                                )}
                            </Button>
                        </form>
                    )}

                    <div className="mt-8 text-center">
                        <Link to="/login" className="text-sm font-bold text-gold hover:text-primary transition-colors">
                            {t('universities.back')}
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ForgotPassword;
