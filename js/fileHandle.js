var parentFolderId = null;
var imageDataFolderId = null;
var faceDataFolderId = null;
var faceDataFileId = null;
var allImageIds = [];

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

async function checkFileExist(fileName, folderId = null) {
    const url = 'https://www.googleapis.com/drive/v3/files';

    // Set up the headers with the access token
    const headers = new Headers({
        'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
    });

    // Set up the query parameters to search for the file
    let query = `name='${fileName}' and mimeType='application/json' and trashed=false`;
    if (folderId) {
        query += ` and '${folderId}' in parents`;
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

        // Check if any files were returned
        if (data.files.length > 0) {
            // Return the ID of the first matching file
            return data.files[0].id;
        } else {
            return null;  // File does not exist
        }
    } catch (error) {
        console.error('Error checking file existence:', error);
        return null;  // Handle error or return null if the file check fails
    }
}

async function createFile(fileName, parentId = null) {
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

    // Set up the request body to create a file
    const metadata = {
        name: fileName,
        mimeType: 'application/json',
        ...(parentId && { parents: [parentId] })  // Include parents if provided
    };

    // Convert metadata to JSON
    const metadataBody = JSON.stringify(metadata);

    try {
        // Create the file metadata
        const metadataResponse = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: metadataBody
        });

        if (!metadataResponse.ok) {
            throw new Error(`Metadata request failed with status code ${metadataResponse.status}: ${metadataResponse.statusText}`);
        }

        const metadataData = await metadataResponse.json();
        return metadataData.id;  // Return the ID of the created file
    } catch (error) {
        console.error('Error creating file:', error);
        throw error;  // Re-throw the error to be handled by the caller
    }
}

// Function to get the content of a file from Google Drive
async function getFileData(id) {
    try {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`, {
            headers: {
                Authorization: `Bearer ${getAccessToken()}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Error fetching file data: ${response.statusText}`);
        }

        // Check if the response is empty
        const contentType = response.headers.get('Content-Type');
        let fileContent = {};

        if (contentType && contentType.includes('application/json')) {
            // Parse JSON content
            const text = await response.text(); // Read as text first
            fileContent = text ? JSON.parse(text) : {}; // Parse only if text is not empty
        } else {
            throw new Error(`Unexpected content type: ${contentType}`);
        }

        return fileContent;
    } catch (error) {
        console.error('Error getting file data:', error);
        return { data: [] };  // Return an empty object or handle the error appropriately
    }
}

// Function to update the content of a file on Google Drive
async function updateFile(fileId, content) {
    const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
    const accessToken = getAccessToken();

    // Create a multipart request body
    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify({
        name: 'faceData.json',
        mimeType: 'application/json'
    })], { type: 'application/json' }));
    formData.append('file', new Blob([JSON.stringify(content)], { type: 'application/json' }));

    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Request failed with status code ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('File updated successfully:', data);
        return data;
    } catch (error) {
        console.error('Error updating file:', error);
    }
}

async function getImagesFromFolder(folderId) {
    // Get the access token from sessionStorage
    const accessToken = sessionStorage.getItem('accessToken');

    if (!accessToken) {
        throw new Error('Access token not found. User may not be authenticated.');
    }

    try {
        // Make the API request to list the files in the folder
        const response = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType,webViewLink,thumbnailLink)&access_token=${accessToken}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch files from Google Drive');
        }

        const data = await response.json();

        // Filter out only image files (jpg, png, etc.)
        const imageFiles = data.files.filter(file => file.mimeType.startsWith('image/'));

        return imageFiles;

    } catch (error) {
        console.error('Error retrieving images from folder:', error);
        throw error;
    }
}

async function getImageById(fileId) {
    const accessToken = sessionStorage.getItem('accessToken');

    if (!accessToken) {
        throw new Error('Access token not found. User may not be authenticated.');
    }

    try {
        // Make the API request to get the file details by file ID
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,webViewLink,thumbnailLink&access_token=${accessToken}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch file details from Google Drive');
        }

        const imageData = await response.json();

        // Return the image data
        return imageData;

    } catch (error) {
        console.error('Error retrieving image by file ID:', error);
        throw error;
    }
}