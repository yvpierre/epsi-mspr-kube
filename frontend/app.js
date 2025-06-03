const API_BASE = "http://localhost:8080/function"; // URL OpenFaaS gateway

async function registerUser() {
  const email = document.getElementById('email').value;

  const res = await fetch(`${API_BASE}/register-user`, {
    method: 'POST',
    body: JSON.stringify({ email }),
    headers: { 'Content-Type': 'application/json' }
  });

  const data = await res.json();
  document.getElementById('register-result').textContent = data.message || "Compte créé";

  if (data.qrCode) {
    document.getElementById('qrcode-img').src = data.qrCode;
    document.getElementById('qrcode').style.display = 'block';
  }
}

async function loginUser() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const totp = document.getElementById('login-totp').value;

  const res = await fetch(`${API_BASE}/login-user`, {
    method: 'POST',
    body: JSON.stringify({ email, password, totp }),
    headers: { 'Content-Type': 'application/json' }
  });

  const data = await res.json();
  document.getElementById('login-result').textContent = data.message || (res.ok ? "Authentifié" : "Échec");
}


function showSection(id) {
  document.querySelectorAll('section').forEach(sec => {
    if (sec.id !== 'menu') {
      sec.style.display = 'none';
    }
  });
  document.getElementById(id).style.display = 'block';
}
