const axios = require('axios');

async function testLogin() {
    try {
        const response = await axios.post('http://localhost:5000/api/v1/auth/login', {
            phone: '1234567890',
            password: 'password123'
        });
        console.log('Success:', response.data);
    } catch (error) {
        console.error('Error Status:', error.response?.status);
        console.error('Error Data:', error.response?.data);
        console.error('Full Error:', error.message);
    }
}

testLogin();
