import React, { useEffect, useState } from 'react';
import { AlertTriangle, Download, Trash2, Upload, RotateCcw, Save } from 'lucide-react';
import { backupApi, type BackupFile } from '../api/settingsService';
import { format } from 'date-fns';

export default function BackupRestore() {
    const [backups, setBackups] = useState<BackupFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchBackups();
    }, []);

    const fetchBackups = async () => {
        try {
            const data = await backupApi.getBackups();
            setBackups(data);
        } catch (error) {
            console.error('Failed to fetch backups', error);
        }
    };

    const handleCreateBackup = async () => {
        if (!confirm('هل أنت متأكد أنك تريد إنشاء نسخة احتياطية جديدة؟')) return;
        setLoading(true);
        try {
            await backupApi.createBackup();
            await fetchBackups();
            alert('تم إنشاء النسخة الاحتياطية بنجاح');
        } catch (error) {
            console.error('Failed to create backup', error);
            alert('فشل إنشاء النسخة الاحتياطية');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (filename: string) => {
        if (!confirm(`تحذير هام جدًا: \nهل أنت متأكد تمامًا أنك تريد استعادة النسخة "${filename}"؟\n\nسيتم حذف جميع البيانات الحالية واستبدالها ببيانات النسخة الاحتياطية. هذا الإجراء لا يمكن التراجع عنه.`)) return;

        // Double confirmation for safety
        const input = prompt(`للتأكيد، يرجى كتابة "استعادة" في الخانة أدناه:`);
        if (input !== 'استعادة') {
            alert('تم إلغاء العملية.');
            return;
        }

        setLoading(true);
        try {
            await backupApi.restoreBackup(filename);
            alert('تم استعادة النسخة الاحتياطية بنجاح. سيتم إعادة تحميل الصفحة.');
            window.location.reload();
        } catch (error) {
            console.error('Failed to restore backup', error);
            alert('فشل استعادة النسخة الاحتياطية');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (filename: string) => {
        if (!confirm(`هل أنت متأكد أنك تريد حذف النسخة "${filename}"؟`)) return;
        try {
            await backupApi.deleteBackup(filename);
            setBackups(prev => prev.filter(b => b.filename !== filename));
        } catch (error) {
            console.error('Failed to delete backup', error);
            alert('فشل حذف النسخة الاحتياطية');
        }
    };

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            await backupApi.uploadBackup(file);
            await fetchBackups();
            alert('تم رفع ملف النسخة الاحتياطية بنجاح');
        } catch (error) {
            console.error('Failed to upload backup', error);
            alert('فشل رفع الملف. تأكد أن الملف بصيغة JSON سليمة.');
        } finally {
            setUploading(false);
            if (event.target) event.target.value = ''; // Reset input
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="p-6 space-y-6 dir-rtl" style={{ direction: 'rtl' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>النسخ الاحتياطي والاستعادة</h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleUpload}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                            disabled={uploading}
                        />
                        <button className="btn" disabled={uploading}>
                            <Upload className="mr-2 h-4 w-4" style={{ marginLeft: '8px' }} />
                            {uploading ? 'جاري الرفع...' : 'رفع نسخة احتياطية'}
                        </button>
                    </div>
                    <button className="btn btn-primary" onClick={handleCreateBackup} disabled={loading}>
                        <Save className="mr-2 h-4 w-4" style={{ marginLeft: '8px' }} />
                        {loading ? 'جاري العمل...' : 'إنشاء نسخة احتياطية يدوية'}
                    </button>
                </div>
            </div>

            <div className="card">
                <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>سجل النسخ الاحتياطية</h3>
                </div>
                <div style={{ padding: '24px' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>اسم الملف</th>
                                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>تاريخ الإنشاء</th>
                                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>الحجم</th>
                                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {backups.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                                            لا توجد نسخ احتياطية محفوظة
                                        </td>
                                    </tr>
                                ) : (
                                    backups.map((backup) => (
                                        <tr key={backup.filename} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '12px', fontWeight: '500' }}>{backup.filename}</td>
                                            <td style={{ padding: '12px' }}>
                                                {format(new Date(backup.createdAt), 'dd/MM/yyyy - hh:mm a')}
                                            </td>
                                            <td style={{ padding: '12px' }}>{formatSize(backup.size)}</td>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() => window.open(backupApi.getDownloadUrl(backup.filename), '_blank')}
                                                        title="تحميل"
                                                    >
                                                        <Download className="h-4 w-4 text-blue-600" />
                                                    </button>
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() => handleRestore(backup.filename)}
                                                        title="استعادة"
                                                    >
                                                        <RotateCcw className="h-4 w-4 text-orange-600" />
                                                    </button>
                                                    <button
                                                        className="btn-icon trash"
                                                        onClick={() => handleDelete(backup.filename)}
                                                        title="حذف"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600" />
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
            </div>

            <div style={{ backgroundColor: '#fffbeb', borderRight: '4px solid #f59e0b', padding: '16px', borderRadius: '4px', marginTop: '24px' }}>
                <div style={{ display: 'flex' }}>
                    <div style={{ flexShrink: 0 }}>
                        <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                    </div>
                    <div style={{ marginRight: '12px' }}>
                        <p style={{ fontSize: '0.875rem', color: '#b45309' }}>
                            <strong style={{ fontWeight: 'bold' }}>تحذير هام:</strong> عملية الاستعادة ستقوم بمسح كافة البيانات الحالية واستبدالها ببيانات النسخة الاحتياطية. تأكد من أنك قمت بإنشاء نسخة احتياطية حديثة قبل القيام بأي عملية استعادة.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
