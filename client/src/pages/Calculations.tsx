import React, { useState, useEffect } from 'react';
import { Calculator, HelpCircle, FileText, Briefcase, Sun } from 'lucide-react';
import { employeesApi, calculationsApi } from '../api/settingsService';
import type { Employee } from '../api/settingsService';

const Calculations: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [activeTab, setActiveTab] = useState<'EOS' | 'VACATION'>('EOS');

    // EOS State
    const [eosResult, setEosResult] = useState<any>(null);
    const [terminationType, setTerminationType] = useState('RESIGNATION');

    // Vacation State
    const [vacationResult, setVacationResult] = useState<any>(null);
    const [manualDays, setManualDays] = useState<number | ''>('');

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        employeesApi.getAll()
            .then(data => setEmployees(data))
            .catch(err => console.error('Failed to fetch employees', err));
    }, []);

    const handleCalculate = async () => {
        if (!selectedEmployee) return;
        setLoading(true);

        try {
            if (activeTab === 'EOS') {
                const data = await calculationsApi.calculateEOS(selectedEmployee, terminationType);
                setEosResult(data);
            } else {
                const data = await calculationsApi.calculateVacation(selectedEmployee, manualDays || undefined);
                setVacationResult(data);
            }
        } catch (error) {
            console.error("Calculation failed", error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: string | number) => {
        return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) minmax(400px, 1fr)', gap: '32px', alignItems: 'start' }}>

            {/* Input Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>حاسبة المستحقات</h2>
                    <p style={{ color: '#6C757D' }}>احتساب نهاية الخدمة ورصيد الإجازات بدقة.</p>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '8px', padding: '4px', backgroundColor: '#F1F3F5', borderRadius: '8px' }}>
                    <button
                        onClick={() => { setActiveTab('EOS'); setEosResult(null); }}
                        style={{
                            flex: 1,
                            padding: '10px',
                            border: 'none',
                            borderRadius: '6px',
                            backgroundColor: activeTab === 'EOS' ? '#fff' : 'transparent',
                            boxShadow: activeTab === 'EOS' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                            fontWeight: activeTab === 'EOS' ? '600' : 'normal',
                            color: activeTab === 'EOS' ? '#2E7D32' : '#495057',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Briefcase size={18} />
                        نهاية الخدمة
                    </button>
                    <button
                        onClick={() => { setActiveTab('VACATION'); setVacationResult(null); }}
                        style={{
                            flex: 1,
                            padding: '10px',
                            border: 'none',
                            borderRadius: '6px',
                            backgroundColor: activeTab === 'VACATION' ? '#fff' : 'transparent',
                            boxShadow: activeTab === 'VACATION' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                            fontWeight: activeTab === 'VACATION' ? '600' : 'normal',
                            color: activeTab === 'VACATION' ? '#FF9800' : '#495057',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Sun size={18} />
                        رصيد الإجازات
                    </button>
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: '20px', fontSize: '1.25rem' }}>بيانات العملية</h3>

                    <div className="form-group">
                        <label>اختر الموظف</label>
                        <select
                            title="اختر الموظف للبدء بالحساب"
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            style={{ fontSize: '1rem', padding: '12px', backgroundColor: '#F8F9FA', width: '100%', border: '1px solid #E9ECEF', borderRadius: '8px' }}
                        >
                            <option value="">-- البحث عن موظف --</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                            ))}
                        </select>
                    </div>

                    {activeTab === 'EOS' && (
                        <>
                            <div className="form-group">
                                <label>سبب إنهاء الخدمة</label>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        className={`btn`}
                                        onClick={() => setTerminationType('RESIGNATION')}
                                        style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #E9ECEF', backgroundColor: terminationType === 'RESIGNATION' ? '#2E7D32' : '#FFF', color: terminationType === 'RESIGNATION' ? '#fff' : '#495057' }}
                                    >
                                        استقالة (مادة 85)
                                    </button>
                                    <button
                                        className={`btn`}
                                        onClick={() => setTerminationType('TERMINATION')}
                                        style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #E9ECEF', backgroundColor: terminationType === 'TERMINATION' ? '#2E7D32' : '#FFF', color: terminationType === 'TERMINATION' ? '#fff' : '#495057' }}
                                    >
                                        فسخ عقد / إنهاء
                                    </button>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: '#6C757D', marginTop: '8px' }}>
                                    {terminationType === 'RESIGNATION'
                                        ? 'تستحق ثلث المكافأة إذا كانت الخدمة 2-5 سنوات، وثلثي المكافأة إذا كانت 5-10 سنوات.'
                                        : 'يستحق الموظف مكافأة كاملة في حال إنهاء العقد من قبل صاحب العمل.'}
                                </p>
                            </div>

                            <div className="form-group">
                                <label>تاريخ نهاية العمل</label>
                                <input type="date" style={{ backgroundColor: '#F8F9FA', width: '100%', padding: '12px', border: '1px solid #E9ECEF', borderRadius: '8px' }} />
                            </div>
                        </>
                    )}

                    {activeTab === 'VACATION' && (
                        <div className="form-group">
                            <label>عدد الأيام المستحقة (اختياري)</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="اتركه فارغاً لجلب الرصيد الحالي"
                                    value={manualDays}
                                    onChange={(e) => setManualDays(e.target.value === '' ? '' : Number(e.target.value))}
                                    style={{ backgroundColor: '#F8F9FA', width: '100%', padding: '12px', border: '1px solid #E9ECEF', borderRadius: '8px' }}
                                />
                                {manualDays !== '' && (
                                    <button
                                        onClick={() => setManualDays('')}
                                        style={{ padding: '0 12px', background: '#F1F3F5', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                    >
                                        مسح
                                    </button>
                                )}
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#6C757D', marginTop: '8px' }}>
                                سيقوم النظام آلياً باحتساب الأجر اليومي بناءً على آخر راتب إجمالي (الراتب + البدلات) / 30.
                            </p>
                        </div>
                    )}

                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '16px', fontSize: '1.1rem', marginTop: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                        onClick={handleCalculate}
                        disabled={loading || !selectedEmployee}
                    >
                        {loading ? 'جاري التحليل...' : 'بدء الاحتساب'}
                        {!loading && <Calculator size={20} />}
                    </button>
                </div>

                {activeTab === 'EOS' && (
                    <div className="card" style={{ backgroundColor: '#E8F5E9', border: '1px solid #C8E6C9' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <HelpCircle size={24} color="#2E7D32" />
                            <div>
                                <h4 style={{ color: '#2E7D32', fontWeight: 'bold' }}>تذكير قانوني</h4>
                                <p style={{ fontSize: '0.9rem', color: '#1B5E20' }}>
                                    يجب تصفية رصيد الإجازات المتبقي بناءً على الأجر الشامل الأخير (الراتب الأساسي + جميع البدلات الثابتة).
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Result Section (Sticky) */}
            <div style={{ position: 'sticky', top: '24px' }}>
                {activeTab === 'EOS' && eosResult && (
                    <div className="card fade-in" style={{ padding: '0', overflow: 'hidden', borderTop: '4px solid #2E7D32', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                        <div style={{ padding: '24px', backgroundColor: '#fff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <h3 style={{ fontSize: '1.25rem', color: '#111' }}>مسودة التصفية النهائية</h3>
                                <span style={{ fontSize: '0.8rem', padding: '4px 8px', backgroundColor: '#F8F9FA', borderRadius: '4px', border: '1px solid #E9ECEF' }}>EOS-REF-001</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                <div style={{ backgroundColor: '#F8F9FA', padding: '12px', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#6C757D' }}>مدة الخدمة</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{eosResult.serviceYears} سنة</div>
                                </div>
                                <div style={{ backgroundColor: '#F8F9FA', padding: '12px', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#6C757D' }}>نسبة الاستحقاق</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: Number(eosResult.entitlementRatio) < 1 ? '#DC3545' : '#2E7D32' }}>
                                        {(Number(eosResult.entitlementRatio) * 100).toFixed(0)}%
                                    </div>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px dashed #E9ECEF', margin: '16px 0' }}></div>

                            {/* Breakdown */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>مكافأة نهاية الخدمة (الإجمالية)</span>
                                    <span style={{ fontWeight: '600' }}>{formatCurrency(eosResult.grossEOS)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: 'bold' }}>صافي المكافأة المستحقة</span>
                                    <span style={{ fontWeight: 'bold' }}>{formatCurrency(eosResult.netEOS)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2E7D32' }}></div>
                                        تعويض رصيد الإجازات
                                    </span>
                                    <span style={{ fontWeight: '600', color: '#2E7D32' }}>+{formatCurrency(eosResult.leaveCompensation)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#DC3545' }}></div>
                                        إجمالي الخصومات
                                    </span>
                                    <span style={{ fontWeight: '600', color: '#DC3545' }}>-{formatCurrency(eosResult.totalDeductions)}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '24px', backgroundColor: '#F1F3F5', borderTop: '1px solid #E9ECEF' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>صافي المبلغ المستحق</span>
                                <span style={{ fontSize: '1.75rem', fontWeight: '900', color: '#2E7D32' }}>{formatCurrency(eosResult.finalPayable)} <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>ر.س</span></span>
                            </div>
                            <button className="btn btn-primary" style={{ width: '100%' }}>
                                <FileText size={18} />
                                <span>اعتماد وصرف</span>
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'VACATION' && vacationResult && (
                    <div className="card fade-in" style={{ padding: '0', overflow: 'hidden', borderTop: '4px solid #FF9800', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                        <div style={{ padding: '24px', backgroundColor: '#fff' }}>
                            <h3 style={{ fontSize: '1.25rem', color: '#111', marginBottom: '16px' }}>تفاصيل تعويض الإجازة</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #eee' }}>
                                    <span style={{ color: '#6C757D' }}>اسم الموظف</span>
                                    <span style={{ fontWeight: 'bold' }}>{vacationResult.employeeName}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #eee' }}>
                                    <span style={{ color: '#6C757D' }}>الراتب الإجمالي</span>
                                    <span style={{ fontWeight: 'bold' }}>{formatCurrency(vacationResult.totalSalary)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #eee' }}>
                                    <span style={{ color: '#6C757D' }}>الأجر اليومي (÷30)</span>
                                    <span style={{ fontWeight: 'bold' }}>{formatCurrency(vacationResult.dailyWage)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #eee', backgroundColor: '#FFF3E0' }}>
                                    <span style={{ color: '#E65100' }}>عدد الأيام {vacationResult.isManual ? '(يدوي)' : '(رصيد)'}</span>
                                    <span style={{ fontWeight: 'bold', color: '#E65100' }}>{Number(vacationResult.leaveDays).toFixed(2)} يوم</span>
                                </div>
                            </div>

                            <div style={{ padding: '16px', backgroundColor: '#FFF8E1', borderRadius: '8px', border: '1px dashed #FFC107' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>إجمالي التعويض</span>
                                    <span style={{ fontWeight: '900', fontSize: '1.5rem', color: '#FF6F00' }}>{formatCurrency(vacationResult.totalAmount)} <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>ر.س</span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!((activeTab === 'EOS' && eosResult) || (activeTab === 'VACATION' && vacationResult)) && (
                    <div style={{
                        height: '400px',
                        border: '2px dashed #E9ECEF',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ADB5BD',
                        backgroundColor: '#F8F9FA'
                    }}>
                        <FileText size={64} style={{ opacity: 0.2, marginBottom: '24px' }} />
                        <p style={{ fontSize: '1.25rem', fontWeight: '600' }}>لا توجد نتيجة</p>
                        <p>اختر موظفاً واضغط على زر الاحتساب</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Calculations;
