/**
 * @file src/components/dashboard/SecurityTab.tsx
 * @description Change-password form for the current logged-in user.
 *              Features: current/new/confirm password fields with show/hide toggles,
 *              a real-time password strength indicator, and match validation on the
 *              confirm field. Sends a PUT request to /api/auth/change-password/:userId.
 */

import React, { useState } from 'react'; // State for field values, visibility toggles, and loading
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card';          // Shadcn card layout
import { Button } from '@/components/ui/button'; // Shadcn button
import { Input }  from '@/components/ui/input';  // Shadcn input
import { Label }  from '@/components/ui/label';  // Shadcn label
import { Shield, Eye, EyeOff, CheckCircle } from 'lucide-react'; // Shield for header, Eye for visibility toggle
import { useToast } from '@/hooks/use-toast';    // Toast notifications
import apiClient from '@/lib/apiClient';          // Authenticated HTTP client

// ─── Props ────────────────────────────────────────────────────────────────

/** Props for the SecurityTab component */
interface SecurityTabProps {
    userId:   string; // ID of the currently logged-in user (used in the API endpoint URL)
    language: string; // Current UI language ('ar' | 'en') for inline text rendering
}

// ─── Component ────────────────────────────────────────────────────────────

const SecurityTab: React.FC<SecurityTabProps> = ({ userId, language }) => {
    const { toast } = useToast(); // Toast notification system
    const isAr = language === 'ar'; // Shorthand for all AR/EN conditional checks

    // ── Form field state ──────────────────────────────────────────────

    const [oldPassword,     setOldPassword]     = useState(''); // The user's current (old) password
    const [newPassword,     setNewPassword]     = useState(''); // The new password the user wants to set
    const [confirmPassword, setConfirmPassword] = useState(''); // Confirmation field — must match newPassword

    // ── UI toggle state ───────────────────────────────────────────────

    const [showOld, setShowOld] = useState(false); // true = show old password as plain text
    const [showNew, setShowNew] = useState(false); // true = show new password as plain text

    // ── In-flight state ───────────────────────────────────────────────

    const [loading, setLoading] = useState(false); // true while the PUT request is in flight

    // ── Submit handler ────────────────────────────────────────────────

    /**
     * handleSubmit — validates the form and sends a PUT request to update the password.
     * Clears all form fields on success so the form resets to a clean state.
     *
     * @param e - Form submit event (used to prevent default page reload)
     */
    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault(); // Prevent the browser from reloading the page on form submit

        // Guard: new password must match the confirmation field
        if (newPassword !== confirmPassword) {
            toast({
                title:   isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match',
                variant: 'destructive',
            });
            return;
        }

        // Guard: minimum password length of 6 characters
        if (newPassword.length < 6) {
            toast({
                title:   isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true); // Disable the submit button during the request
        try {
            // PUT /api/auth/change-password/:userId — body includes both old and new passwords
            await apiClient(`/auth/change-password/${userId}`, {
                method: 'PUT',
                body:   JSON.stringify({ oldPassword, newPassword }),
            });
            toast({ title: isAr ? '✅ تم تغيير كلمة المرور بنجاح' : '✅ Password changed successfully' });
            // Clear all fields after a successful change so the form is ready for next use
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            toast({
                title:   err.message || (isAr ? 'فشل تغيير كلمة المرور' : 'Failed to change password'),
                variant: 'destructive',
            });
        } finally {
            setLoading(false); // Always re-enable the button
        }
    };

    // ── Password strength calculation ─────────────────────────────────

    /**
     * strength — numeric score: 0 = empty, 1 = weak (<6), 2 = medium (<10), 3 = strong (10+).
     * Used to control the colour of the 3-segment strength bar.
     */
    const strength = newPassword.length === 0
        ? 0                     // Nothing typed yet — hide the bar
        : newPassword.length < 6
          ? 1                   // Weak: below minimum length
          : newPassword.length < 10
            ? 2                 // Medium: meets minimum but could be stronger
            : 3;                // Strong: 10+ characters

    /** Tailwind colour classes for each strength level (index 0 unused) */
    const strengthColors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-green-500'];

    /** Human-readable strength labels for each strength level (index 0 unused) */
    const strengthLabels = isAr
        ? ['', 'ضعيفة', 'متوسطة', 'قوية']
        : ['', 'Weak', 'Medium', 'Strong'];

    // ── Render ────────────────────────────────────────────────────────

    return (
        <div className="max-w-md mx-auto"> {/* Centred narrow card — password forms don't need full width */}
            <Card className="border-gold/20 bg-card/50 backdrop-blur-sm"> {/* Subtle gold border for security theme */}

                {/* ── Card header ── */}
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Shield className="h-5 w-5 text-gold" /> {/* Shield icon reinforces security context */}
                        {isAr ? 'الأمان وكلمة المرور' : 'Security & Password'}
                    </CardTitle>
                    <CardDescription>
                        {isAr
                            ? 'قم بتغيير كلمة المرور الخاصة بك للحفاظ على أمان حسابك'
                            : 'Change your password to keep your account secure'
                        }
                    </CardDescription>
                </CardHeader>

                {/* ── Form body ── */}
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* ── Current (old) password field ── */}
                        <div className="space-y-1.5">
                            <Label>{isAr ? 'كلمة المرور الحالية' : 'Current Password'}</Label>
                            <div className="relative">
                                {/* Input type switches between "password" and "text" based on showOld state */}
                                <Input
                                    type={showOld ? 'text' : 'password'} // Toggle visibility
                                    value={oldPassword}
                                    onChange={e => setOldPassword(e.target.value)} // Update state on every keystroke
                                    required                   // HTML5 required validation
                                    className="pr-10 border-gold/20" // Right padding for the eye button
                                    placeholder={isAr ? 'أدخل كلمة المرور الحالية' : 'Enter current password'}
                                />
                                {/* Eye / EyeOff toggle button — positioned absolutely inside the input */}
                                <button
                                    type="button"
                                    onClick={() => setShowOld(!showOld)} // Toggle the visibility state
                                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    {showOld
                                        ? <EyeOff className="h-4 w-4" /> // Currently showing — allow hiding
                                        : <Eye    className="h-4 w-4" /> // Currently hidden — allow showing
                                    }
                                </button>
                            </div>
                        </div>

                        {/* ── New password field + strength indicator ── */}
                        <div className="space-y-1.5">
                            <Label>{isAr ? 'كلمة المرور الجديدة' : 'New Password'}</Label>
                            <div className="relative">
                                <Input
                                    type={showNew ? 'text' : 'password'} // Toggle visibility
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    required
                                    className="pr-10 border-gold/20"
                                    placeholder={isAr ? 'أدخل كلمة المرور الجديدة' : 'Enter new password'}
                                />
                                {/* Eye/EyeOff for new password field */}
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>

                            {/* ── Password strength bar — only shown when something is typed ── */}
                            {newPassword.length > 0 && (
                                <div className="space-y-1">
                                    {/* Three equal segments — filled segments get the strength colour */}
                                    <div className="flex gap-1">
                                        {[1, 2, 3].map(i => (
                                            <div
                                                key={i}
                                                className={`h-1.5 flex-1 rounded-full transition-all ${
                                                    strength >= i ? strengthColors[strength] : 'bg-muted'
                                                    // Segments up to the current strength level get the colour class
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    {/* Strength label: "Weak" / "Medium" / "Strong" */}
                                    <p className="text-xs text-muted-foreground">
                                        {strengthLabels[strength]}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* ── Confirm new password field ── */}
                        <div className="space-y-1.5">
                            <Label>{isAr ? 'تأكيد كلمة المرور' : 'Confirm New Password'}</Label>
                            <div className="relative">
                                <Input
                                    type="password" // Always hidden — no toggle for the confirm field
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    required
                                    // Dynamically apply border colour: red if mismatch, green if match, default otherwise
                                    className={`border-gold/20 ${
                                        confirmPassword && confirmPassword !== newPassword ? 'border-red-500' :
                                        confirmPassword && confirmPassword === newPassword ? 'border-green-500' :
                                        '' // No colour before the user starts typing
                                    }`}
                                    placeholder={isAr ? 'أعد إدخال كلمة المرور الجديدة' : 'Re-enter new password'}
                                />
                                {/* Green checkmark shown inside the field when the passwords match */}
                                {confirmPassword && confirmPassword === newPassword && (
                                    <CheckCircle className="absolute right-3 top-2.5 h-4 w-4 text-green-500" />
                                )}
                            </div>
                        </div>

                        {/* ── Submit button ── */}
                        <Button
                            type="submit"
                            disabled={loading} // Prevent double-submit while request is in-flight
                            className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
                        >
                            {loading
                                ? (isAr ? 'جاري الحفظ...' : 'Saving...')           // Saving indicator
                                : (isAr ? 'تغيير كلمة المرور' : 'Change Password') // Normal label
                            }
                        </Button>

                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default SecurityTab; // Default export to match Dashboard.tsx import
