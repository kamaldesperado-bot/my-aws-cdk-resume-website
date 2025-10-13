// Photo Album App with S3-Based Sync
// Albums sync across ALL devices via a shared JSON file on S3!

// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = 'dnxxpf1o3';
const CLOUDINARY_UPLOAD_PRESET = 'upload-preset';

// S3 Configuration - Public JSON file for syncing
const S3_BUCKET_URL = 'https://photo-album-128945984791-eu-central-1.s3.eu-central-1.amazonaws.com';
const ALBUMS_JSON_URL = `${S3_BUCKET_URL}/albums.json`;

// Current user (from session)
const CURRENT_USER = sessionStorage.getItem('photoAlbumUser') || 'photos';

// Album data
let albums = [];
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
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📱 Photo Album Loading with S3 Sync...');
    showNotification('📥 Loading albums from cloud...', 'info');
    
    // Load albums from S3
    await loadAlbumsFromS3();
    
    setupEventListeners();
});

// Load albums from S3 JSON file
async function loadAlbumsFromS3() {
    try {
        // First try localStorage for instant display
        const cachedAlbums = localStorage.getItem('photoAlbums');
        if (cachedAlbums) {
            albums = JSON.parse(cachedAlbums);
            renderAlbumList();
            console.log(`✅ Loaded ${albums.length} albums from cache`);
        }
        
        // Then fetch from S3 (with cache busting)
        const response = await fetch(`${ALBUMS_JSON_URL}?t=${Date.now()}`, {
            method: 'GET',
            cache: 'no-store'
        });
        
        if (response.ok) {
            const data = await response.json();
            albums = data.albums || [];
            
            // Cache for offline use
            localStorage.setItem('photoAlbums', JSON.stringify(albums));
            
            renderAlbumList();
            showNotification(`✅ Synced ${albums.length} albums from cloud`, 'success');
            console.log(`✅ Loaded ${albums.length} albums from S3`);
        } else if (response.status === 404) {
            // No albums.json yet - create empty structure
            console.log('No albums.json found - will create on first upload');
            if (albums.length === 0) {
                showNotification('No albums yet. Create your first album!', 'info');
            }
        } else {
            throw new Error(`S3 fetch failed: ${response.status}`);
        }
        
    } catch (error) {
        console.error('Error loading from S3:', error);
        showNotification('⚠️ Using offline mode - albums may not be synced', 'warning');
        
        // Fall back to localStorage
        const localData = localStorage.getItem('photoAlbums');
        if (localData) {
            albums = JSON.parse(localData);
            renderAlbumList();
        }
    }
}

// Save albums to S3 JSON file
async function saveAlbumsToS3() {
    try {
        // First save to localStorage immediately (instant)
        localStorage.setItem('photoAlbums', JSON.stringify(albums));
        
        // IMPORTANT: We can't directly upload to S3 from browser without credentials
        // So we'll download the JSON and you'll need to manually upload it to S3
        // OR we can use a simple API endpoint
        
        // For now, show instructions to user
        console.log('💡 To sync across devices, download and upload albums.json to S3');
        
        // Auto-download updated albums.json
        downloadAlbumsJSON();
        
        showNotification('⬇️ Download albums.json and upload to S3 bucket to sync', 'info');
        
    } catch (error) {
        console.error('Save error:', error);
        showNotification('❌ Error saving albums', 'error');
    }
}

// Download albums.json for manual S3 upload
function downloadAlbumsJSON() {
    const data = {
        albums: albums,
        lastUpdated: new Date().toISOString(),
        user: CURRENT_USER
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'albums.json';
    link.click();
    URL.revokeObjectURL(url);
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
    
    // Add sync and download buttons
    addSyncButtons();
}

// Add sync and download buttons
function addSyncButtons() {
    const header = document.querySelector('header');
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    
    // Sync button
    const syncBtn = document.createElement('button');
    syncBtn.className = 'btn';
    syncBtn.innerHTML = '🔄 Sync';
    syncBtn.title = 'Reload albums from S3';
    syncBtn.addEventListener('click', async function() {
        syncBtn.disabled = true;
        syncBtn.innerHTML = '🔄 Syncing...';
        await loadAlbumsFromS3();
        syncBtn.disabled = false;
        syncBtn.innerHTML = '🔄 Sync';
    });
    
    // Download button
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn';
    downloadBtn.innerHTML = '⬇️ Download';
    downloadBtn.title = 'Download albums.json to upload to S3';
    downloadBtn.addEventListener('click', function() {
        downloadAlbumsJSON();
        showNotification('📥 Download albums.json and upload to S3 bucket root', 'info');
    });
    
    buttonContainer.appendChild(syncBtn);
    buttonContainer.appendChild(downloadBtn);
    
    const userInfo = document.getElementById('userInfo');
    userInfo.parentNode.insertBefore(buttonContainer, userInfo);
}

// Create new album
async function createAlbum() {
    const name = newAlbumName.value.trim();
    if (!name) {
        showNotification('Bitte geben Sie einen Album-Namen ein / Please enter album name', 'warning');
        return;
    }
    
    // Check if album already exists
    if (albums.find(a => a.name.toLowerCase() === name.toLowerCase())) {
        showNotification('Ein Album mit diesem Namen existiert bereits / Album already exists', 'warning');
        return;
    }
    
    const album = {
        id: name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        name: name,
        created: new Date().toISOString(),
        photos: []
    };
    
    albums.push(album);
    
    // Save and trigger download
    await saveAlbumsToS3();
    
    renderAlbumList();
    newAlbumModal.classList.remove('show');
    
    // Select the new album
    albumSelect.value = albums.length - 1;
    selectAlbum(albums.length - 1);
    
    showNotification(`✅ Album "${name}" created - Upload albums.json to S3 to sync!`, 'success');
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
        showNotification('Bitte wählen Sie zuerst ein Album / Please select an album first', 'warning');
        return;
    }
    
    uploadProgress.style.display = 'block';
    progressList.innerHTML = '';
    
    const fileArray = Array.from(files);
    const uploadPromises = fileArray.map(file => uploadToCloudinary(file));
    
    try {
        const results = await Promise.all(uploadPromises);
        
        // Add photos to current album
        let successCount = 0;
        results.forEach(result => {
            if (result.success) {
                currentAlbum.photos.push({
                    url: result.url,
                    publicId: result.publicId,
                    name: result.name,
                    uploaded: new Date().toISOString(),
                    width: result.width,
                    height: result.height
                });
                successCount++;
            }
        });
        
        // Save and trigger download
        await saveAlbumsToS3();
        
        // Update gallery
        photoCount.textContent = `${currentAlbum.photos.length} Fotos`;
        displayPhotos(currentAlbum.photos);
        renderAlbumList();
        
        showNotification(`✅ ${successCount} photo(s) uploaded! Upload albums.json to S3 to sync.`, 'success');
        
    } catch (error) {
        console.error('Upload error:', error);
        showNotification('❌ Fehler beim Hochladen / Upload error', 'error');
    }
}

// Upload single file to Cloudinary
function uploadToCloudinary(file) {
    return new Promise((resolve, reject) => {
        const progressItem = createProgressItem(file.name);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', `photo-albums/${CURRENT_USER}/${currentAlbum.name}`);
        formData.append('tags', `album:${currentAlbum.id},user:${CURRENT_USER}`);
        
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
                    name: file.name,
                    width: response.width,
                    height: response.height
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
        statusEl.textContent = '✅ Uploaded';
        fillEl.style.width = '100%';
    } else if (status === 'error') {
        statusEl.textContent = '❌ Error';
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
        
        // Use Cloudinary transformations for optimized thumbnails
        const thumbnailUrl = photo.url.replace('/upload/', '/upload/c_fill,w_400,h_400,q_auto,f_auto/');
        
        item.innerHTML = `
            <img src="${thumbnailUrl}" alt="${photo.name}" loading="lazy">
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
    const optimizedUrl = photo.url.replace('/upload/', '/upload/q_auto,f_auto/');
    lightboxImg.src = optimizedUrl;
    lightboxCaption.textContent = `${photo.name} - ${new Date(photo.uploaded).toLocaleDateString('de-DE')}`;
    lightbox.classList.add('show');
}

// Show notification to user
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

console.log('📸 Photo Album with S3 Sync');
console.log('💡 After creating albums or uploading photos:');
console.log('   1. Click "⬇️ Download" to get albums.json');
console.log('   2. Upload albums.json to S3 bucket root');
console.log('   3. Other devices: Click "🔄 Sync" to reload');
