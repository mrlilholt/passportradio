import React, { useEffect, useRef, useState, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { Compass, Maximize } from 'lucide-react';

const GlobeView = ({ cities, onSelectCity }) => {
    const globeEl = useRef();
    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [hoverD, setHoverD] = useState(null);

    // Handle Window Resize to keep globe full screen
    useEffect(() => {
        const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Auto-rotate the globe slowly
    useEffect(() => {
        if (globeEl.current) {
            globeEl.current.controls().autoRotate = true;
            globeEl.current.controls().autoRotateSpeed = 0.5;
        }
    }, []);

    const handleCityClick = (city) => {
        // Zoom into the city before selecting
        if (globeEl.current) {
            globeEl.current.pointOfView({ lat: city.lat, lng: city.lng, altitude: 1.5 }, 1500);
            setTimeout(() => {
                onSelectCity(city);
            }, 1500);
        }
    };

    return (
        <div className="absolute inset-0 z-10 bg-passport-dark overflow-hidden animate-fade-in">
            {/* Overlay UI */}
            <div className="absolute top-4 left-0 right-0 text-center z-20 pointer-events-none">
                <h2 className="text-2xl font-bold text-white drop-shadow-md">Select Destination</h2>
                <p className="text-passport-teal text-sm uppercase tracking-widest font-bold">Spin to Explore</p>
            </div>

            <div className="cursor-move">
                <Globe
                    ref={globeEl}
                    width={dimensions.width}
                    height={dimensions.height}
                    globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                    backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                    
                    // City Pins
                    pointsData={cities}
                    pointLat="lat"
                    pointLng="lng"
                    pointColor={() => '#2dd4bf'} // Passport Teal
                    pointAltitude={0.15}
                    pointRadius={0.5}
                    pointsMerge={true}
                    
                    // Labels
                    labelsData={cities}
                    labelLat="lat"
                    labelLng="lng"
                    labelText="name"
                    labelSize={(d) => d === hoverD ? 2.5 : 1.5}
                    labelDotRadius={0.5}
                    labelColor={() => 'white'}
                    labelResolution={2}
                    labelAltitude={0.16}
                    
                    // Interactions
                    onPointClick={handleCityClick}
                    onLabelClick={handleCityClick}
                    onPointHover={setHoverD}
                    onLabelHover={setHoverD}
                    
                    // Atmosphere
                    atmosphereColor="#2dd4bf"
                    atmosphereAltitude={0.2}
                />
            </div>

            {/* Hint */}
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-white/50 text-xs uppercase tracking-widest pointer-events-none animate-pulse">
                Click a city to travel
            </div>
        </div>
    );
};

export default GlobeView;