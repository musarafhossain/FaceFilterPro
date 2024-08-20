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

