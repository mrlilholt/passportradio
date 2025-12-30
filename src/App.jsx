import React, { useState, useEffect, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Play, Pause, Globe, Heart, SkipForward, SkipBack, Search, MapPin, Radio, Volume2, VolumeX, Compass, Book, Loader, Download, Trophy, AlertCircle, Clock, Home, X, Tent, Castle, FlagTriangleRight, Stamp } from 'lucide-react';import { cities, genres } from './data/cities';

const App = () => {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('discover'); 
  const [currentCity, setCurrentCity] = useState(cities.find(c => c.name === "Tashkent") || cities[0]);
  const [stations, setStations] = useState([]);
  const [currentStation, setCurrentStation] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('passport_favs')) || []);
  const [bgImage, setBgImage] = useState('');
  const [filterGenre, setFilterGenre] = useState(null);
  const [showCityMenu, setShowCityMenu] = useState(false);
  const [showSplash, setShowSplash] = useState(true); // Default to true so it shows on load
  const [deferredPrompt, setDeferredPrompt] = useState(null); // Stores the install event
  const [favSearchTerm, setFavSearchTerm] = useState("");
  // New State for Recents & Teleport
  const [recents, setRecents] = useState(() => JSON.parse(localStorage.getItem('passport_recents')) || []);
  const [isTeleporting, setIsTeleporting] = useState(false);
  
  // API Server State
  const [apiServer, setApiServer] = useState('https://de1.api.radio-browser.info'); 

  // Animation state
  const [slideDirection, setSlideDirection] = useState(0); 

  const audioRef = useRef(null);

// --- GAME STATE ---
  const [gameScore, setGameScore] = useState(0);
  const [gameRoundData, setGameRoundData] = useState(null); 
  const [isGameLoading, setIsGameLoading] = useState(false);
// Initialize from Local Storage (or default to 0)
  const [highScore, setHighScore] = useState(() => {
      const savedScore = localStorage.getItem('passport_highscore');
      return savedScore ? parseInt(savedScore, 10) : 0;
  });  // --- EFFECTS ---
// --- TRAVEL LOGS (Time Tracking) ---
  const [travelLogs, setTravelLogs] = useState(() => {
      return JSON.parse(localStorage.getItem('passport_travel_logs')) || {};
  });
  // 1. Find a Working API Server on Startup
  useEffect(() => {
    const resolveServer = async () => {
        try {
            const resp = await fetch('https://all.api.radio-browser.info/json/servers');
            const serverList = await resp.json();
            if(serverList && serverList.length > 0) {
                const randomServer = serverList[Math.floor(Math.random() * serverList.length)];
                setApiServer(`https://${randomServer.name}`);
            }
        } catch (e) {
            console.error("Server discovery failed, using default.");
        }
    };
    resolveServer();
  }, []);
// --- TRACK LISTENING TIME ---
  useEffect(() => {
    let interval;
    if (isPlaying && currentStation) {
        interval = setInterval(() => {
            setTravelLogs(prev => {
                const country = currentStation.country || "International";
                // Get ISO code (default to 'xx' if missing)
                const iso = currentStation.countrycode || "xx"; 
                
                // Handle legacy data (if you already have logs saved as just numbers)
                const previousData = prev[country];
                const currentSeconds = (typeof previousData === 'number') ? previousData : (previousData?.time || 0);
                
                // Save both Time AND ISO code
                const newEntry = { 
                    time: currentSeconds + 1, 
                    iso: iso 
                };
                
                const newLogs = { ...prev, [country]: newEntry };
                localStorage.setItem('passport_travel_logs', JSON.stringify(newLogs));
                return newLogs;
            });
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStation]);

// Handle Splash Screen Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000); // 3000ms = 3 seconds

    return () => clearTimeout(timer);
  }, []);
// Listen for the "Before Install Prompt" event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Handler for the Install Button
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, so clear it
    setDeferredPrompt(null);
  };

  // 2. Persistence (Favorites)
  useEffect(() => {
    localStorage.setItem('passport_favs', JSON.stringify(favorites));
  }, [favorites]);

  const playRandomFavorite = () => {
    if (favorites.length === 0) return;
    const randomIndex = Math.floor(Math.random() * favorites.length);
    const randomStation = favorites[randomIndex];
    
    // FIX: Update the location context so the UI matches the station
    setCurrentCity({
        name: randomStation.state || randomStation.country || "Passport Selection",
        country: randomStation.country || "Saved Station",
        iso: randomStation.countrycode || "US"
    });
    
    // Play it
    setCurrentStation(randomStation);
    setStations([randomStation]); 
    setIsPlaying(true);
  };
  
  // 3. Persistence (Recents)
  useEffect(() => {
    localStorage.setItem('passport_recents', JSON.stringify(recents));
  }, [recents]);

  // 4. Dynamic Background
  useEffect(() => {
    const query = `${currentCity.name},${currentCity.country},architecture,city`;
    setBgImage(`https://source.unsplash.com/1600x900/?${query}&t=${new Date().getTime()}`);
  }, [currentCity]);

  // 5. Track Recently Played
  useEffect(() => {
    if (currentStation && isPlaying) {
        setRecents(prev => {
            const filtered = prev.filter(s => s.stationuuid !== currentStation.stationuuid);
            return [currentStation, ...filtered].slice(0, 5); 
        });
    }
  }, [currentStation?.stationuuid, isPlaying]);

  // 6. ISO-STRICT Fetch
  const fetchStations = async () => {
    if (!apiServer) return; 
    
    setIsLoading(true);
    setStations([]); 
    setIsPlaying(false);
    
    try {
      let params = `countrycode=${currentCity.iso}&limit=100&order=votes&hidebroken=true`;
      
      if (filterGenre) {
          params += `&tag=${encodeURIComponent(filterGenre)}`;
      }

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
      
      if (finalStations.length > 0) {
        setCurrentStation(finalStations[0]); 
      } else {
        setCurrentStation(null);
      }
      
    } catch (err) {
      console.error("Radio API Error:", err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'discover') {
        fetchStations();
    }
  }, [currentCity, filterGenre, apiServer]); 

  // Audio Handling
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error("Playback prevented:", error);
                setIsPlaying(false);
            });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentStation]);

  useEffect(() => {
    if(audioRef.current) {
        audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // --- HANDLERS ---
  const toggleFavorite = () => {
    if (!currentStation) return;
    const exists = favorites.find(f => f.stationuuid === currentStation.stationuuid);
    if (exists) {
      setFavorites(favorites.filter(f => f.stationuuid !== currentStation.stationuuid));
    } else {
      setFavorites([...favorites, currentStation]);
    }
  };

  const handleTeleport = () => {
    setIsTeleporting(true);
    setTimeout(() => {
        setActiveTab('discover');
        let randomCity;
        do {
            randomCity = cities[Math.floor(Math.random() * cities.length)];
        } while (randomCity.name === currentCity.name);
        
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
    if (direction === 1) { 
        nextIndex = (currentIndex + 1) % stations.length;
    } else { 
        nextIndex = (currentIndex - 1 + stations.length) % stations.length;
    }
    setCurrentStation(stations[nextIndex]);
    if (isPlaying) setIsPlaying(true); 
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => changeStation(1),
    onSwipedRight: () => changeStation(-1),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  const startNewGameRound = async () => {
    // 1. Use your existing apiServer (no need to find a new one!)
    if (!apiServer) return; 

    setIsGameLoading(true);
    setGameRoundData(null);

    try {
      // 2. THE NEW TRICK: Pick a random number between 0 and 500
      // We will ask for the "Top 500" stations but grab just ONE random specific one.
      const randomOffset = Math.floor(Math.random() * 500);

      // 3. Fetch with 'offset' (Lightning fast, no server crashes)
      const res = await fetch(`${apiServer}/json/stations/search?limit=1&offset=${randomOffset}&order=clickcount&hidebroken=true&https=true`);
      const data = await res.json();
      
      if (data && data.length > 0) {
        const secretStation = data[0];
        
        // Play the audio
        setCurrentStation(secretStation);
        setStations([secretStation]); 
        setIsPlaying(true);
        // Hide location in the header
        setCurrentCity({ name: "???", country: "Guess the Country", iso: "XX" });

        // Generate Options (Correct Answer + 3 Wrong ones)
        const allCountries = [...new Set(cities.map(c => c.country))];
        const correctCountry = secretStation.country || "Unknown";
        
        const distractors = allCountries
            .filter(c => c !== correctCountry)
            .sort(() => 0.5 - Math.random()) // Shuffle
            .slice(0, 3); // Take 3

        const options = [...distractors, correctCountry].sort(() => 0.5 - Math.random());

        setGameRoundData({
            station: secretStation,
            options: options,
            correctAnswer: correctCountry,
            hasGuessed: false,
            userCorrect: false
        });
      }
    } catch (e) {
      console.error("Game Error:", e);
      // If it fails, just try again automatically once
      setTimeout(startNewGameRound, 1000);
    } finally {
        setIsGameLoading(false);
    }
  };
  // --- GAME HANDLERS ---
  const handleGameGuess = (selectedCountry) => {
    if (gameRoundData.hasGuessed) return; 

    const isCorrect = selectedCountry === gameRoundData.correctAnswer;
    
    setGameScore(prev => {
        if (isCorrect) {
            // Correct: +1 Point
            const newScore = prev + 1;
            
            // Check for new High Score
            if (newScore > highScore) {
                setHighScore(newScore);
                localStorage.setItem('passport_highscore', newScore);
            }
            return newScore;
        } else {
            // Wrong: -1 Point (Floor at 0 so we don't go negative)
            return Math.max(0, prev - 1);
        }
    });

    setGameRoundData(prev => ({
        ...prev,
        hasGuessed: true,
        userCorrect: isCorrect
    }));
  };

  const handleGameSkip = () => {
      if (gameRoundData.hasGuessed) return;
      // "Skip" counts as a wrong guess (no points), but reveals the answer
      setGameRoundData(prev => ({
          ...prev,
          hasGuessed: true,
          userCorrect: false
      }));
  };
  
  // --- SUB-COMPONENTS ---

  const SearchView = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if(!query) return;
        setSearching(true);
        try {
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`);
            const data = await res.json();
            if(data.results) setResults(data.results);
            else setResults([]);
        } catch(err) { console.error(err); }
        setSearching(false);
    };

    const selectLocation = (place) => {
        const newCity = {
            name: place.name,
            country: place.country,
            iso: place.country_code,
            lat: place.latitude,
            lng: place.longitude
        };
        setCurrentCity(newCity);
        setActiveTab('discover');
        setFilterGenre(null);
    };

    
    return (
        <div className="flex flex-col h-full p-4 w-full max-w-md mx-auto pt-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Globe className="text-passport-teal" /> Global Search
            </h2>
            <form onSubmit={handleSearch} className="relative mb-6">
                <input 
                    type="text" 
                    placeholder="Type a city (e.g. Kyoto, Lima)..." 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pl-10 focus:outline-none focus:border-passport-teal text-white placeholder-white/40"
                    autoFocus
                />
                <Search className="absolute left-3 top-3.5 text-white/40" size={18} />
                <button type="submit" className="absolute right-2 top-2 bg-passport-teal text-slate-900 px-3 py-1.5 rounded-lg text-sm font-bold">GO</button>
            </form>
            <div className="flex-1 overflow-y-auto space-y-2 pb-20">
                {searching ? (
                    <div className="flex justify-center py-10 opacity-50"><Loader className="animate-spin"/></div>
                ) : results.map((place) => (
                    <button key={place.id} onClick={() => selectLocation(place)} className="w-full bg-black/20 hover:bg-white/10 border border-white/5 p-3 rounded-lg flex items-center justify-between group transition text-left">
                        <div>
                            <div className="font-bold text-lg">{place.name}</div>
                            <div className="text-white/50 text-sm">{place.admin1 ? `${place.admin1}, ` : ''}{place.country}</div>
                        </div>
                        <img src={`https://flagsapi.com/${place.country_code}/flat/64.png`} className="w-8 h-8 object-contain" onError={(e) => e.target.style.display = 'none'} alt={place.country_code}/>
                    </button>
                ))}
                {results.length === 0 && query && !searching && <div className="text-center text-white/30 mt-10">No places found.</div>}
            </div>
        </div>
    );
  };
const GameView = () => (
    <div className="p-6 flex flex-col items-center h-full animate-fade-in pb-24 overflow-y-auto">
        {/* Score Board */}
        <div className="w-full flex justify-between items-center mb-6 bg-white/5 p-4 rounded-2xl border border-white/10 shrink-0">
            <div className="flex items-center gap-3">
                <div className="bg-passport-teal text-slate-900 p-2 rounded-lg">
                    <Trophy size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-lg leading-none">Score: {gameScore}</h3>
                    <p className="text-xs text-white/50 uppercase tracking-widest mt-1">Session Best: <span className="text-passport-teal font-bold">{highScore}</span></p>
                </div>
            </div>
            {/* Visual indicator of high score */}
            {gameScore > 0 && gameScore >= highScore && (
                <div className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full border border-yellow-500/50 animate-pulse">
                    NEW RECORD!
                </div>
            )}
        </div>

        {/* Game Area */}
        <div className="flex-1 w-full max-w-sm flex flex-col justify-center items-center">
            {!gameRoundData && !isGameLoading && (
                <div className="text-center">
                    <Globe size={64} className="mx-auto text-passport-teal mb-4 animate-pulse" />
                    <h2 className="text-2xl font-bold mb-2">Ready to Travel?</h2>
                    <p className="text-white/60 mb-6">Listen to a random radio station and guess where it is broadcasting from.</p>
                    <button 
                        onClick={startNewGameRound}
                        className="bg-white text-passport-dark font-bold px-8 py-3 rounded-full text-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition active:scale-95"
                    >
                        Start Game
                    </button>
                </div>
            )}

            {isGameLoading && (
                <div className="flex flex-col items-center animate-pulse">
                    <Loader className="animate-spin mb-4 text-passport-teal" size={48} />
                    <p className="text-sm font-bold uppercase tracking-widest">Tuning in...</p>
                </div>
            )}

            {gameRoundData && (
                <div className="w-full space-y-4 animate-fade-in">
                    {/* The "Hidden" Radio */}
                    <div className="relative w-32 h-32 mx-auto bg-black/50 rounded-full border-4 border-white/10 flex items-center justify-center mb-6 shadow-xl">
                        {gameRoundData.hasGuessed ? (
                            <img src={gameRoundData.station.favicon} onError={(e)=>e.target.style.display='none'} className="w-full h-full object-cover rounded-full opacity-80" />
                        ) : (
                            <div className="animate-pulse">
                                <Radio size={48} className="text-white/50" />
                            </div>
                        )}
                        {/* Status Icon */}
                        {gameRoundData.hasGuessed && (
                             <div className={`absolute -bottom-2 -right-2 p-2 rounded-full border-2 border-white ${gameRoundData.userCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                                 {gameRoundData.userCorrect ? <Trophy size={20} className="text-white"/> : <AlertCircle size={20} className="text-white"/>}
                             </div>
                        )}
                    </div>

                    <h3 className="text-center text-xl font-bold mb-4">
                        {gameRoundData.hasGuessed 
                            ? (gameRoundData.userCorrect ? "Correct! +1 Point" : `Nope! It was ${gameRoundData.correctAnswer}`) 
                            : "Where is this station?"}
                    </h3>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 gap-3">
                        {gameRoundData.options.map((country, idx) => {
                            let btnClass = "bg-white/10 hover:bg-white/20 border-white/10";
                            if (gameRoundData.hasGuessed) {
                                if (country === gameRoundData.correctAnswer) btnClass = "bg-green-500 text-white border-green-500";
                                else if (country !== gameRoundData.correctAnswer && !gameRoundData.userCorrect) btnClass = "opacity-50 bg-red-500/20"; 
                            }
                            return (
                                <button 
                                    key={idx}
                                    disabled={gameRoundData.hasGuessed}
                                    onClick={() => handleGameGuess(country)}
                                    className={`p-4 rounded-xl border font-bold text-left transition-all ${btnClass}`}
                                >
                                    {country}
                                </button>
                            )
                        })}
                    </div>
                    
                    {/* SKIP BUTTON (Only shows while guessing) */}
                    {!gameRoundData.hasGuessed && (
                        <button 
                            onClick={handleGameSkip}
                            className="w-full mt-2 py-3 text-white/40 hover:text-white text-sm font-bold uppercase tracking-widest transition"
                        >
                            Skip / Give Up
                        </button>
                    )}

                    {/* NEXT ROUND BUTTON (Only shows after guess/skip) */}
                    {gameRoundData.hasGuessed && (
                        <button 
                            onClick={startNewGameRound}
                            className="w-full mt-6 bg-white text-passport-dark font-bold py-3 rounded-xl hover:scale-105 transition shadow-lg"
                        >
                            Next Round →
                        </button>
                    )}
                </div>
            )}
        </div>
    </div>
  );
  const PlayerView = () => (
      <div className="w-full flex flex-col h-full px-4 overflow-hidden relative">
        
        {/* Genre Pills 
            - 'z-30' keeps it on top
            - Added 'mb-2' for safety spacing 
        */}
        <div className="w-full max-w-lg flex gap-2 overflow-x-auto pt-6 pb-2 mb-2 no-scrollbar mask-edges shrink-0 relative z-30 mx-auto">
            <button 
                onClick={() => setFilterGenre(null)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition flex-shrink-0 shadow-sm ${!filterGenre ? 'bg-white text-passport-dark' : 'bg-black/40 text-white border border-white/20'}`}>
                All Vibes
            </button>
            {genres.map(g => (
                <button 
                    key={g.id}
                    onClick={() => setFilterGenre(g.id === filterGenre ? null : g.id)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition flex-shrink-0 border border-white/10 shadow-sm ${filterGenre === g.id ? 'bg-passport-teal text-slate-900 border-passport-teal' : 'bg-black/40 text-white hover:bg-white/10'}`}>
                    {g.label}
                </button>
            ))}
        </div>

        {/* Swipeable Card Area 
            - REMOVED 'justify-center' (this was causing the overlap)
            - Kept 'flex-1' to fill space
        */}
        <div {...swipeHandlers} className="flex-1 w-full max-w-md mx-auto relative perspective-1000 min-h-0 flex flex-col pb-6">
            
            {/* Safe Centering Wrapper 
                - 'my-auto' centers this block vertically if there's room, 
                  but prevents it from pushing up into the header if space is tight.
            */}
            <div className="my-auto w-full">
                <div className={`w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl transition-transform duration-300 ease-out flex flex-col
                    ${slideDirection === 1 ? 'translate-x-[-20px] opacity-50' : ''}
                    ${slideDirection === -1 ? 'translate-x-[20px] opacity-50' : ''}
                    ${slideDirection === 0 ? 'translate-x-0 opacity-100' : ''}
                `}>
                    
                    {/* Station Art */}
                    <div className="relative group aspect-square w-full max-h-[35vh] mx-auto rounded-2xl overflow-hidden bg-black/50 mb-4 shadow-inner border border-white/5 shrink-1">
                        <img 
                            src={currentStation?.favicon || '/fallback-station.png'} 
                            alt="Station Logo"
                            onError={(e) => e.target.src = '/fallback-station.png'}
                            className="w-full h-full object-contain p-6 group-hover:scale-105 transition duration-500 pointer-events-none select-none"
                        />
                        {isPlaying && (
                            <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded animate-pulse">
                                LIVE
                            </div>
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="text-center mb-2 shrink-0">
                        <h1 className="text-xl font-bold truncate mb-1 text-white">{currentStation?.name || "No Station Found"}</h1>
                        <div className="flex items-center justify-center gap-2 text-passport-teal text-xs font-medium uppercase tracking-wider">
                            <MapPin size={14} />
                            <span>{currentCity.name}, {currentCity.country}</span>
                        </div>
                        
                        {/* Station Indicators */}
                        <div className="flex justify-center gap-1 mt-3">
                            {stations.slice(0,5).map((s, i) => (
                                <div key={i} className={`h-1 rounded-full transition-all ${s.stationuuid === currentStation?.stationuuid ? 'w-4 bg-passport-teal' : 'w-1 bg-white/20'}`} />
                            ))}
                        </div>
                    </div>

                    {/* Playback Controls */}
                    <div className="flex items-center justify-between gap-4 px-2 shrink-0 mt-3">
                            <button onClick={toggleFavorite} className="text-white/60 hover:text-red-500 transition p-2 active:scale-95">
                                <Heart size={24} fill={favorites.find(f => f.stationuuid === currentStation?.stationuuid) ? "currentColor" : "none"} />
                            </button>

                            <button 
                                disabled={!currentStation}
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="bg-white text-passport-dark p-4 rounded-full hover:scale-105 transition shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95">
                                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1"/>}
                            </button>

                            <button onClick={() => changeStation(1)} className="text-white/60 hover:text-white transition p-2 active:scale-95">
                                <SkipForward size={24} />
                            </button>
                    </div>
                    
                    {/* Volume Slider */}
                    <div className="mt-4 flex items-center justify-center gap-2 group shrink-0">
                        <button onClick={() => setIsMuted(!isMuted)}>
                            {isMuted ? <VolumeX size={16} className="text-white/50"/> : <Volume2 size={16} className="text-white/50"/>}
                        </button>
                        <input 
                            type="range" min="0" max="1" step="0.05" 
                            value={isMuted ? 0 : volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-passport-teal"
                        />
                    </div>
                </div>
                
                <div className="text-center text-white/20 text-[10px] mt-4 uppercase tracking-widest shrink-0">
                    Swipe card to tune
                </div>
            </div>
        </div>
    </div>
  );

  const TeleportOverlay = () => (
    <div className="fixed inset-0 z-[100] bg-passport-dark flex flex-col items-center justify-center text-white">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse"></div>
        <Globe size={80} className="text-passport-teal animate-bounce mb-8 relative z-10" />
        <h2 className="text-3xl font-bold mb-2 relative z-10">Traveling...</h2>
        <p className="text-passport-teal font-mono uppercase tracking-widest text-sm relative z-10">Calibrating Frequency</p>
        <div className="w-64 h-1 bg-white/10 rounded-full mt-8 overflow-hidden relative z-10">
            <div className="h-full bg-passport-teal animate-[width_2.5s_ease-in-out_infinite]" style={{width: '100%'}}></div>
        </div>
    </div>
  );
const TravelStats = () => {
      // Convert logs object to array and sort by time (highest first)
      const stats = Object.entries(travelLogs).sort(([,a], [,b]) => b - a);

      if (stats.length === 0) return null;

      // Helper to format seconds into "1h 20m"
      const formatTime = (seconds) => {
          const h = Math.floor(seconds / 3600);
          const m = Math.floor((seconds % 3600) / 60);
          if (h > 0) return `${h}h ${m}m`;
          return `${m}m`; // Just show minutes if under an hour
      };

      // Helper to determine Rank/Badge
      const getRank = (seconds) => {
          if (seconds > 86400) return { title: "Citizen", color: "text-yellow-400", icon: "👑" }; // > 24 hours
          if (seconds > 3600) return { title: "Resident", color: "text-passport-teal", icon: "🏠" }; // > 1 hour
          return { title: "Tourist", color: "text-white/60", icon: "📷" }; // < 1 hour
      };

      return (
          <div className="mb-6 animate-fade-in">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Clock size={14} /> Time Spent in Country
              </h3>
              
              <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
                  {stats.map(([country, seconds]) => {
                      const rank = getRank(seconds);
                      return (
                          <div key={country} className="snap-start shrink-0 w-32 bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                              <div className="text-2xl mb-1">{rank.icon}</div>
                              <div className="font-bold text-sm text-white truncate w-full">{country}</div>
                              <div className={`text-[10px] uppercase font-bold tracking-wider mb-2 ${rank.color}`}>
                                  {rank.title}
                              </div>
                              <div className="bg-black/30 rounded-full px-2 py-1 text-xs font-mono text-white/70">
                                  {formatTime(seconds)}
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      );
  };
  const PassportBook = ({ onClose }) => {
      // Helper to safely get time from mixed data (numbers or objects)
      const getTime = (entry) => (typeof entry === 'number' ? entry : entry.time);
      
      // Sort entries by time
      const stats = Object.entries(travelLogs).sort(([,a], [,b]) => getTime(b) - getTime(a));

      const formatTime = (seconds) => {
          const h = Math.floor(seconds / 3600);
          const m = Math.floor((seconds % 3600) / 60);
          if (h > 0) return `${h}h ${m}m`;
          return `${m}m`;
      };

      const getRank = (seconds) => {
          if (seconds > 86400) return { title: "Citizen", color: "text-yellow-400", border: "border-yellow-400/50", icon: <Castle size={16} /> };
          if (seconds > 3600) return { title: "Resident", color: "text-passport-teal", border: "border-teal-400/50", icon: <Home size={16} /> };
          return { title: "Tourist", color: "text-white/60", border: "border-white/20", icon: <Tent size={16} /> };
      };

      return (
          <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex flex-col animate-fade-in">
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                      <Book className="text-passport-teal" /> My Stamp Book
                  </h2>
                  <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
                      <X size={20} />
                  </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                  {stats.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 opacity-50 text-center">
                          <Stamp size={64} className="mb-4 text-white/20" />
                          <p>No stamps yet.</p>
                      </div>
                  ) : (
                      <div className="grid grid-cols-2 gap-4">
                          {stats.map(([country, data]) => {
                              const seconds = getTime(data);
                              const iso = (typeof data === 'object' && data.iso) ? data.iso.toLowerCase() : 'xx';
                              const rank = getRank(seconds);

                              return (
                                  <div key={country} className={`relative p-3 rounded-lg border-2 border-dashed ${rank.border} bg-white/5 flex flex-col items-center text-center aspect-square group hover:bg-white/10 transition overflow-hidden`}>
                                      
                                      {/* BACKGROUND FLAG (Faded) */}
                                      {iso !== 'xx' && (
                                          <img 
                                              src={`https://flagcdn.com/w160/${iso}.png`}
                                              alt={country}
                                              className="absolute inset-0 w-full h-full object-cover opacity-10 grayscale group-hover:grayscale-0 group-hover:opacity-20 transition duration-500"
                                          />
                                      )}

                                      {/* Content sits on top */}
                                      <div className="relative z-10 flex flex-col items-center h-full justify-between py-2">
                                          {/* Rank Badge */}
                                          <div className={`p-2 rounded-full bg-slate-900/80 backdrop-blur border border-white/10 ${rank.color} shadow-lg`}>
                                              {rank.icon}
                                          </div>
                                          
                                          <div>
                                              <div className="font-bold text-sm text-white leading-tight mb-1 line-clamp-2 drop-shadow-md">
                                                  {country}
                                              </div>
                                              <div className="text-[10px] text-white/70 uppercase tracking-wider font-bold">
                                                  {rank.title}
                                              </div>
                                          </div>

                                          <div className="bg-black/60 px-2 py-1 rounded-md text-xs font-mono text-white/90 border border-white/5">
                                              {formatTime(seconds)}
                                          </div>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  )}
              </div>
          </div>
      );
  };
 const FavoritesView = () => {
    const [showStampBook, setShowStampBook] = useState(false); // State for the modal

    // Grouping Logic
    const groupedFavorites = favorites.reduce((groups, station) => {
        const country = station.country || "International";
        if (!groups[country]) groups[country] = [];
        groups[country].push(station);
        return groups;
    }, {});
    const sortedCountries = Object.keys(groupedFavorites).sort();

    return (
        <div className="flex-1 w-full h-full relative">
            {/* --- CONDITIONAL RENDER: STAMP BOOK MODAL --- */}
            {showStampBook && <PassportBook onClose={() => setShowStampBook(false)} />}

            <div className="w-full h-full overflow-y-auto pb-24 p-4 animate-fade-in">
                {/* Header with "Open Book" Button */}
                <div className="mb-6 sticky top-0 bg-passport-dark/95 backdrop-blur z-10 py-2 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Book className="text-passport-teal" /> My Passport
                    </h2>
                    
                    {/* NEW BUTTON: Moves the cards away from the music list */}
                    <button 
                        onClick={() => setShowStampBook(true)}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition"
                    >
                        <Stamp size={14} className="text-passport-teal" />
                        View Stamps
                    </button>
                </div>

                {/* Favorites List (Music Only) */}
                {favorites.length === 0 ? (
                    <div className="text-center opacity-50 mt-20 p-6 border border-dashed border-white/20 rounded-2xl">
                        <Heart size={48} className="mx-auto mb-4 text-white/20" />
                        <p className="text-sm">No stations favorited.</p>
                        <button onClick={() => setActiveTab('discover')} className="text-passport-teal text-sm mt-2 font-bold hover:underline">
                            Go Explore
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {sortedCountries.map((country) => (
                            <div key={country} className="animate-fade-in">
                                <h3 className="text-xs font-bold text-passport-teal uppercase tracking-widest mb-3 flex items-center gap-2 opacity-80 sticky top-14 bg-passport-dark/90 p-1 rounded-md w-fit">
                                    <Globe size={14} /> {country}
                                </h3>
                                
                                <div className="grid grid-cols-1 gap-2">
                                    {groupedFavorites[country].map((station) => (
                                        <div 
                                            key={station.stationuuid} 
                                            onClick={() => playStationWrapper(station)} 
                                            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 flex items-center gap-3 cursor-pointer group transition active:scale-95"
                                        >
                                            <div className="w-10 h-10 rounded-md bg-black/30 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                                                <img src={station.favicon} onError={(e) => e.target.style.display='none'} className="w-full h-full object-contain" alt="icon"/>
                                                <Radio size={18} className="text-white/20 absolute" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm truncate text-white">{station.name}</h4>
                                                <p className="text-xs text-white/50 truncate">{station.state || station.tags || 'Unknown Region'}</p>
                                            </div>
                                            <button 
                                                onClick={(e) => removeFavorite(e, station.stationuuid)} 
                                                className="p-2 text-white/30 hover:text-red-500 hover:bg-white/10 rounded-full transition z-20"
                                            >
                                                <VolumeX size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
  };  

  return (
<div className="relative h-[100dvh] bg-passport-dark text-white font-sans overflow-hidden flex flex-col">
      
      {/* --- SPLASH SCREEN --- */}
      <div className={`absolute inset-0 z-[60] bg-passport-dark flex flex-col items-center justify-center transition-opacity duration-1000 ${showSplash ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="animate-pulse flex flex-col items-center">
              {/* Logo - Make sure this path matches your logo file */}
              <img src="/logo512.png" alt="Passport Radio" className="w-32 h-32 mb-6 drop-shadow-[0_0_15px_rgba(45,212,191,0.5)]" />
              <p className="text-passport-teal text-sm font-medium tracking-widest uppercase opacity-80">
                  "What you hear if you were there..."
              </p>
          </div>
      </div>
            {/* Background Layer */}
      <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out" style={{ backgroundImage: `url(${bgImage})`, filter: 'brightness(0.5)' }}></div>
      <div className="absolute inset-0 bg-gradient-to-t from-passport-dark via-passport-dark/40 to-black/50"></div>

      {/* --- HEADER --- */}
      {/* --- HEADER --- */}
      <header className="relative z-50 p-4 md:p-6 flex justify-between items-center backdrop-blur-md border-b border-white/10 shrink-0">
        
        {/* CLICKABLE WORDMARK */}
        <button 
            onClick={() => setActiveTab('discover')} 
            className="flex items-center gap-3 hover:opacity-80 transition active:scale-95"
        >
            <img src="/wordmark.png" alt="Passport Radio" className="h-6 md:h-8 w-auto drop-shadow-lg" />
        </button>
        
        <div className="flex gap-2 md:gap-4 items-center">
           
           {/* INSTALL BUTTON (Only shows if install is available) */}
           {deferredPrompt && (
               <button 
                 onClick={handleInstallClick}
                 className="animate-pulse bg-white/10 text-passport-teal p-2 rounded-full border border-passport-teal/50 hover:bg-passport-teal hover:text-slate-900 transition mr-1"
                 title="Install App"
               >
                 <Download size={20} />
               </button>
           )}

           {/* City Dropdown Container */}
           <div className="relative">
             <button onClick={() => setShowCityMenu(!showCityMenu)} className="flex items-center gap-1 md:gap-2 bg-white/10 px-3 py-2 rounded-full hover:bg-white/20 transition border border-white/20 backdrop-blur-md text-sm md:text-base">
                <MapPin size={16} className="text-passport-teal"/>
                <span className="font-semibold truncate max-w-[100px] md:max-w-none">{currentCity.name}</span>
             </button>
             
             {showCityMenu && (
                 <div className="absolute top-12 right-0 w-64 max-h-[60vh] overflow-y-auto bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl p-2 z-50 custom-scrollbar">
                    {[...new Set(cities.map(c => c.country))].sort().map(country => (
                        <div key={country} className="mb-2">
                            <div className="px-3 py-1 text-[10px] font-bold text-passport-teal uppercase tracking-widest opacity-70 sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10 border-b border-white/5 mb-1">
                                {country}
                            </div>
                            {cities
                                .filter(c => c.country === country)
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map(c => (
                                    <button 
                                        key={c.name} 
                                        onClick={() => { setCurrentCity(c); setShowCityMenu(false); }} 
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex justify-between group ${currentCity.name === c.name ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/70'}`}
                                    >
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
        </div>
      </header>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="relative z-10 flex-grow overflow-hidden">
        {isTeleporting && <TeleportOverlay />}
        {isLoading && activeTab === 'discover' && !isTeleporting ? (
          <div className="flex flex-col items-center justify-center h-full animate-pulse">
            <img src="/loadingSpinner.gif" alt="Loading" className="w-24 h-24 object-contain" />
            <p className="mt-4 text-passport-teal font-mono uppercase tracking-widest text-sm">Scanning Frequencies...</p>
          </div>
        ) : (
            <>
                {activeTab === 'discover' && <PlayerView />}
{activeTab === 'search' && <SearchView />}
{activeTab === 'game' && <GameView />}  {/* <--- ADD THIS */}
{activeTab === 'favorites' && <FavoritesView />}
</>
        )}
      </main>

      {/* --- BOTTOM NAVIGATION --- */}
      <nav className="relative z-50 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 p-2 shrink-0">
        <div className="flex justify-around items-center max-w-md mx-auto">
            <button onClick={() => setActiveTab('discover')} className={`flex flex-col items-center p-2 transition ${activeTab === 'discover' ? 'text-passport-teal' : 'text-white/50 hover:text-white'}`}>
                <Compass size={24} /><span className="text-[10px] mt-1 font-medium uppercase tracking-wider">Discover</span>
            </button>
            <button onClick={() => setActiveTab('search')} className={`flex flex-col items-center p-2 transition ${activeTab === 'search' ? 'text-passport-teal' : 'text-white/50 hover:text-white'}`}>
                <Search size={24} /><span className="text-[10px] mt-1 font-medium uppercase tracking-wider">Search</span>
            </button>
            <button onClick={() => setActiveTab('game')} className={`flex flex-col items-center p-2 transition ${activeTab === 'game' ? 'text-passport-teal' : 'text-white/50 hover:text-white'}`}>
    <Trophy size={24} /><span className="text-[10px] mt-1 font-medium uppercase tracking-wider">Game</span>
</button>
            <button onClick={() => setActiveTab('favorites')} className={`flex flex-col items-center p-2 transition ${activeTab === 'favorites' ? 'text-passport-teal' : 'text-white/50 hover:text-white'}`}>
                <Book size={24} /><span className="text-[10px] mt-1 font-medium uppercase tracking-wider">Passport</span>
            </button>
        </div>
      </nav>

      <audio ref={audioRef} src={currentStation?.url_resolved} onError={(e) => { console.log("Stream failed:", e); changeStation(1); }} onEnded={() => changeStation(1)} />
    </div>
  );
};

export default App;