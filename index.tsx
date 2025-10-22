

import React, { useState, useEffect, useContext, createContext, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, NavLink, Outlet, Navigate } from 'react-router-dom';

// --- TYPE DEFINITIONS ---
type SoundName = 'flip' | 'spin' | 'win' | 'lose' | 'click';

interface ToastMessage {
    id: number;
    message: string;
    type: 'success' | 'error';
}

interface Transaction {
    id: number;
    type: 'Deposit' | 'Withdrawal';
    amount: number;
    details: string;
    date: string;
    status: 'Completed' | 'Processing' | 'Failed';
}

interface Bet {
    id: number;
    game: 'Toss' | 'Spin';
    betAmount: number;
    outcome: 'Win' | 'Loss';
    payout: number;
    date: string;
}

interface User {
    username: string;
    balance: number;
    freePlays: {
        toss: number;
        spin: number;
    };
    referralCode: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    login: (username: string) => void;
    logout: () => void;
    updateBalance: (newBalance: number) => void;
    useFreePlay: (game: 'toss' | 'spin') => void;
}

interface AppContextType {
    transactions: Transaction[];
    bets: Bet[];
    isMuted: boolean;
    toggleMute: () => void;
    playSound: (name: SoundName) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
    addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => Promise<Transaction>;
    updateTransaction: (updatedTransaction: Transaction) => void;
    addBet: (bet: Omit<Bet, 'id'|'date'>) => void;
}


// --- ICONS ---
const HomeIcon = ({ isActive }: { isActive: boolean }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> );
const TossIcon = ({ isActive }: { isActive: boolean }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 0-10 10c0 4.42 2.87 8.17 6.84 9.5.6.11.82-.26.82-.57v-1.97c-2.78.6-3.37-1.34-3.37-1.34-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.84 2.81 1.31 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23.95-.26 1.98-.4 3-.4s2.05.13 3 .4c2.28-1.55 3.28-1.23 3.28-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .31.22.69.82.57A10 10 0 0 0 22 12c0-5.52-4.48-10-10-10z" /></svg> );
const SpinIcon = ({ isActive }: { isActive: boolean }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4l2-2v4l-2-2m-18 6h18v7H3z"/><path d="M12 12v7"/><path d="M6 12v7"/><path d="M18 12v7"/></svg> );
const WalletIcon = ({ isActive }: { isActive: boolean }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h12v4l4 2-4 2zm-8 4H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2z"/></svg> );
const ReferIcon = ({ isActive }: { isActive: boolean }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M12 2v2m-3 1.5V6m6 0v-1.5"/></svg> );
const LogoutIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> );

// --- SOUNDS ---
const soundFiles: Record<SoundName, string> = { flip: '/assets/sounds/flip.mp3', spin: '/assets/sounds/spin.mp3', win: '/assets/sounds/win.mp3', lose: '/assets/sounds/lose.mp3', click: '/assets/sounds/click.mp3' };

// --- CONTEXTS & PROVIDERS ---
const AuthContext = createContext<AuthContextType | null>(null);
const AppContext = createContext<AppContextType | null>(null);

const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};

const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppContext must be used within an AppProvider');
    return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem('tosssim_user'));
    const [user, setUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem('tosssim_user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    useEffect(() => {
        if (user) {
            localStorage.setItem('tosssim_user', JSON.stringify(user));
            setIsAuthenticated(true);
        } else {
            localStorage.removeItem('tosssim_user');
            setIsAuthenticated(false);
        }
    }, [user]);

    const login = (username: string) => {
        // TODO: Replace with API call to /api/login
        console.log(`Mock login for ${username}`);
        const mockUser: User = {
            username,
            balance: parseFloat(localStorage.getItem(`tosssim_balance_${username}`) || '25.00'),
            freePlays: JSON.parse(localStorage.getItem(`tosssim_freeplays_${username}`) || '{"toss":1,"spin":1}'),
            referralCode: `TOSSSIM-${username.toUpperCase()}`
        };
        setUser(mockUser);
    };

    const logout = () => {
        // TODO: Invalidate token on backend
        setUser(null);
    };

    const updateBalance = (newBalance: number) => {
        if (user) {
            const updatedUser = { ...user, balance: newBalance };
            setUser(updatedUser);
            localStorage.setItem(`tosssim_balance_${user.username}`, newBalance.toString());
        }
    };
    
    const useFreePlay = (game: 'toss' | 'spin') => {
        if(user) {
            const newFreePlays = {...user.freePlays};
            if(newFreePlays[game] > 0) {
                newFreePlays[game] -= 1;
                const updatedUser = {...user, freePlays: newFreePlays};
                setUser(updatedUser);
                localStorage.setItem(`tosssim_freeplays_${user.username}`, JSON.stringify(newFreePlays));
            }
        }
    };

    const value = { isAuthenticated, user, login, logout, updateBalance, useFreePlay };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [bets, setBets] = useState<Bet[]>([]);
    const [isMuted, setIsMuted] = useState<boolean>(() => localStorage.getItem('tosssim_muted') === 'true');
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const sounds = useRef<Record<string, HTMLAudioElement>>({});

    useEffect(() => {
        if (user) {
            setTransactions(JSON.parse(localStorage.getItem(`tosssim_transactions_${user.username}`) || '[]'));
            setBets(JSON.parse(localStorage.getItem(`tosssim_bets_${user.username}`) || '[]'));
        } else {
            setTransactions([]);
            setBets([]);
        }
    }, [user]);
    
    useEffect(() => { Object.keys(soundFiles).forEach(name => { sounds.current[name] = new Audio(soundFiles[name as SoundName]); sounds.current[name].preload = 'auto'; }); }, []);
    useEffect(() => { localStorage.setItem('tosssim_muted', isMuted.toString()); }, [isMuted]);

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

    const addTransaction = async (transaction: Omit<Transaction, 'id' | 'date'>): Promise<Transaction> => {
        if (!user) return Promise.reject("No user");
        const newTransaction: Transaction = { ...transaction, id: Date.now(), date: new Date().toLocaleString() };
        setTransactions(prev => {
            const updated = [newTransaction, ...prev];
            localStorage.setItem(`tosssim_transactions_${user.username}`, JSON.stringify(updated));
            return updated;
        });
        return newTransaction;
    };

    const updateTransaction = (updatedTransaction: Transaction) => {
        if (!user) return;
        setTransactions(prev => {
            const updated = prev.map(tx => tx.id === updatedTransaction.id ? updatedTransaction : tx);
            localStorage.setItem(`tosssim_transactions_${user.username}`, JSON.stringify(updated));
            return updated;
        });
    };

    const addBet = (bet: Omit<Bet, 'id'|'date'>) => {
        if (!user) return;
        const newBet: Bet = { ...bet, id: Date.now(), date: new Date().toLocaleString() };
        setBets(prev => {
            const updated = [newBet, ...prev];
            localStorage.setItem(`tosssim_bets_${user.username}`, JSON.stringify(updated));
            return updated;
        });
    };

    const value = { transactions, bets, isMuted, toggleMute, playSound, showToast, addTransaction, updateTransaction, addBet };

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
        const timer = setTimeout(() => { setShow(false); }, 3000);
        return () => clearTimeout(timer);
    }, []);
    return ( <div className={`toast ${message.type} ${show ? 'show' : ''}`} onTransitionEnd={() => !show && onClose()}> {message.message} </div> );
};

const ToastContainer: React.FC<{ toasts: ToastMessage[] }> = ({ toasts }) => {
    const [toastList, setToastList] = useState<ToastMessage[]>([]);
    useEffect(() => { setToastList(toasts); }, [toasts]);
    const handleClose = (id: number) => { setToastList(currentToasts => currentToasts.filter(toast => toast.id !== id)); };
    return ( <div id="toast-container"> {toastList.map(toast => ( <Toast key={toast.id} message={toast} onClose={() => handleClose(toast.id)} /> ))} </div> );
};

const Header = () => {
    const { user, logout } = useAuth();
    const { isMuted, toggleMute, playSound } = useAppContext();
    const handleToggle = () => { toggleMute(); playSound('click'); }
    const handleLogout = () => { playSound('click'); logout(); }
    
    return (
        <header>
            <div className="container">
                <div className="logo-container"> <span role="img" aria-label="target emoji">🎯</span> <h1 className="logo">TossSim</h1> </div>
                <div className="header-controls">
                    {user && (
                        <>
                        <div className="balance cash-balance"> <span role="img" aria-label="money bag emoji">💵</span> <span>₹{user.balance.toFixed(2)}</span> </div>
                        <button onClick={handleLogout} className="btn-icon" aria-label="Logout"><LogoutIcon /></button>
                        </>
                    )}
                    <button id="sound-toggle" className="sound-toggle" onClick={handleToggle} aria-label="Toggle Sound"> {isMuted ? '🔇' : '🔊'} </button>
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
{/* FIX: Changed NavLink children from destructured ({isActive}) to (props) to work around a potential type inference issue. */}
             <NavLink to="/" className="nav-item" onClick={click}>{(props) => (<><HomeIcon isActive={props.isActive} /><span>Home</span></>)}</NavLink>
            <NavLink to="/game/toss" className="nav-item" onClick={click}>{(props) => (<><TossIcon isActive={props.isActive} /><span>Toss</span></>)}</NavLink>
            <NavLink to="/game/spin" className="nav-item" onClick={click}>{(props) => (<><SpinIcon isActive={props.isActive} /><span>Spin</span></>)}</NavLink>
             <NavLink to="/wallet" className="nav-item" onClick={click}>{(props) => (<><WalletIcon isActive={props.isActive} /><span>Wallet</span></>)}</NavLink>
            <NavLink to="/referrals" className="nav-item" onClick={click}>{(props) => (<><ReferIcon isActive={props.isActive} /><span>Referrals</span></>)}</NavLink>
        </nav>
    );
}

const ProtectedLayout = () => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return (
        <> <Header /> <main> <Outlet /> </main> <BottomNav /> </>
    );
};


// --- PAGE COMPONENTS ---
const Home = () => {
    const { playSound } = useAppContext();
    const { user } = useAuth();
    return (
        <div className="container hero">
            <AdBanner />
            <h2>Welcome, {user?.username}!</h2>
            <p>The ultimate virtual coin game where you can earn real rewards.</p>
            <img src="/assets/images/treasure.png" alt="Treasure chest full of coins" className="hero-image"/>
            <div className="button-group">
                <NavLink to="/game/toss" className="btn btn-primary" onClick={() => playSound('click')}> Play Toss </NavLink>
                 <NavLink to="/game/spin" className="btn btn-secondary" onClick={() => playSound('click')}> Play Spin </NavLink>
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
            scriptOptions.innerHTML = `atOptions = {'key' : 'f71f4fbbfb3d6ebf34b5a498606309c2','format' : 'iframe','height' : 50,'width' : 320,'params' : {}};`;
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
    const { user } = useAuth();
    
    const handleCopyCode = () => {
        if (!user) return;
        navigator.clipboard.writeText(user.referralCode).then(() => {
            showToast('Referral code copied!', 'success');
            playSound('click');
        });
    };

    const handleShare = async () => {
        if (!user) return;
        playSound('click');
        const shareText = `I'm earning on TossSim! Use my code ${user.referralCode} to get a bonus free play when you sign up!`;
        if (navigator.share) {
            await navigator.share({ title: 'Join me on TossSim!', text: shareText, url: window.location.origin });
        } else {
            navigator.clipboard.writeText(`${shareText} Sign up at: ${window.location.origin}`).then(() => {
                showToast('Share message copied to clipboard!', 'success');
            });
        }
    };
    
    return (
        <div className="container page-container">
            <AdBanner />
            <div className="card">
                <h2>Invite Friends, Get Free Plays! 💸</h2>
                <p>Share your code. When a friend signs up, you'll both get <strong>1 free play</strong> for Toss or Spin!</p>
                <div className="referral-code-box">
                    <span>Your Code:</span>
                    <strong className="referral-code">{user?.referralCode}</strong>
                </div>
                <div className="button-group" style={{marginTop: '1.5rem'}}>
                    <button onClick={handleCopyCode} className="btn">Copy Code</button>
                    <button onClick={handleShare} className="btn btn-primary">Share Link</button>
                </div>
            </div>
        </div>
    );
};

const Wallet = () => {
    const { user, updateBalance } = useAuth();
    const { showToast, playSound, transactions, bets, addTransaction, updateTransaction } = useAppContext();
    
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawDetails, setWithdrawDetails] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleAddFunds = (amount: number) => {
        playSound('win');
        const newBalance = (user?.balance || 0) + amount;
        updateBalance(newBalance);
        addTransaction({type: 'Deposit', amount, details: 'Added to wallet', status: 'Completed'});
        showToast(`₹${amount.toFixed(2)} added to your balance!`, 'success');
    };
    
    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(withdrawAmount);
        if (!user || isNaN(amount) || amount <= 0) { showToast('Please enter a valid amount.', 'error'); return; }
        if (amount < 1) { showToast('Minimum withdrawal is ₹1.00.', 'error'); return; }
        if (amount > 5) { showToast('Maximum withdrawal is ₹5.00.', 'error'); return; }
        if (amount > user.balance) { showToast('Insufficient balance.', 'error'); return; }
        if (!withdrawDetails.trim()) { showToast('Please enter your UPI ID.', 'error'); return; }
        
        setIsProcessing(true);
        playSound('click');
        showToast('Submitting withdrawal request...', 'success');

        const pendingTx = await addTransaction({type: 'Withdrawal', amount, details: `To ${withdrawDetails}`, status: 'Processing'});
        
        // Simulate backend processing
        setTimeout(() => {
            const isSuccess = Math.random() > 0.2; // 80% success rate
            if (isSuccess) {
                const newBalance = user.balance - amount;
                updateBalance(newBalance);
                updateTransaction({ ...pendingTx, status: 'Completed' });
                showToast('Withdrawal successful!', 'success');
                playSound('win');
            } else {
                updateTransaction({ ...pendingTx, status: 'Failed' });
                showToast('Withdrawal failed. Please check details.', 'error');
                playSound('lose');
            }
            setIsProcessing(false);
            setWithdrawAmount('');
            setWithdrawDetails('');
        }, 3500);
    };

    return (
        <div className="container page-container">
            <AdBanner />
            <h2>My Wallet</h2>
            
            <div className="card">
                <h3>Current Balance</h3>
                <p className="cash-amount">₹{user?.balance.toFixed(2)}</p>
            </div>

            <div className="card">
                <h3>Add Funds</h3>
                <p>Select an amount to add instantly.</p>
                <div className="button-group" style={{flexDirection: 'row'}}>
                    <button onClick={() => handleAddFunds(1)} className="btn">₹1</button>
                    <button onClick={() => handleAddFunds(5)} className="btn">₹5</button>
                    <button onClick={() => handleAddFunds(10)} className="btn">₹10</button>
                </div>
            </div>

            <div className="card">
                <h3>Withdraw Funds</h3>
                <form onSubmit={handleWithdraw}>
                    <p>Withdraw to your bank via UPI (Min ₹1, Max ₹5).</p>
                    <div className="bet-input">
                        <input type="number" placeholder="Amount (₹)" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} min="1" max="5" step="0.01" required disabled={isProcessing} />
                    </div>
                    <div className="bet-input">
                        <input type="text" placeholder="Enter your UPI ID" value={withdrawDetails} onChange={(e) => setWithdrawDetails(e.target.value)} required disabled={isProcessing} />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={isProcessing}>{isProcessing ? 'Processing...' : 'Request Withdrawal'}</button>
                </form>
            </div>
            
            <div className="card">
                <h3>Bet History</h3>
                <div className="history-list">
                    {bets.length > 0 ? (
                        <ul> {bets.map(bet => ( <li key={bet.id}> <div className="tx-info"> <strong>{bet.game} - Bet ₹{bet.betAmount.toFixed(2)}</strong> <span>{bet.date}</span> </div> <div className={`tx-amount ${bet.outcome.toLowerCase()}`}> <strong>{bet.outcome}</strong> <span>{bet.outcome === 'Win' ? `+₹${bet.payout.toFixed(2)}` : `-₹${bet.betAmount.toFixed(2)}`}</span> </div> </li> ))} </ul>
                    ) : ( <p>No bets placed yet.</p> )}
                </div>
            </div>

            <div className="card">
                <h3>Transaction History</h3>
                <div className="history-list">
                    {transactions.length > 0 ? (
                        <ul> {transactions.map(tx => ( <li key={tx.id}> <div className="tx-info"> <strong>{tx.type}</strong> <span>{tx.date}</span> </div> <div className={`tx-amount ${tx.type.toLowerCase()} ${tx.status.toLowerCase()}`}> <strong>{tx.type === 'Deposit' ? `+₹${tx.amount.toFixed(2)}` : `-₹${tx.amount.toFixed(2)}`}</strong> <span className={`status ${tx.status.toLowerCase()}`}>{tx.status}</span> </div> </li> ))} </ul>
                    ) : ( <p>No transactions yet.</p> )}
                </div>
            </div>
        </div>
    );
};

// --- AUTH PAGES ---
const AuthLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="auth-container">
        <div className="logo-container"> <span role="img" aria-label="target emoji">🎯</span> <h1 className="logo">TossSim</h1> </div>
        {children}
    </div>
);

const LoginScreen = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim() && password.trim()) {
            login(username);
        }
    };

    return (
        <AuthLayout>
            <div className="card">
                <h2>Login</h2>
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn btn-primary">Login</button>
                    <p className="auth-switch">Don't have an account? <NavLink to="/register">Register</NavLink></p>
                </form>
            </div>
        </AuthLayout>
    );
};

const RegisterScreen = () => {
    const { login } = useAuth(); // Should be register, but we'll log in immediately
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: API call to /api/register
        console.log(`Mock registration for ${username}`);
        login(username); // Log in after mock registration
    };

    return (
        <AuthLayout>
            <div className="card">
                <h2>Register</h2>
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn btn-primary">Register</button>
                    <p className="auth-switch">Already have an account? <NavLink to="/login">Login</NavLink></p>
                </form>
            </div>
        </AuthLayout>
    );
};


const CoinShower = () => {
    const coinsArray = Array.from({ length: 30 });
    return (
        <div className="coin-shower-container" aria-hidden="true">
            {coinsArray.map((_, i) => (
                <div key={i} className="falling-coin" style={{ left: `${Math.random() * 100}vw`, animationDelay: `${Math.random() * 1.5}s`, animationDuration: `${1.5 + Math.random()}s` }} > 💰 </div>
            ))}
        </div>
    );
};

const TossGame = () => {
    const { user, updateBalance, useFreePlay } = useAuth();
    const { playSound, showToast, addBet } = useAppContext();
    const [bet, setBet] = useState('');
    const [choice, setChoice] = useState<'heads' | 'tails' | null>(null);
    const [isFlipping, setIsFlipping] = useState(false);
    const [resultText, setResultText] = useState('Place your bet to start!');
    const [flipClass, setFlipClass] = useState('');
    const [glow, setGlow] = useState(false);
    const [showShower, setShowShower] = useState(false);
    const coinRef = useRef<HTMLDivElement>(null);
    const hasFreePlay = (user?.freePlays.toss || 0) > 0;

    const handleToss = (useFree: boolean = false) => {
        const betAmount = parseInt(bet, 10);
        if (!choice || (!useFree && (!betAmount || betAmount <= 0))) { showToast('Invalid bet or choice.', 'error'); return; }
        if (!useFree && user && betAmount > user.balance) { showToast("You don't have enough balance.", 'error'); return; }
        
        setIsFlipping(true);
        setResultText('Flipping...');
        setGlow(false);
        setFlipClass('');
        playSound('flip');

        setTimeout(() => {
            const result: 'heads' | 'tails' = Math.random() < 0.5 ? 'heads' : 'tails';
            setFlipClass(result === 'heads' ? 'flip-heads' : 'flip-tails');
        }, 100);
    };
    
    useEffect(() => {
        const coinEl = coinRef.current;
        if (!coinEl || !isFlipping) return;
        
        const handleAnimationEnd = () => {
            const result = flipClass.includes('heads') ? 'heads' : 'tails';
            const isFreePlayUsed = hasFreePlay && (parseInt(bet, 10) === 0 || isNaN(parseInt(bet,10)) ); // A bit of a hacky check
            const betAmount = isFreePlayUsed ? 0 : parseInt(bet, 10);

            const didWin = choice === result;
            
            if (didWin) {
                const winnings = isFreePlayUsed ? 1.00 : Math.round(betAmount * 0.98 * 100) / 100;
                const newBalance = (user?.balance || 0) + winnings;
                updateBalance(newBalance);
                addBet({ game: 'Toss', betAmount, outcome: 'Win', payout: winnings });
                setResultText(`It's ${result}! You won ₹${winnings.toFixed(2)}!`);
                showToast(`You won ₹${winnings.toFixed(2)}!`, 'success');
                playSound('win');
                setGlow(true);
                setShowShower(true);
                setTimeout(() => setShowShower(false), 3000);
            } else {
                const newBalance = (user?.balance || 0) - betAmount;
                updateBalance(newBalance);
                addBet({ game: 'Toss', betAmount, outcome: 'Loss', payout: 0 });
                setResultText(`It's ${result}. You lost ₹${betAmount.toFixed(2)}.`);
                showToast(`You lost ₹${betAmount.toFixed(2)}.`, 'error');
                playSound('lose');
            }

            if (isFreePlayUsed) useFreePlay('toss');
            setIsFlipping(false);
            setChoice(null);
        };
        
        coinEl.addEventListener('animationend', handleAnimationEnd);
        return () => coinEl.removeEventListener('animationend', handleAnimationEnd);
    }, [isFlipping, flipClass]);

    const handleChoiceClick = (selectedChoice: 'heads' | 'tails') => { if (!isFlipping) { setChoice(selectedChoice); playSound('click'); }};
    const isTossDisabled = isFlipping || !choice || (!hasFreePlay && (!bet || parseInt(bet) <= 0));

    return (
        <div className="container page-container">
            <AdBanner /> {showShower && <CoinShower />} <h2>Toss & Earn</h2>
            <div className={`coin-container ${glow ? 'win-glow' : ''}`}>
                <div id="coin" ref={coinRef} className={flipClass}> <div className="side-a">H</div> <div className="side-b">T</div> </div>
            </div>
            <p className="result-text">{resultText}</p>
            <div className="game-controls">
                <div className="bet-input">
                    <label htmlFor="bet-amount">Bet Amount (₹):</label>
                    <input type="number" id="bet-amount" placeholder="Enter your bet" min="1" value={bet} onChange={(e) => setBet(e.target.value)} disabled={isFlipping || hasFreePlay} aria-label="Bet Amount" />
                </div>
                <p>Choose your side:</p>
                <div className="choice-buttons">
                    <button className={`btn choice-btn ${choice === 'heads' ? 'active' : ''}`} onClick={() => handleChoiceClick('heads')}>Heads</button>
                    <button className={`btn choice-btn ${choice === 'tails' ? 'active' : ''}`} onClick={() => handleChoiceClick('tails')}>Tails</button>
                </div>
                {hasFreePlay ? (
                    <button className="btn btn-secondary" disabled={isFlipping || !choice} onClick={() => handleToss(true)}> Use Free Play (Win ₹1) </button>
                ) : (
                    <button id="toss-button" className="btn btn-primary" disabled={isTossDisabled} onClick={() => handleToss(false)}> {isFlipping ? 'Flipping...' : 'Toss Coin'} </button>
                )}
            </div>
        </div>
    );
};

const SpinGame = () => { return <div className="container page-container"><p>Spin Game coming soon!</p></div> } // Placeholder

// --- APP ---
const App = () => {
    const { isAuthenticated } = useAuth();
    return (
        <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<RegisterScreen />} />
            <Route path="/" element={<ProtectedLayout />}>
                <Route index element={<Home />} />
                <Route path="referrals" element={<Referrals />} />
                <Route path="wallet" element={<Wallet />} />
                <Route path="game/toss" element={<TossGame />} />
                <Route path="game/spin" element={<SpinGame />} />
            </Route>
        </Routes>
    );
};

const AppWrapper = () => (
    <BrowserRouter>
        <AuthProvider>
            <AppProvider>
                <App />
            </AppProvider>
        </AuthProvider>
    </BrowserRouter>
);

// --- RENDER ---
const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<AppWrapper />);
}