import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Search, Bell, Moon, Sun, Command } from 'lucide-react';
import { useTheme } from '../ThemeContext';

const MainLayout = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />

            <div style={{
                flex: 1,
                marginRight: isMobile ? 0 : 'var(--sidebar-width)',
                transition: 'margin-right 0.3s ease',
            }}>
                {/* Header */}
                <header style={{
                    height: isMobile ? '60px' : 'var(--header-height)',
                    background: 'var(--bg-header)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: isMobile ? '0 60px 0 16px' : '0 32px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 900,
                }}>
                    {/* Search */}
                    {!isMobile && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'var(--bg-hover)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '8px 14px',
                            width: '300px',
                            transition: 'all 200ms ease',
                        }}>
                            <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            <input
                                type="text"
                                placeholder="بحث سريع..."
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    width: '100%',
                                    background: 'none',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.88rem',
                                    fontFamily: 'inherit',
                                    padding: 0,
                                }}
                            />
                            <kbd style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px',
                                padding: '2px 6px',
                                borderRadius: '6px',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-muted)',
                                fontSize: '0.7rem',
                                fontFamily: 'var(--font-en)',
                            }}>
                                <Command size={10} />K
                            </kbd>
                        </div>
                    )}

                    {isMobile && <div />}

                    {/* Right actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            title={theme === 'light' ? 'الوضع الداكن' : 'الوضع الفاتح'}
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-card)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 200ms ease',
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = 'var(--bg-hover)';
                                e.currentTarget.style.borderColor = 'var(--border-hover)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'var(--bg-card)';
                                e.currentTarget.style.borderColor = 'var(--border)';
                            }}
                        >
                            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                        </button>

                        {/* Notifications */}
                        <button style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-card)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            transition: 'all 200ms ease',
                        }}>
                            <Bell size={18} />
                            <span style={{
                                position: 'absolute',
                                top: '8px',
                                left: '8px',
                                width: '8px',
                                height: '8px',
                                background: 'var(--danger)',
                                borderRadius: '50%',
                                border: '2px solid var(--bg-header)',
                            }} />
                        </button>

                        {/* User */}
                        {!isMobile && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '6px 14px 6px 6px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-card)',
                                cursor: 'pointer',
                                transition: 'all 200ms ease',
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>أحمد</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>مدير</div>
                                </div>
                                <div style={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '10px',
                                    background: 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                }}>أ</div>
                            </div>
                        )}
                    </div>
                </header>

                {/* Main Content */}
                <main style={{
                    padding: isMobile ? '16px' : '28px 32px',
                    minHeight: `calc(100vh - var(--header-height))`,
                }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
