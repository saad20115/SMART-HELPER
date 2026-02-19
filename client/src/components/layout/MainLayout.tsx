import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, Search, Command } from 'lucide-react';

const Header: React.FC = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <header style={{
            height: isMobile ? '60px' : '72px',
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '0 16px' : '0 32px',
            paddingRight: isMobile ? '70px' : '32px',
            position: 'sticky',
            top: 0,
            zIndex: 900,
        }}>
            {/* Search */}
            {!isMobile && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'rgba(148, 163, 184, 0.06)',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    borderRadius: '12px',
                    padding: '8px 16px',
                    width: '320px',
                    transition: 'all 250ms ease',
                }}>
                    <Search size={17} style={{ color: '#64748B', flexShrink: 0 }} />
                    <input
                        type="text"
                        placeholder="بحث سريع..."
                        style={{
                            border: 'none',
                            outline: 'none',
                            width: '100%',
                            background: 'none',
                            color: '#F1F5F9',
                            fontSize: '0.9rem',
                        }}
                    />
                    <kbd style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        background: 'rgba(148, 163, 184, 0.1)',
                        border: '1px solid rgba(148, 163, 184, 0.15)',
                        fontSize: '0.7rem',
                        color: '#64748B',
                        fontFamily: 'Inter, sans-serif',
                    }}>
                        <Command size={10} />K
                    </kbd>
                </div>
            )}

            {/* Right side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px' }}>
                {/* Notifications */}
                <button style={{
                    position: 'relative',
                    background: 'rgba(148, 163, 184, 0.06)',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    borderRadius: '10px',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(148, 163, 184, 0.12)'; e.currentTarget.style.color = '#F1F5F9'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(148, 163, 184, 0.06)'; e.currentTarget.style.color = '#94A3B8'; }}
                >
                    <Bell size={18} />
                    <span style={{
                        position: 'absolute',
                        top: '8px',
                        right: '9px',
                        width: '7px',
                        height: '7px',
                        background: 'linear-gradient(135deg, #EF4444, #F87171)',
                        borderRadius: '50%',
                        border: '2px solid #0F172A',
                        boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)',
                    }} />
                </button>

                {/* User */}
                {!isMobile && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '6px 14px 6px 6px',
                        borderRadius: '12px',
                        background: 'rgba(148, 163, 184, 0.06)',
                        border: '1px solid rgba(148, 163, 184, 0.1)',
                        cursor: 'pointer',
                        transition: 'all 200ms ease',
                    }}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(148, 163, 184, 0.12)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(148, 163, 184, 0.06)'; }}
                    >
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#E2E8F0' }}>أحمد العتيبي</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>مدير النظام</div>
                        </div>
                        <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                        }}>
                            أ
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

const MainLayout: React.FC = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <main style={{
                flex: 1,
                marginRight: isMobile ? '0' : '280px',
                backgroundColor: 'transparent',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <Header />
                <div className="container" style={{
                    flex: 1,
                    padding: isMobile ? '20px 16px 40px' : '28px 36px 40px',
                }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
