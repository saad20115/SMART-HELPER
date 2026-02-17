import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, Search, User } from 'lucide-react';

const Header: React.FC = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <header style={{
            height: isMobile ? '60px' : '80px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #E9ECEF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '0 16px 0 16px' : '0 32px',
            paddingRight: isMobile ? '70px' : '32px', // Space for hamburger
            marginBottom: isMobile ? '16px' : '32px',
            position: 'sticky',
            top: 0,
            zIndex: 900
        }}>
            {!isMobile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#6C757D' }}>
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="بحث سريع..."
                        style={{ border: 'none', outline: 'none', width: '300px' }}
                    />
                </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '24px' }}>
                <button style={{ position: 'relative', background: 'none', border: 'none', color: '#495057' }}>
                    <Bell size={20} />
                    <span style={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#DC3545',
                        borderRadius: '50%',
                    }} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {!isMobile && (
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>أحمد العتيبي</div>
                            <div style={{ fontSize: '0.75rem', color: '#6C757D' }}>مدير الموارد البشرية</div>
                        </div>
                    )}
                    <div style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: '#E9ECEF',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#495057'
                    }}>
                        <User size={18} />
                    </div>
                </div>
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
                backgroundColor: '#F8F9FA',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <Header />
                <div className="container" style={{
                    flex: 1,
                    paddingBottom: '40px',
                    padding: isMobile ? '0 12px 40px 12px' : '0 40px 40px 40px',
                }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
