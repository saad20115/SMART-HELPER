import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { User, Bell, Shield, Globe, Save, Briefcase, Plus, Edit2, Trash2, X } from 'lucide-react';
import './Settings.css';
import { companiesApi, settingsApi } from '../api/settingsService';
import type { Company, Branch, Job, Classification } from '../api/settingsService';

const Settings = () => {
    const location = useLocation();

    const [activeTab, setActiveTab] = useState('profile');
    const [orgActiveTab, setOrgActiveTab] = useState('companies');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // State for organization data
    const [companies, setCompanies] = useState<Company[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [classifications, setClassifications] = useState<Classification[]>([]);

    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [modalInput, setModalInput] = useState('');

    useEffect(() => {
        if (location.state) {
            if (location.state.activeTab) {
                setActiveTab(location.state.activeTab);
            }
            if (location.state.orgActiveTab) {
                setOrgActiveTab(location.state.orgActiveTab);
            }
        }
    }, [location]);

    const loadCompanies = useCallback(async () => {
        try {
            const data = await companiesApi.getAll();
            setCompanies(data);
            if (data.length > 0 && !selectedCompanyId) {
                setSelectedCompanyId(data[0].id);
            }
        } catch (err) {
            console.error('Failed to load companies', err);
        }
    }, [selectedCompanyId]);

    useEffect(() => {
        loadCompanies();
    }, [loadCompanies]);

    const loadOrgData = useCallback(async () => {
        if (!selectedCompanyId && orgActiveTab !== 'companies') return;

        setLoading(true);
        setError(null);
        try {
            switch (orgActiveTab) {
                case 'companies': {
                    // Already loaded in loadCompanies, but refresh here if needed
                    const companiesData = await companiesApi.getAll();
                    setCompanies(companiesData);
                    break;
                }
                case 'branches': {
                    const branchesData = await settingsApi.getBranches(selectedCompanyId);
                    setBranches(branchesData);
                    break;
                }
                case 'jobs': {
                    const jobsData = await settingsApi.getJobs(selectedCompanyId);
                    setJobs(jobsData);
                    break;
                }
                case 'classifications': {
                    const classificationsData = await settingsApi.getClassifications(selectedCompanyId);
                    setClassifications(classificationsData);
                    break;
                }
            }
        } catch (err) {
            setError('فشل تحميل البيانات. تأكد من تشغيل الخادم.');
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    }, [orgActiveTab, selectedCompanyId]);

    // Load data based on active org tab
    useEffect(() => {
        loadOrgData();
    }, [loadOrgData]);

    const handleDelete = async (id: string | number) => {
        if (!confirm('هل أنت متأكد من الحذف؟')) return;

        try {
            switch (orgActiveTab) {
                case 'companies':
                    await companiesApi.delete(id as string);
                    break;
                case 'branches':
                    await settingsApi.deleteBranch(id as number);
                    break;
                case 'jobs':
                    await settingsApi.deleteJob(id as number);
                    break;
                case 'classifications':
                    await settingsApi.deleteClassification(id as number);
                    break;
            }
            await loadOrgData();
        } catch (err) {
            alert('فشل الحذف');
            console.error('Delete error:', err);
        }
    };

    const handleSaveItem = async () => {
        if (!modalInput.trim()) return;
        if (!selectedCompanyId && orgActiveTab !== 'companies') {
            alert('الرجاء اختيار الشركة أولاً');
            return;
        }

        try {
            if (modalMode === 'add') {
                switch (orgActiveTab) {
                    case 'companies':
                        // Simple company create for demo - usually requires more fields
                        await companiesApi.create({
                            name: modalInput,
                            email: 'info@example.com',
                            crNumber: Date.now().toString()
                        });
                        break;
                    case 'branches':
                        await settingsApi.createBranch(modalInput, selectedCompanyId);
                        break;
                    case 'jobs':
                        await settingsApi.createJob(modalInput, selectedCompanyId);
                        break;
                    case 'classifications':
                        await settingsApi.createClassification(modalInput, selectedCompanyId);
                        break;
                }
            } else {
                // Edit mode
                switch (orgActiveTab) {
                    case 'companies':
                        if (currentItem) await companiesApi.update(currentItem.id, { name: modalInput });
                        break;
                    case 'branches':
                        if (currentItem) await settingsApi.updateBranch(currentItem.id, modalInput);
                        break;
                    case 'jobs':
                        if (currentItem) await settingsApi.updateJob(currentItem.id, modalInput);
                        break;
                    case 'classifications':
                        if (currentItem) await settingsApi.updateClassification(currentItem.id, modalInput);
                        break;
                }
            }
            setIsModalOpen(false);
            setModalInput('');
            loadOrgData();
        } catch (err) {
            console.error('Save error:', err);
            alert('فشل الحفظ');
        }
    };

    const openAddModal = () => {
        setModalMode('add');
        setModalInput('');
        setCurrentItem(null);
        setIsModalOpen(true);
    };

    const openEditModal = (item: any) => {
        setModalMode('edit');
        setModalInput(item.name);
        setCurrentItem(item);
        setIsModalOpen(true);
    };

    const tabs = [
        { id: 'profile', label: 'الملف الشخصي', icon: User },
        { id: 'notifications', label: 'الإشعارات', icon: Bell },
        { id: 'security', label: 'الأمان', icon: Shield },
        { id: 'organization', label: 'المنشأة', icon: Briefcase },
        { id: 'general', label: 'عام', icon: Globe },
    ];

    const orgTabs = [
        { id: 'companies', label: 'الشركات' },
        { id: 'branches', label: 'الفروع' },
        { id: 'jobs', label: 'الوظائف' },
        { id: 'classifications', label: 'تصنيفات الموظفين' },
    ];

    const currentOrgData = (() => {
        switch (orgActiveTab) {
            case 'companies': return companies;
            case 'branches': return branches;
            case 'jobs': return jobs;
            case 'classifications': return classifications;
            default: return [];
        }
    })();

    return (
        <div className="container fade-in">
            <div className="card settings-container">
                <h2 className="settings-header">
                    الإعدادات
                </h2>

                <div className="settings-layout">
                    {/* Sidebar */}
                    <div className="settings-sidebar">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`settings-tab-button ${activeTab === tab.id ? 'active' : ''}`}
                                >
                                    <Icon size={20} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content Area */}
                    <div className="settings-content">
                        {activeTab === 'profile' && (
                            <div className="fade-in">
                                <h3 className="settings-section-title">معلومات الملف الشخصي</h3>
                                <div className="form-group">
                                    <label htmlFor="fullName">الاسم الكامل</label>
                                    <input id="fullName" type="text" defaultValue="أحمد محمد" title="الاسم الكامل" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email">البريد الإلكتروني</label>
                                    <input id="email" type="email" defaultValue="ahmed@example.com" title="البريد الإلكتروني" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="jobTitle">المسمى الوظيفي</label>
                                    <input id="jobTitle" type="text" defaultValue="مدير الموارد البشرية" readOnly className="read-only-input" title="المسمى الوظيفي" />
                                </div>
                                <button className="btn btn-primary btn-save">
                                    <Save size={18} />
                                    حفظ التغييرات
                                </button>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="fade-in">
                                <h3 className="settings-section-title">تفضيلات الإشعارات</h3>
                                <div className="notification-item">
                                    <div>
                                        <h4 className="notification-title">إشعارات البريد الإلكتروني</h4>
                                        <p className="notification-desc">استلام ملخص أسبوعي عبر البريد</p>
                                    </div>
                                    <input type="checkbox" defaultChecked className="notification-checkbox" title="تفعيل إشعارات البريد الإلكتروني" />
                                </div>
                                <div className="notification-item">
                                    <div>
                                        <h4 className="notification-title">تنبيهات النظام</h4>
                                        <p className="notification-desc">استلام إشعارات عند تحديث البيانات</p>
                                    </div>
                                    <input type="checkbox" defaultChecked className="notification-checkbox" title="تفعيل تنبيهات النظام" />
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="fade-in">
                                <h3 className="settings-section-title">الأمان وكلمة المرور</h3>
                                <div className="form-group">
                                    <label htmlFor="currentPassword">كلمة المرور الحالية</label>
                                    <input id="currentPassword" type="password" title="كلمة المرور الحالية" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="newPassword">كلمة المرور الجديدة</label>
                                    <input id="newPassword" type="password" title="كلمة المرور الجديدة" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</label>
                                    <input id="confirmPassword" type="password" title="تأكيد كلمة المرور الجديدة" />
                                </div>
                                <button className="btn btn-primary btn-save">
                                    تحديث كلمة المرور
                                </button>
                            </div>
                        )}

                        {activeTab === 'organization' && (
                            <div className="fade-in">
                                <h3 className="settings-section-title">إعدادات المنشأة</h3>

                                {/* Organization Sub-tabs */}
                                <div className="org-tabs">
                                    {orgTabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setOrgActiveTab(tab.id)}
                                            className={`org-tab-button ${orgActiveTab === tab.id ? 'active' : ''}`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Company Selector (only if not in companies tab) */}
                                {orgActiveTab !== 'companies' && (
                                    <div className="form-group" style={{ marginBottom: '16px' }}>
                                        <label htmlFor="companySelect">اختر الشركة</label>
                                        <select
                                            id="companySelect"
                                            value={selectedCompanyId}
                                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                                            className="form-control"
                                        >
                                            <option value="" disabled>-- اختر الشركة --</option>
                                            {companies.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="org-content-header">
                                    <h4 className="org-content-title">
                                        {orgTabs.find(t => t.id === orgActiveTab)?.label}
                                    </h4>
                                    <button className="btn btn-primary btn-sm" onClick={openAddModal}>
                                        <Plus size={16} />
                                        إضافة جديد
                                    </button>
                                </div>

                                {loading && (
                                    <div style={{ padding: '40px', textAlign: 'center', color: '#6C757D' }}>
                                        جاري التحميل...
                                    </div>
                                )}

                                {error && (
                                    <div style={{ padding: '20px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '8px', marginBottom: '16px' }}>
                                        {error}
                                    </div>
                                )}

                                {!loading && !error && (
                                    <div className="table-container">
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>الاسم</th>
                                                    <th style={{ width: '120px' }}>الإجراءات</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentOrgData.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={2} style={{ textAlign: 'center', padding: '40px', color: '#6C757D' }}>
                                                            لا توجد بيانات. يمكنك إضافة عنصر جديد.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    currentOrgData.map((item: any) => (
                                                        <tr key={item.id}>
                                                            <td>{item.name}</td>
                                                            <td>
                                                                <div className="action-buttons">
                                                                    <button className="btn-icon" title="تعديل" onClick={() => openEditModal(item)}>
                                                                        <Edit2 size={16} />
                                                                    </button>
                                                                    <button
                                                                        className="btn-icon trash"
                                                                        title="حذف"
                                                                        onClick={() => handleDelete(item.id)}
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'general' && (
                            <div className="fade-in">
                                <h3 className="settings-section-title">الإعدادات العامة</h3>
                                <div className="form-group">
                                    <label htmlFor="language">اللغة</label>
                                    <select id="language" defaultValue="ar" title="اختيار اللغة">
                                        <option value="ar">العربية</option>
                                        <option value="en">English</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="theme">المظهر</label>
                                    <select id="theme" defaultValue="light" title="اختيار المظهر">
                                        <option value="light">فاتح</option>
                                        <option value="dark">داكن</option>
                                        <option value="system">تلقائي</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Simple Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{modalMode === 'add' ? 'إضافة جديد' : 'تعديل العنصر'}</h3>
                            <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>الاسم</label>
                                <input
                                    type="text"
                                    value={modalInput}
                                    onChange={e => setModalInput(e.target.value)}
                                    placeholder="أدخل الاسم..."
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn" onClick={() => setIsModalOpen(false)}>إلغاء</button>
                            <button className="btn btn-primary" onClick={handleSaveItem}>حفظ</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    animation: fadeIn 0.2s;
                }
                .modal-content {
                    background-color: white;
                    border-radius: 8px;
                    width: 100%;
                    max-width: 400px;
                    padding: 24px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    animation: slideUp 0.3s;
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }
                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    margin-top: 24px;
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default Settings;
