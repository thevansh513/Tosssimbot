import React, { useState, useEffect, useContext, createContext, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, Outlet, useNavigate } from 'react-router-dom';

// --- TYPE DEFINITIONS ---
type SoundName = 'flip' | 'spin' | 'win' | 'lose' | 'click';

interface ToastMessage {
    id: number;
    message: string;
    type: 'success' | 'error';
}

interface AppContextType {
    coins: number;
    addCoins: (amount: number) => void;
    subtractCoins: (amount: number) => void;
    isMuted: boolean;
    toggleMute: () => void;
    playSound: (name: SoundName) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

// --- SOUNDS ---
const soundFiles: Record<SoundName, string> = {
    flip: '/assets/sounds/flip.mp3',
    spin: '/assets/sounds/spin.mp3',
    win: '/assets/sounds/win.mp3',
    lose: '/assets/sounds/lose.mp3',
    click: '/assets/sounds/click.mp3',
};

// --- CONTEXT & PROVIDER ---
const AppContext = createContext<AppContextType | null>(null);

const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppContext must be used within an AppProvider');
    return context;
};

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [coins, setCoins] = useState<number>(() => parseInt(localStorage.getItem('tosssim_coins') || '1000', 10));
    const [isMuted, setIsMuted] = useState<boolean>(() => localStorage.getItem('tosssim_muted') === 'true');
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const sounds = useRef<Record<string, HTMLAudioElement>>({});

    useEffect(() => {
        Object.keys(soundFiles).forEach(name => {
            sounds.current[name] = new Audio(soundFiles[name as SoundName]);
            sounds.current[name].preload = 'auto';
        });
    }, []);
    
    useEffect(() => {
        localStorage.setItem('tosssim_coins', coins.toString());
    }, [coins]);
    
    useEffect(() => {
        localStorage.setItem('tosssim_muted', isMuted.toString());
    }, [isMuted]);

    const addCoins = (amount: number) => setCoins(c => c + amount);
    const subtractCoins = (amount: number) => setCoins(c => c - amount);
    const toggleMute = () => setIsMuted(m => !m);
    
    const playSound = (name: SoundName) => {
        if (!isMuted && sounds.current[name]) {
            sounds.current[name].currentTime = 0;
            sounds.current[name].play().catch(error => console.error(`Error playing sound ${name}:`, error));
        }
    };

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        const id = Date.now();
        setToasts(prevToasts => [...prevToasts, { id, message, type }]);
        setTimeout(() => {
            setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
        }, 3500);
    };

    const value = { coins, addCoins, subtractCoins, isMuted, toggleMute, playSound, showToast };

    return (
        <AppContext.Provider value={value}>
            {children}
            <ToastContainer toasts={toasts} />
        </AppContext.Provider>
    );
};

// --- UI COMPONENTS ---

const Toast: React.FC<{ message: ToastMessage, onClose: () => void }> = ({ message, onClose }) => {
    const [show, setShow] = useState(false);
    useEffect(() => {
        setShow(true);
        const timer = setTimeout(() => {
            setShow(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`toast ${message.type} ${show ? 'show' : ''}`} onTransitionEnd={() => !show && onClose()}>
            {message.message}
        </div>
    );
};

const ToastContainer: React.FC<{ toasts: ToastMessage[] }> = ({ toasts }) => {
    const [toastList, setToastList] = useState<ToastMessage[]>([]);

    useEffect(() => {
        setToastList(toasts);
    }, [toasts]);

    const handleClose = (id: number) => {
        setToastList(currentToasts => currentToasts.filter(toast => toast.id !== id));
    };
    
    return (
        <div id="toast-container">
            {toastList.map(toast => (
                <Toast key={toast.id} message={toast} onClose={() => handleClose(toast.id)} />
            ))}
        </div>
    );
};

const Header = () => {
    const { coins, isMuted, toggleMute } = useAppContext();
    return (
        <header>
            <div className="container">
                <Link to="/" className="logo-link"><h1 className="logo">🎯 TossSim</h1></Link>
                <div className="header-controls">
                    <div className="balance">💰 Balance: <span className="coin-balance">{coins.toLocaleString()}</span></div>
                    <button id="sound-toggle" className="sound-toggle" onClick={toggleMute}>{isMuted ? '🔇' : '🔊'}</button>
                </div>
            </div>
        </header>
    );
};

const AdBanner = ({ type }: { type: 'top' | 'bottom' }) => {
    const adRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!adRef.current) return;
        
        adRef.current.innerHTML = ''; // Clear previous ad
        let script;
        if (type === 'top') {
            script = document.createElement('script');
            script.type = 'text/javascript';
            // Set config on window for the external script to find
            (window as any).atOptions = {
                'key': 'f71f4fbbfb3d6ebf34b5a498606309c2',
                'format': 'iframe',
                'height': 50,
                'width': 320,
                'params': {}
            };
            script.src = "//www.highperformanceformat.com/f71f4fbbfb3d6ebf34b5a498606309c2/invoke.js";
            adRef.current.appendChild(script);
        } else {
            const container = document.createElement('div');
            container.id = 'container-a7a7028cc65b952d8920c62111462a33';
            adRef.current.appendChild(container);
            
            script = document.createElement('script');
            script.async = true;
            script.setAttribute('data-cfasync', 'false');
            script.src = "//pl27902574.effectivegatecpm.com/a7a7028cc65b952d8920c62111462a33/invoke.js";
            adRef.current.appendChild(script);
        }

        return () => {
             if (adRef.current) adRef.current.innerHTML = '';
        }
    }, [type]);

    return <div className={`ad-banner ${type}-ad`} ref={adRef} />;
};


const Layout = () => {
    return (
        <>
            <Header />
            <AdBanner type="top" />
            <main>
                <Outlet />
            </main>
            <AdBanner type="bottom" />
        </>
    );
};

// --- PAGE COMPONENTS ---

const Home = () => (
    <div className="container hero">
        <h2>Welcome to TossSim!</h2>
        <p>Spin & Toss to earn virtual coins! Are you feeling lucky?</p>
        <div className="button-group">
            <Link to="/game" className="btn btn-primary">Play Now</Link>
            <Link to="/download" className="btn btn-secondary">Download App</Link>
        </div>
    </div>
);

const Download = () => (
    <div className="container page-container">
        <div className="card">
            <h2>Get the TossSim App 📲</h2>
            <p>Enjoy TossSim on your Android device for the best experience.</p>
            <a href="/download/toss.apk" className="btn btn-primary" download>Download Now (APK)</a>
        </div>
        <Link to="/" className="back-link">← Back to Home</Link>
    </div>
);

const GameDashboard = () => {
    const { coins, addCoins, playSound, showToast } = useAppContext();
    const handleBonusClaim = () => {
        addCoins(500);
        showToast('You received your daily bonus!', 'success');
        playSound('win');
    };

    return (
        <div className="container page-container">
            <h2>Choose Your Game</h2>
            <div className="game-selection">
                <Link to="/game/toss" className="card game-card">
                    <h3>Toss & Earn</h3>
                    <p>Flip a coin. Double or nothing!</p>
                </Link>
                <Link to="/game/spin" className="card game-card">
                    <h3>Spin & Win</h3>
                    <p>Spin the wheel for big prizes!</p>
                </Link>
            </div>
            <div className="card leaderboard-container">
                <h3>🏆 Top 5 Local Players</h3>
                <ol className="leaderboard-list">
                    <li><span>Player123</span><span>15,450</span></li>
                    <li><span>CoinMaster</span><span>12,800</span></li>
                    <li><span>LuckySpinner</span><span>11,230</span></li>
                    <li><span>HighRoller</span><span>9,900</span></li>
                    <li><span>BetKing</span><span>8,750</span></li>
                </ol>
            </div>
            <div id="bonus-container">
                {coins <= 0 && (
                    <button className="btn btn-secondary" onClick={handleBonusClaim}>
                        😭 Claim Daily Bonus (+500)
                    </button>
                )}
            </div>
        </div>
    );
};

const TossGame = () => {
    const { coins, addCoins, subtractCoins, playSound, showToast } = useAppContext();
    const [bet, setBet] = useState('');
    const [choice, setChoice] = useState<'heads' | 'tails' | null>(null);
    const [isFlipping, setIsFlipping] = useState(false);
    const [resultText, setResultText] = useState('');
    const [flipClass, setFlipClass] = useState('');
    const [glow, setGlow] = useState(false);
    const coinRef = useRef<HTMLDivElement>(null);

    const handleToss = () => {
        const betAmount = parseInt(bet, 10);
        if (!choice || !betAmount || betAmount <= 0) {
            showToast('Invalid bet or choice.', 'error');
            return;
        }
        if (betAmount > coins) {
            showToast("You don't have enough coins.", 'error');
            return;
        }
        
        setIsFlipping(true);
        setResultText('Flipping...');
        setGlow(false);
        setFlipClass('');
        playSound('flip');

        const result: 'heads' | 'tails' = Math.random() < 0.5 ? 'heads' : 'tails';
        
        setTimeout(() => {
            setFlipClass(result === 'heads' ? 'flip-heads' : 'flip-tails');
        }, 100);
    };

    useEffect(() => {
        const coinEl = coinRef.current;
        if (!coinEl) return;
        
        const handleAnimationEnd = () => {
            if (!isFlipping) return;

            const result = flipClass.includes('heads') ? 'heads' : 'tails';
            const betAmount = parseInt(bet, 10);
            const didWin = choice === result;
            
            if (didWin) {
                const winnings = Math.round(betAmount * 0.98);
                addCoins(winnings);
                setResultText(`It's ${result}! You won ${winnings} coins!`);
                showToast(`You won ${winnings} coins!`, 'success');
                playSound('win');
                setGlow(true);
            } else {
                subtractCoins(betAmount);
                setResultText(`It's ${result}. You lost ${betAmount} coins.`);
                showToast(`You lost ${betAmount} coins.`, 'error');
                playSound('lose');
            }

            setIsFlipping(false);
            setChoice(null);
        };
        
        coinEl.addEventListener('animationend', handleAnimationEnd);
        return () => coinEl.removeEventListener('animationend', handleAnimationEnd);
    }, [isFlipping, flipClass, choice, bet, addCoins, subtractCoins, playSound, showToast]);
    

    const isTossDisabled = isFlipping || !choice || !bet || parseInt(bet) <= 0;

    return (
        <div className="container page-container">
            <h2>Toss & Earn</h2>
            <div className={`coin-container ${glow ? 'win-glow' : ''}`}>
                <div id="coin" ref={coinRef} className={flipClass}>
                    <div className="side-a">H</div>
                    <div className="side-b">T</div>
                </div>
            </div>
            <p className="result-text">{resultText}</p>
            <div className="game-controls">
                <div className="bet-input">
                    <label htmlFor="bet-amount">Bet Amount:</label>
                    <input 
                        type="number" 
                        id="bet-amount" 
                        placeholder="Enter bet" 
                        min="1" 
                        value={bet}
                        onChange={(e) => setBet(e.target.value)}
                        disabled={isFlipping}
                    />
                </div>
                <p>Choose your side:</p>
                <div className="choice-buttons">
                    <button className={`btn choice-btn ${choice === 'heads' ? 'active' : ''}`} onClick={() => !isFlipping && setChoice('heads')}>Heads</button>
                    <button className={`btn choice-btn ${choice === 'tails' ? 'active' : ''}`} onClick={() => !isFlipping && setChoice('tails')}>Tails</button>
                </div>
                <button id="toss-button" className="btn btn-primary" disabled={isTossDisabled} onClick={handleToss}>Toss Coin</button>
            </div>
            <Link to="/game" className="back-link">← Back to Games</Link>
        </div>
    );
};

const SpinGame = () => {
    const { coins, addCoins, subtractCoins, playSound, showToast } = useAppContext();
    const [isSpinning, setIsSpinning] = useState(false);
    const [resultText, setResultText] = useState('');
    const wheelRef = useRef<HTMLDivElement>(null);

    const sections = [500, 50, 100, 0, 250, 25, 150, 10];
    const sectionAngle = 360 / sections.length;
    const spinCost = 25;

    const startSpin = () => {
        if (isSpinning) return;
        if (coins < spinCost) {
            showToast(`You need at least ${spinCost} coins.`, 'error');
            return;
        }

        setIsSpinning(true);
        setResultText('');
        subtractCoins(spinCost);
        playSound('spin');

        const wheel = wheelRef.current;
        if (!wheel) return;

        const randomSpins = Math.floor(Math.random() * 5) + 5;
        const randomStopAngle = Math.floor(Math.random() * 360);
        const totalRotation = (randomSpins * 360) + randomStopAngle;

        wheel.style.transition = 'transform 5s cubic-bezier(0.25, 0.1, 0.25, 1)';
        wheel.style.transform = `rotate(${totalRotation}deg)`;
    };

    useEffect(() => {
        const wheel = wheelRef.current;
        if (!wheel) return;

        const handleSpinEnd = () => {
            wheel.style.transition = 'none';

            const st = window.getComputedStyle(wheel, null);
            const tm = st.getPropertyValue("transform");
            const values = tm.split('(')[1].split(')')[0].split(',');
            const angle = Math.round(Math.atan2(parseFloat(values[1]), parseFloat(values[0])) * (180/Math.PI));
            const actualRotation = (angle < 0 ? angle + 360 : angle);
            
            wheel.style.transform = `rotate(${actualRotation}deg)`;

            const winningIndex = Math.floor((360 - actualRotation) / sectionAngle) % sections.length;
            const prize = sections[winningIndex];

            if (prize > 0) {
                setResultText(`You won ${prize} coins!`);
                showToast(`You won ${prize} coins!`, 'success');
                addCoins(prize);
                playSound('win');
            } else {
                setResultText('Better luck next time!');
                showToast('You won 0 coins.', 'error');
                playSound('lose');
            }

            setIsSpinning(false);
        };

        wheel.addEventListener('transitionend', handleSpinEnd);
        return () => wheel.removeEventListener('transitionend', handleSpinEnd);
    }, [addCoins, playSound, showToast, subtractCoins]);

    return (
        <div className="container page-container">
            <h2>Spin & Win</h2>
            <p className="spin-cost">Cost: 25 Coins per spin</p>
            <div className="wheel-container">
                <div className="wheel-pointer"></div>
                <div id="wheel" className="wheel" ref={wheelRef}>
                    <div className="wheel-section" style={{ '--i': 0, '--clr': '#db7093' } as React.CSSProperties}><span>500</span></div>
                    <div className="wheel-section" style={{ '--i': 1, '--clr': '#20b2aa' } as React.CSSProperties}><span>50</span></div>
                    <div className="wheel-section" style={{ '--i': 2, '--clr': '#daa520' } as React.CSSProperties}><span>100</span></div>
                    <div className="wheel-section" style={{ '--i': 3, '--clr': '#ff340f' } as React.CSSProperties}><span>0</span></div>
                    <div className="wheel-section" style={{ '--i': 4, '--clr': '#ff7f50' } as React.CSSProperties}><span>250</span></div>
                    <div className="wheel-section" style={{ '--i': 5, '--clr': '#3cb371' } as React.CSSProperties}><span>25</span></div>
                    <div className="wheel-section" style={{ '--i': 6, '--clr': '#4169e1' } as React.CSSProperties}><span>150</span></div>
                    <div className="wheel-section" style={{ '--i': 7, '--clr': '#6a5acd' } as React.CSSProperties}><span>10</span></div>
                </div>
            </div>
            <p id="spin-result" className="result-text">{resultText}</p>
            <div className="game-controls">
                <button id="spin-button" className="btn btn-primary" onClick={startSpin} disabled={isSpinning}>Spin Wheel</button>
            </div>
            <Link to="/game" className="back-link">← Back to Games</Link>
        </div>
    );
};

// --- APP ---
const App = () => (
    <BrowserRouter>
        <AppProvider>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="download" element={<Download />} />
                    <Route path="game" >
                        <Route index element={<GameDashboard />} />
                        <Route path="toss" element={<TossGame />} />
                        <Route path="spin" element={<SpinGame />} />
                    </Route>
                </Route>
            </Routes>
        </AppProvider>
    </BrowserRouter>
);

// --- RENDER ---
const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
