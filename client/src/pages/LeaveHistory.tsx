import React, { useState, useEffect, useCallback } from "react";
import {
    Calendar, Search, RefreshCw, User, Clock,
    Filter, Plus, Trash2
} from "lucide-react";
import { leaveApi, companiesApi } from "../api/settingsService";

const TX_CONFIG = {
    ACCRUAL:    { label: "استحقاق",        color: "#2E7D32", bg: "#E8F5E9" },
    USAGE:      { label: "إجازة مستهلكة", color: "#C62828", bg: "#FFEBEE" },
    ADJUSTMENT: { label: "تعديل يدوي",    color: "#1565C0", bg: "#E3F2FD" },
    ENCASHMENT: { label: "صرف نقدي",      color: "#E65100", bg: "#FFF3E0" },
};

const MONTHS = [
    { v: 1,  l: "يناير"  }, { v: 2,  l: "فبراير"  }, { v: 3,  l: "مارس"   },
    { v: 4,  l: "أبريل"  }, { v: 5,  l: "مايو"    }, { v: 6,  l: "يونيو"  },
    { v: 7,  l: "يوليو"  }, { v: 8,  l: "أغسطس"   }, { v: 9,  l: "سبتمبر" },
    { v: 10, l: "أكتوبر" }, { v: 11, l: "نوفمبر"  }, { v: 12, l: "ديسمبر" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - i);

const LeaveHistory = () => {
    const [companies, setCompanies]         = useState<any[]>([]);
    const [selectedCompanyId, setCompanyId] = useState("");
    const [empList, setEmpList]             = useState<any[]>([]);
    const [selectedEmpId, setEmpId]         = useState("");
    const [empSearch, setEmpSearch]         = useState("");
    const [selectedMonth, setMonth]         = useState(0);
    const [selectedYear,  setYear]          = useState(0);
    const [history, setHistory]             = useState<any>(null);
    const [loading, setLoading]             = useState(false);
    const [loadingEmps, setLoadingEmps]     = useState(false);

    useEffect(() => {
        companiesApi.getAll().then((list: any[]) => {
            setCompanies(list);
        }).catch(console.error);
    }, []);

    useEffect(() => {
        setLoadingEmps(true); setEmpId(""); setHistory(null);
        const fetchEmps = async () => {
            try {
                if (selectedCompanyId) {
                    const r = await leaveApi.getCompanyHistory(selectedCompanyId);
                    setEmpList(r.employees);
                } else {
                    // All companies
                    const allEmps: any[] = [];
                    for (const c of companies) {
                        try {
                            const r = await leaveApi.getCompanyHistory(c.id);
                            allEmps.push(...r.employees);
                        } catch {}
                    }
                    setEmpList(allEmps);
                }
            } catch(e) { console.error(e); }
            finally { setLoadingEmps(false); }
        };
        if (companies.length > 0) fetchEmps();
        else setLoadingEmps(false);
    }, [selectedCompanyId, companies]);

    const fetchHistory = useCallback(async () => {
        if (!selectedEmpId) return;
        setLoading(true);
        try {
            const data = await leaveApi.getEmployeeHistory(
                selectedEmpId,
                selectedMonth || undefined,
                selectedYear  || undefined,
            );
            setHistory(data);
        } catch(e) { console.error(e); }
        finally   { setLoading(false); }
    }, [selectedEmpId, selectedMonth, selectedYear]);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    const fmt  = (v: number) => (v||0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtD = (v: number) => (v >= 0 ? "+" : "") + Number(v).toFixed(2);
    const fDate= (iso: string) => new Date(iso).toLocaleDateString("ar-SA", { year:"numeric", month:"short", day:"numeric" });

    // Add transaction modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [addType, setAddType]           = useState("USAGE");
    const [addDays, setAddDays]           = useState<number>(0);
    const [addReason, setAddReason]       = useState("");

    const handleAddTx = async () => {
        if (!selectedEmpId || addDays === 0) return;
        const days = addType === "USAGE" ? -Math.abs(addDays) : Math.abs(addDays);
        try {
            await leaveApi.addTransaction({ employeeId: selectedEmpId, type: addType, days, reason: addReason });
            setShowAddModal(false);
            setAddDays(0); setAddReason("");
            fetchHistory();
        } catch(e) { console.error(e); alert("فشلت الإضافة"); }
    };

    const handleDeleteTx = async (txId: string) => {
        if (!confirm("هل أنت متأكد من حذف هذه الحركة؟")) return;
        try {
            await leaveApi.deleteTransaction(txId);
            fetchHistory();
        } catch(e) { console.error(e); alert("فشل الحذف"); }
    };

    const filteredEmps = empList.filter(e =>
        e.fullName.includes(empSearch) || e.employeeNumber.includes(empSearch)
    );

    const txShown   = history?.transactions ?? [];
    const totalUsed = txShown.filter(t => t.type==="USAGE").reduce((s,t) => s + Math.abs(t.days), 0);
    const totalAdj  = txShown.filter(t => t.type==="ADJUSTMENT").reduce((s,t) => s + t.days, 0);
    const totalAcc  = txShown.filter(t => t.type==="ACCRUAL").reduce((s,t) => s + t.days, 0);

    const sel = { padding:"10px 12px", borderRadius:"8px", border:"1px solid var(--border)", background:"var(--bg-input,#fff)", color:"var(--text-primary)", width:"100%", fontSize:"0.9rem" };
    const lbl = { display:"block", marginBottom:"6px", fontSize:"0.85rem", fontWeight:"600", color:"var(--text-secondary)" };

    return (
        <div style={{ padding:"8px 0" }}>
            {/* Header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"28px" }}>
                <div>
                    <h1 style={{ fontSize:"1.75rem", fontWeight:800, color:"var(--text-primary)", marginBottom:"6px" }}>
                        سجل الإجازات التاريخي
                    </h1>
                    <p style={{ color:"var(--text-secondary)", fontSize:"0.93rem" }}>
                        تتبع حركات الإجازات لكل موظف — الاستحقاق والاستهلاك والتعديلات
                    </p>
                </div>
                <button onClick={fetchHistory} disabled={!selectedEmpId || loading} className="btn btn-secondary"
                    style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                    <RefreshCw size={16} />
                    تحديث
                </button>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom:"24px", padding:"20px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"16px" }}>
                    <Filter size={18} color="var(--primary,#3B82F6)" />
                    <span style={{ fontWeight:700, color:"var(--text-primary)" }}>الفلاتر</span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px,1fr))", gap:"16px" }}>
                    <div>
                        <label style={lbl}>الشركة</label>
                        <select value={selectedCompanyId} onChange={e => setCompanyId(e.target.value)} style={sel} title="الشركة">
                            <option value="">كل الشركات</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>الشهر</label>
                        <select value={selectedMonth} onChange={e => setMonth(Number(e.target.value))} style={sel} title="الشهر">
                            <option value={0}>كل الأشهر</option>
                            {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>السنة</label>
                        <select value={selectedYear} onChange={e => setYear(Number(e.target.value))} style={sel} title="السنة">
                            <option value={0}>كل السنوات</option>
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div style={{ position:"relative" }}>
                        <label style={lbl}>بحث في الموظفين</label>
                        <Search size={15} style={{ position:"absolute", right:"10px", top:"38px", color:"var(--text-muted)" }} />
                        <input type="text" placeholder="اسم أو رقم..." value={empSearch}
                            onChange={e => setEmpSearch(e.target.value)}
                            style={{ ...sel, paddingRight:"32px" }} />
                    </div>
                </div>
            </div>

            {/* Main Layout */}
            <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:"20px", alignItems:"start" }}>

                {/* Employee list */}
                <div className="card" style={{ padding:0, maxHeight:"78vh", overflowY:"auto" }}>
                    <div style={{ padding:"14px 16px", borderBottom:"1px solid var(--border)", fontWeight:700, color:"var(--text-primary)", fontSize:"0.92rem" }}>
                        <User size={15} style={{ display:"inline", marginLeft:"6px" }} />
                        الموظفون ({filteredEmps.length})
                    </div>
                    {loadingEmps ? (
                        <div style={{ padding:"32px", textAlign:"center", color:"var(--text-muted)" }}>جاري التحميل...</div>
                    ) : filteredEmps.map(emp => (
                        <div key={emp.id} onClick={() => setEmpId(emp.id)} style={{
                            padding:"13px 16px", cursor:"pointer", borderBottom:"1px solid var(--border)",
                            background: selectedEmpId===emp.id ? "#EEF2FF" : "transparent",
                            borderRight: selectedEmpId===emp.id ? "3px solid var(--primary,#3B82F6)" : "3px solid transparent",
                            transition:"all 0.15s",
                        }}>
                            <div style={{ fontWeight:600, color:"var(--text-primary)", fontSize:"0.88rem" }}>{emp.fullName}</div>
                            <div style={{ fontSize:"0.76rem", color:"var(--text-muted)", marginTop:"2px", display:"flex", gap:"8px" }}>
                                <span>{emp.employeeNumber}</span>
                                {emp.transactionCount > 0 && (
                                    <span style={{ background:"#E3F2FD", color:"#1565C0", borderRadius:"10px", padding:"1px 7px", fontSize:"0.72rem", fontWeight:600 }}>
                                        {emp.transactionCount} حركة
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* History Panel */}
                <div>
                    {!selectedEmpId ? (
                        <div className="card" style={{ padding:"60px 32px", textAlign:"center" }}>
                            <Calendar size={56} style={{ opacity:0.12, margin:"0 auto 16px" }} />
                            <p style={{ color:"var(--text-muted)", fontSize:"1rem" }}>اختر موظفاً لعرض سجل إجازاته</p>
                        </div>
                    ) : loading ? (
                        <div className="card" style={{ padding:"60px 32px", textAlign:"center" }}>
                            <RefreshCw size={40} style={{ opacity:0.25, margin:"0 auto 16px" }} />
                            <p style={{ color:"var(--text-muted)" }}>جاري تحميل البيانات...</p>
                        </div>
                    ) : history ? (
                        <>
                            {/* Employee header */}
                            <div className="card" style={{ marginBottom:"16px", padding:"18px 20px", borderRight:"4px solid var(--primary,#3B82F6)" }}>
                                <h2 style={{ fontSize:"1.2rem", fontWeight:800, color:"var(--text-primary)", marginBottom:"4px" }}>{history.employeeName}</h2>
                                <div style={{ color:"var(--text-secondary)", fontSize:"0.86rem", display:"flex", gap:"16px", flexWrap:"wrap" }}>
                                    <span>رقم: {history.employeeNumber}</span>
                                    <span>{history.jobTitle}</span>
                                    {history.branch && <span>{history.branch}</span>}
                                    <span>تعيين: {fDate(history.hireDate)}</span>
                                </div>
                            </div>

                            {/* Summary Cards */}
                            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"12px", marginBottom:"16px" }}>
                                {[
                                    { label:"الاستحقاق السنوي", value:`${history.annualEntitledDays.toFixed(0)} يوم`, color:"#1565C0" },
                                    { label:"المستهلك الكلي",   value:`${history.annualUsedDays.toFixed(1)} يوم`,    color:"#C62828" },
                                    { label:"الرصيد المتبقي",   value:`${history.calculatedRemainingDays.toFixed(1)} يوم`, color: history.calculatedRemainingDays>=0?"#2E7D32":"#C62828" },
                                    { label:"القيمة المالية",   value:`${fmt(history.leaveValue)} ر.س`,              color:"#E65100" },
                                    { label:"حركات الفترة",     value:`${txShown.length} حركة`,                      color:"#6A1B9A" },
                                ].map(c => (
                                    <div key={c.label} className="card" style={{ padding:"14px", borderTop:`3px solid ${c.color}`, textAlign:"center" }}>
                                        <div style={{ fontSize:"0.78rem", color:"var(--text-muted)", marginBottom:"5px" }}>{c.label}</div>
                                        <div style={{ fontWeight:800, fontSize:"1rem", color:c.color }}>{c.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Period mini-stats */}
                            {txShown.length > 0 && (
                                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px", marginBottom:"16px" }}>
                                    {[
                                        { label:"استحقاق الفترة", value:`+${totalAcc.toFixed(1)} يوم`,  color:"#2E7D32", bg:"#E8F5E9" },
                                        { label:"استهلاك الفترة", value:`-${totalUsed.toFixed(1)} يوم`, color:"#C62828", bg:"#FFEBEE" },
                                        { label:"تعديلات الفترة", value:`${fmtD(totalAdj)} يوم`,        color:"#1565C0", bg:"#E3F2FD" },
                                    ].map(s => (
                                        <div key={s.label} style={{ background:s.bg, borderRadius:"10px", padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                            <span style={{ fontSize:"0.85rem", color:s.color, fontWeight:600 }}>{s.label}</span>
                                            <span style={{ fontSize:"1rem", fontWeight:800, color:s.color }}>{s.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Transactions Table */}
                            <div className="card" style={{ padding:0, overflow:"hidden" }}>
                                <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border)", fontWeight:700, color:"var(--text-primary)", display:"flex", justifyContent:"space-between" }}>
                                    <span>
                                        <Clock size={15} style={{ display:"inline", marginLeft:"6px" }} />
                                        سجل الحركات
                                        {(selectedMonth>0||selectedYear>0) && (
                                            <span style={{ marginRight:"8px", fontSize:"0.8rem", color:"var(--text-muted)", fontWeight:400 }}>
                                                ({selectedMonth>0 ? MONTHS.find(m=>m.v===selectedMonth)?.l+" " : ""}{selectedYear>0 ? selectedYear : ""})
                                            </span>
                                        )}
                                    </span>
                                    <span style={{ fontSize:"0.85rem", fontWeight:400, color:"var(--text-muted)", display:"flex", alignItems:"center", gap:"8px" }}>
                                        {txShown.length} حركة
                                        <button onClick={() => setShowAddModal(true)} style={{ padding:"4px 10px", borderRadius:"6px", border:"1px solid #2E7D32", background:"#E8F5E9", color:"#2E7D32", cursor:"pointer", fontSize:"0.8rem", fontWeight:600, display:"flex", alignItems:"center", gap:"4px" }}>
                                            <Plus size={14} /> إضافة
                                        </button>
                                    </span>
                                </div>

                                {txShown.length===0 ? (
                                    <div style={{ padding:"48px", textAlign:"center", color:"var(--text-muted)" }}>
                                        <Calendar size={40} style={{ opacity:0.18, margin:"0 auto 12px" }} />
                                        <p>لا توجد حركات في هذه الفترة</p>
                                        <p style={{ fontSize:"0.85rem", marginTop:"4px" }}>جرب تغيير الشهر أو السنة</p>
                                    </div>
                                ) : (
                                    <div style={{ overflowX:"auto" }}>
                                        <table style={{ width:"100%", borderCollapse:"collapse" }}>
                                            <thead style={{ background:"var(--bg-hover,#F8F9FA)" }}>
                                                <tr>
                                                    {["التاريخ","نوع الحركة","الأيام","الرصيد بعد الحركة","السبب / الملاحظات",""].map(h=>(
                                                        <th key={h} style={{ padding:"12px 16px", textAlign:"right", fontWeight:600, fontSize:"0.86rem", color:"var(--text-secondary)", whiteSpace:"nowrap" }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {txShown.map((tx, idx) => {
                                                    const cfg = TX_CONFIG[tx.type] || { label:tx.type, color:"#666", bg:"#f5f5f5" };
                                                    const isNeg = tx.days < 0;
                                                    return (
                                                        <tr key={tx.id} style={{ borderBottom:"1px solid var(--border)", background: idx%2===0?"transparent":"var(--bg-hover,#FAFAFA)" }}>
                                                            <td style={{ padding:"13px 16px", color:"var(--text-secondary)", fontSize:"0.87rem", whiteSpace:"nowrap" }}>{fDate(tx.createdAt)}</td>
                                                            <td style={{ padding:"13px 16px" }}>
                                                                <span style={{ display:"inline-flex", alignItems:"center", gap:"5px", padding:"4px 10px", borderRadius:"20px", fontSize:"0.82rem", fontWeight:600, color:cfg.color, background:cfg.bg }}>
                                                                    {cfg.label}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding:"13px 16px", fontWeight:700, color:isNeg?"#C62828":"#2E7D32", fontSize:"1rem", whiteSpace:"nowrap" }}>
                                                                {fmtD(tx.days)} يوم
                                                            </td>
                                                            <td style={{ padding:"13px 16px", fontWeight:600, color:"var(--text-primary)", whiteSpace:"nowrap" }}>
                                                                {tx.balanceAfter!==null ? `${Number(tx.balanceAfter).toFixed(2)} يوم` : "—"}
                                                            </td>
                                                            <td style={{ padding:"13px 16px", color:"var(--text-secondary)", fontSize:"0.87rem", maxWidth:"260px" }}>
                                                                {tx.reason || <span style={{ color:"var(--text-muted)", fontStyle:"italic" }}>—</span>}
                                                            </td>
                                                            <td style={{ padding:"13px 16px", textAlign:"center" }}>
                                                                <button
                                                                    onClick={() => handleDeleteTx(tx.id)}
                                                                    title="حذف الحركة"
                                                                    style={{ padding:"5px 8px", borderRadius:"4px", border:"1px solid #FFCDD2", background:"#fff", color:"#C62828", cursor:"pointer" }}
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : null}
                </div>
            </div>

            {/* Add Transaction Modal */}
            {showAddModal && (
                <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
                    <div style={{ backgroundColor:"#fff", borderRadius:"16px", padding:"32px", width:"420px" }}>
                        <h3 style={{ marginBottom:"20px", color:"#111" }}>➕ إضافة حركة جديدة</h3>

                        <div style={{ display:"grid", gap:"14px" }}>
                            <div>
                                <label style={{ display:"block", marginBottom:"6px", fontWeight:600, color:"#495057" }}>نوع الحركة</label>
                                <select value={addType} onChange={e => setAddType(e.target.value)} style={{ width:"100%", padding:"10px", border:"1px solid #E9ECEF", borderRadius:"8px" }}>
                                    <option value="USAGE">إجازة مستهلكة</option>
                                    <option value="ACCRUAL">استحقاق</option>
                                    <option value="ADJUSTMENT">تعديل يدوي</option>
                                    <option value="ENCASHMENT">صرف نقدي</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display:"block", marginBottom:"6px", fontWeight:600, color:"#495057" }}>عدد الأيام</label>
                                <input type="number" value={addDays} onChange={e => setAddDays(Number(e.target.value))} min={0} style={{ width:"100%", padding:"10px", border:"1px solid #E9ECEF", borderRadius:"8px" }} />
                                <div style={{ fontSize:"0.8rem", color:"#6C757D", marginTop:"4px" }}>
                                    {addType === "USAGE" ? "سيُخصم من الرصيد (−)" : "سيُضاف للرصيد (+)"}
                                </div>
                            </div>
                            <div>
                                <label style={{ display:"block", marginBottom:"6px", fontWeight:600, color:"#495057" }}>السبب / الملاحظات</label>
                                <input type="text" value={addReason} onChange={e => setAddReason(e.target.value)} placeholder="مثال: إجازة سنوية - يناير 2024" style={{ width:"100%", padding:"10px", border:"1px solid #E9ECEF", borderRadius:"8px" }} />
                            </div>
                        </div>

                        <div style={{ display:"flex", gap:"12px", marginTop:"24px" }}>
                            <button className="btn btn-primary" onClick={handleAddTx} style={{ flex:1 }}>حفظ الحركة</button>
                            <button className="btn" onClick={() => setShowAddModal(false)} style={{ flex:1, backgroundColor:"#F8F9FA", color:"#495057" }}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveHistory;