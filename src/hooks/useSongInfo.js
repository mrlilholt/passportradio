// src/hooks/useSongInfo.js
import { useState, useEffect } from 'react';

export const useSongInfo = (currentStation) => {
    const [songData, setSongData] = useState({ title: '', artist: '', cover: null });

    useEffect(() => {
        if (!currentStation) return;

        // Reset when station changes
        setSongData({ title: 'Tuning in...', artist: currentStation.name, cover: null });

        // Function to fetch metadata from the Radio Browser API
        // (Radio Browser creates a small socket/stream for metadata)
        const fetchMetadata = async () => {
            try {
                // 1. Get raw song info from Radio Browser stats
                const res = await fetch(`https://at1.api.radio-browser.info/json/stations/byuuid/${currentStation.stationuuid}`);
                const data = await res.json();
                
                if (data && data.length > 0 && data[0].lastcheckok) {
                    // This api often has a 'clickcount' but sometimes has 'lastchecktime'
                    // Note: Real-time metadata is tricky with standard HTML5 audio.
                    // We often have to rely on the station name or third party streams.
                    
                    // FALLBACK STRATEGY: 
                    // Since direct metadata from HTML5 audio is hard without a proxy,
                    // We will try to fetch from iTunes based on the Station Name if it's a specific artist station,
                    // OR we just set a high-quality city image.
                    
                    // However, let's try to query iTunes with the Station Name tags to get a vibe image
                    searchItunes(currentStation.tags);
                }
            } catch (e) {
                console.error("Metadata fetch error", e);
            }
        };

        const searchItunes = async (query) => {
            if (!query) return;
            // Clean query (take first tag)
            const term = query.split(',')[0].trim();
            if (term.length < 3) return;

            try {
                const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=1`);
                const data = await res.json();
                if (data.results.length > 0) {
                    setSongData(prev => ({
                        ...prev,
                        cover: data.results[0].artworkUrl100.replace('100x100', '600x600') // Get High Res
                    }));
                }
            } catch (e) {
                // Fail silently
            }
        };

        // Initial fetch
        searchItunes(currentStation.tags);

    }, [currentStation]);

    return songData;
};