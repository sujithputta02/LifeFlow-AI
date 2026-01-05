import React from 'react';
import { MapPin } from 'lucide-react';

export default function MapComponent({ locationContext, defaultQuery }) {
    if (!locationContext || !locationContext.isLocationBased) {
        return null;
    }

    const query = locationContext.query || defaultQuery;
    if (!query) return null;

    // Using the 'no-key' iframe trick for wider compatibility without forcing user configuration immediately.
    // In production, one should use the Google Maps Embed API with a valid key.
    const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

    return (
        <div className="w-full mb-8 glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative group">
            <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                <MapPin size={12} className="text-blue-400" />
                {locationContext.query}
            </div>

            <div className="w-full h-64 md:h-80 bg-gray-900/50 relative">
                <iframe
                    width="100%"
                    height="100%"
                    src={mapSrc}
                    frameBorder="0"
                    scrolling="no"
                    marginHeight="0"
                    marginWidth="0"
                    title="Location Map"
                    className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity duration-500 filter grayscale-[30%] group-hover:grayscale-0"
                ></iframe>

                {/* Overlay gradient for deeper integration */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-80"></div>
            </div>
        </div>
    );
}
