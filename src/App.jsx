import React, { useState, useEffect, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Compass, Search, Trophy, Book, Download, MapPin, Globe, User } from 'lucide-react';

// Data
import { cities } from './data/cities';

// Imported Components
import TeleportOverlay from './components/TeleportOverlay';
import PlayerView from './components/PlayerView';
import SearchView from './components/SearchView';
import GameView from './components/GameView';
import FavoritesView from './components/FavoritesView';
import LeaderboardView from './components/LeaderboardView';
import SettingsPage from './components/Settings';
import GlobeView from './components/GlobeView';
import { playStampSound } from './utils/audio';
import FlyoverTransition from './components/FlyoverTransition';
// 👇 Firebase & Auth Imports
import { AuthProvider, useAuth } from './context/AuthContext';
import { db } from './firebase';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { broadcastAction } from './utils/broadcastService';
import LiveTravelFeed from './components/LiveTravelFeed';

const App = () => {
    // 👇 Get User Context
    const { user } = useAuth();

    // --- STATE ---
    const [activeTab, setActiveTab] = useState('discover');
    const [currentCity, setCurrentCity] = useState(cities.find(c => c.name === "Tashkent") || cities[0]);
    const [stations, setStations] = useState([]);
    const [currentStation, setCurrentStation] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [volume, setVolume] = useState(0.8);
    const [isMuted, setIsMuted] = useState(false);
    const [bgImage, setBgImage] = useState('');
    const [filterGenre, setFilterGenre] = useState(null);
    const [showCityMenu, setShowCityMenu] = useState(false);
    const [showSplash, setShowSplash] = useState(true);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [recents, setRecents] = useState(() => JSON.parse(localStorage.getItem('passport_recents')) || []);
    const [isTeleporting, setIsTeleporting] = useState(false);
    const [apiServer, setApiServer] = useState('https://de1.api.radio-browser.info');
    const [slideDirection, setSlideDirection] = useState(0);
    const audioRef = useRef(null);
    const [showStampBook, setShowStampBook] = useState(false);
    const [isHome, setIsHome] = useState(false);
    const [visitHistory, setVisitHistory] = useState(() => JSON.parse(localStorage.getItem('passport_visit_history')) || [cities.find(c => c.name === "Tashkent") || cities[0]]);    const [isFlying, setIsFlying] = useState(false);
    const [flyTarget, setFlyTarget] = useState(null);

    // 1. 🛡️ SAFETY FIX: Crash-proof State Initialization
    const [favorites, setFavorites] = useState(() => {
        try {
            const saved = localStorage.getItem('passport_favs');
            // Ensure we only return a valid Array, otherwise return []
            const parsed = saved ? JSON.parse(saved) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) { return []; }
    });

    const [travelLogs, setTravelLogs] = useState(() => {
        try {
            const saved = localStorage.getItem('passport_travel_logs');
            const parsed = saved ? JSON.parse(saved) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) { return []; }
    });
    
    // --- GAME STATE ---
    const [gameScore, setGameScore] = useState(0);
    const [gameRoundData, setGameRoundData] = useState(null);
    const [isGameLoading, setIsGameLoading] = useState(false);
    const [highScore, setHighScore] = useState(() => {
        const savedScore = localStorage.getItem('passport_highscore');
        return savedScore ? parseInt(savedScore, 10) : 0;
    });

    
    const [showHomelandInvite, setShowHomelandInvite] = useState(false);

    // --- PASSPORT ---
    const [showPassportProfile, setShowPassportProfile] = useState(false);
    const [userHome, setUserHome] = useState(localStorage.getItem('userHome') || '');

    // --- EFFECTS ---
// ⬆️ SYNC: Upload Local Data to Cloud on Login
    useEffect(() => {
        const syncLocalToCloud = async () => {
            if (user && Object.keys(travelLogs).length > 0) {
                try {
                    // Use setDoc with {merge:true} so we don't overwrite other fields
                    await setDoc(doc(db, 'users', user.uid), {
                        travelLogs: travelLogs, // Push local stamps to cloud
                        highScore: highScore,
                        favorites: favorites,
                        visitHistory: visitHistory
                    }, { merge: true });
                    console.log("✅ Local data synced to Cloud Account");
                } catch (e) {
                    console.error("Sync failed:", e);
                }
            }
        };

        syncLocalToCloud();
    }, [user]); // 👈 Runs once when 'user' changes (Login)

    // ☁️ SYNC: Real-time Data Listener (Syncs across devices)
    // ☁️ SYNC: Real-time Data Listener (The ONLY Listener you need)
    useEffect(() => {
        if (!user) return;

        const userRef = doc(db, 'users', user.uid);
        
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const cloudData = docSnap.data();
                
                // 1. Sync STAMPS (Time Spent - MAP)
                // 🛑 This now correctly treats it as an Object/Map, not an Array
                if (cloudData.travelLogs) {
                    setTravelLogs(prev => {
                        // Merge Cloud Map with Local Map
                        const safePrev = (typeof prev === 'object' && !Array.isArray(prev)) ? prev : {};
                        const mergedLogs = { ...safePrev, ...cloudData.travelLogs };
                        
                        localStorage.setItem('passport_travel_logs', JSON.stringify(mergedLogs));
                        return mergedLogs;
                    });
                }

                // 2. Sync HISTORY (Trips - ARRAY)
                if (cloudData.visitHistory) {
                    setVisitHistory(prev => {
                        const safePrev = Array.isArray(prev) ? prev : [];
                        const safeCloud = Array.isArray(cloudData.visitHistory) ? cloudData.visitHistory : [];
                        
                        // Merge Arrays and Deduplicate by timestamp
                        const merged = [...safePrev, ...safeCloud];
                        const uniqueHistory = Array.from(new Map(merged.map(item => [item.timestamp, item])).values());

                        localStorage.setItem('passport_visit_history', JSON.stringify(uniqueHistory));
                        return uniqueHistory;
                    });
                }

                // 3. Sync HIGH SCORE
                if (cloudData.highScore) {
                    setHighScore(prev => {
                        const bestScore = Math.max(prev, cloudData.highScore);
                        localStorage.setItem('passport_high_score', bestScore.toString());
                        return bestScore;
                    });
                }
                
                // 4. Sync FAVORITES
                if (cloudData.favorites) {
                    setFavorites(prev => {
                        const safePrev = Array.isArray(prev) ? prev : [];
                        const safeCloud = Array.isArray(cloudData.favorites) ? cloudData.favorites : [];

                        const allFavs = [...safePrev, ...safeCloud];
                        
                        // Deduplicate by Station UUID
                        const uniqueMap = new Map();
                        allFavs.forEach(station => {
                            if (station && station.stationuuid) {
                                uniqueMap.set(station.stationuuid, station);
                            }
                        });
                        const mergedFavs = Array.from(uniqueMap.values());

                        localStorage.setItem('passport_favs', JSON.stringify(mergedFavs)); 
                        return mergedFavs;
                    });
                }
                
                // 5. Sync HOME COUNTRY
                if (cloudData.homeCountry) {
                    setUserHome(cloudData.homeCountry);
                } else if (!cloudData.homeCountry && activeTab === 'favorites') {
                    setShowHomelandInvite(true);
                }
            } else {
                // Initialize new user
                setDoc(doc(db, 'users', user.uid), {
                    email: user.email,
                    favorites: [],
                    travelLogs: {}, // Initialize as Object
                    visitHistory: [], // Initialize as Array
                    highScore: 0
                }, { merge: true });
            }
        });

        return () => unsubscribe();
    }, [user]);
    
  

   // 💾 Helper: Save data to Firebase
    const saveToCloud = async (field, value) => {
        if (!user) return;
        try {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, { [field]: value }, { merge: true });
        } catch (error) {
            console.error("Error saving to cloud:", error);
        }
    };

// ✈️ TELEPORT HANDLER
const handlePassportTravel = (city) => {
    // 1. Start Animation
    setFlyTarget(city);
    setIsFlying(true);

    // 2. Wait for plane to "fly" (2.2 seconds)
    setTimeout(() => {
        setCurrentCity(city);
        setActiveTab('discover'); // Switch to player view

        // 3. Reset UI
        setTimeout(() => {
            setIsFlying(false);
            setFlyTarget(null);
        }, 500); // Small buffer to ensure seamless swap
    }, 2200);
};

    // 1. Find a Working API Server on Startup
    useEffect(() => {
        const resolveServer = async () => {
            try {
                const resp = await fetch('https://all.api.radio-browser.info/json/servers');
                const serverList = await resp.json();
                if (serverList && serverList.length > 0) {
                    const randomServer = serverList[Math.floor(Math.random() * serverList.length)];
                    setApiServer(`https://${randomServer.name}`);
                }
            } catch (e) { console.error("Server discovery failed, using default."); }
        };
        resolveServer();
    }, []);

    // 2. Track Listening Time & Play Sound Effects 🔊
    useEffect(() => {
        let interval;
        if (isPlaying && currentStation) {
            interval = setInterval(() => {
                setTravelLogs(prev => {
                    const country = currentStation.country || "International";
                    const iso = currentStation.countrycode || "xx";
                    const previousData = prev[country];

                    // Handle legacy data structure
                    const currentSeconds = (typeof previousData === 'number') ? previousData : (previousData?.time || 0);
                    const newTime = currentSeconds + 1;

                    // 🔊 SOUND TRIGGER LOGIC
                    if (newTime === 30 || newTime === 3600 || newTime === 18000) {
                        playStampSound();
                        if (navigator.vibrate) navigator.vibrate(200);
                    }

                    // Create new state
                    const newEntry = { time: newTime, iso: iso };
                    const newLogs = { ...prev, [country]: newEntry };
                    
                    // Save Local
                    localStorage.setItem('passport_travel_logs', JSON.stringify(newLogs));
                    
                    // 🌟 LEADERBOARD SYNC (Every 30s)
                    if (user && newTime % 30 === 0) {
                        saveToCloud('travelLogs', newLogs);
                        
                        // Calculate Total Time
                        const totalSeconds = Object.values(newLogs).reduce((acc, curr) => {
                            const t = typeof curr === 'number' ? curr : curr.time;
                            return acc + t;
                        }, 0);
                        saveToCloud('totalTime', totalSeconds);

                        // Sync Profile
                        saveToCloud('highScore', highScore);
                        saveToCloud('displayName', user.displayName);
                        saveToCloud('photoURL', user.photoURL);
                    }
                    
                    return newLogs;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, currentStation, user, highScore]);

    // 3. Splash Timer
    useEffect(() => {
        const timer = setTimeout(() => setShowSplash(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    // 4. PWA Install
    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setDeferredPrompt(null);
    };

    // 5. Persistence (Local Cache Only - Cloud saving is now handled manually in toggleFavorite)
    useEffect(() => { 
        if (Array.isArray(favorites)) {
            localStorage.setItem('passport_favs', JSON.stringify(favorites)); 
        }
    }, [favorites]);

    // Persist Home Base Changes
    useEffect(() => {
        if (userHome) localStorage.setItem('userHome', userHome);
        if (user) saveToCloud('userHome', userHome);
    }, [userHome, user]);
    useEffect(() => { localStorage.setItem('passport_recents', JSON.stringify(recents)); }, [recents]);

    // 6. Dynamic Background AND History Tracking
    useEffect(() => {
        const query = `${currentCity.name},${currentCity.country},architecture,city`;
        setBgImage(`https://source.unsplash.com/1600x900/?${query}&t=${new Date().getTime()}`);
        
        setVisitHistory(prev => {
            // 1. Prevent duplicates if the last city is the same
            if (prev.length > 0 && prev[prev.length - 1].name === currentCity.name) return prev;
            
            // 🧹 SANITIZE: Create a clean copy of the city without hidden 3D objects
            // This fixes the "custom Group object" error!
            const cleanCity = {
                name: currentCity.name,
                country: currentCity.country,
                lat: currentCity.lat,
                lng: currentCity.lng,
                population: currentCity.population || 0
            };
            
            // 2. Create new history with the CLEAN city
            const newHistory = [...prev, cleanCity];
            
            // 3. Save to Local Storage
            localStorage.setItem('passport_visit_history', JSON.stringify(newHistory));
            
            // 4. Save to Cloud (if logged in)
            if (user) saveToCloud('visitHistory', newHistory);
            
            return newHistory;
        });
    }, [currentCity, user]);

    // 7. Track Recently Played
    useEffect(() => {
        if (currentStation && isPlaying) {
            setRecents(prev => {
                const filtered = prev.filter(s => s.stationuuid !== currentStation.stationuuid);
                return [currentStation, ...filtered].slice(0, 5);
            });
        }
    }, [currentStation?.stationuuid, isPlaying]);

    // 8. Homeland Share Timer (30 Seconds)
    useEffect(() => {
        if (!currentStation || !userHome) return;

        const homeISO = (typeof userHome === 'object' && userHome.iso) ? userHome.iso.toLowerCase() : null;
        const homeName = (typeof userHome === 'string' ? userHome : userHome.name || userHome.city || "").toLowerCase();

        const stationISO = (currentStation.countrycode || "").toLowerCase();
        const stationCountry = (currentStation.country || "").toLowerCase();
        const stationCity = (currentStation.city || "").toLowerCase();
        
        let isHomeBase = false;

        if (homeISO && stationISO && homeISO === stationISO) {
            isHomeBase = true;
        } else if (homeName && (stationCountry.includes(homeName) || stationCity.includes(homeName) || homeName.includes(stationCountry))) {
            isHomeBase = true;
        }

        let timer;
        if (isHomeBase) {
            timer = setTimeout(() => {
                setShowHomelandInvite(true);
                const sound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                sound.volume = 0.2;
                sound.play().catch(() => {});
            }, 30000); 
        } else {
            setShowHomelandInvite(false);
        }

        return () => clearTimeout(timer);
    }, [currentStation, userHome]);

    // 9. Fetch Stations
    const fetchStations = async () => {
        if (!apiServer) return;
        
        // 1. Loading State (Don't stop the music! 🎵)
        setIsLoading(true);
        // setStations([]); // <--- DELETED (Prevents UI flashing)
        // setIsPlaying(false); // <--- DELETED (This was killing your auto-play!)

        try {
            let params = `countrycode=${currentCity.iso}&limit=100&order=votes&hidebroken=true`;
            if (filterGenre) params += `&tag=${encodeURIComponent(filterGenre)}`;

            const response = await fetch(`${apiServer}/json/stations/search?${params}`);
            let data = await response.json();
            let validStations = data.filter(s => s.url_resolved && s.url_resolved.startsWith('https'));

            validStations.sort((a, b) => {
                const cityTerm = currentCity.name.toLowerCase();
                const aHasCity = a.name.toLowerCase().includes(cityTerm) || (a.tags && a.tags.toLowerCase().includes(cityTerm));
                const bHasCity = b.name.toLowerCase().includes(cityTerm) || (b.tags && b.tags.toLowerCase().includes(cityTerm));
                if (aHasCity && !bHasCity) return -1;
                if (!aHasCity && bHasCity) return 1;
                return b.votes - a.votes;
            });

            const finalStations = validStations.slice(0, 30);
            setStations(finalStations);

            // 🛡️ SMART AUTO-TUNE (Sticky Logic)
            if (finalStations.length > 0) {
                setCurrentStation(prev => {
                    // Check if the currently playing station matches the country we just loaded.
                    const isSameCountry = prev && (
                        (prev.countrycode === currentCity.iso) || 
                        (prev.country === currentCity.country)
                    );

                    // A. If it's the same country (Favorite), KEEP IT & ENSURE PLAYING
                    if (isSameCountry) {
                        return prev; 
                    }

                    // B. If we just flew here casually, Auto-Play the #1 Station
                    return finalStations[0];
                });
            } else {
                setCurrentStation(null);
            }

        } catch (err) { console.error("Radio API Error:", err); }
        setIsLoading(false);
    };

    useEffect(() => {
        if (activeTab === 'discover') fetchStations();
    }, [currentCity, filterGenre, apiServer]);

    // 10. Audio Handling
    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => { console.error("Playback prevented:", error); setIsPlaying(false); });
                }
            } else { audioRef.current.pause(); }
        }
    }, [isPlaying, currentStation]);

    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
    }, [volume, isMuted]);

    // --- HANDLERS ---

    const toggleFavorite = () => {
        if (!currentStation) return;
        
        // 🛡️ SAFETY: Ensure favorites is an array
        const safeFavorites = Array.isArray(favorites) ? favorites : [];
        const isFavorite = safeFavorites.some(f => f.stationuuid === currentStation.stationuuid);
        let newFavorites;

        if (isFavorite) {
            newFavorites = safeFavorites.filter(f => f.stationuuid !== currentStation.stationuuid);
        } else {
            newFavorites = [...safeFavorites, currentStation];
            
            // Broadcast only on Add
            broadcastAction(user, 'favorited', {
                name: currentStation.country,
                country: currentStation.country,
                stationName: currentStation.name
            });
        }

        // Update State & Local Storage
        setFavorites(newFavorites);
        localStorage.setItem('passport_favs', JSON.stringify(newFavorites));
        
        // ☁️ SAVE TO CLOUD IMMEDIATELY (Manual Save)
        if (user) {
            updateDoc(doc(db, 'users', user.uid), { favorites: newFavorites }).catch(e => console.error("Save failed", e));
        }
    };

    const removeFavorite = (e, uuid) => {
        e.stopPropagation();
        const newFavorites = favorites.filter(f => f.stationuuid !== uuid);
        
        // Update State
        setFavorites(newFavorites);
        
        // Save to Cloud
        if (user) {
            updateDoc(doc(db, 'users', user.uid), { favorites: newFavorites }).catch(e => console.error("Remove failed", e));
        }
    };

    const handleTeleport = () => {
        setIsTeleporting(true);
        setTimeout(() => {
            setActiveTab('discover');
            let randomCity;
            do { randomCity = cities[Math.floor(Math.random() * cities.length)]; } while (randomCity.name === currentCity.name);
            setCurrentCity(randomCity);
            setFilterGenre(null);
            setIsTeleporting(false);
        }, 2500);
    };

    const changeStation = (direction) => {
        if (!stations.length || !currentStation) return;
        setSlideDirection(direction);
        setTimeout(() => setSlideDirection(0), 300);
        const currentIndex = stations.findIndex(s => s.stationuuid === currentStation.stationuuid);
        let nextIndex;
        if (direction === 1) nextIndex = (currentIndex + 1) % stations.length;
        else nextIndex = (currentIndex - 1 + stations.length) % stations.length;
        const nextStation = stations[nextIndex]; // 👈 Capture the station first
        setCurrentStation(nextStation);
        if (isPlaying) setIsPlaying(true);
        
        // 📡 BROADCAST TO THE WORLD
        broadcastAction(user, 'listening', {
            name: nextStation.country, 
            country: nextStation.country,
            stationName: nextStation.name
        });
    };

    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => changeStation(1),
        onSwipedRight: () => changeStation(-1),
        preventDefaultTouchmoveEvent: true,
        trackMouse: true
    });

    // --- GAME LOGIC ---
    const startNewGameRound = async () => {
        if (!apiServer) return;
        setIsGameLoading(true);
        setGameRoundData(null);
        try {
            const randomOffset = Math.floor(Math.random() * 500);
            const res = await fetch(`${apiServer}/json/stations/search?limit=1&offset=${randomOffset}&order=clickcount&hidebroken=true&https=true`);
            const data = await res.json();
            if (data && data.length > 0) {
                const secretStation = data[0];
                setCurrentStation(secretStation);
                setStations([secretStation]);
                setIsPlaying(true);
                setCurrentCity({ name: "???", country: "Guess the Country", iso: "XX" });
                const allCountries = [...new Set(cities.map(c => c.country))];
                const correctCountry = secretStation.country || "Unknown";
                const distractors = allCountries.filter(c => c !== correctCountry).sort(() => 0.5 - Math.random()).slice(0, 3);
                const options = [...distractors, correctCountry].sort(() => 0.5 - Math.random());
                setGameRoundData({ station: secretStation, options: options, correctAnswer: correctCountry, hasGuessed: false, userCorrect: false });
            }
        } catch (e) { console.error("Game Error:", e); setTimeout(startNewGameRound, 1000); } finally { setIsGameLoading(false); }
    };

    const handleGameGuess = (selectedCountry) => {
        if (gameRoundData.hasGuessed) return;
        const isCorrect = selectedCountry === gameRoundData.correctAnswer;
        setGameScore(prev => {
            if (isCorrect) {
                const newScore = prev + 1;
                if (newScore > highScore) { 
                    setHighScore(newScore); 
                    localStorage.setItem('passport_highscore', newScore); 
                    if (user) saveToCloud('highScore', newScore);
                }
                return newScore;
            } else return Math.max(0, prev - 1);
        });
        setGameRoundData(prev => ({ ...prev, hasGuessed: true, userCorrect: isCorrect }));
    };

    const handleGameSkip = () => {
        if (gameRoundData.hasGuessed) return;
        setGameRoundData(prev => ({ ...prev, hasGuessed: true, userCorrect: false }));
    };


    // --- RENDER ---
    return (
        <div className="relative h-[100dvh] bg-passport-dark text-white font-sans overflow-hidden flex flex-col">
            {/* Splash */}
            <div className={`absolute inset-0 z-[60] bg-passport-dark flex flex-col items-center justify-center transition-opacity duration-1000 ${showSplash ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="animate-pulse flex flex-col items-center">
                    <img src="/logo512.png" alt="Passport Radio" className="w-32 h-32 mb-6 drop-shadow-[0_0_15px_rgba(45,212,191,0.5)]" />
                    <p className="text-passport-teal text-sm font-medium tracking-widest uppercase opacity-80">"What you hear if you were there..."</p>
                </div>
            </div>

            {/* Background */}
            <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out" style={{ backgroundImage: `url(${bgImage})`, filter: 'brightness(0.5)' }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-passport-dark via-passport-dark/40 to-black/50"></div>

            {/* Header */}
            <header className="relative z-50 p-4 md:p-6 flex justify-between items-center backdrop-blur-md border-b border-white/10 shrink-0">
                
                {/* LEFT SIDE: Logo & Download Button */}
                <div className="flex items-center gap-3 md:gap-4">
                    <button onClick={() => setActiveTab('discover')} className="flex items-center hover:opacity-80 transition active:scale-95">
                        <img src="/wordmark.png" alt="Passport Radio" className="h-6 md:h-8 w-auto drop-shadow-lg" />
                    </button>

                    {/* Download Button - Now sits right next to the logo */}
                    {deferredPrompt && (
                        <button 
                            onClick={handleInstallClick} 
                            className="animate-pulse bg-white/10 text-passport-teal p-1.5 md:p-2 rounded-full border border-passport-teal/50 hover:bg-passport-teal hover:text-slate-900 transition flex items-center justify-center" 
                            title="Install App"
                        >
                            <Download size={18} />
                        </button>
                    )}
                </div>

                {/* RIGHT SIDE: Location & Teleport Only */}
                <div className="flex gap-2 md:gap-4 items-center">
                    <div className="relative">
                        <button onClick={() => setShowCityMenu(!showCityMenu)} className="flex items-center gap-1 md:gap-2 bg-white/10 px-3 py-2 rounded-full hover:bg-white/20 transition border border-white/20 backdrop-blur-md text-sm md:text-base">
                            <MapPin size={16} className="text-passport-teal" /><span className="font-semibold truncate max-w-[100px] md:max-w-none">{currentCity.name}</span>
                        </button>
                        {showCityMenu && (
                            <div className="absolute top-12 right-0 w-64 max-h-[60vh] overflow-y-auto bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl p-2 z-50 custom-scrollbar">
                                {[...new Set(cities.map(c => c.country))].sort().map(country => (
                                    <div key={country} className="mb-2">
                                        <div className="px-3 py-1 text-[10px] font-bold text-passport-teal uppercase tracking-widest opacity-70 sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10 border-b border-white/5 mb-1">{country}</div>
                                        {cities.filter(c => c.country === country).sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                                            <button key={c.name} onClick={() => { setCurrentCity(c); setShowCityMenu(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex justify-between group ${currentCity.name === c.name ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/70'}`}>
                                                <span className={`transition ${currentCity.name === c.name ? 'font-bold' : ''}`}>{c.name}</span>
                                                {currentCity.name === c.name && <div className="w-2 h-2 rounded-full bg-passport-teal"></div>}
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <button onClick={handleTeleport} className="bg-passport-teal text-slate-900 px-3 md:px-6 py-2 rounded-full font-bold hover:bg-teal-300 transition shadow-[0_0_15px_rgba(45,212,191,0.5)] flex items-center gap-2 text-sm md:text-base">
                        <Globe size={18} /><span className="hidden md:inline">TELEPORT</span>
                    </button>
                    {/* 2. User Avatar (To the Right) */}
                    {user && (
                        <button 
                            onClick={() => setShowPassportProfile(true)}
                            className="w-9 h-9 rounded-full border border-white/20 overflow-hidden shadow-lg active:scale-95 transition hover:border-passport-teal"
                        >
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                                    <User size={16} />
                                </div>
                            )}
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-grow overflow-hidden">
                {isTeleporting && <TeleportOverlay />}
                {isLoading && activeTab === 'discover' && !isTeleporting ? (
                    <div className="flex flex-col items-center justify-center h-full animate-pulse">
                        <img src="/loadingSpinner.gif" alt="Loading" className="w-24 h-24 object-contain" />
                        <p className="mt-4 text-passport-teal font-mono uppercase tracking-widest text-sm">Scanning Frequencies...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'discover' && (
                            <PlayerView 
                                currentStation={currentStation} 
                                currentCity={currentCity} 
                                isPlaying={isPlaying} 
                                setIsPlaying={setIsPlaying} 
                                toggleFavorite={toggleFavorite} 
                                favorites={favorites} 
                                stations={stations} 
                                changeStation={changeStation} 
                                isMuted={isMuted} 
                                setIsMuted={setIsMuted} 
                                volume={volume} 
                                setVolume={setVolume} 
                                filterGenre={filterGenre} 
                                setFilterGenre={setFilterGenre} 
                                swipeHandlers={swipeHandlers} 
                                slideDirection={slideDirection} 
                            />
                        )}

                        {activeTab === 'search' && (
                            <SearchView 
                                setCurrentCity={setCurrentCity} 
                                setActiveTab={setActiveTab} 
                                setFilterGenre={setFilterGenre} 
                            />
                        )}

                        {activeTab === 'game' && (
                            <GameView 
                                gameScore={gameScore} 
                                highScore={highScore} 
                                gameRoundData={gameRoundData} 
                                isGameLoading={isGameLoading} 
                                startNewGameRound={startNewGameRound} 
                                handleGameGuess={handleGameGuess} 
                                handleGameSkip={handleGameSkip} 
                            />
                        )}

                        {activeTab === 'leaderboard' && (
                    <LeaderboardView 
                        currentUser={user} 
                        onBack={() => setActiveTab('favorites')} 
                    />
                )}

                {activeTab === 'favorites' && (
                    <FavoritesView 
                                favorites={favorites} 
                                removeFavorite={removeFavorite} 
                                setCurrentStation={setCurrentStation}
                                setIsPlaying={setIsPlaying}
                                setActiveTab={setActiveTab}
                                showStampBook={showStampBook}
                                setShowStampBook={setShowStampBook}
                                travelLogs={travelLogs}
                                setShowPassportProfile={setShowPassportProfile}
                                showHomelandInvite={showHomelandInvite}
                                setShowHomelandInvite={setShowHomelandInvite}
                                currentStation={currentStation}
                                setCurrentCity={setCurrentCity}
                                onTravel={handlePassportTravel}
                            />
                        )}
                        {/* 4. NEW MAP TAB */}
                        {activeTab === 'map' && (
                            <GlobeView 
                                cities={cities} 
                                // 👇 PASS THE HISTORY HERE
                                visitHistory={visitHistory}
                                onSelectCity={(city) => {
                                    setCurrentCity(city);
                                    setActiveTab('discover');
                                }} 
                            />
                        )}
                    </>
                )}
            </main>

            {/* Navigation */}
            <nav className="relative z-50 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 p-2 shrink-0">
                <div className="flex justify-around items-center max-w-md mx-auto">
                    <button onClick={() => setActiveTab('discover')} className={`flex flex-col items-center p-2 transition ${activeTab === 'discover' ? 'text-passport-teal' : 'text-white/50 hover:text-white'}`}><Compass size={24} /><span className="text-[10px] mt-1 font-medium uppercase tracking-wider">Discover</span></button>
                    
                    {/* NEW MAP BUTTON */}
                    <button onClick={() => setActiveTab('map')} className={`flex flex-col items-center p-2 transition ${activeTab === 'map' ? 'text-passport-teal' : 'text-white/50 hover:text-white'}`}><Globe size={24} /><span className="text-[10px] mt-1 font-medium uppercase tracking-wider">Map</span></button>
                    
                    <button onClick={() => setActiveTab('search')} className={`flex flex-col items-center p-2 transition ${activeTab === 'search' ? 'text-passport-teal' : 'text-white/50 hover:text-white'}`}><Search size={24} /><span className="text-[10px] mt-1 font-medium uppercase tracking-wider">Search</span></button>
                    <button onClick={() => setActiveTab('game')} className={`flex flex-col items-center p-2 transition ${activeTab === 'game' ? 'text-passport-teal' : 'text-white/50 hover:text-white'}`}><Trophy size={24} /><span className="text-[10px] mt-1 font-medium uppercase tracking-wider">Game</span></button>
                    <button onClick={() => setActiveTab('favorites')} className={`flex flex-col items-center p-2 transition relative ${activeTab === 'favorites' ? 'text-passport-teal' : 'text-white/50 hover:text-white'}`}>
                        <Book size={24} />
                        {showHomelandInvite && (
                            <span className="absolute top-2 right-4 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                        )}
                        <span className="text-[10px] mt-1 font-medium uppercase tracking-wider">Passport</span>
                    </button>
                </div>
            </nav>
            <audio ref={audioRef} src={currentStation?.url_resolved} onError={(e) => { console.log("Stream failed:", e); changeStation(1); }} onEnded={() => changeStation(1)} />
            
            {/* ✈️ ANIMATION OVERLAY */}
              {isFlying && flyTarget && (
                <FlyoverTransition targetCity={flyTarget} />
              )}

            {/* Settings Modal */}
              {showPassportProfile && (
                <SettingsPage
                    userHome={userHome} 
                    setUserHome={setUserHome} 
                    onClose={() => setShowPassportProfile(false)}
                    // 👇 Pass data for sync
                    localDataForSync={{ favorites, travelLogs, userHome, highScore }} 
                />
            )}
            {/* 🟢 LIVE FEED TICKER */}
            {activeTab !== 'game' && (
                <LiveTravelFeed cities={cities} />
            )}
        </div>
    );
};

const AppWrapper = () => (
    <AuthProvider>
        <App />
    </AuthProvider>
);

export default AppWrapper;