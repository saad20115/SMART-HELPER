import React, { useState, useEffect } from 'react';
import { Search, UserX, AlertCircle, RefreshCw, User, Calendar, CheckCircle } from 'lucide-react';
import { companiesApi, calculationsApi, settlementApi } from '../api/settingsService';
import type { Company } from '../api/settingsService';

const EmployeeSettlement = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setCompanyId] = useState("");
    
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    const [search, setSearch] = useState("");
    const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
    
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [terminationType, setTerminationType] = useState('RESIGNATION');
    const [notes, setNotes] = useState('');
    const [extraDeductions, setExtraDeductions] = useState(0);
    const [extraBonuses, setExtraBonuses] = useState(0);
    const [showTerminated, setShowTerminated] = useState(false);
    
    const [isExecuting, setIsExecuting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        companiesApi.getAll().then(setCompanies).catch(console.error);
    }, []);

    const fetchEmployees = async () => {
        setLoading(true);
        setSelectedEmpId(null);
        try {
            const params: Record<string, string> = { status: showTerminated ? 'TERMINATED' : 'ACTIVE' };
            if (selectedCompanyId) params.companyId = selectedCompanyId;
            const res = await calculationsApi.getAggregated(params);
            setEmployees(res.employees || []);
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, [selectedCompanyId, showTerminated]);

    const filteredEmps = employees.filter(e => 
        e.fullName.toLowerCase().includes(search.toLowerCase()) || 
        e.employeeNumber.includes(search)
    );

    const selectedEmp = employees.find(e => e.id === selectedEmpId);

    const handleSettle = async () => {
        if (!selectedEmp) return;
        if (!confirm('هل أنت متأكد من تنفيذ التصفية لهذا الموظف؟')) return;
        setIsExecuting(true);
        setMessage(null);
        try {
            await settlementApi.executeSettlement({
                employeeId: selectedEmp.id,
                endDate,
                terminationType,
                notes,
                extraDeductions,
                extraBonuses
            });
            setMessage({ type: 'success', text: 'تم تنفيذ التصفية بنجاح' });
            setNotes(''); setExtraDeductions(0); setExtraBonuses(0);
            setSelectedEmpId(null);
            fetchEmployees();
        } catch(e) {
            setMessage({ type: 'error', text: 'حدث خطأ أثناء تنفيذ التصفية' });
            console.error(e);
        } finally {
            setIsExecuting(false);
        }
    };

    const handleReactivate = async (empId: string) => {
        if (!confirm('هل أنت متأكد من إعادة تنشيط هذا الموظف؟ سيتم حذف آخر سجل تصفية.')) return;
        try {
            await settlementApi.reactivate(empId);
            setMessage({ type: 'success', text: 'تم إعادة تنشيط الموظف بنجاح' });
            setSelectedEmpId(null);
            fetchEmployees();
        } catch(e) {
            setMessage({ type: 'error', text: 'فشل إعادة التنشيط' });
            console.error(e);
        }
    };

    
    const fmt = (v: number | undefined | null) => (v||0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const selStyle = { padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-input, #fff)", color: "var(--text-primary)", width: "100%", fontSize: "0.9rem" };
    const lblStyle = { display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)" };

    return (
        <div style={{ padding: "8px 0" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                <div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "6px" }}>
                        تصفية موظف (نهاية الخدمة)
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.93rem" }}>
                        إنهاء خدمة موظف وحساب مستحقاته النهائية
                    </p>
                </div>
                <button onClick={fetchEmployees} disabled={loading} className="btn btn-secondary"
                    style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <RefreshCw size={16} className={loading ? 'spin' : ''} />
                    تحديث
                </button>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: "24px", padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ flex: 1 }}>
                        <label style={lblStyle}>الشركة</label>
                        <select value={selectedCompanyId} onChange={e => setCompanyId(e.target.value)} style={selStyle}>
                            <option value="">كل الشركات</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: 2, position: "relative" }}>
                        <label style={lblStyle}>بحث في الموظفين النشطين</label>
                        <Search size={15} style={{ position: "absolute", right: "10px", top: "38px", color: "var(--text-muted)" }} />
                        <input type="text" placeholder="اسم أو رقم..." value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ ...selStyle, paddingRight: "32px" }} />
                    </div>
                </div>
            </div>

            {message && (
                <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px',
                    backgroundColor: message.type === 'success' ? '#E8F5E9' : '#FFEBEE',
                    color: message.type === 'success' ? '#2E7D32' : '#C62828',
                    border: `1px solid ${message.type === 'success' ? '#C8E6C9' : '#FFCDD2'}`
                 }}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span style={{ fontWeight: 600 }}>{message.text}</span>
                </div>
            )}

            {/* Main Layout */}
            <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "20px", alignItems: "start" }}>

                {/* Employee list */}
                <div className="card" style={{ padding: 0, maxHeight: "70vh", overflowY: "auto" }}>
                    <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700, color: "var(--text-primary)", fontSize: "0.92rem" }}>
                        <User size={15} style={{ display: "inline", marginLeft: "6px" }} />
                        الموظفون ({filteredEmps.length})
                    </div>
                    {/* Active / Terminated toggle */}
                    <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
                        <button onClick={() => setShowTerminated(false)} style={{
                            flex: 1, padding: "10px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.82rem",
                            background: !showTerminated ? "#E8F5E9" : "transparent", color: !showTerminated ? "#2E7D32" : "var(--text-muted)",
                            borderBottom: !showTerminated ? "2px solid #2E7D32" : "2px solid transparent"
                        }}>🟢 نشط</button>
                        <button onClick={() => setShowTerminated(true)} style={{
                            flex: 1, padding: "10px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.82rem",
                            background: showTerminated ? "#FFEBEE" : "transparent", color: showTerminated ? "#C62828" : "var(--text-muted)",
                            borderBottom: showTerminated ? "2px solid #C62828" : "2px solid transparent"
                        }}>🔴 منتهي</button>
                    </div>
                    {loading ? (
                        <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>جاري التحميل...</div>
                    ) : filteredEmps.map(emp => (
                        <div key={emp.id} onClick={() => setSelectedEmpId(emp.id)} style={{
                            padding: "13px 16px", cursor: "pointer", borderBottom: "1px solid var(--border)",
                            background: selectedEmpId === emp.id ? "#EEF2FF" : "transparent",
                            borderRight: selectedEmpId === emp.id ? "3px solid var(--primary, #3B82F6)" : "3px solid transparent",
                            transition: "all 0.15s",
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.88rem" }}>{emp.fullName}</div>
                                    <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "4px" }}>
                                        {emp.employeeNumber} - {emp.jobTitle}
                                    </div>
                                </div>
                                {showTerminated && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleReactivate(emp.id); }}
                                        title="إعادة تنشيط"
                                        style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #C8E6C9", background: "#E8F5E9", color: "#2E7D32", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600 }}
                                    >↩ تنشيط</button>
                                )}
                            </div>
                        </div>
                    ))}
                    {!loading && filteredEmps.length === 0 && (
                        <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                            لا يوجد موظفين متطابقين
                        </div>
                    )}
                </div>

                {/* Details Panel */}
                <div>
                    {!selectedEmp ? (
                        <div className="card" style={{ padding: "60px 32px", textAlign: "center" }}>
                            <UserX size={56} style={{ opacity: 0.12, margin: "0 auto 16px" }} />
                            <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>اختر موظفاً لإجراء التصفية</p>
                        </div>
                    ) : (
                        <div className="card" style={{ padding: "24px" }}>
                            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "16px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
                                {selectedEmp.fullName}
                            </h2>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
                                {/* Employee Info */}
                                <div>
                                    <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "12px" }}>معلومات الموظف</h3>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.9rem" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "var(--text-muted)" }}>الرقم الوظيفي:</span>
                                            <span style={{ fontWeight: 600 }}>{selectedEmp.employeeNumber}</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "var(--text-muted)" }}>الفرع:</span>
                                            <span style={{ fontWeight: 600 }}>{selectedEmp.branch || '-'}</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "var(--text-muted)" }}>تاريخ التعيين:</span>
                                            <span style={{ fontWeight: 600 }}>{new Date(selectedEmp.hireDate).toLocaleDateString('en-GB')}</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "var(--text-muted)" }}>مدة الخدمة:</span>
                                            <span style={{ fontWeight: 600 }}>{selectedEmp.serviceYears?.toFixed(2)} سنة</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Info */}
                                <div>
                                    <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "12px" }}>المستحقات المحسوبة</h3>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.9rem" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "var(--text-muted)" }}>الراتب الأساسي:</span>
                                            <span style={{ fontWeight: 600 }}>{fmt(selectedEmp.basicSalary)}</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "var(--text-muted)" }}>إجمالي مكافأة نهاية الخدمة:</span>
                                            <span style={{ fontWeight: 600 }}>{fmt(selectedEmp.grossEOS)}</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "var(--text-muted)" }}>رصيد الإجازات:</span>
                                            <span style={{ fontWeight: 600, direction: "ltr" }}>{Number(selectedEmp.leaveBalanceDays || 0).toFixed(2)} يوم</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "var(--text-muted)" }}>قيمة الإجازات:</span>
                                            <span style={{ fontWeight: 600, color: '#1976D2' }}>{fmt(selectedEmp.leaveCompensation)}</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "var(--text-muted)" }}>إجمالي الخصومات:</span>
                                            <span style={{ fontWeight: 600, color: '#C62828' }}>{fmt(selectedEmp.totalDeductions)}</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid var(--border)", paddingTop: "8px", marginTop: "4px" }}>
                                            <span style={{ fontWeight: "bold" }}>صافي المستحقات:</span>
                                            <span style={{ fontWeight: "bold", color: "#2E7D32", fontSize: "1.1rem" }}>{fmt(selectedEmp.finalPayable)} ر.س</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Settlement Form - only for active employees */}
                            {!showTerminated ? (
                            <div style={{ backgroundColor: "var(--bg-hover)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border)" }}>
                                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <Calendar size={18} color="var(--primary)" />
                                    تنفيذ التصفية
                                </h3>
                                
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                                    <div>
                                        <label style={lblStyle}>تاريخ الإنهاء</label>
                                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={selStyle} />
                                    </div>
                                    <div>
                                        <label style={lblStyle}>نوع الإنهاء</label>
                                        <select value={terminationType} onChange={e => setTerminationType(e.target.value)} style={selStyle}>
                                            <option value="RESIGNATION">استقالة</option>
                                            <option value="TERMINATION">إنهاء خدمة</option>
                                            <option value="CONTRACT_END">انتهاء عقد</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                                    <div>
                                        <label style={lblStyle}>خصومات إضافية (ر.س)</label>
                                        <input type="number" value={extraDeductions} onChange={e => setExtraDeductions(Number(e.target.value))} min={0} style={selStyle} placeholder="0" />
                                    </div>
                                    <div>
                                        <label style={lblStyle}>مكافآت إضافية (ر.س)</label>
                                        <input type="number" value={extraBonuses} onChange={e => setExtraBonuses(Number(e.target.value))} min={0} style={selStyle} placeholder="0" />
                                    </div>
                                </div>
                                <div style={{ marginBottom: "20px" }}>
                                    <label style={lblStyle}>ملاحظات</label>
                                    <textarea 
                                        value={notes} 
                                        onChange={e => setNotes(e.target.value)} 
                                        placeholder="أي ملاحظات إضافية..." 
                                        style={{ ...selStyle, minHeight: "80px", resize: "vertical" }} 
                                    />
                                </div>

                                {(extraDeductions > 0 || extraBonuses > 0) && (
                                    <div style={{ backgroundColor: "#FFF3E0", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", border: "1px solid #FFE0B2" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                                            <span style={{ fontWeight: 600, color: "#E65100" }}>الصافي المعدّل:</span>
                                            <span style={{ fontWeight: 800, color: "#E65100", fontSize: "1.05rem" }}>
                                                {fmt((selectedEmp?.finalPayable || 0) - extraDeductions + extraBonuses)} ر.س
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <button 
                                    onClick={handleSettle} 
                                    disabled={isExecuting}
                                    className="btn btn-primary" 
                                    style={{ width: "100%", padding: "12px", fontSize: "1.05rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
                                >
                                    {isExecuting ? (
                                        <>
                                            <RefreshCw size={20} className="spin" />
                                            جاري التنفيذ...
                                        </>
                                    ) : (
                                        <>
                                            <UserX size={20} />
                                            تأكيد وإنهاء الخدمة
                                        </>
                                    )}
                                </button>
                            </div>
                            ) : (
                            <div style={{ backgroundColor: "#FFF3E0", padding: "20px", borderRadius: "12px", border: "1px solid #FFE0B2" }}>
                                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#E65100", marginBottom: "12px" }}>⚠️ موظف منتهي الخدمة</h3>
                                <p style={{ color: "#BF360C", fontSize: "0.9rem", marginBottom: "16px" }}>
                                    تم إنهاء خدمة هذا الموظف. يمكنك إعادة تنشيطه إذا كان الإنهاء خطأ.
                                </p>
                                <button
                                    onClick={() => handleReactivate(selectedEmp!.id)}
                                    className="btn"
                                    style={{ width: "100%", padding: "12px", fontSize: "1rem", background: "#E8F5E9", color: "#2E7D32", border: "1px solid #C8E6C9", borderRadius: "8px", cursor: "pointer", fontWeight: 700 }}
                                >↩ إعادة تنشيط الموظف</button>
                            </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployeeSettlement;
