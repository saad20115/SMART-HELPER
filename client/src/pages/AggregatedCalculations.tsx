import React, { useState, useEffect, useCallback } from 'react';
import { Users, TrendingUp, FileText, Download, Filter, Search, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { calculationsApi } from '../api/settingsService';

interface EmployeeEntitlement {
    id: string;
    employeeNumber: string;
    fullName: string;
    branch: string | null;
    department: string | null;
    classification: string | null;
    jobTitle: string;
    hireDate: string;
    endDate: string | null;
    serviceYears: number;
    basicSalary: number;
    totalSalary: number;
    grossEOS: number;
    netEOS: number;
    leaveCompensation: number;
    leaveBalanceDays: number;
    totalDeductions: number;
    finalPayable: number;
    isActive: boolean;
}

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
    employees: EmployeeEntitlement[];
    branchBreakdown: { branch: string; employeeCount: number; totalEntitlements: number }[];
    jobTitleBreakdown: { jobTitle: string; employeeCount: number; totalEntitlements: number }[];
}

const AggregatedCalculations: React.FC = () => {
    const [data, setData] = useState<AggregatedData | null>(null);
    const [loading, setLoading] = useState(false);

    // Filters
    const [fiscalYearEnd, setFiscalYearEnd] = useState('');
    const [branch, setBranch] = useState('');
    const [department, setDepartment] = useState('');
    const [classification, setClassification] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [status, setStatus] = useState('ALL');

    // Table state
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<keyof EmployeeEntitlement>('fullName');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (fiscalYearEnd) params.fiscalYearEnd = fiscalYearEnd;
            if (branch) params.branch = branch;
            if (department) params.department = department;
            if (classification) params.classification = classification;
            if (jobTitle) params.jobTitle = jobTitle;
            if (status) params.status = status;

            const result = await calculationsApi.getAggregated(params);
            setData(result);
        } catch (error) {
            console.error('Failed to fetch aggregated data', error);
        } finally {
            setLoading(false);
        }
    }, [fiscalYearEnd, branch, department, classification, jobTitle, status]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatCurrency = (val: number) => {
        return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('ar-SA');
    };

    const toggleRowExpansion = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const handleSort = (field: keyof EmployeeEntitlement) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Filter and sort employees
    const filteredAndSortedEmployees = (data?.employees || [])
        .filter(emp =>
            emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.employeeNumber.includes(searchQuery)
        )
        .sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];
            if (aVal === null) return 1;
            if (bVal === null) return -1;
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

    // Get unique branches and job titles for filters
    const uniqueBranches = Array.from(new Set((data?.employees || []).map(e => e.branch).filter(Boolean))) as string[];
    const uniqueJobTitles = Array.from(new Set((data?.employees || []).map(e => e.jobTitle).filter(Boolean))) as string[];

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111' }}>الحاسبة المجمعة للمستحقات</h2>
                    <p style={{ color: '#6C757D', marginTop: '4px' }}>عرض شامل لمستحقات جميع الموظفين مع تحليلات تفصيلية</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="btn"
                        onClick={fetchData}
                        disabled={loading}
                        style={{ backgroundColor: '#fff', border: '1px solid #6C757D', color: '#6C757D', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        <span>تحديث البيانات</span>
                    </button>
                    <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Download size={18} />
                        <span>تصدير Excel</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Filter size={20} color="#2E7D32" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>الفلاتر</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>السنة المالية</label>
                        <input
                            type="date"
                            value={fiscalYearEnd}
                            onChange={(e) => setFiscalYearEnd(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E9ECEF' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>الفرع</label>
                        <select
                            title="تصفية حسب الفرع"
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E9ECEF' }}
                        >
                            <option value="">كل الفروع</option>
                            {uniqueBranches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>المسمى الوظيفي</label>
                        <select
                            title="تصفية حسب المسمى الوظيفي"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E9ECEF' }}
                        >
                            <option value="">كل المسميات</option>
                            {uniqueJobTitles.map(j => <option key={j} value={j}>{j}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>القسم</label>
                        <select
                            title="تصفية حسب القسم"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E9ECEF' }}
                        >
                            <option value="">كل الأقسام</option>
                            {Array.from(new Set((data?.employees || []).map(e => e.department).filter(Boolean))).map(d => <option key={d} value={d!}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>التصنيف</label>
                        <select
                            title="تصفية حسب التصنيف"
                            value={classification}
                            onChange={(e) => setClassification(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E9ECEF' }}
                        >
                            <option value="">كل التصنيفات</option>
                            {Array.from(new Set((data?.employees || []).map(e => e.classification).filter(Boolean))).map(c => <option key={c} value={c!}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>حالة الموظف</label>
                        <select
                            title="تصفية حسب الحالة"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E9ECEF' }}
                        >
                            <option value="ALL">الكل</option>
                            <option value="ACTIVE">نشط</option>
                            <option value="TERMINATED">منتهي الخدمة</option>
                        </select>
                    </div>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ marginTop: '16px', width: '100%' }}
                >
                    {loading ? 'جاري التحميل...' : 'تطبيق الفلاتر'}
                </button>
            </div>

            {data && (
                <>
                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                        <div className="card" style={{ background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)', color: 'white', padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <Users size={32} />
                                <div>
                                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>إجمالي الموظفين</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{data.summary.totalEmployees}</div>
                                </div>
                            </div>
                            <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                                نشط: {data.summary.totalActiveEmployees} | منتهي: {data.summary.totalTerminatedEmployees}
                            </div>
                        </div>

                        <div className="card" style={{ borderTop: '4px solid #2E7D32' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <TrendingUp size={24} color="#2E7D32" />
                                <span style={{ fontSize: '0.9rem', color: '#6C757D' }}>متوسط سنوات الخدمة</span>
                            </div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#2E7D32' }}>
                                {data.summary.averageServiceYears.toFixed(1)} سنة
                            </div>
                        </div>

                        <div className="card" style={{ borderTop: '4px solid #FF9800' }}>
                            <div style={{ fontSize: '0.9rem', color: '#6C757D', marginBottom: '8px' }}>إجمالي مكافآت نهاية الخدمة</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#FF9800' }}>
                                {formatCurrency(data.summary.totalNetEOS)} ر.س
                            </div>
                        </div>

                        <div className="card" style={{ borderTop: '4px solid #1976D2' }}>
                            <div style={{ fontSize: '0.9rem', color: '#6C757D', marginBottom: '8px' }}>إجمالي تعويضات الإجازات</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1976D2' }}>
                                {formatCurrency(data.summary.totalLeaveCompensation)} ر.س
                            </div>
                        </div>

                        <div className="card" style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', color: '#333' }}>
                            <div style={{ fontSize: '0.9rem', marginBottom: '8px', fontWeight: '600' }}>صافي المبالغ المستحقة</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>
                                {formatCurrency(data.summary.totalFinalPayable)} ر.س
                            </div>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>تفاصيل الموظفين</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '400px', marginLeft: '20px' }}>
                                <Search size={20} color="#ADB5BD" />
                                <input
                                    type="text"
                                    placeholder="بحث بالاسم أو رقم الموظف..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #E9ECEF' }}
                                />
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#F8F9FA', borderBottom: '2px solid #E9ECEF' }}>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }} onClick={() => handleSort('fullName')}>
                                            اسم الموظف {sortField === 'fullName' && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem' }}>الرقم الوظيفي</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }} onClick={() => handleSort('branch')}>
                                            الفرع {sortField === 'branch' && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }} onClick={() => handleSort('serviceYears')}>
                                            سنوات الخدمة {sortField === 'serviceYears' && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }} onClick={() => handleSort('basicSalary')}>
                                            الراتب الأساسي {sortField === 'basicSalary' && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }} onClick={() => handleSort('totalSalary')}>
                                            الراتب الشامل {sortField === 'totalSalary' && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem' }}>رصيد الإجازات</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }} onClick={() => handleSort('leaveCompensation')}>
                                            قيمة الإجازات {sortField === 'leaveCompensation' && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }} onClick={() => handleSort('finalPayable')}>
                                            إجمالي المستحقات {sortField === 'finalPayable' && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', fontSize: '0.9rem' }}>الحالة</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', fontSize: '0.9rem' }}>التفاصيل</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAndSortedEmployees.map((emp) => (
                                        <React.Fragment key={emp.id}>
                                            <tr style={{ borderBottom: '1px solid #F1F3F5', transition: 'background 0.2s' }} className="hover-bg">
                                                <td style={{ padding: '14px 16px', fontWeight: '600' }}>{emp.fullName}</td>
                                                <td style={{ padding: '14px 16px', color: '#6C757D' }}>{emp.employeeNumber}</td>
                                                <td style={{ padding: '14px 16px', color: '#6C757D' }}>{emp.branch || '-'}</td>
                                                <td style={{ padding: '14px 16px' }}>{emp.serviceYears.toFixed(1)}</td>
                                                <td style={{ padding: '14px 16px', fontWeight: '600' }}>{formatCurrency(emp.basicSalary || 0)}</td>
                                                <td style={{ padding: '14px 16px', fontWeight: '600', color: '#2E7D32' }}>{formatCurrency(emp.totalSalary || 0)}</td>
                                                <td style={{ padding: '14px 16px', fontWeight: '600' }}>{Number(emp.leaveBalanceDays || 0).toFixed(2)} يوم</td>
                                                <td style={{ padding: '14px 16px', color: '#1976D2', fontWeight: '600' }}>{formatCurrency(emp.leaveCompensation)}</td>
                                                <td style={{ padding: '14px 16px', fontWeight: '700', color: '#2E7D32' }}>{formatCurrency(emp.finalPayable)}</td>
                                                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: '600',
                                                        backgroundColor: emp.isActive ? '#E8F5E9' : '#FFEBEE',
                                                        color: emp.isActive ? '#2E7D32' : '#C62828'
                                                    }}>
                                                        {emp.isActive ? 'نشط' : 'منتهي'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => toggleRowExpansion(emp.id)}
                                                        style={{
                                                            border: 'none',
                                                            background: 'transparent',
                                                            cursor: 'pointer',
                                                            color: '#2E7D32'
                                                        }}
                                                    >
                                                        {expandedRows.has(emp.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedRows.has(emp.id) && (
                                                <tr>
                                                    <td colSpan={11} style={{ backgroundColor: '#F8F9FA', padding: '20px' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                                            <div>
                                                                <div style={{ fontSize: '0.8rem', color: '#6C757D', marginBottom: '4px' }}>المسمى الوظيفي</div>
                                                                <div style={{ fontWeight: '600' }}>{emp.jobTitle}</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '0.8rem', color: '#6C757D', marginBottom: '4px' }}>التصنيف</div>
                                                                <div style={{ fontWeight: '600' }}>{emp.classification || '-'}</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '0.8rem', color: '#6C757D', marginBottom: '4px' }}>القسم</div>
                                                                <div style={{ fontWeight: '600' }}>{emp.department || '-'}</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '0.8rem', color: '#6C757D', marginBottom: '4px' }}>تاريخ التوظيف</div>
                                                                <div style={{ fontWeight: '600' }}>{formatDate(emp.hireDate)}</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '0.8rem', color: '#6C757D', marginBottom: '4px' }}>تاريخ انتهاء الخدمة</div>
                                                                <div style={{ fontWeight: '600' }}>{formatDate(emp.endDate)}</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '0.8rem', color: '#6C757D', marginBottom: '4px' }}>مكافأة نهاية الخدمة <span style={{ fontSize: '0.7rem', color: '#FF9800' }}>(على الراتب الأساسي)</span></div>
                                                                <div style={{ fontWeight: '600', color: '#FF9800' }}>{formatCurrency(emp.netEOS)} ر.س</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '0.8rem', color: '#6C757D', marginBottom: '4px' }}>تعويض الإجازات <span style={{ fontSize: '0.7rem', color: '#1976D2' }}>(على الراتب الشامل)</span></div>
                                                                <div style={{ fontWeight: '600', color: '#1976D2' }}>{formatCurrency(emp.leaveCompensation)} ر.س</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '0.8rem', color: '#6C757D', marginBottom: '4px' }}>الخصومات</div>
                                                                <div style={{ fontWeight: '600', color: '#DC3545' }}>{formatCurrency(emp.totalDeductions)} ر.س</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {filteredAndSortedEmployees.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#ADB5BD' }}>
                                <FileText size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                                <p>لا توجد بيانات متطابقة مع البحث</p>
                            </div>
                        )}
                    </div>

                    {/* Breakdowns */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '32px' }}>
                        <div className="card">
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '20px' }}>توزيع المستحقات حسب الفرع</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {data.branchBreakdown.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#F8F9FA', borderRadius: '8px' }}>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{item.branch}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#6C757D' }}>{item.employeeCount} موظف</div>
                                        </div>
                                        <div style={{ fontWeight: '700', color: '#2E7D32' }}>{formatCurrency(item.totalEntitlements)} ر.س</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card">
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '20px' }}>توزيع المستحقات حسب المسمى الوظيفي</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {data.jobTitleBreakdown.slice(0, 10).map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#F8F9FA', borderRadius: '8px' }}>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{item.jobTitle}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#6C757D' }}>{item.employeeCount} موظف</div>
                                        </div>
                                        <div style={{ fontWeight: '700', color: '#1976D2' }}>{formatCurrency(item.totalEntitlements)} ر.س</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AggregatedCalculations;
