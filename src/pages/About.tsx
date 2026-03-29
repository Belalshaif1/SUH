import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import apiClient, { getMediaUrl } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Info, Mail, Globe, Code, FileText } from 'lucide-react';

const About: React.FC = () => {
    const { t, language } = useLanguage();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const aboutData = await apiClient('/about');
                setData(aboutData);
            } catch (error) {
                console.error('Error fetching about data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">{t('common.loading')}</div>;
    }

    const content = language === 'ar' ? data?.content_ar : (data?.content_en || data?.content_ar);
    const devName = language === 'ar' ? data?.developer_name_ar : (data?.developer_name_en || data?.developer_name_ar);
    const devBio = language === 'ar' ? data?.developer_bio_ar : (data?.developer_bio_en || data?.developer_bio_ar);

    return (
        <div className="container mx-auto px-4 py-16 animate-fade-in max-w-5xl min-h-[80vh]">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-16 relative p-12 rounded-[3rem] border border-border/50 bg-white/50 backdrop-blur-md overflow-hidden shadow-2xl shadow-primary/5">
                <div className="absolute inset-0 gradient-academic opacity-[0.03] z-0" />

                <div className="flex-1 text-center lg:text-start relative z-10 flex flex-col lg:flex-row items-center gap-10">
                    <div className="shrink-0 h-40 w-40 rounded-[2.5rem] bg-white shadow-2xl p-6 flex items-center justify-center border-4 border-slate-50 group hover:rotate-3 transition-transform duration-500">
                        <Info className="h-16 w-16 text-primary/10 group-hover:text-primary transition-colors" />
                    </div>

                    <div className="flex-1">
                        <Badge variant="outline" className="px-6 py-2 rounded-full border-gold/30 text-gold bg-gold/5 mb-8 font-bold text-sm uppercase tracking-[0.2em] shadow-sm inline-flex">
                            {language === 'ar' ? 'معلومات عنا' : 'About Us'}
                        </Badge>
                        <h1 className="text-4xl md:text-7xl font-bold text-primary mb-6">
                            {language === 'ar' ? 'من نحن' : 'About the Project'}
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
                            {language === 'ar' ? 'تعرف على الدليل الجامعي الذكي وفريق التطوير والمساهمين في نجاح المشروع.'
                                : 'Learn more about the Smart University Guide, the development team, and the contributors to the project\'s success.'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-12">
                {/* Project Section */}
                <Card className="card-premium group relative bg-white border border-border/50 overflow-hidden flex flex-col hover:border-primary/30">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 group-hover:scale-150 transition-transform duration-700 z-0" />

                    <CardHeader className="p-10 pb-0 relative z-10">
                        <CardTitle className="flex items-center gap-4 text-2xl font-bold text-primary">
                            <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-gold shadow-inner group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                                <Globe className="h-6 w-6" />
                            </div>
                            {language === 'ar' ? 'عن المشروع' : 'Project Vision'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-10 relative z-10">
                        <div className="prose dark:prose-invert max-w-none">
                            {content ? (
                                <p className="whitespace-pre-wrap text-muted-foreground text-lg leading-relaxed">{content}</p>
                            ) : (
                                <p className="text-muted-foreground italic text-lg">
                                    {language === 'ar' ? 'لا يوجد محتوى متاح حالياً.' : 'No content available at the moment.'}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Developer Section */}
                <Card className="card-premium group relative bg-white border border-border/50 overflow-hidden flex flex-col hover:border-primary/30">
                    <div className="md:flex h-full">
                        <div className="md:w-2/5 bg-slate-50/50 flex flex-col items-center justify-center p-12 text-center border-e border-border/50 relative overflow-hidden">
                            <div className="absolute inset-0 gradient-academic opacity-[0.02] z-0" />

                            <div className="relative z-10">
                                <div className="w-48 h-48 rounded-[3rem] bg-white p-4 shadow-2xl shadow-primary/10 flex items-center justify-center mb-8 border-4 border-white group-hover:rotate-3 transition-transform duration-500 overflow-hidden">
                                    {data?.developer_image_url ? (
                                        <img src={getMediaUrl(data.developer_image_url)} alt={devName} className="w-full h-full rounded-[2rem] object-cover" />
                                    ) : (
                                        <div className="h-full w-full rounded-[2rem] bg-primary/5 flex items-center justify-center">
                                            <User className="h-20 w-20 text-primary/10" />
                                        </div>
                                    )}
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">
                                    {devName || (language === 'ar' ? 'م. بلال شائف' : 'Eng. Belal Shaif')}
                                </h2>
                                <Badge className="bg-gold/10 text-gold border-gold/20 mb-8 font-bold px-6 py-1.5 rounded-full shadow-sm">
                                    {language === 'ar' ? 'مطور برمجيات' : 'Software Developer'}
                                </Badge>

                                <div className="flex justify-center gap-4">
                                    <a href={`mailto:${data?.developer_email || 'contact@example.com'}`} className="h-14 w-14 rounded-2xl bg-white shadow-xl shadow-primary/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 border border-border/50 group-hover:-translate-y-1">
                                        <Mail className="h-6 w-6" />
                                    </a>
                                    {data?.developer_cv_url && (
                                        <a 
                                            href={data.developer_cv_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="h-14 w-14 rounded-2xl bg-white shadow-xl shadow-primary/5 flex items-center justify-center hover:bg-gold hover:text-white transition-all duration-300 border border-border/50 group-hover:-translate-y-1"
                                            title={language === 'ar' ? 'تحميل السيرة الذاتية' : 'Download CV'}
                                        >
                                            <FileText className="h-6 w-6" />
                                        </a>
                                    )}
                                    <a href="#" className="h-14 w-14 rounded-2xl bg-white shadow-xl shadow-primary/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 border border-border/50 group-hover:-translate-y-1">
                                        <Globe className="h-6 w-6" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="md:w-3/5 p-12 flex flex-col h-full relative z-10">
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-gold/5 flex items-center justify-center text-gold">
                                        <User className="h-5 w-5" />
                                    </div>
                                    {language === 'ar' ? 'نبذة عن المطور' : 'About the Developer'}
                                </h3>
                                <p className="text-muted-foreground text-lg leading-relaxed mb-10">
                                    {devBio || (language === 'ar'
                                        ? 'مطور برمجيات متخصص في بناء تطبيقات الويب المتقدمة والحلول الذكية. يسعى دائماً لتقديم تجربة مستخدم استثنائية وبناء أنظمة برمجية عالية الجودة تخدم التعليم في اليمن.'
                                        : 'A software developer specializing in building advanced web applications and smart solutions. Always striving to provide an exceptional user experience and build high-quality software systems to serve education in Yemen.')}
                                </p>
                            </div>

                            <footer className="mt-auto pt-8 border-t border-border/30 flex flex-wrap justify-between items-center gap-6 text-sm">
                                <div className="font-bold text-primary/60">
                                    {language === 'ar'
                                        ? 'تطوير م. بلال شائف © ' + new Date().getFullYear()
                                        : '© ' + new Date().getFullYear() + ' Developed by Eng. Belal Shaif'}
                                </div>
                                <div className="flex items-center gap-3 bg-primary/5 px-4 py-2 rounded-full border border-primary/10 shadow-sm">
                                    <span className="h-2.5 w-2.5 rounded-full bg-gold animate-pulse shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                                    <span className="font-bold text-primary/80">{language === 'ar' ? 'متاح للتعاون' : 'Open for collaboration'}</span>
                                </div>
                            </footer>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default About;
