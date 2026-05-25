const axios = require('axios');

async function testBooking() {
  try {
    // 1. Register
    const regRes = await axios.post('http://localhost:5000/api/auth/register', {
      full_name: 'Test User 3',
      phone_number: '0555555555',
      email: 'test3@example.com',
      password: 'password123',
      role: 'customer'
    });
    console.log('Registered:', regRes.data);

    // 2. Login
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      phone_number: '0555555555',
      password: 'password123',
      role: 'customer'
    });
    console.log('Logged in. Token:', loginRes.data.token);
    const token = loginRes.data.token;

    // 3. Create Booking
    const bookRes = await axios.post('http://localhost:5000/api/bookings', {
      service_id: 1,
      address: '123 Test Street',
      longitude: 106.7009,
      latitude: 10.7769,
      scheduled_at: null
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Booking successful:', bookRes.data);

  } catch (error) {
    if (error.response) {
      console.error('Error from server:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testBooking();