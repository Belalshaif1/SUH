// 1. استيراد المكتبات اللازمة
const express = require('express'); // إطار عمل الويب
const router = express.Router(); // منظم المسارات
const bcrypt = require('bcryptjs'); // لتشفير وفك تشفير كلمات المرور
const jwt = require('jsonwebtoken'); // لإنشاء رموز التحقق (Tokens)
const crypto = require('crypto'); // للعمليات التشفيرية
const db = require('../db'); // الربط مع قاعدة البيانات

// 2. مفتاح التشفير الخاص بالـ JWT
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// 3. دالة مساعدة لجلب الصلاحيات الفعلية للمستخدم (دمج صلاحيات الدور مع التجاوزات)
async function getEffectivePermissions(userId, role) {
    // جلب الصلاحيات المرتبطة بدور المستخدم (مثل super_admin)
    const rolePerms = await db.query('SELECT permission_key, is_enabled FROM role_permissions WHERE role = $1', [role]);
    // جلب أي صلاحيات خاصة تم إعطاؤها أو سحبها من هذا المستخدم تحديداً
    const userOverrides = await db.query('SELECT permission_key, is_enabled FROM user_permissions WHERE user_id = $1', [userId]);

    const permissions = {};
    // إضافة صلاحيات الدور إلى الكائن
    rolePerms.forEach(p => {
        permissions[p.permission_key] = p.is_enabled === 1;
    });
    // تحديث الصلاحيات بناءً على التجاوزات الخاصة بالمستخدم (تأخذ الأولوية)
    userOverrides.forEach(p => {
        permissions[p.permission_key] = p.is_enabled === 1;
    });
    return permissions;
}

// 4. مسار تسجيل الدخول (Login)
router.post('/login', async (req, res) => {
    try {
        // استخراج معرف المستخدم (إيميل أو هاتف) وكلمة المرور من الطلب
        const { identifier, password } = req.body;
        // التأكد من إرسال البيانات المطلوبة
        if (!identifier || !password) {
            return res.status(400).json({ error: 'Identifier and password are required' });
        }

        // البحث عن المستخدم باستخدام الإيميل أو رقم الهاتف
        const user = await db.getAsync(
            'SELECT * FROM users WHERE email = $1 OR phone = $2',
            [identifier, identifier]
        );

        // إذا لم يتم العثور على المستخدم
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // مقارنة كلمة المرور المدخلة مع المشفرة في قاعدة البيانات
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // التأكد من أن الحساب نشط وغير محظور
        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is inactive' });
        }

        // إنشاء Token يحتوي على بيانات المستخدم الأساسية وصلاحيته لمدة 24 ساعة
        const token = jwt.sign({
            id: user.id,
            role: user.role,
            university_id: user.university_id,
            college_id: user.college_id,
            department_id: user.department_id
        }, JWT_SECRET, { expiresIn: '24h' });

        // جلب قائمة الصلاحيات المتاحة لهذا المستخدم
        const permissions = await getEffectivePermissions(user.id, user.role);

        // إرسال الـ Token وبيانات المستخدم إلى الواجهة الأمامية
        res.json({
            token, user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                avatar_url: user.avatar_url,
                phone: user.phone,
                university_id: user.university_id,
                college_id: user.college_id,
                department_id: user.department_id,
                permissions
            }
        });
    } catch (err) {
        // في حال حدوث خطأ غير متوقع
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 5. مسار إنشاء حساب جديد (Register)
router.post('/register', async (req, res) => {
    try {
        // استخراج البيانات المرسلة من المستخدم
        const { email, phone, password, full_name } = req.body;
        const { v4: uuidv4 } = require('uuid'); // استيراد أداة إنشاء المعرفات الفريدة

        // التأكد من توفر وسيلة اتصال (إيميل أو هاتف)
        if (!email && !phone) {
            return res.status(400).json({ error: 'Email or Phone is required' });
        }
        // التأكد من قوة كلمة المرور
        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // التحقق من عدم وجود حساب مسبق بنفس البيانات
        let existingUser;
        if (email) {
            existingUser = await db.getAsync('SELECT id FROM users WHERE email = $1', [email]);
        } else if (phone) {
            existingUser = await db.getAsync('SELECT id FROM users WHERE phone = $2', [phone]);
        }

        // إذا وجد حساب مسبق، نرسل خطأ
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // إنشاء معرف فريد جديد للمستخدم
        const userId = uuidv4();
        // تشفير كلمة المرور قبل حفظها
        const hashedPassword = await bcrypt.hash(password, 12);

        // إدخال بيانات المستخدم الجديد في قاعدة البيانات
        await db.runAsync(
            'INSERT INTO users (id, email, phone, password, full_name, role, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [userId, email || null, phone || null, hashedPassword, full_name, 'user', 1]
        );

        // إرسال رد بنجاح العملية
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        // طباعة أي خطأ برمي في السيرفر
        console.error('Register error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 6. مسار إرسال كود التحقق للتسجيل (Registration OTP)
router.post('/send-register-code', async (req, res) => {
    try {
        // استخراج البيانات المطلوبة
        const { email, phone } = req.body;
        if (!email && !phone) return res.status(400).json({ error: 'Email or phone required' });

        // التحقق من عدم وجود الحساب قبل البدء
        let existingUser;
        if (email) existingUser = await db.getAsync('SELECT id FROM users WHERE email = $1', [email]);
        else if (phone) existingUser = await db.getAsync('SELECT id FROM users WHERE phone = $1', [phone]);

        if (existingUser) return res.status(400).json({ error: 'User already exists' });

        // توليد كود عشوائي من 6 أرقام
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // محاكاة الإرسال عبر الطباعة في Terminal السيرفر بقالب جمالي
        const methodLabel = email ? 'EMAIL' : 'SMS';
        const targetValue = email || phone;
        
        console.log("\x1b[36m%s\x1b[0m", `
╔════════════════════════════════════════════════════════════╗
║          [REGISTRATION OTP SIMULATION] - ${methodLabel}          ║
╠════════════════════════════════════════════════════════════╣
║ TO: ${targetValue.padEnd(54)} ║
║ CODE: ${resetCode.padEnd(52)} ║
║ MESSAGE: Your verification code is ${resetCode}.          ║
║          It will expire in 10 minutes.                     ║
╚════════════════════════════════════════════════════════════╝
        `);

        // ملاحظة: لأغراض التطوير المحلي، يتم إرسال الكود في الرد للسماح بتجربة البرنامج بدون إرسال حقيقي
        res.json({ success: true, code: resetCode });
    } catch (err) {
        // معالجة الخطأ
        console.error('Send register code error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update User Profile
router.put('/update', require('../middleware/auth').authenticateToken, async (req, res) => {
    try {
        const { full_name, phone, avatar_url } = req.body;
        await db.runAsync(
            'UPDATE users SET full_name = $1, phone = $2, avatar_url = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
            [full_name, phone, avatar_url, req.user.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get User Profile
router.get('/me', require('../middleware/auth').authenticateToken, async (req, res) => {
    try {
        const user = await db.getAsync(
            'SELECT id, email, full_name, avatar_url, phone, role, is_active, university_id, college_id, department_id FROM users WHERE id = $1',
            [req.user.id]
        );
        if (!user) return res.status(404).json({ error: 'User not found' });

        const permissions = await getEffectivePermissions(user.id, user.role);
        res.json({ ...user, permissions });
    } catch (err) {
        console.error('Get me error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update Password
router.post('/update-password', require('../middleware/auth').authenticateToken, async (req, res) => {
    try {
        const { new_password } = req.body;
        if (!new_password || new_password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        const hashedPassword = await bcrypt.hash(new_password, 12);
        await db.runAsync(
            'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [hashedPassword, req.user.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Update password error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all users (Admin only, filtered by scope)
router.get('/users', require('../middleware/auth').authenticateToken, require('../middleware/auth').checkPermission('manage_users'), async (req, res) => {
    try {
        let sql = 'SELECT id, email, full_name, avatar_url, phone, role, is_active, created_at FROM users';
        let params = [];

        if (req.user.role !== 'super_admin') {
            sql += ' WHERE (university_id = $1 AND $2 IS NOT NULL) OR (college_id = $3 AND $4 IS NOT NULL) OR (department_id = $5 AND $6 IS NOT NULL) OR (created_by = $7)';
            params.push(
                req.user.university_id, req.user.university_id,
                req.user.college_id, req.user.college_id,
                req.user.department_id, req.user.department_id,
                req.user.id
            );
        }

        sql += ' ORDER BY created_at DESC';
        const users = await db.query(sql, params);
        res.json(users);
    } catch (err) {
        console.error('Get users error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user (Admin only, scope-check)
router.put('/users/:id', require('../middleware/auth').authenticateToken, require('../middleware/auth').checkPermission('manage_users'), async (req, res) => {
    try {
        const { full_name, role, is_active, phone } = req.body;
        const target = await db.getAsync(
            'SELECT role, university_id, college_id, department_id FROM users WHERE id = $1',
            [req.params.id]
        );

        if (!target) return res.status(404).json({ error: 'User not found' });

        if (req.user.role !== 'super_admin') {
            const hasAccess = (target.university_id === req.user.university_id && req.user.university_id) ||
                (target.college_id === req.user.college_id && req.user.college_id) ||
                (target.department_id === req.user.department_id && req.user.department_id);
            if (!hasAccess) return res.status(403).json({ error: 'Access denied: Out of scope' });
        }

        await db.runAsync(
            'UPDATE users SET full_name = $1, role = $2, is_active = $3, phone = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5',
            [full_name, role, is_active ? 1 : 0, phone, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Update user error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create user (Admin only, scope-check)
router.post('/users', require('../middleware/auth').authenticateToken, require('../middleware/auth').checkPermission('manage_users'), async (req, res) => {
    try {
        const { email, password, full_name, role, phone, university_id, college_id, department_id } = req.body;

        if (req.user.role !== 'super_admin') {
            if (university_id !== req.user.university_id && college_id !== req.user.college_id && department_id !== req.user.department_id) {
                return res.status(403).json({ error: 'Access denied: Cannot create user outside your scope' });
            }
        }
        const { v4: uuidv4 } = require('uuid');

        const existingUser = await db.getAsync('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser) return res.status(400).json({ error: 'User already exists' });

        const userId = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 12);

        await db.runAsync(
            'INSERT INTO users (id, email, password, full_name, role, phone, university_id, college_id, department_id, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1)',
            [userId, email, hashedPassword, full_name, role || 'user', phone, university_id, college_id, department_id]
        );

        res.status(201).json({ id: userId, message: 'User created successfully' });
    } catch (err) {
        console.error('Create user error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete user (Admin only, scope-check)
router.delete('/users/:id', require('../middleware/auth').authenticateToken, require('../middleware/auth').checkPermission('manage_users'), async (req, res) => {
    try {
        const target = await db.getAsync(
            'SELECT id, university_id, college_id, department_id FROM users WHERE id = $1',
            [req.params.id]
        );
        if (!target) return res.status(404).json({ error: 'User not found' });

        if (req.user.role !== 'super_admin') {
            const hasAccess = (target.university_id === req.user.university_id && req.user.university_id) ||
                (target.college_id === req.user.college_id && req.user.college_id) ||
                (target.department_id === req.user.department_id && req.user.department_id);
            if (!hasAccess) return res.status(403).json({ error: 'Access denied: Out of scope' });
        }

        await db.runAsync('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Change password
router.put('/change-password/:userId', require('../middleware/auth').authenticateToken, async (req, res) => {
    try {
        const { newPassword, oldPassword } = req.body;
        const targetId = req.params.userId;
        const isSelf = req.user.id === targetId;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const target = await db.getAsync(
            'SELECT id, password, university_id, college_id, department_id, role, created_by FROM users WHERE id = $1',
            [targetId]
        );
        if (!target) return res.status(404).json({ error: 'User not found' });

        if (!isSelf) {
            if (req.user.role !== 'super_admin') {
                const isAdminOfTarget = target.created_by === req.user.id ||
                    (req.user.role === 'university_admin' && target.university_id === req.user.university_id) ||
                    (req.user.role === 'college_admin' && target.college_id === req.user.college_id);

                if (!isAdminOfTarget) {
                    return res.status(403).json({ error: 'Access denied: Cannot change password for this user' });
                }
            }
        } else {
            if (!oldPassword) return res.status(400).json({ error: 'Old password required' });
            const valid = await bcrypt.compare(oldPassword, target.password);
            if (!valid) return res.status(400).json({ error: 'Incorrect old password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await db.runAsync(
            'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [hashedPassword, targetId]
        );

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 7. مسار استعادة كلمة المرور (Forgot Password)
router.post('/forgot-password', async (req, res) => {
    try {
        // استخراج معرف الحساب (إيميل أو هاتف)
        const { identifier } = req.body;
        if (!identifier) return res.status(400).json({ error: 'Identifier is required' });

        // البحث عن المستخدم في قاعدة البيانات
        const user = await db.getAsync(
            'SELECT id, email, phone FROM users WHERE email = $1 OR phone = $2',
            [identifier, identifier]
        );

        // لأسباب أمنية: لا نخبر المخترقين إذا كان الحساب موجوداً أم لا
        if (!user) {
            return res.json({ success: true, message: 'If the account exists, a reset code has been sent.' });
        }

        // توليد كود التحقق الآمن (6 أرقام)
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        // الكود صالح لمدة 15 دقيقة فقط
        const resetExpires = new Date(Date.now() + 15 * 60 * 1000);

        // حفظ كود التحقق ووقت انتهائه في سجل المستخدم
        await db.runAsync(
            'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
            [resetCode, resetExpires.toISOString(), user.id]
        );

        // محاكاة إرسال الرسالة بقالب جمالي في سجلات السيرفر
        const methodLabel = user.email ? 'EMAIL' : 'SMS';
        const targetValue = user.email || user.phone;
        
        console.log("\x1b[33m%s\x1b[0m", `
╔════════════════════════════════════════════════════════════╗
║        [FORGOT PASSWORD OTP SIMULATION] - ${methodLabel}       ║
╠════════════════════════════════════════════════════════════╣
║ TO: ${targetValue.padEnd(54)} ║
║ CODE: ${resetCode.padEnd(52)} ║
║ EXPIRES: ${resetExpires.toISOString().padEnd(49)} ║
║ MESSAGE: Use code ${resetCode} to reset your password.     ║
╚════════════════════════════════════════════════════════════╝
        `);

        // الرد على الواجهة الأمامية بالنجاح مع تحديد طريقة الإرسال والمعرف
        res.json({
            success: true,
            message: 'Verification code sent',
            context_id: user.id,
            method: methodLabel.toLowerCase()
        });
    } catch (err) {
        // معالجة الخطأ العام
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify Recovery Code
router.post('/verify-code', async (req, res) => {
    try {
        const { context_id, code } = req.body;
        if (!context_id || !code) return res.status(400).json({ error: 'context_id and code are required' });

        const user = await db.getAsync(
            'SELECT id, reset_token, reset_token_expires FROM users WHERE id = $1',
            [context_id]
        );

        if (!user || !user.reset_token) {
            return res.status(400).json({ error: 'Invalid or expired verification code' });
        }

        if (new Date() > new Date(user.reset_token_expires)) {
            return res.status(400).json({ error: 'Verification code has expired' });
        }

        if (user.reset_token !== code) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        res.json({ success: true, message: 'Code verified' });
    } catch (err) {
        console.error('Verify code error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { context_id, code, new_password } = req.body;
        if (!context_id || !code || !new_password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (new_password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const user = await db.getAsync(
            'SELECT id, reset_token, reset_token_expires FROM users WHERE id = $1',
            [context_id]
        );

        if (!user || !user.reset_token) {
            return res.status(400).json({ error: 'Invalid or expired reset code' });
        }

        if (new Date() > new Date(user.reset_token_expires)) {
            return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
        }

        if (user.reset_token !== code) {
            return res.status(400).json({ error: 'Invalid reset code' });
        }

        const hashedPassword = await bcrypt.hash(new_password, 12);

        // حذف الكود بعد الاستخدام + تحديث كلمة المرور
        await db.runAsync(
            'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [hashedPassword, context_id]
        );

        res.json({ success: true, message: 'Password reset successful' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
