import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';

async function runTests() {
  console.log('--- PlanoSaude API Smoke Tests ---');

  // 1. Health Check
  try {
    const health = await axios.get('http://127.0.0.1:5000/');
    console.log('✅ Health Check:', health.data.message);
  } catch (err: any) {
    console.log('❌ Health Check Failed:', err.message);
  }

  // 2. Auth Test (Register)
  const testUser = {
    name: 'Test Broker',
    email: `test_${Date.now()}@example.com`,
    password: 'password123',
    role: 'broker'
  };

  try {
    const register = await axios.post(`${API_URL}/auth/register`, testUser);
    console.log('✅ Register:', register.data.name, 'successfully registered');
    
    // 3. Login Test
    const login = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login: Token received');
    const token = login.data.token;

    // 4. Profile Test
    const profile = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Profile Check:', profile.data.email === testUser.email ? 'Success' : 'Failed');

  } catch (err: any) {
    console.log('❌ Auth Workflow Failed:', err.response?.data?.message || err.message);
    if (err.response?.data) {
      console.log('Reason:', JSON.stringify(err.response.data));
    }
  }
}

runTests();
