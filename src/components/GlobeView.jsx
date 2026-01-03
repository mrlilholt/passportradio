import React, { useEffect, useRef, useState, useMemo } from 'react';
import Globe from 'react-globe.gl';

const GlobeView = ({ cities, onSelectCity, visitHistory }) => {
    const globeEl = useRef();
    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [hoverD, setHoverD] = useState(null);

    // 🎨 THEME COLORS
    const GOLD_COLOR = '#fbbf24';  // Amber-400 (Visited)
    const TEAL_COLOR = '#2dd4bf';  // Teal-400 (Trending)
    const WHITE_COLOR = '#ffffff'; // Available (Base)

    // 1. Keep the globe full screen
    useEffect(() => {
        const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 2. Auto-rotate controls
    useEffect(() => {
        if (globeEl.current) {
            globeEl.current.controls().autoRotate = true;
            globeEl.current.controls().autoRotateSpeed = 0.3; // Slightly faster to show off 3D depth
            globeEl.current.pointOfView({ altitude: 2.2 }, 2000);
        }
    }, []);

    // 3. 🔥 HOTSPOTS ENGINE (Select 3 Trending Cities)
    const hotspots = useMemo(() => {
        if (!cities.length) return [];
        const historyNames = new Set(visitHistory?.map(h => h.name) || []);
        const candidates = cities.filter(c => !historyNames.has(c.name));
        
        return candidates
            .sort(() => 0.5 - Math.random()) // Shuffle
            .slice(0, 3);                    // Pick 3
    }, []); 

    // 4. 📊 DATA PROCESSING (Calculate Heights & Visuals)
    const { processedCities, ringsData, arcs, uniqueVisited } = useMemo(() => {
        const safeHistory = Array.isArray(visitHistory) ? visitHistory : [];
        
        // A. Identify Visited Cities
        const unique = [];
        const seen = new Set();
        safeHistory.forEach(city => {
            if (city && city.name && !seen.has(city.name)) {
                unique.push({ ...city, isVisited: true });
                seen.add(city.name);
            }
        });

        // B. Process ALL Cities with "Listener Count" Heights
        // We use population as a proxy for listeners, falling back to a name-hash for variety
        const enrichedCities = cities.map(city => {
            let metric = city.population || 0;
            
            // Fallback: Generate a consistent number based on name length if no pop data
            if (metric === 0) metric = city.name.length * 100000;

            // Logarithmic scale for smoother height distribution
            // (Prevents Tokyo from being 100x taller than a small town)
            let rawHeight = Math.log10(metric) / 25; 
            
            // Clamp heights between 0.05 and 0.4
            let height = Math.max(0.05, Math.min(rawHeight, 0.4));

            // Boost Trending/Visited slightly for visibility
            const isTrend = hotspots.find(h => h.name === city.name);
            const isVisit = seen.has(city.name);
            
            if (isTrend) height += 0.1;
            if (isVisit) height += 0.05;

            return {
                ...city,
                height: height, // 👈 The magic property
                isVisited: isVisit,
                isTrending: !!isTrend
            };
        });

        // C. Flight Paths
        const flightPaths = [];
        for (let i = 0; i < safeHistory.length - 1; i++) {
            const start = safeHistory[i];
            const end = safeHistory[i + 1];
            if (start && end && start.lat && end.lat) {
                flightPaths.push({
                    startLat: start.lat,
                    startLng: start.lng,
                    endLat: end.lat,
                    endLng: end.lng,
                    color: GOLD_COLOR
                });
            }
        }

        // D. Rings (Visited + Trending)
        const hotWithTag = hotspots.map(h => ({ ...h, isHotspot: true }));
        const combinedRings = [...unique, ...hotWithTag];

        return { 
            processedCities: enrichedCities, 
            ringsData: combinedRings, 
            arcs: flightPaths, 
            uniqueVisited: unique 
        };
    }, [visitHistory, hotspots, cities]);

    const handleCityClick = (d) => {
        // We accept the click, but we need the original full city object to bubble up
        if (onSelectCity) {
            if (globeEl.current) {
                globeEl.current.controls().autoRotate = false;
                globeEl.current.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.5 }, 1500);
            }
            setTimeout(() => onSelectCity(d), 1500);
        }
    };

    return (
        <div className="absolute inset-0 z-0 bg-slate-900 animate-fade-in cursor-move">
            
            {/* 🏷️ LEGEND */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center z-20 pointer-events-none">
                <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full flex gap-6 shadow-2xl">
                    <div className="flex items-center gap-2">
                        <span className="w-1 h-4 bg-white/40 rounded-sm"></span>
                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Listeners</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-1 h-5 bg-amber-400 rounded-sm shadow-[0_0_10px_rgba(251,191,36,0.5)]"></span>
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Visited</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-1 h-6 bg-teal-400 rounded-sm shadow-[0_0_10px_rgba(45,212,191,0.5)] animate-pulse"></span>
                        <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">Trending</span>
                    </div>
                </div>
            </div>

            <Globe
                ref={globeEl}
                width={dimensions.width}
                height={dimensions.height}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                
                // 🏙️ 3D DATA SPIKES
                pointsData={processedCities}
                pointLat="lat"
                pointLng="lng"
                pointColor={d => {
                    if (d.isVisited) return GOLD_COLOR;
                    if (d.isTrending) return TEAL_COLOR;
                    return WHITE_COLOR;
                }}
                pointAltitude="height" // 👈 Uses our calculated height
                pointRadius={0.25}     // Thin spikes look cleaner than fat cylinders
                pointResolution={12}
                pointsMerge={true}

                // 💍 RINGS (Only Visited & Trending)
                ringsData={ringsData}
                ringLat="lat"
                ringLng="lng"
                ringColor={d => d.isHotspot ? TEAL_COLOR : GOLD_COLOR} 
                ringMaxRadius={d => d.isHotspot ? 8 : 5}
                ringPropagationSpeed={d => d.isHotspot ? 5 : 2}
                ringRepeatPeriod={d => d.isHotspot ? 600 : 800}

                // ✈️ FLIGHT PATHS
                arcsData={arcs}
                arcColor="color"
                arcDashLength={0.4}
                arcDashGap={0.2}
                arcDashAnimateTime={2000}
                arcStroke={0.5}

                // 🏷️ LABELS
                labelsData={processedCities} // Use the processed list
                labelLat="lat"
                labelLng="lng"
                labelText="name"
                labelSize={d => {
                    // Show if Hovered OR Visited OR Trending
                    // Hide "Available" labels unless hovered to reduce clutter
                    const isHovered = d === hoverD;
                    return (isHovered || d.isVisited || d.isTrending) ? 1.5 : 0;
                }}
                labelDotRadius={d => d.isTrending ? 0.4 : 0.3}
                labelColor={d => {
                    if (d.isVisited) return GOLD_COLOR;
                    if (d.isTrending) return TEAL_COLOR;
                    return WHITE_COLOR;
                }}
                labelResolution={2}
                labelAltitude={d => d.height + 0.05} // 👈 Label sits on top of the spike
                
                // Interactions
                onPointClick={handleCityClick}
                onLabelClick={handleCityClick}
                onPointHover={setHoverD}
                onLabelHover={setHoverD}
                
                // Atmosphere
                atmosphereColor={TEAL_COLOR}
                atmosphereAltitude={0.15}
            />
        </div>
    );
};

export default GlobeView;