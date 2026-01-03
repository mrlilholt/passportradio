import { useState, useEffect } from 'react';

export const useSongInfo = (currentStation) => {
    const [cover, setCover] = useState(null);

    useEffect(() => {
        if (!currentStation) {
            setCover(null);
            return;
        }

        let isMounted = true;

        const fetchArtwork = async () => {
            // 1. First choice: Use the Station's own favicon from the database
            // (We check if it exists and is a valid URL)
            if (currentStation.favicon && currentStation.favicon.length > 10) {
                // If it's a high-quality image, just use it and stop.
                // If you find database icons are too blurry, you can comment this 'return' out
                // to let iTunes try to find a better one.
                setCover(currentStation.favicon);
                return; 
            }

            // 2. Prepare the search term for iTunes
            // Remove "FM", "Radio", numbers, and bitrate info to get the core name
            // Example: "Star Radio 102.5 (128kbps)" -> "Star"
            const cleanName = currentStation.name
                .replace(/\b(radio|fm|am|online|digital|streams?|hd|live)\b/gi, "") // Remove keywords
                .replace(/[^a-zA-Z0-9 ]/g, "") // Remove symbols
                .replace(/\s+/g, " ") // Collapse spaces
                .trim();

            if (cleanName.length < 2) {
                setCover(null); // Name is too short (e.g. just "FM"), give up
                return;
            }

            try {
                // 3. Search iTunes for a PODCAST (Best for station logos)
                const response = await fetch(
                    `https://itunes.apple.com/search?term=${encodeURIComponent(cleanName)}&media=podcast&limit=1`
                );
                const data = await response.json();

                if (isMounted && data.results.length > 0) {
                    const result = data.results[0];
                    const resultName = result.collectionName || result.trackName;
                    
                    // 4. 🛡️ STRICT MATCHING CHECK
                    // We check if the iTunes result actually contains our search term.
                    // This prevents "Jazz FM" searching "Jazz" and getting "Jazz Greats Album".
                    
                    const isRelevant = resultName.toLowerCase().includes(cleanName.toLowerCase()) || 
                                       cleanName.toLowerCase().includes(resultName.toLowerCase());

                    if (isRelevant) {
                        // Use the high-res image (600x600)
                        setCover(result.artworkUrl600 || result.artworkUrl100);
                    } else {
                        // iTunes result was too random (e.g. "Best of Rock" for "Rock 101")
                        // Fallback to the low-quality favicon or null
                        setCover(currentStation.favicon || null);
                    }
                } else {
                    // No iTunes match? Use DB favicon
                    setCover(currentStation.favicon || null);
                }
            } catch (error) {
                console.warn("Artwork fetch failed", error);
                setCover(currentStation.favicon || null);
            }
        };

        fetchArtwork();

        return () => { isMounted = false; };
    }, [currentStation]);

    return { cover };
};