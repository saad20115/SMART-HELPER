
// Native fetch is available in Node 18+

async function inspect() {
    try {
        const response = await fetch('http://localhost:3000/api/calculations/eos/aggregated?fiscalYearEnd=2024-12-31');
        const data = await response.json();
        console.log("Summary keys:", Object.keys(data.summary));
        console.log("Total Leave Deductions:", data.summary.totalLeaveDeductions);
        console.log("Total Other Deductions:", data.summary.totalOtherDeductions);
    } catch (e) {
        console.error(e);
    }
}

inspect();
