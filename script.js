var faceImageCount = 0;
var prevSelectedTabContainer, prevSelectedTabLabel;
var currTab;
var err_modal = document.getElementById("err-modal");

window.onload = async function () {
    try {
        toggleModal('loading-modal'); // Show loading modal
        await initializeApp(); // Initialize the app
        console.log("App Initialization Complete...");

        await loadFaceRecoModels(); // Load face recognition models
        console.log("Face Recognition Models Loaded...");

        //toggleModal('loading-modal'); //hide loading modal 
        //toggleModal('progress-modal'); //hide progress modal 

        addImagesToTab('all-images-tab', allImageIds); // Add images to tab
        document.getElementById('all-images-tab').style.display = 'grid'; // Show tab

        await showTab('all-images', 'all-images-tab'); // Show the 'all-images' tab
        console.log("Display All Images...");
        //console.log(await getFileData(faceDataFileId));

    } catch (error) {
        console.error("An error occurred during initialization:", error);
        //toggleModal('err-modal'); // Show error modal if something goes wrong
    } finally {
        toggleModal('loading-modal'); // Hide progress modal after everything is done
    }
};

// Function to switch between tabs based on selected radio button
async function showTab(tabLabel, tabContainer) {
    currTab = tabContainer;
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

document.getElementById('upload-btn').addEventListener('click', async function () {
    if (!isLoggedIn()) {
        toggleModal('err-modal');
        return;
    }
    await refreshAccessToken();
    document.getElementById('image-selector').click();
});

document.getElementById('image-selector').addEventListener('change', async function (event) {
    toggleModal('loading-modal'); // Show loading modal
    const files = event.target.files;
    let data = await getFileData(faceDataFileId);
    toggleModal('loading-modal'); // Hide loading modal
    try {
        toggleModal('progress-modal');
        if (files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                document.getElementById('progress-status').innerHTML = `(${i + 1}/${files.length})`;
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
            }
            await updateFile(faceDataFileId, data);
        }
    } catch (error) {
        console.error('Error handling file selection:', error);
    } finally {
        //document.getElementById('progress-status').innerHTML = `(0/0)`;
        toggleModal('progress-modal'); // Hide progrss modal
        window.location.reload();
    }
});

document.getElementById('add-face-btn').addEventListener('click', async function () {
    if (!isLoggedIn()) {
        toggleModal('err-modal');
        return;
    }
    await refreshAccessToken();
    if(!allImageIds.length>0){
        toggleModal('up-modal')
        return
    }
    document.getElementById('face-selector').click();
});

document.getElementById('face-selector').addEventListener('change', async function (event) {
    const files = event.target.files;
    const imgContainer = document.getElementById('face-container');

    if (files.length > 0) {
        toggleModal('loading-modal');

        // Example: Display the selected images
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();

            reader.onload = async function (e) {
                faceImageCount++;
                let faceImage = await createFaceImage(e.target.result, file);
                imgContainer.appendChild(faceImage);
                toggleModal('loading-modal');
            };

            reader.readAsDataURL(file);
        }
        //
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
    const faceDescriptors = await getAllFaceDescriptors(file);
    console.log(`Total ${faceDescriptors.length} faces found.`);
    if (faceDescriptors.length > 0) {
        let data = await getFileData(faceDataFileId);
        if (data.length > 0) {
            const labeledFaceDescriptors = await dataLabalize(data);
            const bestMatch = await getBestMatch(labeledFaceDescriptors, faceDescriptors[0]);
            if (bestMatch.distance >= 0.45) {
                console.log("Face Not Exist..");
                console.log(bestMatch.distance)
                const myTabPara = document.createElement('p');
                myTabPara.innerHTML = `Not matched with any image...`;
                myTabPara.style.color = '#fff';
                myTabPara.style.fontSize = '20px';
                myTab.appendChild(myTabPara);
                tabContainer.appendChild(myTab);
            } else {
                console.log("Face Exist...");
                console.log(bestMatch.distance)
                const matchedData = data[bestMatch.label];
                console.log(matchedData?.imagePaths);
                tabContainer.appendChild(myTab);
                faceImageIds[`my-tab-${count}`] = matchedData?.imagePaths;
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

async function addImagesToTab(currTabId, imgIds) {
    const currTab = document.getElementById(currTabId);
    try {
        let progress = 0;
        toggleModal('progress-modal');
        if (imgIds.length > 0)
            currTab.innerHTML = '';
        // Loop through each file ID and fetch the image
        for (const fileId of imgIds) {
            progress++;
            document.getElementById('progress-status').innerHTML = `(${progress}/${imgIds.length})`;
            const image = await getImageById(fileId);
            const divElement = document.createElement('div');
            const imgElement = document.createElement('img');
            imgElement.src = image.thumbnailLink || image.webViewLink;
            imgElement.alt = image.name;
            imgElement.onclick = () => {
                //console.log(imgElement.src);
                toggleGalleryModal(imgElement.src);
            }
            imgElement.classList.add('image-class');
            // Append the image element to the container
            divElement.classList.add('gallery-item');
            divElement.appendChild(imgElement);
            currTab.appendChild(divElement);
        }
    } catch (error) {
        console.error('Error appending images to HTML:', error);
    } finally {
        toggleModal('progress-modal');
        //document.getElementById('progress-status').innerHTML = `(0/0)`;
    }
}

function toggleModal(modal) {
    document.getElementById(modal).classList.toggle("show-modal");
}

function toggleGalleryModal(src) {
    document.getElementById('gallery-modal').classList.toggle("show-modal");
    const img = document.getElementById('gallery-main-image');
    img.src = src;
}

function windowOnClick(event) {
    // Check if the click target is the error modal
    if (event.target === err_modal) {
        toggleModal('error-modal'); // Pass the specific modal ID if needed
    }
}

window.addEventListener("click", windowOnClick);