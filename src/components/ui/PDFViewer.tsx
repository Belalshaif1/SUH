import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface PDFViewerProps {
    url: string;
    title: string;
    isOpen: boolean;
    onClose: () => void;
    language?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ url, title, isOpen, onClose, language = 'ar' }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-[90vw] h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
                    <DialogTitle className="line-clamp-1">{title}</DialogTitle>
                    <div className="flex gap-2 pe-8">
                        <Button variant="outline" size="sm" onClick={() => window.open(url, '_blank')}>
                            <Download className="h-4 w-4 me-1" /> {language === 'ar' ? 'تحميل' : 'Download'}
                        </Button>
                    </div>
                </DialogHeader>
                <div className="flex-1 w-full bg-muted overflow-hidden">
                    <iframe
                        src={`${url}#toolbar=0`}
                        className="w-full h-full border-none"
                        title={title}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PDFViewer;
