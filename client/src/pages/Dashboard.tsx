import React, { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle, Plus, Calculator, FileOutput, ArrowRightLeft } from 'lucide-react';
import { dashboardApi } from '../api/settingsService';
import type { DashboardStats, Activity } from '../api/settingsService';

const Dashboard: React.FC = () => {
    const [statsData, setStatsData] = useState<DashboardStats | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [stats, activity] = await Promise.all([
                    dashboardApi.getStats(),
                    dashboardApi.getActivity()
                ]);
                setStatsData(stats);
                setActivities(activity);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const stats = [
        { label: 'إجمالي الموظفين (المجموعة)', value: statsData?.totalEmployees?.toLocaleString() || '0', sub: '+0 هذا الشهر', icon: Users, color: '#2E7D32', bg: '#E8F5E9' },
        { label: 'رواتب موحدة (كل الفروع)', value: statsData?.totalSalaries?.toLocaleString() || '0', sub: 'ريال سعودي', icon: ArrowRightLeft, color: '#17A2B8', bg: '#D1ECF1' },
        { label: 'التزامات نهاية الخدمة', value: statsData?.eosLiability || '0', sub: 'لكافة الشركات', icon: FileText, color: '#DC3545', bg: '#F8D7DA' },
        { label: 'عدد الفروع النشطة', value: statsData?.branchesCount?.toString() || '0', sub: 'فرع وشركة', icon: CheckCircle, color: '#6610F2', bg: '#E0D4FC' },
    ];

    const quickActions = [
        { label: 'إضافة موظف جديد', icon: Plus, color: '#2E7D32' },
        { label: 'حساب نهاية خدمة', icon: Calculator, color: '#007BFF' },
        { label: 'اصدار مسير رواتب', icon: FileOutput, color: '#6610F2' },
        { label: 'تسجيل إجازة', icon: CheckCircle, color: '#FD7E14' },
    ];

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>جاري تحميل لوحة التحكم...</div>;
    }

    return (
        <div>
            {/* Header Section */}
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111' }}>نظرة عامة للمجموعة</h2>
                    <p style={{ color: '#6C757D', marginTop: '4px' }}>تقرير موحد لجميع الشركات والفروع التابعة.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <select title="تصفية حسب الشركة" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #E9ECEF', fontWeight: 'bold' }}>
                        <option>كل الشركات ({statsData?.companiesCount || 0})</option>
                        <option>الشركة القابضة - الرياض</option>
                        <option>فرع جدة</option>
                        <option>فرع الدمام</option>
                    </select>
                    <button className="btn btn-primary">تصدير تقرير موحد</button>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                {stats.map((stat, index) => (
                    <div key={index} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                backgroundColor: stat.bg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: stat.color
                            }}>
                                <stat.icon size={24} />
                            </div>
                            <span style={{ fontSize: '0.875rem', color: stat.color, fontWeight: 'bold' }}>{stat.sub}</span>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: '#6C757D', marginBottom: '4px' }}>{stat.label}</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#212529' }}>{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '24px', alignItems: 'start' }}>
                {/* Main Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Quick Actions */}
                    <div className="card">
                        <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: 'bold' }}>إجراءات سريعة</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                            {quickActions.map((action, idx) => (
                                <button key={idx} style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '24px',
                                    backgroundColor: '#F8F9FA',
                                    border: '1px solid #E9ECEF',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E9ECEF'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F8F9FA'}
                                >
                                    <div style={{ marginBottom: '12px', color: action.color }}>
                                        <action.icon size={28} />
                                    </div>
                                    <span style={{ fontWeight: '600', color: '#495057' }}>{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Charts Section Placeholder */}
                    <div className="card" style={{ minHeight: '400px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>تحليل الرواتب والمستحقات</h3>
                            <select title="الفترة الزمنية" style={{ width: 'auto', padding: '8px' }}>
                                <option>آخر 6 أشهر</option>
                                <option>هذه السنة</option>
                            </select>
                        </div>
                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FA', borderRadius: '8px', border: '2px dashed #E9ECEF' }}>
                            <div style={{ textAlign: 'center', color: '#ADB5BD' }}>
                                <Calculator size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                                <p>مساحة مخصصة للرسوم البيانية (Recharts)</p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Side Column: Activity */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #E9ECEF', fontWeight: 'bold', fontSize: '1.1rem' }}>
                            آخر العمليات
                        </div>
                        <div>
                            {activities.map((activity) => (
                                <div key={activity.id} style={{
                                    padding: '16px 20px',
                                    borderBottom: '1px solid #F1F3F5',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    transition: 'background 0.2s',
                                    cursor: 'pointer'
                                }}
                                    className="hover-bg"
                                >
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '50%',
                                        backgroundColor: activity.type === 'SALARY' ? '#E3F2FD' : '#FCE4EC',
                                        color: activity.type === 'SALARY' ? '#2196F3' : '#E91E63',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold'
                                    }}>
                                        {activity.type === 'SALARY' ? 'رواتب' : 'خدمة'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#343A40' }}>{activity.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#ADB5BD' }}>{activity.time}</div>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: activity.amount.startsWith('-') ? '#DC3545' : '#28A745' }}>
                                        {activity.amount}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ padding: '16px', textAlign: 'center', borderTop: '1px solid #E9ECEF' }}>
                            <button className="btn" style={{ fontSize: '0.9rem', color: '#2E7D32' }}>عرض كل العمليات</button>
                        </div>
                    </div>

                    <div className="card" style={{ background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)', color: 'white' }}>
                        <h3 style={{ marginBottom: '12px', fontSize: '1.25rem' }}>هل تحتاج مساعدة؟</h3>
                        <p style={{ opacity: 0.9, marginBottom: '20px', fontSize: '0.9rem', lineHeight: '1.6' }}>
                            فريق الدعم الفني جاهز لمساعدتك في أي وقت. تواصل معنا إذا واجهت أي مشكلة في الحسابات.
                        </p>
                        <button className="btn" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', width: '100%', border: 'none' }}>
                            تواصل مع الدعم
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Dashboard;
