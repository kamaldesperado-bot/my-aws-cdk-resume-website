// album-upload.js
// Handles photo upload logic for the photo album app

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

    // Progress header
    let progressHeader = uploadProgress ? uploadProgress.querySelector('h3') : null;
    if (!progressHeader && uploadProgress) {
        progressHeader = document.createElement('h3');
        progressHeader.textContent = 'Uploading...';
        uploadProgress.prepend(progressHeader);
    }
    if (progressHeader) progressHeader.textContent = `Uploading... (0/${total})`;

    // Collect new photos first (no re-renders mid-loop!)
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
            const base64 = await readFileAsDataURLWithProgress(file, percent => {
                if (statusEl) statusEl.textContent = percent + '%';
                if (fillEl) fillEl.style.width = percent + '%';
            });
            newPhotos.push({
                url: base64,
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

    // ✅ Update album only once (after all uploads)
    if (newPhotos.length > 0) {
        currentAlbum.photos.push(...newPhotos);
        localStorage.setItem('photoAlbums', JSON.stringify(albums));
        selectAlbum(albums.indexOf(currentAlbum));
    }

    // Hide progress smoothly
    setTimeout(() => {
        if (uploadProgress) uploadProgress.style.display = 'none';
    }, 800);

    showNotification(`✅ Uploaded ${added} photo(s), ${failed} failed.`, 'success');
}

// --- Helper for async FileReader with progress ---
export function readFileAsDataURLWithProgress(file, onProgress) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.onprogress = e => {
            if (e.lengthComputable && typeof onProgress === 'function') {
                const percent = Math.round((e.loaded / e.total) * 100);
                onProgress(percent);
            }
        };
        reader.readAsDataURL(file);
    });
}
