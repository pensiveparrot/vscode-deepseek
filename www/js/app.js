document.addEventListener('deviceready', onDeviceReady, false);

let mediaRec = null;
let isRecording = false;
const DEEPSEEK_API_ENDPOINT = 'YOUR_DEEPSEEK_API_ENDPOINT';
const DEEPSEEK_API_KEY = 'YOUR_DEEPSEEK_API_KEY';

function onDeviceReady() {
    const recordButton = document.getElementById('recordButton');
    const statusDiv = document.getElementById('status');
    const responseDiv = document.getElementById('response');
    const languageSelect = document.getElementById('languageSelect');

    // Setup button listeners
    recordButton.addEventListener('touchstart', startRecording);
    recordButton.addEventListener('touchend', stopRecording);

    // Handle recording errors
    function onError(error) {
        statusDiv.textContent = 'Error: ' + error.message;
    }

    function startRecording() {
        isRecording = true;
        recordButton.classList.add('recording');
        statusDiv.textContent = 'Recording...';

        // Create media file
        const fileName = 'recording_' + new Date().getTime() + '.wav';
        const dirPath = cordova.file.externalDataDirectory;

        mediaRec = new Media(dirPath + fileName,
            () => {
                console.log('Recording completed');
            },
            onError
        );

        mediaRec.startRecord();
    }

    async function stopRecording() {
        if (!isRecording) return;

        isRecording = false;
        recordButton.classList.remove('recording');
        statusDiv.textContent = 'Processing...';

        mediaRec.stopRecord();

        try {
            // Get the recorded file
            const fileEntry = await new Promise((resolve, reject) => {
                mediaRec.release();
                window.resolveLocalFileSystemURL(
                    mediaRec.src,
                    resolve,
                    reject
                );
            });

            // Read the file
            const file = await new Promise((resolve, reject) => {
                fileEntry.file(resolve, reject);
            });

            // Send to Deepseek API
            const formData = new FormData();
            formData.append('audio', file);
            formData.append('target_language', languageSelect.value);

            const response = await fetch(DEEPSEEK_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            responseDiv.textContent = data.text;

            // Play response using TTS
            TTS.speak({
                text: data.text,
                locale: languageSelect.value,
                rate: 0.75
            }, function () {
                statusDiv.textContent = 'Done!';
            }, function (error) {
                statusDiv.textContent = 'TTS Error: ' + error;
            });

        } catch (error) {
            statusDiv.textContent = 'Error: ' + error.message;
        }
    }
}