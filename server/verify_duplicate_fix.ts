
interface EmployeeData {
    nationalId: string;
    employeeNumber: string;
}

function checkDuplicate(employeeData: EmployeeData, existingEmployees: EmployeeData[]): boolean {
    const duplicateFilters: any[] = [];
    if (employeeData.nationalId && employeeData.nationalId.trim() !== '') {
        duplicateFilters.push({ nationalId: employeeData.nationalId });
    }
    if (employeeData.employeeNumber && employeeData.employeeNumber.trim() !== '') {
        duplicateFilters.push({ employeeNumber: employeeData.employeeNumber });
    }

    if (duplicateFilters.length === 0) return false;

    return existingEmployees.some(existing => {
        return duplicateFilters.some(filter => {
            if (filter.nationalId) return existing.nationalId === filter.nationalId;
            if (filter.employeeNumber) return existing.employeeNumber === filter.employeeNumber;
            return false;
        });
    });
}

const existing = [
    { nationalId: '1234567890', employeeNumber: '' }
];

const testCases = [
    { nationalId: '2222222222', employeeNumber: '' }, // Should NOT be duplicate if employeeNumber is empty
    { nationalId: '1234567890', employeeNumber: '999' }, // Should BE duplicate (nationalId match)
    { nationalId: '3333333333', employeeNumber: '101' }, // Should NOT be duplicate
    { nationalId: '', employeeNumber: '' }, // Should NOT be duplicate (no fields to check)
];

testCases.forEach((test, idx) => {
    const isDuplicate = checkDuplicate(test, existing);
    console.log(`Test ${idx + 1}: nationalId="${test.nationalId}", employeeNumber="${test.employeeNumber}" -> Duplicate: ${isDuplicate}`);
});
