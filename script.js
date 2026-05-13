// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    // Page navigation click handler
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            const pageName = this.getAttribute('data-page');
            
            // Remove active class from all nav items and pages
            navItems.forEach(nav => nav.classList.remove('active'));
            pages.forEach(page => page.classList.remove('active'));
            
            // Add active class to clicked nav item and corresponding page
            this.classList.add('active');
            document.getElementById(pageName).classList.add('active');
        });
    });

    // Keyboard navigation with arrow keys
    document.addEventListener('keydown', function(e) {
        const activeNav = document.querySelector('.nav-item.active');
        const allNavs = Array.from(document.querySelectorAll('.nav-item'));
        const currentIndex = allNavs.indexOf(activeNav);

        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            e.preventDefault();
            const nextIndex = (currentIndex + 1) % allNavs.length;
            allNavs[nextIndex].click();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            e.preventDefault();
            const prevIndex = (currentIndex - 1 + allNavs.length) % allNavs.length;
            allNavs[prevIndex].click();
        }
    });
});

// Add ripple effect to buttons
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');

        this.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    });
});

// Playlist management
document.querySelectorAll('.btn-small').forEach(button => {
    button.addEventListener('click', function() {
        if (this.textContent === 'Delete') {
            if (confirm('Are you sure you want to delete this playlist?')) {
                this.closest('.playlist-detail-card').remove();
            }
        }
    });
});

// Create Playlist button
const createPlaylistBtn = document.querySelector('.btn-primary');
if (createPlaylistBtn) {
    createPlaylistBtn.addEventListener('click', function() {
        const playlistName = prompt('Enter playlist name:');
        if (playlistName) {
            alert(`Playlist "${playlistName}" created successfully!`);
        }
    });
}

// Toggle switches functionality
document.querySelectorAll('.toggle-switch input').forEach(toggle => {
    toggle.addEventListener('change', function() {
        const label = this.parentElement.parentElement.querySelector('label');
        const labelText = label ? label.textContent.trim() : '';
        console.log(`${labelText}: ${this.checked ? 'Enabled' : 'Disabled'}`);
    });
});

// Radio button functionality
document.querySelectorAll('.radio input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', function() {
        if (this.name === 'quality') {
            const quality = this.value;
            console.log(`Audio quality changed to: ${quality} kbps`);
        }
    });
});

// Search functionality
const searchInput = document.querySelector('.search-bar input');
if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        console.log('Searching for:', e.target.value);
    });

    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            console.log('Search:', e.target.value);
        }
    });
}

// Like/Unlike tracks
document.querySelectorAll('.btn-icon').forEach(button => {
    button.addEventListener('click', function(e) {
        e.stopPropagation();
        const trackName = this.closest('.track-item-detailed').querySelector('.track-name').textContent;
        if (this.textContent === '❤️') {
            this.textContent = '🤍';
            console.log(`Unliked: ${trackName}`);
        } else {
            this.textContent = '❤️';
            console.log(`Liked: ${trackName}`);
        }
    });
});

// Edit playlist functionality
document.querySelectorAll('.btn-small:not(.danger)').forEach(button => {
    if (button.textContent === 'Edit') {
        button.addEventListener('click', function() {
            const playlistName = this.closest('.playlist-detail-card').querySelector('h3').textContent;
            const newName = prompt(`Edit playlist name (current: "${playlistName}"):`, playlistName);
            if (newName && newName !== playlistName) {
                this.closest('.playlist-detail-card').querySelector('h3').textContent = newName;
                console.log(`Playlist renamed to: ${newName}`);
            }
        });
    }
});

// Reset settings
document.querySelectorAll('.btn-danger').forEach(button => {
    if (button.textContent === 'Reset All Settings') {
        button.addEventListener('click', function() {
            if (confirm('Are you sure you want to reset all settings to default?')) {
                alert('Settings have been reset to default!');
                // Reset all toggles
                document.querySelectorAll('.toggle-switch input').forEach(toggle => {
                    toggle.checked = false;
                });
                // Reset radio buttons
                document.querySelectorAll('.radio input[type="radio"]').forEach(radio => {
                    radio.checked = false;
                });
                document.querySelector('.radio input[type="radio"][value="256"]').checked = true;
            }
        });
    }
    
    if (button.textContent === 'Clear Cache') {
        button.addEventListener('click', function() {
            if (confirm('Clear cache and browsing data?')) {
                alert('Cache cleared successfully!');
            }
        });
    }
});

// Add smooth scroll behavior to main content
document.addEventListener('DOMContentLoaded', function() {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.scrollTop = 0;
    }
});

// Add hover effect to cards
document.querySelectorAll('.playlist-card, .album-card, .category-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transition = 'all 0.3s ease';
    });
});

// Track item interactivity
document.querySelectorAll('.track-item, .track-item-detailed').forEach(track => {
    track.addEventListener('mouseenter', function() {
        this.style.cursor = 'pointer';
    });
});

console.log('MusicWeb loaded successfully! 🎵');
