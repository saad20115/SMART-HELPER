import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, Calculator, Settings, LogOut, FileText, Calendar, DollarSign, Database, Menu, X, ChevronLeft, Sparkles } from 'lucide-react';

const Sidebar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const location = useLocation();

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) setIsOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (isMobile) setIsOpen(false);
    }, [location.pathname, isMobile]);

    const menuItems = [
        { icon: Home, label: 'لوحة التحكم', path: '/' },
        { icon: Users, label: 'الموظفين', path: '/employees' },
        { icon: Calculator, label: 'حساب المستحقات', path: '/calculations' },
        { icon: Calendar, label: 'إدارة الإجازات', path: '/leave-management' },
        { icon: FileText, label: 'الحاسبة المجمعة', path: '/aggregated-calculations' },
        { icon: DollarSign, label: 'المبالغ المعلقة', path: '/pending-amounts' },
        { icon: FileText, label: 'التقارير', path: '/reports' },
        { icon: Settings, label: 'الإعدادات', path: '/settings' },
        { icon: Database, label: 'النسخ الاحتياطي', path: '/backup-restore' },
    ];

    const styles = {
        hamburger: {
            position: 'fixed' as const,
            top: '16px',
            right: '16px',
            zIndex: 1100,
            background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            width: '46px',
            height: '46px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
            cursor: 'pointer',
            transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
        overlay: {
            position: 'fixed' as const,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 999,
            transition: 'opacity 300ms ease',
        },
        sidebar: {
            width: isMobile ? '280px' : '280px',
            background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
            borderLeft: '1px solid rgba(148, 163, 184, 0.08)',
            height: '100vh',
            position: 'fixed' as const,
            right: isMobile ? (isOpen ? '0' : '-300px') : 0,
            top: 0,
            padding: '0',
            display: 'flex',
            flexDirection: 'column' as const,
            zIndex: 1000,
            transition: 'right 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            overflowY: 'auto' as const,
            overflowX: 'hidden' as const,
            boxShadow: isMobile && isOpen ? '-8px 0 40px rgba(0,0,0,0.5)' : 'none',
        },
        logo: {
            padding: '28px 24px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
            marginBottom: '8px',
        },
        logoIcon: {
            width: '44px',
            height: '44px',
            background: 'linear-gradient(135deg, #6366F1, #818CF8)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            flexShrink: 0,
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
        },
        navItem: (isActive: boolean) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '11px 20px',
            margin: '2px 12px',
            borderRadius: '12px',
            color: isActive ? '#F1F5F9' : '#94A3B8',
            background: isActive
                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.1))'
                : 'transparent',
            fontWeight: isActive ? 700 : 500,
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            textDecoration: 'none',
            fontSize: '0.92rem',
            position: 'relative' as const,
            overflow: 'hidden' as const,
            border: isActive ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent',
        }),
    };

    return (
        <>
            {isMobile && (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    style={styles.hamburger}
                    aria-label="Toggle menu"
                >
                    {isOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            )}

            {isMobile && isOpen && (
                <div onClick={() => setIsOpen(false)} style={styles.overlay} />
            )}

            <aside style={styles.sidebar}>
                {/* Logo */}
                <div style={styles.logo}>
                    <div style={styles.logoIcon}>
                        <Sparkles size={22} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.02em' }}>
                            SMART <span style={{ color: '#818CF8' }}>HR</span>
                        </h1>
                        <p style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
                            نظام الموارد البشرية
                        </p>
                    </div>
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, padding: '8px 0' }}>
                    <div style={{ padding: '8px 24px 10px', fontSize: '0.7rem', fontWeight: 700, color: '#475569', letterSpacing: '0.15em', textTransform: 'uppercase' as const }}>
                        القائمة الرئيسية
                    </div>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {menuItems.map((item) => (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    style={({ isActive }) => styles.navItem(isActive)}
                                    onMouseOver={(e) => {
                                        const target = e.currentTarget;
                                        if (!target.classList.contains('active')) {
                                            target.style.background = 'rgba(148, 163, 184, 0.06)';
                                            target.style.color = '#CBD5E1';
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        const target = e.currentTarget;
                                        if (!target.classList.contains('active')) {
                                            target.style.background = 'transparent';
                                            target.style.color = '#94A3B8';
                                        }
                                    }}
                                >
                                    <item.icon size={19} style={{ flexShrink: 0 }} />
                                    <span>{item.label}</span>
                                    {item.path === location.pathname && (
                                        <ChevronLeft size={14} style={{ marginRight: 'auto', opacity: 0.5 }} />
                                    )}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Footer */}
                <div style={{
                    borderTop: '1px solid rgba(148, 163, 184, 0.08)',
                    padding: '16px 12px',
                    marginTop: 'auto'
                }}>
                    {/* User Info */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '12px',
                        background: 'rgba(148, 163, 184, 0.04)',
                        marginBottom: '12px'
                    }}>
                        <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            flexShrink: 0,
                        }}>
                            أ
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#E2E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>أحمد العتيبي</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>مدير النظام</div>
                        </div>
                    </div>

                    <button
                        className="btn"
                        style={{
                            width: '100%',
                            justifyContent: 'center',
                            color: '#EF4444',
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.15)',
                            borderRadius: '10px',
                            padding: '10px',
                            fontSize: '0.85rem',
                            gap: '8px'
                        }}
                    >
                        <LogOut size={17} />
                        <span>تسجيل الخروج</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
