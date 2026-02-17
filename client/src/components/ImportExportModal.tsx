import React, { useState } from 'react';
import { X, Upload, Download, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';

interface ImportExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'import' | 'export';
    onImport?: (file: File) => Promise<any>;
    onExport?: (format: string) => Promise<void>;
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({
    isOpen,
    onClose,
    mode,
    onImport,
    onExport,
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [exportFormat, setExportFormat] = useState<string>('XLSX');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleImport = async () => {
        if (!selectedFile || !onImport) return;

        setIsProcessing(true);
        try {
            const response = await onImport(selectedFile);
            setResult(response);
        } catch (error) {
            setResult({ success: false, error: error instanceof Error ? error.message : String(error) });
        }
        setIsProcessing(false);
    };

    const handleExport = async () => {
        if (!onExport) return;

        setIsProcessing(true);
        try {
            await onExport(exportFormat);
            setResult({ success: true });
            setTimeout(() => {
                onClose();
                setResult(null);
            }, 2000);
        } catch (error) {
            setResult({ success: false, error: error instanceof Error ? error.message : String(error) });
        }
        setIsProcessing(false);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
        }}>
            <div className="card" style={{
                width: '90%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflow: 'auto',
                position: 'relative',
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                    paddingBottom: '16px',
                    borderBottom: '2px solid #E9ECEF',
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>
                        {mode === 'import' ? (
                            <>
                                <Upload size={24} style={{ verticalAlign: 'middle', marginLeft: '8px' }} />
                                استيراد الموظفين
                            </>
                        ) : (
                            <>
                                <Download size={24} style={{ verticalAlign: 'middle', marginLeft: '8px' }} />
                                تصدير الموظفين
                            </>
                        )}
                    </h2>
                    <button
                        onClick={onClose}
                        className="btn"
                        style={{ padding: '8px', backgroundColor: '#F8F9FA' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {!result ? (
                    <>
                        {mode === 'import' ? (
                            <div>
                                <p style={{ color: '#6C757D', marginBottom: '16px' }}>
                                    اختر ملف Excel أو CSV يحتوي على بيانات الموظفين
                                </p>

                                <div style={{
                                    border: '2px dashed #ADB5BD',
                                    borderRadius: '8px',
                                    padding: '40px',
                                    textAlign: 'center',
                                    marginBottom: '24px',
                                    backgroundColor: selectedFile ? '#E8F5E9' : '#F8F9FA',
                                    transition: 'all 0.3s',
                                }}>
                                    <FileSpreadsheet size={48} color={selectedFile ? '#2E7D32' : '#ADB5BD'} style={{ marginBottom: '16px' }} />

                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileChange}
                                        id="file-upload"
                                        style={{ display: 'none' }}
                                    />
                                    <label htmlFor="file-upload" className="btn btn-primary" style={{ cursor: 'pointer', marginBottom: '12px' }}>
                                        اختيار ملف
                                    </label>

                                    {selectedFile && (
                                        <p style={{ color: '#2E7D32', fontWeight: 'bold', marginTop: '12px' }}>
                                            {selectedFile.name}
                                        </p>
                                    )}
                                </div>

                                <div style={{
                                    backgroundColor: '#FFF3CD',
                                    border: '1px solid #FFE69C',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    marginBottom: '24px',
                                }}>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#856404' }}>
                                        <strong>ملاحظة:</strong> يجب أن يحتوي الملف على الأعمدة التالية:
                                        رقم الموظف، الاسم الكامل، رقم الهوية، المسمى الوظيفي، الراتب الأساسي، بدل السكن، بدل النقل، تاريخ التعيين.
                                    </p>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <button
                                        onClick={onClose}
                                        className="btn"
                                        style={{ backgroundColor: '#F8F9FA', color: '#495057' }}
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        onClick={handleImport}
                                        className="btn btn-primary"
                                        disabled={!selectedFile || isProcessing}
                                        style={{ minWidth: '120px' }}
                                    >
                                        {isProcessing ? 'جاري الاستيراد...' : 'استيراد'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p style={{ color: '#6C757D', marginBottom: '24px' }}>
                                    اختر صيغة الملف المراد تصديره
                                </p>

                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                        صيغة الملف
                                    </label>
                                    <select
                                        value={exportFormat}
                                        onChange={(e) => setExportFormat(e.target.value)}
                                        style={{ width: '100%' }}
                                    >
                                        <option value="XLSX">Excel (.xlsx)</option>
                                        <option value="CSV">CSV (.csv)</option>
                                        <option value="JSON">JSON (.json)</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <button
                                        onClick={onClose}
                                        className="btn"
                                        style={{ backgroundColor: '#F8F9FA', color: '#495057' }}
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        onClick={handleExport}
                                        className="btn btn-primary"
                                        disabled={isProcessing}
                                        style={{ minWidth: '120px' }}
                                    >
                                        {isProcessing ? 'جاري التصدير...' : 'تصدير'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        {result.success ? (
                            <>
                                <CheckCircle size={64} color="#2E7D32" style={{ marginBottom: '16px' }} />
                                <h3 style={{ color: '#2E7D32', marginBottom: '16px' }}>
                                    {mode === 'import' ? 'تم الاستيراد بنجاح!' : 'تم التصدير بنجاح!'}
                                </h3>
                                {mode === 'import' && result.data && (
                                    <div style={{ textAlign: 'right', marginTop: '24px' }}>
                                        <p><strong>إجمالي الصفوف:</strong> {result.data.totalRows}</p>
                                        <p style={{ color: '#2E7D32' }}><strong>تم بنجاح:</strong> {result.data.successRows}</p>
                                        {result.data.failedRows > 0 && (
                                            <>
                                                <p style={{ color: '#DC3545' }}><strong>فشل:</strong> {result.data.failedRows}</p>
                                                {result.data.errors && result.data.errors.length > 0 && (
                                                    <div style={{
                                                        marginTop: '16px',
                                                        backgroundColor: '#FFF5F5',
                                                        border: '1px solid #FFCDD2',
                                                        borderRadius: '8px',
                                                        padding: '16px',
                                                        maxHeight: '200px',
                                                        overflow: 'auto',
                                                    }}>
                                                        <p style={{ fontWeight: 'bold', marginBottom: '12px' }}>الأخطاء:</p>
                                                        {result.data.errors.slice(0, 10).map((err: any, idx: number) => (
                                                            <p key={idx} style={{ fontSize: '0.85rem', marginBottom: '8px', color: '#DC3545' }}>
                                                                صف {err.row}: {err.message}
                                                            </p>
                                                        ))}
                                                        {result.data.errors.length > 10 && (
                                                            <p style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>
                                                                ...و {result.data.errors.length - 10} أخطاء أخرى
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                                <button
                                    onClick={() => {
                                        onClose();
                                        setResult(null);
                                        setSelectedFile(null);
                                    }}
                                    className="btn btn-primary"
                                    style={{ marginTop: '24px' }}
                                >
                                    إغلاق
                                </button>
                            </>
                        ) : (
                            <>
                                <AlertCircle size={64} color="#DC3545" style={{ marginBottom: '16px' }} />
                                <h3 style={{ color: '#DC3545', marginBottom: '16px' }}>حدث خطأ!</h3>
                                <p style={{ color: '#6C757D' }}>{result.error || 'حدث خطأ غير متوقع'}</p>
                                <button
                                    onClick={() => setResult(null)}
                                    className="btn"
                                    style={{ marginTop: '24px', backgroundColor: '#F8F9FA' }}
                                >
                                    إعادة المحاولة
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImportExportModal;
