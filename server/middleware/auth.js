const jwt = require('jsonwebtoken'); // استيراد مكتبة jsonwebtoken للتعامل مع رموز التشفير

// 1. برمجية وسيطة (Middleware) للتحقق من التوكن (JWT) للمستخدم
const authenticateToken = (req, res, next) => {
    // جلب الترويسة 'authorization' من الطلب القادم
    const authHeader = req.headers['authorization'];
    // استخراج التوكن من الترويسة (يكون بصيغة: Bearer TOKEN)
    const token = authHeader && authHeader.split(' ')[1];

    // إذا لم يتوفر التوكن، يتم إرسال حالة 401 (غير مصرح له)
    if (token == null) return res.sendStatus(401);

    // التحقق من صحة التوكن باستخدام المفتاح السري الخاص بالنظام
    jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey', (err, user) => {
        // إذا كان التوكن منتهي الصلاحية أو غير صحيح، يتم إرسال حالة 403 (ممنوع)
        if (err) return res.sendStatus(403);
        
        // إذا كان التوكن صحيحاً، يتم تخزين بيانات المستخدم في كائن الطلب (req.user) لاستخدامه لاحقاً
        req.user = user;
        // الانتقال للبرمجية التالية أو المسار المطلوب
        next();
    });
};

// 2. برمجية وسيطة للتحقق مما إذا كان المستخدم مديراً (بأي مستوى)
const isAdmin = (req, res, next) => {
    // التحقق من أن المستخدم مسجل دخول ومن أنه يحمل أحد الأدوار الإدارية الأربعة
    if (!req.user || !['super_admin', 'university_admin', 'college_admin', 'department_admin'].includes(req.user.role)) {
        // إذا لم يكن مديراً، يتم رفض الطلب مع رسالة توضيحية
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    // إذا كان مديراً، يتم السماح له بالمرور للخطوة التالية
    next();
};

// 3. برمجية وسيطة متطورة للتحقق من صلاحية محددة (مثل: إضافة جامعة، تعديل مستخدم)
const checkPermission = (permissionKey) => {
    return async (req, res, next) => {
        // التأكد أولاً من أن المستخدم معرف ومسجل دخول
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        // المدير العام (super_admin) يتخطى جميع الفحوصات ويملك كافة الصلاحيات تلقائياً
        if (req.user.role === 'super_admin') return next();

        const db = require('../db'); // استيراد وحدة قاعدة البيانات للتحقق من الصلاحيات المسجلة
        try {
            // المرحلة الأولى: التحقق من "استثناءات المستخدم" (User Overrides)
            // وهي صلاحيات تعطى أو تسحب من مستخدم معين بغض النظر عن دوره
            const override = await db.getAsync(
                'SELECT is_enabled FROM user_permissions WHERE user_id = $1 AND permission_key = $2',
                [req.user.id, permissionKey]
            );

            // إذا وجد استثناء لهذا المستخدم لهذه الصلاحية تحديداً
            if (override) {
                // إذا كان مفعلاً بالسماح (1)، يمر الطلب
                if (override.is_enabled === 1) return next();
                // إذا كان معطلاً، يرفض الطلب فوراً
                return res.status(403).json({ error: `Permission denied: ${permissionKey}` });
            }

            // المرحلة الثانية: التحقق من الصلاحيات الافتراضية "للدور" (Role Permissions)
            // وهي الصلاحيات المخصصة لكل مرتبة إدارية في النظام
            const rolePerm = await db.getAsync(
                'SELECT is_enabled FROM role_permissions WHERE role = $1 AND permission_key = $2',
                [req.user.role, permissionKey]
            );

            // إذا كان الدور يملك هذه الصلاحية وهي مفعلة (1)، يتم السماح بالطلب
            if (rolePerm && rolePerm.is_enabled === 1) return next();

            // إذا لم يملك المستخدم الصلاحية في أي من المراحل، يتم رفض الوصول
            res.status(403).json({ error: `Permission denied: ${permissionKey}` });
        } catch (err) {
            // في حال حدوث خطأ تقني في قاعدة البيانات، يتم إرسال حالة خطأ داخلي
            res.status(500).json({ error: 'Internal server error' });
        }
    };
};

// تصدير البرمجيات الوسيطة لاستخدامها في ملفات المسارات (Routes)
module.exports = { authenticateToken, isAdmin, checkPermission };
