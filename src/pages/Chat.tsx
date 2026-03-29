/**
 * @file pages/Chat.tsx
 * @description Full-featured chat page with ChatGPT-style layout.
 * Fully responsive: Mobile, Tablet, and Desktop (all sizes).
 * 
 * Layout:
 * - Mobile (< 768px): Full screen chat, bottom input bar, slide-up contacts panel
 * - Tablet (768px - 1024px): Split view with collapsible sidebar
 * - Desktop (> 1024px): Fixed two-column layout (sidebar + chat)
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Send, MessageCircle, Search, Menu, X,
    ArrowLeft, MoreVertical, Circle, Edit, Trash2, Check, Copy
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
    id:         string;
    sender_id:  string;
    content:    string;
    created_at: string;
    is_read?:   number;
    is_edited?: number; // Flag for edited messages
    sender?:    { full_name?: string; email?: string };
}

interface Contact {
    id: string;
    full_name?: string;
    email?: string;
    role?: string;
    lastMessage?: string;
    lastTime?: string;
    unread?: number;
}

// ─── Helper: format a date/time string ────────────────────────────────────────
const fmtTime = (d: string, lang: string) =>
    new Date(d).toLocaleTimeString(lang === 'ar' ? 'ar-IQ' : 'en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true,
    });

const fmtDate = (d: string, lang: string) => {
    const date = new Date(d);
    const today = new Date();
    const diff = today.getDate() - date.getDate();
    if (diff === 0) return lang === 'ar' ? 'اليوم' : 'Today';
    if (diff === 1) return lang === 'ar' ? 'أمس' : 'Yesterday';
    return date.toLocaleDateString(lang === 'ar' ? 'ar-IQ' : 'en-US', { month: 'short', day: 'numeric' });
};

// ─── Sidebar Contact Item ──────────────────────────────────────────────────────
const ContactItem: React.FC<{
    contact: Contact;
    isActive: boolean;
    onClick: () => void;
    language: string;
}> = ({ contact, isActive, onClick, language }) => {
    const initials = contact.full_name
        ? contact.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : contact.email?.[0]?.toUpperCase() ?? '?';

    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-left group',
                isActive
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted/60 text-foreground'
            )}
        >
            {/* Avatar */}
            <div className={cn(
                'h-11 w-11 rounded-full flex items-center justify-center text-sm font-black shrink-0 relative',
                isActive ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
            )}>
                {initials}
                {/* Online dot */}
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 border-2 border-background" />
            </div>

            {/* Name + last message */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <span className="font-bold text-sm truncate">
                        {contact.full_name || contact.email || (language === 'ar' ? 'مستخدم' : 'User')}
                    </span>
                    {contact.lastTime && (
                        <span className="text-[10px] text-muted-foreground shrink-0 ms-2">
                            {contact.lastTime}
                        </span>
                    )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {contact.lastMessage || (language === 'ar' ? 'ابدأ المحادثة...' : 'Start chatting...')}
                </p>
            </div>

            {/* Unread badge */}
            {contact.unread && contact.unread > 0 ? (
                <span className="h-5 min-w-[20px] px-1 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center shrink-0">
                    {contact.unread}
                </span>
            ) : null}
        </button>
    );
};

// ─── Message Bubble ────────────────────────────────────────────────────────────
const MessageBubble: React.FC<{
    msg: Message;
    isMine: boolean;
    showMeta: boolean;
    language: string;
    onEdit: (m: Message) => void;
    onDelete: (id: string) => void;
    onCopy: (text: string) => void;
}> = ({ msg, isMine, showMeta, language, onEdit, onDelete, onCopy }) => {
    const isAr = language === 'ar';
    const initials = msg.sender?.full_name
        ? msg.sender.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : msg.sender?.email?.[0]?.toUpperCase() ?? '?';

    return (
        <div className={cn(
            'flex items-end gap-2 group',
            isMine ? 'flex-row-reverse' : 'flex-row'
        )}>
            {/* Avatar */}
            <div className={cn(
                'h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mb-1 transition-opacity',
                isMine ? 'bg-primary/20 text-primary' : 'bg-emerald-100 text-emerald-700',
                showMeta ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}>
                {isMine ? '👤' : initials}
            </div>

            {/* Bubble + Meta */}
            <div className={cn(
                'flex flex-col gap-1 max-w-[75%] sm:max-w-[65%] lg:max-w-[55%] relative group/bubble',
                isMine ? 'items-end' : 'items-start'
            )}>
                {showMeta && !isMine && (
                    <span className="text-[11px] font-bold text-muted-foreground px-2">
                        {msg.sender?.full_name || msg.sender?.email || (isAr ? 'مستخدم' : 'User')}
                    </span>
                )}

                <div className="relative group/actions">
                    <div className={cn(
                        'px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm',
                        isMine
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-card text-card-foreground border border-border/60 rounded-bl-md'
                    )}>
                        {msg.content}
                    </div>

                    {/* Message Actions (Edit/Delete) - only for own messages */}
                    {isMine && (
                        <div className={cn(
                            "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/actions:opacity-100 max-lg:opacity-100 transition-opacity flex items-center gap-1",
                            isAr ? "-left-14" : "-right-14"
                        )}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={isAr ? 'start' : 'end'} className="rounded-xl border-none shadow-xl">
                                    <DropdownMenuItem onClick={() => onCopy(msg.content)} className="gap-2 focus:bg-primary/10">
                                        <Copy className="h-4 w-4 text-primary" />
                                        <span>{isAr ? 'نسخ' : 'Copy'}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onEdit(msg)} className="gap-2 focus:bg-primary/10">
                                        <Edit className="h-4 w-4 text-primary" />
                                        <span>{isAr ? 'تعديل' : 'Edit'}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDelete(msg.id)} className="gap-2 focus:bg-destructive/10 text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                        <span>{isAr ? 'حذف' : 'Delete'}</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}

                    {/* Copy action for other people's messages */}
                    {!isMine && (
                        <div className={cn(
                            "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/actions:opacity-100 lg:group-hover/actions:opacity-100 transition-opacity flex items-center gap-1",
                            isAr ? "-right-14" : "-left-14"
                        )}>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-full hover:bg-muted"
                                onClick={() => onCopy(msg.content)}
                                title={isAr ? 'نسخ' : 'Copy'}
                            >
                                <Copy className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 px-2">
                    <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        {fmtTime(msg.created_at, language)}
                    </span>
                    {msg.is_edited ? (
                        <span className="text-[10px] text-muted-foreground italic">
                            ({isAr ? 'معدلة' : 'edited'})
                        </span>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

// ─── Date Separator ───────────────────────────────────────────────────────────
const DateSeparator: React.FC<{ date: string; language: string }> = ({ date, language }) => (
    <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-border/50" />
        <span className="text-[11px] font-bold text-muted-foreground px-3 py-1 rounded-full bg-muted/50 whitespace-nowrap">
            {fmtDate(date, language)}
        </span>
        <div className="flex-1 h-px bg-border/50" />
    </div>
);

// ─── Main Chat Component ───────────────────────────────────────────────────────
const Chat: React.FC = () => {
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const { toast } = useToast();
    const isAr = language === 'ar';

    const [messages, setMessages] = useState<Message[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [activeContact, setActiveContact] = useState<Contact | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [sending, setSending] = useState(false);

    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = '44px';
            const scrollHeight = textAreaRef.current.scrollHeight;
            textAreaRef.current.style.height = Math.min(scrollHeight, 144) + 'px';
        }
    }, []);

    useEffect(() => {
        adjustHeight();
    }, [newMessage, adjustHeight]);

    // Fetch messages
    const fetchMessages = useCallback(async () => {
        if (!user) return;
        try {
            const data = await apiClient(`/messages/${user.id}`);
            setMessages(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    }, [user]);

    // Mock contacts from messages (group by sender)
    const buildContacts = useCallback((msgs: Message[]) => {
        const map = new Map<string, Contact>();
        msgs.forEach(m => {
            const otherId = m.sender_id === user?.id ? 'broadcast' : m.sender_id;
            const otherName = m.sender?.full_name || m.sender?.email || (isAr ? 'المجموعة العامة' : 'General');
            if (!map.has(otherId)) {
                map.set(otherId, {
                    id: otherId,
                    full_name: otherName,
                    email: m.sender?.email,
                    lastMessage: m.content,
                    lastTime: fmtTime(m.created_at, language),
                    unread: (!m.is_read && m.sender_id !== user?.id) ? 1 : 0,
                });
            } else {
                const c = map.get(otherId)!;
                c.lastMessage = m.content;
                c.lastTime = fmtTime(m.created_at, language);
            }
        });

        // Always add a "General / Broadcast" conversation
        if (!map.has('general')) {
            map.set('general', {
                id: 'general',
                full_name: isAr ? 'المجموعة العامة' : 'General Chat',
                lastMessage: isAr ? 'مرحباً بالجميع' : 'Welcome everyone',
                lastTime: '',
                unread: 0,
            });
        }

        return Array.from(map.values());
    }, [user, isAr, language]);

    useEffect(() => {
        if (!user) return;
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [user, fetchMessages]);

    useEffect(() => {
        setContacts(buildContacts(messages));
    }, [messages, buildContacts]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!newMessage.trim() || !user || sending) return;
        setSending(true);
        try {
            if (editingMessage) {
                // UPDATE (Edit)
                await apiClient(`/messages/${editingMessage.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ content: newMessage.trim() }),
                });
                setMessages(prev => prev.map(m => 
                    m.id === editingMessage.id 
                        ? { ...m, content: newMessage.trim(), is_edited: 1 } 
                        : m
                ));
                setEditingMessage(null);
            } else {
                // CREATE (New)
                const data = await apiClient('/messages', {
                    method: 'POST',
                    body: JSON.stringify({ sender_id: user.id, content: newMessage.trim() }),
                });
                setMessages(prev => [...prev, data]);
            }
            setNewMessage('');
            textAreaRef.current?.focus();
        } catch (err) {
            console.error('Error handling message:', err);
        } finally {
            setSending(false);
        }
    };

    const deleteMessage = async (id: string) => {
        if (!confirm(isAr ? 'هل أنت متأكد من حذف هذه الرسالة؟' : 'Are you sure you want to delete this message?')) return;
        try {
            await apiClient(`/messages/${id}`, { method: 'DELETE' });
            setMessages(prev => prev.filter(m => m.id !== id));
            toast({ title: isAr ? 'تم حذف الرسالة' : 'Message deleted' });
        } catch (err: any) {
            console.error('Error deleting message:', err);
            toast({ title: err.message, variant: 'destructive' });
        }
    };

    const copyMessage = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: isAr ? 'تم نسخ النص' : 'Copied to clipboard' });
    };

    const filteredContacts = contacts.filter(c =>
        (c.full_name || c.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group messages by date
    const groupedMessages = messages.reduce((acc: { date: string; msgs: Message[] }[], msg) => {
        const d = new Date(msg.created_at).toDateString();
        const last = acc[acc.length - 1];
        if (last && last.date === d) {
            last.msgs.push(msg);
        } else {
            acc.push({ date: d, msgs: [msg] });
        }
        return acc;
    }, []);

    // ─── Not logged in ────────────────────────────────────────────────────────
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4 p-8">
                    <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                        <MessageCircle className="h-12 w-12 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black text-foreground">{t('chat.login_required')}</h2>
                    <p className="text-muted-foreground">{isAr ? 'يجب تسجيل الدخول للوصول إلى المحادثات' : 'Login required to access chat'}</p>
                    <Link to="/login">
                        <Button size="lg" className="rounded-full px-8">{t('nav.login')}</Button>
                    </Link>
                </div>
            </div>
        );
    }

    // ─── Chat Header (mobile/tablet only) ─────────────────────────────────────
    const ChatHeader = () => (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-md shrink-0">
            {/* Mobile: back / sidebar toggle */}
            <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors"
            >
                {activeContact ? <ArrowLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {activeContact ? (
                <>
                    <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-black text-emerald-700 shrink-0">
                        {activeContact.full_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{activeContact.full_name}</p>
                        <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                            <Circle className="h-2 w-2 fill-current" />
                            {isAr ? 'متصل الآن' : 'Online'}
                        </p>
                    </div>
                </>
            ) : (
                <div className="flex-1">
                    <h1 className="font-black text-lg text-primary flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        {t('chat.title')}
                    </h1>
                </div>
            )}
            <button className="p-2 rounded-xl hover:bg-muted transition-colors">
                <MoreVertical className="h-5 w-5 text-muted-foreground" />
            </button>
        </div>
    );

    // ─── Sidebar ──────────────────────────────────────────────────────────────
    const Sidebar = ({ className = '' }: { className?: string }) => (
        <div className={cn(
            'flex flex-col bg-background border-e border-border/50 h-full',
            className
        )}>
            {/* Sidebar Header */}
            <div className="px-4 pt-4 pb-3 border-b border-border/30 shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-black text-lg text-foreground flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
                            <MessageCircle className="h-4 w-4 text-primary-foreground" />
                        </div>
                        {isAr ? 'المحادثات' : 'Messages'}
                    </h2>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className={cn(
                        'absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground',
                        isAr ? 'right-3' : 'left-3'
                    )} />
                    <Input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder={isAr ? 'ابحث في المحادثات...' : 'Search conversations...'}
                        className={cn(
                            'h-10 rounded-xl bg-muted/50 border-0 text-sm',
                            isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
                        )}
                    />
                </div>
            </div>

            {/* Contacts list */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
                {filteredContacts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">{isAr ? 'لا توجد محادثات' : 'No conversations'}</p>
                    </div>
                ) : (
                    filteredContacts.map(contact => (
                        <ContactItem
                            key={contact.id}
                            contact={contact}
                            isActive={activeContact?.id === contact.id}
                            language={language}
                            onClick={() => {
                                setActiveContact(contact);
                                setSidebarOpen(false);
                            }}
                        />
                    ))
                )}
            </div>

            {/* User profile at bottom */}
            <div className="px-4 py-3 border-t border-border/30 flex items-center gap-3 shrink-0">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-black text-primary">
                    {user.email?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{user.email}</p>
                    <p className="text-xs text-green-500 font-medium">{isAr ? 'متصل' : 'Online'}</p>
                </div>
            </div>
        </div>
    );

    // ─── Message Area ─────────────────────────────────────────────────────────
    const MessageArea = () => (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scroll-smooth">
            {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none">
                    <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
                        <MessageCircle className="h-12 w-12 text-muted-foreground opacity-40" />
                    </div>
                    <p className="font-black text-xl text-foreground/50">
                        {isAr ? 'لا توجد رسائل بعد' : 'No messages yet'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                        {isAr ? 'ابدأ محادثة جديدة الآن' : 'Start a new conversation below'}
                    </p>
                </div>
            ) : (
                groupedMessages.map(group => (
                    <div key={group.date}>
                        <DateSeparator date={group.msgs[0].created_at} language={language} />
                        <div className="space-y-1.5">
                            {group.msgs.map((msg, idx) => {
                                const prev = group.msgs[idx - 1];
                                const showMeta = !prev || prev.sender_id !== msg.sender_id;
                                return (
                                    <MessageBubble
                                        key={msg.id}
                                        msg={msg}
                                        isMine={msg.sender_id === user.id}
                                        showMeta={showMeta}
                                        language={language}
                                        onEdit={(m) => {
                                            setEditingMessage(m);
                                            setNewMessage(m.content);
                                            textAreaRef.current?.focus();
                                        }}
                                        onDelete={deleteMessage}
                                        onCopy={copyMessage}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))
            )}
            <div ref={bottomRef} className="h-2" />
        </div>
    );

    // ─── Input Bar ────────────────────────────────────────────────────────────
    const renderInputBar = () => (
        <div className="px-4 py-3 border-t border-border/50 bg-background/80 backdrop-blur-md shrink-0">
            {editingMessage && (
                <div className="max-w-4xl mx-auto mb-2 flex items-center justify-between bg-primary/5 px-4 py-2 rounded-xl text-xs border border-primary/10">
                    <div className="flex items-center gap-2 text-primary font-bold">
                        <Edit className="h-3.5 w-3.5" />
                        {isAr ? 'تعديل الرسالة' : 'Editing Message'}
                    </div>
                    <button 
                        onClick={() => { setEditingMessage(null); setNewMessage(''); }}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}
            <div className="flex items-end gap-2 max-w-4xl mx-auto">
                <div className="flex-1 relative">
                    <textarea
                        ref={textAreaRef}
                        value={newMessage}
                        rows={1}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                        placeholder={t('chat.placeholder') || (isAr ? 'اكتب رسالة... (Enter للإرسال، Shift+Enter سطر جديد)' : 'Type a message...')}
                        className={cn(
                            'w-full resize-none rounded-2xl bg-muted/60 border border-border/50',
                            'px-4 py-2.5 text-sm leading-relaxed',
                            'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30',
                            'transition-shadow duration-200 overflow-y-auto'
                        )}
                        style={{ minHeight: '44px' }}
                    />
                </div>
                <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    size="icon"
                    className="h-11 w-11 rounded-2xl shrink-0 bg-primary hover:bg-primary/90 disabled:opacity-30 transition-all active:scale-90 shadow-lg shadow-primary/20"
                >
                    <Send className={cn('h-4 w-4', isAr && 'scale-x-[-1]')} />
                </Button>
            </div>
            <p className="text-center text-[10px] text-muted-foreground mt-1.5 hidden sm:block">
                {isAr ? 'Enter للإرسال • Shift+Enter لسطر جديد' : 'Enter to send • Shift+Enter for new line'}
            </p>
        </div>
    );

    // ─── Main Render ──────────────────────────────────────────────────────────
    return (
        <div className="h-[100dvh] flex flex-col overflow-hidden bg-background" dir={isAr ? 'rtl' : 'ltr'}>

            {/* ── Mobile overlay when sidebar is open ─── */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── Main layout ───────────────────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── SIDEBAR: sticky on desktop, slide-over on mobile/tablet ── */}
                {/* Mobile/Tablet: fixed position slide-over */}
                <div className={cn(
                    'fixed inset-y-0 z-50 w-[320px] transition-transform duration-300 ease-out lg:hidden',
                    isAr ? 'right-0' : 'left-0',
                    sidebarOpen
                        ? 'translate-x-0'
                        : isAr ? 'translate-x-full' : '-translate-x-full'
                )}>
                    {Sidebar({})}
                </div>

                {/* Desktop: fixed sidebar */}
                <div className="hidden lg:flex w-[300px] xl:w-[340px] shrink-0 border-e border-border/50">
                    {Sidebar({ className: "flex-1" })}
                </div>

                {/* ── CHAT AREA ─────────────────────────────────────────────── */}
                <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                    {/* Header */}
                    {ChatHeader()}

                    {/* Messages */}
                    {MessageArea()}

                    {/* Input */}
                    {renderInputBar()}
                </div>
            </div>
        </div>
    );
};

export default Chat;
