const { useState, useEffect, useRef } = React;

function App() {
    const [formData, setFormData] = useState({
        source: '',
        destination: '',
        vehicleDensity: 50,
        timeOfDay: 'morning',
        emergency: false
    });

    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const mapRef = useRef(null);
    const mapInstance = useRef(null);

    const nagpurLocations = [
        'Sitabuldi', 'Wardha Road', 'Mihan', 'Manewada', 
        'Kalamna', 'Dhantoli', 'Shankar Nagar', 'Civil Lines',
        'Gandhibagh', 'Itwari', 'Besa', 'Godhni'
    ];

    const locationCoords = {
        'Sitabuldi': [21.1470, 79.0827],
        'Wardha Road': [21.1333, 79.0667],
        'Mihan': [21.1000, 79.0333],
        'Manewada': [21.1167, 79.0333],
        'Kalamna': [21.1667, 79.0833],
        'Dhantoli': [21.1333, 79.0500],
        'Shankar Nagar': [21.1500, 79.0833],
        'Civil Lines': [21.1500, 79.0900],
        'Gandhibagh': [21.1400, 79.0800],
        'Itwari': [21.1500, 79.0900],
        'Besa': [21.1167, 79.0167],
        'Godhni': [21.1000, 79.0500]
    };

    const initMap = () => {
        if (mapInstance.current || !mapRef.current || typeof L === 'undefined') return;

        mapInstance.current = L.map(mapRef.current).setView([21.15, 79.08], 11);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(mapInstance.current);
    };

    const updateMap = () => {
        const map = mapInstance.current;
        if (!map || !formData.source || !formData.destination) return;

        map.eachLayer(layer => {
            if (layer instanceof L.Marker || layer instanceof L.Polyline) {
                map.removeLayer(layer);
            }
        });

        const sourceCoord = locationCoords[formData.source];
        const destCoord = locationCoords[formData.destination];

        if (sourceCoord) {
            L.marker(sourceCoord).addTo(map)
                .bindPopup(`Start: ${formData.source}`);
        }

        if (destCoord) {
            L.marker(destCoord).addTo(map)
                .bindPopup(`End: ${formData.destination}`);
        }

        if (sourceCoord && destCoord) {
            const routeCoords = [sourceCoord, destCoord];

            L.polyline(routeCoords, {
                color: formData.emergency ? '#ef4444' : '#10b981',
                weight: 6
            }).addTo(map);

            map.fitBounds(routeCoords);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const analyzeTraffic = async () => {
        if (!formData.source || !formData.destination) return;

        setLoading(true);

        try {
            const res = await fetch("http://localhost:5000/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    source: formData.source,
                    destination: formData.destination,
                    vehicles: formData.vehicleDensity,
                    time: formData.timeOfDay,
                    emergency: formData.emergency
                })
            });

            const data = await res.json();

            setResults({
                trafficLevel: data.traffic,
                eta: `${data.signal_time} mins`,
                route: data.route.join(" → "),
                signalTiming: `${data.signal_time}s`,
                mode: data.mode,
                confidence: Math.floor(data.confidence * 100),
                insight: data.reason
            });

            setTimeout(updateMap, 300);

        } catch (error) {
            console.error("Error:", error);
        }

        setLoading(false);
    };

    useEffect(() => {
        if (results) {
            setTimeout(initMap, 100);
        }
    }, [results]);

    const isValid = formData.source && formData.destination;

    return (
    React.createElement('div', { className: 'container' },

        // HEADER
        React.createElement('div', { className: 'header' },
            React.createElement('h1', null, '🗺️ Smart Traffic AI'),
            React.createElement('p', null, 'Nagpur Intelligent Traffic Optimization System')
        ),

        // MAIN GRID
        React.createElement('div', { className: 'main-content' },

            // LEFT PANEL
            React.createElement('div', { className: 'panel' },

                React.createElement('h2', null, '🚦 Input'),

                React.createElement('label', null, 'Source'),
                React.createElement('select', {
                    name: 'source',
                    value: formData.source,
                    onChange: handleChange
                },
                    React.createElement('option', { value: '' }, 'Select Source'),
                    nagpurLocations.map(loc =>
                        React.createElement('option', { key: loc, value: loc }, loc)
                    )
                ),

                React.createElement('label', null, 'Destination'),
                React.createElement('select', {
                    name: 'destination',
                    value: formData.destination,
                    onChange: handleChange
                },
                    React.createElement('option', { value: '' }, 'Select Destination'),
                    nagpurLocations.map(loc =>
                        React.createElement('option', { key: loc, value: loc }, loc)
                    )
                ),

                React.createElement('button', {
                    onClick: analyzeTraffic,
                    disabled: loading || !isValid,
                    className: 'analyze-btn'
                }, loading ? "Analyzing..." : "🚀 Analyze Traffic")
            ),

            // RIGHT PANEL
            React.createElement('div', { className: 'panel' },

                results ?
                React.createElement('div', null,

                    // MAP
                    React.createElement('div', {
                        ref: mapRef,
                        className: 'map-container'
                    }),

                    // RESULTS GRID
                    React.createElement('div', { className: 'results-grid' },

                        React.createElement('div', { className: 'result-card' },
                            React.createElement('h3', null, 'Traffic'),
                            React.createElement('div', { className: 'result-value' }, results.trafficLevel)
                        ),

                        React.createElement('div', { className: 'result-card' },
                            React.createElement('h3', null, 'ETA'),
                            React.createElement('div', { className: 'result-value' }, results.eta)
                        ),

                        React.createElement('div', { className: 'result-card' },
                            React.createElement('h3', null, 'Mode'),
                            React.createElement('div', { className: 'result-value' }, results.mode)
                        ),

                        React.createElement('div', { className: 'result-card' },
                            React.createElement('h3', null, 'Confidence'),
                            React.createElement('div', { className: 'result-value' }, `${results.confidence}%`)
                        )
                    ),

                    // ROUTE + INSIGHT
                    React.createElement('div', { className: 'ai-insight' },
                        React.createElement('p', null, `Route: ${results.route}`),
                        React.createElement('p', null, `Insight: ${results.insight}`)
                    )

                ) :
                React.createElement('div', {
                    style: { textAlign: 'center', padding: '80px', color: '#888' }
                },
                    React.createElement('h3', null, '🚦 Ready'),
                    React.createElement('p', null, 'Select route and analyze')
                )
            )
        ),

        React.createElement('div', { className: 'privacy-footer' },
            '🔒 Privacy-first | No data stored'
        )
    )
);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));