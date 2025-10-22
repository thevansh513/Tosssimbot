document.addEventListener('DOMContentLoaded', () => {
    const coin = document.getElementById('coin');
    const tossButton = document.getElementById('toss-button');
    const resultText = document.getElementById('result-text');
    const betAmountInput = document.getElementById('bet-amount');
    const choiceButtons = document.querySelectorAll('.choice-btn');

    let userChoice = null;
    let isFlipping = false;

    // --- Event Listeners ---

    choiceButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (isFlipping) return;
            userChoice = button.dataset.choice;
            choiceButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            validateInputs();
        });
    });

    betAmountInput.addEventListener('input', validateInputs);

    tossButton.addEventListener('click', () => {
        if (isFlipping || !userChoice || !betAmountInput.value) return;

        const betAmount = parseInt(betAmountInput.value, 10);
        const currentCoins = window.tossSim.getCoins();

        if (betAmount <= 0) {
            window.showToast('Please enter a valid bet amount.', 'error');
            return;
        }
        if (betAmount > currentCoins) {
            window.showToast("You don't have enough coins to make that bet.", 'error');
            return;
        }

        startFlip(betAmount);
    });

    // --- Game Logic ---

    function validateInputs() {
        const betAmount = parseInt(betAmountInput.value, 10);
        tossButton.disabled = !userChoice || !betAmount || betAmount <= 0;
    }

    function startFlip(bet) {
        isFlipping = true;
        tossButton.disabled = true;
        resultText.textContent = 'Flipping...';
        coin.parentElement.classList.remove('win-glow'); // Remove previous glow
        coin.className = ''; // Reset classes
        window.tossSim.playSound('flip');

        const random = Math.random();
        const result = random < 0.5 ? 'heads' : 'tails';

        // Add animation class
        setTimeout(() => {
            coin.classList.add(result === 'heads' ? 'flip-heads' : 'flip-tails');
        }, 100);


        coin.addEventListener('animationend', () => {
            handleResult(result, bet);
        }, { once: true });
    }

    function handleResult(result, bet) {
        const didWin = userChoice === result;
        
        if (didWin) {
            const winnings = Math.round(bet * 0.98); // Net win is 98% of the bet amount (2% house edge)
            window.tossSim.addCoins(winnings);
            resultText.textContent = `It's ${result}! You won ${winnings} coins!`;
            window.showToast(`You won ${winnings} coins!`, 'success');
            window.tossSim.playSound('win');
            coin.parentElement.classList.add('win-glow');
            showCoinShower();
        } else {
            window.tossSim.subtractCoins(bet);
            resultText.textContent = `It's ${result}. You lost ${bet} coins.`;
            window.showToast(`You lost ${bet} coins.`, 'error');
            window.tossSim.playSound('lose');
        }

        // Animate result text
        resultText.classList.add('pop');
        resultText.addEventListener('animationend', () => {
            resultText.classList.remove('pop');
        }, { once: true });

        // Reset state
        isFlipping = false;
        userChoice = null;
        choiceButtons.forEach(btn => btn.classList.remove('active'));
        validateInputs();
    }

    function showCoinShower() {
        const container = document.querySelector('.page-container');
        if (!container) return;
    
        for (let i = 0; i < 20; i++) { // Create 20 coins
            const coinEl = document.createElement('div');
            coinEl.className = 'falling-coin';
            
            // Randomize horizontal position, delay, and duration for a natural look
            coinEl.style.left = `${Math.random() * 100}%`;
            coinEl.style.animationDelay = `${Math.random() * 1}s`;
            coinEl.style.animationDuration = `${1.5 + Math.random()}s`;
    
            container.appendChild(coinEl);
    
            // Remove the coin from the DOM after it has fallen
            setTimeout(() => {
                coinEl.remove();
            }, 3000);
        }
    }
});