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
    const { t } = useLanguage();
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
            <div className="flex min-h-[80vh] items-center justify-center px-4 animate-fade-in">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="py-12">
                        <CheckCircle className="mx-auto mb-4 h-16 w-16 text-gold" />
                        <h2 className="mb-2 text-xl font-bold">{t('auth.reset_password')}</h2>
                        <p className="text-muted-foreground mb-6">Your password has been changed successfully.</p>
                        <Link to="/login"><Button className="w-full">{t('auth.login')}</Button></Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-[80vh] items-center justify-center px-4 animate-fade-in">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                        <KeyRound className="h-8 w-8 text-gold" />
                    </div>
                    <CardTitle className="text-2xl">{t('auth.forgot_password')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {step === 1 && (
                        <form onSubmit={handleIdentifierSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>{t('auth.email')} / {t('auth.phone')}</Label>
                                <Input
                                    value={identifier}
                                    onChange={e => setIdentifier(e.target.value)}
                                    required
                                    placeholder="Enter your email or phone"
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? t('common.loading') : t('auth.send_code')}
                            </Button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleVerifySubmit} className="space-y-4">
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
                        </form>
                    )}

                    {step === 3 && (
                        <form onSubmit={handleResetSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>New {t('auth.password')}</Label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? t('common.loading') : t('auth.reset_password')}
                            </Button>
                        </form>
                    )}

                    <div className="mt-4 text-center">
                        <Link to="/login" className="text-sm text-gold hover:underline">
                            {t('universities.back')}
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ForgotPassword;
