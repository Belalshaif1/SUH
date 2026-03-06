import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import apiClient from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Info, Mail, Globe, Code } from 'lucide-react';

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
        <div className="container mx-auto px-4 py-12 animate-fade-in max-w-4xl">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-foreground mb-4 flex items-center justify-center gap-3">
                    <Info className="h-10 w-10 text-gold" />
                    {language === 'ar' ? 'من نحن' : 'About Us'}
                </h1>
                <p className="text-muted-foreground text-lg">
                    {language === 'ar' ? 'تعرف على الدليل الجامعي الذكي وفريق التطوير' : 'Learn more about Smart University Guide and the development team'}
                </p>
            </div>

            <div className="grid gap-8">
                {/* Project Section */}
                <Card className="border-gold/20 shadow-lg">
                    <CardHeader className="bg-gold/5 border-b border-gold/10">
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-gold" />
                            {language === 'ar' ? 'عن المشروع' : 'About the Project'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="prose dark:prose-invert max-w-none">
                            {content ? (
                                <p className="whitespace-pre-wrap text-foreground/80 leading-relaxed">{content}</p>
                            ) : (
                                <p className="text-muted-foreground italic">
                                    {language === 'ar' ? 'لا يوجد محتوى متاح حالياً.' : 'No content available at the moment.'}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Developer Section */}
                <Card className="border-gold/20 shadow-lg overflow-hidden">
                    <div className="md:flex">
                        <div className="md:w-1/3 bg-gold/10 flex flex-col items-center justify-center p-8 text-center border-e border-gold/10">
                            <div className="w-32 h-32 rounded-full bg-gold/20 flex items-center justify-center mb-4 shadow-inner border-2 border-gold/30">
                                {data?.developer_image_url ? (
                                    <img src={data.developer_image_url} alt={devName} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <User className="h-16 w-16 text-gold" />
                                )}
                            </div>
                            <h2 className="text-xl font-bold text-foreground mb-1">{devName || (language === 'ar' ? 'م. بلال شائف' : 'Eng. Belal Shaif')}</h2>
                            <p className="text-gold font-medium mb-4">{language === 'ar' ? 'مطور برمجيات' : 'Software Developer'}</p>
                            <div className="flex gap-4">
                                <a href="#" className="h-8 w-8 rounded-full bg-foreground/5 flex items-center justify-center hover:bg-gold/20 transition-colors">
                                    <Mail className="h-4 w-4 text-gold" />
                                </a>
                                <a href="#" className="h-8 w-8 rounded-full bg-foreground/5 flex items-center justify-center hover:bg-gold/20 transition-colors">
                                    <Code className="h-4 w-4 text-gold" />
                                </a>
                            </div>
                        </div>
                        <div className="md:w-2/3 p-8">
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <User className="h-5 w-5 text-gold" />
                                {language === 'ar' ? 'نبذة عن المطور' : 'About the Developer'}
                            </h3>
                            <p className="text-foreground/70 leading-relaxed mb-6">
                                {devBio || (language === 'ar'
                                    ? 'مطور برمجيات متخصص في بناء تطبيقات الويب المتقدمة والحلول الذكية. يسعى دائماً لتقديم تجربة مستخدم استثنائية وبناء أنظمة برمجية عالية الجودة.'
                                    : 'A software developer specializing in building advanced web applications and smart solutions. Always striving to provide an exceptional user experience and build high-quality software systems.')}
                            </p>

                            <footer className="mt-8 pt-6 border-t border-border flex flex-wrap justify-between items-center gap-4 text-sm text-muted-foreground">
                                <div>
                                    {language === 'ar'
                                        ? 'تطوير م. بلال شائف © ' + new Date().getFullYear()
                                        : '© ' + new Date().getFullYear() + ' Developed by Eng. Belal Shaif'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
                                    {language === 'ar' ? 'جاهز للتعاون' : 'Available for collaboration'}
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
