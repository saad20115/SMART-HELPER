import React, { useState, useEffect, useCallback } from 'react';
import { Users, TrendingUp, FileText, Download, Filter, Search, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { calculationsApi, companiesApi } from '../api/settingsService';
import type { Company } from '../api/settingsService';

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
    leaveDeductions: number;
    otherDeductions: number;
    totalDeductions: number;
    finalPayable: number;
    isActive: boolean;
    entitlementRatio: number;
}

interface AggregatedData {
    summary: {
        totalEmployees: number;
        totalActiveEmployees: number;
        totalTerminatedEmployees: number;
        totalGrossEOS: number;
        totalNetEOS: number;
        totalLeaveCompensation: number;
        totalLeaveDeductions: number;
        totalOtherDeductions: number;
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
    const [companyId, setCompanyId] = useState('');
    const [companies, setCompanies] = useState<Company[]>([]);
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
            if (companyId) params.companyId = companyId;
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
    }, [companyId, fiscalYearEnd, branch, department, classification, jobTitle, status]);

    useEffect(() => {
        const loadCompanies = async () => {
            try {
                const list = await companiesApi.getAll();
                setCompanies(list);
            } catch (err) {
                console.error('Error fetching companies:', err);
            }
        };
        loadCompanies();
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatCurrency = (val: number | undefined | null) => {
        return (val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>الحاسبة المجمعة للمستحقات</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>عرض شامل لمستحقات جميع الموظفين مع تحليلات تفصيلية</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="btn"
                        onClick={fetchData}
                        disabled={loading}
                        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}
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
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>الفلاتر</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>الشركة</label>
                        <select
                            title="تصفية حسب الشركة"
                            value={companyId}
                            onChange={(e) => setCompanyId(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                        >
                            <option value="">كل الشركات</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>السنة المالية</label>
                        <input
                            type="date"
                            value={fiscalYearEnd}
                            onChange={(e) => setFiscalYearEnd(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>الفرع</label>
                        <select
                            title="تصفية حسب الفرع"
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                        >
                            <option value="">كل الفروع</option>
                            {uniqueBranches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>المسمى الوظيفي</label>
                        <select
                            title="تصفية حسب المسمى الوظيفي"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                        >
                            <option value="">كل المسميات</option>
                            {uniqueJobTitles.map(j => <option key={j} value={j}>{j}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>القسم</label>
                        <select
                            title="تصفية حسب القسم"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                        >
                            <option value="">كل الأقسام</option>
                            {Array.from(new Set((data?.employees || []).map(e => e.department).filter(Boolean))).map(d => <option key={d} value={d!}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>التصنيف</label>
                        <select
                            title="تصفية حسب التصنيف"
                            value={classification}
                            onChange={(e) => setClassification(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                        >
                            <option value="">كل التصنيفات</option>
                            {Array.from(new Set((data?.employees || []).map(e => e.classification).filter(Boolean))).map(c => <option key={c} value={c!}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>حالة الموظف</label>
                        <select
                            title="تصفية حسب الحالة"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                        {/* Row 1: General Info & Entitlements */}
                        <div className="card" style={{ borderTop: '4px solid #28A745' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                <div style={{ fontSize: '0.9rem', color: '#6C757D' }}>إجمالي الموظفين</div>
                                <Users size={20} color="#28A745" />
                            </div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#28A745' }}>
                                {data.summary.totalEmployees}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#6C757D' }}>
                                نشط: {data.summary.totalActiveEmployees} | منتهي: {data.summary.totalTerminatedEmployees}
                            </div>
                        </div>

                        <div className="card" style={{ borderTop: '4px solid #28A745' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                <div style={{ fontSize: '0.9rem', color: '#6C757D' }}>متوسط سنوات الخدمة</div>
                                <TrendingUp size={20} color="#28A745" />
                            </div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#28A745' }}>
                                {data.summary.averageServiceYears.toFixed(1)} سنة
                            </div>
                        </div>

                        <div className="card" style={{ borderTop: '4px solid #fd7e14' }}>
                            <div style={{ fontSize: '0.9rem', color: '#6C757D', marginBottom: '8px' }}>صافي نهاية الخدمة</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fd7e14' }}>
                                {formatCurrency((data.summary.totalFinalPayable ?? 0) - (data.summary.totalLeaveCompensation ?? 0))} ر.س
                            </div>
                        </div>

                        <div className="card" style={{ borderTop: '4px solid #007BFF' }}>
                            <div style={{ fontSize: '0.9rem', color: '#6C757D', marginBottom: '8px' }}>إجمالي تعويضات الإجازات</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#007BFF' }}>
                                {formatCurrency(data.summary.totalLeaveCompensation)} ر.س
                            </div>
                        </div>

                        {/* Row 2: Deductions & Net Payable */}
                        <div className="card" style={{ borderTop: '4px solid #DC3545' }}>
                            <div style={{ fontSize: '0.9rem', color: '#6C757D', marginBottom: '8px' }}>إجمالي خصم الإجازات</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#DC3545' }}>
                                {formatCurrency(data.summary.totalLeaveDeductions)} ر.س
                            </div>
                        </div>

                        {/* Spacer to align Net Payable to the end or keep it next to deductions */}
                        <div className="card" style={{ borderTop: '4px solid #FFC107', backgroundColor: '#FFC107', gridColumn: 'span 2' }}>
                            <div style={{ fontSize: '0.9rem', color: '#212529', marginBottom: '8px', fontWeight: '600' }}>صافي المبالغ المستحقة</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#212529' }}>
                                {formatCurrency(data.summary.totalFinalPayable)} ر.س
                            </div>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>تفاصيل الموظفين</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '400px', marginLeft: '20px' }}>
                                <Search size={20} color="#ADB5BD" />
                                <input
                                    type="text"
                                    placeholder="بحث بالاسم أو رقم الموظف..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                />
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--bg-hover)', borderBottom: '2px solid var(--border)' }}>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => handleSort('fullName')}>
                                            اسم الموظف {sortField === 'fullName' && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>الرقم الوظيفي</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => handleSort('branch')}>
                                            الفرع {sortField === 'branch' && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => handleSort('serviceYears')}>
                                            سنوات الخدمة {sortField === 'serviceYears' && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => handleSort('basicSalary')}>
                                            الراتب الأساسي {sortField === 'basicSalary' && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => handleSort('totalSalary')}>
                                            الراتب الشامل {sortField === 'totalSalary' && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>رصيد الإجازات</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => handleSort('leaveCompensation')}>
                                            قيمة الإجازات {sortField === 'leaveCompensation' && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => handleSort('finalPayable')}>
                                            إجمالي المستحقات {sortField === 'finalPayable' && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>الحالة</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>التفاصيل</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAndSortedEmployees.map((emp) => (
                                        <React.Fragment key={emp.id}>
                                            <tr style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                                <td style={{ padding: '14px 16px', fontWeight: '600', color: 'var(--text-primary)' }}>{emp.fullName}</td>
                                                <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{emp.employeeNumber}</td>
                                                <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{emp.branch || '-'}</td>
                                                <td style={{ padding: '14px 16px', color: 'var(--text-primary)' }}>{emp.serviceYears.toFixed(2)}</td>
                                                <td style={{ padding: '14px 16px', fontWeight: '600' }}>{formatCurrency(emp.basicSalary || 0)}</td>
                                                <td style={{ padding: '14px 16px', fontWeight: '600', color: '#2E7D32' }}>{formatCurrency(emp.totalSalary || 0)}</td>
                                                <td style={{ padding: '14px 16px', fontWeight: '600', color: Number(emp.leaveBalanceDays) < 0 ? '#DC3545' : 'inherit' }}>{Number(emp.leaveBalanceDays || 0).toFixed(2)} يوم</td>
                                                <td style={{ padding: '14px 16px', fontWeight: '600', color: Number(emp.leaveBalanceDays) < 0 ? '#DC3545' : '#1976D2' }}>
                                                    {Number(emp.leaveBalanceDays) < 0
                                                        ? formatCurrency(emp.leaveDeductions * -1)
                                                        : formatCurrency(emp.leaveCompensation)
                                                    }
                                                </td>
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
                                                <tr style={{ backgroundColor: 'var(--bg-hover)' }}>
                                                    <td colSpan={11} style={{ padding: '0' }}>
                                                        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', borderBottom: '2px solid #E9ECEF' }}>

                                                            {/* EOS Details */}
                                                            <div>
                                                                <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                                                    <TrendingUp size={16} style={{ display: 'inline', margin: '0 0 0 8px' }} />
                                                                    تفاصيل نهاية الخدمة
                                                                </h4>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                        <span style={{ color: 'var(--text-secondary)' }}>تاريخ التعيين:</span>
                                                                        <span style={{ fontWeight: '600' }}>{new Date(emp.hireDate).toLocaleDateString('en-GB')}</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                        <span style={{ color: 'var(--text-secondary)' }}>تاريخ النهاية:</span>
                                                                        <span style={{ fontWeight: '600' }}>{emp.endDate ? new Date(emp.endDate).toLocaleDateString('en-GB') : '-'}</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                        <span style={{ color: 'var(--text-secondary)' }}>مدة الخدمة:</span>
                                                                        <span style={{ fontWeight: '600' }}>{emp.serviceYears.toFixed(4)} سنة</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                                                                        <span style={{ color: 'var(--text-secondary)' }}>إجمالي المكافأة:</span>
                                                                        <span style={{ fontWeight: '600' }}>{formatCurrency(emp.grossEOS)}</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                        <span style={{ color: 'var(--text-secondary)' }}>نسبة الاستحقاق:</span>
                                                                        <span style={{ fontWeight: '600', color: emp.isActive ? '#495057' : (emp.entitlementRatio < 1 ? '#DC3545' : '#28A745') }}>
                                                                            {(emp.entitlementRatio * 100).toFixed(0)}%
                                                                        </span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-hover)', paddingTop: '8px', marginTop: '4px' }}>
                                                                        <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>صافي المكافأة:</span>
                                                                        <span style={{ fontWeight: 'bold', color: '#2E7D32' }}>{formatCurrency((emp.finalPayable ?? 0) - (emp.leaveCompensation ?? 0))}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Leave Details */}
                                                            <div>
                                                                <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                                                    <FileText size={16} style={{ display: 'inline', margin: '0 0 0 8px' }} />
                                                                    تفاصيل الإجازات
                                                                </h4>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                        <span style={{ color: 'var(--text-secondary)' }}>الراتب الشامل (لليوم):</span>
                                                                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{formatCurrency(emp.totalSalary / 30)}</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                        <span style={{ color: 'var(--text-secondary)' }}>الرصيد المتبقي:</span>
                                                                        <span style={{ fontWeight: '600', direction: 'ltr' }}>{Number(emp.leaveBalanceDays).toFixed(4)} يوم</span>
                                                                    </div>

                                                                    {Number(emp.leaveBalanceDays) >= 0 ? (
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-hover)', paddingTop: '8px', marginTop: '4px' }}>
                                                                            <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>تعويض الإجازات:</span>
                                                                            <span style={{ fontWeight: 'bold', color: '#1976D2' }}>{formatCurrency(emp.leaveCompensation)}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-hover)', paddingTop: '8px', marginTop: '4px' }}>
                                                                            <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>خصم تجاوز رصيد:</span>
                                                                            <span style={{ fontWeight: 'bold', color: '#DC3545' }}>{formatCurrency(emp.leaveDeductions)}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Financial Summary */}
                                                            <div>
                                                                <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                                                    <Download size={16} style={{ display: 'inline', margin: '0 0 0 8px' }} />
                                                                    ملخص المستحقات
                                                                </h4>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                        <span style={{ color: 'var(--text-secondary)' }}>(+) صافي نهاية الخدمة:</span>
                                                                        <span style={{ color: 'var(--text-primary)' }}>{formatCurrency((emp.finalPayable ?? 0) - (emp.leaveCompensation ?? 0))}</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                        <span style={{ color: 'var(--text-secondary)' }}>(+) تعويض الإجازات:</span>
                                                                        <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(emp.leaveCompensation)}</span>
                                                                    </div>

                                                                    {emp.leaveDeductions > 0 && (
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC3545' }}>
                                                                            <span>(-) خصم الإجازات:</span>
                                                                            <span>({formatCurrency(emp.leaveDeductions)})</span>
                                                                        </div>
                                                                    )}

                                                                    {emp.otherDeductions > 0 && (
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC3545' }}>
                                                                            <span>(-) خصومات أخرى:</span>
                                                                            <span>({formatCurrency(emp.otherDeductions)})</span>
                                                                        </div>
                                                                    )}

                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--border-hover)', paddingTop: '12px', marginTop: '8px' }}>
                                                                        <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-primary)' }}>صافي المستحقات:</span>
                                                                        <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#2E7D32' }}>{formatCurrency(emp.finalPayable)}</span>
                                                                    </div>
                                                                </div>
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
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '20px', color: 'var(--text-primary)' }}>توزيع المستحقات حسب الفرع</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {data.branchBreakdown.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'var(--bg-hover)', borderRadius: '8px' }}>
                                        <div>
                                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.branch}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.employeeCount} موظف</div>
                                        </div>
                                        <div style={{ fontWeight: '700', color: '#2E7D32' }}>{formatCurrency(item.totalEntitlements)} ر.س</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card">
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '20px', color: 'var(--text-primary)' }}>توزيع المستحقات حسب المسمى الوظيفي</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {data.jobTitleBreakdown.slice(0, 10).map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'var(--bg-hover)', borderRadius: '8px' }}>
                                        <div>
                                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.jobTitle}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.employeeCount} موظف</div>
                                        </div>
                                        <div style={{ fontWeight: '700', color: '#1976D2' }}>{formatCurrency(item.totalEntitlements)} ر.س</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )
            }
        </div >
    );
};

export default AggregatedCalculations;
