import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, Search, User } from 'lucide-react';

const Header: React.FC = () => {
    return (
        <header style={{
            height: '80px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #E9ECEF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            marginBottom: '32px',
            position: 'sticky',
            top: 0,
            zIndex: 900
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#6C757D' }}>
                <Search size={20} />
                <input
                    type="text"
                    placeholder="بحث سريع..."
                    style={{ border: 'none', outline: 'none', width: '300px' }}
                />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
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
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>أحمد العتيبي</div>
                        <div style={{ fontSize: '0.75rem', color: '#6C757D' }}>مدير الموارد البشرية</div>
                    </div>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#E9ECEF',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#495057'
                    }}>
                        <User size={20} />
                    </div>
                </div>
            </div>
        </header>
    );
};

const MainLayout: React.FC = () => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <main style={{
                flex: 1,
                marginRight: '280px', // Using marginRight for RTL
                backgroundColor: '#F8F9FA',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <Header />
                <div className="container" style={{ flex: 1, paddingBottom: '40px' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
