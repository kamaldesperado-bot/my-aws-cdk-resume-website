// Photo Album App with GitHub Gist Sync
// Albums automatically sync across ALL devices via GitHub Gist!

// Configuration will be loaded from config.js and config.local.js
// Don't hardcode credentials here!

// Current user (from session)
const CURRENT_USER = sessionStorage.getItem('photoAlbumUser') || 'photos';

// Album data
let albums = [];
let currentAlbum = null;
let syncInProgress = false;

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
    // Album download button logic
    const downloadBtn = document.getElementById('downloadAlbumBtn');
    downloadBtn.addEventListener('click', async function() {
        if (!currentAlbum || !currentAlbum.photos || currentAlbum.photos.length === 0) {
            showNotification('No photos to download in this album.', 'warning');
            return;
        }
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '⬇️ Preparing...';
        // Load JSZip dynamically if not present
        if (typeof JSZip === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            document.body.appendChild(script);
            await new Promise(resolve => { script.onload = resolve; });
        }
        const zip = new JSZip();
        let count = 0;
        for (const photo of currentAlbum.photos) {
            try {
                const response = await fetch(photo.url);
                const blob = await response.blob();
                zip.file(photo.name || `photo${++count}.jpg`, blob);
            } catch (e) {
                console.error('Error downloading photo:', photo.url, e);
            }
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentAlbum.name || 'album'}.zip`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            URL.revokeObjectURL(url);
            a.remove();
        }, 2000);
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = '⬇️ Download Album';
        showNotification('✅ Album ZIP ready for download!', 'success');
    });
    console.log('📱 Photo Album Loading with GitHub Gist Sync...');
    
    // Check if configured
    if (!window.CONFIG || window.window.CONFIG.GITHUB_TOKEN === 'YOUR_GITHUB_TOKEN_HERE') {
        showNotification('⚠️ GitHub sync not configured yet - using local storage only', 'warning');
        loadFromLocalStorage();
        setupEventListeners();
        return;
    }
    
    showNotification('📥 Syncing albums from cloud...', 'info');
    
    // Load albums from GitHub Gist
    await syncFromGist();
    
    setupEventListeners();
});

// Load from localStorage (instant fallback)
function loadFromLocalStorage() {
    const localData = localStorage.getItem('photoAlbums');
    if (localData) {
        try {
            albums = JSON.parse(localData);
            renderAlbumList();
            console.log(`✅ Loaded ${albums.length} albums from local storage`);
        } catch (e) {
            console.error('Error parsing local albums:', e);
            albums = [];
        }
    }
}

// Sync from GitHub Gist
async function syncFromGist() {
    if (syncInProgress) return;
    syncInProgress = true;
    
    try {
        // First load from localStorage for instant display
        loadFromLocalStorage();
        
        // Then sync from Gist
        if (window.CONFIG.GIST_ID && window.CONFIG.GIST_ID !== 'YOUR_GIST_ID_HERE') {
            // Fetch existing Gist
            const response = await fetch(`https://api.github.com/gists/${window.CONFIG.GIST_ID}`, {
                headers: {
                    'Authorization': `token ${window.CONFIG.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                const gist = await response.json();
                const fileContent = gist.files['photo-albums.json'].content;
                const data = JSON.parse(fileContent);
                
                albums = data.albums || [];
                
                // Cache locally
                localStorage.setItem('photoAlbums', JSON.stringify(albums));
                
                renderAlbumList();
                showNotification(`✅ Synced ${albums.length} albums from cloud`, 'success');
                console.log(`✅ Loaded ${albums.length} albums from GitHub Gist`);
            } else {
                console.log('Gist not found or error:', response.status);
                showNotification('Using local albums - will create cloud backup on first save', 'info');
            }
        } else {
            console.log('No Gist ID configured - will create on first save');
        }
        
    } catch (error) {
        console.error('Error syncing from Gist:', error);
        showNotification('⚠️ Using offline mode', 'warning');
    } finally {
        syncInProgress = false;
    }
}

// Save to GitHub Gist
async function saveToGist() {
    if (!CONFIG || window.CONFIG.GITHUB_TOKEN === 'YOUR_GITHUB_TOKEN_HERE') {
        // Not configured - just save locally
        localStorage.setItem('photoAlbums', JSON.stringify(albums));
        return;
    }
    
    try {
        // Save to localStorage immediately
        localStorage.setItem('photoAlbums', JSON.stringify(albums));
        
        const data = {
            albums: albums,
            lastUpdated: new Date().toISOString(),
            user: CURRENT_USER
        };
        
        const gistData = {
            description: 'Photo Album Data - Auto-synced',
            public: false, // Private Gist
            files: {
                'photo-albums.json': {
                    content: JSON.stringify(data, null, 2)
                }
            }
        };
        
        let response;
        
        if (window.CONFIG.GIST_ID && window.CONFIG.GIST_ID !== 'YOUR_GIST_ID_HERE') {
            // Update existing Gist
            response = await fetch(`https://api.github.com/gists/${window.CONFIG.GIST_ID}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${window.CONFIG.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gistData)
            });
        } else {
            // Create new Gist
            response = await fetch('https://api.github.com/gists', {
                method: 'POST',
                headers: {
                    'Authorization': `token ${window.CONFIG.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gistData)
            });
            
            if (response.ok) {
                const newGist = await response.json();
                console.log(`✅ Created new Gist: ${newGist.id}`);
                console.log(`📝 Add this to your config.local.js: GIST_ID: '${newGist.id}'`);
                showNotification(`✅ Cloud backup created! Gist ID: ${newGist.id}`, 'success');
            }
        }
        
        if (response.ok) {
            console.log('✅ Saved to GitHub Gist');
        } else {
            throw new Error(`Gist save failed: ${response.status}`);
        }
        
    } catch (error) {
        console.error('Error saving to Gist:', error);
        showNotification('⚠️ Could not sync to cloud - saved locally', 'warning');
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
    
    // Add sync button
    addSyncButton();
}

// Add sync button
function addSyncButton() {
    const header = document.querySelector('header');
    const syncBtn = document.createElement('button');
    syncBtn.className = 'btn';
    syncBtn.innerHTML = '🔄 Sync';
    syncBtn.title = 'Sync albums from GitHub Gist';
    
    syncBtn.addEventListener('click', async function() {
        if (syncInProgress) return;
        
        syncBtn.disabled = true;
        syncBtn.innerHTML = '🔄 Syncing...';
        
        await syncFromGist();
        
        syncBtn.disabled = false;
        syncBtn.innerHTML = '🔄 Sync';
    });
    
    const userInfo = document.getElementById('userInfo');
    userInfo.parentNode.insertBefore(syncBtn, userInfo);
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
    
    // Save to Gist (will also save to localStorage)
    await saveToGist();
    
    renderAlbumList();
    newAlbumModal.classList.remove('show');
    
    // Select the new album
    albumSelect.value = albums.length - 1;
    selectAlbum(albums.length - 1);
    
    showNotification(`✅ Album "${name}" created and synced!`, 'success');
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
        // Force save to Gist to ensure photo data is synced
        saveToGist();
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
        
        // Save to Gist
        await saveToGist();
        
        // Update gallery
        photoCount.textContent = `${currentAlbum.photos.length} Fotos`;
        displayPhotos(currentAlbum.photos);
        renderAlbumList();
        
        showNotification(`✅ ${successCount} photo(s) uploaded and synced!`, 'success');
        
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
        formData.append('upload_preset', window.CONFIG.CLOUDINARY_UPLOAD_PRESET);
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
        
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${window.CONFIG.CLOUDINARY_CLOUD_NAME}/image/upload`);
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
    photos.forEach((photo, idx) => {
        const item = document.createElement('div');
        item.className = 'photo-item';
        // Use Cloudinary transformations for optimized thumbnails
        const thumbnailUrl = photo.url.replace('/upload/', '/upload/c_fill,w_400,h_400,q_auto,f_auto/');
        item.innerHTML = `
            <img src="${thumbnailUrl}" alt="${photo.name}" loading="lazy">
            <div class="photo-item-overlay">
                <div>${photo.name}</div>
                <div><small>${new Date(photo.uploaded).toLocaleDateString('de-DE')}</small></div>
                <button class="btn-delete-photo" title="Delete photo">🗑️</button>
            </div>
        `;
        // Delete button logic
        item.querySelector('.btn-delete-photo').addEventListener('click', function(e) {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this photo?')) {
                currentAlbum.photos.splice(idx, 1);
                saveToGist();
                renderAlbumList();
                selectAlbum(albums.indexOf(currentAlbum));
                showNotification('Photo deleted!', 'success');
            }
        });
        // Lightbox logic
        item.addEventListener('click', function() {
            showLightbox(photo, idx);
        });
        photoGrid.appendChild(item);
    });
}

// Show photo in lightbox
function showLightbox(photo) {
    showLightbox(photo, currentAlbum.photos.indexOf(photo));
}
// Enhanced lightbox with scroll
function showLightbox(photo, idx) {
    const optimizedUrl = photo.url.replace('/upload/', '/upload/q_auto,f_auto/');
    lightboxImg.src = optimizedUrl;
    lightboxCaption.textContent = `${photo.name} - ${new Date(photo.uploaded).toLocaleDateString('de-DE')}`;
    lightbox.classList.add('show');
    let currentIdx = idx;
    // Remove previous listeners
    document.onkeydown = null;
    document.onkeydown = function(e) {
        if (!lightbox.classList.contains('show')) return;
        if (e.key === 'ArrowRight') {
            currentIdx = (currentIdx + 1) % currentAlbum.photos.length;
            showLightbox(currentAlbum.photos[currentIdx], currentIdx);
        } else if (e.key === 'ArrowLeft') {
            currentIdx = (currentIdx - 1 + currentAlbum.photos.length) % currentAlbum.photos.length;
            showLightbox(currentAlbum.photos[currentIdx], currentIdx);
        } else if (e.key === 'Escape') {
            lightbox.classList.remove('show');
        }
    };
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

// Export/Import for backup
window.exportAlbums = function() {
    const dataStr = JSON.stringify(albums, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `photo-albums-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('✅ Albums exported!', 'success');
};

window.importAlbums = function(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            albums = imported;
            saveToGist();
            renderAlbumList();
            showNotification(`✅ Imported ${albums.length} albums and synced!`, 'success');
        } catch (error) {
            showNotification('❌ Error importing albums: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
};

console.log('📸 Photo Album with GitHub Gist Sync');
console.log('💡 Albums automatically sync across all devices!');
console.log('💡 Click "🔄 Sync" to refresh from cloud');
console.log('💡 Backup: exportAlbums() | Restore: importAlbums(file)');
