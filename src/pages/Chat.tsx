import React, { useEffect, useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Chat: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!user) return;
    try {
      const data = await apiClient(`/messages/${user.id}`);
      setMessages(data || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchMessages();

    // Polling as a simple replacement for Supabase Realtime
    const interval = setInterval(fetchMessages, 5000);

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    try {
      const data = await apiClient('/messages', {
        method: 'POST',
        body: JSON.stringify({ sender_id: user.id, content: newMessage.trim() }),
      });
      setMessages(prev => [...prev, data]);
      setNewMessage('');
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center animate-fade-in">
        <MessageCircle className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="mb-4 text-xl font-bold text-foreground">{t('chat.login_required')}</h2>
        <Link to="/login"><Button>{t('nav.login')}</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] pb-10 pt-6 px-4 animate-fade-in relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 gradient-academic opacity-[0.03] z-0" />

      <div className="container mx-auto flex flex-col flex-1 relative z-10 h-[calc(100vh-10rem)]">
        <div className="flex items-center gap-6 mb-8 pb-6 border-b border-primary/10">
          <div className="p-4 bg-white shadow-xl rounded-[1.5rem] border border-slate-50 relative group">
            <div className="absolute inset-0 gradient-academic opacity-0 group-hover:opacity-10 transition-opacity rounded-[1.5rem]" />
            <MessageCircle className="h-10 w-10 text-primary relative z-10" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-primary tracking-tight">
              {t('chat.title')}
            </h1>
            <p className="text-muted-foreground mt-2 font-bold opacity-80">
              {language === 'ar' ? 'تواصل مع الإدارة والمسؤولين مباشرة' : 'Communicate directly with administration and officials'}
            </p>
          </div>
        </div>

        <Card className="card-premium flex-1 flex flex-col overflow-hidden bg-white/60 backdrop-blur-2xl border border-white/50 shadow-2xl shadow-primary/5 rounded-[2.5rem]">
          <CardContent className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scroll-smooth bg-gradient-to-b from-primary/[0.02] to-transparent">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-primary/40">
                <div className="p-10 bg-white/50 rounded-full shadow-inner mb-6">
                  <MessageCircle className="h-24 w-24 opacity-20 animate-pulse text-primary" />
                </div>
                <p className="text-xl font-black opacity-40">
                  {language === 'ar' ? 'ابدأ المحادثة الآن' : 'Start the conversation now'}
                </p>
                <p className="text-sm font-bold mt-2 opacity-30">
                  {language === 'ar' ? 'لا توجد رسائل سابقة' : 'No previous messages'}
                </p>
              </div>
            ) : (
              messages.map((m, index) => {
                const isMine = m.sender_id === user.id;
                const showAvatar = index === 0 || messages[index - 1].sender_id !== m.sender_id;

                return (
                  <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} items-end gap-3 animate-in slide-in-from-bottom-4 duration-500`}>
                    {!isMine && (
                      <div className={`w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-white shadow-sm mb-6 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                        {m.sender?.full_name?.charAt(0) || 'U'}
                      </div>
                    )}

                    <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                      <div className={`relative px-6 py-4 rounded-[2rem] shadow-sm transition-all hover:shadow-md
                        ${isMine
                          ? 'bg-primary text-white rounded-br-none shadow-primary/20'
                          : 'bg-white text-primary rounded-bl-none border border-border/50 shadow-slate-200'
                        }`}
                      >
                        <p className="text-[16px] leading-relaxed font-bold">{m.content}</p>
                      </div>

                      <div className="flex items-center gap-2 mt-2 px-3">
                        {!isMine && showAvatar && (
                          <span className="text-[10px] font-black text-primary/40 uppercase tracking-tighter">
                            {m.sender?.full_name || (language === 'ar' ? 'مستخدم' : 'User')}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-primary/30">
                          {new Date(m.created_at).toLocaleTimeString(language === 'ar' ? 'ar-IQ' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {isMine && (
                      <div className={`w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-[10px] font-black text-gold border border-white shadow-sm mb-6 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                        {user.email?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={bottomRef} className="h-4" />
          </CardContent>

          <div className="p-6 md:p-8 bg-white/80 backdrop-blur-xl border-t border-primary/5">
            <div className="max-w-4xl mx-auto relative group">
              <Input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder={t('chat.placeholder')}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                className="h-16 rounded-[2rem] bg-slate-50 border-2 border-transparent shadow-inner font-bold text-primary pe-20 ps-8 focus-visible:ring-0 focus-visible:border-primary/20 transition-all placeholder:text-primary/20"
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="absolute end-2 top-2 h-12 w-12 rounded-[1.5rem] bg-primary text-white hover:bg-gold hover:text-white transition-all duration-300 shadow-xl disabled:opacity-20 active:scale-90"
              >
                <Send className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
