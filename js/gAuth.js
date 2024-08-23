const CLIENT_ID = '936389827719-p29mt159u8qa0hkricvrecvtrcp9ofpl.apps.googleusercontent.com';
const REDIRECT_URI = 'http://127.0.0.1:5500/';//For Development
//const REDIRECT_URI = 'https://musarafhossain.github.io/FaceFilterPro/';//For Production
const SCOPE = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.profile';
const API_KEY = 'AIzaSyCnwIHjGfkPzfjKfBvE_2pGHWOiyYqN6yM';

//function to redirect to google authentiation page
async function goLoginPage() {
    const responseType = 'token';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${responseType}&scope=${encodeURIComponent(SCOPE)}`;
    window.location.href = authUrl;
}

//function to initiate website when it's load
async function initializeApp() {
    if (isLoggedIn()) {
        try {
            await refreshAccessToken();
            await initializeFolderId(); //Initialize folder IDs
            await loadImageIds(); //Load existing all images
            await updateUIForLoggedInState(); //update the ui after login
        } catch (error) {
            console.error('Error during app initialization:', error);
        }
    } else {
        await login();
    }
}

//function to check user already logged in or not
function isLoggedIn() {
    return !!sessionStorage.getItem('accessToken'); // !!(double exclamation mark) is used to convert a value to its boolean equivalent
}

//funcion to login user by google auth
async function login() {
    const hashWithhash = window.location.hash; //return the content after # in url (#access_token=1&&id=1)
    const hash = hashWithhash.substring(1); //remove the # (access_token=1&&id=1)
    const params = new URLSearchParams(hash); //handle convert paramobject key-value pair
    const token = params.get('access_token'); //get the final data using key
    if (token) {
        sessionStorage.setItem('accessToken', token);
        window.history.replaceState(null, '', REDIRECT_URI); //modify and clean the url
        await initializeFolderId(); //Initialize folder IDs
        await loadImageIds(); //Load existing all images
        await updateUIForLoggedInState(); //update the ui after login
    }
}

//function to update ui after login
async function updateUIForLoggedInState() {
    // Fetch and update user profile
    const userInfo = await fetchUserProfileData();
    if (userInfo) {
        const profileName = userInfo.name || 'User';
        const profileImageUrl = userInfo.picture || './assets/images/logo.png';
        document.getElementById('sign-in-btn').style.display = 'none';
        document.getElementById('sign-out-btn').style.display = 'flex';
        document.getElementById('profile').style.display = 'flex';
        document.getElementById('profile-name').textContent = profileName;
        document.getElementById('profile-image').src = profileImageUrl;
        document.getElementById('profile-image').title = profileName;
    }
}

//function to get access token or auth token
function getAccessToken() {
    return sessionStorage.getItem('accessToken');
}

//function for fetching user name and image
async function fetchUserProfileData() {
    const accessToken = getAccessToken();
    if (!accessToken) {
        console.error('No access token found.');
        return null;  // Return null if no access token is found
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
        return userInfo;
    } catch (error) {
        console.error(`Error fetching user profile: ${error.message}`);
        return null;
    }
}

//funcion to logout user
function logout() {
    document.getElementById('profile').style.display = 'none';
    sessionStorage.removeItem('accessToken');
    window.location.href = REDIRECT_URI;
}

async function initializeFolderId() {
    try {
        // Check for folder existence
        parentFolderId = await checkFolderExist('FaceFilterPro');
        imageDataFolderId = await checkFolderExist('ImageData', parentFolderId);
        faceDataFolderId = await checkFolderExist('FaceData', parentFolderId);
        faceDataFileId = await checkFileExist('faceData.json', faceDataFolderId);

        // If not exist then create
        if (!parentFolderId) {
            parentFolderId = await createFolder('FaceFilterPro');
        }
        if (!imageDataFolderId) {
            imageDataFolderId = await createFolder('ImageData', parentFolderId);
        }
        if (!faceDataFolderId) {
            faceDataFolderId = await createFolder('FaceData', parentFolderId);
        }
        if (!faceDataFileId) {
            faceDataFileId = await createFile('faceData.json', faceDataFolderId);
        }
        // Store folder IDs in global variables
        // These variables are already declared outside the function
    } catch (error) {
        console.error('Error initializing folder IDs:', error);
    }
}

async function loadImageIds() {
    const data = await getFileData(faceDataFileId);
    if (data.length > 0) {
        data.forEach(element => {
            allImageIds = [...allImageIds, ...element.imagePaths];
        });
        allImageIds = [...new Set(allImageIds)];
    }
}

async function isAccessTokenExpired(accessToken) {
    try {
        // URL for Google's token info endpoint
        const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);

        if (!response.ok) {
            // Token is invalid or expired
            return true;
        }

        const tokenInfo = await response.json();
        console.log(tokenInfo.expires_in)
        return tokenInfo.expires_in <= 0;

    } catch (error) {
        console.error("Error checking access token:", error);
        return true; // Assume expired in case of an error
    }
}

async function refreshAccessToken() {
    // Usage example
    const accessToken = getAccessToken();
    isAccessTokenExpired(accessToken).then(isExpired => {
        if (isExpired) {
            console.log("Access token is expired.");
            logout();
            //toggleModal('err-modal')
        } else {
            console.log("Access token is still valid.");
        }
    });
}

//signin button add event listerner
document.getElementById('sign-in-btn').addEventListener('click', async () => {
    await goLoginPage();
});

//signout button add event listener
document.getElementById('sign-out-btn').addEventListener('click', () => {
    logout();
});