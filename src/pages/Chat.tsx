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
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fade-in flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-4 mb-6 pb-4 border-b">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <MessageCircle className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            {t('chat.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {language === 'ar' ? 'تواصل مع الإدارة والمسؤولين مباشرة' : 'Communicate directly with administration and officials'}
          </p>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden bg-card/60 backdrop-blur-xl border-border/40 shadow-xl rounded-3xl">
        <CardContent className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth bg-gradient-to-b from-background/50 to-transparent">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
              <MessageCircle className="h-16 w-16 mb-4 opacity-50" />
              <p>{language === 'ar' ? 'لا توجد رسائل حتى الآن، كن أول من يرسل!' : 'No messages yet, be the first to send one!'}</p>
            </div>
          ) : (
            messages.map(m => {
              const isMine = m.sender_id === user.id;
              return (
                <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                  <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>

                    {!isMine && (
                      <span className="text-xs font-semibold text-muted-foreground mb-1 ms-2">
                        {m.sender?.full_name || (language === 'ar' ? 'مستخدم' : 'User')}
                      </span>
                    )}

                    <div className={`relative px-5 py-3 rounded-3xl shadow-sm
                      ${isMine
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted/80 backdrop-blur-sm text-foreground rounded-bl-sm border border-border/50'
                      }`}
                    >
                      <p className="text-[15px] leading-relaxed break-words">{m.content}</p>
                    </div>

                    <span className="text-[11px] text-muted-foreground/70 mt-1 mx-2">
                      {new Date(m.created_at).toLocaleTimeString(language === 'ar' ? 'ar-IQ' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} className="h-1" />
        </CardContent>

        <div className="p-4 bg-card/80 backdrop-blur-md border-t border-border/50">
          <div className="flex items-center gap-3 max-w-4xl mx-auto relative">
            <Input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder={t('chat.placeholder')}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              className="flex-1 rounded-full bg-background border-border shadow-sm h-12 pe-14 md:text-base focus-visible:ring-1 focus-visible:ring-primary/50"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              size="icon"
              className="absolute end-1.5 h-9 w-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Chat;
