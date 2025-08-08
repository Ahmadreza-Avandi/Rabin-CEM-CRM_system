'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import {
  LayoutDashboard,
  Users,
  Contact,
  Ticket,
  MessageCircle,
  TrendingUp,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Building2,
  ChevronLeft,
  Activity,
  Calendar,
  Briefcase,
  Target,
  FileText,
  Brain,
  Package,
  User,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string;
  children?: NavItem[];
}

interface Module {
  id: string;
  name: string;
  display_name: string;
  route: string;
  icon: string;
  sort_order: number;
  parent_id?: string;
}

// نقشه آیکون‌ها
const iconMap: { [key: string]: React.ComponentType<any> } = {
  'Home': LayoutDashboard,
  'LayoutDashboard': LayoutDashboard,
  'Users': Users,
  'Users2': Target,
  'UserCheck': Contact,
  'Activity': Activity,
  'MessageCircle': MessageCircle,
  'MessageCircle2': MessageCircle,
  'DollarSign': TrendingUp,
  'BarChart3': BarChart3,
  'Calendar': Calendar,
  'User': Contact,
  'Settings': Settings,
  'Target': Target,
  'Briefcase': Briefcase,
  'Ticket': Ticket,
  'ChevronRight': ChevronRight,
  'Building2': Building2,
  'TrendingUp': TrendingUp,
  'FileText': FileText,
  'Brain': Brain,
  'Package': Package,
  'Mail': Mail,
};

// نقشه نام‌های نمایشی روت‌ها
const routeDisplayNames: { [key: string]: string } = {
  '/dashboard': 'داشبورد',
  '/dashboard/customers': 'مشتریان',
  '/dashboard/contacts': 'مخاطبین',
  '/dashboard/coworkers': 'همکاران',
  '/dashboard/activities': 'فعالیت‌ها',
  '/dashboard/chat': 'چت',
  '/dashboard/customer-club': 'باشگاه مشتریان',
  '/dashboard/deals': 'معاملات',
  '/dashboard/feedback': 'بازخوردها',
  '/dashboard/reports': 'گزارش‌ها',
  '/dashboard/daily-reports': 'گزارش‌های روزانه',
  '/dashboard/insights/reports-analysis': 'تحلیل گزارشات',
  '/dashboard/calendar': 'تقویم',
  '/dashboard/profile': 'پروفایل',
  '/dashboard/settings': 'تنظیمات',

  '/dashboard/products': 'محصولات',
};

export const ResponsiveSidebar = () => {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Handle mouse enter/leave for desktop
  const handleMouseEnter = () => {
    if (window.innerWidth >= 1024) { // lg breakpoint
      setIsHovered(true);
      setSidebarCollapsed(false);
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth >= 1024) {
      setIsHovered(false);
      setSidebarCollapsed(true);
    }
  };

  useEffect(() => {
    fetchUserPermissions();

    // Listen for refresh events
    const handleRefreshSidebar = () => {
      console.log('🔄 Refreshing sidebar permissions...');
      fetchUserPermissions();
    };

    window.addEventListener('refreshSidebar', handleRefreshSidebar);

    return () => {
      window.removeEventListener('refreshSidebar', handleRefreshSidebar);
    };
  }, []);

  const fetchUserPermissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/permissions');
      const data = await response.json();

      if (data.success) {
        const modules: Module[] = data.data;
        const convertedNavItems = convertModulesToNavItems(modules);
        setNavItems(convertedNavItems);
      } else {
        console.error('Failed to fetch permissions:', data.message);
        // Fallback to default items
        setNavItems([
          {
            title: 'داشبورد',
            href: '/dashboard',
            icon: LayoutDashboard,
          },
          {
            title: 'مدیریت فروش',
            href: '/dashboard/sales',
            icon: TrendingUp,
            children: [
              {
                title: 'معاملات',
                href: '/dashboard/deals',
                icon: TrendingUp,
              }
            ]
          },
          {
            title: 'مدیریت تجربه مشتری',
            href: '/dashboard/cem',
            icon: Users,
            children: [
              {
                title: 'مشتریان',
                href: '/dashboard/customers',
                icon: Users,
              },
              {
                title: 'مخاطبین',
                href: '/dashboard/contacts',
                icon: Contact,
              },
              {
                title: 'بازخوردها',
                href: '/dashboard/feedback',
                icon: MessageCircle,
              }
            ]
          },
          {
            title: 'مدیریت همکاران',
            href: '/dashboard/coworkers',
            icon: Activity,
            children: [
              {
                title: 'همکاران',
                href: '/dashboard/coworkers',
                icon: Users,
              },
              {
                title: 'فعالیت‌ها',
                href: '/dashboard/activities',
                icon: Activity,
              },
              {
                title: 'تقویم',
                href: '/dashboard/calendar',
                icon: Calendar,
              }
            ]
          },
          {
            title: 'چت',
            href: '/dashboard/chat',
            icon: MessageCircle,
          },
          {
            title: 'باشگاه مشتریان و ایمیل',
            href: '/dashboard/customer-club',
            icon: Users,
          },
          {
            title: '🧪 تست ایمیل',
            href: '/test-email',
            icon: Mail,
          },
          {
            title: 'هوش مصنوعی و تحلیل',
            href: '/dashboard/insights',
            icon: BarChart3,
            children: [
              {
                title: 'تحلیل گزارشات',
                href: '/dashboard/insights/reports-analysis',
                icon: BarChart3,
              },
              {
                title: 'تحلیل صوتی',
                href: '/dashboard/insights/audio-analysis',
                icon: Brain,
              }
            ]
          },

          {
            title: 'محصولات',
            href: '/dashboard/products',
            icon: Package,
          },
          {
            title: 'پروفایل',
            href: '/dashboard/profile',
            icon: User,
          }]);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      // Fallback to basic items
      setNavItems([
        {
          title: 'داشبورد',
          href: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          title: 'پروفایل',
          href: '/dashboard/profile',
          icon: Contact,
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const convertModulesToNavItems = (modules: Module[]): NavItem[] => {
    const filteredModules = modules
      .filter(module => module.route && module.route !== '#')
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    // Create hierarchical menu structure
    const navItems: NavItem[] = [];

    // Group modules into main categories
    // Sales Management modules
    const salesModules = filteredModules.filter(m =>
      ['sales', 'sales_opportunities', 'deals', 'products'].includes(m.name)
    );

    // Customer Experience Management modules
    const cemModules = filteredModules.filter(m =>
      ['customers', 'contacts', 'feedback', 'feedback_new', 'surveys', 'customer_health', 'customer_club'].includes(m.name)
    );

    // Team Management modules
    const teamModules = filteredModules.filter(m =>
      ['coworkers', 'activities', 'tasks', 'calendar'].includes(m.name)
    );

    // AI & Analytics modules
    const aiAnalyticsModules = filteredModules.filter(m =>
      ['reports_analysis'].includes(m.name)
    );



    // Products modules
    const productModules = filteredModules.filter(m =>
      ['products'].includes(m.name)
    );

    const otherModules = filteredModules.filter(m =>
      !['customers', 'contacts', 'coworkers', 'activities',
        'sales', 'sales_opportunities', 'feedback', 'feedback_new', 'surveys', 'customer_health', 'customer_club',
        'reports_analysis',
        'products'].includes(m.name)
    );

    // Add dashboard first if exists
    const dashboardModule = filteredModules.find(m => m.name === 'dashboard');
    if (dashboardModule) {
      navItems.push({
        title: routeDisplayNames[dashboardModule.route] || dashboardModule.display_name,
        href: dashboardModule.route,
        icon: iconMap[dashboardModule.icon] || LayoutDashboard,
      });
    }



    // Add Sales Management mega menu
    if (salesModules.length > 0) {
      navItems.push({
        title: 'مدیریت فروش',
        href: '/dashboard/sales',
        icon: TrendingUp,
        children: salesModules.map(module => ({
          title: routeDisplayNames[module.route] || module.display_name,
          href: module.route,
          icon: iconMap[module.icon] || TrendingUp,
        })),
      });
    }

    // Add Customer Experience Management mega menu
    if (cemModules.length > 0) {
      navItems.push({
        title: 'مدیریت تجربه مشتری',
        href: '/dashboard/cem',
        icon: Users,
        children: cemModules.map(module => ({
          title: routeDisplayNames[module.route] || module.display_name,
          href: module.route,
          icon: iconMap[module.icon] || Users,
        })),
      });
    }

    // Add Team Management mega menu
    if (teamModules.length > 0) {
      navItems.push({
        title: 'مدیریت همکاران',
        href: '/dashboard/coworkers',
        icon: Activity,
        children: [
          ...teamModules.map(module => ({
            title: routeDisplayNames[module.route] || module.display_name,
            href: module.route,
            icon: iconMap[module.icon] || Activity,
          })),

        ],
      });
    }

    // Add Chat as standalone item
    navItems.push({
      title: 'چت',
      href: '/dashboard/chat',
      icon: MessageCircle,
    });

    // Add Customer Club with Email Management
    navItems.push({
      title: 'باشگاه مشتریان',
      href: '/dashboard/customer-club',
      icon: Users,
    });

    // Add Test Email (temporary for debugging)


    // Add AI & Analytics mega menu
    if (aiAnalyticsModules.length > 0) {
      navItems.push({
        title: 'هوش مصنوعی و تحلیل',
        href: '/dashboard/insights',
        icon: BarChart3,
        children: [
          ...aiAnalyticsModules.map(module => ({
            title: routeDisplayNames[module.route] || module.display_name,
            href: module.route,
            icon: iconMap[module.icon] || BarChart3,
          })),
          {
            title: 'تحلیل صوتی',
            href: '/dashboard/insights/audio-analysis',
            icon: Brain,
          }
        ],
      });
    }

    // Add Products group
    const productsModule = productModules.find(m => m.name === 'products');
    if (productsModule) {
      navItems.push({
        title: 'محصولات',
        href: '/dashboard/products',
        icon: Package,
      });
    }

    // جمع‌آوری روت‌های همه آیتم‌های children برای جلوگیری از تکرار
    const megaMenuRoutes = [
      ...salesModules,
      ...cemModules,
      ...teamModules,
      ...aiAnalyticsModules,
      ...productModules,
    ].map(m => m.route);

    // Add other individual modules (فقط اگر در هیچ مگامنو نباشد)


    // Add Settings group if has modules


    return navItems;
  };

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => {
      // اگر آیتم در لیست باز شده‌ها باشد، آن را ببند
      if (prev.includes(title)) {
        return prev.filter(item => item !== title);
      }
      // در غیر این صورت، همه را ببند و فقط این یکی را باز کن
      return [title];
    });
  };

  const renderNavItem = (item: NavItem, level = 0) => {
    const isActive = pathname === item.href;
    const isExpanded = expandedItems.includes(item.title);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.title} className="animate-fade-in-up">
        <div
          className={cn(
            'flex items-center space-x-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 group relative overflow-hidden',
            level > 0 && 'ml-4',
            isActive
              ? 'bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 text-primary shadow-lg border border-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-primary/5 hover:via-secondary/5 hover:to-accent/5 hover:shadow-md',
            sidebarCollapsed && 'justify-center px-2',
            'before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/10 before:via-secondary/10 before:to-accent/10 before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100'
          )}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-inherit hover:bg-transparent relative z-10"
              onClick={() => toggleExpanded(item.title)}
            >
              <div className="flex items-center space-x-3">
                <item.icon className={cn(
                  "h-5 w-5 transition-colors duration-300",
                  isActive ? "text-primary" : "group-hover:text-primary"
                )} />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 font-vazir">{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="mr-auto bg-accent/20 text-accent border-accent/30">
                        {item.badge}
                      </Badge>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 transition-transform duration-300" />
                    ) : (
                      <ChevronRight className="h-4 w-4 transition-transform duration-300" />
                    )}
                  </>
                )}
              </div>
            </Button>
          ) : (
            <Link href={item.href} className="flex items-center space-x-3 flex-1 relative z-10">
              <item.icon className={cn(
                "h-5 w-5 transition-colors duration-300",
                isActive ? "text-primary" : "group-hover:text-primary"
              )} />
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 font-vazir">{item.title}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="mr-auto bg-accent/20 text-accent border-accent/30">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          )}
        </div>

        {hasChildren && isExpanded && !sidebarCollapsed && (
          <div className="mr-4 space-y-1 animate-slide-in-right">
            {item.children?.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40 backdrop-blur-sm"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 z-50 h-screen bg-card/95 backdrop-blur-xl border-r border-border/50 transition-all duration-300 shadow-2xl',
          sidebarCollapsed && !isHovered ? 'w-16' : 'w-72'
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex h-16 items-center justify-between border-b border-border/50 px-4 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            {(!sidebarCollapsed || isHovered) && (
              <h1 className="text-xl font-bold font-vazir bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                داشبورد مدیریت
              </h1>
            )}
          </div>
          {/* Mobile menu button - only visible on mobile */}
          <div className="block lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hover:bg-primary/10"
            >
              {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <nav className="space-y-2 p-4 overflow-y-auto flex-1 h-[calc(100vh-128px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            navItems.map(item => renderNavItem(item))
          )}
        </nav>

        {/* Profile Section */}
        <div className="p-4 border-t border-border/50">
          <Link href="/dashboard/profile">
            <div className={cn(
              'flex items-center space-x-3 space-x-reverse rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 group relative overflow-hidden hover:bg-primary/10',
              pathname === '/dashboard/profile' && 'bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 text-primary shadow-lg border border-primary/20'
            )}>
              <User className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="font-vazir">پروفایل کاربری</span>
              )}
            </div>
          </Link>
        </div>

      </div>
    </>
  );
};