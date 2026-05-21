async function run() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@library.com', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    // 'ay@gmail.com' (id: 6a0df5facc1fb3e28d02f7e6)
    // we will try to update it to use an email that belongs to another user
    // First, let's create a new conflicting user
    const conflictingEmail = `conflict_${Date.now()}@example.com`;
    await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Conflict User', email: conflictingEmail, password: 'password123' })
    });

    const updateRes = await fetch('http://localhost:5000/api/users/6a0df5facc1fb3e28d02f7e6', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'ay updated',
        email: conflictingEmail,
        password: ''
      })
    });
    const updateData = await updateRes.json();
    console.log('Update Status:', updateRes.status);
    console.log('Update Response:', updateData);
  } catch (err) {
    console.error('Error running test:', err.message);
  }
}

run();
