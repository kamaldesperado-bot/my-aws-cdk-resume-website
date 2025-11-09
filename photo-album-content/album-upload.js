// album-upload.js
// Handles photo upload logic for the photo album app using Cloudinary

import { saveToGist } from './album-core.js';

export async function handleFiles(files, currentAlbum, albums, showNotification, selectAlbum, uploadProgress, progressList) {
    if (!currentAlbum) {
        showNotification('Please select an album before uploading photos.', 'warning');
        return;
    }
    if (!files || files.length === 0) {
        showNotification('No files selected for upload.', 'warning');
        return;
    }

    // Show upload progress
    if (uploadProgress) uploadProgress.style.display = '';
    if (progressList) progressList.innerHTML = '';

    let added = 0;
    let failed = 0;
    const total = files.length;
    const fileArr = Array.from(files);
    const progressItems = fileArr.map(file => {
        const item = document.createElement('div');
        item.className = 'progress-item';
        item.innerHTML = `
            <div class="progress-item-header">
                <span class="progress-item-name">${file.name}</span>
                <span class="progress-item-status uploading">0%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-bar-fill" style="width: 0%"></div>
            </div>
        `;
        if (progressList) progressList.appendChild(item);
        return item;
    });

    let progressHeader = uploadProgress ? uploadProgress.querySelector('h3') : null;
    if (!progressHeader && uploadProgress) {
        progressHeader = document.createElement('h3');
        progressHeader.textContent = 'Uploading...';
        uploadProgress.prepend(progressHeader);
    }
    if (progressHeader) progressHeader.textContent = `Uploading... (0/${total})`;

    const newPhotos = [];

    for (let i = 0; i < total; i++) {
        const file = fileArr[i];
        const progressItem = progressItems[i];
        const statusEl = progressItem.querySelector('.progress-item-status');
        const fillEl = progressItem.querySelector('.progress-bar-fill');

        if (!file.type.startsWith('image/')) {
            statusEl.textContent = '❌ Not an image';
            progressItem.classList.add('error');
            failed++;
            if (progressHeader) progressHeader.textContent = `Uploading... (${i + 1}/${total})`;
            continue;
        }

        try {
            // Upload to Cloudinary
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', window.CONFIG.CLOUDINARY_UPLOAD_PRESET);
            const cloudName = window.CONFIG.CLOUDINARY_CLOUD_NAME;
            const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
            const uploadRes = await fetch(url, {
                method: 'POST',
                body: formData
            });
            if (!uploadRes.ok) throw new Error('Cloudinary upload failed');
            const data = await uploadRes.json();
            newPhotos.push({
                url: data.secure_url,
                name: file.name,
                date: new Date().toLocaleDateString()
            });
            statusEl.textContent = '✅ Uploaded';
            fillEl.style.width = '100%';
            progressItem.classList.add('success');
            added++;
        } catch (err) {
            statusEl.textContent = '❌ Error';
            fillEl.style.width = '0%';
            progressItem.classList.add('error');
            failed++;
        }
        if (progressHeader) progressHeader.textContent = `Uploading... (${i + 1}/${total})`;
    }

    if (newPhotos.length > 0) {
        currentAlbum.photos.push(...newPhotos);
        localStorage.setItem('photoAlbums', JSON.stringify(albums));

        // Sync to GitHub Gist if configured
        if (window.CONFIG && window.CONFIG.GITHUB_TOKEN && window.CONFIG.GIST_ID &&
            window.CONFIG.GITHUB_TOKEN !== 'YOUR_GITHUB_TOKEN_HERE' &&
            window.CONFIG.GIST_ID !== 'YOUR_GIST_ID_HERE') {
            const CURRENT_USER = sessionStorage.getItem('photoAlbumUser') || 'photos';
            saveToGist(window.CONFIG, showNotification, CURRENT_USER);
        }

        selectAlbum(albums.indexOf(currentAlbum));
    }
    setTimeout(() => {
        if (uploadProgress) uploadProgress.style.display = 'none';
    }, 800);
    showNotification(`✅ Uploaded ${added} photo(s), ${failed} failed.`, 'success');
}
