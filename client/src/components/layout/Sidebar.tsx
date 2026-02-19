import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, Calculator, Settings, LogOut, FileText, Calendar, DollarSign, Database, Menu, X, Sparkles } from 'lucide-react';

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

    return (
        <>
            {isMobile && (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle menu"
                    style={{
                        position: 'fixed',
                        top: '14px',
                        right: '14px',
                        zIndex: 1100,
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        width: '44px',
                        height: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 10px rgba(79, 70, 229, 0.3)',
                        cursor: 'pointer',
                    }}
                >
                    {isOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            )}

            {isMobile && isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        backdropFilter: 'blur(2px)',
                        zIndex: 999,
                    }}
                />
            )}

            <aside style={{
                width: 'var(--sidebar-width)',
                background: 'var(--bg-sidebar)',
                borderLeft: '1px solid var(--border)',
                height: '100vh',
                position: 'fixed',
                right: isMobile ? (isOpen ? '0' : '-300px') : 0,
                top: 0,
                display: 'flex',
                flexDirection: 'column',
                zIndex: 1000,
                transition: 'right 0.3s ease',
                overflowY: 'auto',
                overflowX: 'hidden',
            }}>
                {/* Logo */}
                <div style={{
                    padding: '24px 20px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    borderBottom: '1px solid var(--border)',
                }}>
                    <div style={{
                        width: '42px',
                        height: '42px',
                        background: 'var(--primary)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        flexShrink: 0,
                    }}>
                        <Sparkles size={22} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                            SMART <span style={{ color: 'var(--primary)' }}>HR</span>
                        </h1>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.08em' }}>
                            نظام الموارد البشرية
                        </p>
                    </div>
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, padding: '12px 0' }}>
                    <div style={{
                        padding: '6px 24px 10px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                    }}>
                        القائمة الرئيسية
                    </div>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {menuItems.map((item) => {
                            const isActive = item.path === '/'
                                ? location.pathname === '/'
                                : location.pathname.startsWith(item.path);
                            return (
                                <li key={item.path}>
                                    <NavLink
                                        to={item.path}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '11px',
                                            padding: '10px 18px',
                                            margin: '0 10px',
                                            borderRadius: '10px',
                                            color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                            background: isActive ? 'var(--bg-active)' : 'transparent',
                                            fontWeight: isActive ? 700 : 500,
                                            transition: 'all 200ms ease',
                                            textDecoration: 'none',
                                            fontSize: '0.9rem',
                                        }}
                                        onMouseOver={(e) => {
                                            if (!isActive) {
                                                e.currentTarget.style.background = 'var(--bg-hover)';
                                                e.currentTarget.style.color = 'var(--text-primary)';
                                            }
                                        }}
                                        onMouseOut={(e) => {
                                            if (!isActive) {
                                                e.currentTarget.style.background = 'transparent';
                                                e.currentTarget.style.color = 'var(--text-secondary)';
                                            }
                                        }}
                                    >
                                        <item.icon size={19} style={{ flexShrink: 0 }} />
                                        <span>{item.label}</span>
                                    </NavLink>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Footer */}
                <div style={{
                    borderTop: '1px solid var(--border)',
                    padding: '14px 10px',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: 'var(--bg-hover)',
                        marginBottom: '10px',
                    }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: 'var(--primary)',
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
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>أحمد العتيبي</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>مدير النظام</div>
                        </div>
                    </div>

                    <button style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        color: 'var(--danger)',
                        background: 'var(--danger-bg)',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '9px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 200ms ease',
                    }}>
                        <LogOut size={17} />
                        <span>تسجيل الخروج</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
