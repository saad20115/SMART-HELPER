import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Minus, RefreshCw, Filter, Search, Edit2 } from 'lucide-react';
import { leaveApi, settingsApi, companiesApi } from '../api/settingsService';
import type { LeaveBalance, Company } from '../api/settingsService';

const LeaveManagement: React.FC = () => {
    const [balances, setBalances] = useState<LeaveBalance[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');
    const [branches, setBranches] = useState<{ id: string | number, name: string }[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<LeaveBalance | null>(null);
    const [adjustmentDays, setAdjustmentDays] = useState<number | ''>('');
    const [adjustmentReason, setAdjustmentReason] = useState('');
    const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'DEDUCT'>('ADD');

    // Quick Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editEmployee, setEditEmployee] = useState<LeaveBalance | null>(null);
    const [editEntitled, setEditEntitled] = useState<number>(0);
    const [editUsed, setEditUsed] = useState<number>(0);
    const [editRemaining, setEditRemaining] = useState<number>(0);
    const [editReason, setEditReason] = useState('');

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const comps = await companiesApi.getAll();
            setCompanies(comps);
            if (comps.length > 0) {
                setSelectedCompanyId(comps[0].id);
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error("Failed to fetch companies", error);
            setLoading(false);
        }
    };

    const fetchBranches = useCallback(async () => {
        try {
            const data = await settingsApi.getBranches(selectedCompanyId);
            setBranches(data);
        } catch (error) {
            console.error("Failed to fetch branches", error);
        }
    }, [selectedCompanyId]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await leaveApi.getBalances(selectedCompanyId);
            setBalances(data);
        } catch (error) {
            console.error("Failed to fetch leave balances", error);
        } finally {
            setLoading(false);
        }
    }, [selectedCompanyId]);

    useEffect(() => {
        if (selectedCompanyId) {
            fetchData();
            fetchBranches();
        }
    }, [selectedCompanyId, fetchData, fetchBranches]);

    const handleRecalculate = async (employeeId: string) => {
        try {
            await leaveApi.recalculateAccruals(employeeId);
            // Refresh specific item or all
            fetchData();
        } catch (error) {
            console.error("Recalculation failed", error);
            alert("فشل إعادة التعيين");
        }
    };

    const handleOpenAdjustment = (employee: LeaveBalance) => {
        setSelectedEmployee(employee);
        setAdjustmentDays('');
        setAdjustmentReason('');
        setAdjustmentType('ADD');
        setShowModal(true);
    };

    const handleSubmitAdjustment = async () => {
        if (!selectedEmployee || adjustmentDays === '' || isNaN(Number(adjustmentDays))) return;

        const days = Number(adjustmentDays) * (adjustmentType === 'DEDUCT' ? -1 : 1);

        try {
            await leaveApi.adjustBalance(selectedEmployee.employeeId, days, adjustmentReason || 'تعديل يدوي');
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error("Adjustment failed", error);
            alert("فشلت عملية التعديل");
        }
    };

    const filteredBalances = balances.filter(b => {
        const matchesSearch = b.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesBranch = selectedBranch ? b.branch === selectedBranch : true;
        return matchesSearch && matchesBranch;
    });

    const handleOpenEdit = (item: LeaveBalance) => {
        setEditEmployee(item);
        setEditEntitled(Number(item.annualEntitledDays));
        setEditUsed(Number(item.annualUsedDays));
        setEditRemaining(Number(item.calculatedRemainingDays));
        setEditReason('');
        setShowEditModal(true);
    };

    const handleSubmitEdit = async () => {
        if (!editEmployee) return;
        try {
            await leaveApi.directUpdateBalance(editEmployee.employeeId, {
                annualEntitledDays: editEntitled,
                annualUsedDays: editUsed,
                calculatedRemainingDays: editRemaining,
                reason: editReason || 'تصحيح يدوي',
            });
            setShowEditModal(false);
            fetchData();
        } catch (error) {
            console.error("Edit failed", error);
            alert("فشلت عملية التعديل");
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#111', marginBottom: '8px' }}>إدارة أرصدة الإجازات</h1>
                    <p style={{ color: '#6C757D' }}>متابعة وتعديل أرصدة إجازات الموظفين وإعادة احتساب الاستحقاق.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <select
                        value={selectedCompanyId}
                        onChange={(e) => setSelectedCompanyId(e.target.value)}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #E9ECEF', fontWeight: 'bold', minWidth: '200px' }}
                        title="اختر الشركة"
                    >
                        {companies.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <button className="btn btn-secondary" onClick={fetchData}>
                        <RefreshCw size={18} />
                        تحديث البيانات
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', padding: '16px' }}>
                <div style={{ position: 'relative', minWidth: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#ADB5BD' }} />
                    <input
                        type="text"
                        placeholder="بحث باسم الموظف أو المسمى الوظيفي..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '10px 40px 10px 12px', borderRadius: '6px', border: '1px solid #E9ECEF' }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Filter size={18} color="#6C757D" />
                    <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        style={{ padding: '10px', borderRadius: '6px', border: '1px solid #E9ECEF', minWidth: '200px' }}
                    >
                        <option value="">كل الفروع</option>
                        {branches.map(b => (
                            <option key={b.id} value={b.name}>{b.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#F8F9FA', borderBottom: '1px solid #E9ECEF' }}>
                        <tr>
                            <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#495057' }}>الموظف</th>
                            <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#495057' }}>تاريخ التعيين</th>
                            <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#495057' }}>الخدمة (سنة)</th>
                            <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#495057' }}>الاستحقاق السنوي</th>
                            <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#495057' }}>المستخدم</th>
                            <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#495057' }}>الرصيد المتبقي</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057' }}>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#6C757D' }}>جاري تحميل البيانات...</td>
                            </tr>
                        ) : filteredBalances.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#6C757D' }}>لا توجد بيانات للعرض لهذه الشركة</td>
                            </tr>
                        ) : (
                            filteredBalances.map((item) => (
                                <tr key={item.employeeId} style={{ borderBottom: '1px solid #F1F3F5', transition: 'background-color 0.2s' }}>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ fontWeight: '600', color: '#212529' }}>{item.employeeName}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#6C757D' }}>{item.jobTitle} - {item.branch || 'N/A'}</div>
                                    </td>
                                    <td style={{ padding: '16px', color: '#495057' }}>{new Date(item.hireDate).toLocaleDateString('en-GB')}</td>
                                    <td style={{ padding: '16px', color: '#495057' }}>{item.serviceYears}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            backgroundColor: item.annualEntitledDays >= 30 ? '#E8F5E9' : '#FFF3E0',
                                            color: item.annualEntitledDays >= 30 ? '#2E7D32' : '#E65100',
                                            fontWeight: '600',
                                            fontSize: '0.9rem'
                                        }}>
                                            {Number(item.annualEntitledDays).toFixed(2)} يوم
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', color: '#495057' }}>{Number(item.annualUsedDays).toFixed(2)}</td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ fontWeight: 'bold', color: item.calculatedRemainingDays < 0 ? '#DC3545' : '#2E7D32' }}>
                                            {Number(item.calculatedRemainingDays).toFixed(2)} يوم
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#ADB5BD' }}>{Number(item.leaveValue).toLocaleString()} ر.س</div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                            <button
                                                onClick={() => handleRecalculate(item.employeeId)}
                                                title="إعادة احتساب الاستحقاق"
                                                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #E9ECEF', backgroundColor: '#fff', cursor: 'pointer', color: '#495057' }}
                                            >
                                                <RefreshCw size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenAdjustment(item)}
                                                title="تعديل الرصيد يدوياً"
                                                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #E9ECEF', backgroundColor: '#fff', cursor: 'pointer', color: '#228BE6' }}
                                            >
                                                <Calendar size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenEdit(item)}
                                                title="تصحيح سريع للأرقام"
                                                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #E9ECEF', backgroundColor: '#fff', cursor: 'pointer', color: '#F59E0B' }}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && selectedEmployee && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100
                }}>
                    <div className="card fade-in" style={{ width: '450px', padding: '24px' }}>
                        <h3 style={{ marginBottom: '24px', fontSize: '1.25rem' }}>تعديل رصيد: {selectedEmployee.employeeName}</h3>

                        <div className="form-group">
                            <label>نوع التعديل</label>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setAdjustmentType('ADD')}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #E9ECEF',
                                        backgroundColor: adjustmentType === 'ADD' ? '#E8F5E9' : '#fff',
                                        color: adjustmentType === 'ADD' ? '#2E7D32' : '#495057',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <Plus size={16} /> إضافة رصيد
                                </button>
                                <button
                                    onClick={() => setAdjustmentType('DEDUCT')}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #E9ECEF',
                                        backgroundColor: adjustmentType === 'DEDUCT' ? '#FFEBEE' : '#fff',
                                        color: adjustmentType === 'DEDUCT' ? '#C62828' : '#495057',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <Minus size={16} /> خصم رصيد
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>عدد الأيام</label>
                            <input
                                type="number"
                                step="any"
                                value={adjustmentDays}
                                onChange={(e) => setAdjustmentDays(e.target.value === '' ? '' : Number(e.target.value))}
                                style={{ width: '100%', padding: '12px', border: '1px solid #E9ECEF', borderRadius: '8px' }}
                                placeholder="مثال: 5.5"
                            />
                        </div>

                        <div className="form-group">
                            <label>السبب / الملاحظات</label>
                            <textarea
                                value={adjustmentReason}
                                onChange={(e) => setAdjustmentReason(e.target.value)}
                                style={{ width: '100%', padding: '12px', border: '1px solid #E9ECEF', borderRadius: '8px', minHeight: '80px' }}
                                placeholder="سبب التعديل..."
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <button
                                className="btn btn-primary"
                                onClick={handleSubmitAdjustment}
                                style={{ flex: 1 }}
                            >
                                حفظ التعديل
                            </button>
                            <button
                                className="btn"
                                onClick={() => setShowModal(false)}
                                style={{ flex: 1, backgroundColor: '#F8F9FA', color: '#495057' }}
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Edit Modal */}
            {showEditModal && editEmployee && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '32px', width: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginBottom: '8px', color: '#111' }}>✏️ تصحيح سريع</h3>
                        <p style={{ color: '#6C757D', marginBottom: '24px', fontSize: '0.9rem' }}>
                            {editEmployee.employeeName}
                        </p>

                        <div style={{ display: 'grid', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#495057' }}>الاستحقاق السنوي (يوم)</label>
                                <input
                                    type="number"
                                    value={editEntitled}
                                    onChange={(e) => setEditEntitled(Number(e.target.value))}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #E9ECEF', borderRadius: '8px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#495057' }}>الأيام المستخدمة</label>
                                <input
                                    type="number"
                                    value={editUsed}
                                    onChange={(e) => setEditUsed(Number(e.target.value))}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #E9ECEF', borderRadius: '8px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#495057' }}>الرصيد المتبقي (يوم)</label>
                                <input
                                    type="number"
                                    value={editRemaining}
                                    onChange={(e) => setEditRemaining(Number(e.target.value))}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #E9ECEF', borderRadius: '8px' }}
                                />
                                <div style={{ fontSize: '0.8rem', color: '#6C757D', marginTop: '4px' }}>
                                    القيمة = {(Math.max(0, editRemaining) * Number(editEmployee.leaveValue) / Math.max(1, Number(editEmployee.calculatedRemainingDays))).toLocaleString(undefined, { maximumFractionDigits: 0 })} ر.س
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#495057' }}>سبب التعديل</label>
                                <input
                                    type="text"
                                    value={editReason}
                                    onChange={(e) => setEditReason(e.target.value)}
                                    placeholder="تصحيح من ملف الإكسيل..."
                                    style={{ width: '100%', padding: '10px', border: '1px solid #E9ECEF', borderRadius: '8px' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <button
                                className="btn btn-primary"
                                onClick={handleSubmitEdit}
                                style={{ flex: 1, backgroundColor: '#F59E0B', borderColor: '#F59E0B' }}
                            >
                                حفظ التصحيح
                            </button>
                            <button
                                className="btn"
                                onClick={() => setShowEditModal(false)}
                                style={{ flex: 1, backgroundColor: '#F8F9FA', color: '#495057' }}
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveManagement;
