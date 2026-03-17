/**
 * @file backupScheduler.js
 * @description نظام النسخ الاحتياطي التلقائي باستخدام node-cron.
 * يعمل يومياً في الساعة 2:00 صباحاً، ويقوم باستخراج جميع جداول قاعدة البيانات إلى JSON، وضغطها في ملف ZIP، وتسجيل العملية في جدول backup_logs.
 */

const cron = require('node-cron'); // استيراد مكتبة node-cron لجدولة المهام
const path = require('path'); // استيراد وحدة path للتعامل مع مسارات الملفات
const fs = require('fs'); // استيراد وحدة fs للتعامل مع نظام الملفات
const archiver = require('archiver'); // استيراد مكتبة archiver لضغط الملفات بصيغة ZIP
const { v4: uuidv4 } = require('uuid'); // استيراد وظيفة uuidv4 لإنشاء معرفات فريدة
const db = require('./db'); // استيراد وحدة قاعدة البيانات لإجراء الاستعلامات

// التأكد من وجود مجلد النسخ الاحتياطية (backups)
const BACKUP_DIR = path.join(__dirname, 'backups'); // تحديد مسار مجلد النسخ الاحتياطية
if (!fs.existsSync(BACKUP_DIR)) { // التحقق مما إذا كان المجلد غير موجود
    fs.mkdirSync(BACKUP_DIR, { recursive: true }); // إنشاء المجلد بشكل متكرر إذا لزم الأمر
}

// قائمة الجداول المراد تضمينها في النسخ الاحتياطي
const TABLES = [
    'users', 'universities', 'colleges', 'departments',
    'announcements', 'graduates', 'research', 'jobs',
    'job_applications', 'fees', 'about_us',
    'role_permissions', 'user_permissions', 'services'
];

/**
 * إنشاء نسخة احتياطية كاملة لقاعدة البيانات.
 * @param {string} triggeredBy - من قام ببدء النسخ الاحتياطي ('scheduler' أو 'manual')
 * @returns {Promise<{filename: string, path: string, size: number}>}
 */
async function createBackup(triggeredBy = 'scheduler') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19); // توليد طابع زمني لتسمية الملف
    const jsonFilename = `backup-${timestamp}.json`; // اسم ملف JSON المؤقت
    const zipFilename = `backup-${timestamp}.zip`; // اسم ملف ZIP النهائي
    const jsonPath = path.join(BACKUP_DIR, jsonFilename); // المسار الكامل لملف JSON
    const zipPath = path.join(BACKUP_DIR, zipFilename); // المسار الكامل لملف ZIP

    console.log(`🔄 البدء في عملية النسخ الاحتياطي [${triggeredBy}]...`);

    try {
        // 1. استخراج جميع الجداول إلى كائن JSON
        const backupData = {
            metadata: { // بيانات وصفية عن النسخة الاحتياطية
                created_at: new Date().toISOString(), // وقت الإنشاء
                triggered_by: triggeredBy, // الجهة التي بدأت العملية
                version: '1.0', // إصدار نظام النسخ
                tables: TABLES // قائمة الجداول المضمنة
            },
            data: {} // الكائن الذي سيحتوي على بيانات الجداول
        };

        for (const table of TABLES) { // التكرار عبر كل جدول في القائمة
            try {
                const rows = await db.query(`SELECT * FROM ${table}`); // جلب كافة البيانات من الجدول الحالي
                backupData.data[table] = rows; // إضافة البيانات إلى كائن النسخة الاحتياطية
            } catch (e) {
                console.warn(`⚠️ تعذر نسخ الجدول "${table}": ${e.message}`); // تحذير في حال فشل نسخ جدول معين
                backupData.data[table] = []; // تعيين مصفوفة فارغة لهذا الجدول
            }
        }

        // كتابة بيانات النسخة الاحتياطية في ملف JSON مؤقت
        fs.writeFileSync(jsonPath, JSON.stringify(backupData, null, 2));

        // 2. ضغط ملف JSON إلى ملف ZIP
        await new Promise((resolve, reject) => {
            const output = fs.createWriteStream(zipPath); // إنشاء تيار كتابة لملف ZIP
            const archive = archiver('zip', { zlib: { level: 9 } }); // إعداد الأرشفة بأقصى مستوى ضغط

            output.on('close', resolve); // حل الوعد عند اكتمال الكتابة وإغلاق الملف
            archive.on('error', reject); // رفض الوعد في حال حدوث خطأ أثناء الضغط

            archive.pipe(output); // توجيه الأرشفة إلى تيار الكتابة
            archive.file(jsonPath, { name: jsonFilename }); // إضافة ملف JSON إلى الأرشيف
            archive.finalize(); // إنهاء عملية الأرشفة
        });

        // 3. تنظيف الملفات المؤقتة (حذف ملف JSON غير المضغوط)
        fs.unlinkSync(jsonPath);

        const stats = fs.statSync(zipPath); // الحصول على معلومات الملف المضغوط
        const sizeBytes = stats.size; // حجم الملف بالبايت

        // 4. تسجيل العملية في قاعدة البيانات
        await db.runAsync(
            `INSERT INTO backup_logs (id, filename, size_bytes, status, triggered_by) VALUES ($1, $2, $3, $4, $5)`,
            [uuidv4(), zipFilename, sizeBytes, 'success', triggeredBy]
        );

        // 5. الاحتفاظ بآخر 10 نسخ احتياطية فقط لتوفير المساحة
        await cleanOldBackups();

        console.log(`✅ اكتمل النسخ الاحتياطي: ${zipFilename} (${(sizeBytes / 1024).toFixed(1)} KB)`);
        return { filename: zipFilename, path: zipPath, size: sizeBytes };

    } catch (err) {
        console.error('❌ فشل النسخ الاحتياطي:', err.message);

        // تسجيل الفشل في قاعدة البيانات
        try {
            await db.runAsync(
                `INSERT INTO backup_logs (id, filename, size_bytes, status, triggered_by) VALUES ($1, $2, $3, $4, $5)`,
                [uuidv4(), zipFilename, 0, 'failed', triggeredBy]
            );
        } catch (logErr) {
            console.error('تعذر تسجيل فشل النسخ الاحتياطي:', logErr.message);
        }

        throw err; // إعادة إرسال الخطأ لمعالجته في المستويات الأعلى
    }
}

/**
 * حذف النسخ الاحتياطية القديمة — يحتفظ فقط بآخر 10 نسخ حديثة.
 */
async function cleanOldBackups() {
    try {
        const files = fs.readdirSync(BACKUP_DIR) // قراءة كافة الملفات في مجلد النسخ الاحتياطية
            .filter(f => f.endsWith('.zip')) // تصفية ملفات ZIP فقط
            .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() })) // الحصول على وقت التعديل لكل ملف
            .sort((a, b) => b.time - a.time); // ترتيب الملفات من الأحدث إلى الأقدم

        // تحديد الملفات الزائدة عن الـ 10 الأحدث لحذفها
        const toDelete = files.slice(10);
        for (const file of toDelete) {
            fs.unlinkSync(path.join(BACKUP_DIR, file.name)); // حذف الملف القديم
            console.log(`🗑️ تم حذف نسخة احتياطية قديمة: ${file.name}`);
        }
    } catch (e) {
        console.warn('تعذر تنظيف النسخ الاحتياطية القديمة:', e.message);
    }
}

/**
 * تهيئة مجدول المهام (Cron).
 * يعمل يومياً في الساعة 2:00 صباحاً بتوقيت الخادم.
 */
function initBackupScheduler() {
    // الجدول الزمني: كل يوم في تمام الساعة 02:00 صباحاً
    cron.schedule('0 2 * * *', async () => {
        console.log('⏰ تشغيل النسخ الاحتياطي المجدول...');
        try {
            await createBackup('scheduler'); // تنفيذ النسخ الاحتياطي التلقائي
        } catch (err) {
            console.error('فشل النسخ الاحتياطي المجدول:', err.message);
        }
    });

    console.log('📅 تم تفعيل مجدول النسخ الاحتياطي (يومياً الساعة 02:00 صباحاً)');
}

module.exports = { createBackup, initBackupScheduler, BACKUP_DIR }; // تصدير الوظائف لاستخدامها في ملفات أخرى
