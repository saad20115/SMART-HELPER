
const axios = require('axios');

async function main() {
    try {
        console.log('Fetching employees via HTTP...');
        const response = await axios.get('http://localhost:3000/api/employees');
        console.log('Success! Count:', response.data.length);
    } catch (error) {
        console.error('HTTP Request Failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

main();
