const scheduleBtn = document.getElementById('scheduleBtn');
const uploadInput = document.getElementById('uploadInput');
const dropArea = document.getElementById('dropArea');
const photoGrid = document.getElementById('photoGrid');
const errorBox = document.getElementById('errorBox');
const progressBar = document.getElementById('progressBar');
const progressInner = progressBar.querySelector('.progress-inner');

const imgurKey = 'e03fb06ca3f2cd7';
const backupImageUrl = "https://dummyimage.com/400x400/cccccc/666666&text=Image+Not+Found";
const localStorageKey = 'photoAlbum';

// Load saved photos from local storage 
window.addEventListener('load', () => {
    const savedPhotos = JSON.parse(localStorage.getItem(localStorageKey)) || [];
    savedPhotos.forEach(photo => addPhotoToAlbum(photo.url, photo.id, false));
});

// Save photos to local storage
function savePhotoToLocalStorage(imageUrl, photoId) {
    const savedPhotos = JSON.parse(localStorage.getItem(localStorageKey)) || [];
    savedPhotos.push({ url: imageUrl, id: photoId });
    localStorage.setItem(localStorageKey, JSON.stringify(savedPhotos));
}

// Remove photos from local storage
function removePhotoFromLocalStorage(photoId) {
    let savedPhotos = JSON.parse(localStorage.getItem(localStorageKey)) || [];
    savedPhotos = savedPhotos.filter(photo => photo.id !== photoId);
    localStorage.setItem(localStorageKey, JSON.stringify(savedPhotos));
}

//for handling eroor/to show error
function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.remove('hidden');
    setTimeout(() => {
        errorBox.classList.add('hidden');
    }, 5000);
}

// Update progress bar
function updateProgress(percent) {
    progressBar.classList.remove('hidden');
    progressInner.style.width = percent + '%';
    if (percent === 100) {
        setTimeout(() => {
            progressBar.classList.add('hidden');
            progressInner.style.width = '0%';
        }, 1000);
    }
}

//to   Schedule event
scheduleBtn.addEventListener('click', () => {
    const eventDetails = {
        title: "Friends Meetup",
        details: "web dev project is done, now it's time to meet up with friends",
        location: "Koramangala",
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000)
    };

    function formatDateTime(date) {
        return date.toISOString().replace(/-|:|\.\d+/g, "");
    }

    const calendarUrl = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(eventDetails.title)}&details=${encodeURIComponent(eventDetails.details)}&location=${encodeURIComponent(eventDetails.location)}&dates=${formatDateTime(eventDetails.startTime)}/${formatDateTime(eventDetails.endTime)}`;

    window.open(calendarUrl, "_blank");
});

// Upload pics
async function uploadPhoto(photoFile) {
    if (!photoFile || !photoFile.type.startsWith('image/')) {
        showError('Please select an image file.');
        return;
    }

    const uploadData = new FormData();
    uploadData.append('image', photoFile);

    try {
        updateProgress(20);

        const response = await fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
                'Authorization': `Client-ID ${imgurKey}`
            },
            body: uploadData
        });

        updateProgress(70);

        const data = await response.json();
        console.log('Upload response:', data);

        if (data.success) {
            const localUrl = URL.createObjectURL(photoFile);
            addPhotoToAlbum(localUrl, data.data.id, true);
            updateProgress(100);
        } else {
            throw new Error(data.data?.error?.message || 'Upload failed');
        }
    } catch (error) {
        console.error('Upload error:', error);
        const localUrl = URL.createObjectURL(photoFile);
        addPhotoToAlbum(localUrl, 'local-' + Date.now(), true);
        showError('Could not upload');
        updateProgress(100);
    }
}

// Add photos to album
function addPhotoToAlbum(imageUrl, photoId, saveToLocalStorage = false) {
    const photoBox = document.createElement('div');
    photoBox.className = 'photo-box';
    photoBox.dataset.id = photoId;

    const img = document.createElement('img');
    img.alt = 'Album Photo';
    img.loading = 'lazy';
    img.onerror = () => {
        console.error(`Failed to load image: ${imageUrl}`);
        img.src = backupImageUrl;
    };
    img.src = imageUrl;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-button';
    deleteBtn.textContent = '×';
    deleteBtn.onclick = () => {
        URL.revokeObjectURL(img.src);
        photoBox.remove();
        removePhotoFromLocalStorage(photoId);
    };

    photoBox.appendChild(img);
    photoBox.appendChild(deleteBtn);
    photoGrid.appendChild(photoBox);

    if (saveToLocalStorage) {
        savePhotoToLocalStorage(imageUrl, photoId);
    }
}

// Drag and drop 
dropArea.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropArea.style.borderColor = '#3498db';
});

dropArea.addEventListener('dragleave', () => {
    dropArea.style.borderColor = '#bdc3c7';
});

dropArea.addEventListener('drop', (event) => {
    event.preventDefault();
    dropArea.style.borderColor = '#bdc3c7';
    const file = event.dataTransfer.files[0];
    if (file) uploadPhoto(file);
});

// finally Click uploads
dropArea.addEventListener('click', () => uploadInput.click());

uploadInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) uploadPhoto(file);
});
