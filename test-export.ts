import fetch from 'node-fetch';

async function test() {
  try {
    const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'jainil@greentech.io', password: 'Password123!' })
    });
    const loginBody = await loginRes.json();
    console.log('Login:', loginBody);

    const cookie = loginRes.headers.get('set-cookie');
    
    const meRes = await fetch('http://localhost:3000/api/v1/users/me', {
      headers: { 'Cookie': cookie }
    });
    const meBody = await meRes.json();
    console.log('Me:', meBody);
    
    const orgId = meBody.data.attributes.organizationId;
    console.log('Org ID:', orgId);

    const exportRes = await fetch(`http://localhost:3000/api/v1/orgs/${orgId}/reports/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
      body: JSON.stringify({ format: 'pdf', reportType: 'esg_summary', periodStart: new Date().toISOString(), periodEnd: new Date().toISOString() })
    });
    
    if (!exportRes.ok) {
      console.error('Export failed:', exportRes.status, await exportRes.text());
    } else {
      console.log('Export succeeded!');
    }
  } catch (e) {
    console.error(e);
  }
}

test();
