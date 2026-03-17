import React from 'react'; // استيراد مكتبة React الأساسية
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'; // استيراد مكونات الحوار (Dialog) من مجلد الـ UI
import { Button } from '@/components/ui/button'; // استيراد مكون الزر المخصص
import { Download, X } from 'lucide-react'; // استيراد أيقونات التحميل والإغلاق

interface PDFViewerProps {
    url: string; // رابط ملف الـ PDF
    title: string; // عنوان الملف الذي سيظهر في رأس التنبيه
    isOpen: boolean; // حالة فتح أو إغلاق نافذة العرض
    onClose: () => void; // دالة لإغلاق النافذة
    language?: string; // اللغة المستخدمة للواجهة (اختياري، الافتراضي عربي)
}

// مكون عرض ملفات الـ PDF (PDFViewer)
const PDFViewer: React.FC<PDFViewerProps> = ({ url, title, isOpen, onClose, language = 'ar' }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}> {/* استخدام الحوار لعرض المحتوى */}
            <DialogContent className="max-w-4xl w-[90vw] h-[90vh] flex flex-col p-0 overflow-hidden"> {/* تنسيق حاوية المحتوى لتشمل معظم الشاشة */}
                <DialogHeader className="p-4 border-b flex flex-row items-center justify-between"> {/* رأس الحوار مع الحدود السفلية */}
                    <DialogTitle className="line-clamp-1">{title}</DialogTitle> {/* عنوان الملف مع ميزة القص عند الطول الزائد */}
                    <div className="flex gap-2 pe-8"> {/* حاوية لأزرار التحكم */}
                        <Button variant="outline" size="sm" onClick={() => window.open(url, '_blank')}> {/* زر فتح في نافذة جديدة أو تحميل */}
                            <Download className="h-4 w-4 me-1" /> {language === 'ar' ? 'تحميل' : 'Download'}
                        </Button>
                    </div>
                </DialogHeader>
                <div className="flex-1 w-full bg-muted overflow-hidden"> {/* المنطقة الرئيسية لعرض الملف */}
                    <iframe
                        src={`${url}#toolbar=0`} // استخدام iframe لعرض الـ PDF مع إخفاء شريط الأدوات الافتراضي للمتصفح
                        className="w-full h-full border-none"
                        title={title}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PDFViewer; // تصدير المكون
