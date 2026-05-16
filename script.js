const FAVORITES_STORAGE_KEY = 'musicweb_favorites_v1';
const PLAYLISTS_STORAGE_KEY = 'musicweb_playlists_v1';
const PLAYER_STATE_KEY = 'musicweb_player_v1';
const GRADIENTS = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
];

const TRACKS_CATALOG = [
    { id: 'midnight-dreams-luna-echo', title: 'Midnight Dreams', artist: 'Luna Echo', album: 'Trending Now', duration: 204, gradient: GRADIENTS[0] },
    { id: 'sunset-memories-golden-hour', title: 'Sunset Memories', artist: 'Golden Hour', album: 'Trending Now', duration: 252, gradient: GRADIENTS[1] },
    { id: 'electric-paradise-neon-lights', title: 'Electric Paradise', artist: 'Neon Lights', album: 'Trending Now', duration: 225, gradient: GRADIENTS[2] },
    { id: 'ocean-waves-blue-horizon', title: 'Ocean Waves', artist: 'Blue Horizon', album: 'Trending Now', duration: 303, gradient: GRADIENTS[3] },
    { id: 'starlight-journey-cosmic-vibes', title: 'Starlight Journey', artist: 'Cosmic Vibes', album: 'Trending Now', duration: 268, gradient: GRADIENTS[4] },
    { id: 'crystal-drive-echo-pulse', title: 'Crystal Drive', artist: 'Echo Pulse', album: "Editor's Picks", duration: 198, gradient: GRADIENTS[0] },
    { id: 'city-skyline-nova-bloom', title: 'City Skyline', artist: 'Nova Bloom', album: "Editor's Picks", duration: 242, gradient: GRADIENTS[1] },
    { id: 'moonlight-cafe-amber-keys', title: 'Moonlight Cafe', artist: 'Amber Keys', album: "Editor's Picks", duration: 224, gradient: GRADIENTS[2] },
    { id: 'neon-nights-synthwave-collective', title: 'Neon Nights', artist: 'Synthwave Collective', album: 'Neon Nights', duration: 202, gradient: GRADIENTS[3] },
    { id: 'urban-pulse-city-lights', title: 'Urban Pulse', artist: 'City Lights', album: 'Urban Pulse', duration: 231, gradient: GRADIENTS[4] },
    { id: 'cosmic-waves-space-echo', title: 'Cosmic Waves', artist: 'Space Echo', album: 'Cosmic Waves', duration: 258, gradient: GRADIENTS[0] },
    { id: 'golden-hour-sunset-dreams', title: 'Golden Hour', artist: 'Sunset Dreams', album: 'Golden Hour', duration: 215, gradient: GRADIENTS[1] },
    { id: 'velvet-sky-aurora-dreams', title: 'Velvet Sky', artist: 'Aurora Dreams', album: 'Night Sessions', duration: 237, gradient: GRADIENTS[2] },
    { id: 'digital-rain-pixel-flow', title: 'Digital Rain', artist: 'Pixel Flow', album: 'Digital Dreams', duration: 189, gradient: GRADIENTS[3] },
    { id: 'autumn-echo-harvest-moon', title: 'Autumn Echo', artist: 'Harvest Moon', album: 'Seasons', duration: 275, gradient: GRADIENTS[4] }
];

document.addEventListener('DOMContentLoaded', () => {
    const navItems = Array.from(document.querySelectorAll('.nav-item'));
    const searchInput = document.getElementById('music-search-input');
    const searchBtn = document.getElementById('music-search-btn');
    const searchResults = document.getElementById('search-results');
    const createPlaylistBtn = document.getElementById('create-playlist-btn');
    const playlistsContainer = document.querySelector('.playlists-container');

    const player = {
        title: document.getElementById('now-playing-title'),
        subtitle: document.getElementById('now-playing-subtitle'),
        art: document.getElementById('player-art'),
        playPauseBtn: document.getElementById('play-pause-btn'),
        prevBtn: document.getElementById('prev-track-btn'),
        nextBtn: document.getElementById('next-track-btn'),
        favoriteBtn: document.getElementById('favorite-track-btn'),
        progressBar: document.getElementById('progress-bar'),
        currentTime: document.getElementById('current-time'),
        totalTime: document.getElementById('total-time'),
        volumeControl: document.getElementById('volume-control')
    };

    const tracks = buildTrackLibrary();
    let favorites = new Set(loadFavorites());
    let isPlaying = false;
    let intervalId = null;

    const savedState = loadPlayerState();
    let trackIndex = (savedState && savedState.trackIndex < tracks.length) ? savedState.trackIndex : 0;
    let elapsedSeconds = savedState ? savedState.elapsedSeconds : 0;
    let volume = savedState ? savedState.volume : 80;

    initNavigation();
    initSearch();
    initFavoritesButtons();
    initPlaylists();
    initPlayer();
    initSettingsInteractions();
    initReportStats();
    attachRippleEffect();
    renderFavorites();
    renderPlayer();

    window.addEventListener('beforeunload', savePlayerState);

    function buildTrackLibrary() {
        const catalog = TRACKS_CATALOG.map(t => ({ ...t }));

        // Supplement with any DOM tracks not already in catalog
        const domTracks = [
            ...Array.from(document.querySelectorAll('.track-list .track-item')).map((item, index) => ({
                id: `dom-${(item.querySelector('.track-name')?.textContent?.trim() || `track-${index}`).toLowerCase().replace(/\s+/g, '-')}`,
                title: item.querySelector('.track-name')?.textContent?.trim() || `Track ${index + 1}`,
                artist: item.querySelector('.artist-name')?.textContent?.trim() || 'Unknown Artist',
                album: 'Collection',
                duration: parseDuration(item.querySelector('.duration')?.textContent || '3:00'),
                gradient: GRADIENTS[index % GRADIENTS.length]
            })),
            ...Array.from(document.querySelectorAll('.album-card')).map((card, index) => ({
                id: `dom-${(card.querySelector('h4')?.textContent?.trim() || `album-${index}`).toLowerCase().replace(/\s+/g, '-')}`,
                title: card.querySelector('h4')?.textContent?.trim() || `Album ${index + 1}`,
                artist: card.querySelector('p')?.textContent?.trim() || 'Unknown Artist',
                album: card.querySelector('h4')?.textContent?.trim() || 'New Release',
                duration: 180 + (index + 1) * 22,
                gradient: card.querySelector('.album-art')?.style.background || GRADIENTS[index % GRADIENTS.length]
            }))
        ];

        domTracks.forEach(domTrack => {
            const exists = catalog.some(t => t.title.toLowerCase() === domTrack.title.toLowerCase());
            if (!exists) {
                catalog.push(domTrack);
            }
        });

        return catalog;
    }

    function initNavigation() {
        const currentPage = document.body.dataset.page || 'home';
        navItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-page') === currentPage);
        });

        document.addEventListener('keydown', event => {
            if (isTypingTarget(event.target)) {
                return;
            }

            const currentIndex = navItems.findIndex(nav => nav.getAttribute('data-page') === currentPage);

            if (event.key === 'ArrowRight' && event.altKey) {
                event.preventDefault();
                const next = navItems[(currentIndex + 1) % navItems.length];
                if (next) { window.location.href = next.href; }
            } else if (event.key === 'ArrowLeft' && event.altKey) {
                event.preventDefault();
                const prev = navItems[(currentIndex - 1 + navItems.length) % navItems.length];
                if (prev) { window.location.href = prev.href; }
            } else if (event.code === 'Space') {
                event.preventDefault();
                togglePlayPause();
            } else if (event.key.toLowerCase() === 'n') {
                playRelativeTrack(1);
            } else if (event.key.toLowerCase() === 'p') {
                playRelativeTrack(-1);
            } else if (event.key.toLowerCase() === 'f') {
                toggleFavorite();
                renderFavorites();
            }
        });
    }

    function initSearch() {
        const performSearch = () => {
            const query = (searchInput?.value || '').trim().toLowerCase();
            if (!searchResults || !searchInput) {
                return;
            }

            if (!query) {
                searchResults.innerHTML = '';
                searchResults.classList.remove('show');
                return;
            }

            const filtered = tracks.filter(track =>
                track.title.toLowerCase().includes(query) ||
                track.artist.toLowerCase().includes(query) ||
                track.album.toLowerCase().includes(query)
            );

            if (!filtered.length) {
                searchResults.innerHTML = '<p class="empty-state">No matching songs found.</p>';
                searchResults.classList.add('show');
                return;
            }

            searchResults.innerHTML = filtered.slice(0, 8).map((track, index) => `
                <button type="button" class="search-result-item" data-track-id="${track.id}">
                    <span class="search-result-index">${index + 1}</span>
                    <span class="search-result-meta">
                        <strong>${escapeHtml(track.title)}</strong>
                        <small>${escapeHtml(track.artist)} &bull; ${escapeHtml(track.album)}</small>
                    </span>
                    <span class="search-result-duration">${formatTime(track.duration)}</span>
                </button>
            `).join('');
            searchResults.classList.add('show');

            searchResults.querySelectorAll('.search-result-item').forEach(button => {
                button.addEventListener('click', () => {
                    const selectedTrack = tracks.find(track => track.id === button.dataset.trackId);
                    if (!selectedTrack) {
                        return;
                    }
                    trackIndex = tracks.indexOf(selectedTrack);
                    elapsedSeconds = 0;
                    isPlaying = true;
                    renderPlayer();
                    startProgressTimer();
                    searchResults.innerHTML = '';
                    searchResults.classList.remove('show');
                    if (searchInput) { searchInput.value = ''; }
                });
            });
        };

        searchInput?.addEventListener('input', performSearch);
        searchBtn?.addEventListener('click', performSearch);
    }

    function initFavoritesButtons() {
        document.querySelectorAll('.track-item-detailed').forEach(row => {
            const title = row.querySelector('.track-name')?.textContent?.trim();
            const artist = row.querySelector('.artist-name')?.textContent?.trim();
            const id = row.dataset.trackId || `${title}-${artist}`;
            const button = row.querySelector('.btn-icon');
            if (!button) {
                return;
            }
            button.dataset.trackId = id;
            button.setAttribute('aria-label', `Toggle favorite for ${title}`);
            button.addEventListener('click', event => {
                event.stopPropagation();
                toggleFavoriteById(id);
                renderFavorites();
            });
        });
    }

    function initPlaylists() {
        if (!playlistsContainer) {
            return;
        }
        const saved = loadPlaylists();
        if (saved.length) {
            playlistsContainer.innerHTML = '';
            saved.forEach(playlist => addPlaylistCard(playlist.name, playlist.gradient, false));
        }
        savePlaylists();

        createPlaylistBtn?.addEventListener('click', () => {
            const playlistName = prompt('Enter playlist name:');
            if (!playlistName || !playlistName.trim()) {
                return;
            }
            const gradient = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
            addPlaylistCard(playlistName.trim(), gradient, true);
        });

        playlistsContainer.addEventListener('click', event => {
            const editBtn = event.target.closest('.btn-small:not(.danger)');
            const deleteBtn = event.target.closest('.btn-small.danger');
            const card = event.target.closest('.playlist-detail-card');
            if (!card) {
                return;
            }

            if (editBtn) {
                const titleNode = card.querySelector('.playlist-header h3');
                const currentName = titleNode?.textContent?.trim() || 'Playlist';
                const newName = prompt('Edit playlist name:', currentName);
                if (newName && newName.trim()) {
                    titleNode.textContent = newName.trim();
                    savePlaylists();
                }
            }

            if (deleteBtn && confirm('Delete this playlist?')) {
                card.remove();
                savePlaylists();
            }
        });
    }

    function addPlaylistCard(name, gradient, save) {
        const card = document.createElement('div');
        card.className = 'playlist-detail-card';
        card.innerHTML = `
            <div class="playlist-header" style="background: ${gradient};">
                <h3>${escapeHtml(name)}</h3>
            </div>
            <div class="playlist-stats">
                <span>📀 ${Math.floor(24 + Math.random() * 60)} songs</span>
                <span>⏱️ ${Math.floor(2 + Math.random() * 5)}h ${Math.floor(10 + Math.random() * 49)}min</span>
                <span>👤 ${Math.floor(40 + Math.random() * 300)} followers</span>
            </div>
            <div class="playlist-actions">
                <button class="btn-small" type="button">Edit</button>
                <button class="btn-small danger" type="button">Delete</button>
            </div>
        `;
        playlistsContainer.appendChild(card);
        if (save) {
            savePlaylists();
        }
    }

    function savePlaylists() {
        const playlists = Array.from(document.querySelectorAll('.playlist-detail-card')).map(card => ({
            name: card.querySelector('.playlist-header h3')?.textContent?.trim() || 'Playlist',
            gradient: card.querySelector('.playlist-header')?.style.background || GRADIENTS[0]
        }));
        localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists));
    }

    function loadPlaylists() {
        try {
            return JSON.parse(localStorage.getItem(PLAYLISTS_STORAGE_KEY) || '[]');
        } catch {
            return [];
        }
    }

    function initPlayer() {
        document.querySelectorAll('.track-list .track-item').forEach(item => {
            item.setAttribute('tabindex', '0');
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
                const title = item.querySelector('.track-name')?.textContent?.trim();
                const idx = title ? tracks.findIndex(t => t.title.toLowerCase() === title.toLowerCase()) : -1;
                trackIndex = idx > -1 ? idx : 0;
                elapsedSeconds = 0;
                isPlaying = true;
                renderPlayer();
                startProgressTimer();
            });
            item.addEventListener('keydown', event => {
                if (event.key === 'Enter') { item.click(); }
            });
        });

        document.querySelectorAll('.album-card').forEach(card => {
            card.setAttribute('tabindex', '0');
            card.addEventListener('click', () => {
                const albumName = card.querySelector('h4')?.textContent?.trim();
                const idx = albumName ? tracks.findIndex(t => t.title.toLowerCase() === albumName.toLowerCase()) : -1;
                trackIndex = idx > -1 ? idx : 0;
                elapsedSeconds = 0;
                isPlaying = true;
                renderPlayer();
                startProgressTimer();
            });
            card.addEventListener('keydown', event => {
                if (event.key === 'Enter') { card.click(); }
            });
        });

        player.playPauseBtn?.addEventListener('click', togglePlayPause);
        player.prevBtn?.addEventListener('click', () => playRelativeTrack(-1));
        player.nextBtn?.addEventListener('click', () => playRelativeTrack(1));
        player.favoriteBtn?.addEventListener('click', () => {
            toggleFavorite();
            renderFavorites();
        });
        player.progressBar?.addEventListener('input', () => {
            const track = tracks[trackIndex];
            if (!track) {
                return;
            }
            elapsedSeconds = Math.floor((Number(player.progressBar.value) / 100) * track.duration);
            renderPlayer();
        });
        player.volumeControl?.addEventListener('input', () => {
            volume = Number(player.volumeControl.value);
        });
    }

    function togglePlayPause() {
        if (!tracks.length) {
            return;
        }
        isPlaying = !isPlaying;
        renderPlayer();
        if (isPlaying) {
            startProgressTimer();
        } else {
            stopProgressTimer();
        }
    }

    function playRelativeTrack(step) {
        if (!tracks.length) {
            return;
        }
        trackIndex = (trackIndex + step + tracks.length) % tracks.length;
        elapsedSeconds = 0;
        isPlaying = true;
        renderPlayer();
        startProgressTimer();
    }

    function startProgressTimer() {
        stopProgressTimer();
        intervalId = setInterval(() => {
            const track = tracks[trackIndex];
            if (!track || !isPlaying) {
                return;
            }
            elapsedSeconds += 1;
            if (elapsedSeconds >= track.duration) {
                playRelativeTrack(1);
                return;
            }
            renderPlayer();
        }, 1000);
    }

    function stopProgressTimer() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    function toggleFavorite() {
        const currentTrack = tracks[trackIndex];
        if (!currentTrack) {
            return;
        }
        toggleFavoriteById(currentTrack.id);
    }

    function toggleFavoriteById(id) {
        if (favorites.has(id)) {
            favorites.delete(id);
        } else {
            favorites.add(id);
        }
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...favorites]));
        renderPlayer();
    }

    function renderFavorites() {
        // Update stat counts
        document.querySelectorAll('.favorites-stats .stat-number').forEach((el, i) => {
            if (i === 0) { el.textContent = String(favorites.size); }
        });

        // Dynamically render favorites list if the container exists
        const listContainer = document.getElementById('favorites-track-list');
        if (listContainer) {
            const favTracks = tracks.filter(t => favorites.has(t.id));
            if (!favTracks.length) {
                listContainer.innerHTML = '<p class="empty-state" style="padding:20px 16px;">No favorites yet. Click ❤️ on any track to add it here!</p>';
            } else {
                listContainer.innerHTML = favTracks.map(track => `
                    <div class="track-item-detailed" role="button" tabindex="0" data-track-id="${track.id}">
                        <div class="track-cover" style="background: ${track.gradient};" aria-hidden="true"></div>
                        <div class="track-info-detailed">
                            <p class="track-name">${escapeHtml(track.title)}</p>
                            <p class="artist-name">${escapeHtml(track.artist)} &bull; ${escapeHtml(track.album)}</p>
                        </div>
                        <span class="duration">${formatTime(track.duration)}</span>
                        <button class="btn-icon" type="button" data-track-id="${track.id}" aria-label="Remove ${escapeHtml(track.title)} from favorites">❤️</button>
                    </div>
                `).join('');

                listContainer.querySelectorAll('.track-item-detailed').forEach(item => {
                    const trackId = item.dataset.trackId;
                    item.addEventListener('click', e => {
                        if (e.target.classList.contains('btn-icon')) { return; }
                        const idx = tracks.findIndex(t => t.id === trackId);
                        if (idx > -1) {
                            trackIndex = idx;
                            elapsedSeconds = 0;
                            isPlaying = true;
                            renderPlayer();
                            startProgressTimer();
                        }
                    });
                    item.addEventListener('keydown', e => {
                        if (e.key === 'Enter') { item.click(); }
                    });
                });
                listContainer.querySelectorAll('.btn-icon').forEach(btn => {
                    btn.addEventListener('click', e => {
                        e.stopPropagation();
                        toggleFavoriteById(btn.dataset.trackId);
                        renderFavorites();
                    });
                });
            }
        }

        // Update inline favorite buttons elsewhere on the page
        document.querySelectorAll('.btn-icon[data-track-id]').forEach(button => {
            if (!listContainer || !listContainer.contains(button)) {
                button.textContent = favorites.has(button.dataset.trackId) ? '❤️' : '🤍';
            }
        });
    }

    function renderPlayer() {
        const track = tracks[trackIndex];
        if (!track) {
            return;
        }
        const isFavorite = favorites.has(track.id);
        if (player.title) { player.title.textContent = track.title; }
        if (player.subtitle) { player.subtitle.textContent = `${track.artist} \u2022 ${track.album}`; }
        if (player.art) { player.art.style.background = track.gradient; }
        if (player.favoriteBtn) { player.favoriteBtn.textContent = isFavorite ? '❤️' : '🤍'; }
        if (player.playPauseBtn) { player.playPauseBtn.textContent = isPlaying ? '⏸' : '▶️'; }
        if (player.totalTime) { player.totalTime.textContent = formatTime(track.duration); }
        if (player.currentTime) { player.currentTime.textContent = formatTime(elapsedSeconds); }
        if (player.progressBar) { player.progressBar.value = String(Math.min(100, Math.floor((elapsedSeconds / track.duration) * 100))); }
        if (player.volumeControl) { player.volumeControl.value = String(volume); }
    }

    function loadFavorites() {
        try {
            return JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
        } catch {
            return [];
        }
    }

    function savePlayerState() {
        const state = { trackIndex, elapsedSeconds, volume };
        try {
            sessionStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(state));
        } catch { /* ignore */ }
    }

    function loadPlayerState() {
        try {
            return JSON.parse(sessionStorage.getItem(PLAYER_STATE_KEY) || 'null');
        } catch {
            return null;
        }
    }

    function initSettingsInteractions() {
        document.querySelectorAll('.toggle-switch input').forEach(toggle => {
            toggle.addEventListener('change', () => {
                const label = toggle.closest('.settings-item')?.querySelector('label')?.textContent?.trim() || 'Setting';
                console.log(`${label}: ${toggle.checked ? 'Enabled' : 'Disabled'}`);
            });
        });

        document.querySelectorAll('.radio input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.name === 'quality') {
                    console.log(`Audio quality changed to: ${radio.value} kbps`);
                }
            });
        });

        document.querySelectorAll('.btn-danger').forEach(button => {
            if (button.textContent.includes('Reset')) {
                button.addEventListener('click', () => {
                    if (!confirm('Reset all settings to default?')) {
                        return;
                    }
                    document.querySelectorAll('.toggle-switch input').forEach(toggle => {
                        toggle.checked = false;
                    });
                    const standard = document.querySelector('.radio input[type="radio"][value="256"]');
                    if (standard) {
                        standard.checked = true;
                    }
                    alert('Settings have been reset to defaults.');
                });
            } else if (button.textContent.includes('Cache')) {
                button.addEventListener('click', () => {
                    if (confirm('Clear local cache? This will remove your saved favorites and playlists.')) {
                        localStorage.removeItem(FAVORITES_STORAGE_KEY);
                        localStorage.removeItem(PLAYLISTS_STORAGE_KEY);
                        sessionStorage.removeItem(PLAYER_STATE_KEY);
                        favorites.clear();
                        renderFavorites();
                        alert('Cache cleared successfully.');
                    }
                });
            }
        });
    }

    function initReportStats() {
        const favCountEl = document.getElementById('report-fav-count');
        const playlistCountEl = document.getElementById('report-playlist-count');
        if (favCountEl) { favCountEl.textContent = String(favorites.size); }
        if (playlistCountEl) {
            const playlists = loadPlaylists();
            playlistCountEl.textContent = String(playlists.length);
        }
    }

    function attachRippleEffect() {
        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', event => {
                const ripple = document.createElement('span');
                const rect = button.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                ripple.className = 'ripple';
                ripple.style.width = `${size}px`;
                ripple.style.height = `${size}px`;
                ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
                ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
                button.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
            });
        });
    }

    function parseDuration(durationText) {
        const [mins, secs] = durationText.trim().split(':').map(Number);
        return ((mins || 0) * 60) + (secs || 0);
    }

    function formatTime(totalSeconds) {
        const safe = Math.max(0, Math.floor(totalSeconds));
        return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
    }

    function isTypingTarget(target) {
        return target instanceof HTMLElement &&
            (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }
});
