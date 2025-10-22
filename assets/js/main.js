document.addEventListener('DOMContentLoaded', () => {
    const COIN_KEY = 'tosssim_coins';
    const MUTE_KEY = 'tosssim_muted';

    // --- Sound Management ---
    const soundManager = {
        sounds: {},
        isMuted: localStorage.getItem(MUTE_KEY) === 'true',
        
        init() {
            const soundFiles = ['flip', 'spin', 'win', 'lose', 'click'];
            soundFiles.forEach(name => {
                this.sounds[name] = new Audio(`/assets/sounds/${name}.mp3`);
                this.sounds[name].preload = 'auto';
            });

            const toggleButton = document.getElementById('sound-toggle');
            if (toggleButton) {
                toggleButton.addEventListener('click', () => this.toggleMute());
            }
            this.updateMuteIcon();
        },

        playSound(name) {
            if (!this.isMuted && this.sounds[name]) {
                this.sounds[name].currentTime = 0;
                this.sounds[name].play().catch(error => console.error(`Error playing sound ${name}:`, error));
            }
        },

        toggleMute() {
            this.isMuted = !this.isMuted;
            localStorage.setItem(MUTE_KEY, this.isMuted);
            this.updateMuteIcon();
        },

        updateMuteIcon() {
            const toggleButton = document.getElementById('sound-toggle');
            if (toggleButton) {
                toggleButton.textContent = this.isMuted ? '🔇' : '🔊';
            }
        }
    };
    soundManager.init();


    // --- Coin Management ---
    function getCoins() {
        const coins = localStorage.getItem(COIN_KEY);
        return coins === null ? 1000 : parseInt(coins, 10);
    }

    function setCoins(amount) {
        localStorage.setItem(COIN_KEY, amount);
        updateBalanceDisplay();
        checkForBonus();
    }

    function addCoins(amount) {
        setCoins(getCoins() + amount);
    }

    function subtractCoins(amount) {
        setCoins(getCoins() - amount);
    }

    function updateBalanceDisplay() {
        const balanceElements = document.querySelectorAll('.coin-balance');
        const currentCoins = getCoins();
        balanceElements.forEach(el => {
            el.textContent = currentCoins.toLocaleString();
        });
    }

    // --- Daily Bonus ---
    function checkForBonus() {
        const bonusContainer = document.getElementById('bonus-container');
        if (!bonusContainer) return;

        bonusContainer.innerHTML = ''; // Clear previous button
        if (getCoins() <= 0) {
            const bonusButton = document.createElement('button');
            bonusButton.textContent = '😭 Claim Daily Bonus (+500)';
            bonusButton.className = 'btn btn-secondary';
            bonusButton.onclick = () => {
                addCoins(500);
                showToast('You received your daily bonus!', 'success');
                soundManager.playSound('win');
                bonusButton.remove();
            };
            bonusContainer.appendChild(bonusButton);
        }
    }

    // --- Toast Notifications ---
    window.showToast = (message, type = 'success') => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Animate out and remove
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    };

    // --- General UI ---
    function addClickSounds() {
        const buttons = document.querySelectorAll('.btn, .game-card, .choice-btn');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                soundManager.playSound('click');
            });
        });
    }


    // --- Initialization ---
    function init() {
        if (localStorage.getItem(COIN_KEY) === null) {
            localStorage.setItem(COIN_KEY, '1000');
        }
        updateBalanceDisplay();
        checkForBonus();
        addClickSounds();
    }

    init();

    // Make functions globally available
    window.tossSim = {
        getCoins,
        addCoins,
        subtractCoins,
        playSound: (name) => soundManager.playSound(name)
    };
});