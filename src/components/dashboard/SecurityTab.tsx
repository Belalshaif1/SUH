import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/apiClient";

interface SecurityTabProps {
    userId: string;
    language: string;
}

const SecurityTab: React.FC<SecurityTabProps> = ({ userId, language }) => {
    const { toast } = useToast();
    const isAr = language === 'ar';

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast({ title: isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match', variant: 'destructive' });
            return;
        }
        if (newPassword.length < 6) {
            toast({ title: isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters', variant: 'destructive' });
            return;
        }
        setLoading(true);
        try {
            await apiClient(`/auth/change-password/${userId}`, {
                method: 'PUT',
                body: JSON.stringify({ oldPassword, newPassword }),
            });
            toast({ title: isAr ? '✅ تم تغيير كلمة المرور بنجاح' : '✅ Password changed successfully' });
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            toast({ title: err.message || (isAr ? 'فشل تغيير كلمة المرور' : 'Failed to change password'), variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const strength = newPassword.length === 0 ? 0 : newPassword.length < 6 ? 1 : newPassword.length < 10 ? 2 : 3;
    const strengthColors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-green-500'];
    const strengthLabels = isAr
        ? ['', 'ضعيفة', 'متوسطة', 'قوية']
        : ['', 'Weak', 'Medium', 'Strong'];

    return (
        <div className="max-w-md mx-auto">
            <Card className="border-gold/20 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Shield className="h-5 w-5 text-gold" />
                        {isAr ? 'الأمان وكلمة المرور' : 'Security & Password'}
                    </CardTitle>
                    <CardDescription>
                        {isAr ? 'قم بتغيير كلمة المرور الخاصة بك للحفاظ على أمان حسابك' : 'Change your password to keep your account secure'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Old Password */}
                        <div className="space-y-1.5">
                            <Label>{isAr ? 'كلمة المرور الحالية' : 'Current Password'}</Label>
                            <div className="relative">
                                <Input
                                    type={showOld ? 'text' : 'password'}
                                    value={oldPassword}
                                    onChange={e => setOldPassword(e.target.value)}
                                    required
                                    className="pr-10 border-gold/20"
                                    placeholder={isAr ? 'أدخل كلمة المرور الحالية' : 'Enter current password'}
                                />
                                <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                                    {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div className="space-y-1.5">
                            <Label>{isAr ? 'كلمة المرور الجديدة' : 'New Password'}</Label>
                            <div className="relative">
                                <Input
                                    type={showNew ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    required
                                    className="pr-10 border-gold/20"
                                    placeholder={isAr ? 'أدخل كلمة المرور الجديدة' : 'Enter new password'}
                                />
                                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {newPassword.length > 0 && (
                                <div className="space-y-1">
                                    <div className="flex gap-1">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${strength >= i ? strengthColors[strength] : 'bg-muted'}`} />
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{strengthLabels[strength]}</p>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                            <Label>{isAr ? 'تأكيد كلمة المرور' : 'Confirm New Password'}</Label>
                            <div className="relative">
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    required
                                    className={`border-gold/20 ${confirmPassword && confirmPassword !== newPassword ? 'border-red-500' : confirmPassword && confirmPassword === newPassword ? 'border-green-500' : ''}`}
                                    placeholder={isAr ? 'أعد إدخال كلمة المرور الجديدة' : 'Re-enter new password'}
                                />
                                {confirmPassword && confirmPassword === newPassword && (
                                    <CheckCircle className="absolute right-3 top-2.5 h-4 w-4 text-green-500" />
                                )}
                            </div>
                        </div>

                        <Button type="submit" disabled={loading} className="w-full bg-gold text-gold-foreground hover:bg-gold/90">
                            {loading ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'تغيير كلمة المرور' : 'Change Password')}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default SecurityTab;
