
import React, { useState, useEffect, useContext, createContext, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, NavLink, Outlet } from 'react-router-dom';

// --- TYPE DEFINITIONS ---
type SoundName = 'flip' | 'spin' | 'win' | 'lose' | 'click';

interface ToastMessage {
    id: number;
    message: string;
    type: 'success' | 'error';
}

interface AppContextType {
    coins: number;
    stakedCoins: number;
    addCoins: (amount: number) => void;
    subtractCoins: (amount: number) => void;
    stakeCoins: (amount: number) => void;
    unstakeCoins: (amount: number) => void;
    claimInterest: () => { success: boolean, message: string };
    lastInterestClaim: string | null;
    claimHourlyBonus: () => { success: boolean; message: string; };
    lastHourlyClaim: number | null;
    isMuted: boolean;
    toggleMute: () => void;
    playSound: (name: SoundName) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

// --- ICONS ---
const HomeIcon = ({ isActive }: { isActive: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
);
const TossIcon = ({ isActive }: { isActive: boolean }) => (
     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a10 10 0 0 0-10 10c0 4.42 2.87 8.17 6.84 9.5.6.11.82-.26.82-.57v-1.97c-2.78.6-3.37-1.34-3.37-1.34-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.84 2.81 1.31 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23.95-.26 1.98-.4 3-.4s2.05.13 3 .4c2.28-1.55 3.28-1.23 3.28-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .31.22.69.82.57A10 10 0 0 0 22 12c0-5.52-4.48-10-10-10z" />
    </svg>
);
const SpinIcon = ({ isActive }: { isActive: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
       <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4l2-2v4l-2-2m-18 6h18v7H3z"/><path d="M12 12v7"/><path d="M6 12v7"/><path d="M18 12v7"/>
    </svg>
);
const WalletIcon = ({ isActive }: { isActive: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12V8H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h12v4l4 2-4 2zm-8 4H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2z"/>
    </svg>
);
const ReferIcon = ({ isActive }: { isActive: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M12 2v2m-3 1.5V6m6 0v-1.5"/>
    </svg>
);

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
    const [stakedCoins, setStakedCoins] = useState<number>(() => parseInt(localStorage.getItem('tosssim_staked') || '0', 10));
    const [lastInterestClaim, setLastInterestClaim] = useState<string | null>(() => localStorage.getItem('tosssim_last_claim'));
    const [lastHourlyClaim, setLastHourlyClaim] = useState<number | null>(() => {
        const storedTime = localStorage.getItem('tosssim_last_hourly_claim');
        return storedTime ? parseInt(storedTime, 10) : null;
    });
    const [isMuted, setIsMuted] = useState<boolean>(() => localStorage.getItem('tosssim_muted') === 'true');
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const sounds = useRef<Record<string, HTMLAudioElement>>({});

    useEffect(() => {
        Object.keys(soundFiles).forEach(name => {
            sounds.current[name] = new Audio(soundFiles[name as SoundName]);
            sounds.current[name].preload = 'auto';
        });
    }, []);
    
    useEffect(() => { localStorage.setItem('tosssim_coins', coins.toString()); }, [coins]);
    useEffect(() => { localStorage.setItem('tosssim_staked', stakedCoins.toString()); }, [stakedCoins]);
    useEffect(() => { lastInterestClaim ? localStorage.setItem('tosssim_last_claim', lastInterestClaim) : localStorage.removeItem('tosssim_last_claim'); }, [lastInterestClaim]);
    useEffect(() => { lastHourlyClaim ? localStorage.setItem('tosssim_last_hourly_claim', lastHourlyClaim.toString()) : localStorage.removeItem('tosssim_last_hourly_claim'); }, [lastHourlyClaim]);
    useEffect(() => { localStorage.setItem('tosssim_muted', isMuted.toString()); }, [isMuted]);

    const addCoins = (amount: number) => setCoins(c => c + amount);
    const subtractCoins = (amount: number) => setCoins(c => c - amount);
    const toggleMute = () => setIsMuted(m => !m);
    
    const stakeCoins = (amount: number) => {
        if (amount > 0 && coins >= amount) {
            setCoins(c => c - amount);
            setStakedCoins(s => s + amount);
        }
    };
    
    const unstakeCoins = (amount: number) => {
        if (amount > 0 && stakedCoins >= amount) {
            setStakedCoins(s => s - amount);
            setCoins(c => c + amount);
        }
    };

    const claimInterest = () => {
        const today = new Date().toISOString().split('T')[0];
        if (lastInterestClaim === today) {
            return { success: false, message: 'Interest already claimed today.' };
        }
        if (stakedCoins <= 0) {
            return { success: false, message: 'Stake some coins to earn interest.' };
        }
        
        const interest = Math.floor(stakedCoins * 0.78);
        setStakedCoins(s => s + interest);
        setLastInterestClaim(today);
        return { success: true, message: `You earned ${interest.toLocaleString()} coins in interest!` };
    };

    const claimHourlyBonus = () => {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        if (lastHourlyClaim && (now - lastHourlyClaim < oneHour)) {
             return { success: false, message: 'You can only claim this once per hour.' };
        }
        addCoins(1000);
        setLastHourlyClaim(now);
        return { success: true, message: 'You claimed 1,000 coins!' };
    };

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

    const value = { coins, stakedCoins, addCoins, subtractCoins, isMuted, toggleMute, playSound, showToast, stakeCoins, unstakeCoins, claimInterest, lastInterestClaim, claimHourlyBonus, lastHourlyClaim };

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

    useEffect(() => { setToastList(toasts); }, [toasts]);

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
    const { coins, isMuted, toggleMute, playSound } = useAppContext();
    const handleToggle = () => {
        toggleMute();
        playSound('click');
    }
    return (
        <header>
            <div className="container">
                <div className="logo-container">
                     <span role="img" aria-label="target emoji">🎯</span>
                     <h1 className="logo">TossSim</h1>
                </div>
                <div className="header-controls">
                    <div className="balance">
                        <span role="img" aria-label="coin emoji">💰</span>
                        <span className="coin-balance">{coins.toLocaleString()}</span>
                    </div>
                    <button id="sound-toggle" className="sound-toggle" onClick={handleToggle} aria-label="Toggle Sound">
                        {isMuted ? '🔇' : '🔊'}
                    </button>
                </div>
            </div>
        </header>
    );
};

const BottomNav = () => {
    const { playSound } = useAppContext();
    const click = () => playSound('click');
    return (
        <nav className="bottom-nav">
             <NavLink to="/" className="nav-item" onClick={click}>
                {({isActive}) => (<><HomeIcon isActive={isActive} /><span>Home</span></>)}
            </NavLink>
            <NavLink to="/game/toss" className="nav-item" onClick={click}>
                 {({isActive}) => (<><TossIcon isActive={isActive} /><span>Toss</span></>)}
            </NavLink>
            <NavLink to="/game/spin" className="nav-item" onClick={click}>
                 {({isActive}) => (<><SpinIcon isActive={isActive} /><span>Spin</span></>)}
            </NavLink>
             <NavLink to="/wallet" className="nav-item" onClick={click}>
                 {({isActive}) => (<><WalletIcon isActive={isActive} /><span>Wallet</span></>)}
            </NavLink>
            <NavLink to="/referrals" className="nav-item" onClick={click}>
                 {({isActive}) => (<><ReferIcon isActive={isActive} /><span>Referrals</span></>)}
            </NavLink>
        </nav>
    );
}

const Layout = () => {
    return (
        <>
            <Header />
            <main>
                <Outlet />
            </main>
            <BottomNav />
        </>
    );
};

// --- PAGE COMPONENTS ---
const HourlyBonus = () => {
    const { claimHourlyBonus, lastHourlyClaim, showToast, playSound } = useAppContext();
    const ONE_HOUR = 60 * 60 * 1000;
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = Date.now();
            if (!lastHourlyClaim) {
                return 0;
            }
            const timeSinceClaim = now - lastHourlyClaim;
            return timeSinceClaim < ONE_HOUR ? ONE_HOUR - timeSinceClaim : 0;
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft(prevTime => (prevTime > 1000 ? prevTime - 1000 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [lastHourlyClaim, ONE_HOUR]);

    const handleClaim = () => {
        const result = claimHourlyBonus();
        if (result.success) {
            showToast(result.message, 'success');
            playSound('win');
        } else {
            showToast(result.message, 'error');
        }
    };

    const canClaim = timeLeft <= 0;
    const minutes = Math.floor((timeLeft / 1000 / 60) % 60).toString().padStart(2, '0');
    const seconds = Math.floor((timeLeft / 1000) % 60).toString().padStart(2, '0');

    return (
        <div className="card">
            <h3>🎁 Hourly Reward</h3>
            <p>Claim 1,000 free coins every hour!</p>
            <button 
                onClick={handleClaim} 
                disabled={!canClaim} 
                className="btn btn-secondary"
                style={{marginTop: '1rem', width: '100%'}}
            >
                {canClaim ? 'Claim 1,000 Coins' : `Next claim in ${minutes}:${seconds}`}
            </button>
        </div>
    );
};

const Home = () => {
    const { playSound } = useAppContext();
    return (
        <div className="container hero">
            <AdBanner />
            <h2>Welcome to TossSim!</h2>
            <p>The ultimate virtual coin game. Are you feeling lucky?</p>
            <img src="/assets/images/treasure.png" alt="Treasure chest full of coins" className="hero-image"/>
            <div className="button-group">
                <NavLink to="/game/toss" className="btn btn-primary" onClick={() => playSound('click')}>
                    Play Toss
                </NavLink>
                 <NavLink to="/game/spin" className="btn btn-secondary" onClick={() => playSound('click')}>
                    Play Spin
                </NavLink>
            </div>
             <div style={{marginTop: '2rem', width: '100%'}}>
                 <HourlyBonus />
            </div>
        </div>
    );
};

const AdBanner = () => {
    const adContainerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const container = adContainerRef.current;
        if (container && container.childElementCount === 0) {
            const scriptOptions = document.createElement('script');
            scriptOptions.type = 'text/javascript';
            scriptOptions.innerHTML = `
                atOptions = {
                    'key' : 'f71f4fbbfb3d6ebf34b5a498606309c2',
                    'format' : 'iframe',
                    'height' : 50,
                    'width' : 320,
                    'params' : {}
                };
            `;
            container.appendChild(scriptOptions);

            const scriptInvoke = document.createElement('script');
            scriptInvoke.type = 'text/javascript';
            scriptInvoke.src = '//www.highperformanceformat.com/f71f4fbbfb3d6ebf34b5a498606309c2/invoke.js';
            container.appendChild(scriptInvoke);
        }
    }, []);

    return <div ref={adContainerRef} className="ad-banner-react" style={{ margin: '0 auto 1.5rem auto' }}></div>;
};


const Referrals = () => {
    const { showToast, playSound } = useAppContext();
    const [referralCode, setReferralCode] = useState('');

    useEffect(() => {
        let code = localStorage.getItem('tosssim_referral_code');
        if (!code) {
            code = 'TOSSSIM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            localStorage.setItem('tosssim_referral_code', code);
        }
        setReferralCode(code);
    }, []);

    const handleCopyCode = () => {
        if (!navigator.clipboard) {
            showToast('Clipboard not available on your browser.', 'error');
            return;
        }
        navigator.clipboard.writeText(referralCode).then(() => {
            showToast('Referral code copied!', 'success');
            playSound('click');
        }, () => {
            showToast('Failed to copy code.', 'error');
        });
    };

    const handleShare = async () => {
        playSound('click');
        const downloadPageUrl = `${window.location.origin}/download.html`;
        const shareText = `I'm earning coins on TossSim! Use my code ${referralCode} to get a bonus when you sign up!`;

        const shareData = {
            title: 'Join me on TossSim!',
            text: shareText,
            url: downloadPageUrl,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error("Share failed:", err);
                    showToast('Could not share.', 'error');
                }
            }
        } else {
            navigator.clipboard.writeText(`${shareText} Download here: ${downloadPageUrl}`).then(() => {
                showToast('Share message copied to clipboard!', 'success');
            }, () => {
                showToast('Sharing not supported, failed to copy.', 'error');
            });
        }
    };
    
    return (
        <div className="container page-container">
            <AdBanner />
            <div className="card">
                <h2>Invite Friends, Earn Coins! 💸</h2>
                <p>Share your code. You and your friend will both get <strong>2,500 coins</strong> when they join!</p>
                <div className="referral-code-box">
                    <span>Your Code:</span>
                    <strong className="referral-code">{referralCode}</strong>
                </div>
                <div className="button-group" style={{marginTop: '1.5rem'}}>
                    <button onClick={handleCopyCode} className="btn">Copy Code</button>
                    <button onClick={handleShare} className="btn btn-primary">Share Link</button>
                </div>
            </div>

            <div className="card">
                 <h2>How it works</h2>
                 <ul className="how-it-works-list">
                    <li>1. Share your unique referral link or code.</li>
                    <li>2. Your friend downloads the app and enters your code.</li>
                    <li>3. You both instantly receive 2,500 bonus coins!</li>
                 </ul>
            </div>
        </div>
    );
};

const Wallet = () => {
    const { coins, stakedCoins, stakeCoins, unstakeCoins, claimInterest, showToast, playSound, lastInterestClaim } = useAppContext();
    const [stakeAmount, setStakeAmount] = useState('');
    const [unstakeAmount, setUnstakeAmount] = useState('');

    const handleStake = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseInt(stakeAmount, 10);
        if (isNaN(amount) || amount <= 0) {
            showToast('Please enter a valid amount.', 'error');
            return;
        }
        if (amount > coins) {
            showToast('Not enough coins to stake.', 'error');
            return;
        }
        stakeCoins(amount);
        showToast(`${amount.toLocaleString()} coins staked!`, 'success');
        playSound('win');
        setStakeAmount('');
    };

    const handleUnstake = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseInt(unstakeAmount, 10);
        if (isNaN(amount) || amount <= 0) {
            showToast('Please enter a valid amount.', 'error');
            return;
        }
        if (amount > stakedCoins) {
            showToast('Not enough staked coins.', 'error');
            return;
        }
        unstakeCoins(amount);
        showToast(`${amount.toLocaleString()} coins withdrawn.`, 'success');
        playSound('click');
        setUnstakeAmount('');
    };

    const handleClaim = () => {
        const result = claimInterest();
        if (result.success) {
            showToast(result.message, 'success');
            playSound('win');
        } else {
            showToast(result.message, 'error');
        }
    };
    
    const today = new Date().toISOString().split('T')[0];
    const canClaim = lastInterestClaim !== today;

    return (
        <div className="container page-container wallet-container">
            <AdBanner />
            <h2>My Wallet</h2>
            <div className="card wallet-balance-card">
                <h3>Staked Balance</h3>
                <p className="wallet-amount">{stakedCoins.toLocaleString()} 💰</p>
                <div className="interest-info">
                    <p>Earn <strong>78%</strong> daily interest!</p>
                    <button className="btn btn-secondary" onClick={handleClaim} disabled={!canClaim || stakedCoins <= 0}>
                        {canClaim ? 'Claim Interest' : 'Claimed Today'}
                    </button>
                </div>
            </div>

            <div className="stake-unstake-forms">
                <form className="card" onSubmit={handleStake}>
                    <h3>Stake Coins</h3>
                    <p>Your balance: {coins.toLocaleString()}</p>
                    <div className="bet-input">
                         <input
                            type="number"
                            placeholder="Amount to stake"
                            value={stakeAmount}
                            onChange={(e) => setStakeAmount(e.target.value)}
                            min="1"
                            aria-label="Stake amount"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">Stake</button>
                </form>

                <form className="card" onSubmit={handleUnstake}>
                    <h3>Withdraw Coins</h3>
                    <p>Staked: {stakedCoins.toLocaleString()}</p>
                     <div className="bet-input">
                        <input
                            type="number"
                            placeholder="Amount to withdraw"
                            value={unstakeAmount}
                            onChange={(e) => setUnstakeAmount(e.target.value)}
                            min="1"
                             aria-label="Unstake amount"
                        />
                    </div>
                    <button type="submit" className="btn">Withdraw</button>
                </form>
            </div>
        </div>
    );
};


const CoinShower = () => {
    const coinsArray = Array.from({ length: 30 });
    return (
        <div className="coin-shower-container" aria-hidden="true">
            {coinsArray.map((_, i) => (
                <div
                    key={i}
                    className="falling-coin"
                    style={{
                        left: `${Math.random() * 100}vw`,
                        animationDelay: `${Math.random() * 1.5}s`,
                        animationDuration: `${1.5 + Math.random()}s`
                    }}
                >
                    💰
                </div>
            ))}
        </div>
    );
};

const TossGame = () => {
    const { coins, addCoins, subtractCoins, playSound, showToast } = useAppContext();
    const [bet, setBet] = useState('');
    const [choice, setChoice] = useState<'heads' | 'tails' | null>(null);
    const [isFlipping, setIsFlipping] = useState(false);
    const [resultText, setResultText] = useState('Place your bet to start!');
    const [flipClass, setFlipClass] = useState('');
    const [glow, setGlow] = useState(false);
    const [showShower, setShowShower] = useState(false);
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
    
    const handleChoiceClick = (selectedChoice: 'heads' | 'tails') => {
        if (isFlipping) return;
        setChoice(selectedChoice);
        playSound('click');
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
                setShowShower(true);
                setTimeout(() => setShowShower(false), 3000);
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
            <AdBanner />
            {showShower && <CoinShower />}
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
                        placeholder="Enter your bet" 
                        min="1" 
                        value={bet}
                        onChange={(e) => setBet(e.target.value)}
                        disabled={isFlipping}
                        aria-label="Bet Amount"
                    />
                </div>
                <p>Choose your side:</p>
                <div className="choice-buttons">
                    <button className={`btn choice-btn ${choice === 'heads' ? 'active' : ''}`} onClick={() => handleChoiceClick('heads')}>Heads</button>
                    <button className={`btn choice-btn ${choice === 'tails' ? 'active' : ''}`} onClick={() => handleChoiceClick('tails')}>Tails</button>
                </div>
                <button id="toss-button" className="btn btn-primary" disabled={isTossDisabled} onClick={handleToss}>
                    {isFlipping ? 'Flipping...' : 'Toss Coin'}
                </button>
            </div>
        </div>
    );
};

const Confetti = () => {
    const pieces = Array.from({ length: 50 });
    const colors = ['#db7093', '#20b2aa', '#daa520', '#ff7f50', '#3cb371', '#4169e1', '#6a5acd'];
    return (
        <div className="confetti-container" aria-hidden="true">
            {pieces.map((_, i) => (
                <div
                    key={i}
                    className="confetti-piece"
                    style={{
                        left: `${Math.random() * 100}vw`,
                        animationDelay: `${Math.random() * 1}s`,
                        backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                        transform: `rotate(${Math.random() * 360}deg)`
                    }}
                ></div>
            ))}
        </div>
    );
};

const SpinGame = () => {
    const { coins, addCoins, subtractCoins, playSound, showToast } = useAppContext();
    const [isSpinning, setIsSpinning] = useState(false);
    const [resultText, setResultText] = useState('Spin the wheel for big prizes!');
    const [winningIndex, setWinningIndex] = useState<number | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const wheelRef = useRef<HTMLDivElement>(null);

    const wheelData = [
        { value: 500, color: '#db7093' }, { value: 50, color: '#20b2aa' },
        { value: 100, color: '#daa520' }, { value: 0, color: '#ff340f' },
        { value: 250, color: '#ff7f50' }, { value: 25, color: '#3cb371' },
        { value: 150, color: '#4169e1' }, { value: 10, color: '#6a5acd' }
    ];
    const sections = wheelData.map(d => d.value);
    const sectionAngle = 360 / sections.length;
    const spinCost = 25;

    const startSpin = () => {
        if (isSpinning) return;
        if (coins < spinCost) {
            showToast(`You need at least ${spinCost} coins.`, 'error');
            return;
        }

        setIsSpinning(true);
        setWinningIndex(null);
        setShowConfetti(false);
        setResultText('');
        subtractCoins(spinCost);
        playSound('spin');

        const wheel = wheelRef.current;
        if (!wheel) return;

        wheel.style.transition = 'none';
        
        const st = window.getComputedStyle(wheel, null);
        const tm = st.getPropertyValue("transform") || "none";
        if (tm !== "none") {
            const values = tm.split('(')[1].split(')')[0].split(',');
            Math.round(Math.atan2(parseFloat(values[1]), parseFloat(values[0])) * (180/Math.PI));
        }

        const randomSpins = Math.floor(Math.random() * 5) + 5;
        const randomStopAngle = Math.floor(Math.random() * 360);
        const totalRotation = (randomSpins * 360) + randomStopAngle;
        
        wheel.offsetHeight; 

        wheel.style.transition = 'transform 5s cubic-bezier(0.25, 0.1, 0.25, 1)';
        wheel.style.transform = `rotate(${totalRotation}deg)`;
    };

    useEffect(() => {
        const wheel = wheelRef.current;
        if (!wheel) return;

        const handleSpinEnd = () => {
            if (!isSpinning) return;
            
            const st = window.getComputedStyle(wheel, null);
            const tm = st.getPropertyValue("transform");
            const values = tm.split('(')[1].split(')')[0].split(',');
            const angle = Math.round(Math.atan2(parseFloat(values[1]), parseFloat(values[0])) * (180/Math.PI));
            const actualRotation = (angle < 0 ? angle + 360 : angle);
            
            const calculatedIndex = Math.floor((360 - actualRotation + (sectionAngle / 2)) % 360 / sectionAngle);
            const prize = sections[calculatedIndex];

            if (prize > 0) {
                setResultText(`You won ${prize} coins!`);
                showToast(`You won ${prize} coins!`, 'success');
                addCoins(prize);
                playSound('win');
                setWinningIndex(calculatedIndex);
                setShowConfetti(true);
                setTimeout(() => {
                    setWinningIndex(null);
                    setShowConfetti(false);
                }, 4000);
            } else {
                setResultText('Better luck next time!');
                showToast('You won 0 coins.', 'error');
                playSound('lose');
            }

            setIsSpinning(false);
        };

        wheel.addEventListener('transitionend', handleSpinEnd);
        return () => wheel.removeEventListener('transitionend', handleSpinEnd);
    }, [addCoins, playSound, showToast, subtractCoins, isSpinning, sections, sectionAngle]);

    return (
        <div className="container page-container">
            <AdBanner />
            {showConfetti && <Confetti />}
            <h2>Spin & Win</h2>
            <p className="spin-cost">Cost: 25 Coins per spin</p>
            <div className="wheel-container">
                <div className="wheel-pointer"></div>
                <div id="wheel" className="wheel" ref={wheelRef}>
                    {wheelData.map((data, index) => (
                        <div 
                            key={index} 
                            className={`wheel-section ${winningIndex === index ? 'winning' : ''}`} 
                            style={{ '--i': index, '--clr': data.color } as React.CSSProperties}
                        >
                            <span>{data.value}</span>
                        </div>
                    ))}
                </div>
            </div>
            <p id="spin-result" className="result-text">{resultText}</p>
            <div className="game-controls">
                <button id="spin-button" className="btn btn-primary" onClick={startSpin} disabled={isSpinning}>
                    {isSpinning ? 'Spinning...' : 'Spin Wheel'}
                </button>
            </div>
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
                    <Route path="referrals" element={<Referrals />} />
                    <Route path="wallet" element={<Wallet />} />
                    <Route path="game">
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
