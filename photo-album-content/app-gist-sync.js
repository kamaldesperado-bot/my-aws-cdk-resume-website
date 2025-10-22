import { albums, currentAlbum, loadFromLocalStorage, syncFromGist, saveToGist, createAlbum, setCurrentAlbum } from './album-core.js';

// Select an album and render its photos
function selectAlbum(idx) {
    if (typeof idx !== 'number' || idx < 0 || idx >= albums.length) {
        uploadSection.style.display = 'none';
        gallerySection.style.display = 'none';
        setCurrentAlbum(null);
        albumTitle.textContent = '';
        photoCount.textContent = '';
        photoGrid.innerHTML = '';
        return;
    }
    setCurrentAlbum(idx);
    albumTitle.textContent = currentAlbum.name;
    photoCount.textContent = `${currentAlbum.photos.length} photos`;
    uploadSection.style.display = '';
    gallerySection.style.display = '';
    // Render photos
    photoGrid.innerHTML = '';
    if (currentAlbum.photos && currentAlbum.photos.length > 0) {
        currentAlbum.photos.forEach((photo, photoIdx) => {
            const container = document.createElement('div');
            container.className = 'photo-thumb-container';

            const img = document.createElement('img');
            img.src = photo.url;
            img.alt = photo.name || '';
            img.className = 'photo-thumb';
            img.style.maxWidth = '160px';
            img.style.maxHeight = '160px';
            img.style.objectFit = 'cover';
            img.addEventListener('click', function () {
                lightboxImg.src = photo.url;
                lightboxImg.alt = photo.name || '';
                lightboxCaption.textContent = photo.name || '';
                lightbox.classList.add('show');
            });

            // Delete button
            const delBtn = document.createElement('button');
            delBtn.textContent = '🗑️';
            delBtn.title = 'Delete photo';
            delBtn.className = 'delete-photo-btn';
            delBtn.style.marginLeft = '4px';
            delBtn.style.cursor = 'pointer';
            delBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                if (confirm('Delete this photo?')) {
                    currentAlbum.photos.splice(photoIdx, 1);
                    localStorage.setItem('photoAlbums', JSON.stringify(albums));
                    saveToGist();
                    selectAlbum(albums.indexOf(currentAlbum));
                    showNotification('Photo deleted.', 'success');
                }
            });

            container.appendChild(img);
            container.appendChild(delBtn);
            photoGrid.appendChild(container);
        });
    } else {
        const emptyMsg = document.createElement('div');
        emptyMsg.textContent = 'No photos in this album yet.';
        emptyMsg.className = 'empty-msg';
        photoGrid.appendChild(emptyMsg);
    }
}

// Render the album list in the dropdown and update UI
function renderAlbumList() {
    if (!albumSelect) return;
    // Clear existing options
    albumSelect.innerHTML = '';
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select an album';
    albumSelect.appendChild(defaultOption);
    // Add albums
    albums.forEach((album, idx) => {
        const option = document.createElement('option');
        option.value = idx;
        option.textContent = album.name;
        albumSelect.appendChild(option);
    });
    // Optionally, update other UI elements if needed
}

// Setup event listeners
function setupEventListeners() {
    // Album selection
    albumSelect.addEventListener('change', function () {
        if (this.value !== '') {
            selectAlbum(parseInt(this.value));
        } else {
            uploadSection.style.display = 'none';
            gallerySection.style.display = 'none';
            setCurrentAlbum(null);
        }
    });

    // New album button
    newAlbumBtn.addEventListener('click', function () {
        newAlbumModal.classList.add('show');
        newAlbumName.focus();
    });

    // Create album
    createAlbumBtn.addEventListener('click', createAlbum);
    newAlbumName.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') createAlbum();
    });

    // Close modal
    const closeModal = newAlbumModal.querySelector('.close');
    closeModal.addEventListener('click', function () {
        newAlbumModal.classList.remove('show');
        newAlbumName.value = '';
    });

    // Upload area interactions
    uploadArea.addEventListener('click', function () {
        fileInput.click();
    });

    uploadArea.addEventListener('dragover', function (e) {
        e.preventDefault();
        this.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function () {
        this.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function (e) {
        e.preventDefault();
        this.classList.remove('dragover');
        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    fileInput.addEventListener('change', function () {
        handleFiles(this.files);
    });

    // Lightbox close
    const closeLightboxBtn = document.querySelector('.close-lightbox');
    closeLightboxBtn.addEventListener('click', function () {
        lightbox.classList.remove('show');
    });

    lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) {
            lightbox.classList.remove('show');
        }
    });
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

// Photo Album App with GitHub Gist Sync
// Albums automatically sync across ALL devices via GitHub Gist!

// Configuration will be loaded from config.js and config.local.js
// Don't hardcode credentials here!

// Current user (from session)
const CURRENT_USER = sessionStorage.getItem('photoAlbumUser') || 'photos';

// Album data
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
document.addEventListener('DOMContentLoaded', async function () {
    const downloadBtn = document.getElementById('downloadAlbumBtn');
    downloadBtn.addEventListener('click', async function () {
        if (!currentAlbum || !currentAlbum.photos || currentAlbum.photos.length === 0) {
            showNotification('No photos to download in this album.', 'warning');
            return;
        }
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '⬇️ Preparing...';
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

    if (!window.CONFIG || window.window.CONFIG.GITHUB_TOKEN === 'YOUR_GITHUB_TOKEN_HERE') {
        showNotification('⚠️ GitHub sync not configured yet - using local storage only', 'warning');
        loadFromLocalStorage(renderAlbumList);
        setupEventListeners();
        return;
    }

    showNotification('📥 Syncing albums from cloud...', 'info');
    await syncFromGist(window.CONFIG, showNotification, renderAlbumList);
    setupEventListeners();
});

// Use loadFromLocalStorage from album-core.js

// Use syncFromGist from album-core.js

// Use saveToGist from album-core.js

// Everything else (renderAlbumList, setupEventListeners, uploadToCloudinary, etc.) remains unchanged...
