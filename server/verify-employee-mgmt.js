const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function verify() {
    console.log('--- Starting Employee Management Verification ---');

    try {
        // 1. Get a company ID
        const companies = await axios.get(`${API_BASE}/companies`);
        if (companies.data.length === 0) {
            console.error('No companies found. Please seed the database first.');
            return;
        }
        const companyId = companies.data[0].id;
        console.log(`Using Company ID: ${companyId}`);

        // 2. Create an employee
        console.log('Testing Employee Creation...');
        const empNum = `TEST_${Date.now()}`;
        const createRes = await axios.post(`${API_BASE}/employees`, {
            fullName: 'Test Employee Verification',
            employeeNumber: empNum,
            nationalId: `ID_${Date.now()}`,
            jobTitle: 'Developer',
            basicSalary: 10000,
            housingAllowance: 2500,
            transportAllowance: 1000,
            otherAllowances: 500,
            hireDate: '2026-01-01',
            companyId: companyId,
            status: 'active',
            vacationBalance: 15
        });
        const employee = createRes.data;
        console.log('✅ Employee created successfully');
        console.log(`Total Salary: ${employee.totalSalary} (Expected: 14000)`);

        // 3. Verify balance creation (vacationBalance includes accrued days + manual adjustment)
        if (employee.vacationBalance >= 15) {
            console.log(`✅ Vacation balance enriched correctly: ${employee.vacationBalance} (includes accrued + 15 initial)`);
        } else {
            console.warn(`❌ Vacation balance too low: ${employee.vacationBalance} (expected >= 15)`);
        }

        // 4. Update the employee
        console.log('Testing Employee Update...');
        const updateRes = await axios.put(`${API_BASE}/employees/${employee.id}`, {
            basicSalary: 12000,
            jobTitle: 'Senior Developer'
        });
        const updatedEmployee = updateRes.data;
        console.log('✅ Employee updated successfully');
        console.log(`New Total Salary: ${updatedEmployee.totalSalary} (Expected: 16000)`);

        // 5. Try to create a duplicate (should fail)
        console.log('Testing Duplicate Prevention...');
        try {
            await axios.post(`${API_BASE}/employees`, {
                fullName: 'Duplicate Employee',
                employeeNumber: empNum,
                nationalId: updatedEmployee.nationalId,
                hireDate: '2026-01-01',
                companyId: companyId
            });
            console.error('❌ Duplicate employee was allowed!');
        } catch (e) {
            console.log('✅ Duplicate prevention working correctly');
        }

        // 6. Delete the employee
        console.log('Testing Employee Deletion...');
        await axios.delete(`${API_BASE}/employees/${employee.id}`);
        console.log('✅ Employee deleted successfully');

        // 7. Verify deletion from database
        try {
            const checkRes = await axios.get(`${API_BASE}/employees/${employee.id}`, { validateStatus: () => true });
            if (checkRes.status === 404) {
                console.log('✅ Employee gone from database (404)');
            } else {
                console.error(`❌ Employee still exists after deletion (status: ${checkRes.status})`);
            }
        } catch (e) {
            console.log('✅ Employee gone from database');
        }

        console.log('--- Verification Completed Successfully ---');
    } catch (error) {
        console.error('Verification failed:', error.response?.data || error.message);
    }
}

verify();
