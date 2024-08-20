var faceImageCount = 0;
var prevSelectedTabContainer, prevSelectedTabLabel;

window.onload = async function () {
    await initializeApp();
    await loadFaceRecoModels()
    document.getElementById('all-images-tab').style.display = 'grid';
    await showTab('all-images', 'all-images-tab');
    
}
await addImagesToTab('all-images-tab', allImageIds);
// Function to switch between tabs based on selected radio button
async function showTab(tabLabel, tabContainer) {
    const currSelectedTabContainer = document.getElementById(tabContainer);
    const currSelectedTabLabel = document.querySelector(`label[for="${tabLabel}"]`);

    if (prevSelectedTabContainer) prevSelectedTabContainer.style.display = 'none';
    const hasPTag = currSelectedTabContainer.querySelector('p') !== null;
    if (hasPTag) {
        currSelectedTabContainer.style.display = 'block';
    } else {
        currSelectedTabContainer.style.display = 'grid';
    }

    if (prevSelectedTabLabel) {
        prevSelectedTabLabel.style.backgroundColor = "#a3a3a3";
        prevSelectedTabLabel.style.color = "#000";
    }
    currSelectedTabLabel.style.backgroundColor = "#000";
    currSelectedTabLabel.style.color = "#fff";

    prevSelectedTabLabel = currSelectedTabLabel;
    prevSelectedTabContainer = currSelectedTabContainer;
}

document.getElementById('upload-btn').addEventListener('click', function () {
    if (!isLoggedIn()) {
        toggleModal();
        return;
    }
    document.getElementById('image-selector').click();
});

document.getElementById('image-selector').addEventListener('change', async function (event) {
    const files = event.target.files;
    let data = await getFileData(faceDataFileId);

    if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            try {
                // Extract face descriptors from the file
                const faceDescriptors = await getAllFaceDescriptors(file);
                console.log(`Total ${faceDescriptors.length} faces found.`);

                if (faceDescriptors.length > 0) {
                    // Upload the file and get the file ID
                    const fileId = await uploadFile(file, imageDataFolderId);
                    let countSL = 1;

                    for (const descriptor of faceDescriptors) {
                        console.log(`Turn - ${countSL}`);

                        if (data.length > 0) {
                            const labeledFaceDescriptors = await dataLabalize(data);

                            // Match the descriptor
                            const bestMatch = await getBestMatch(labeledFaceDescriptors, descriptor);

                            //console.log(bestMatch)

                            if (bestMatch.distance >= 0.50) {
                                console.log("Face Not Exist... Added to DB");
                                console.log(bestMatch.distance)
                                data.push({
                                    descriptor: Array.from(descriptor),
                                    imagePaths: [fileId],
                                });
                            } else {
                                console.log("Face Exist... Updating the Path");
                                console.log(bestMatch.distance)
                                const matchedData = data[bestMatch.label];
                                matchedData?.imagePaths.push(fileId);
                            }

                        } else {
                            data = [];
                            console.log("Face Not Exist... Added to DB");
                            // If data is empty, initialize and add the first face descriptor
                            data.push({
                                descriptor: Array.from(descriptor),
                                imagePaths: [fileId],
                            });
                        }
                        countSL++;
                    }
                } else {
                    console.log('No Face Detected');
                }
                console.log("Finish Finding Faces...");
            } catch (error) {
                console.error('Error processing file:', error);
            }
            await updateFile(faceDataFileId, data);
        }
    }
});

document.getElementById('add-face-btn').addEventListener('click', function () {
    if (!isLoggedIn()) {
        toggleModal();
        return;
    }
    document.getElementById('face-selector').click();
});

document.getElementById('face-selector').addEventListener('change', async function (event) {
    const files = event.target.files;
    const imgContainer = document.getElementById('face-container');

    if (files.length > 0) {
        // Clear previous previews

        // Example: Display the selected images
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();

            reader.onload = async function (e) {
                faceImageCount++;
                let faceImage = await createFaceImage(e.target.result, file);
                imgContainer.appendChild(faceImage);
            };

            reader.readAsDataURL(file);
        }
    }
});

async function createFaceImage(src, file) {
    const imgContainerDiv = document.createElement('div');
    imgContainerDiv.className = 'face-img-style';

    const img = document.createElement('img');
    img.src = src;
    const { tabInput, tabLabel, myTab } = await addTabButton(faceImageCount, file);
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '<i class="bx bx-x"></i>';
    closeButton.className = 'close-btn';
    closeButton.onclick = () => {
        imgContainerDiv.remove();
        tabInput.remove();
        tabLabel.remove();
        myTab.remove();
        showTab('all-images', 'all-images-tab')
    };

    imgContainerDiv.appendChild(img);
    imgContainerDiv.appendChild(closeButton);
    return imgContainerDiv;
}

async function addTabButton(count, file) {
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
    const myTab = await addTabContainer(count, file)

    return { tabInput, tabLabel, myTab };
}

async function addTabContainer(count, file) {
    const tabContainer = document.getElementById('tab-container');
    const myTab = document.createElement('div');
    myTab.id = `my-tab-${count}`;
    myTab.classList.add("tab-content");
    myTab.style = "display: none";


    // Extract face descriptors from the file
    const faceDescriptors = await getAllFaceDescriptors(file);
    console.log(`Total ${faceDescriptors.length} faces found.`);

    //console.log(faceDescriptors[0])


    if (faceDescriptors.length > 0) {
        let data = await getFileData(faceDataFileId);

        if (data.length > 0) {
            const labeledFaceDescriptors = await dataLabalize(data);

            // Match the descriptor
            const bestMatch = await getBestMatch(labeledFaceDescriptors, faceDescriptors[0]);

            //console.log(bestMatch)

            if (bestMatch.distance >= 0.50) {
                console.log("Face Not Exist..");
                console.log(bestMatch.distance)
                const myTabPara = document.createElement('p');
                myTabPara.innerHTML = `Not matched with any image...`;
                myTabPara.style.color = '#fff';
                myTabPara.style.fontSize = '20px';
                //myTab.style.display = 'block';
                myTab.appendChild(myTabPara);
                tabContainer.appendChild(myTab);
            } else {
                console.log("Face Exist...");
                console.log(bestMatch.distance)
                const matchedData = data[bestMatch.label];
                console.log(matchedData?.imagePaths);
                tabContainer.appendChild(myTab);
                addImagesToTab(`my-tab-${count}`, matchedData?.imagePaths)
            }

        } else {
            console.log("There is no face in DB");
        }
    } else {
        console.log('No Face Detected');
    }
    console.log("Finish Finding Faces...");
    return myTab;
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
async function uploadFile(file, parentFolderId = null) {
    if (!file) {
        console.error("No file selected.");
        return;
    }

    const metadata = {
        name: file.name,
        mimeType: file.type,
        ...(parentFolderId && { parents: [parentFolderId] })  // Include the parent folder ID if provided
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
        throw new Error(`Network response was not ok. Status: ${response.status}. Text: ${JSON.stringify(errorResponse)}`);
    }

    const data = await response.json();
    console.log("File uploaded successfully:", data);

    return data.id; // Return the file ID after the upload
}

async function addImagesToTab(currTabId, imgIds) {
    const currTab = document.getElementById(currTabId);
    try {
        if(imgIds.length > 0)
            currTab.innerHTML = '';
        // Loop through each file ID and fetch the image
        for (const fileId of imgIds) {
            const image = await getImageById(fileId);
            const divElement = document.createElement('div');
            const imgElement = document.createElement('img');
            imgElement.src = image.thumbnailLink || image.webViewLink;
            imgElement.alt = image.name;
            imgElement.classList.add('image-class');
            // Append the image element to the container
            divElement.classList.add('gallery-item');
            divElement.appendChild(imgElement);
            currTab.appendChild(divElement);
        }
    } catch (error) {
        console.error('Error appending images to HTML:', error);
    }
}