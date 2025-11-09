// album-analysis.js
// AI-powered album analysis for detecting duplicates, blurry images, and low quality photos

import { albums, currentAlbum, setCurrentAlbum } from './album-core.js';
import { saveToGist } from './album-core.js';

// Analysis state
let analysisResults = {
    duplicates: [],
    blurry: [],
    lowQuality: [],
    selectedForDeletion: new Set()
};

// ========================= PERCEPTUAL HASH (pHash) =========================
// Enhanced pHash for better duplicate detection using 16x16 hash
async function calculatePerceptualHash(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            try {
                // Create canvas and resize image to 16x16 for better accuracy
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const hashSize = 16; // Increased from 8 for better accuracy
                canvas.width = hashSize;
                canvas.height = hashSize;

                // Draw image in grayscale
                ctx.drawImage(img, 0, 0, hashSize, hashSize);
                const imageData = ctx.getImageData(0, 0, hashSize, hashSize);
                const data = imageData.data;

                // Convert to grayscale and calculate average
                let sum = 0;
                const grayscale = [];
                for (let i = 0; i < data.length; i += 4) {
                    // Use proper grayscale conversion weights
                    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                    grayscale.push(gray);
                    sum += gray;
                }
                const average = sum / grayscale.length;

                // Generate hash: 1 if above average, 0 if below
                let hash = '';
                for (let val of grayscale) {
                    hash += val >= average ? '1' : '0';
                }

                // Also calculate a color histogram hash for better detection
                const colorHash = calculateColorHistogram(data);

                resolve({ hash, colorHash, size: hashSize });
            } catch (err) {
                reject(err);
            }
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageUrl;
    });
}

// Calculate color histogram for additional comparison
function calculateColorHistogram(data) {
    const bins = 16; // 16 bins per channel
    const histogram = { r: new Array(bins).fill(0), g: new Array(bins).fill(0), b: new Array(bins).fill(0) };

    for (let i = 0; i < data.length; i += 4) {
        const rBin = Math.floor((data[i] / 256) * bins);
        const gBin = Math.floor((data[i + 1] / 256) * bins);
        const bBin = Math.floor((data[i + 2] / 256) * bins);

        histogram.r[Math.min(rBin, bins - 1)]++;
        histogram.g[Math.min(gBin, bins - 1)]++;
        histogram.b[Math.min(bBin, bins - 1)]++;
    }

    // Normalize histogram
    const total = data.length / 4;
    for (let i = 0; i < bins; i++) {
        histogram.r[i] /= total;
        histogram.g[i] /= total;
        histogram.b[i] /= total;
    }

    return histogram;
}

// Compare two histograms using correlation
function compareHistograms(hist1, hist2) {
    let correlation = 0;
    const channels = ['r', 'g', 'b'];

    for (const channel of channels) {
        let sum1 = 0, sum2 = 0, sum12 = 0;
        let sumSq1 = 0, sumSq2 = 0;

        for (let i = 0; i < hist1[channel].length; i++) {
            const val1 = hist1[channel][i];
            const val2 = hist2[channel][i];

            sum1 += val1;
            sum2 += val2;
            sum12 += val1 * val2;
            sumSq1 += val1 * val1;
            sumSq2 += val2 * val2;
        }

        const n = hist1[channel].length;
        const numerator = n * sum12 - sum1 * sum2;
        const denominator = Math.sqrt((n * sumSq1 - sum1 * sum1) * (n * sumSq2 - sum2 * sum2));

        if (denominator !== 0) {
            correlation += numerator / denominator;
        }
    }

    return correlation / channels.length; // Average correlation across channels
}

// Calculate Hamming distance between two hashes
function hammingDistance(hash1, hash2) {
    if (hash1.length !== hash2.length) return Infinity;
    let distance = 0;
    for (let i = 0; i < hash1.length; i++) {
        if (hash1[i] !== hash2[i]) distance++;
    }
    return distance;
}

// ========================= BLUR DETECTION =========================
// Detect blur using Laplacian variance
async function detectBlur(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Use smaller size for faster processing
                const size = 200;
                canvas.width = size;
                canvas.height = size;

                ctx.drawImage(img, 0, 0, size, size);
                const imageData = ctx.getImageData(0, 0, size, size);
                const data = imageData.data;

                // Convert to grayscale
                const grayscale = [];
                for (let i = 0; i < data.length; i += 4) {
                    grayscale.push((data[i] + data[i + 1] + data[i + 2]) / 3);
                }

                // Calculate Laplacian variance (measure of sharpness)
                let variance = 0;
                const width = size;
                const kernel = [0, 1, 0, 1, -4, 1, 0, 1, 0]; // Laplacian kernel

                for (let y = 1; y < size - 1; y++) {
                    for (let x = 1; x < width - 1; x++) {
                        let sum = 0;
                        for (let ky = -1; ky <= 1; ky++) {
                            for (let kx = -1; kx <= 1; kx++) {
                                const idx = (y + ky) * width + (x + kx);
                                const kernelIdx = (ky + 1) * 3 + (kx + 1);
                                sum += grayscale[idx] * kernel[kernelIdx];
                            }
                        }
                        variance += sum * sum;
                    }
                }

                variance = variance / ((size - 2) * (size - 2));

                // Lower variance = more blur
                // Threshold: < 100 is blurry
                resolve({
                    variance: variance,
                    isBlurry: variance < 100
                });
            } catch (err) {
                reject(err);
            }
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageUrl;
    });
}

// ========================= QUALITY ANALYSIS =========================
async function analyzeQuality(photo) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            const width = img.naturalWidth;
            const height = img.naturalHeight;
            const megapixels = (width * height) / 1000000;

            // Quality criteria
            const isLowResolution = megapixels < 0.5; // Less than 0.5 MP
            const hasWeirdAspectRatio = Math.max(width, height) / Math.min(width, height) > 3;

            resolve({
                width,
                height,
                megapixels,
                isLowQuality: isLowResolution || hasWeirdAspectRatio,
                reason: isLowResolution ? 'Low resolution' : hasWeirdAspectRatio ? 'Unusual aspect ratio' : null
            });
        };

        img.onerror = () => resolve({
            isLowQuality: false,
            reason: 'Could not analyze'
        });

        img.src = photo.url;
    });
}

// ========================= MAIN ANALYSIS FUNCTION =========================
export async function analyzeAlbum(album, progressCallback) {
    if (!album || !album.photos || album.photos.length === 0) {
        throw new Error('Album is empty or not selected');
    }

    // Reset results
    analysisResults = {
        duplicates: [],
        blurry: [],
        lowQuality: [],
        selectedForDeletion: new Set()
    };

    const photos = album.photos;
    const total = photos.length;
    let processed = 0;

    // Step 1: Calculate hashes for all photos
    if (progressCallback) progressCallback('Calculating image hashes...', 0);

    const photoHashes = [];
    for (let i = 0; i < photos.length; i++) {
        try {
            const hashData = await calculatePerceptualHash(photos[i].url);
            photoHashes.push({ photo: photos[i], index: i, hashData });
        } catch (err) {
            console.error('Error hashing image:', photos[i].name, err);
            photoHashes.push({ photo: photos[i], index: i, hashData: null });
        }
        processed++;
        if (progressCallback) progressCallback('Calculating hashes...', (processed / total) * 33);
    }

    // Step 2: Find duplicates using both perceptual hash and color histogram
    if (progressCallback) progressCallback('Detecting duplicates...', 33);

    const duplicateGroups = [];
    const checked = new Set();

    for (let i = 0; i < photoHashes.length; i++) {
        if (checked.has(i) || !photoHashes[i].hashData) continue;

        const group = [photoHashes[i]];
        checked.add(i);

        for (let j = i + 1; j < photoHashes.length; j++) {
            if (checked.has(j) || !photoHashes[j].hashData) continue;

            // Calculate Hamming distance for perceptual hash
            const distance = hammingDistance(photoHashes[i].hashData.hash, photoHashes[j].hashData.hash);

            // Calculate color histogram similarity
            const colorSimilarity = compareHistograms(
                photoHashes[i].hashData.colorHash,
                photoHashes[j].hashData.colorHash
            );

            // Consider images duplicates if:
            // - Perceptual hash distance <= 15 (was 5, now more lenient for 16x16)
            // - AND color histogram similarity > 0.85 (85% similar)
            // This catches exact duplicates and very similar images
            const maxHashDistance = photoHashes[i].hashData.size * photoHashes[i].hashData.size * 0.06; // 6% difference allowed

            if (distance <= maxHashDistance && colorSimilarity > 0.85) {
                group.push(photoHashes[j]);
                checked.add(j);
                console.log(`Found duplicate: ${photos[i].name} <-> ${photos[j].name} (hash distance: ${distance}, color sim: ${colorSimilarity.toFixed(2)})`);
            }
        }

        if (group.length > 1) {
            duplicateGroups.push(group);
        }
    }

    analysisResults.duplicates = duplicateGroups;

    // Step 3: Detect blurry images
    if (progressCallback) progressCallback('Detecting blurry images...', 50);

    processed = 0;
    for (let i = 0; i < photos.length; i++) {
        try {
            const blurResult = await detectBlur(photos[i].url);
            if (blurResult.isBlurry) {
                analysisResults.blurry.push({
                    photo: photos[i],
                    index: i,
                    variance: blurResult.variance
                });
            }
        } catch (err) {
            console.error('Error detecting blur:', photos[i].name, err);
        }
        processed++;
        if (progressCallback) progressCallback('Detecting blur...', 50 + (processed / total) * 25);
    }

    // Step 4: Analyze quality
    if (progressCallback) progressCallback('Analyzing quality...', 75);

    processed = 0;
    for (let i = 0; i < photos.length; i++) {
        try {
            const qualityResult = await analyzeQuality(photos[i]);
            if (qualityResult.isLowQuality) {
                analysisResults.lowQuality.push({
                    photo: photos[i],
                    index: i,
                    ...qualityResult
                });
            }
        } catch (err) {
            console.error('Error analyzing quality:', photos[i].name, err);
        }
        processed++;
        if (progressCallback) progressCallback('Analyzing quality...', 75 + (processed / total) * 25);
    }

    if (progressCallback) progressCallback('Analysis complete!', 100);

    return analysisResults;
}

// ========================= UI FUNCTIONS =========================
export function displayAnalysisResults(results, album) {
    const analysisResults = document.getElementById('analysisResults');
    const analysisProgress = document.getElementById('analysisProgress');
    const issuesList = document.getElementById('issuesList');

    analysisProgress.style.display = 'none';
    analysisResults.style.display = 'block';

    // Update summary counts
    const totalDuplicates = results.duplicates.reduce((sum, group) => sum + group.length - 1, 0);
    document.getElementById('duplicatesCount').textContent = totalDuplicates;
    document.getElementById('blurryCount').textContent = results.blurry.length;
    document.getElementById('lowQualityCount').textContent = results.lowQuality.length;
    document.getElementById('totalIssuesCount').textContent = totalDuplicates + results.blurry.length + results.lowQuality.length;

    // Clear previous results
    issuesList.innerHTML = '';
    results.selectedForDeletion.clear();
    updateSelectedCount();

    // Display duplicates
    if (results.duplicates.length > 0) {
        const section = document.createElement('div');
        section.className = 'issue-section';
        section.innerHTML = '<h3>🔄 Duplicate Images</h3>';

        results.duplicates.forEach((group, groupIdx) => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'duplicate-group';
            groupDiv.innerHTML = `<h4>Duplicate Set ${groupIdx + 1} (${group.length} images)</h4>`;

            const gridDiv = document.createElement('div');
            gridDiv.className = 'issue-grid';

            group.forEach((item, idx) => {
                const card = createIssueCard(item.photo, item.index, 'duplicate', idx > 0); // Keep first, suggest delete others
                gridDiv.appendChild(card);
            });

            groupDiv.appendChild(gridDiv);
            section.appendChild(groupDiv);
        });

        issuesList.appendChild(section);
    }

    // Display blurry images
    if (results.blurry.length > 0) {
        const section = document.createElement('div');
        section.className = 'issue-section';
        section.innerHTML = '<h3>😵 Blurry Images</h3>';

        const gridDiv = document.createElement('div');
        gridDiv.className = 'issue-grid';

        results.blurry.forEach(item => {
            const card = createIssueCard(item.photo, item.index, 'blurry', true, `Blur score: ${item.variance.toFixed(1)}`);
            gridDiv.appendChild(card);
        });

        section.appendChild(gridDiv);
        issuesList.appendChild(section);
    }

    // Display low quality images
    if (results.lowQuality.length > 0) {
        const section = document.createElement('div');
        section.className = 'issue-section';
        section.innerHTML = '<h3>⚠️ Low Quality Images</h3>';

        const gridDiv = document.createElement('div');
        gridDiv.className = 'issue-grid';

        results.lowQuality.forEach(item => {
            const card = createIssueCard(item.photo, item.index, 'lowquality', true, item.reason);
            gridDiv.appendChild(card);
        });

        section.appendChild(gridDiv);
        issuesList.appendChild(section);
    }

    // Show message if no issues found
    if (totalDuplicates === 0 && results.blurry.length === 0 && results.lowQuality.length === 0) {
        issuesList.innerHTML = '<div class="no-issues">✅ No issues found! Your album is in great shape.</div>';
    }
}

function createIssueCard(photo, index, type, autoSelect = false, extraInfo = '') {
    const card = document.createElement('div');
    card.className = 'issue-card';
    card.dataset.photoIndex = index;
    card.dataset.issueType = type;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'issue-checkbox';
    checkbox.checked = autoSelect;
    if (autoSelect) {
        analysisResults.selectedForDeletion.add(index);
    }

    checkbox.addEventListener('change', function () {
        if (this.checked) {
            analysisResults.selectedForDeletion.add(index);
            card.classList.add('selected');
        } else {
            analysisResults.selectedForDeletion.delete(index);
            card.classList.remove('selected');
        }
        updateSelectedCount();
    });

    const img = document.createElement('img');
    img.src = photo.url.replace('/upload/', '/upload/c_fill,w_200,h_200,q_auto,f_auto/');
    img.alt = photo.name;
    img.className = 'issue-thumbnail';

    const info = document.createElement('div');
    info.className = 'issue-info';
    info.innerHTML = `
        <div class="issue-name">${photo.name}</div>
        ${extraInfo ? `<div class="issue-detail">${extraInfo}</div>` : ''}
    `;

    card.appendChild(checkbox);
    card.appendChild(img);
    card.appendChild(info);

    if (autoSelect) {
        card.classList.add('selected');
    }

    return card;
}

function updateSelectedCount() {
    document.getElementById('selectedCount').textContent = analysisResults.selectedForDeletion.size;
    const bulkDeleteBtn = document.getElementById('bulkDeleteSelected');
    bulkDeleteBtn.disabled = analysisResults.selectedForDeletion.size === 0;
}

// ========================= EXPORT FOR USE IN APP =========================
export function initializeAnalysisUI() {
    const analyseBtn = document.getElementById('analyseAlbumBtn');
    const analysisModal = document.getElementById('analysisModal');
    const closeModalBtn = document.getElementById('closeAnalysisModal');
    const selectAllBtn = document.getElementById('selectAllIssues');
    const bulkDeleteBtn = document.getElementById('bulkDeleteSelected');

    if (!analyseBtn) return;

    analyseBtn.addEventListener('click', async function () {
        if (!currentAlbum || !currentAlbum.photos || currentAlbum.photos.length === 0) {
            alert('Please select an album with photos first');
            return;
        }

        // Show modal with progress
        analysisModal.classList.add('show');
        document.getElementById('analysisProgress').style.display = 'block';
        document.getElementById('analysisResults').style.display = 'none';

        const progressBar = document.getElementById('analysisProgressBar');
        const progressText = document.querySelector('.analysis-spinner');

        try {
            const results = await analyzeAlbum(currentAlbum, (message, percent) => {
                progressText.textContent = message;
                progressBar.style.width = `${percent}%`;
            });

            displayAnalysisResults(results, currentAlbum);
        } catch (err) {
            alert('Error analyzing album: ' + err.message);
            analysisModal.classList.remove('show');
        }
    });

    closeModalBtn.addEventListener('click', function () {
        analysisModal.classList.remove('show');
    });

    selectAllBtn.addEventListener('click', function () {
        const checkboxes = document.querySelectorAll('.issue-checkbox');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);

        checkboxes.forEach(cb => {
            cb.checked = !allChecked;
            const index = parseInt(cb.parentElement.dataset.photoIndex);
            if (!allChecked) {
                analysisResults.selectedForDeletion.add(index);
                cb.parentElement.classList.add('selected');
            } else {
                analysisResults.selectedForDeletion.delete(index);
                cb.parentElement.classList.remove('selected');
            }
        });

        updateSelectedCount();
        selectAllBtn.textContent = allChecked ? '✓ Select All Issues' : '✗ Deselect All';
    });

    bulkDeleteBtn.addEventListener('click', async function () {
        const count = analysisResults.selectedForDeletion.size;
        if (count === 0) return;

        if (!confirm(`Delete ${count} selected photo(s)? This action cannot be undone!`)) {
            return;
        }

        // Get indices in descending order to avoid index shifting issues
        const indicesToDelete = Array.from(analysisResults.selectedForDeletion).sort((a, b) => b - a);

        // Delete photos from album
        indicesToDelete.forEach(index => {
            currentAlbum.photos.splice(index, 1);
        });

        // Save to localStorage and sync to Gist
        localStorage.setItem('photoAlbums', JSON.stringify(albums));

        if (window.CONFIG && window.CONFIG.GITHUB_TOKEN && window.CONFIG.GIST_ID &&
            window.CONFIG.GITHUB_TOKEN !== 'YOUR_GITHUB_TOKEN_HERE' &&
            window.CONFIG.GIST_ID !== 'YOUR_GIST_ID_HERE') {
            const CURRENT_USER = sessionStorage.getItem('photoAlbumUser') || 'photos';
            try {
                await saveToGist(window.CONFIG, null, CURRENT_USER);
            } catch (err) {
                console.error('Failed to sync to Gist:', err);
            }
        }

        // Close modal and refresh gallery
        analysisModal.classList.remove('show');

        // Trigger a refresh of the gallery
        const albumIndex = albums.indexOf(currentAlbum);
        if (albumIndex >= 0) {
            const albumSelect = document.getElementById('albumSelect');
            if (albumSelect) {
                albumSelect.value = albumIndex;
                albumSelect.dispatchEvent(new Event('change'));
            }
        }

        // Show success message
        const notification = document.createElement('div');
        notification.className = 'notification notification-success';
        notification.textContent = `✅ Deleted ${count} photo(s) successfully!`;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAnalysisUI);
} else {
    initializeAnalysisUI();
}
