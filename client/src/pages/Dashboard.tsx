import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, CheckCircle, Plus, Calculator, FileOutput, ArrowRightLeft, Briefcase, Tag, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { dashboardApi, companiesApi } from '../api/settingsService';
import type { DashboardStats, Activity, Company } from '../api/settingsService';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [statsData, setStatsData] = useState<DashboardStats | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = useCallback(async (companyId?: string) => {
        try {
            setLoading(true);
            const [stats, activity] = await Promise.all([
                dashboardApi.getStats(companyId || undefined),
                dashboardApi.getActivity(companyId || undefined)
            ]);
            setStatsData(stats);
            setActivities(activity);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            try {
                const companiesList = await companiesApi.getAll();
                setCompanies(companiesList);
            } catch (error) {
                console.error('Error fetching companies:', error);
            }
            await fetchDashboardData();
        };
        init();
    }, [fetchDashboardData]);

    const handleCompanyChange = (companyId: string) => {
        setSelectedCompanyId(companyId);
        fetchDashboardData(companyId || undefined);
    };

    const CHART_COLORS = ['#2E7D32', '#17A2B8', '#FD7E14', '#6610F2'];

    const salaryChartData = statsData?.salaryChart ? [
        { name: 'الراتب الأساسي', value: statsData.salaryChart.basicSalary },
        { name: 'بدل السكن', value: statsData.salaryChart.housingAllowance },
        { name: 'بدل النقل', value: statsData.salaryChart.transportAllowance },
        { name: 'بدلات أخرى', value: statsData.salaryChart.otherAllowances },
    ].filter(d => d.value > 0) : [];

    const stats = [
        {
            label: 'إجمالي الموظفين',
            value: statsData?.totalEmployees?.toLocaleString('ar-SA') || '0',
            sub: selectedCompanyId ? 'للشركة المحددة' : 'كل الشركات',
            icon: Users,
            color: '#2E7D32',
            bg: '#E8F5E9',
            link: '/employees'
        },
        {
            label: 'إجمالي الرواتب',
            value: statsData?.totalSalaries?.toLocaleString('ar-SA') || '0',
            sub: 'ريال سعودي',
            icon: ArrowRightLeft,
            color: '#17A2B8',
            bg: '#D1ECF1',
            link: '/reports'
        },
        {
            label: 'التزامات نهاية الخدمة',
            value: statsData?.eosLiability || '0',
            sub: selectedCompanyId ? 'للشركة المحددة' : 'لكافة الشركات',
            icon: FileText,
            color: '#DC3545',
            bg: '#F8D7DA',
            link: '/aggregated-calculations'
        },
        {
            label: 'الفروع',
            value: statsData?.branchesCount?.toString() || '0',
            sub: 'من إعدادات المنشأة',
            icon: CheckCircle,
            color: '#6610F2',
            bg: '#E0D4FC',
            link: '/settings',
            state: { activeTab: 'organization', orgActiveTab: 'branches' }
        },
        {
            label: 'الوظائف',
            value: statsData?.jobsCount?.toString() || '0',
            sub: 'مسمى وظيفي',
            icon: Briefcase,
            color: '#007BFF',
            bg: '#CCE5FF',
            link: '/settings',
            state: { activeTab: 'organization', orgActiveTab: 'jobs' }
        },
        {
            label: 'التصنيفات',
            value: statsData?.classificationsCount?.toString() || '0',
            sub: 'تصنيف',
            icon: Tag,
            color: '#FD7E14',
            bg: '#FFE8CC',
            link: '/settings',
            state: { activeTab: 'organization', orgActiveTab: 'classifications' }
        },
    ];

    const quickActions = [
        { label: 'إضافة موظف جديد', icon: Plus, color: '#2E7D32', link: '/employees' },
        { label: 'حساب نهاية خدمة', icon: Calculator, color: '#007BFF', link: '/aggregated-calculations' },
        { label: 'اصدار مسير رواتب', icon: FileOutput, color: '#6610F2', link: '/reports' },
        { label: 'تسجيل إجازة', icon: CheckCircle, color: '#FD7E14', link: '/leave-management' },
    ];

    if (loading && !statsData) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>جاري تحميل لوحة التحكم...</div>;
    }

    return (
        <div>
            {/* Header Section */}
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111' }}>نظرة عامة للمجموعة</h2>
                    <p style={{ color: '#6C757D', marginTop: '4px' }}>تقرير موحد لجميع الشركات والفروع التابعة.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <select
                        title="تصفية حسب الشركة"
                        value={selectedCompanyId}
                        onChange={(e) => handleCompanyChange(e.target.value)}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: '1px solid #E9ECEF',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            backgroundColor: '#fff',
                            minWidth: '200px',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="">كل الشركات ({statsData?.companiesCount || 0})</option>
                        {companies.map((company) => (
                            <option key={company.id} value={company.id}>{company.name}</option>
                        ))}
                    </select>
                    <button
                        className="btn"
                        onClick={() => fetchDashboardData(selectedCompanyId || undefined)}
                        style={{
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid #E9ECEF',
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="تحديث البيانات"
                    >
                        <RefreshCw size={18} className={loading ? 'spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="card"
                        style={{
                            display: 'flex', flexDirection: 'column', padding: '20px',
                            cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
                            opacity: loading ? 0.7 : 1
                        }}
                        onClick={() => navigate(stat.link, { state: stat.state })}
                        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '12px',
                                backgroundColor: stat.bg, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', color: stat.color
                            }}>
                                <stat.icon size={22} />
                            </div>
                            <span style={{ fontSize: '0.75rem', color: stat.color, fontWeight: '600', opacity: 0.8 }}>{stat.sub}</span>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: '#6C757D', marginBottom: '4px' }}>{stat.label}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#212529' }}>{stat.value}</div>
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
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    justifyContent: 'center', padding: '24px', backgroundColor: '#F8F9FA',
                                    border: '1px solid #E9ECEF', borderRadius: '8px', cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                    onClick={() => navigate(action.link)}
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

                    {/* Salary Distribution Chart */}
                    <div className="card" style={{ minHeight: '400px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>توزيع الرواتب والبدلات</h3>
                            {selectedCompanyId && (
                                <span style={{ fontSize: '0.85rem', color: '#6C757D', backgroundColor: '#F0F0F0', padding: '4px 12px', borderRadius: '12px' }}>
                                    {companies.find(c => c.id === selectedCompanyId)?.name || ''}
                                </span>
                            )}
                        </div>
                        {salaryChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={320}>
                                <PieChart>
                                    <Pie
                                        data={salaryChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={120}
                                        paddingAngle={4}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                    >
                                        {salaryChartData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number | undefined) => (value ?? 0).toLocaleString('ar-SA') + ' ر.س'}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FA', borderRadius: '8px', border: '2px dashed #E9ECEF' }}>
                                <div style={{ textAlign: 'center', color: '#ADB5BD' }}>
                                    <Calculator size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                                    <p>لا توجد بيانات رواتب لعرضها</p>
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {/* Side Column: Activity */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #E9ECEF', fontWeight: 'bold', fontSize: '1.1rem' }}>
                            آخر العمليات
                        </div>
                        <div>
                            {activities.length > 0 ? activities.map((activity) => (
                                <div key={activity.id} style={{
                                    padding: '14px 20px', borderBottom: '1px solid #F1F3F5',
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    transition: 'background 0.2s', cursor: 'pointer'
                                }}
                                    className="hover-bg"
                                >
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '50%',
                                        backgroundColor: activity.type === 'DEDUCTION' ? '#FCE4EC' : '#E8F5E9',
                                        color: activity.type === 'DEDUCTION' ? '#E91E63' : '#2E7D32',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.7rem', fontWeight: 'bold'
                                    }}>
                                        {activity.type === 'DEDUCTION' ? 'خصم' : 'إجازة'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#343A40', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#ADB5BD' }}>
                                            {new Date(activity.time).toLocaleDateString('ar-SA')}
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap',
                                        color: activity.amount.startsWith('-') ? '#DC3545' : '#28A745'
                                    }}>
                                        {activity.amount}
                                    </div>
                                </div>
                            )) : (
                                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#ADB5BD' }}>
                                    لا توجد عمليات حديثة
                                </div>
                            )}
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
