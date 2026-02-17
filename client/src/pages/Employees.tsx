import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Eye, Trash2, Filter, Briefcase, Upload, Download } from 'lucide-react';
import ImportExportModal from '../components/ImportExportModal';
import { employeesApi, type Employee, companiesApi, type Company, settingsApi, type Branch, type Job, type Classification } from '../api/settingsService';
import SearchableSelect from '../components/SearchableSelect';

const Employees: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [classifications, setClassifications] = useState<Classification[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showImportModal, setShowImportModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        employeeNumber: '',
        nationalId: '',
        jobTitle: '',
        basicSalary: '0',
        housingAllowance: '0',
        transportAllowance: '0',
        otherAllowances: '0',
        hireDate: '',
        companyId: '',
        branch: '',
        classification: '',
        status: 'active' as 'active' | 'inactive',
        totalSalary: '0',
        vacationBalance: '0',
    });

    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [empData, compData] = await Promise.all([
                employeesApi.getAll(),
                companiesApi.getAll()
            ]);
            setEmployees(empData);
            setCompanies(compData);

            if (compData.length > 0) {
                const initialCompanyId = formData.companyId || compData[0].id;
                if (!formData.companyId) {
                    setFormData(prev => ({ ...prev, companyId: initialCompanyId }));
                }

                // Fetch settings for the company
                const [branchData, jobData, classData] = await Promise.all([
                    settingsApi.getBranches(initialCompanyId),
                    settingsApi.getJobs(initialCompanyId),
                    settingsApi.getClassifications(initialCompanyId)
                ]);
                setBranches(branchData);
                setJobs(jobData);
                setClassifications(classData);
            }
        } catch (error: any) {
            console.error('Error loading employees:', error);
            setError('فشل تحميل بيانات الموظفين. تأكد من تشغيل الخادم (Server). التفاصيل: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    }, [formData.companyId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };

        // Recalculate total salary if any component changes
        if (['basicSalary', 'housingAllowance', 'transportAllowance', 'otherAllowances'].includes(name)) {
            const basic = Number(newFormData.basicSalary) || 0;
            const housing = Number(newFormData.housingAllowance) || 0;
            const transport = Number(newFormData.transportAllowance) || 0;
            const other = Number(newFormData.otherAllowances) || 0;
            newFormData.totalSalary = (basic + housing + transport + other).toString();
        }

        setFormData(newFormData);
    };

    const handleEditClick = (emp: Employee) => {
        setEditingEmployee(emp);
        setFormData({
            fullName: emp.fullName,
            employeeNumber: emp.employeeNumber,
            nationalId: emp.nationalId,
            jobTitle: emp.jobTitle,
            basicSalary: emp.basicSalary.toString(),
            housingAllowance: emp.housingAllowance.toString(),
            transportAllowance: emp.transportAllowance.toString(),
            otherAllowances: emp.otherAllowances.toString(),
            hireDate: emp.hireDate.split('T')[0],
            companyId: emp.companyId,
            branch: emp.branch || '',
            classification: emp.classification || '',
            status: emp.status || 'active',
            totalSalary: (emp.totalSalary || 0).toString(),
            vacationBalance: (emp.vacationBalance || 0).toString(),
        });
        setShowAddForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                fullName: formData.fullName,
                employeeNumber: formData.employeeNumber,
                nationalId: formData.nationalId,
                jobTitle: formData.jobTitle,
                basicSalary: Number(formData.basicSalary),
                housingAllowance: Number(formData.housingAllowance),
                transportAllowance: Number(formData.transportAllowance),
                otherAllowances: Number(formData.otherAllowances),
                hireDate: formData.hireDate,
                companyId: formData.companyId,
                branch: formData.branch,
                classification: formData.classification,
                status: formData.status,
                totalSalary: Number(formData.totalSalary),
                vacationBalance: Number(formData.vacationBalance),
            };

            if (editingEmployee) {
                await employeesApi.update(editingEmployee.id, payload);
            } else {
                await employeesApi.create(payload);
            }

            setShowAddForm(false);
            setEditingEmployee(null);
            loadData();
        } catch (error) {
            console.error(error);
            alert(editingEmployee ? 'فشل تحديث الموظف' : 'فشل إضافة الموظف');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الموظف؟')) return;
        try {
            await employeesApi.delete(id);
            loadData();
        } catch (error) {
            console.error(error);
            alert('فشل الحذف');
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const blob = await employeesApi.getTemplate();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'employee_template.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error(error);
            alert('فشل تحميل القالب');
        }
    };

    const handleImport = async (file: File) => {
        try {
            const result = await employeesApi.importEmployees(file, formData.companyId, 'user-id-placeholder');
            if (result.success) loadData();
            return result;
        } catch (error: any) {
            return { success: false, error: error.response?.data?.message || error.message };
        }
    };

    const handleExport = async (format: string) => {
        try {
            // TODO: Get userId from context or local storage. Using placeholder as per plan since no auth guard globally.
            const userId = 'user-id-placeholder';
            const blob = await employeesApi.exportEmployees(formData.companyId, format, userId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `employees_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error(error);
            alert('فشل التصدير');
        }
    };

    if (loading && employees.length === 0) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>جاري تحميل البيانات...</div>;
    }

    if (error) {
        return (
            <div style={{ padding: '20px', backgroundColor: '#F8D7DA', color: '#721C24', borderRadius: '8px', margin: '20px' }}>
                <h3 style={{ margin: '0 0 10px 0' }}>خطأ في النظام</h3>
                <p>{error}</p>
                <button onClick={loadData} className="btn" style={{ marginTop: '10px', backgroundColor: '#fff', border: '1px solid #721C24', color: '#721C24' }}>
                    إعادة المحاولة
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Header and Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>إدارة الموظفين</h2>
                    <p style={{ color: '#6C757D' }}>عرض {employees.length} موظف نشط</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="btn"
                        onClick={handleDownloadTemplate}
                        style={{ backgroundColor: '#fff', border: '1px solid #1976D2', color: '#1976D2' }}
                    >
                        <Download size={20} />
                        <span>تحميل القالب</span>
                    </button>
                    <button
                        className="btn"
                        onClick={() => setShowImportModal(true)}
                        style={{ backgroundColor: '#fff', border: '1px solid #2E7D32', color: '#2E7D32' }}
                    >
                        <Upload size={20} />
                        <span>استيراد</span>
                    </button>
                    <button
                        className="btn"
                        onClick={() => setShowExportModal(true)}
                        style={{ backgroundColor: '#fff', border: '1px solid #2E7D32', color: '#2E7D32' }}
                    >
                        <Download size={20} />
                        <span>تصدير</span>
                    </button>
                    <button className="btn btn-primary" onClick={() => {
                        setEditingEmployee(null);
                        setFormData({
                            fullName: '',
                            employeeNumber: '',
                            nationalId: '',
                            jobTitle: '',
                            basicSalary: '0',
                            housingAllowance: '0',
                            transportAllowance: '0',
                            otherAllowances: '0',
                            hireDate: '',
                            companyId: companies[0]?.id || '',
                            branch: '',
                            classification: '',
                            status: 'active',
                            totalSalary: '0',
                            vacationBalance: '0',
                        });
                        setShowAddForm(!showAddForm);
                    }}>
                        <Plus size={20} />
                        <span>إضافة موظف جديد</span>
                    </button>
                </div>
            </div>

            <ImportExportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                mode="import"
                onImport={handleImport}
            />

            <ImportExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                mode="export"
                onExport={handleExport}
            />


            {/* Filters Bar */}
            <div className="card" style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#ADB5BD' }} />
                    <input
                        type="text"
                        placeholder="بحث بالاسم أو الرقم الوظيفي..."
                        style={{ paddingRight: '40px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <select title="اختر الشركة لتصفية الموظفين" style={{ minWidth: '160px' }}>
                        <option>كل الشركات</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button className="btn" style={{ backgroundColor: '#fff', border: '1px solid #E9ECEF', color: '#495057' }}>
                        <Filter size={18} />
                        <span>تصفية</span>
                    </button>
                </div>
            </div>

            {
                showAddForm && (
                    <div className="card fade-in" style={{ marginBottom: '24px', borderTop: '4px solid #2E7D32' }}>
                        <h3 style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #E9ECEF' }}>
                            {editingEmployee ? 'تعديل بيانات الموظف' : 'بيانات الموظف الجديد'}
                        </h3>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
                            {/* Personal Info */}
                            <div style={{ gridColumn: 'span 4' }}>
                                <label htmlFor="fullName">الاسم الكامل</label>
                                <input id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="مثال: محمد عبدالله" required />
                            </div>
                            <div style={{ gridColumn: 'span 4' }}>
                                <label htmlFor="employeeNumber">الرقم الوظيفي</label>
                                <input id="employeeNumber" name="employeeNumber" value={formData.employeeNumber} onChange={handleInputChange} placeholder="EMP001" required />
                            </div>
                            <div style={{ gridColumn: 'span 4' }}>
                                <label htmlFor="nationalId">رقم الهوية</label>
                                <input id="nationalId" name="nationalId" value={formData.nationalId} onChange={handleInputChange} placeholder="10XXXXXXXX" required />
                            </div>
                            <div style={{ gridColumn: 'span 4' }}>
                                <SearchableSelect
                                    label="الشركة"
                                    required
                                    value={formData.companyId}
                                    onChange={(val) => setFormData({ ...formData, companyId: val })}
                                    options={companies.map(c => ({ value: c.id, label: c.name }))}
                                    placeholder="اختر الشركة..."
                                />
                            </div>

                            <div style={{ gridColumn: 'span 4' }}>
                                <SearchableSelect
                                    label="المسمى الوظيفي"
                                    required
                                    value={formData.jobTitle}
                                    onChange={(val) => setFormData({ ...formData, jobTitle: val })}
                                    options={jobs.map(j => ({ value: j.name, label: j.name }))}
                                    placeholder="اختر أو ابحث عن مسمى..."
                                />
                            </div>
                            <div style={{ gridColumn: 'span 4' }}>
                                <SearchableSelect
                                    label="الفرع"
                                    value={formData.branch}
                                    onChange={(val) => setFormData({ ...formData, branch: val })}
                                    options={branches.map(b => ({ value: b.name, label: b.name }))}
                                    placeholder="اختر أو ابحث عن فرع..."
                                />
                            </div>
                            <div style={{ gridColumn: 'span 4' }}>
                                <SearchableSelect
                                    label="التصنيف"
                                    value={formData.classification}
                                    onChange={(val) => setFormData({ ...formData, classification: val })}
                                    options={classifications.map(c => ({ value: c.name, label: c.name }))}
                                    placeholder="اختر أو ابحث عن تصنيف..."
                                />
                            </div>
                            <div style={{ gridColumn: 'span 4' }}>
                                <label>تاريخ التعيين</label>
                                <input type="date" name="hireDate" value={formData.hireDate} onChange={handleInputChange} required />
                            </div>
                            <div style={{ gridColumn: 'span 4' }}>
                                <label>الحالة</label>
                                <select title="حالة الموظف" name="status" value={formData.status} onChange={handleInputChange} required>
                                    <option value="active">نشط</option>
                                    <option value="inactive">غير نشط</option>
                                </select>
                            </div>

                            {/* Salary Info */}
                            <div style={{ gridColumn: 'span 12', marginTop: '16px', borderTop: '1px dashed #E9ECEF', paddingTop: '16px', fontWeight: 'bold', color: '#6C757D' }}>بيانات الراتب</div>

                            <div style={{ gridColumn: 'span 3' }}>
                                <label htmlFor="basicSalary">الراتب الأساسي</label>
                                <input id="basicSalary" type="number" name="basicSalary" value={formData.basicSalary} onChange={handleInputChange} required />
                            </div>
                            <div style={{ gridColumn: 'span 3' }}>
                                <label htmlFor="housingAllowance">بدل السكن</label>
                                <input id="housingAllowance" type="number" name="housingAllowance" value={formData.housingAllowance} onChange={handleInputChange} required />
                            </div>
                            <div style={{ gridColumn: 'span 3' }}>
                                <label htmlFor="transportAllowance">بدل النقل</label>
                                <input id="transportAllowance" type="number" name="transportAllowance" value={formData.transportAllowance} onChange={handleInputChange} required />
                            </div>
                            <div style={{ gridColumn: 'span 3' }}>
                                <label htmlFor="otherAllowances">بدلات أخرى</label>
                                <input id="otherAllowances" type="number" name="otherAllowances" value={formData.otherAllowances} onChange={handleInputChange} />
                            </div>
                            <div style={{ gridColumn: 'span 12' }}>
                                <label htmlFor="totalSalary" style={{ color: '#2E7D32', fontWeight: 'bold' }}>الراتب الشامل</label>
                                <input id="totalSalary" type="number" name="totalSalary" value={formData.totalSalary} readOnly style={{ backgroundColor: '#F1F8E9', border: '1px solid #C8E6C9', fontWeight: 'bold', color: '#2E7D32' }} />
                            </div>

                            <div style={{ gridColumn: 'span 12' }}>
                                <label htmlFor="vacationBalance">رصيد الإجازات الابتدائي (يوم)</label>
                                <input id="vacationBalance" type="number" name="vacationBalance" value={formData.vacationBalance} onChange={handleInputChange} placeholder="0" />
                                <p style={{ fontSize: '0.8rem', color: '#6C757D', marginTop: '4px' }}>أدخل الرصيد المتبقي للموظف حتى تاريخ التعيين المدخل أعلاه.</p>
                            </div>

                            <div style={{ gridColumn: 'span 12', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid #E9ECEF', paddingTop: '24px' }}>
                                <button type="button" className="btn" style={{ backgroundColor: '#F8F9FA', color: '#495057' }} onClick={() => {
                                    setShowAddForm(false);
                                    setEditingEmployee(null);
                                }}>إلغاء</button>
                                <button type="submit" className="btn btn-primary" style={{ minWidth: '120px' }}>
                                    {editingEmployee ? 'تحديث البيانات' : 'حفظ الموظف'}
                                </button>
                            </div>
                        </form>
                    </div>
                )
            }

            {/* Employees Table */}
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#F8F9FA', borderBottom: '2px solid #E9ECEF' }}>
                        <tr>
                            <th style={{ padding: '20px', textAlign: 'right', fontWeight: '700', color: '#495057' }}>الاسم</th>
                            <th style={{ padding: '20px', textAlign: 'right', fontWeight: '700', color: '#495057' }}>الرقم الوظيفي</th>
                            <th style={{ padding: '20px', textAlign: 'right', fontWeight: '700', color: '#495057' }}>الوظيفة / الفرع</th>
                            <th style={{ padding: '20px', textAlign: 'right', fontWeight: '700', color: '#495057' }}>تاريخ الانضمام</th>
                            <th style={{ padding: '20px', textAlign: 'right', fontWeight: '700', color: '#495057' }}>إجمالي الراتب</th>
                            <th style={{ padding: '20px', textAlign: 'center', fontWeight: '700', color: '#495057' }}>رصيد الإجازات</th>
                            <th style={{ padding: '20px', textAlign: 'center', fontWeight: '700', color: '#495057' }}>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.filter(emp => emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || emp.employeeNumber.includes(searchTerm)).map((emp) => (
                            <tr key={emp.id} style={{ borderBottom: '1px solid #E9ECEF', transition: 'background-color 0.2s' }}>
                                <td style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        backgroundColor: '#E8F5E9',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#2E7D32',
                                        fontWeight: 'bold'
                                    }}>
                                        {emp.fullName.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{emp.fullName}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#ADB5BD', fontFamily: 'monospace' }}>#{emp.nationalId}</div>
                                    </div>
                                </td>
                                <td style={{ padding: '20px', color: '#495057' }}>{emp.employeeNumber}</td>
                                <td style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Briefcase size={14} color="#ADB5BD" />
                                        <span>{emp.jobTitle}</span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#6C757D', marginTop: '4px' }}>{emp.branch || 'المركز الرئيسي'}</div>
                                </td>
                                <td style={{ padding: '20px', color: '#495057' }}>{emp.hireDate.split('T')[0]}</td>
                                <td style={{ padding: '20px', fontWeight: '700', color: '#2E7D32', fontSize: '1rem' }}>{Number(emp.totalSalary).toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>ر.س</span></td>
                                <td style={{ padding: '20px', textAlign: 'center', fontWeight: 'bold' }}>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '12px',
                                        backgroundColor: (emp.vacationBalance || 0) > 0 ? '#E3F2FD' : '#FFEBEE',
                                        color: (emp.vacationBalance || 0) > 0 ? '#1976D2' : '#C62828'
                                    }}>
                                        {Number(emp.vacationBalance || 0).toFixed(2)} يوم
                                    </span>
                                </td>
                                <td style={{ padding: '20px', textAlign: 'center' }}>
                                    <span style={{
                                        padding: '6px 12px',
                                        borderRadius: '20px',
                                        backgroundColor: (emp.status === 'active' || !emp.status) ? '#E8F5E9' : '#F8D7DA',
                                        color: (emp.status === 'active' || !emp.status) ? '#2E7D32' : '#DC3545',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold'
                                    }}>
                                        {(emp.status === 'active' || !emp.status) ? 'نشط' : 'غير نشط'}
                                    </span>
                                </td>
                                <td style={{ padding: '20px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                        <button title="تعديل بيانات الموظف" className="btn" style={{ padding: '8px', backgroundColor: '#F8F9FA' }} onClick={() => handleEditClick(emp)}>
                                            <Eye size={18} color="#495057" />
                                        </button>
                                        <button
                                            title="حذف الموظف"
                                            className="btn"
                                            style={{ padding: '8px', backgroundColor: '#FFF5F5', border: '1px solid #FFCDD2' }}
                                            onClick={() => handleDelete(emp.id)}
                                        >
                                            <Trash2 size={18} color="#DC3545" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderTop: '1px solid #E9ECEF' }}>
                    <span style={{ fontSize: '0.9rem', color: '#6C757D' }}>عرض {employees.length} موظف</span>
                </div>
            </div>
        </div>
    );
};

export default Employees;
