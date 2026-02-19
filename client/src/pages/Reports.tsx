import React, { useState, useEffect, useCallback } from 'react';
import {
    Users,
    TrendingUp,
    FileText,
    Download,
    PieChart as PieChartIcon,
    BarChart as BarChartIcon,
    ArrowUpRight
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { calculationsApi } from '../api/settingsService';

interface AggregatedData {
    summary: {
        totalEmployees: number;
        totalActiveEmployees: number;
        totalTerminatedEmployees: number;
        totalGrossEOS: number;
        totalNetEOS: number;
        totalLeaveCompensation: number;
        totalDeductions: number;
        totalFinalPayable: number;
        averageServiceYears: number;
    };
    employees: {
        id: string;
        fullName: string;
        branch: string | null;
        department: string | null;
        classification: string | null;
        jobTitle: string;
    }[];
    branchBreakdown: { branch: string; employeeCount: number; totalEntitlements: number }[];
    jobTitleBreakdown: { jobTitle: string; employeeCount: number; totalEntitlements: number }[];
}

const COLORS = ['#2E7D32', '#1976D2', '#FF9800', '#DC3545', '#6610F2', '#00BCD4', '#E91E63', '#4CAF50'];

const Reports: React.FC = () => {
    const [data, setData] = useState<AggregatedData | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('ALL');
    const [branch, setBranch] = useState('');
    const [department, setDepartment] = useState('');
    const [classification, setClassification] = useState('');
    const [dateFilter, setDateFilter] = useState<string>('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (status !== 'ALL') params.status = status;
            if (branch) params.branch = branch;
            if (department) params.department = department;
            if (classification) params.classification = classification;
            if (dateFilter) params.fiscalYearEnd = dateFilter;

            const result = await calculationsApi.getAggregated(params);
            setData(result);
        } catch (error) {
            console.error('Failed to fetch report data', error);
        } finally {
            setLoading(false);
        }
    }, [status, branch, department, classification, dateFilter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatCurrency = (val: number | undefined | null) => {
        if (val === undefined || val === null || isNaN(val)) return '0';
        return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    };

    if (loading && !data) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>جاري تحميل التقارير...</div>;
    }

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111' }}>مركز التقارير والتحليلات</h2>
                    <p style={{ color: '#6C757D', marginTop: '4px' }}>نظرة عامة على البيانات المالية والقوى العاملة</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #E9ECEF', fontWeight: 'bold', minWidth: '150px' }}
                    >
                        <option value="ALL">كل الموظفين</option>
                        <option value="ACTIVE">الموظفون الحاليون</option>
                        <option value="TERMINATED">الموظفون المنهية خدمتهم</option>
                    </select>
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #E9ECEF', fontWeight: 'bold' }}
                        title="تاريخ التقرير (حتى)"
                    />
                    <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Download size={18} />
                        <span>تصدير</span>
                    </button>
                </div>
            </div>

            {/* Filters Row */}
            <div className="card" style={{ marginBottom: '32px', padding: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: '#495057' }}>تصفية حسب:</span>
                    <select
                        title="الفرع"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #CED4DA', minWidth: '140px' }}
                    >
                        <option value="">كل الفروع</option>
                        {Array.from(new Set((data?.employees || []).map(e => e.branch).filter(Boolean))).map(b => (
                            <option key={b} value={b!}>{b}</option>
                        ))}
                    </select>
                    <select
                        title="القسم"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #CED4DA', minWidth: '140px' }}
                    >
                        <option value="">كل الأقسام</option>
                        {Array.from(new Set((data?.employees || []).map(e => e.department).filter(Boolean))).map(d => (
                            <option key={d} value={d!}>{d}</option>
                        ))}
                    </select>
                    <select
                        title="التصنيف"
                        value={classification}
                        onChange={(e) => setClassification(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #CED4DA', minWidth: '140px' }}
                    >
                        <option value="">كل التصنيفات</option>
                        {Array.from(new Set((data?.employees || []).map(e => e.classification).filter(Boolean))).map(c => (
                            <option key={c} value={c!}>{c}</option>
                        ))}
                    </select>
                    {(branch || department || classification) && (
                        <button
                            onClick={() => { setBranch(''); setDepartment(''); setClassification(''); }}
                            style={{ color: '#DC3545', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}
                        >
                            مسح التصفيات
                        </button>
                    )}
                </div>
            </div>

            {data && (
                <>
                    {/* Key Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid #2E7D32' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ color: '#6C757D', fontSize: '0.9rem', fontWeight: '600' }}>إجمالي الالتزامات المالية</div>
                                <div style={{ padding: '6px', backgroundColor: '#E8F5E9', borderRadius: '8px', color: '#2E7D32' }}>
                                    <ArrowUpRight size={18} />
                                </div>
                            </div>
                            <div style={{ fontSize: '1.85rem', fontWeight: 'bold', color: '#343A40' }}>{formatCurrency(data.summary.totalFinalPayable)} <small style={{ fontSize: '0.9rem', color: '#ADB5BD' }}>ر.س</small></div>
                            <div style={{ fontSize: '0.8rem', color: '#6C757D' }}>يشمل نهاية الخدمة والإجازات</div>
                        </div>

                        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid #EF6C00' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ color: '#6C757D', fontSize: '0.9rem', fontWeight: '600' }}>مكافآت نهاية الخدمة</div>
                                <div style={{ padding: '6px', backgroundColor: '#FFF3E0', borderRadius: '8px', color: '#EF6C00' }}>
                                    <TrendingUp size={18} />
                                </div>
                            </div>
                            <div style={{ fontSize: '1.85rem', fontWeight: 'bold', color: '#343A40' }}>{formatCurrency(data.summary.totalNetEOS)} <small style={{ fontSize: '0.9rem', color: '#ADB5BD' }}>ر.س</small></div>
                            <div style={{ fontSize: '0.8rem', color: '#6C757D' }}>
                                {((data.summary.totalNetEOS / (data.summary.totalFinalPayable || 1)) * 100).toFixed(1)}% من الإجمالي
                            </div>
                        </div>

                        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid #1976D2' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ color: '#6C757D', fontSize: '0.9rem', fontWeight: '600' }}>تعويضات الإجازات</div>
                                <div style={{ padding: '6px', backgroundColor: '#E3F2FD', borderRadius: '8px', color: '#1976D2' }}>
                                    <FileText size={18} />
                                </div>
                            </div>
                            <div style={{ fontSize: '1.85rem', fontWeight: 'bold', color: '#343A40' }}>{formatCurrency(data.summary.totalLeaveCompensation)} <small style={{ fontSize: '0.9rem', color: '#ADB5BD' }}>ر.س</small></div>
                            <div style={{ fontSize: '0.8rem', color: '#6C757D' }}>
                                {((data.summary.totalLeaveCompensation / (data.summary.totalFinalPayable || 1)) * 100).toFixed(1)}% من الإجمالي
                            </div>
                        </div>

                        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid #7B1FA2' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ color: '#6C757D', fontSize: '0.9rem', fontWeight: '600' }}>مؤشرات القوى العاملة</div>
                                <div style={{ padding: '6px', backgroundColor: '#F3E5F5', borderRadius: '8px', color: '#7B1FA2' }}>
                                    <Users size={18} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#343A40' }}>{data.summary.totalEmployees} <small style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>موظف</small></div>
                                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6C757D' }}>{data.summary.averageServiceYears.toFixed(1)} سنة (متوسط)</div>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#6C757D' }}>{data.summary.totalActiveEmployees} نشط • {data.summary.totalTerminatedEmployees} مفصول</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '32px', marginBottom: '40px' }}>

                        {/* Leave Liability by Department */}
                        <div className="card" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ padding: '8px', backgroundColor: '#E3F2FD', borderRadius: '8px', color: '#1976D2' }}>
                                        <BarChartIcon size={20} />
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>مستحقات الإجازات حسب القسم</h3>
                                </div>
                            </div>
                            <div style={{ flex: 1, width: '100%' }}>
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart data={data.departmentBreakdown.filter(d => d.totalLeaveCompensation > 0)}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9ECEF" />
                                        <XAxis
                                            dataKey="department"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6C757D', fontSize: 12, fontWeight: 500 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6C757D', fontSize: 12 }}
                                            tickFormatter={(val) => `${val / 1000}k`}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            cursor={{ fill: '#F8F9FA' }}
                                            formatter={(value: any, name: any) => {
                                                const val = Array.isArray(value) ? Number(value[0]) : Number(value);
                                                const newName = name === 'totalLeaveCompensation' ? 'تعويض الإجازات' : name;
                                                return [val.toLocaleString() + ' ر.س', newName];
                                            }}
                                        />
                                        <Bar
                                            dataKey="totalLeaveCompensation"
                                            fill="#1976D2"
                                            radius={[6, 6, 0, 0]}
                                            barSize={32}
                                            name="تعويض الإجازات"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Branch Breakdown Chart */}
                        <div className="card" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ padding: '8px', backgroundColor: '#E8F5E9', borderRadius: '8px', color: '#2E7D32' }}>
                                        <PieChartIcon size={20} />
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>إجمالي الالتزامات حسب الفرع</h3>
                                </div>
                            </div>
                            <div style={{ flex: 1, width: '100%' }}>
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart data={data.branchBreakdown}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9ECEF" />
                                        <XAxis
                                            dataKey="branch"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6C757D', fontSize: 12, fontWeight: 500 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6C757D', fontSize: 12 }}
                                            tickFormatter={(val) => `${val / 1000}k`}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            cursor={{ fill: '#F8F9FA' }}
                                            formatter={(value: any) => {
                                                const val = Array.isArray(value) ? Number(value[0]) : Number(value);
                                                return [val.toLocaleString() + ' ر.س', 'إجمالي المستحقات'];
                                            }}
                                        />
                                        <Bar
                                            dataKey="totalEntitlements"
                                            fill="#2E7D32"
                                            radius={[6, 6, 0, 0]}
                                            barSize={32}
                                            name="إجمالي المستحقات"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Job Title Breakdown Chart */}
                        <div className="card" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ padding: '8px', backgroundColor: '#FFF3E0', borderRadius: '8px', color: '#EF6C00' }}>
                                        <Users size={20} />
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>توزيع القوى العاملة</h3>
                                </div>
                            </div>
                            <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={data.jobTitleBreakdown.slice(0, 8)}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={110}
                                            paddingAngle={4}
                                            dataKey="employeeCount"
                                            nameKey="jobTitle"
                                        >
                                            {data.jobTitleBreakdown.slice(0, 8).map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>

                    {/* Detailed Breakdown Tables section starts here (kept relatively similar but styled) */}
                    <div className="card">
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '20px' }}>أعلى الفروع من حيث الالتزامات</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #E9ECEF', textAlign: 'right' }}>
                                        <th style={{ padding: '12px 16px', color: '#6C757D', fontWeight: '600', fontSize: '0.9rem' }}>الفرع</th>
                                        <th style={{ padding: '12px 16px', color: '#6C757D', fontWeight: '600', fontSize: '0.9rem' }}>عدد الموظفين</th>
                                        <th style={{ padding: '12px 16px', color: '#6C757D', fontWeight: '600', fontSize: '0.9rem' }}>تعويضات الإجازات</th>
                                        <th style={{ padding: '12px 16px', color: '#6C757D', fontWeight: '600', fontSize: '0.9rem' }}>إجمالي المستحقات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...data.branchBreakdown].sort((a, b) => b.totalEntitlements - a.totalEntitlements).slice(0, 5).map((item, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #F1F3F5' }}>
                                            <td style={{ padding: '16px', fontWeight: '600', color: '#343A40' }}>{item.branch}</td>
                                            <td style={{ padding: '16px' }}>{item.employeeCount}</td>
                                            <td style={{ padding: '16px', fontWeight: '600', color: '#1976D2' }}>{formatCurrency(item.totalLeaveCompensation)} ر.س</td>
                                            <td style={{ padding: '16px', fontWeight: '700', color: '#2E7D32' }}>{formatCurrency(item.totalEntitlements)} ر.س</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '20px' }}>كثافة الموظفين حسب المسمى الوظيفي</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #E9ECEF', textAlign: 'right' }}>
                                        <th style={{ padding: '12px 8px', color: '#6C757D', fontWeight: '600' }}>المسمى الوظيفي</th>
                                        <th style={{ padding: '12px 8px', color: '#6C757D', fontWeight: '600' }}>عدد الموظفين</th>
                                        <th style={{ padding: '12px 8px', color: '#6C757D', fontWeight: '600' }}>المتوسط للموظف</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...data.jobTitleBreakdown].sort((a, b) => b.employeeCount - a.employeeCount).slice(0, 5).map((item, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #F1F3F5' }}>
                                            <td style={{ padding: '12px 8px', fontWeight: '600' }}>{item.jobTitle}</td>
                                            <td style={{ padding: '12px 8px' }}>{item.employeeCount}</td>
                                            <td style={{ padding: '12px 8px', fontWeight: '600', color: '#1976D2' }}>
                                                {formatCurrency(item.totalEntitlements / item.employeeCount)} ر.س
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Reports;
