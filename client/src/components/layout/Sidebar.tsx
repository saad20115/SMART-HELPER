import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, Calculator, Settings, LogOut, FileText, Calendar, DollarSign, Database, Menu, X } from 'lucide-react';


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

    // Close sidebar on navigation in mobile
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
            {/* Mobile hamburger button */}
            {isMobile && (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        position: 'fixed',
                        top: '20px',
                        right: '16px',
                        zIndex: 1100,
                        background: 'var(--primary-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        width: '44px',
                        height: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            )}

            {/* Overlay for mobile */}
            {isMobile && isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 999,
                    }}
                />
            )}

            {/* Sidebar */}
            <aside style={{
                width: isMobile ? '260px' : '280px',
                backgroundColor: '#ffffff',
                borderLeft: '1px solid #E9ECEF',
                height: '100vh',
                position: 'fixed',
                right: isMobile ? (isOpen ? '0' : '-280px') : 0,
                top: 0,
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 1000,
                transition: 'right 0.3s ease',
                overflowY: 'auto',
            }}>
                <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: 'var(--primary-color)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '24px',
                        flexShrink: 0,
                    }}>
                        S
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#2E7D32' }}>نظام الموارد</h1>
                        <p style={{ fontSize: '0.8rem', color: '#6C757D' }}>إصدار الشركات</p>
                    </div>
                </div>

                <nav style={{ flex: 1 }}>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {menuItems.map((item) => (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                                    style={({ isActive }) => ({
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px 16px',
                                        borderRadius: '8px',
                                        color: isActive ? '#2E7D32' : '#495057',
                                        backgroundColor: isActive ? '#E8F5E9' : 'transparent',
                                        fontWeight: isActive ? '700' : '500',
                                        transition: 'all 0.2s',
                                        textDecoration: 'none',
                                        fontSize: isMobile ? '0.95rem' : '1rem',
                                    })}
                                >
                                    <item.icon size={20} />
                                    <span>{item.label}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div style={{ borderTop: '1px solid #E9ECEF', paddingTop: '20px' }}>
                    <button className="btn" style={{ width: '100%', justifyContent: 'flex-start', color: '#DC3545' }}>
                        <LogOut size={20} />
                        <span>تسجيل الخروج</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
