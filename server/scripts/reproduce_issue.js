const fs = require('fs');
const path = require('path');

async function run() {
    try {
        // Skip fetching companies since DB is likely down and causing 500 there.
        // We want to test the IMPORT endpoint behavior when DB is down.
        const companyId = '10797c98-efcc-46b5-9d67-0d8ae1eec194'; // Seeded Company ID
        console.log(`Using Valid Company ID: ${companyId}`);

        // 2. Create dummy Excel file (CSV)
        const csvContent = "رقم الموظف,الاسم الكامل,رقم الهوية,المسمى الوظيفي,الراتب الأساسي,بدل السكن,بدل النقل,تاريخ التعيين\n101,Test User,1234567890,Developer,5000,1000,500,2023-01-01";
        const filePath = path.join(__dirname, 'test.csv');
        fs.writeFileSync(filePath, csvContent);

        // 3. Upload File
        console.log('Uploading file...');
        const formData = new FormData();

        const file = new Blob([csvContent], { type: 'text/csv' });
        formData.append('file', file, 'test.csv');
        formData.append('companyId', companyId);
        formData.append('userId', '8955473a-0e41-4a74-9379-75900fb31a51'); // Seeded Admin User ID

        const uploadRes = await fetch('http://localhost:3000/api/import-export/employees/import', {
            method: 'POST',
            body: formData,
        });

        console.log(`Response Status: ${uploadRes.status} ${uploadRes.statusText}`);
        const text = await uploadRes.text();
        console.log('Response Body:', text);

        fs.unlinkSync(filePath);

    } catch (error) {
        console.error('Error:', error);
    }
}

run();
