import React, { useState, useEffect, useRef } from 'react';
import { CloudRain, CloudSnow, Sun, Cloud, CloudLightning, Wind, Droplets, Thermometer, X } from 'lucide-react';

const WeatherSystem = ({ city, isMuted }) => {
    const [weather, setWeather] = useState(null);
    const [isOpen, setIsOpen] = useState(false); // Modal State
    const audioRef = useRef(new Audio());

    const getWeatherType = (code) => {
        if (code === 0 || code === 1) return 'clear';
        if (code >= 51 && code <= 67) return 'rain';
        if (code >= 71 && code <= 77) return 'snow';
        if (code >= 95) return 'storm';
        if (code >= 2 && code <= 3) return 'cloudy';
        return 'clear';
    };

    useEffect(() => {
        if (!city) return;

        const fetchWeather = async () => {
            try {
                // Robust Fetch
                const res = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}&current=weather_code,is_day,temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m`
                );
                const data = await res.json();
                
                const current = data.current;
                const code = current.weather_code;
                const type = getWeatherType(code);

                setWeather({ 
                    type, 
                    code, 
                    isDay: current.is_day === 1, 
                    temp: Math.round(current.temperature_2m),
                    feelsLike: Math.round(current.apparent_temperature),
                    humidity: current.relative_humidity_2m,
                    wind: current.wind_speed_10m
                });
            } catch (e) {
                console.error("Weather fetch failed", e);
            }
        };

        fetchWeather();
    }, [city]);

    // Audio Logic
    useEffect(() => {
        if (!weather || isMuted) {
            audioRef.current.pause();
            return;
        }
        let soundUrl = null;
        if (weather.type === 'rain') soundUrl = 'https://assets.mixkit.co/active_storage/sfx/2499/2499-preview.mp3';
        if (weather.type === 'storm') soundUrl = 'https://assets.mixkit.co/active_storage/sfx/1271/1271-preview.mp3';

        if (soundUrl) {
            audioRef.current.src = soundUrl;
            audioRef.current.volume = 0.15;
            audioRef.current.loop = true;
            audioRef.current.play().catch(e => console.log("Audio play blocked", e));
        } else {
            audioRef.current.pause();
        }
        return () => audioRef.current.pause();
    }, [weather, city, isMuted]);

    if (!weather) return null;

    // Helper for icons
    const WeatherIcon = ({ type, isDay, size = 16 }) => {
        const iconClass = "drop-shadow-glow";
        if (type === 'clear') return <Sun size={size} className={isDay ? `text-yellow-400 animate-spin-slow ${iconClass}` : `text-blue-200 ${iconClass}`} />;
        if (type === 'rain') return <CloudRain size={size} className={`text-blue-400 ${iconClass}`} />;
        if (type === 'snow') return <CloudSnow size={size} className={`text-white ${iconClass}`} />;
        if (type === 'storm') return <CloudLightning size={size} className={`text-purple-400 ${iconClass}`} />;
        return <Cloud size={size} className={`text-gray-400 ${iconClass}`} />;
    };

    return (
        <>
            {/* 1. THE COMPACT BADGE (Fits in Flex Container) */}
            <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
                className="bg-black/60 backdrop-blur-md pl-2 pr-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5 shadow-lg hover:bg-black/80 transition active:scale-95 h-[26px]"
            >
                <WeatherIcon type={weather.type} isDay={weather.isDay} size={14} />
                <span className="text-[10px] font-bold text-white leading-none relative top-[1px]">
                    {weather.temp}°
                </span>
            </button>

            {/* 2. THE FULL WEATHER CARD (Modal) */}
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsOpen(false)}>
                    <div 
                        className="bg-slate-900/90 border border-white/10 p-6 rounded-3xl shadow-2xl w-full max-w-xs relative text-center"
                        onClick={(e) => e.stopPropagation()} 
                    >
                        <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-white/30 hover:text-white">
                            <X size={20} />
                        </button>

                        <h3 className="text-white/50 text-sm font-bold uppercase tracking-widest mb-4">{city.name} Weather</h3>
                        
                        <div className="flex justify-center mb-2">
                            <WeatherIcon type={weather.type} isDay={weather.isDay} size={64} />
                        </div>
                        
                        <div className="text-4xl font-black text-white mb-1">{weather.temp}°</div>
                        <div className="text-passport-teal text-sm font-bold uppercase tracking-wider mb-6">
                            {weather.type === 'clear' ? (weather.isDay ? 'Sunny' : 'Clear Night') : weather.type}
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="bg-white/5 p-2 rounded-xl flex flex-col items-center gap-1">
                                <Thermometer size={14} className="text-passport-pink" />
                                <span className="text-white/40">Feels Like</span>
                                <span className="font-bold text-white">{weather.feelsLike}°</span>
                            </div>
                            <div className="bg-white/5 p-2 rounded-xl flex flex-col items-center gap-1">
                                <Droplets size={14} className="text-blue-400" />
                                <span className="text-white/40">Humidity</span>
                                <span className="font-bold text-white">{weather.humidity}%</span>
                            </div>
                            <div className="bg-white/5 p-2 rounded-xl flex flex-col items-center gap-1">
                                <Wind size={14} className="text-emerald-400" />
                                <span className="text-white/40">Wind</span>
                                <span className="font-bold text-white">{weather.wind} km/h</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default WeatherSystem;