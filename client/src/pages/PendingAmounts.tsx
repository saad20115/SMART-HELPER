
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, X, Save } from 'lucide-react';
import { deductionsApi, employeesApi, type Deduction, type Employee } from '../api/settingsService';
import SearchableSelect from '../components/SearchableSelect';

const PendingAmounts: React.FC = () => {
    const [deductions, setDeductions] = useState<Deduction[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('PENDING');
    const [typeFilter, setTypeFilter] = useState<string>('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDeduction, setEditingDeduction] = useState<Partial<Deduction> | null>(null);
    const [modalLoading, setModalLoading] = useState(false);

    const fetchEmployees = async () => {
        try {
            const data = await employeesApi.getAll();
            setEmployees(data);
        } catch (error) {
            console.error('Failed to fetch employees', error);
        }
    };

    const fetchDeductions = useCallback(async () => {
        setLoading(true);
        try {
            const data = await deductionsApi.getAll();
            setDeductions(data);
        } catch (error) {
            console.error('Failed to fetch deductions', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial Data Fetch
    useEffect(() => {
        fetchEmployees();
        fetchDeductions();
    }, [fetchDeductions]);

    // Filter Logic
    const filteredDeductions = deductions.filter(d => {
        const matchesSearch =
            (d.employee?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (d.employee?.employeeNumber || '').includes(searchTerm);
        const matchesStatus = statusFilter ? d.status === statusFilter : true;
        const matchesType = typeFilter ? d.type === typeFilter : true;
        return matchesSearch && matchesStatus && matchesType;
    });

    // CRUD Handlers
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDeduction) return;

        setModalLoading(true);
        try {
            if (editingDeduction.id) {
                await deductionsApi.update(editingDeduction.id, editingDeduction);
            } else {
                await deductionsApi.create(editingDeduction);
            }
            await fetchDeductions();
            setIsModalOpen(false);
            setEditingDeduction(null);
        } catch (error) {
            console.error('Failed to save deduction', error);
            alert('حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى.');
        } finally {
            setModalLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
        try {
            await deductionsApi.delete(id);
            fetchDeductions();
        } catch (error) {
            console.error('Failed to delete deduction', error);
        }
    };

    const openModal = (deduction?: Deduction) => {
        if (deduction) {
            setEditingDeduction({ ...deduction });
        } else {
            setEditingDeduction({
                type: 'ADVANCE',
                amount: 0,
                date: new Date().toISOString().split('T')[0],
                status: 'PENDING',
                employeeId: '',
            });
        }
        setIsModalOpen(true);
    };

    const formatCurrency = (val: number) => {
        return (Number(val) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const getTypeLabel = (type: string) => {
        const types: Record<string, string> = {
            'LOAN': 'سلفة / قرض',
            'PENALTY': 'جزاء / خصم',
            'ADVANCE': 'مقدم راتب',
            'OTHER': 'أخرى',
            'VACATION_EOS_BALANCE': 'مبلغ من ارصدة الاجازات ونهاية الخدمه'
        };
        return types[type] || type;
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string, color: string, label: string }> = {
            'PENDING': { bg: '#FFF3E0', color: '#E65100', label: 'معلق' },
            'COMPLETED': { bg: '#E8F5E9', color: '#2E7D32', label: 'مكتمل' },
            'CANCELLED': { bg: '#FFEBEE', color: '#C62828', label: 'ملغي' }
        };
        const style = styles[status] || styles['PENDING'];
        return (
            <span style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: '600',
                backgroundColor: style.bg,
                color: style.color
            }}>
                {style.label}
            </span>
        );
    };

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111' }}>إدارة المبالغ المعلقة</h2>
                    <p style={{ color: '#6C757D', marginTop: '4px' }}>تسجيل ومتابعة السلف والخصومات المستقطعة من المستحقات</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => openModal()}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Plus size={18} />
                    <span>إضافة سجل جديد</span>
                </button>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '300px' }}>
                    <Search size={20} color="#ADB5BD" />
                    <input
                        type="text"
                        placeholder="بحث باسم الموظف أو الرقم الوظيفي..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #E9ECEF', outline: 'none' }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Filter size={18} color="#6C757D" />
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #E9ECEF', outline: 'none' }}
                    >
                        <option value="">كل الأنواع</option>
                        <option value="LOAN">سلفة / قرض</option>
                        <option value="PENALTY">جزاء / خصم</option>
                        <option value="ADVANCE">مقدم راتب</option>
                        <option value="VACATION_EOS_BALANCE">مبلغ من ارصدة الاجازات ونهاية الخدمه</option>
                        <option value="OTHER">أخرى</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #E9ECEF', outline: 'none' }}
                    >
                        <option value="">كل الحالات</option>
                        <option value="PENDING">معلق</option>
                        <option value="COMPLETED">مكتمل</option>
                        <option value="CANCELLED">ملغي</option>
                    </select>
                </div>
            </div>

            {/* Statistics Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div className="card" style={{ borderRight: '4px solid #E65100' }}>
                    <div style={{ fontSize: '0.9rem', color: '#6C757D', marginBottom: '8px' }}>إجمالي المبالغ المعلقة</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E65100' }}>
                        {formatCurrency(filteredDeductions.filter(d => d.status === 'PENDING').reduce((sum, d) => sum + Number(d.amount), 0))} ر.س
                    </div>
                </div>
                <div className="card" style={{ borderRight: '4px solid #2E7D32' }}>
                    <div style={{ fontSize: '0.9rem', color: '#6C757D', marginBottom: '8px' }}>عدد العمليات المعلقة</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2E7D32' }}>
                        {filteredDeductions.filter(d => d.status === 'PENDING').length} عملية
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#F8F9FA', borderBottom: '1px solid #E9ECEF' }}>
                                <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem' }}>الموظف</th>
                                <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem' }}>النوع</th>
                                <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem' }}>التاريخ</th>
                                <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem' }}>المبلغ</th>
                                <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem' }}>الحالة</th>
                                <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem' }}>ملاحظات</th>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', fontSize: '0.9rem' }}>إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>جاري التحميل...</td>
                                </tr>
                            ) : filteredDeductions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#ADB5BD' }}>لا توجد سجلات مطابقة</td>
                                </tr>
                            ) : (
                                filteredDeductions.map((item) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #F1F3F5' }} className="hover-bg">
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontWeight: '600' }}>{item.employee?.fullName || 'غير معروف'}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#6C757D' }}>{item.employee?.employeeNumber || '-'}</div>
                                        </td>
                                        <td style={{ padding: '16px' }}>{getTypeLabel(item.type)}</td>
                                        <td style={{ padding: '16px' }}>{new Date(item.date).toLocaleDateString('en-GB')}</td>
                                        <td style={{ padding: '16px', fontWeight: 'bold' }}>{formatCurrency(item.amount)}</td>
                                        <td style={{ padding: '16px' }}>{getStatusBadge(item.status)}</td>
                                        <td style={{ padding: '16px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#6C757D' }}>
                                            {item.description || '-'}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                <button
                                                    onClick={() => openModal(item)}
                                                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#1976D2' }}
                                                    title="تعديل"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#DC3545' }}
                                                    title="حذف"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && editingDeduction && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        width: '500px',
                        maxWidth: '90%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid #E9ECEF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
                                {editingDeduction.id ? 'تعديل السجل' : 'إضافة سجل جديد'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ADB5BD' }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} style={{ padding: '24px' }}>
                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <SearchableSelect
                                    label="الموظف"
                                    required
                                    disabled={!!editingDeduction.id}
                                    value={editingDeduction.employeeId || ''}
                                    onChange={(val) => setEditingDeduction({ ...editingDeduction, employeeId: val })}
                                    options={employees.map(emp => ({
                                        value: emp.id,
                                        label: emp.fullName,
                                        subLabel: emp.employeeNumber
                                    }))}
                                    placeholder="ابحث عن الموظف..."
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>النوع</label>
                                    <select
                                        required
                                        value={editingDeduction.type as Deduction['type']}
                                        onChange={(e) => setEditingDeduction({ ...editingDeduction, type: e.target.value as Deduction['type'] })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E9ECEF' }}
                                    >
                                        <option value="LOAN">سلفة / قرض</option>
                                        <option value="PENALTY">جزاء / خصم</option>
                                        <option value="ADVANCE">مقدم راتب</option>
                                        <option value="VACATION_EOS_BALANCE">مبلغ من ارصدة الاجازات ونهاية الخدمه</option>
                                        <option value="OTHER">أخرى</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>المبلغ</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={editingDeduction.amount}
                                        onChange={(e) => setEditingDeduction({ ...editingDeduction, amount: Number(e.target.value) })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E9ECEF' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>التاريخ</label>
                                    <input
                                        type="date"
                                        required
                                        value={editingDeduction.date ? new Date(editingDeduction.date).toISOString().split('T')[0] : ''}
                                        onChange={(e) => setEditingDeduction({ ...editingDeduction, date: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E9ECEF' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>الحالة</label>
                                    <select
                                        required
                                        value={editingDeduction.status as Deduction['status']}
                                        onChange={(e) => setEditingDeduction({ ...editingDeduction, status: e.target.value as Deduction['status'] })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E9ECEF' }}
                                    >
                                        <option value="PENDING">معلق</option>
                                        <option value="COMPLETED">مكتمل (تم الخصم)</option>
                                        <option value="CANCELLED">ملغي</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>الوصف</label>
                                <input
                                    type="text"
                                    value={editingDeduction.description || ''}
                                    onChange={(e) => setEditingDeduction({ ...editingDeduction, description: e.target.value })}
                                    placeholder="وصف مختصر للخصم..."
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E9ECEF' }}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>ملاحظات إضافية</label>
                                <textarea
                                    value={editingDeduction.notes || ''}
                                    onChange={(e) => setEditingDeduction({ ...editingDeduction, notes: e.target.value })}
                                    rows={3}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E9ECEF', resize: 'vertical' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="btn"
                                    style={{ backgroundColor: '#F1F3F5', color: '#495057' }}
                                    disabled={modalLoading}
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={modalLoading}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    {modalLoading ? 'جاري الحفظ...' : (
                                        <>
                                            <Save size={18} />
                                            <span>حفظ البيانات</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingAmounts;
