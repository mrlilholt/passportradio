import React, { useState } from 'react';
import { Globe, Search, Loader } from 'lucide-react';

const SearchView = ({ setCurrentCity, setActiveTab, setFilterGenre }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query) return;
        setSearching(true);
        try {
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`);
            const data = await res.json();
            if (data.results) setResults(data.results);
            else setResults([]);
        } catch (err) { console.error(err); }
        setSearching(false);
    };

    const selectLocation = (place) => {
        const newCity = { name: place.name, country: place.country, iso: place.country_code, lat: place.latitude, lng: place.longitude };
        setCurrentCity(newCity);
        setActiveTab('discover');
        setFilterGenre(null);
    };

    return (
        <div className="flex flex-col h-full p-4 w-full max-w-md mx-auto pt-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Globe className="text-passport-teal" /> Global Search</h2>
            <form onSubmit={handleSearch} className="relative mb-6">
                <input type="text" placeholder="Type a city (e.g. Kyoto, Lima)..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pl-10 focus:outline-none focus:border-passport-teal text-white placeholder-white/40" autoFocus />
                <Search className="absolute left-3 top-3.5 text-white/40" size={18} />
                <button type="submit" className="absolute right-2 top-2 bg-passport-teal text-slate-900 px-3 py-1.5 rounded-lg text-sm font-bold">GO</button>
            </form>
            <div className="flex-1 overflow-y-auto space-y-2 pb-20">
                {searching ? <div className="flex justify-center py-10 opacity-50"><Loader className="animate-spin" /></div> : results.map((place) => (
                    <button key={place.id} onClick={() => selectLocation(place)} className="w-full bg-black/20 hover:bg-white/10 border border-white/5 p-3 rounded-lg flex items-center justify-between group transition text-left">
                        <div><div className="font-bold text-lg">{place.name}</div><div className="text-white/50 text-sm">{place.country}</div></div>
                        <img src={`https://flagsapi.com/${place.country_code}/flat/64.png`} className="w-8 h-8 object-contain" onError={(e) => e.target.style.display = 'none'} alt={place.country_code} />
                    </button>
                ))}
                {results.length === 0 && query && !searching && <div className="text-center text-white/30 mt-10">No places found.</div>}
            </div>
        </div>
    );
};

export default SearchView;