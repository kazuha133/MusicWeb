const FAVORITES_STORAGE_KEY = 'musicweb_favorites_v1';
const PLAYLISTS_STORAGE_KEY = 'musicweb_playlists_v1';
const GRADIENTS = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
];

document.addEventListener('DOMContentLoaded', () => {
    const navItems = Array.from(document.querySelectorAll('.nav-item'));
    const pages = Array.from(document.querySelectorAll('.page'));
    const searchInput = document.getElementById('music-search-input');
    const searchBtn = document.getElementById('music-search-btn');
    const searchResults = document.getElementById('search-results');
    const createPlaylistBtn = document.getElementById('create-playlist-btn');
    const playlistsContainer = document.querySelector('.playlists-container');
    const mainTrackItems = Array.from(document.querySelectorAll('#home .track-item'));

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
    let trackIndex = 0;
    let isPlaying = false;
    let elapsedSeconds = 0;
    let intervalId = null;
    let volume = 80;

    initNavigation();
    initSearch();
    initFavoritesButtons();
    initPlaylists();
    initPlayer();
    initSettingsInteractions();
    attachRippleEffect();
    renderFavorites();
    renderPlayer();

    function buildTrackLibrary() {
        const fromHome = mainTrackItems.map((item, index) => ({
            id: `${item.querySelector('.track-name')?.textContent?.trim() || `track-${index}`}-${item.querySelector('.artist-name')?.textContent?.trim() || 'artist'}`,
            title: item.querySelector('.track-name')?.textContent?.trim() || `Track ${index + 1}`,
            artist: item.querySelector('.artist-name')?.textContent?.trim() || 'Unknown Artist',
            album: 'Trending Now',
            duration: parseDuration(item.querySelector('.duration')?.textContent || '3:00'),
            gradient: GRADIENTS[index % GRADIENTS.length]
        }));

        const fromAlbums = Array.from(document.querySelectorAll('.album-card')).map((card, index) => ({
            id: `${card.querySelector('h4')?.textContent?.trim() || `album-${index}`}-${card.querySelector('p')?.textContent?.trim() || 'artist'}`,
            title: card.querySelector('h4')?.textContent?.trim() || `Album ${index + 1}`,
            artist: card.querySelector('p')?.textContent?.trim() || 'Unknown Artist',
            album: card.querySelector('h4')?.textContent?.trim() || 'New Release',
            duration: 180 + (index + 1) * 22,
            gradient: card.querySelector('.album-art')?.style.background || GRADIENTS[index % GRADIENTS.length]
        }));

        return [...fromHome, ...fromAlbums];
    }

    function initNavigation() {
        navItems.forEach(item => {
            item.addEventListener('click', event => {
                event.preventDefault();
                switchPage(item.getAttribute('data-page'));
            });
        });

        document.addEventListener('keydown', event => {
            if (isTypingTarget(event.target)) {
                return;
            }

            const activeNav = document.querySelector('.nav-item.active');
            const currentIndex = navItems.indexOf(activeNav);

            if (event.key === 'ArrowRight' && event.altKey) {
                event.preventDefault();
                switchPage(navItems[(currentIndex + 1) % navItems.length].getAttribute('data-page'));
            } else if (event.key === 'ArrowLeft' && event.altKey) {
                event.preventDefault();
                switchPage(navItems[(currentIndex - 1 + navItems.length) % navItems.length].getAttribute('data-page'));
            } else if (event.code === 'Space') {
                event.preventDefault();
                togglePlayPause();
            } else if (event.key.toLowerCase() === 'n') {
                playRelativeTrack(1);
            } else if (event.key.toLowerCase() === 'p') {
                playRelativeTrack(-1);
            } else if (event.key.toLowerCase() === 'f') {
                toggleFavorite();
            }
        });
    }

    function switchPage(pageName) {
        navItems.forEach(nav => nav.classList.remove('active'));
        pages.forEach(page => page.classList.remove('active'));
        document.querySelector(`.nav-item[data-page="${pageName}"]`)?.classList.add('active');
        document.getElementById(pageName)?.classList.add('active');
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
                        <small>${escapeHtml(track.artist)} • ${escapeHtml(track.album)}</small>
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
            const id = `${title}-${artist}`;
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

        playlistsContainer?.addEventListener('click', event => {
            const editBtn = event.target.closest('.btn-small:not(.danger)');
            const deleteBtn = event.target.closest('.btn-small.danger');
            const card = event.target.closest('.playlist-detail-card');
            if (!card) {
                return;
            }

            if (editBtn) {
                const titleNode = card.querySelector('.playlist-header h3');
                const currentName = titleNode?.textContent?.trim() || 'Playlist';
                const newName = prompt(`Edit playlist name:`, currentName);
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
        playlistsContainer?.appendChild(card);
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
        mainTrackItems.forEach((item, index) => {
            item.setAttribute('tabindex', '0');
            item.addEventListener('click', () => {
                trackIndex = index;
                elapsedSeconds = 0;
                isPlaying = true;
                renderPlayer();
                startProgressTimer();
            });
            item.addEventListener('keydown', event => {
                if (event.key === 'Enter') {
                    item.click();
                }
            });
        });

        document.querySelectorAll('.album-card').forEach(card => {
            card.setAttribute('tabindex', '0');
            card.addEventListener('click', () => {
                const albumName = card.querySelector('h4')?.textContent?.trim();
                const idx = tracks.findIndex(track => track.title === albumName);
                trackIndex = idx > -1 ? idx : 0;
                elapsedSeconds = 0;
                isPlaying = true;
                renderPlayer();
                startProgressTimer();
            });
            card.addEventListener('keydown', event => {
                if (event.key === 'Enter') {
                    card.click();
                }
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
        const statNumber = document.querySelector('.favorites-stats .stat-number');
        if (statNumber) {
            statNumber.textContent = String(favorites.size);
        }
        document.querySelectorAll('.track-item-detailed .btn-icon').forEach(button => {
            const id = button.dataset.trackId;
            button.textContent = favorites.has(id) ? '❤️' : '🤍';
        });
    }

    function renderPlayer() {
        const track = tracks[trackIndex];
        if (!track) {
            return;
        }
        const favorite = favorites.has(track.id);
        player.title.textContent = track.title;
        player.subtitle.textContent = `${track.artist} • ${track.album}`;
        player.art.style.background = track.gradient;
        player.favoriteBtn.textContent = favorite ? '❤️' : '🤍';
        player.playPauseBtn.textContent = isPlaying ? '⏸' : '▶️';
        player.totalTime.textContent = formatTime(track.duration);
        player.currentTime.textContent = formatTime(elapsedSeconds);
        player.progressBar.value = String(Math.min(100, Math.floor((elapsedSeconds / track.duration) * 100)));
        player.volumeControl.value = String(volume);
    }

    function loadFavorites() {
        try {
            return JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
        } catch {
            return [];
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
                    alert('Settings have been reset.');
                });
            } else if (button.textContent.includes('Cache')) {
                button.addEventListener('click', () => {
                    if (confirm('Clear local cache?')) {
                        localStorage.removeItem(FAVORITES_STORAGE_KEY);
                        localStorage.removeItem(PLAYLISTS_STORAGE_KEY);
                        alert('Cache cleared.');
                    }
                });
            }
        });
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
        return value
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }
});
