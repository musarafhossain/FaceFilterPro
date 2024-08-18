const CLIENT_ID = '936389827719-p29mt159u8qa0hkricvrecvtrcp9ofpl.apps.googleusercontent.com';
const REDIRECT_URI = 'http://127.0.0.1:5500/';//For Development
//const REDIRECT_URI = 'https://musarafhossain.github.io/FaceFilterPro/';//For Production
const SCOPE = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile';

const API_KEY = 'AIzaSyCnwIHjGfkPzfjKfBvE_2pGHWOiyYqN6yM';

function getAuthUrl() {
    const responseType = 'token';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${responseType}&scope=${encodeURIComponent(SCOPE)}`;
    return authUrl;
}

document.getElementById('sign-in-btn').addEventListener('click', () => {
    signup();
});

document.getElementById('sign-out-btn').addEventListener('click', () => {
    logout();
});

function initializeApp() {
    if (!isLoggedIn()) {
        login();
    } else {
        updateUIForLoggedInState();
    }
}

function updateUIForLoggedInState() {
    document.getElementById('sign-in-btn').style.display = 'none';
    document.getElementById('sign-out-btn').style.display = 'flex';
    document.getElementById('profile').style.display = 'flex';

    // Fetch and update user profile
    fetchUserProfile();
}

function getAccessToken() {
    return sessionStorage.getItem('accessToken');
}

function isLoggedIn() {
    return !!sessionStorage.getItem('accessToken');
}

async function fetchUserProfile() {
    const accessToken = sessionStorage.getItem('accessToken');

    if (!accessToken) {
        console.error('No access token found.');
        return;
    }

    try {
        const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            const errorDetails = await response.json();
            throw new Error(`Error fetching user profile: ${response.statusText} - ${errorDetails.error.message}`);
        }

        const userInfo = await response.json();

        // Update profile with fetched data
        const profileName = userInfo.name || 'User';
        const profileImageUrl = userInfo.picture || './assets/images/logo.png';

        document.getElementById('profile-name').textContent = profileName;
        document.getElementById('profile-image').src = profileImageUrl;
        document.getElementById('profile-image').title = profileName;

    } catch (error) {
        console.error(`Error fetching user profile: ${error.message}`);
        // Optionally, set default values if fetching fails
        document.getElementById('profile-name').textContent = 'User';
        document.getElementById('profile-image').src = './assets/images/logo.png';
        document.getElementById('profile-image').title = 'User';
    }
}

function signup() {
    const authUrl = getAuthUrl();
    window.location.href = authUrl;
}

function login() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get('access_token');
    if (token) {
        sessionStorage.setItem('accessToken', token);
        window.history.replaceState(null, '', REDIRECT_URI);
        updateUIForLoggedInState();
    }
}

function logout() {
    document.getElementById('profile').style.display = 'none';
    sessionStorage.removeItem('accessToken');
    window.location.href = REDIRECT_URI;
}

// Initialize application on page load
initializeApp();
