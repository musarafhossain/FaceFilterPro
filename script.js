var faceImageCount = 0;
var prevSelectedTabContainer, prevSelectedTabLabel;
var parentFolderId;
var imageDataFolderId;
var faceDataFolderId;

// Function to switch between tabs based on selected radio button
function showTab(tabLabel, tabContainer) {
    const currSelectedTabContainer = document.getElementById(tabContainer);
    const currSelectedTabLabel = document.querySelector(`label[for="${tabLabel}"]`);

    if (prevSelectedTabContainer) prevSelectedTabContainer.style.display = 'none';
    currSelectedTabContainer.style.display = 'block';

    if (prevSelectedTabLabel) prevSelectedTabLabel?.classList.remove('active');
    currSelectedTabLabel.classList.add('active');

    prevSelectedTabLabel = currSelectedTabLabel;
    prevSelectedTabContainer = currSelectedTabContainer;
}
showTab('all-images', 'all-images-tab');

document.getElementById('upload-btn').addEventListener('click', function () {
    if (!isLoggedIn()) {
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
            uploadFile(file);
        }

        // Append the preview images to the body or any container
        imgContainer.appendChild(imagePreviewContainer);
    }
});

document.getElementById('add-face-btn').addEventListener('click', function () {
    if (!isLoggedIn()) {
        toggleModal();
        return;
    }
    document.getElementById('face-selector').click();
});

document.getElementById('face-selector').addEventListener('change', function (event) {
    const files = event.target.files;
    const imgContainer = document.getElementById('face-container');

    if (files.length > 0) {
        // Clear previous previews

        // Example: Display the selected images
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();

            reader.onload = function (e) {
                faceImageCount++;
                let faceImage = createFaceImage(e.target.result);
                imgContainer.appendChild(faceImage);
            };

            reader.readAsDataURL(file);
        }
    }
});

function createFaceImage(src) {
    const imgContainerDiv = document.createElement('div');
    imgContainerDiv.className = 'face-img-style';

    const img = document.createElement('img');
    img.src = src;
    const { tabInput, tabLabel } = addTabButton(faceImageCount);
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '<i class="bx bx-x"></i>';
    closeButton.className = 'close-btn';
    closeButton.onclick = () => {
        imgContainerDiv.remove();
        tabInput.remove();
        tabLabel.remove();
        showTab('all-images', 'all-images-tab')
    };

    imgContainerDiv.appendChild(img);
    imgContainerDiv.appendChild(closeButton);
    return imgContainerDiv;
}

function addTabButton(count) {
    const tabBtn = document.getElementById('tab-btn');
    const tabInput = document.createElement('input');
    tabInput.type = 'radio';
    tabInput.id = `face-${count}`;
    tabInput.value = `face-${count}`;
    tabInput.name = `tab`;
    tabInput.onclick = () => {
        showTab(`face-${count}`, `my-tab-${count}`);
    };
    const tabLabel = document.createElement('label');
    tabLabel.setAttribute('for', `face-${count}`);
    tabLabel.innerHTML = `Face ${count}`
    tabBtn.appendChild(tabInput);
    tabBtn.appendChild(tabLabel);
    addTabContainer(count)

    return { tabInput, tabLabel };
}

function addTabContainer(count) {
    const tabContainer = document.getElementById('tab-container');
    const myTab = document.createElement('div');
    myTab.id = `my-tab-${count}`;
    myTab.class = "tab-content";
    myTab.style = "display: none";
    const myTabPara = document.createElement('p');
    myTabPara.innerHTML = `This is tab ${count}`;
    myTab.appendChild(myTabPara);
    tabContainer.appendChild(myTab);
}

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

document.addEventListener('DOMContentLoaded', () => {
    const faceContainer = document.querySelector('.face-container');

    let isMouseDown = false;
    let startX, scrollLeft;

    faceContainer.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'IMG') {
            // Prevent dragging if the target is an image
            e.preventDefault();
        }

        isMouseDown = true;
        startX = e.pageX - faceContainer.offsetLeft;
        scrollLeft = faceContainer.scrollLeft;
    });

    faceContainer.addEventListener('mouseleave', () => {
        isMouseDown = false;
    });

    faceContainer.addEventListener('mouseup', () => {
        isMouseDown = false;
    });

    faceContainer.addEventListener('mousemove', (e) => {
        if (!isMouseDown) return;
        e.preventDefault();
        const x = e.pageX - faceContainer.offsetLeft;
        const walk = (x - startX) * 2; // Scroll speed
        faceContainer.scrollLeft = scrollLeft - walk;
    });

    // Optional: Implement touch events for mobile devices
    faceContainer.addEventListener('touchstart', (e) => {
        isMouseDown = true;
        startX = e.touches[0].pageX - faceContainer.offsetLeft;
        scrollLeft = faceContainer.scrollLeft;
    });

    faceContainer.addEventListener('touchend', () => {
        isMouseDown = false;
    });

    faceContainer.addEventListener('touchmove', (e) => {
        if (!isMouseDown) return;
        const x = e.touches[0].pageX - faceContainer.offsetLeft;
        const walk = (x - startX) * 2; // Scroll speed
        faceContainer.scrollLeft = scrollLeft - walk;
    });
});

// Function to upload a file to Google Drive
async function uploadFile(file) {
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

