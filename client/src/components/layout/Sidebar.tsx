import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Calculator, Settings, LogOut, FileText, Calendar, DollarSign } from 'lucide-react';


const Sidebar: React.FC = () => {
    const menuItems = [
        { icon: Home, label: 'لوحة التحكم', path: '/' },
        { icon: Users, label: 'الموظفين', path: '/employees' },
        { icon: Calculator, label: 'حساب المستحقات', path: '/calculations' },
        { icon: Calendar, label: 'إدارة الإجازات', path: '/leave-management' },
        { icon: FileText, label: 'الحاسبة المجمعة', path: '/aggregated-calculations' },
        { icon: DollarSign, label: 'المبالغ المعلقة', path: '/pending-amounts' },
        { icon: FileText, label: 'التقارير', path: '/reports' },
        { icon: Settings, label: 'الإعدادات', path: '/settings' },
    ];

    return (
        <aside style={{
            width: '280px',
            backgroundColor: '#ffffff',
            borderLeft: '1px solid #E9ECEF',
            height: '100vh',
            position: 'fixed',
            right: 0,
            top: 0,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
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
                    fontSize: '24px'
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
    );
};

export default Sidebar;
