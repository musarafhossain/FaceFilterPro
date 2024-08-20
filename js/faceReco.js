// Loading all face reco models
async function loadFaceRecoModels() {
    await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri('./models'),
        //faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    ]);
}

async function getAllFaceDescriptors(file){
    if (file) {
        let faceDescriptors;
        //console.log("Finding Faces...")
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
            // Detect faces in the image
            const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors()
            ;

            // Log face descriptors
            faceDescriptors = await detections.map(det => det.descriptor);
            //console.log('Face Descriptors:', faceDescriptors);
            // Clean up
            URL.revokeObjectURL(img.src);
            //console.log("Finish Finding Faces...")
        return faceDescriptors;
    } 
}

async function getBestMatch(labeledFaceDescriptors, descriptor) {
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
    const bestMatch = faceMatcher.findBestMatch(descriptor);
    return bestMatch;
}

async function dataLabalize(data) {
    // Convert and map data descriptors to labeled face descriptors
    const labeledFaceDescriptors = await Promise.all(data.map(async (dt, index) => {
        return new faceapi.LabeledFaceDescriptors(
            `${index}`,
            [new Float32Array(dt.descriptor)]
        );
    }));
    return labeledFaceDescriptors;
}

async function getFaceDescriptorFromImage(imagePath) {
    // Load models
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');

    // Load the image
    const img = await faceapi.fetchImage(imagePath);

    // Detect face descriptors
    const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

    if (!detections) {
        throw new Error('No face detected in the image.');
    }

    return detections.descriptor;
}