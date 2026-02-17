import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

interface Option {
    value: string;
    label: string;
    subLabel?: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    label?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'اختر من القائمة...',
    disabled = false,
    required = false,
    label,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="form-group" style={{ position: 'relative', width: '100%' }} ref={containerRef}>
            {label && <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>{label}</label>}

            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #E9ECEF',
                    backgroundColor: disabled ? '#F8F9FA' : 'white',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s',
                    boxShadow: isOpen ? '0 0 0 2px rgba(46, 125, 50, 0.1)' : 'none',
                    borderColor: isOpen ? '#2E7D32' : '#E9ECEF',
                }}
            >
                <span style={{ color: selectedOption ? '#111' : '#ADB5BD', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {value && !disabled && (
                        <X
                            size={16}
                            color="#ADB5BD"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange('');
                            }}
                            style={{ cursor: 'pointer' }}
                        />
                    )}
                    <ChevronDown size={18} color="#ADB5BD" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
            </div>

            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        border: '1px solid #E9ECEF',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        zIndex: 1050,
                        maxHeight: '300px',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <div style={{ padding: '8px', borderBottom: '1px solid #F1F3F5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Search size={16} color="#ADB5BD" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="بحث..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                flex: 1,
                                border: 'none',
                                outline: 'none',
                                padding: '4px',
                                fontSize: '0.9rem',
                            }}
                        />
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    style={{
                                        padding: '10px 12px',
                                        cursor: 'pointer',
                                        backgroundColor: value === opt.value ? '#E8F5E9' : 'transparent',
                                        transition: 'background-color 0.1s',
                                        borderBottom: '1px solid #F8F9FA',
                                    }}
                                    className="hover-bg-light"
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = value === opt.value ? '#E8F5E9' : '#F8F9FA')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = value === opt.value ? '#E8F5E9' : 'transparent')}
                                >
                                    <div style={{ fontWeight: value === opt.value ? '600' : '500', color: value === opt.value ? '#2E7D32' : '#111' }}>
                                        {opt.label}
                                    </div>
                                    {opt.subLabel && (
                                        <div style={{ fontSize: '0.75rem', color: '#6C757D', marginTop: '2px' }}>
                                            {opt.subLabel}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '16px', textAlign: 'center', color: '#ADB5BD', fontSize: '0.9rem' }}>
                                لا توجد نتائج
                            </div>
                        )}
                    </div>
                </div>
            )}

            {required && <input type="hidden" required value={value} />}
        </div>
    );
};

export default SearchableSelect;
