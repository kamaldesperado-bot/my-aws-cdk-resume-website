// Photo Album App with Cloudinary Integration

// ⚠️ IMPORTANT: You need to create a FREE Cloudinary account and get your credentials
// Sign up at: https://cloudinary.com/users/register/free
// Then replace these with your actual values:

const CLOUDINARY_CLOUD_NAME = 'dnxxpf1o3'; // Your Cloudinary cloud name
const CLOUDINARY_UPLOAD_PRESET = 'upload-preset'; // Your unsigned upload preset

// Album data structure (stored in localStorage)
let albums = JSON.parse(localStorage.getItem('photoAlbums') || '[]');
let currentAlbum = null;

// DOM Elements
const albumSelect = document.getElementById('albumSelect');
const newAlbumBtn = document.getElementById('newAlbumBtn');
const uploadSection = document.getElementById('uploadSection');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadProgress = document.getElementById('uploadProgress');
const progressList = document.getElementById('progressList');
const gallerySection = document.getElementById('gallerySection');
const albumTitle = document.getElementById('albumTitle');
const photoCount = document.getElementById('photoCount');
const photoGrid = document.getElementById('photoGrid');
const newAlbumModal = document.getElementById('newAlbumModal');
const newAlbumName = document.getElementById('newAlbumName');
const createAlbumBtn = document.getElementById('createAlbumBtn');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadAlbums();
    setupEventListeners();
});

// Load albums into dropdown
function loadAlbums() {
    albumSelect.innerHTML = '<option value="">-- Wählen Sie ein Album / Select Album --</option>';
    
    albums.forEach((album, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${album.name} (${album.photos.length} Fotos)`;
        albumSelect.appendChild(option);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Album selection
    albumSelect.addEventListener('change', function() {
        if (this.value !== '') {
            selectAlbum(parseInt(this.value));
        } else {
            hideAlbumView();
        }
    });

    // New album button
    newAlbumBtn.addEventListener('click', function() {
        newAlbumModal.classList.add('show');
        newAlbumName.focus();
    });

    // Create album
    createAlbumBtn.addEventListener('click', createAlbum);
    newAlbumName.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') createAlbum();
    });

    // Close modal
    document.querySelector('.close').addEventListener('click', function() {
        newAlbumModal.classList.remove('show');
        newAlbumName.value = '';
    });

    // Upload area interactions
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });

    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function() {
        this.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    // Lightbox close
    document.querySelector('.close-lightbox').addEventListener('click', function() {
        lightbox.classList.remove('show');
    });

    lightbox.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('show');
        }
    });
}

// Create new album
function createAlbum() {
    const name = newAlbumName.value.trim();
    
    if (!name) {
        alert('Bitte geben Sie einen Album-Namen ein / Please enter an album name');
        return;
    }

    const newAlbum = {
        name: name,
        created: new Date().toISOString(),
        photos: []
    };

    albums.push(newAlbum);
    saveAlbums();
    loadAlbums();

    // Select the new album
    albumSelect.value = albums.length - 1;
    selectAlbum(albums.length - 1);

    // Close modal
    newAlbumModal.classList.remove('show');
    newAlbumName.value = '';
}

// Select album
function selectAlbum(index) {
    currentAlbum = index;
    const album = albums[index];
    
    // Show upload section
    uploadSection.style.display = 'block';
    
    // Show gallery
    gallerySection.style.display = 'block';
    albumTitle.textContent = album.name;
    photoCount.textContent = `${album.photos.length} Foto${album.photos.length !== 1 ? 's' : ''}`;
    
    // Display photos
    displayPhotos(album.photos);
}

// Hide album view
function hideAlbumView() {
    uploadSection.style.display = 'none';
    gallerySection.style.display = 'none';
    currentAlbum = null;
}

// Handle file uploads
async function handleFiles(files) {
    if (currentAlbum === null) {
        alert('Bitte wählen Sie zuerst ein Album aus / Please select an album first');
        return;
    }

    if (files.length === 0) return;

    // Check Cloudinary configuration
    if (CLOUDINARY_CLOUD_NAME === 'YOUR_CLOUD_NAME' || CLOUDINARY_UPLOAD_PRESET === 'YOUR_UPLOAD_PRESET') {
        alert('⚠️ Cloudinary nicht konfiguriert!\n\nBitte erstellen Sie ein KOSTENLOSES Cloudinary-Konto:\n1. Gehen Sie zu: https://cloudinary.com/users/register/free\n2. Ersetzen Sie CLOUDINARY_CLOUD_NAME und CLOUDINARY_UPLOAD_PRESET in app.js\n\n⚠️ Cloudinary not configured!\n\nPlease create a FREE Cloudinary account:\n1. Go to: https://cloudinary.com/users/register/free\n2. Replace CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET in app.js');
        return;
    }

    uploadProgress.style.display = 'block';
    progressList.innerHTML = '';

    const fileArray = Array.from(files);
    const uploadPromises = fileArray.map(file => uploadToCloudinary(file));

    try {
        const results = await Promise.all(uploadPromises);
        
        // Add successful uploads to album
        const successfulUploads = results.filter(r => r.success);
        successfulUploads.forEach(result => {
            albums[currentAlbum].photos.push({
                url: result.url,
                publicId: result.publicId,
                name: result.name,
                uploaded: new Date().toISOString()
            });
        });

        saveAlbums();
        selectAlbum(currentAlbum); // Refresh gallery
        loadAlbums(); // Update album dropdown

        // Hide progress after 2 seconds
        setTimeout(() => {
            uploadProgress.style.display = 'none';
            fileInput.value = '';
        }, 2000);

    } catch (error) {
        console.error('Upload error:', error);
        alert('Fehler beim Hochladen / Upload error: ' + error.message);
    }
}

// Upload single file to Cloudinary
function uploadToCloudinary(file) {
    return new Promise((resolve, reject) => {
        // Create progress item
        const progressItem = createProgressItem(file.name);
        progressList.appendChild(progressItem);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', 'photo-albums/' + albums[currentAlbum].name);

        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                updateProgressItem(progressItem, percent, 'uploading');
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                updateProgressItem(progressItem, 100, 'success');
                resolve({
                    success: true,
                    url: response.secure_url,
                    publicId: response.public_id,
                    name: file.name
                });
            } else {
                updateProgressItem(progressItem, 0, 'error');
                resolve({
                    success: false,
                    error: 'Upload failed'
                });
            }
        });

        xhr.addEventListener('error', () => {
            updateProgressItem(progressItem, 0, 'error');
            resolve({
                success: false,
                error: 'Network error'
            });
        });

        xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);
        xhr.send(formData);
    });
}

// Create progress item UI
function createProgressItem(fileName) {
    const item = document.createElement('div');
    item.className = 'progress-item';
    item.innerHTML = `
        <div class="progress-item-header">
            <span class="progress-item-name">${fileName}</span>
            <span class="progress-item-status uploading">0%</span>
        </div>
        <div class="progress-bar">
            <div class="progress-bar-fill" style="width: 0%"></div>
        </div>
    `;
    return item;
}

// Update progress item
function updateProgressItem(item, percent, status) {
    const statusEl = item.querySelector('.progress-item-status');
    const fillEl = item.querySelector('.progress-bar-fill');
    
    fillEl.style.width = percent + '%';
    statusEl.className = 'progress-item-status ' + status;
    
    if (status === 'success') {
        statusEl.textContent = '✓ Fertig / Done';
    } else if (status === 'error') {
        statusEl.textContent = '✗ Fehler / Error';
    } else {
        statusEl.textContent = percent + '%';
    }
}

// Display photos in grid
function displayPhotos(photos) {
    photoGrid.innerHTML = '';
    
    if (photos.length === 0) {
        photoGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📷</div>
                <p>Noch keine Fotos / No photos yet</p>
                <p><small>Laden Sie Fotos hoch, um zu beginnen / Upload photos to get started</small></p>
            </div>
        `;
        return;
    }

    photos.forEach((photo, index) => {
        const item = document.createElement('div');
        item.className = 'photo-item';
        item.innerHTML = `
            <img src="${photo.url}" alt="${photo.name}" loading="lazy">
            <div class="photo-item-overlay">
                <div>${photo.name}</div>
                <div><small>${new Date(photo.uploaded).toLocaleDateString()}</small></div>
            </div>
        `;
        
        item.addEventListener('click', () => {
            showLightbox(photo);
        });
        
        photoGrid.appendChild(item);
    });
}

// Show lightbox
function showLightbox(photo) {
    lightboxImg.src = photo.url;
    lightboxCaption.textContent = photo.name;
    lightbox.classList.add('show');
}

// Save albums to localStorage
function saveAlbums() {
    localStorage.setItem('photoAlbums', JSON.stringify(albums));
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        lightbox.classList.remove('show');
        newAlbumModal.classList.remove('show');
    }
});
