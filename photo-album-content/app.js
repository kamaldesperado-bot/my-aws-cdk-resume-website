// Photo Album App - AWS Native
class PhotoAlbumApp {
    constructor() {
        this.apiUrl = window.CONFIG?.API_URL || 'https://cmimy7yauc.execute-api.eu-central-1.amazonaws.com/prod';
        this.photos = [];
        this.albums = [];
        this.currentView = 'grid';
        this.currentPhotoId = null;
        this.currentAlbumId = 'default';
        this.checkAuth();
        this.init();
    }

    checkAuth() {
        if (sessionStorage.getItem('photoAlbumAuth') !== 'true') {
            window.location.href = 'login.html';
            return;
        }
    }

    init() {
        this.setupEventListeners();
        this.loadPhotos();
        this.loadAlbums();
        this.updateUserInfo();
    }

    setupEventListeners() {
        const fileInput = document.getElementById('fileInput');
        const uploadBox = document.getElementById('uploadBox');

        // File input change
        fileInput.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files);
        });

        // Drag and drop
        uploadBox.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadBox.classList.add('dragover');
        });

        uploadBox.addEventListener('dragleave', () => {
            uploadBox.classList.remove('dragover');
        });

        uploadBox.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadBox.classList.remove('dragover');
            this.handleFileSelect(e.dataTransfer.files);
        });

        // View controls
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-view').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentView = e.target.dataset.view;
                this.renderPhotos();
            });
        });
    }

    async handleFileSelect(files) {
        const fileArray = Array.from(files);
        const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            this.showNotification('Please select image files only', 'error');
            return;
        }

        for (const file of imageFiles) {
            await this.uploadPhoto(file);
        }
    }

    async uploadPhoto(file) {
        try {
            this.showUploadProgress(true);
            
            // Get signed upload URL
            const response = await fetch(`${this.apiUrl}/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get upload URL');
            }

            const { uploadUrl, key } = await response.json();

            // Upload to S3
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type }
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload file');
            }

            // Add to photos array (simulate)
            const photo = {
                id: Date.now() + Math.random(),
                name: file.name,
                key: key,
                url: `https://d3li9uvhi7686q.cloudfront.net/images/${key}`,
                uploadDate: new Date().toISOString(),
                size: file.size
            };

            this.photos.unshift(photo);
            this.renderPhotos();
            this.showNotification('Photo uploaded successfully!', 'success');

        } catch (error) {
            console.error('Upload error:', error);
            this.showNotification('Upload failed: ' + error.message, 'error');
        } finally {
            this.showUploadProgress(false);
        }
    }

    showUploadProgress(show) {
        const progressDiv = document.getElementById('uploadProgress');
        const uploadBox = document.getElementById('uploadBox');
        
        if (show) {
            progressDiv.style.display = 'block';
            uploadBox.style.opacity = '0.5';
            // Simulate progress
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 30;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                }
                document.getElementById('progressFill').style.width = progress + '%';
                document.getElementById('progressText').textContent = `Uploading... ${Math.round(progress)}%`;
            }, 200);
        } else {
            progressDiv.style.display = 'none';
            uploadBox.style.opacity = '1';
            document.getElementById('progressFill').style.width = '0%';
        }
    }

    loadPhotos() {
        // Simulate loading photos (in real app, fetch from API/DynamoDB)
        this.photos = [
            {
                id: 1,
                name: 'Sample Photo 1',
                url: 'https://picsum.photos/400/300?random=1',
                uploadDate: new Date().toISOString(),
                size: 1024000
            },
            {
                id: 2,
                name: 'Sample Photo 2',
                url: 'https://picsum.photos/400/300?random=2',
                uploadDate: new Date().toISOString(),
                size: 2048000
            }
        ];
        this.renderPhotos();
    }

    loadAlbums() {
        // Simulate loading albums
        this.albums = [
            { id: 'default', name: 'Default Album', photoCount: this.photos.length }
        ];
        this.renderAlbums();
    }

    renderPhotos() {
        const photosGrid = document.getElementById('photosGrid');
        
        if (this.photos.length === 0) {
            photosGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📸</div>
                    <h3>No photos yet</h3>
                    <p>Upload your first photo to get started</p>
                </div>
            `;
            return;
        }

        const photosHtml = this.photos.map(photo => `
            <div class="photo-card" onclick="app.openPhoto('${photo.id}')">
                <div class="photo-actions">
                    <button class="btn-photo-delete" onclick="event.stopPropagation(); app.confirmDeletePhoto('${photo.id}')" title="Delete photo">×</button>
                </div>
                <img src="${photo.url}" alt="${photo.name}" loading="lazy">
                <div class="photo-info">
                    <h4>${photo.name}</h4>
                    <p>${this.formatDate(photo.uploadDate)} • ${this.formatFileSize(photo.size)}</p>
                </div>
            </div>
        `).join('');

        photosGrid.innerHTML = photosHtml;
    }

    renderAlbums() {
        const albumsGrid = document.getElementById('albumsGrid');
        
        const albumsHtml = this.albums.map(album => `
            <div class="album-card" onclick="app.openAlbum('${album.id}')">
                <div class="album-cover">📂</div>
                <h3>${album.name}</h3>
                <p>${album.photoCount} photos</p>
                ${album.id !== 'default' ? `
                    <div class="album-actions">
                        <button class="btn-album-delete" onclick="event.stopPropagation(); app.confirmDeleteAlbum('${album.id}')" title="Delete album">Delete</button>
                    </div>
                ` : ''}
            </div>
        `).join('');

        albumsGrid.innerHTML = albumsHtml;
    }

    openPhoto(photoId) {
        const photo = this.photos.find(p => p.id == photoId);
        if (!photo) return;

        this.currentPhotoId = photoId;
        const modal = document.getElementById('photoModal');
        const modalImage = document.getElementById('modalImage');
        const modalTitle = document.getElementById('modalTitle');
        const modalDate = document.getElementById('modalDate');

        modalImage.src = photo.url;
        modalTitle.textContent = photo.name;
        modalDate.textContent = `Uploaded ${this.formatDate(photo.uploadDate)}`;
        
        modal.style.display = 'flex';
    }

    openAlbum(albumId) {
        this.showNotification(`Opening album: ${albumId}`, 'info');
    }

    createAlbum() {
        const name = prompt('Enter album name:');
        if (name) {
            const album = {
                id: Date.now(),
                name: name,
                photoCount: 0
            };
            this.albums.push(album);
            this.renderAlbums();
            this.showNotification(`Album "${name}" created!`, 'success');
        }
    }

    updateUserInfo() {
        const userInfo = document.getElementById('userInfo');
        const username = sessionStorage.getItem('photoAlbumUser') || 'User';
        userInfo.innerHTML = `
            <span>👤 ${username}</span>
            <span>•</span>
            <span>📊 ${this.photos.length} photos</span>
            <span>•</span>
            <span>📁 ${this.albums.length} albums</span>
            <button class="btn-logout" onclick="logout()">Logout</button>
        `;
    }

    confirmDeletePhoto(photoId) {
        this.showConfirmDialog(
            'Delete Photo',
            'Are you sure you want to delete this photo? This action cannot be undone.',
            () => this.deletePhotoById(photoId)
        );
    }

    confirmDeleteAlbum(albumId) {
        const album = this.albums.find(a => a.id === albumId);
        this.showConfirmDialog(
            'Delete Album',
            `Are you sure you want to delete "${album.name}"? All photos in this album will be moved to the default album.`,
            () => this.deleteAlbumById(albumId)
        );
    }

    deletePhotoById(photoId) {
        this.photos = this.photos.filter(p => p.id != photoId);
        this.renderPhotos();
        this.updateUserInfo();
        this.closeModal();
        this.showNotification('Photo deleted successfully', 'success');
    }

    deleteAlbumById(albumId) {
        this.albums = this.albums.filter(a => a.id !== albumId);
        this.renderAlbums();
        this.updateUserInfo();
        this.showNotification('Album deleted successfully', 'success');
    }

    showConfirmDialog(title, message, onConfirm) {
        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.innerHTML = `
            <div class="confirm-content">
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="confirm-buttons">
                    <button class="btn-confirm cancel" onclick="this.closest('.confirm-dialog').remove()">Cancel</button>
                    <button class="btn-confirm danger" onclick="this.closest('.confirm-dialog').remove(); (${onConfirm.toString()})()">Delete</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    closeModal() {
        document.getElementById('photoModal').style.display = 'none';
        this.currentPhotoId = null;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Global functions
function closeModal() {
    app.closeModal();
}

function createAlbum() {
    app.createAlbum();
}

function openAlbum(albumId) {
    app.openAlbum(albumId);
}

function deletePhoto() {
    if (app.currentPhotoId) {
        app.confirmDeletePhoto(app.currentPhotoId);
    }
}

function logout() {
    sessionStorage.removeItem('photoAlbumAuth');
    sessionStorage.removeItem('photoAlbumUser');
    window.location.href = 'login.html';
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new PhotoAlbumApp();
});

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .notification button {
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
`;
document.head.appendChild(style);