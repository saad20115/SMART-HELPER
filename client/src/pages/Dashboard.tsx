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

    const CHART_COLORS = ['#6366F1', '#06B6D4', '#F59E0B', '#10B981'];

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
            gradient: 'linear-gradient(135deg, #6366F1, #818CF8)',
            shadowColor: 'rgba(99, 102, 241, 0.3)',
            icon: Briefcase,
            link: '/reports',
            isHero: true,
        },
        {
            title: 'إجمالي تعويضات الإجازات',
            value: formatCurrency(aggregatedData?.totalLeaveCompensation),
            sub: 'ر.س',
            accentColor: '#06B6D4',
            icon: FileOutput,
            link: '/aggregated-calculations',
        },
        {
            title: 'إجمالي مكافآت نهاية الخدمة',
            value: formatCurrency(aggregatedData?.totalNetEOS),
            sub: 'ر.س',
            accentColor: '#F59E0B',
            icon: TrendingUp,
            link: '/aggregated-calculations',
        },
        {
            title: 'متوسط سنوات الخدمة',
            value: `${(aggregatedData?.averageServiceYears || 0).toFixed(1)}`,
            valueSuffix: ' سنة',
            sub: aggregatedData ? `إجمالي: ${aggregatedData.totalEmployees}` : '...',
            detail: aggregatedData ? `نشط: ${aggregatedData.totalActiveEmployees} | منتهي: ${aggregatedData.totalTerminatedEmployees}` : '',
            accentColor: '#10B981',
            icon: Users,
            link: '/employees',
        },
        {
            title: 'إجمالي الخصومات الأخرى',
            value: formatCurrency(aggregatedData?.totalOtherDeductions),
            sub: 'ر.س',
            accentColor: '#EF4444',
            icon: ArrowDownLeft,
            link: '/reports',
        },
        {
            title: 'إجمالي خصم الإجازات',
            value: formatCurrency(aggregatedData?.totalLeaveDeductions),
            sub: 'ر.س',
            accentColor: '#F97316',
            icon: ArrowDownLeft,
            link: '/reports',
        }
    ];

    const quickActions = [
        { label: 'إضافة موظف', icon: Plus, gradient: 'linear-gradient(135deg, #6366F1, #818CF8)', link: '/employees' },
        { label: 'حساب نهاية خدمة', icon: Calculator, gradient: 'linear-gradient(135deg, #06B6D4, #22D3EE)', link: '/aggregated-calculations' },
        { label: 'مسير رواتب', icon: FileOutput, gradient: 'linear-gradient(135deg, #8B5CF6, #A78BFA)', link: '/reports' },
        { label: 'تسجيل إجازة', icon: CheckCircle, gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)', link: '/leave-management' },
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
                    border: '3px solid rgba(99, 102, 241, 0.2)',
                    borderTopColor: '#6366F1',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <span style={{ color: '#94A3B8', fontSize: '0.95rem' }}>جاري تحميل البيانات...</span>
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
                        fontSize: '1.6rem',
                        fontWeight: 800,
                        color: '#F1F5F9',
                        letterSpacing: '-0.02em',
                        marginBottom: '4px'
                    }}>
                        نظرة عامة <span style={{ color: '#818CF8' }}>للمجموعة</span>
                    </h2>
                    <p style={{ color: '#64748B', fontSize: '0.9rem' }}>
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
                            borderRadius: '12px',
                            border: '1px solid rgba(148, 163, 184, 0.1)',
                            fontWeight: 600,
                            fontSize: '0.88rem',
                            backgroundColor: 'rgba(30, 41, 59, 0.8)',
                            color: '#E2E8F0',
                            minWidth: '200px',
                            cursor: 'pointer',
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
                            borderRadius: '12px',
                            border: '1px solid rgba(148, 163, 184, 0.1)',
                            backgroundColor: 'rgba(30, 41, 59, 0.8)',
                            color: '#94A3B8',
                            cursor: 'pointer',
                            width: '42px',
                            height: '42px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 200ms ease',
                        }}
                        title="تحديث البيانات"
                        onMouseOver={(e) => { e.currentTarget.style.color = '#F1F5F9'; e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)'; }}
                    >
                        <RefreshCw size={17} className={loading ? 'spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
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
                            borderRadius: '16px',
                            background: card.isHero
                                ? card.gradient
                                : 'rgba(30, 41, 59, 0.6)',
                            backdropFilter: card.isHero ? 'none' : 'blur(12px)',
                            border: card.isHero
                                ? 'none'
                                : '1px solid rgba(148, 163, 184, 0.08)',
                            cursor: 'pointer',
                            transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                            opacity: loading ? 0.7 : 1,
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: card.isHero ? `0 8px 30px ${card.shadowColor}` : 'none',
                            height: '100%',
                        }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = card.isHero
                                    ? `0 12px 50px ${card.shadowColor}`
                                    : '0 8px 30px rgba(0,0,0,0.3)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = card.isHero
                                    ? `0 8px 30px ${card.shadowColor}`
                                    : 'none';
                            }}
                        >
                            {/* Decorative */}
                            {!card.isHero && (
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    width: '80px',
                                    height: '80px',
                                    background: `radial-gradient(circle, ${card.accentColor}10 0%, transparent 70%)`,
                                    borderRadius: '0 16px 0 0',
                                }} />
                            )}

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '16px'
                            }}>
                                <span style={{
                                    fontSize: '0.88rem',
                                    color: card.isHero ? 'rgba(255,255,255,0.85)' : '#94A3B8',
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
                                        : `${card.accentColor}15`,
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
                                    fontSize: '1.6rem',
                                    fontWeight: 800,
                                    color: card.isHero ? 'white' : '#F1F5F9',
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
                                        color: '#64748B',
                                        marginTop: '6px',
                                        fontFamily: 'Cairo, sans-serif',
                                    }}>
                                        {card.detail}
                                    </div>
                                )}
                                <div style={{
                                    fontSize: '0.78rem',
                                    color: card.isHero ? 'rgba(255,255,255,0.7)' : '#64748B',
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
                        borderRadius: '16px',
                        background: 'rgba(30, 41, 59, 0.6)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(148, 163, 184, 0.08)',
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '20px'
                        }}>
                            <Zap size={18} style={{ color: '#F59E0B' }} />
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F1F5F9' }}>الوصول السريع</h3>
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
                                        backgroundColor: 'rgba(148, 163, 184, 0.04)',
                                        border: '1px solid rgba(148, 163, 184, 0.08)',
                                        borderRadius: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 250ms ease',
                                        gap: '10px',
                                        textDecoration: 'none',
                                        color: 'inherit',
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.background = 'rgba(148, 163, 184, 0.08)';
                                        e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.15)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.background = 'rgba(148, 163, 184, 0.04)';
                                        e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.08)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div style={{
                                        background: action.gradient,
                                        padding: '10px',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                    }}>
                                        <action.icon size={20} style={{ color: 'white' }} />
                                    </div>
                                    <span style={{
                                        fontWeight: 600,
                                        color: '#CBD5E1',
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
                        borderRadius: '16px',
                        background: 'rgba(30, 41, 59, 0.6)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(148, 163, 184, 0.08)',
                        minHeight: '400px',
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '24px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Activity size={18} style={{ color: '#06B6D4' }} />
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F1F5F9' }}>هيكل الرواتب</h3>
                            </div>
                            {selectedCompanyId && (
                                <span style={{
                                    fontSize: '0.78rem',
                                    color: '#94A3B8',
                                    background: 'rgba(148, 163, 184, 0.08)',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    border: '1px solid rgba(148, 163, 184, 0.1)',
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
                                        stroke="rgba(15, 23, 42, 0.8)"
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
                                            border: '1px solid rgba(148,163,184,0.1)',
                                            background: 'rgba(30,41,59,0.95)',
                                            backdropFilter: 'blur(8px)',
                                            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                                            color: '#F1F5F9',
                                        }}
                                        itemStyle={{ color: '#CBD5E1' }}
                                        labelStyle={{ color: '#94A3B8' }}
                                    />
                                    <Legend
                                        iconType="circle"
                                        wrapperStyle={{ color: '#94A3B8', fontSize: '0.85rem' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{
                                height: '300px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(148, 163, 184, 0.03)',
                                borderRadius: '12px',
                                border: '2px dashed rgba(148, 163, 184, 0.1)',
                            }}>
                                <div style={{ textAlign: 'center', color: '#475569' }}>
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
                        borderRadius: '16px',
                        background: 'rgba(30, 41, 59, 0.6)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(148, 163, 184, 0.08)',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            padding: '20px 24px',
                            borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}>
                            <RefreshCw size={17} style={{ color: '#6366F1' }} />
                            <span style={{ fontWeight: 700, color: '#F1F5F9', fontSize: '1.05rem' }}>آخر العمليات</span>
                        </div>
                        <div>
                            {activities.length > 0 ? activities.map((activity, idx) => (
                                <div key={activity.id} style={{
                                    padding: '14px 24px',
                                    borderBottom: idx < activities.length - 1 ? '1px solid rgba(148,163,184,0.05)' : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                    transition: 'background 200ms ease',
                                    cursor: 'pointer',
                                    animation: `fadeIn 0.4s ease-out ${idx * 0.05}s both`,
                                }}
                                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(148,163,184,0.04)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <div style={{
                                        width: '38px',
                                        height: '38px',
                                        borderRadius: '10px',
                                        background: activity.type === 'DEDUCTION'
                                            ? 'rgba(239, 68, 68, 0.12)'
                                            : 'rgba(16, 185, 129, 0.12)',
                                        color: activity.type === 'DEDUCTION' ? '#F87171' : '#34D399',
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
                                            color: '#E2E8F0',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {activity.title}
                                        </div>
                                        <div style={{ fontSize: '0.73rem', color: '#64748B', marginTop: '2px' }}>
                                            {new Date(activity.time).toLocaleDateString('ar-SA')}
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 700,
                                        whiteSpace: 'nowrap',
                                        fontFamily: 'Inter, sans-serif',
                                        color: activity.amount.startsWith('-') ? '#F87171' : '#34D399',
                                    }}>
                                        {activity.amount}
                                    </div>
                                </div>
                            )) : (
                                <div style={{
                                    padding: '50px 20px',
                                    textAlign: 'center',
                                    color: '#475569'
                                }}>
                                    لا توجد عمليات حديثة
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Help Banner */}
                    <div style={{
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #1E3A5F 100%)',
                        padding: '28px',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        {/* Decorative elements */}
                        <div style={{
                            position: 'absolute',
                            top: '-20px',
                            left: '-20px',
                            width: '100px',
                            height: '100px',
                            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3), transparent)',
                            borderRadius: '50%',
                        }} />
                        <div style={{
                            position: 'absolute',
                            bottom: '-30px',
                            right: '-30px',
                            width: '120px',
                            height: '120px',
                            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.2), transparent)',
                            borderRadius: '50%',
                        }} />

                        <h3 style={{
                            marginBottom: '10px',
                            fontSize: '1.15rem',
                            color: '#F1F5F9',
                            fontWeight: 700,
                            position: 'relative',
                        }}>
                            هل تحتاج مساعدة؟
                        </h3>
                        <p style={{
                            color: 'rgba(203, 213, 225, 0.8)',
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
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
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
                            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
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
