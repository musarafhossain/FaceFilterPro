// Function to switch between tabs based on selected radio button
function showTab(tabId) {
    const allImagesTab = document.getElementById('all-images-tab');
    const myImagesTab = document.getElementById('my-images-tab');
    const allImagesBtn = document.querySelector('label[for="all-images"]');
    const myImagesBtn = document.querySelector('label[for="my-images"]');

    if (tabId === 'all-images') {
        allImagesTab.style.display = 'block';
        myImagesTab.style.display = 'none';
        allImagesBtn.classList.add('active');
        myImagesBtn.classList.remove('active');
    } else if (tabId === 'my-images') {
        allImagesTab.style.display = 'none';
        myImagesTab.style.display = 'block';
        myImagesBtn.classList.add('active');
        allImagesBtn.classList.remove('active');
    }
}
showTab('all-images');

document.getElementById('upload-btn').addEventListener('click', function () {
    if(!isLoggedIn()){
        toggleModal();
        return;
    }
    document.getElementById('image-selector').click();
});

document.getElementById('image-selector').addEventListener('change', function (event) {
    const files = event.target.files;
    const imgContainer = document.getElementById('all-images-tab');
    imgContainer.innerHTML = '';

    if (files.length > 0) {
        // Handle the selected files here
        console.log('Selected files:', files);

        // Example: Display the selected images
        const imagePreviewContainer = document.createElement('div');
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();

            reader.onload = function (e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.width = '100px'; // Set the width for preview
                img.style.margin = '5px'; // Set margin for preview
                imagePreviewContainer.appendChild(img);
            };

            reader.readAsDataURL(file);
        }

        // Append the preview images to the body or any container
        imgContainer.appendChild(imagePreviewContainer);
    }
});

document.getElementById('add-face-btn').addEventListener('click', function () {
    if(!isLoggedIn()){
        toggleModal();
        return;
    }
    document.getElementById('face-selector').click();
});

document.getElementById('face-selector').addEventListener('change', function (event) {
    const files = event.target.files;
    const imgContainer = document.getElementById('my-images-tab');
    imgContainer.innerHTML = '';

    if (files.length > 0) {
        // Handle the selected files here
        console.log('Selected files:', files);

        // Example: Display the selected images
        const imagePreviewContainer = document.createElement('div');
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();

            reader.onload = function (e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.width = '100px'; // Set the width for preview
                img.style.margin = '5px'; // Set margin for preview
                imagePreviewContainer.appendChild(img);
            };

            reader.readAsDataURL(file);
        }

        // Append the preview images to the body or any container
        imgContainer.appendChild(imagePreviewContainer);
    }
});

var modal = document.querySelector(".modal");
var trigger = document.querySelector(".trigger");
var closeButton = document.querySelector(".close-button");

function toggleModal() {
    modal.classList.toggle("show-modal");
}

function windowOnClick(event) {
    if (event.target === modal) {
        toggleModal();
    }
}

closeButton.addEventListener("click", toggleModal);
window.addEventListener("click", windowOnClick);


// Function to upload a file to Google Drive
/*async function uploadFile() {
    const fileInput = document.getElementById("file-input");
    const file = fileInput.files[0];
    if (!file) {
        console.error("No file selected.");
        return;
    }

    const metadata = {
        name: file.name,
        mimeType: file.type,
        // No 'parents' field is included to upload to the root directory
    };

    const formData = new FormData();
    formData.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    formData.append("file", file);

        const response = await fetch(
            "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`, // Use the token from sessionStorage
                },
                body: formData,
            }
        );

        if (!response.ok) {
            const errorResponse = await response.json();
            throw new Error(`Network response was not ok. Status: ${response.status}. Text: ${errorResponse}`);
        }

        const data = await response.json();
        console.log("File uploaded successfully:", data);
    
}

// Attach event listener to the "Upload File" button
document.getElementById('upload-file-button').addEventListener('click', () => {
    uploadFile();
});*/
