'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    Users,
    Mail,
    MessageSquare,
    Search,
    Send,
    UserCheck,
    Filter,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Contact {
    id: string;
    name: string;
    email: string;
    phone: string;
    customer_name: string;
    customer_id: string;
    role: string;
    department: string;
    is_primary: boolean;
    company?: {
        id: string;
        name: string;
        type: 'individual' | 'company';
        industry?: string;
        size?: string;
        status?: string;
    };
}

export default function CustomerClubPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCustomer, setFilterCustomer] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [message, setMessage] = useState({
        subject: '',
        content: '',
        type: 'email' // 'email' or 'sms'
    });
    const { toast } = useToast();

    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        try {
            const response = await fetch('/api/contacts');
            if (response.ok) {
                const data = await response.json();
                setContacts(data.data || []);
            }
        } catch (error) {
            console.error('Error loading contacts:', error);
            // Sample data for development
            setContacts([
                {
                    id: 'cont-001',
                    name: 'احمد محمدی',
                    email: 'ahmad@company.com',
                    phone: '09123456789',
                    customer_name: 'شرکت فناوری پیشرو',
                    customer_id: 'cust-001',
                    role: 'مدیر فنی',
                    department: 'فناوری',
                    is_primary: true,
                },
                {
                    id: 'cont-002',
                    name: 'مریم احمدی',
                    email: 'maryam@company.com',
                    phone: '09123456790',
                    customer_name: 'شرکت تجاری آسیا',
                    customer_id: 'cust-002',
                    role: 'مدیر فروش',
                    department: 'فروش',
                    is_primary: true,
                },
                {
                    id: 'cont-003',
                    name: 'علی رضایی',
                    email: 'ali@company.com',
                    phone: '09123456791',
                    customer_name: 'گروه صنعتی پارس',
                    customer_id: 'cust-003',
                    role: 'کارشناس خرید',
                    department: 'خرید',
                    is_primary: false,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectContact = (contactId: string) => {
        setSelectedContacts(prev =>
            prev.includes(contactId)
                ? prev.filter(id => id !== contactId)
                : [...prev, contactId]
        );
    };

    const handleSelectAll = () => {
        const filteredContactIds = filteredContacts.map(c => c.id);
        if (selectedContacts.length === filteredContactIds.length) {
            setSelectedContacts([]);
        } else {
            setSelectedContacts(filteredContactIds);
        }
    };

    const handleSendMessage = async () => {
        if (selectedContacts.length === 0) {
            toast({
                title: 'خطا',
                description: 'لطفاً حداقل یک مخاطب انتخاب کنید',
                variant: 'destructive',
            });
            return;
        }

        if (!message.content.trim()) {
            toast({
                title: 'خطا',
                description: 'لطفاً متن پیام را وارد کنید',
                variant: 'destructive',
            });
            return;
        }

        if (message.type === 'email' && !message.subject.trim()) {
            toast({
                title: 'خطا',
                description: 'لطفاً موضوع ایمیل را وارد کنید',
                variant: 'destructive',
            });
            return;
        }

        try {
            setSending(true);
            const response = await fetch('/api/customer-club/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contactIds: selectedContacts,
                    message: message,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: 'موفقیت',
                    description: `پیام با موفقیت برای ${selectedContacts.length} مخاطب ارسال شد`,
                });
                setMessage({ subject: '', content: '', type: 'email' });
                setSelectedContacts([]);
            } else {
                toast({
                    title: 'خطا',
                    description: data.message || 'خطا در ارسال پیام',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'خطا',
                description: 'خطا در ارسال پیام',
                variant: 'destructive',
            });
        } finally {
            setSending(false);
        }
    };

    const filteredContacts = contacts.filter(contact => {
        const matchesSearch = (contact.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (contact.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (contact.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCustomer = filterCustomer === 'all' || contact.customer_id === filterCustomer;
        const matchesType = filterType === 'all' || contact.company?.type === filterType;

        return matchesSearch && matchesCustomer && matchesType;
    });

    const uniqueCustomers = Array.from(new Set(contacts.map(c => c.customer_id).filter(Boolean)))
        .map(id => contacts.find(c => c.customer_id === id))
        .filter(Boolean);

    if (loading) {
        return <div className="p-6">در حال بارگذاری...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">باشگاه مشتریان</h1>
                    <p className="text-muted-foreground">ارسال پیام گروهی به مخاطبین</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline">
                        <Users className="h-4 w-4 ml-1" />
                        {contacts.length} مخاطب
                    </Badge>
                    <Badge variant="secondary">
                        <UserCheck className="h-4 w-4 ml-1" />
                        {selectedContacts.length} انتخاب شده
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Contacts List */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                لیست مخاطبین
                            </CardTitle>

                            {/* Filters */}
                            <div className="flex gap-4 items-center">
                                <div className="relative flex-1">
                                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        placeholder="جستجو در مخاطبین..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pr-10"
                                    />
                                </div>
                                <Select value={filterCustomer} onValueChange={setFilterCustomer}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue placeholder="فیلتر مشتری" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">همه مشتریان</SelectItem>
                                        {uniqueCustomers.map((customer, index) => {
                                            const customerId = customer?.customer_id || `customer-${index}`;
                                            const customerName = customer?.customer_name || 'نامشخص';
                                            return customerId && customerId !== '' ? (
                                                <SelectItem key={customerId} value={customerId}>
                                                    {customerName}
                                                </SelectItem>
                                            ) : null;
                                        })}
                                    </SelectContent>
                                </Select>
                                <Select value={filterType} onValueChange={setFilterType}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue placeholder="نوع" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">همه</SelectItem>
                                        <SelectItem value="individual">اشخاص</SelectItem>
                                        <SelectItem value="company">شرکت‌ها</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSelectAll}
                                >
                                    {selectedContacts.length === filteredContacts.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {filteredContacts.map((contact) => (
                                    <div
                                        key={contact.id}
                                        className={`flex items-center space-x-3 space-x-reverse p-3 rounded-lg border transition-colors ${selectedContacts.includes(contact.id)
                                            ? 'bg-primary/10 border-primary/50'
                                            : 'hover:bg-muted/50'
                                            }`}
                                    >
                                        <Checkbox
                                            checked={selectedContacts.includes(contact.id)}
                                            onCheckedChange={() => handleSelectContact(contact.id)}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{contact.name}</p>
                                                {contact.is_primary && (
                                                    <Badge variant="secondary" className="text-xs">اصلی</Badge>
                                                )}
                                                {contact.company?.type === 'individual' && (
                                                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">شخص</Badge>
                                                )}
                                                {contact.company?.type === 'company' && (
                                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">شرکت</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{contact.customer_name}</p>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Mail className="h-3 w-3" />
                                                    {contact.email}
                                                </span>
                                                <span>{contact.phone}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {filteredContacts.length === 0 && (
                                <div className="text-center py-8">
                                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">مخاطبی یافت نشد</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Message Composer */}
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                ارسال پیام
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Message Type */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">نوع پیام</label>
                                <Select value={message.type} onValueChange={(value) => setMessage({ ...message, type: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="email">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4" />
                                                ایمیل
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="sms" disabled>
                                            <div className="flex items-center gap-2">
                                                <MessageSquare className="h-4 w-4" />
                                                پیامک (به زودی)
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Subject (for email) */}
                            {message.type === 'email' && (
                                <div>
                                    <label className="text-sm font-medium mb-2 block">موضوع</label>
                                    <Input
                                        placeholder="موضوع ایمیل را وارد کنید"
                                        value={message.subject}
                                        onChange={(e) => setMessage({ ...message, subject: e.target.value })}
                                    />
                                </div>
                            )}

                            {/* Message Content */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">متن پیام</label>
                                <Textarea
                                    placeholder="متن پیام خود را وارد کنید..."
                                    value={message.content}
                                    onChange={(e) => setMessage({ ...message, content: e.target.value })}
                                    rows={6}
                                />
                            </div>

                            {/* Send Button */}
                            <Button
                                onClick={handleSendMessage}
                                disabled={sending || selectedContacts.length === 0}
                                className="w-full"
                            >
                                {sending ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                                        در حال ارسال...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 ml-2" />
                                        ارسال پیام ({selectedContacts.length} مخاطب)
                                    </>
                                )}
                            </Button>

                            {/* Info */}
                            <div className="text-xs text-muted-foreground space-y-1">
                                <div className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                    <span>ایمیل: فعال</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3 text-yellow-500" />
                                    <span>پیامک: به زودی راه‌اندازی می‌شود</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}