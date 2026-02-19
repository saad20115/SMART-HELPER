import apiClient from './client';

export interface Company {
    id: string;
    name: string;
    crNumber: string;
    email: string;
    phone?: string;
    logoUrl?: string;
}

export interface Branch {
    id: number;
    name: string;
}

export interface Job {
    id: number;
    name: string;
}

export interface Classification {
    id: number;
    name: string;
}

// Companies API
export const companiesApi = {
    getAll: async (): Promise<Company[]> => {
        const response = await apiClient.get('/companies');
        return response.data;
    },

    getOne: async (id: string): Promise<Company> => {
        const response = await apiClient.get(`/companies/${id}`);
        return response.data;
    },

    create: async (data: Omit<Company, 'id'>): Promise<Company> => {
        const response = await apiClient.post('/companies', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Company>): Promise<Company> => {
        const response = await apiClient.put(`/companies/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/companies/${id}`);
    },
};

// Settings API
export const settingsApi = {
    // Branches
    getBranches: async (companyId?: string): Promise<Branch[]> => {
        const params = companyId ? { companyId } : {};
        const response = await apiClient.get('/settings/branches', { params });
        return response.data;
    },

    createBranch: async (name: string, companyId: string): Promise<Branch> => {
        const response = await apiClient.post('/settings/branches', { name, companyId });
        return response.data;
    },

    updateBranch: async (id: number, name: string): Promise<Branch> => {
        const response = await apiClient.put(`/settings/branches/${id}`, { name });
        return response.data;
    },

    deleteBranch: async (id: number): Promise<void> => {
        await apiClient.delete(`/settings/branches/${id}`);
    },

    // Jobs
    getJobs: async (companyId?: string): Promise<Job[]> => {
        const params = companyId ? { companyId } : {};
        const response = await apiClient.get('/settings/jobs', { params });
        return response.data;
    },

    createJob: async (name: string, companyId: string): Promise<Job> => {
        const response = await apiClient.post('/settings/jobs', { name, companyId });
        return response.data;
    },

    updateJob: async (id: number, name: string): Promise<Job> => {
        const response = await apiClient.put(`/settings/jobs/${id}`, { name });
        return response.data;
    },

    deleteJob: async (id: number): Promise<void> => {
        await apiClient.delete(`/settings/jobs/${id}`);
    },

    // Classifications
    getClassifications: async (companyId?: string): Promise<Classification[]> => {
        const params = companyId ? { companyId } : {};
        const response = await apiClient.get('/settings/classifications', { params });
        return response.data;
    },

    createClassification: async (name: string, companyId: string): Promise<Classification> => {
        const response = await apiClient.post('/settings/classifications', { name, companyId });
        return response.data;
    },

    updateClassification: async (id: number, name: string): Promise<Classification> => {
        const response = await apiClient.put(`/settings/classifications/${id}`, { name });
        return response.data;
    },

    deleteClassification: async (id: number): Promise<void> => {
        await apiClient.delete(`/settings/classifications/${id}`);
    },
};

// Employees API
export interface Employee {
    id: string;
    fullName: string;
    employeeNumber: string;
    nationalId: string;
    jobTitle: string;
    branch?: string;
    department?: string;
    hireDate: string;
    endDate?: string;
    basicSalary: number;
    housingAllowance: number;
    transportAllowance: number;
    otherAllowances: number;
    totalSalary: number;
    companyId: string;
    vacationBalance?: number;
    status: 'active' | 'inactive';
    classification?: string;
}

export const employeesApi = {
    getAll: async (): Promise<Employee[]> => {
        const response = await apiClient.get('/employees');
        return response.data;
    },

    getOne: async (id: string): Promise<Employee> => {
        const response = await apiClient.get(`/employees/${id}`);
        return response.data;
    },

    create: async (data: Omit<Employee, 'id' | 'totalSalary'>): Promise<Employee> => {
        const response = await apiClient.post('/employees', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Employee>): Promise<Employee> => {
        const response = await apiClient.put(`/employees/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/employees/${id}`);
    },

    getTemplate: async (): Promise<Blob> => {
        const response = await apiClient.get('/import-export/employees/template', {
            responseType: 'blob'
        });
        return response.data;
    },

    importEmployees: async (file: File, companyId: string, userId: string): Promise<any> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('companyId', companyId);
        formData.append('userId', userId);

        const response = await apiClient.post('/import-export/employees/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    exportEmployees: async (companyId: string, format: string, userId: string): Promise<Blob> => {
        const response = await apiClient.post('/import-export/employees/export',
            { companyId, format, userId },
            { responseType: 'blob' }
        );
        return response.data;
    },
};

// Dashboard API
export interface SalaryChart {
    basicSalary: number;
    housingAllowance: number;
    transportAllowance: number;
    otherAllowances: number;
}

export interface DashboardStats {
    totalEmployees: number;
    companiesCount: number;
    branchesCount: number;
    jobsCount: number;
    classificationsCount: number;
    totalSalaries: number;
    eosLiability: number;
    totalLeaveCompensation: number;
    salaryChart: {
        basicSalary: number;
        housingAllowance: number;
        transportAllowance: number;
        otherAllowances: number;
    };
}

export interface Activity {
    id: string;
    type: 'DEDUCTION' | 'LEAVE';
    title: string;
    time: string;
    amount: string;
    status: 'SUCCESS' | 'WARNING' | 'INFO';
}

export const dashboardApi = {
    getStats: async (companyId?: string): Promise<DashboardStats> => {
        const params = companyId ? { companyId } : {};
        const response = await apiClient.get('/dashboard/stats', { params });
        return response.data;
    },

    getActivity: async (companyId?: string): Promise<Activity[]> => {
        const params = companyId ? { companyId } : {};
        const response = await apiClient.get('/dashboard/activity', { params });
        return response.data;
    },
};

export const calculationsApi = {
    calculateEOS: async (employeeId: string, terminationType?: string): Promise<any> => {
        const response = await apiClient.post(`/calculations/eos/${employeeId}`, { terminationType });
        return response.data;
    },
    calculateVacation: async (employeeId: string, days?: number): Promise<any> => {
        const response = await apiClient.post(`/calculations/eos/vacation/${employeeId}`, { days });
        return response.data;
    },
    getAggregated: async (params?: any): Promise<any> => {
        const response = await apiClient.get('/calculations/eos/aggregated', { params });
        return response.data;
    },
};

export interface LeaveBalance {
    employeeId: string;
    employeeName: string;
    branch: string | null;
    jobTitle: string;
    hireDate: string;
    serviceYears: number;
    annualEntitledDays: number;
    annualUsedDays: number;
    calculatedRemainingDays: number;
    leaveValue: number;
    lastCalculatedAt: string;
}

export const leaveApi = {
    getBalances: async (companyId: string): Promise<LeaveBalance[]> => {
        const response = await apiClient.get(`/leave/balances/${companyId}`);
        return response.data;
    },

    adjustBalance: async (employeeId: string, days: number, reason: string): Promise<any> => {
        const response = await apiClient.post('/leave/adjust', { employeeId, days, reason });
        return response.data;
    },

    recalculateAccruals: async (employeeId: string): Promise<any> => {
        const response = await apiClient.post(`/leave/recalculate/${employeeId}`);
        return response.data;
    }
};

export interface Deduction {
    id: string;
    employeeId: string;
    type: 'LOAN' | 'PENALTY' | 'ADVANCE' | 'OTHER' | 'VACATION_EOS_BALANCE';
    amount: number;
    date: string;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    description?: string;
    notes?: string;
    employee?: {
        fullName: string;
        employeeNumber: string;
    };
}

export const deductionsApi = {
    getAll: async (params?: { employeeId?: string; status?: string; type?: string }): Promise<Deduction[]> => {
        const response = await apiClient.get('/deductions', { params });
        return response.data;
    },

    create: async (data: Partial<Deduction>): Promise<Deduction> => {
        const response = await apiClient.post('/deductions', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Deduction>): Promise<Deduction> => {
        const response = await apiClient.put(`/deductions/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/deductions/${id}`);
    }
};

export interface BackupFile {
    filename: string;
    size: number;
    createdAt: string;
}

export const backupApi = {
    getBackups: async (): Promise<BackupFile[]> => {
        const response = await apiClient.get('/backup');
        return response.data;
    },

    createBackup: async (): Promise<BackupFile> => {
        const response = await apiClient.post('/backup');
        return response.data;
    },

    restoreBackup: async (filename: string): Promise<void> => {
        await apiClient.post(`/backup/restore/${filename}`);
    },

    deleteBackup: async (filename: string): Promise<void> => {
        await apiClient.delete(`/backup/${filename}`);
    },

    uploadBackup: async (file: File): Promise<any> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/backup/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    getDownloadUrl: (filename: string) => {
        return `${apiClient.defaults.baseURL}/backup/${filename}/download`;
    }
};
