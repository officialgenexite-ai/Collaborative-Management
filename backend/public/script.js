// ============================================
// In-memory token store (NOT localStorage — kept
// in a plain JS variable for this test harness).
// Refreshing the page will clear it — re-login again.
// ============================================
let authToken = null;
let currentUser = null;

function getApiBase() {
  return document.getElementById('apiBase').value.replace(/\/$/, '');
}

function updateStatusBar() {
  const bar = document.getElementById('statusBar');
  if (authToken) {
    bar.textContent = `✅ Logged in as: ${currentUser?.email || 'unknown'} | Role: ${currentUser?.role || '-'} | Token: ${authToken.substring(0, 20)}...`;
  } else {
    bar.textContent = '⚪ Not logged in';
  }
}

async function apiCall(path, method = 'GET', body = null, requiresAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (requiresAuth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${getApiBase()}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

function printOutput(elementId, result) {
  document.getElementById(elementId).textContent =
    `Status: ${result.status}\n\n${JSON.stringify(result.data, null, 2)}`;
}

// ================= AUTH =================

async function registerUser() {
  const body = {
    name: document.getElementById('regName').value,
    email: document.getElementById('regEmail').value,
    password: document.getElementById('regPassword').value,
    confirmPassword: document.getElementById('regConfirmPassword').value
  };
  const result = await apiCall('/auth/register', 'POST', body, false);
  printOutput('regOutput', result);
}

async function verifyOtp() {
  const body = {
    email: document.getElementById('otpEmail').value,
    otp: document.getElementById('otpCode').value
  };
  const result = await apiCall('/auth/verify-otp', 'POST', body, false);
  printOutput('otpOutput', result);
}

async function loginUser() {
  const body = {
    email: document.getElementById('loginEmail').value,
    password: document.getElementById('loginPassword').value
  };
  const result = await apiCall('/auth/login', 'POST', body, false);
  printOutput('loginOutput', result);

  if (result.ok && (result.data.accessToken || result.data.token)) {
    authToken = result.data.accessToken || result.data.token;
    currentUser = result.data.user;
    updateStatusBar();
  }
}

function handleGoogleCallback() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const userParam = params.get('user');

  if (!token) return;

  authToken = token;
  if (userParam) {
    try {
      currentUser = JSON.parse(decodeURIComponent(userParam));
    } catch (error) {
      currentUser = null;
    }
  }

  updateStatusBar();
  document.getElementById('loginOutput').textContent =
    `Google login successful.\n\nToken:\n${authToken}\n\nUser:\n${JSON.stringify(currentUser, null, 2)}`;
  window.history.replaceState({}, document.title, window.location.pathname);
}

function handleInviteLink() {
  const params = new URLSearchParams(window.location.search);
  const workspaceId = params.get('workspaceId');
  const inviteToken = params.get('inviteToken');

  if (!workspaceId || !inviteToken) return;

  document.getElementById('acceptWsId').value = workspaceId;
  document.getElementById('acceptToken').value = inviteToken;

  if (authToken) {
    acceptInvite();
    return;
  }

  document.getElementById('acceptInviteOutput').textContent =
    'Invite link detected. Please log in or register with the invited email, then click Accept Invite.';
}

function googleLogin() {
  // Full page redirect flow (Passport OAuth cannot be done via fetch)
  window.location.href = `${getApiBase()}/auth/google`;
}

function checkToken() {
  document.getElementById('sessionOutput').textContent = authToken
    ? `Token:\n${authToken}\n\nUser:\n${JSON.stringify(currentUser, null, 2)}`
    : 'No active token. Please login first.';
}

function logoutUser() {
  authToken = null;
  currentUser = null;
  updateStatusBar();
  document.getElementById('sessionOutput').textContent = 'Logged out. Token cleared.';
}

// ================= WORKSPACE =================

async function createWorkspace() {
  const body = {
    name: document.getElementById('wsName').value,
    description: document.getElementById('wsDesc').value
  };
  const result = await apiCall('/workspaces', 'POST', body);
  printOutput('wsCreateOutput', result);
}

async function getMyWorkspaces() {
  const result = await apiCall('/workspaces', 'GET');
  printOutput('wsListOutput', result);
}

async function getWorkspaceDetails() {
  const id = document.getElementById('wsIdInput').value;
  const result = await apiCall(`/workspaces/${id}`, 'GET');
  printOutput('wsDetailsOutput', result);
}

async function inviteMember() {
  const wsId = document.getElementById('inviteWsId').value;
  const body = {
    email: document.getElementById('inviteEmail').value,
    role: document.getElementById('inviteRole').value
  };
  const result = await apiCall(`/workspaces/${wsId}/invite`, 'POST', body);
  printOutput('inviteOutput', result);
}

async function acceptInvite() {
  const wsId = document.getElementById('acceptWsId').value;
  const token = document.getElementById('acceptToken').value;
  const result = await apiCall(`/workspaces/${wsId}/accept-invite`, 'POST', { token });
  printOutput('acceptInviteOutput', result);

  if (result.ok) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

async function changeRole() {
  const wsId = document.getElementById('roleWsId').value;
  const targetUserId = document.getElementById('roleTargetUserId').value;
  const body = { newRole: document.getElementById('newRoleSelect').value };
  const result = await apiCall(`/workspaces/${wsId}/members/${targetUserId}`, 'PATCH', body);
  printOutput('roleOutput', result);
}

async function removeMember() {
  const wsId = document.getElementById('removeWsId').value;
  const targetUserId = document.getElementById('removeTargetUserId').value;
  const result = await apiCall(`/workspaces/${wsId}/members/${targetUserId}`, 'DELETE');
  printOutput('removeOutput', result);
}

updateStatusBar();
handleGoogleCallback();
handleInviteLink();