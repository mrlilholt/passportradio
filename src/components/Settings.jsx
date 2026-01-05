import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, X, Home, Search, MapPin, Heart, Loader, Save, Globe, CheckCircle, LogOut, User } from 'lucide-react';
import { cities } from '../data/cities';
import { useAuth } from '../context/AuthContext';

const Settings = ({ userHome, setUserHome, onClose, localDataForSync }) => {
    const { user, login, logout } = useAuth();
    // Parse current home safely for the "Badge" display
    // Parse current home safely for the "Badge" display
    const currentHomeDisplay = (() => {
        if (!userHome) return null;
        
        // 🛡️ FIX: Treat "poisoned" data as null so the UI shows the "Set Home" button
        if (userHome === '[object Object]') return null;

        if (typeof userHome === 'string') return { name: userHome, country: '', iso: '' };
        return userHome; 
    })();

    // State for the edit/search mode
    const [tempHome, setTempHome] = useState(() => {
        try {
            // 🛡️ FIX: Reset search if data is corrupted
            if (userHome === '[object Object]') return null;

            if (typeof userHome === 'string' && !userHome.startsWith('{')) {
                return { name: userHome, country: '', lat: 0, lng: 0 };
            }
            return typeof userHome === 'string' ? JSON.parse(userHome) : userHome;
        } catch (e) { return null; }
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState(cities);
    const [isSearching, setIsSearching] = useState(false);

    // Search Logic (Open-Meteo)
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!searchTerm) {
                setResults(cities);
                return;
            }

            setIsSearching(true);
            try {
                const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchTerm)}&count=10&language=en&format=json`);
                const data = await res.json();
                
                if (data.results) {
                    const formatted = data.results.map(place => ({
                        name: place.name,
                        country: place.country,
                        iso: place.country_code,
                        lat: place.latitude,
                        lng: place.longitude,
                        isApi: true
                    }));
                    setResults(formatted);
                } else {
                    setResults([]);
                }
            } catch (err) {
                console.error("Search failed", err);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleSave = () => {
        if (tempHome) {
            setUserHome(tempHome);
            localStorage.setItem('userHome', JSON.stringify(tempHome));
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-passport-dark/95 backdrop-blur-xl flex flex-col animate-fade-in">
             {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <SettingsIcon className="text-passport-teal" /> Settings
                </h2>
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* 🌟 NEW: PILOT LICENSE SECTION */}
                <section className="bg-gradient-to-r from-slate-800 to-slate-900 border border-white/10 rounded-xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                         <User size={100} className="text-white" />
                    </div>
                    
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10 text-white">
                        <User size={18} className="text-passport-teal" /> Pilot License
                    </h3>

                    {user ? (
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-4">
                                {user.photoURL && (
                                    <img src={user.photoURL} alt="User" className="w-12 h-12 rounded-full border-2 border-passport-teal" referrerPolicy="no-referrer" />
                                )}
                                <div>
                                    <p className="font-bold text-white text-lg">{user.displayName}</p>
                                    <p className="text-sm text-white/50">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-passport-teal bg-passport-teal/10 px-3 py-1 rounded-full w-fit mb-4 border border-passport-teal/20">
                                <CheckCircle size={12} /> Cloud Sync Active
                            </div>
                            <button 
                                onClick={logout}
                                className="w-full py-2 bg-white/5 hover:bg-red-500/20 text-white hover:text-red-400 border border-white/10 rounded-lg transition flex items-center justify-center gap-2 text-sm font-bold"
                            >
                                <LogOut size={16} /> Sign Out
                            </button>
                        </div>
                    ) : (
                        <div className="relative z-10">
                            <p className="text-sm text-white/70 mb-4">
                                Sign in to sync your stamps, rank, and favorites across devices. Never lose your progress.
                            </p>
                            <button 
                                onClick={() => login(localDataForSync)}
                                className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2 shadow-lg"
                            >
                                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
                                Sign in with Google
                            </button>
                        </div>
                    )}
                </section>

                <hr className="border-white/10" />
                
                {/* --- HOME BASE SECTION --- */}
                <section>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Home size={18} className="text-passport-purple" /> Home Base
                    </h3>
                    
                    {/* NEW: ACTIVE BADGE DISPLAY */}
                    {currentHomeDisplay ? (
                        <div className="bg-passport-teal/10 border border-passport-teal/50 rounded-xl p-4 mb-6 flex items-center gap-4 animate-fade-in relative overflow-hidden group">
                            <div className="absolute top-0 right-0 bg-passport-teal text-black text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1">
                                <CheckCircle size={10} /> ACTIVE
                            </div>
                            <div className="w-12 h-12 bg-passport-teal/20 rounded-full flex items-center justify-center text-passport-teal shrink-0">
                                <MapPin size={24} fill="currentColor" />
                            </div>
                            <div>
                                {/* UPDATED LABEL HERE */}
                                <div className="text-[10px] uppercase font-bold text-passport-teal tracking-widest mb-1 opacity-80">Country of Origin</div>
                                <div className="text-xl font-bold text-white flex items-center gap-2 flex-wrap">
                                    {currentHomeDisplay.iso && (
                                        <img 
                                            src={`https://flagcdn.com/w40/${currentHomeDisplay.iso.toLowerCase()}.png`} 
                                            className="w-6 rounded shadow-sm" 
                                            alt="flag" 
                                        />
                                    )}
                                    {currentHomeDisplay.name || currentHomeDisplay.city}
                                </div>
                                {currentHomeDisplay.country && (
                                    <div className="text-white/50 text-sm font-medium">{currentHomeDisplay.country}</div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/5 border border-dashed border-white/10 rounded-xl p-4 mb-6 text-center">
                            <p className="text-white/40 text-sm">No Home Base set yet.</p>
                        </div>
                    )}

                    <p className="text-sm text-white/60 mb-3">
                        Set your origin to enable "Welcome Home" alerts when we find a station from your area.
                    </p>
                    
                    {/* Search Input */}
                    <div className="relative mb-3">
                        <div className="absolute left-3 top-3 text-white/40"><Search size={16} /></div>
                        <input 
                            type="text" 
                            placeholder="Search city (e.g. Tokyo, Paris)..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-passport-teal transition placeholder:text-white/20"
                        />
                        {isSearching && (
                            <div className="absolute right-3 top-3 animate-spin text-passport-teal">
                                <Loader size={16} />
                            </div>
                        )}
                    </div>

                    {/* Selection List */}
                    <div className="h-48 overflow-y-auto border border-white/5 rounded-xl bg-black/20 custom-scrollbar relative">
                        {results.length === 0 && !isSearching && (
                            <div className="p-4 text-center text-white/40 text-sm">No cities found.</div>
                        )}
                        
                        {results.map((city, index) => {
                            const cityName = city.name || city.city;
                            // Check against TEMP home (what they are currently selecting)
                            const isSelected = tempHome?.name === cityName || tempHome?.city === cityName;

                            return (
                                <button
                                    key={`${cityName}-${index}`}
                                    onClick={() => setTempHome(city.name ? city : { ...city, name: city.city })}
                                    className={`w-full text-left p-3 border-b border-white/5 flex items-center justify-between hover:bg-white/5 transition ${isSelected ? 'bg-passport-teal/20 text-passport-teal' : 'text-white/70'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        {city.iso || city.countrycode ? (
                                            <img 
                                                src={`https://flagcdn.com/w40/${(city.iso || city.countrycode).toLowerCase()}.png`} 
                                                alt={city.country}
                                                className="w-6 rounded shadow-sm opacity-80"
                                                onError={(e) => e.target.style.display = 'none'}
                                            />
                                        ) : <Globe size={16} className="opacity-50" />}
                                        
                                        <div>
                                            <div className="font-bold text-sm">{cityName}</div>
                                            <div className="text-[10px] opacity-60 uppercase tracking-wider">{city.country}</div>
                                        </div>
                                    </div>
                                    {isSelected && <MapPin size={16} className="text-passport-teal fill-passport-teal" />}
                                </button>
                            );
                        })}
                    </div>

                    {/* SAVE BUTTON */}
                    <div className="mt-4 flex justify-end">
                        <button 
                            onClick={handleSave}
                            disabled={!tempHome}
                            className="flex items-center gap-2 bg-passport-teal text-slate-900 font-bold px-6 py-3 rounded-full hover:scale-105 transition shadow-lg disabled:opacity-50 disabled:scale-100"
                        >
                            <Save size={18} />
                            Confirm Change
                        </button>
                    </div>
                </section>

                <hr className="border-white/10" />

                {/* Support Section */}
                <section>
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                        <Heart size={18} className="text-passport-pink" /> Support the Project
                    </h3>
                    <p className="text-sm text-white/60 mb-4">
                        Passport Radio is a free project.
                    </p>
                    <a 
                        href="https://ko-fi.com/lilholtmakes" 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 bg-[#FF5E5B] text-white font-bold py-3 rounded-xl hover:bg-[#ff7572] transition shadow-lg hover:shadow-red-500/20"
                    >
                        <Heart size={18} fill="currentColor" />
                        Buy me a Coffee
                    </a>
                </section>
                
                <div className="text-center text-xs text-white/30 pt-8 pb-4">
                    Passport Radio v1.0
                </div>
            </div>
        </div>
    );
};

export default Settings;