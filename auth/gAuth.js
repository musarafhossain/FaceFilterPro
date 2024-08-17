// gAuth.js

let CLIENT_ID;
let API_KEY;
let DISCOVERY_DOC;
let SCOPES;
let tokenClient;
let gapiInited = false;
let gisInited = false;

async function loadConfig() {
    try {
        const response = await fetch('config.json');
        const config = await response.json();
        CLIENT_ID = config.CLIENT_ID;
        API_KEY = config.API_KEY;
        DISCOVERY_DOC = config.DISCOVERY_DOC;
        SCOPES = config.SCOPES;
        initializeGoogleServices();
    } catch (error) {
        console.error('Error loading config:', error);
    }
}

function initializeGoogleServices() {
    if (typeof gapi !== 'undefined' && !gapiInited) {
        gapi.load("client:auth2", initializeGapiClient);
    }
    if (typeof google !== 'undefined' && !gisInited) {
        gisLoaded();
    }
}

async function initializeGapiClient() {
    try {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
    } catch (error) {
        console.error('Error initializing GAPI client:', error);
    }
}

function gisLoaded() {
    if (!CLIENT_ID) {
        console.error('CLIENT_ID is not set');
        return;
    }

    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (resp) => {
            if (resp.error !== undefined) {
                throw resp;
            }
            authtoken = resp.access_token;
            console.log("From Handle Auth :- ", authtoken);
            document.getElementById("sign-in-btn").style.display = "none";
            document.getElementById("sign-out-btn").style.display = "flex";
        },
    });
    gisInited = true;

    // Attach event handlers
    document.getElementById("sign-in-btn").addEventListener("click", handleSigninClick);
    document.getElementById("sign-out-btn").addEventListener("click", handleSignoutClick);
}

function handleSigninClick() {
    if (!tokenClient) {
        console.error('Token client is not initialized');
        return;
    }

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: "consent" });
    } else {
        tokenClient.requestAccessToken({ prompt: "" });
    }
}

function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken("");
        authtoken = ""; // Clear the auth token
        document.getElementById("sign-in-btn").style.display = "flex";
        document.getElementById("sign-out-btn").style.display = "none";
    }
}
