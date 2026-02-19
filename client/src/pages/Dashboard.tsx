import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, Briefcase, Plus, Calculator, FileOutput, CheckCircle, RefreshCw, ArrowDownLeft } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { dashboardApi, companiesApi, calculationsApi } from '../api/settingsService';
import type { DashboardStats, Activity, Company } from '../api/settingsService';

// Define AggregatedData interface locally or import if exported (it's not exported from api/settingsService clearly in the view, so I'll define a subset or use any)
// actually calculationsApi.getAggregated returns 'any' in the definition I saw, but I know the structure.
interface AggregatedSummary {
    totalEmployees: number;
    totalActiveEmployees: number;
    totalTerminatedEmployees: number;
    totalNetEOS: number;
    totalLeaveCompensation: number;
    totalLeaveDeductions: number;
    totalOtherDeductions: number;
    totalFinalPayable: number;
    averageServiceYears: number;
}

const Dashboard: React.FC = () => {
    // const navigate = useNavigate(); // Removed as we use Link
    const [statsData, setStatsData] = useState<DashboardStats | null>(null);
    const [aggregatedData, setAggregatedData] = useState<AggregatedSummary | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = useCallback(async (companyId?: string) => {
        try {
            setLoading(true);



            const [stats, activity, aggregatedResult] = await Promise.all([
                dashboardApi.getStats(companyId || undefined),
                dashboardApi.getActivity(companyId || undefined),
                calculationsApi.getAggregated(companyId ? { companyId } : {}) // Assuming backend handles companyId in query or ignored
            ]);

            setStatsData(stats);
            setActivities(activity);
            setAggregatedData(aggregatedResult.summary);
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

    const formatCurrency = (val: number | undefined | null) => {
        if (val === undefined || val === null || isNaN(val)) return '0';
        return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // New 6 Cards Configuration
    const summaryCards = [
        // Row 1
        {
            title: 'إجمالي تعويضات الإجازات',
            value: formatCurrency(aggregatedData?.totalLeaveCompensation),
            sub: 'ر.س',
            color: '#007BFF', // Blue
            icon: FileOutput,
            link: '/aggregated-calculations',
            borderTop: '4px solid #007BFF'
        },
        {
            title: 'إجمالي مكافآت نهاية الخدمة',
            value: formatCurrency(aggregatedData?.totalNetEOS),
            sub: 'ر.س',
            color: '#FD7E14', // Orange
            icon: TrendingUp,
            link: '/aggregated-calculations',
            borderTop: '4px solid #FD7E14'
        },
        {
            title: 'متوسط سنوات الخدمة',
            value: `${(aggregatedData?.averageServiceYears || 0).toFixed(1)} سنة`,
            sub: aggregatedData ? `إجمالي الموظفين: ${aggregatedData.totalEmployees}` : 'تحميل...',
            activeText: aggregatedData ? `نشط: ${aggregatedData.totalActiveEmployees} | منهي: ${aggregatedData.totalTerminatedEmployees}` : '',
            color: '#28A745', // Green
            icon: Users,
            link: '/employees',
            borderTop: '4px solid #28A745'
        },
        // Row 2
        {
            title: 'صافي المبالغ المستحقة',
            value: formatCurrency(aggregatedData?.totalFinalPayable),
            sub: 'ر.س',
            color: '#212529', // Dark text for readability on yellow? Or White?
            bgColor: '#FFC107', // Gold background
            icon: Briefcase,
            link: '/reports',
            isSpecial: true
        },
        {
            title: 'إجمالي الخصومات الأخرى',
            value: formatCurrency(aggregatedData?.totalOtherDeductions),
            sub: 'ر.س',
            color: '#DC3545', // Red
            icon: ArrowDownLeft,
            link: '/reports',
            borderTop: '4px solid #DC3545'
        },
        {
            title: 'إجمالي خصم الإجازات',
            value: formatCurrency(aggregatedData?.totalLeaveDeductions),
            sub: 'ر.س',
            color: '#DC3545', // Red
            icon: ArrowDownLeft,
            link: '/reports',
            borderTop: '4px solid #DC3545'
        }
    ];



    const quickActions = [
        { label: 'إضافة موظف جديد', icon: Plus, color: '#2E7D32', link: '/employees' },
        { label: 'حساب نهاية خدمة', icon: Calculator, color: '#007BFF', link: '/aggregated-calculations' },
        { label: 'اصدار مسير رواتب', icon: FileOutput, color: '#6610F2', link: '/reports' },
        { label: 'تسجيل إجازة', icon: CheckCircle, color: '#FD7E14', link: '/leave-management' },
    ];

    if (loading && !statsData && !aggregatedData) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>جاري تحميل لوحة التحكم...</div>;
    }

    return (
        <div>
            {/* Header Section */}
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111' }}>نظرة عامة للمجموعة</h2>
                    <p style={{ color: '#6C757D', marginTop: '4px' }}>تقرير مالي وتشغيلي موحد.</p>
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

            {/* New Stats Grid - 6 Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                {summaryCards.map((card, index) => (
                    <Link
                        key={index}
                        to={card.link}
                        className="card"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '24px',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            opacity: loading ? 0.7 : 1,
                            border: '1px solid #E9ECEF',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            textDecoration: 'none',
                            color: 'inherit',
                            backgroundColor: card.bgColor || '#fff',
                            borderTop: card.borderTop,
                            height: '100%',
                            position: 'relative'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.08)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'; }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ fontSize: '0.95rem', color: card.bgColor ? '#212529' : '#6C757D', fontWeight: '600' }}>{card.title}</div>
                            {card.icon && (
                                <div style={{ color: card.color }}>
                                    <card.icon size={20} />
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: 'auto' }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: card.bgColor ? '#212529' : card.color, marginBottom: '4px', direction: 'ltr', textAlign: 'right' }}>
                                {card.value}
                            </div>

                            {card.activeText && (
                                <div style={{ fontSize: '0.75rem', color: '#6C757D', marginTop: '4px' }}>
                                    {card.activeText}
                                </div>
                            )}

                            {card.sub && !card.activeText && (
                                <div style={{ fontSize: '0.8rem', color: card.bgColor ? '#212529' : '#6C757D', opacity: 0.8 }}>
                                    {card.sub}
                                </div>
                            )}
                        </div>
                    </Link>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'start' }}>
                {/* Main Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Quick Actions */}
                    <div className="card">
                        <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: 'bold' }}>الوصول السريع</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                            {quickActions.map((action, idx) => (
                                <Link
                                    key={idx}
                                    to={action.link}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        justifyContent: 'center', padding: '20px', backgroundColor: '#fff',
                                        border: '1px solid #E9ECEF', borderRadius: '12px', cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        gap: '12px',
                                        textDecoration: 'none',
                                        color: 'inherit'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F8F9FA'; e.currentTarget.style.borderColor = '#DEE2E6'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.borderColor = '#E9ECEF'; }}
                                >
                                    <div style={{ color: action.color, padding: '10px', borderRadius: '50%', backgroundColor: `${action.color}15` }}>
                                        <action.icon size={24} />
                                    </div>
                                    <span style={{ fontWeight: '600', color: '#495057', fontSize: '0.95rem' }}>{action.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Salary Distribution Chart */}
                    <div className="card" style={{ minHeight: '400px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>هيكل الرواتب والبدلات</h3>
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
                                        innerRadius={80}
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
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend iconType="circle" />
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
                        <div style={{ padding: '20px', borderBottom: '1px solid #E9ECEF', fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <RefreshCw size={18} color="#6C757D" />
                            <span>آخر العمليات</span>
                        </div>
                        <div>
                            {activities.length > 0 ? activities.map((activity) => (
                                <div key={activity.id} style={{
                                    padding: '16px 20px', borderBottom: '1px solid #F1F3F5',
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    transition: 'background 0.2s', cursor: 'pointer'
                                }}
                                    className="hover-bg"
                                >
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        backgroundColor: activity.type === 'DEDUCTION' ? '#FCE4EC' : '#E8F5E9',
                                        color: activity.type === 'DEDUCTION' ? '#E91E63' : '#2E7D32',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.7rem', fontWeight: 'bold'
                                    }}>
                                        {activity.type === 'DEDUCTION' ? 'خصم' : 'إجازة'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#343A40', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#ADB5BD' }}>
                                            {new Date(activity.time).toLocaleDateString('ar-SA')}
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: '0.85rem', fontWeight: 'bold', whiteSpace: 'nowrap',
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

                    <div className="card" style={{ background: 'linear-gradient(135deg, #1A237E 0%, #0D47A1 100%)', color: 'white' }}>
                        <h3 style={{ marginBottom: '12px', fontSize: '1.25rem' }}>هل تحتاج مساعدة؟</h3>
                        <p style={{ opacity: 0.9, marginBottom: '20px', fontSize: '0.9rem', lineHeight: '1.6' }}>
                            فريق الدعم الفني جاهز لمساعدتك في ضبط إعدادات النظام واحتساب المستحقات.
                        </p>
                        <button className="btn" style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', width: '100%', border: 'none', fontWeight: 'bold' }}>
                            تواصل مع الدعم
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Dashboard;
