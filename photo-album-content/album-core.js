// album-core.js
// Core logic for album data management, sync, and storage

export let albums = [];
export let currentAlbum = null;
// Setter for currentAlbum
export function setCurrentAlbum(idx) {
    if (typeof idx !== 'number' || idx < 0 || idx >= albums.length) {
        currentAlbum = null;
    } else {
        currentAlbum = albums[idx];
    }
}
let syncInProgress = false;

export function loadFromLocalStorage(renderAlbumList) {
    const localData = localStorage.getItem('photoAlbums');
    if (localData) {
        try {
            albums = JSON.parse(localData);
            if (renderAlbumList) renderAlbumList();
            console.log(`✅ Loaded ${albums.length} albums from local storage`);
        } catch (e) {
            console.error('Error parsing local albums:', e);
            albums = [];
        }
    }
}

export async function syncFromGist(CONFIG, showNotification, renderAlbumList) {
    if (syncInProgress) return;
    syncInProgress = true;
    try {
        loadFromLocalStorage(renderAlbumList);
        if (CONFIG.GIST_ID && CONFIG.GIST_ID !== 'YOUR_GIST_ID_HERE') {
            const response = await fetch(`https://api.github.com/gists/${CONFIG.GIST_ID}`, {
                headers: {
                    'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            if (response.ok) {
                const gist = await response.json();
                const file = gist.files && gist.files['photo-albums.json'];
                if (file) {
                    let fileContent = file.content;
                    if ((!fileContent || file.truncated) && file.raw_url) {
                        const rawResponse = await fetch(file.raw_url);
                        if (rawResponse.ok) {
                            fileContent = await rawResponse.text();
                        }
                    }
                    if (fileContent) {
                        try {
                            const data = JSON.parse(fileContent);
                            albums = data.albums || [];
                            localStorage.setItem('photoAlbums', JSON.stringify(albums));
                            if (renderAlbumList) renderAlbumList();
                            if (showNotification) showNotification(`✅ Synced ${albums.length} albums from cloud`, 'success');
                        } catch (e) {
                            if (showNotification) showNotification('⚠️ Error parsing JSON from Gist. Using local data.', 'warning');
                            loadFromLocalStorage(renderAlbumList);
                        }
                    } else {
                        if (showNotification) showNotification("Gist found, but 'photo-albums.json' file is missing or empty. Using local albums.", 'warning');
                        loadFromLocalStorage(renderAlbumList);
                    }
                } else {
                    if (showNotification) showNotification("⚠️ 'photo-albums.json' not found in Gist. Using local albums.", 'warning');
                    loadFromLocalStorage(renderAlbumList);
                }
            } else {
                if (showNotification) showNotification('Using local albums - will create cloud backup on first save', 'info');
            }
        }
    } catch (error) {
        if (showNotification) showNotification('⚠️ Using offline mode', 'warning');
    } finally {
        syncInProgress = false;
    }
}

export async function saveToGist(CONFIG, showNotification, CURRENT_USER) {
    if (!CONFIG || CONFIG.GITHUB_TOKEN === 'YOUR_GITHUB_TOKEN_HERE') {
        localStorage.setItem('photoAlbums', JSON.stringify(albums));
        return;
    }
    try {
        localStorage.setItem('photoAlbums', JSON.stringify(albums));
        const data = {
            albums: albums,
            lastUpdated: new Date().toISOString(),
            user: CURRENT_USER
        };
        const gistData = {
            description: 'Photo Album Data - Auto-synced',
            public: false,
            files: {
                'photo-albums.json': {
                    content: JSON.stringify(data, null, 2)
                }
            }
        };
        let response;
        if (CONFIG.GIST_ID && CONFIG.GIST_ID !== 'YOUR_GIST_ID_HERE') {
            response = await fetch(`https://api.github.com/gists/${CONFIG.GIST_ID}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gistData)
            });
        } else {
            response = await fetch('https://api.github.com/gists', {
                method: 'POST',
                headers: {
                    'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gistData)
            });
            if (response.ok && showNotification) {
                const newGist = await response.json();
                showNotification(`✅ Cloud backup created! Gist ID: ${newGist.id}`, 'success');
            }
        }
        if (response.ok) {
            // Success
        } else {
            throw new Error(`Gist save failed: ${response.status}`);
        }
    } catch (error) {
        if (showNotification) showNotification('⚠️ Could not sync to cloud - saved locally', 'warning');
    }
}

export function createAlbum(name, CURRENT_USER, showNotification, saveToGist, renderAlbumList, newAlbumModal, newAlbumName) {
    name = name.trim();
    if (!name) {
        if (showNotification) showNotification('Album name cannot be empty.', 'warning');
        return;
    }
    if (albums.some(a => a.name === name)) {
        if (showNotification) showNotification('An album with this name already exists.', 'warning');
        return;
    }
    const newAlbum = {
        name: name,
        photos: [],
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        user: CURRENT_USER
    };
    albums.push(newAlbum);
    localStorage.setItem('photoAlbums', JSON.stringify(albums));
    if (saveToGist) saveToGist();
    if (renderAlbumList) renderAlbumList();
    if (newAlbumModal) newAlbumModal.classList.remove('show');
    if (newAlbumName) newAlbumName.value = '';
    if (showNotification) showNotification('✅ Album created!', 'success');
}
