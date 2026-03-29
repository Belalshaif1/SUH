/**
 * @file src/components/dashboard/tabs/ServicesTab.tsx
 * @description Renders the Services management section of the Admin Dashboard.
 *              Shows service title, description, icon, and status.
 */

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button }      from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Plus, Edit, Trash2, LayoutGrid, Globe, ExternalLink, ShieldCheck, ShieldAlert
} from 'lucide-react';
import { Service } from '@/types/dashboard';
import { getMediaUrl } from '@/lib/apiClient';

interface ServicesTabProps {
    services: Service[];
    onAdd: () => void;
    onEdit: (item: Service) => void;
    onDelete: (id: string, title: string) => void;
    processData: (data: any[]) => any[];
    canAdd?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
}

export const ServicesTab: React.FC<ServicesTabProps> = ({
    services, onAdd, onEdit, onDelete, processData,
    canAdd = false, canEdit = false, canDelete = false
}) => {
    const { t, language } = useLanguage();
    const isAr = language === 'ar';

    const processedList = processData(services);

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-2xl font-black text-primary mb-1">
                        {isAr ? 'إدارة الخدمات' : 'Manage Services'}
                    </h2>
                    <p className="text-sm text-primary/40 font-bold">
                        {isAr
                            ? 'عرض وتعديل الخدمات المقدمة للطلاب والموظفين'
                            : 'View and manage services provided to students and staff'
                        }
                    </p>
                </div>

                {canAdd && (
                    <Button
                        onClick={onAdd}
                        className="h-12 px-6 rounded-xl bg-gold text-white font-bold shadow-xl shadow-gold/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="h-5 w-5 me-2" />
                        {t('common.add')}
                    </Button>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {processedList.map((s: Service) => (
                    <Card
                        key={s.id}
                        className="card-premium group hover:shadow-xl transition-all duration-300 border-none shadow-md overflow-hidden relative"
                    >
                        {/* Status Bar */}
                        <div className={`h-1 w-full ${s.is_active ? 'bg-green-500' : 'bg-red-500'}`} />

                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0 group-hover:bg-gold/10 transition-colors">
                                    {s.icon ? (
                                        <img
                                            src={getMediaUrl(s.icon)}
                                            alt={s.title_ar}
                                            className="h-10 w-10 object-contain"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '';
                                                (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-primary/20"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-grid h-8 w-8"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg></div>';
                                            }}
                                        />
                                    ) : (
                                        <LayoutGrid className="h-8 w-8 text-primary/20" />
                                    )}
                                </div>

                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {canEdit && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(s)}
                                            className="h-8 w-8 rounded-lg text-primary/40 hover:text-primary hover:bg-primary/5"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    )}
                                    {canDelete && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDelete(
                                                s.id,
                                                isAr ? s.title_ar : (s.title_en || s.title_ar)
                                            )}
                                            className="h-8 w-8 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-black text-primary text-xl leading-tight">
                                    {isAr ? s.title_ar : (s.title_en || s.title_ar)}
                                </h3>
                                <p className="text-sm text-primary/40 font-bold line-clamp-2 min-h-[2.5rem]">
                                    {isAr ? s.description_ar : (s.description_en || s.description_ar)}
                                </p>
                            </div>

                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-primary/5">
                                <div className="flex items-center gap-2">
                                    {s.is_active ? (
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-wider">
                                            <ShieldCheck className="h-3 w-3" />
                                            {isAr ? 'مفعل' : 'Active'}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wider">
                                            <ShieldAlert className="h-3 w-3" />
                                            {isAr ? 'معطل' : 'Disabled'}
                                        </div>
                                    )}
                                </div>

                                {s.link && (
                                    <a
                                        href={s.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gold hover:text-gold/80 transition-colors p-1"
                                        title={isAr ? 'فتح الرابط' : 'Open Link'}
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {processedList.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center bg-primary/5 rounded-[2rem] border-2 border-dashed border-primary/10">
                        <LayoutGrid className="h-16 w-16 text-primary/10 mb-6" />
                        <p className="text-primary/40 font-black text-xl">
                            {isAr ? 'لا توجد خدمات مضافة حالياً' : 'No services added yet'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
