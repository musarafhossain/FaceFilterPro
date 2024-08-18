// Function to check if a folder exists
async function checkFolderExist(folderName, parentId = null) {
    const url = 'https://www.googleapis.com/drive/v3/files';

    // Set up the headers with the access token
    const headers = new Headers({
        'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
    });

    // Set up the query parameters to search for the folder
    let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    if (parentId) {
        query += ` and '${parentId}' in parents`;
    }

    const params = new URLSearchParams({
        q: query,
        fields: 'files(id, name)'
    });

    // Make the GET request to the Google Drive API
    try {
        const response = await fetch(`${url}?${params.toString()}`, { headers });

        if (!response.ok) {
            throw new Error(`Request failed with status code ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Check if any files (folders) were returned
        if (data.files.length > 0) {
            // Return the ID of the first matching folder
            return data.files[0].id;
        } else {
            return null;  // Folder does not exist
        }
    } catch (error) {
        console.error('Error checking folder existence:', error);
        return null;  // Handle error or return null if the folder check fails
    }
}

async function createFolder(folderName, parentId = null) {
    const accessToken = sessionStorage.getItem('accessToken');

    if (!accessToken) {
        throw new Error('No access token found in session storage.');
    }

    const url = 'https://www.googleapis.com/drive/v3/files';

    // Set up the headers with the access token
    const headers = new Headers({
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    });

    // Set up the request body to create a folder
    const body = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        ...(parentId && { parents: [parentId] })  // Include parents if provided
    };

    // Convert body to JSON
    const requestBody = JSON.stringify(body);

    // Make the POST request to the Google Drive API to create the folder
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: requestBody
        });

        if (!response.ok) {
            throw new Error(`Request failed with status code ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Return the ID of the created folder
        return data.id;
    } catch (error) {
        console.error('Error creating folder:', error);
        throw error;  // Re-throw the error to be handled by the caller
    }
}

async function initializeFolderId() {
    try {
        // Check for 'FaceFilterPro' folder
        let parentFolderId = await checkFolderExist('FaceFilterPro');
        
        if (parentFolderId) {
            console.log(`Parent Folder exists. ID: ${parentFolderId}`);
        } else {
            parentFolderId = await createFolder('FaceFilterPro');
            console.log(`Folder created successfully. ID: ${parentFolderId}`);
        }

        // Check for 'ImageData' folder inside the 'FaceFilterPro' folder
        let imageDataFolderId = await checkFolderExist('ImageData', parentFolderId);
        
        if (imageDataFolderId) {
            console.log(`Image Data Folder exists. ID: ${imageDataFolderId}`);
        } else {
            imageDataFolderId = await createFolder('ImageData', parentFolderId);
            console.log(`Folder created successfully. ID: ${imageDataFolderId}`);
        }

        // Check for 'FaceData' folder inside the 'FaceFilterPro' folder
        let faceDataFolderId = await checkFolderExist('FaceData', parentFolderId);
        
        if (faceDataFolderId) {
            console.log(`Face Data Folder exists. ID: ${faceDataFolderId}`);
        } else {
            faceDataFolderId = await createFolder('FaceData', parentFolderId);
            console.log(`Folder created successfully. ID: ${faceDataFolderId}`);
        }

        // Optionally return or use the folder IDs
        return {
            parentFolderId,
            imageDataFolderId,
            faceDataFolderId
        };
    } catch (error) {
        console.error('Error initializing folder IDs:', error);
    }
}

// Example usage
if (isLoggedIn) {
    initializeFolderId().then(folderIds => {
        if (folderIds) {
            console.log('All folders initialized:', folderIds);
            parentFolderId = folderIds.parentFolderId;
            imageDataFolderId = folderIds.imageDataFolderId;
            faceDataFolderId = faceDataFolderId;
        }
    });
}
