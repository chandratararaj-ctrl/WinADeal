// Paste this in the browser console (F12) while on the admin panel

// Check what's in localStorage
console.log('=== LocalStorage Check ===');
console.log('Access Token:', localStorage.getItem('accessToken'));
console.log('Refresh Token:', localStorage.getItem('refreshToken'));

// Decode the JWT token (without verification)
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

const token = localStorage.getItem('accessToken');
if (token) {
    const decoded = parseJwt(token);
    console.log('=== Decoded Token ===');
    console.log('User ID:', decoded.userId);
    console.log('Roles:', decoded.roles);
    console.log('Selected Role:', decoded.selectedRole);
    console.log('Expires:', new Date(decoded.exp * 1000).toLocaleString());
} else {
    console.log('❌ No access token found!');
}

// Check auth store
console.log('=== Auth Store ===');
const authStore = JSON.parse(localStorage.getItem('auth-storage') || '{}');
console.log('User:', authStore.state?.user);
console.log('Is Authenticated:', authStore.state?.isAuthenticated);
