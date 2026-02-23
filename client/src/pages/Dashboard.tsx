import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, Briefcase, Plus, Calculator, FileOutput, CheckCircle, RefreshCw, ArrowDownLeft, ChevronLeft, Activity, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { dashboardApi, companiesApi, calculationsApi } from '../api/settingsService';
import type { DashboardStats, Activity as ActivityType, Company } from '../api/settingsService';

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
    const [statsData, setStatsData] = useState<DashboardStats | null>(null);
    const [aggregatedData, setAggregatedData] = useState<AggregatedSummary | null>(null);
    const [activities, setActivities] = useState<ActivityType[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = useCallback(async (companyId?: string) => {
        try {
            setLoading(true);
            const [stats, activity, aggregatedResult] = await Promise.all([
                dashboardApi.getStats(companyId || undefined),
                dashboardApi.getActivity(companyId || undefined),
                calculationsApi.getAggregated(companyId ? { companyId } : {})
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

    const CHART_COLORS = ['#4F46E5', '#0891B2', '#D97706', '#059669'];

    const salaryChartData = statsData?.salaryChart ? [
        { name: 'الراتب الأساسي', value: statsData.salaryChart.basicSalary },
        { name: 'بدل السكن', value: statsData.salaryChart.housingAllowance },
        { name: 'بدل النقل', value: statsData.salaryChart.transportAllowance },
        { name: 'بدلات أخرى', value: statsData.salaryChart.otherAllowances },
    ].filter(d => d.value > 0) : [];

    const formatCurrency = (val: number | undefined | null) => {
        if (val === undefined || val === null || isNaN(val)) return '0.00';
        return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const summaryCards = [
        {
            title: 'صافي المبالغ المستحقة',
            value: formatCurrency(aggregatedData?.totalFinalPayable),
            sub: 'ر.س',
            gradient: 'linear-gradient(135deg, #4F46E5, #6366F1)',
            shadowColor: 'rgba(79, 70, 229, 0.25)',
            icon: Briefcase,
            link: '/reports',
            isHero: true,
        },
        {
            title: 'إجمالي تعويضات الإجازات',
            value: formatCurrency(aggregatedData?.totalLeaveCompensation),
            sub: 'ر.س',
            accentColor: '#0891B2',
            icon: FileOutput,
            link: '/aggregated-calculations',
        },
        {
            title: 'صافي نهاية الخدمة',
            value: formatCurrency(
                (aggregatedData?.totalFinalPayable ?? 0) - (aggregatedData?.totalLeaveCompensation ?? 0)
            ),
            sub: 'ر.س',
            accentColor: '#D97706',
            icon: TrendingUp,
            link: '/aggregated-calculations',
        },
        {
            title: 'متوسط سنوات الخدمة',
            value: `${(aggregatedData?.averageServiceYears || 0).toFixed(1)}`,
            valueSuffix: ' سنة',
            sub: aggregatedData ? `إجمالي: ${aggregatedData.totalEmployees}` : '...',
            detail: aggregatedData ? `نشط: ${aggregatedData.totalActiveEmployees} | منتهي: ${aggregatedData.totalTerminatedEmployees}` : '',
            accentColor: '#059669',
            icon: Users,
            link: '/employees',
        },
        {
            title: 'إجمالي الخصومات الأخرى',
            value: formatCurrency(aggregatedData?.totalOtherDeductions),
            sub: 'ر.س',
            accentColor: '#DC2626',
            icon: ArrowDownLeft,
            link: '/reports',
        },
        {
            title: 'إجمالي خصم الإجازات',
            value: formatCurrency(aggregatedData?.totalLeaveDeductions),
            sub: 'ر.س',
            accentColor: '#EA580C',
            icon: ArrowDownLeft,
            link: '/reports',
        }
    ];

    const quickActions = [
        { label: 'إضافة موظف', icon: Plus, gradient: 'linear-gradient(135deg, #4F46E5, #6366F1)', link: '/employees' },
        { label: 'حساب نهاية خدمة', icon: Calculator, gradient: 'linear-gradient(135deg, #0891B2, #06B6D4)', link: '/aggregated-calculations' },
        { label: 'مسير رواتب', icon: FileOutput, gradient: 'linear-gradient(135deg, #7C3AED, #8B5CF6)', link: '/reports' },
        { label: 'تسجيل إجازة', icon: CheckCircle, gradient: 'linear-gradient(135deg, #D97706, #F59E0B)', link: '/leave-management' },
    ];

    if (loading && !statsData && !aggregatedData) {
        return (
            <div style={{
                padding: '80px 40px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    border: '3px solid var(--border)',
                    borderTopColor: 'var(--primary)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>جاري تحميل البيانات...</span>
            </div>
        );
    }

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            {/* Header Section */}
            <div style={{
                marginBottom: '28px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div>
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.02em',
                        marginBottom: '4px'
                    }}>
                        نظرة عامة <span style={{ color: 'var(--primary)' }}>للمجموعة</span>
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        تقرير مالي وتشغيلي موحد • {new Date().toLocaleDateString('ar-SA')}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select
                        title="تصفية حسب الشركة"
                        value={selectedCompanyId}
                        onChange={(e) => handleCompanyChange(e.target.value)}
                        style={{
                            padding: '10px 40px 10px 16px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border)',
                            fontWeight: 600,
                            fontSize: '0.88rem',
                            backgroundColor: 'var(--bg-card)',
                            color: 'var(--text-primary)',
                            minWidth: '200px',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
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
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--bg-card)',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            width: '42px',
                            height: '42px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 200ms ease',
                        }}
                        title="تحديث البيانات"
                    >
                        <RefreshCw size={17} className={loading ? 'spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                {summaryCards.map((card, index) => (
                    <Link
                        key={index}
                        to={card.link}
                        style={{
                            display: 'block',
                            textDecoration: 'none',
                            color: 'inherit',
                            animation: `fadeIn 0.5s ease-out ${index * 0.08}s both`,
                        }}
                    >
                        <div style={{
                            padding: '22px',
                            borderRadius: 'var(--radius-lg)',
                            background: card.isHero
                                ? card.gradient
                                : 'var(--bg-card)',
                            border: card.isHero
                                ? 'none'
                                : '1px solid var(--border)',
                            cursor: 'pointer',
                            transition: 'all 250ms ease',
                            opacity: loading ? 0.7 : 1,
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: card.isHero ? `0 8px 25px ${card.shadowColor}` : 'var(--shadow-sm)',
                            height: '100%',
                        }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-3px)';
                                e.currentTarget.style.boxShadow = card.isHero
                                    ? `0 12px 40px ${card.shadowColor}`
                                    : 'var(--shadow-lg)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = card.isHero
                                    ? `0 8px 25px ${card.shadowColor}`
                                    : 'var(--shadow-sm)';
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '14px'
                            }}>
                                <span style={{
                                    fontSize: '0.88rem',
                                    color: card.isHero ? 'rgba(255,255,255,0.85)' : 'var(--text-secondary)',
                                    fontWeight: 600,
                                }}>
                                    {card.title}
                                </span>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    background: card.isHero
                                        ? 'rgba(255,255,255,0.15)'
                                        : `${card.accentColor}12`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: card.isHero ? 'white' : card.accentColor,
                                    flexShrink: 0,
                                }}>
                                    <card.icon size={18} />
                                </div>
                            </div>

                            <div>
                                <div style={{
                                    fontSize: '1.5rem',
                                    fontWeight: 800,
                                    color: card.isHero ? 'white' : 'var(--text-primary)',
                                    fontFamily: 'Inter, Cairo, sans-serif',
                                    fontVariantNumeric: 'tabular-nums',
                                    direction: 'ltr',
                                    textAlign: 'right',
                                    lineHeight: 1.2,
                                }}>
                                    {card.value}{card.valueSuffix && <span style={{ fontSize: '0.9rem', fontWeight: 600, marginRight: '4px' }}>{card.valueSuffix}</span>}
                                </div>
                                {card.detail && (
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--text-muted)',
                                        marginTop: '6px',
                                    }}>
                                        {card.detail}
                                    </div>
                                )}
                                <div style={{
                                    fontSize: '0.78rem',
                                    color: card.isHero ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
                                    marginTop: card.detail ? '2px' : '6px',
                                }}>
                                    {card.sub}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Two Column Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                gap: '20px',
                alignItems: 'start'
            }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Quick Actions */}
                    <div style={{
                        padding: '24px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-sm)',
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '20px'
                        }}>
                            <Zap size={18} style={{ color: 'var(--warning)' }} />
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>الوصول السريع</h3>
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '12px'
                        }}>
                            {quickActions.map((action, idx) => (
                                <Link
                                    key={idx}
                                    to={action.link}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '20px 8px',
                                        backgroundColor: 'var(--bg-hover)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 250ms ease',
                                        gap: '10px',
                                        textDecoration: 'none',
                                        color: 'inherit',
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div style={{
                                        background: action.gradient,
                                        padding: '10px',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    }}>
                                        <action.icon size={20} style={{ color: 'white' }} />
                                    </div>
                                    <span style={{
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.82rem',
                                        textAlign: 'center',
                                    }}>
                                        {action.label}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Salary Chart */}
                    <div style={{
                        padding: '24px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-sm)',
                        minHeight: '400px',
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '24px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Activity size={18} style={{ color: 'var(--accent)' }} />
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>هيكل الرواتب</h3>
                            </div>
                            {selectedCompanyId && (
                                <span style={{
                                    fontSize: '0.78rem',
                                    color: 'var(--text-muted)',
                                    background: 'var(--bg-hover)',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    border: '1px solid var(--border)',
                                }}>
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
                                        innerRadius={75}
                                        outerRadius={115}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                        stroke="var(--bg-card)"
                                        strokeWidth={2}
                                    >
                                        {salaryChartData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number | undefined) => (value ?? 0).toLocaleString('ar-SA') + ' ر.س'}
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: '1px solid var(--border)',
                                            background: 'var(--bg-card)',
                                            boxShadow: 'var(--shadow-lg)',
                                            color: 'var(--text-primary)',
                                        }}
                                        itemStyle={{ color: 'var(--text-secondary)' }}
                                        labelStyle={{ color: 'var(--text-muted)' }}
                                    />
                                    <Legend
                                        iconType="circle"
                                        wrapperStyle={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{
                                height: '300px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'var(--bg-hover)',
                                borderRadius: '12px',
                                border: '2px dashed var(--border)',
                            }}>
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <Calculator size={44} style={{ marginBottom: '16px', opacity: 0.4 }} />
                                    <p>لا توجد بيانات رواتب لعرضها</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Recent Activity */}
                    <div style={{
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-sm)',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            padding: '20px 24px',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}>
                            <RefreshCw size={17} style={{ color: 'var(--primary)' }} />
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>آخر العمليات</span>
                        </div>
                        <div>
                            {activities.length > 0 ? activities.map((activity, idx) => (
                                <div key={activity.id} style={{
                                    padding: '14px 24px',
                                    borderBottom: idx < activities.length - 1 ? '1px solid var(--border)' : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                    transition: 'background 200ms ease',
                                    cursor: 'pointer',
                                    animation: `fadeIn 0.4s ease-out ${idx * 0.05}s both`,
                                }}
                                    onMouseOver={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <div style={{
                                        width: '38px',
                                        height: '38px',
                                        borderRadius: '10px',
                                        background: activity.type === 'DEDUCTION'
                                            ? 'var(--danger-bg)'
                                            : 'var(--success-bg)',
                                        color: activity.type === 'DEDUCTION' ? 'var(--danger)' : 'var(--success)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        flexShrink: 0,
                                    }}>
                                        {activity.type === 'DEDUCTION' ? 'خصم' : 'إجازة'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: '0.88rem',
                                            fontWeight: 600,
                                            color: 'var(--text-primary)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {activity.title}
                                        </div>
                                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            {new Date(activity.time).toLocaleDateString('ar-SA')}
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 700,
                                        whiteSpace: 'nowrap',
                                        fontFamily: 'Inter, sans-serif',
                                        color: activity.amount.startsWith('-') ? 'var(--danger)' : 'var(--success)',
                                    }}>
                                        {activity.amount}
                                    </div>
                                </div>
                            )) : (
                                <div style={{
                                    padding: '50px 20px',
                                    textAlign: 'center',
                                    color: 'var(--text-muted)'
                                }}>
                                    لا توجد عمليات حديثة
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Help Banner */}
                    <div style={{
                        borderRadius: 'var(--radius-lg)',
                        background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 50%, #0E7490 100%)',
                        padding: '28px',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: '-20px',
                            left: '-20px',
                            width: '100px',
                            height: '100px',
                            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15), transparent)',
                            borderRadius: '50%',
                        }} />
                        <div style={{
                            position: 'absolute',
                            bottom: '-30px',
                            right: '-30px',
                            width: '120px',
                            height: '120px',
                            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1), transparent)',
                            borderRadius: '50%',
                        }} />

                        <h3 style={{
                            marginBottom: '10px',
                            fontSize: '1.15rem',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            position: 'relative',
                        }}>
                            هل تحتاج مساعدة؟
                        </h3>
                        <p style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            marginBottom: '20px',
                            fontSize: '0.88rem',
                            lineHeight: 1.7,
                            position: 'relative',
                        }}>
                            فريق الدعم الفني جاهز لمساعدتك في ضبط إعدادات النظام واحتساب المستحقات.
                        </p>
                        <button style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.15)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            color: 'white',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 200ms ease',
                            fontFamily: 'Cairo, sans-serif',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            position: 'relative',
                        }}
                            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                        >
                            تواصل مع الدعم
                            <ChevronLeft size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
