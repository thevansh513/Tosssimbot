document.addEventListener('DOMContentLoaded', () => {
    const wheel = document.getElementById('wheel');
    const spinButton = document.getElementById('spin-button');
    const resultText = document.getElementById('spin-result');

    const sections = [500, 50, 100, 0, 250, 25, 150, 10]; // Prizes must match the HTML
    const sectionAngle = 360 / sections.length;
    const spinCost = 25;
    let isSpinning = false;
    let currentRotation = 0;

    spinButton.addEventListener('click', () => {
        if (isSpinning) return;

        const currentCoins = window.tossSim.getCoins();
        if (currentCoins < spinCost) {
            window.showToast(`You need at least ${spinCost} coins to spin.`, 'error');
            return;
        }

        startSpin();
    });

    function startSpin() {
        isSpinning = true;
        spinButton.disabled = true;
        resultText.textContent = '';
        window.tossSim.subtractCoins(spinCost);
        window.tossSim.playSound('spin');

        const randomSpins = Math.floor(Math.random() * 5) + 5; // 5 to 9 full rotations
        const randomStopAngle = Math.floor(Math.random() * 360);
        const totalRotation = (randomSpins * 360) + randomStopAngle;

        // Apply a clean rotation without accumulating past 360
        currentRotation = (currentRotation + totalRotation) % 360;

        wheel.style.transform = `rotate(${totalRotation}deg)`;

        wheel.addEventListener('transitionend', handleSpinEnd, { once: true });
    }

    function handleSpinEnd() {
        wheel.style.transition = 'none';
        const actualRotation = getActualRotation(wheel);
        wheel.style.transform = `rotate(${actualRotation}deg)`;
        
        // Use a timeout to allow the transform to apply before re-enabling transition
        setTimeout(() => {
            wheel.style.transition = 'transform 5s cubic-bezier(0.25, 0.1, 0.25, 1)';
        }, 50);

        const winningIndex = Math.floor((360 - actualRotation) / sectionAngle) % sections.length;
        const prize = sections[winningIndex];

        if (prize > 0) {
            resultText.textContent = `You won ${prize} coins!`;
            window.showToast(`You won ${prize} coins!`, 'success');
            window.tossSim.addCoins(prize);
            window.tossSim.playSound('win');
            showWinAnimation();
            highlightWinningSection(winningIndex);
        } else {
            resultText.textContent = `Better luck next time!`;
            window.showToast('You won 0 coins.', 'error');
            window.tossSim.playSound('lose');
        }
        
        // Animate result text
        resultText.classList.add('pop');
        resultText.addEventListener('animationend', () => {
            resultText.classList.remove('pop');
        }, { once: true });

        isSpinning = false;
        spinButton.disabled = false;
    }

    function highlightWinningSection(index) {
        const sections = document.querySelectorAll('.wheel-section');
        const winningSection = sections[index];
    
        if (winningSection) {
            winningSection.classList.add('winning-section');
            // The animation runs for 2 seconds (0.5s duration, 4 iterations)
            setTimeout(() => {
                winningSection.classList.remove('winning-section');
            }, 2000);
        }
    }

    function showWinAnimation() {
        const container = document.querySelector('.wheel-container');
        const confettiCount = 50;
        const colors = ['#db7093', '#20b2aa', '#daa520', '#ff340f', '#ff7f50', '#3cb371', '#4169e1', '#6a5acd'];

        for (let i = 0; i < confettiCount; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const randomX = Math.random() * 100;
            const randomDelay = Math.random() * 0.5;

            piece.style.backgroundColor = randomColor;
            piece.style.left = `${randomX}%`;
            piece.style.top = '-10%'; // Start from above the container
            piece.style.animationDelay = `${randomDelay}s`;
            
            container.appendChild(piece);

            // Remove confetti piece after animation to prevent DOM clutter
            setTimeout(() => {
                piece.remove();
            }, 2500);
        }
    }
    
    // Helper to get the actual rotation degree between 0 and 359
    function getActualRotation(element) {
        const st = window.getComputedStyle(element, null);
        const tm = st.getPropertyValue("-webkit-transform") ||
                   st.getPropertyValue("-moz-transform") ||
                   st.getPropertyValue("-ms-transform") ||
                   st.getPropertyValue("-o-transform") ||
                   st.getPropertyValue("transform") ||
                   "none";
        if (tm !== "none") {
            const values = tm.split('(')[1].split(')')[0].split(',');
            const a = values[0];
            const b = values[1];
            const angle = Math.round(Math.atan2(b, a) * (180/Math.PI));
            return (angle < 0 ? angle + 360 : angle);
        }
        return 0;
    }
});