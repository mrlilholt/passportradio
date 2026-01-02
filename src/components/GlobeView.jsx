import React, { useEffect, useRef, useState, useMemo } from 'react';
import Globe from 'react-globe.gl';

const GlobeView = ({ cities, onSelectCity, visitHistory }) => {
    const globeEl = useRef();
    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [hoverD, setHoverD] = useState(null);

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
            
            // 👇 CHANGED: Reduced from 0.5 to 0.15 for a lazy, cinematic spin
            globeEl.current.controls().autoRotateSpeed = 0.15; 
            
            globeEl.current.pointOfView({ altitude: 2.0 }, 2000);
        }
    }, []);

    // 3. Process Data for Visuals
    const { uniqueVisited, arcs } = useMemo(() => {
        if (!visitHistory || visitHistory.length === 0) return { uniqueVisited: [], arcs: [] };

        // Deduplicate visited cities for Pins/Rings
        const unique = [];
        const seen = new Set();
        visitHistory.forEach(city => {
            if (!seen.has(city.name)) {
                seen.add(city.name);
                unique.push(city);
            }
        });

        // Create Flight Paths (Arcs)
        const paths = [];
        for (let i = 0; i < visitHistory.length - 1; i++) {
            const start = visitHistory[i];
            const end = visitHistory[i + 1];
            paths.push({
                startLat: start.lat,
                startLng: start.lng,
                endLat: end.lat,
                endLng: end.lng,
                color: ['rgba(255, 215, 0, 0.5)', 'rgba(45, 212, 191, 0.8)'] // Gold to Teal
            });
        }

        return { uniqueVisited: unique, arcs: paths };
    }, [visitHistory]);

    const handleCityClick = (city) => {
        // Stop rotation and zoom in
        if (globeEl.current) {
            globeEl.current.controls().autoRotate = false;
            globeEl.current.pointOfView({ lat: city.lat, lng: city.lng, altitude: 1.5 }, 1500);
            
            setTimeout(() => {
                onSelectCity(city);
            }, 1500);
        }
    };

    return (
        <div className="absolute inset-0 z-10 bg-passport-dark overflow-hidden animate-fade-in cursor-move">
            {/* UI Overlay */}
            <div className="absolute top-24 left-0 right-0 text-center z-20 pointer-events-none">
                <h2 className="text-3xl font-bold text-white drop-shadow-lg shadow-black">Select Destination</h2>
                <div className="flex justify-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full text-passport-teal backdrop-blur-sm border border-white/10">
                        <span className="w-2 h-2 rounded-full bg-passport-teal animate-pulse"></span> Available
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full text-amber-400 backdrop-blur-sm border border-white/10">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span> Visited
                    </div>
                </div>
            </div>

            <Globe
                ref={globeEl}
                width={dimensions.width}
                height={dimensions.height}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                
                // 📍 CITY PINS (DOTS)
                pointsData={cities}
                pointLat="lat"
                pointLng="lng"
                // Logic: If visited ? Gold : Teal
                pointColor={d => uniqueVisited.find(v => v.name === d.name) ? '#fbbf24' : '#2dd4bf'}
                pointAltitude={d => uniqueVisited.find(v => v.name === d.name) ? 0.2 : 0.1}
                pointRadius={d => uniqueVisited.find(v => v.name === d.name) ? 1.0 : 0.6}
                pointsMerge={true}
                
                // 📡 PULSING RINGS (Only for Visited)
                ringsData={uniqueVisited}
                ringLat="lat"
                ringLng="lng"
                ringColor={() => '#fbbf24'} // Gold rings
                ringMaxRadius={5}
                ringPropagationSpeed={2}
                ringRepeatPeriod={800}

                // ✈️ FLIGHT PATHS
                arcsData={arcs}
                arcColor="color"
                arcDashLength={0.4}
                arcDashGap={0.2}
                arcDashAnimateTime={2000}
                arcStroke={0.5}

                // 🏷️ LABELS
                labelsData={cities}
                labelLat="lat"
                labelLng="lng"
                labelText="name"
                // Only show label if Hovered OR Visited
                labelSize={d => d === hoverD || uniqueVisited.find(v => v.name === d.name) ? 1.5 : 0}
                labelDotRadius={0.5}
                labelColor={d => uniqueVisited.find(v => v.name === d.name) ? '#fbbf24' : 'white'}
                labelResolution={2}
                labelAltitude={0.16}
                
                // Interactions
                onPointClick={handleCityClick}
                onLabelClick={handleCityClick}
                onPointHover={setHoverD}
                onLabelHover={setHoverD}
                
                // Atmosphere
                atmosphereColor="#2dd4bf"
                atmosphereAltitude={0.15}
            />
        </div>
    );
};

export default GlobeView;