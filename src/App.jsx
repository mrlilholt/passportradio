import React, { useState, useEffect, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Play, Pause, Globe, Heart, SkipForward, SkipBack, Search, MapPin, Radio, Volume2, VolumeX, Compass, Book, Loader, Download } from 'lucide-react';
import { cities, genres } from './data/cities';

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

  // New State for Recents & Teleport
  const [recents, setRecents] = useState(() => JSON.parse(localStorage.getItem('passport_recents')) || []);
  const [isTeleporting, setIsTeleporting] = useState(false);
  
  // API Server State
  const [apiServer, setApiServer] = useState('https://de1.api.radio-browser.info'); 

  // Animation state
  const [slideDirection, setSlideDirection] = useState(0); 

  const audioRef = useRef(null);

  // --- EFFECTS ---

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

      let validStations = data.filter(s => s.url_resolved && s.url_resolved.startsWith('http'));
      
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

  const FavoritesView = () => {
    const playStation = (station) => {
        setCurrentStation(station);
        setStations([station]);
        setActiveTab('discover');
        setIsPlaying(true);
    };

    const removeFavorite = (e, uuid) => {
        e.stopPropagation();
        setFavorites(favorites.filter(f => f.stationuuid !== uuid));
    };

    const StationList = ({ items, canDelete }) => (
        <div className="space-y-3">
            {items.map((station) => (
                <div key={station.stationuuid} onClick={() => playStation(station)} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 flex items-center gap-3 cursor-pointer group transition">
                    <div className="w-10 h-10 rounded-md bg-black/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <img src={station.favicon} onError={(e) => e.target.style.display='none'} className="w-full h-full object-contain" alt="icon"/>
                        <Radio size={18} className="text-white/20 absolute" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate text-white">{station.name}</h4>
                        <p className="text-xs text-white/50 truncate">{station.tags || 'Unknown Genre'}</p>
                    </div>
                    {canDelete && (
                         <button onClick={(e) => removeFavorite(e, station.stationuuid)} className="p-2 text-white/30 hover:text-red-500 hover:bg-white/10 rounded-full transition z-20"><VolumeX size={16} /></button>
                    )}
                </div>
            ))}
        </div>
    );

    return (
        <div className="flex flex-col h-full p-4 w-full max-w-md mx-auto pt-8 overflow-y-auto pb-24">
            {recents.length > 0 && (
                <div className="mb-8 animate-fade-in">
                    <h3 className="text-xs font-bold text-passport-teal uppercase tracking-widest mb-3 flex items-center gap-2 opacity-80"><Radio size={14}/> Recently Played</h3>
                    <StationList items={recents} canDelete={false} />
                </div>
            )}
            <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Book className="text-passport-teal" /> My Passport
                    <span className="text-xs font-normal text-white/50 ml-auto bg-white/10 px-2 py-1 rounded-full">{favorites.length}</span>
                </h2>
                {favorites.length === 0 ? (
                    <div className="text-center opacity-50 mt-10 p-6 border border-dashed border-white/20 rounded-2xl">
                        <Heart size={48} className="mx-auto mb-4 text-white/20" />
                        <p className="text-sm">No stamps collected yet.</p>
                        <button onClick={() => setActiveTab('discover')} className="text-passport-teal text-sm mt-2 font-bold hover:underline">Go Explore</button>
                    </div>
                ) : <StationList items={favorites} canDelete={true} />}
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