// Photo Album App with Cloudinary + S3 Sync
// Syncs albums across all your devices using S3!

// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = 'dnxxpf1o3';
const CLOUDINARY_UPLOAD_PRESET = 'upload-preset';

// AWS Configuration
const AWS_REGION = 'eu-central-1';
const S3_BUCKET = 'photo-album-128945984791-eu-central-1';
const ALBUMS_FILE_KEY = 'albums-data/albums.json';

// Current user (from session)
const CURRENT_USER = sessionStorage.getItem('photoAlbumUser') || 'photos';

// Album data
let albums = [];
let currentAlbum = null;
let syncEnabled = false;

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
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📱 Photo Album Loading...');
    
    // Load albums from localStorage first (instant)
    loadFromLocalStorage();
    renderAlbumList();
    
    // Then try to sync from cloud (background)
    await syncFromCloud();
    
    setupEventListeners();
});

// Load from localStorage (fast)
function loadFromLocalStorage() {
    const localData = localStorage.getItem('photoAlbums');
    if (localData) {
        try {
            albums = JSON.parse(localData);
            console.log(`✅ Loaded ${albums.length} albums from local storage`);
        } catch (e) {
            console.error('Error parsing local albums:', e);
            albums = [];
        }
    }
}

// Sync from cloud (S3 or DynamoDB)
async function syncFromCloud() {
    try {
        const response = await fetch(window.CONFIG.ALBUMS_API);
        if (response.ok) {
            const data = await response.json();
            albums = data.albums || [];
            localStorage.setItem('photoAlbums', JSON.stringify(albums));
            renderAlbumList();
            console.log(`✅ Synced ${albums.length} albums from cloud`);
        }
    } catch (error) {
        console.error('Sync error:', error);
    }
}

// Save to cloud
async function saveToCloud() {
    try {
        localStorage.setItem('photoAlbums', JSON.stringify(albums));
        await fetch(window.CONFIG.ALBUMS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ albums })
        });
        console.log('✅ Saved to cloud');
    } catch (error) {
        console.error('Save error:', error);
    }
}

// Render album list in dropdown
function renderAlbumList() {
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
        const index = this.value;
        if (index !== '') {
            selectAlbum(parseInt(index));
        } else {
            uploadSection.style.display = 'none';
            gallerySection.style.display = 'none';
        }
    });
    
    // New album button
    newAlbumBtn.addEventListener('click', function() {
        newAlbumModal.classList.add('show');
        newAlbumName.value = '';
        newAlbumName.focus();
    });
    
    // Create album
    createAlbumBtn.addEventListener('click', createAlbum);
    newAlbumName.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') createAlbum();
    });
    
    // Close modal
    const closeModal = newAlbumModal.querySelector('.close');
    closeModal.addEventListener('click', function() {
        newAlbumModal.classList.remove('show');
    });
    
    // Upload area click
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });
    
    // File selection
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            handleFiles(this.files);
        }
    });
    
    // Drag and drop
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
        handleFiles(e.dataTransfer.files);
    });
    
    // Close lightbox
    const closeLightbox = lightbox.querySelector('.close-lightbox');
    closeLightbox.addEventListener('click', function() {
        lightbox.classList.remove('show');
    });
    
    lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox) {
            lightbox.classList.remove('show');
        }
    });
    
    // ESC key to close
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            lightbox.classList.remove('show');
            newAlbumModal.classList.remove('show');
        }
    });
}

// Create new album
async function createAlbum() {
    const name = newAlbumName.value.trim();
    if (!name) {
        alert('Bitte geben Sie einen Album-Namen ein / Please enter album name');
        return;
    }
    
    const album = {
        id: Date.now().toString(),
        name: name,
        created: new Date().toISOString(),
        photos: []
    };
    
    albums.push(album);
    await saveToCloud();
    
    renderAlbumList();
    newAlbumModal.classList.remove('show');
    
    // Select the new album
    albumSelect.value = albums.length - 1;
    selectAlbum(albums.length - 1);
    
    console.log(`✅ Album "${name}" created`);
}

// Select album
function selectAlbum(index) {
    currentAlbum = albums[index];
    
    // Show upload section
    uploadSection.style.display = 'block';
    gallerySection.style.display = 'block';
    
    // Update gallery
    albumTitle.textContent = currentAlbum.name;
    photoCount.textContent = `${currentAlbum.photos.length} Fotos`;
    displayPhotos(currentAlbum.photos);
}

// Handle file uploads
async function handleFiles(files) {
    if (!currentAlbum) {
        alert('Bitte wählen Sie zuerst ein Album / Please select an album first');
        return;
    }
    
    uploadProgress.style.display = 'block';
    progressList.innerHTML = '';
    
    const fileArray = Array.from(files);
    const uploadPromises = fileArray.map(file => uploadToCloudinary(file));
    
    try {
        const results = await Promise.all(uploadPromises);
        
        // Add photos to current album
        results.forEach(result => {
            if (result.success) {
                currentAlbum.photos.push({
                    url: result.url,
                    publicId: result.publicId,
                    name: result.name,
                    uploaded: new Date().toISOString()
                });
            }
        });
        
        // Save to cloud
        await saveToCloud();
        
        // Update gallery
        photoCount.textContent = `${currentAlbum.photos.length} Fotos`;
        displayPhotos(currentAlbum.photos);
        renderAlbumList();
        
        console.log('✅ All photos uploaded!');
        
    } catch (error) {
        console.error('Upload error:', error);
        alert('Fehler beim Hochladen / Upload error');
    }
}

// Upload single file to Cloudinary
function uploadToCloudinary(file) {
    return new Promise((resolve, reject) => {
        const progressItem = createProgressItem(file.name);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', `photo-albums/${CURRENT_USER}`);
        
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', function(e) {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                updateProgressItem(progressItem, percent, 'uploading');
            }
        });
        
        xhr.addEventListener('load', function() {
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
                reject(new Error('Upload failed'));
            }
        });
        
        xhr.addEventListener('error', function() {
            updateProgressItem(progressItem, 0, 'error');
            reject(new Error('Network error'));
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
    progressList.appendChild(item);
    return item;
}

// Update progress item
function updateProgressItem(item, percent, status) {
    const statusEl = item.querySelector('.progress-item-status');
    const fillEl = item.querySelector('.progress-bar-fill');
    
    statusEl.className = `progress-item-status ${status}`;
    
    if (status === 'success') {
        statusEl.textContent = '✅ Erfolgreich hochgeladen';
        fillEl.style.width = '100%';
    } else if (status === 'error') {
        statusEl.textContent = '❌ Fehler';
        fillEl.style.width = '0%';
    } else {
        statusEl.textContent = `${percent}%`;
        fillEl.style.width = `${percent}%`;
    }
}

// Display photos in gallery
function displayPhotos(photos) {
    if (photos.length === 0) {
        photoGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📷</div>
                <p>Keine Fotos in diesem Album</p>
                <p><small>No photos in this album</small></p>
            </div>
        `;
        return;
    }
    
    photoGrid.innerHTML = '';
    
    photos.forEach(photo => {
        const item = document.createElement('div');
        item.className = 'photo-item';
        item.innerHTML = `
            <img src="${photo.url}" alt="${photo.name}" loading="lazy">
            <div class="photo-item-overlay">
                <div>${photo.name}</div>
                <div><small>${new Date(photo.uploaded).toLocaleDateString('de-DE')}</small></div>
            </div>
        `;
        
        item.addEventListener('click', function() {
            showLightbox(photo);
        });
        
        photoGrid.appendChild(item);
    });
}

// Show photo in lightbox
function showLightbox(photo) {
    lightboxImg.src = photo.url;
    lightboxCaption.textContent = `${photo.name} - ${new Date(photo.uploaded).toLocaleDateString('de-DE')}`;
    lightbox.classList.add('show');
}

//Export/Import Functions for Manual Sync
window.exportAlbums = function() {
    const dataStr = JSON.stringify(albums, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `photo-albums-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    console.log('✅ Albums exported!');
};

window.importAlbums = function(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (confirm(`Import ${imported.length} albums? This will replace your current albums.`)) {
                albums = imported;
                saveToCloud();
                renderAlbumList();
                console.log(`✅ Imported ${imported.length} albums`);
            }
        } catch (error) {
            alert('Error importing albums: ' + error.message);
        }
    };
    reader.readAsText(file);
};

console.log('📸 Photo Album App loaded');
console.log('💡 To export albums: exportAlbums()');
console.log('💡 Albums are synced via Cloudinary photos + localStorage metadata');
