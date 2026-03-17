// 1. استيراد المكتبات والملفات اللازمة
const express = require('express'); // إطار عمل السيرفر
const router = express.Router(); // موديول تنظيم المسارات
const bcrypt = require('bcryptjs'); // مكتبة تشفير كلمات المرور
const { v4: uuidv4 } = require('uuid'); // أداة توليد معرفات فريدة (ID)
const db = require('../db'); // الربط مع قاعدة البيانات
const { authenticateToken, isAdmin } = require('../middleware/auth'); //middlewares للتحقق من التوكن وصلاحية الإدمن

// 2. دالة مساعدة للتحقق من صلاحية المدير في إدارة أدوار أخرى (مبدأ التسلسل الهرمي)
const canManageRole = (managerRole, targetRole) => {
    // مدير الموقع (super_admin) يمكنه إدارة الجميع
    if (managerRole === 'super_admin') return true;
    // مدير الجامعة يمكنه إدارة مدراء الكليات والأقسام فقط
    if (managerRole === 'university_admin' && (targetRole === 'college_admin' || targetRole === 'department_admin')) return true;
    // مدير الكلية يمكنه إدارة مدراء الأقسام فقط
    if (managerRole === 'college_admin' && targetRole === 'department_admin') return true;
    // غير ذلك، لا يملك الصلاحية
    return false;
};

// 3. مسار جلب قائمة المدراء (Get Admins)
// يتم فلترة القائمة بناءً على رتبة ونطاق المدير الحالي
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        let sql;
        let params = [];

        // جلب بيانات المدير الحالي من قاعدة البيانات للتأكد من رتبته ونطاقه
        const currentUser = await db.getAsync('SELECT * FROM users WHERE id = $1', [req.user.id]);

        if (currentUser.role === 'super_admin') {
            // مدير الموقع يرى كل المدراء المضافين في النظام (باستثناء نفسه والمستخدمين العاديين)
            sql = "SELECT id, email, full_name, role, university_id, college_id, department_id, is_active, created_at, created_by FROM users WHERE role != 'user' AND id != $1 ORDER BY created_at DESC";
            params = [currentUser.id];
        } else if (currentUser.role === 'university_admin') {
            // مدير الجامعة يرى فقط مدراء الكليات والأقسام التابعين لجامعته
            sql = "SELECT id, email, full_name, role, university_id, college_id, department_id, is_active, created_at, created_by FROM users WHERE role IN ('college_admin', 'department_admin') AND university_id = $1 ORDER BY created_at DESC";
            params = [currentUser.university_id];
        } else if (currentUser.role === 'college_admin') {
            // مدير الكلية يرى فقط مدراء الأقسام التابعين لكليته
            sql = "SELECT id, email, full_name, role, university_id, college_id, department_id, is_active, created_at, created_by FROM users WHERE role = 'department_admin' AND college_id = $1 ORDER BY created_at DESC";
            params = [currentUser.college_id];
        } else {
            // مدراء الأقسام لا يملكون صلاحية رؤية قائمة مدراء آخرين عادةً
            sql = "SELECT id, email, full_name, role, university_id, college_id, department_id, is_active, created_at, created_by FROM users WHERE 1=0";
            params = [];
        }

        // تنفيذ الاستعلام وإرسال النتائج
        const admins = await db.query(sql, params);
        res.json(admins);
    } catch (err) {
        // معالجة الأخطاء وطباعتها
        console.error('Get admins error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 4. مسار إضافة مدير جديد (Create Admin)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        // استلام بيانات المدير الجديد
        const { email, password, full_name, role, university_id, college_id, department_id } = req.body;

        // التحقق مما إذا كان المدير الحالي يملك صلاحية إنشاء هذا الدور المحدد
        if (!canManageRole(req.user.role, role)) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        // التأكد من عدم وجود إيميل مكرر
        const existing = await db.getAsync('SELECT id FROM users WHERE email = $1', [email]);
        if (existing) return res.status(400).json({ error: 'Email already exists' });

        // توليد معرف وتشفير كلمة المرور
        const id = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 12);

        // إدراج المستخدم الجديد في قاعدة البيانات مع ربطه بالنطاق الإداري الصحيح
        await db.runAsync(
            'INSERT INTO users (id, email, password, full_name, role, university_id, college_id, department_id, created_by, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1)',
            [id, email, hashedPassword, full_name, role, university_id || null, college_id || null, department_id || null, req.user.id]
        );

        res.status(201).json({ success: true, id });
    } catch (err) {
        console.error('Create admin error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 5. مسار تحديث بيانات مدير (Update Admin)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        // استخراج البيانات الجديدة من الطلب والمعرف من الرابط
        const { full_name, email, role, university_id, college_id, department_id } = req.body;
        // التأكد من وجود المدير المستهدف ومعرفة رتبته الحالية
        const target = await db.getAsync('SELECT role FROM users WHERE id = $1', [req.params.id]);

        if (!target) return res.status(404).json({ error: 'Admin not found' });
        // التحقق من صلاحية المدير لعملية التعديل على هذا المستخدم
        if (!canManageRole(req.user.role, target.role)) {
            return res.status(403).json({ error: 'Permission denied to manage this admin' });
        }

        // تحديث البيانات في قاعدة البيانات
        await db.runAsync(
            'UPDATE users SET full_name = $1, email = $2, role = $3, university_id = $4, college_id = $5, department_id = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7',
            [full_name, email, role, university_id || null, college_id || null, department_id || null, req.params.id]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Update admin error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 6. مسار تفعيل/تعطيل حساب مدير (Toggle Active Status)
router.patch('/:id/toggle', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { is_active } = req.body;
        const target = await db.getAsync('SELECT role FROM users WHERE id = $1', [req.params.id]);

        if (!target) return res.status(404).json({ error: 'Admin not found' });
        if (!canManageRole(req.user.role, target.role)) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        // تحديث حالة النشاط (1 لنشط، 0 لغير نشط)
        await db.runAsync(
            'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [is_active ? 1 : 0, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Toggle admin error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 7. مسار تغيير كلمة المرور لمدير (Change Password)
router.post('/:id/password', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { new_password } = req.body;
        // التحقق من طول كلمة المرور الجديدة
        if (!new_password || new_password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const target = await db.getAsync('SELECT role FROM users WHERE id = $1', [req.params.id]);

        if (!target) return res.status(404).json({ error: 'Admin not found' });
        // يمكن للشخص تغيير كلمة مروره بنفسه، أو للمدير الأعلى تغييرها للمرؤوسين
        if (req.user.id !== req.params.id && !canManageRole(req.user.role, target.role)) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        // تشفير كلمة المرور الجديدة قبل حفظها
        const hashedPassword = await bcrypt.hash(new_password, 12);
        await db.runAsync(
            'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [hashedPassword, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Change admin password error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 8. مسار حذف مدير (Delete Admin)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const target = await db.getAsync('SELECT role FROM users WHERE id = $1', [req.params.id]);

        if (!target) return res.status(404).json({ error: 'Admin not found' });
        // التحقق من صلاحية الحذف
        if (!canManageRole(req.user.role, target.role)) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        // تنفيذ عملية الحذف النهائية
        await db.runAsync('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Delete admin error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
