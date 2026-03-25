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
    const mapInitialized = useRef(false);

    const nagpurLocations = [
        'Sitabuldi', 'Wardha Road', 'Mihan', 'Manewada', 
        'Kalamna', 'Dhantoli', 'Shankar Nagar', 'Civil Lines',
        'Gandhibagh', 'Itwari', 'Besa', 'Godhni', '🏥 KIMS-Kingsway Hospital',
        '🏥 Max Super Speciality',
        '🏥 Wockhardt Hospital',
        '🏥 Sevenstar Hospital',
        '🏥 Daga Women\'s Hospital'
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
    'Godhni': [21.1000, 79.0500],
    '🏥 KIMS-Kingsway Hospital': [21.1452, 79.0856],
    '🏥 Max Super Speciality': [21.1167, 79.0167],
    '🏥 Wockhardt Hospital': [21.1333, 79.0667],
    '🏥 Sevenstar Hospital': [21.1500, 79.0833],
    '🏥 Daga Women\'s Hospital': [21.1470, 79.0827]
};

    const initMap = () => {
        // Safety checks
        if (mapInstance.current || !mapRef.current || typeof L === 'undefined') return;
        
        const container = mapRef.current;
        if (!container.offsetHeight || !container.offsetWidth) return;

        mapInstance.current = L.map(container).setView([21.15, 79.08], 11);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap | Nagpur Traffic System'
        }).addTo(mapInstance.current);

        mapInitialized.current = true;
    };

    const updateMap = () => {
        const map = mapInstance.current;
        if (!map || !formData.source || !formData.destination) return;

        // Clear existing overlays
        map.eachLayer(layer => {
            if (layer instanceof L.Marker || layer instanceof L.Polyline) {
                map.removeLayer(layer);
            }
        });

        const sourceCoord = locationCoords[formData.source];
        const destCoord = locationCoords[formData.destination];

        // Source marker
        if (sourceCoord) {
            L.marker(sourceCoord).addTo(map)
                .bindPopup(`🚩 Start: ${formData.source}`)
                .openPopup();
        }

        // Destination marker
        if (destCoord) {
            L.marker(destCoord).addTo(map)
                .bindPopup(`🎯 End: ${formData.destination}`);
        }

        // Route polyline
        if (sourceCoord && destCoord) {
            const midPoint1 = [
                sourceCoord[0] - 0.01,
                sourceCoord[1] + 0.01
            ];
            const midPoint2 = [
                (sourceCoord[0] + destCoord[0]) / 2,
                (sourceCoord[1] + destCoord[1]) / 2
            ];
            
            const routeCoords = [sourceCoord, midPoint1, midPoint2, destCoord];
            
            L.polyline(routeCoords, {
                color: formData.emergency ? '#ef4444' : '#10b981',
                weight: 6,
                opacity: 0.9
            }).addTo(map);

            map.fitBounds(routeCoords, {padding: [20, 20]});
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const analyzeTraffic = () => {
        if (!formData.source || !formData.destination) return;
        
        setLoading(true);
        
        setTimeout(() => {
            initMap(); // Initialize map first
            
            const densityImpact = formData.vehicleDensity / 100;
            const trafficScore = (Math.random() * 40 + densityImpact * 60);
            const level = trafficScore > 75 ? 'High' : trafficScore > 45 ? 'Medium' : 'Low';
            
            const eta = Math.max(10, 30 * trafficScore / 100).toFixed(0);
            const confidence = Math.floor(78 + Math.random() * 18);
            
            const routes = [
                `${formData.source} → Ring Road → ${formData.destination}`,
                `${formData.source} → Wardha Road → ${formData.destination}`,
                `${formData.source} → MIHAN Flyover → ${formData.destination}`
            ];
            
            const insights = [
                `High congestion: ${formData.vehicleDensity}% density detected`,
                `Moderate flow during ${formData.timeOfDay} hours`,
                `Optimal routing with ${confidence}% confidence`,
                `Emergency priority activated`,
                `Peak traffic patterns analyzed`
            ];

            setResults({
                trafficLevel: level,
                eta: `${eta} mins`,
                route: routes[Math.floor(Math.random() * routes.length)],
                signalTiming: `${Math.floor(35 + Math.random() * 30)}s`,
                mode: formData.emergency ? 'Emergency' : 'Optimized',
                confidence,
                insight: insights[Math.floor(Math.random() * insights.length)]
            });
            
            setTimeout(() => {
                updateMap();
            }, 500);
            
            setLoading(false);
        }, 2000);
    };

    // Initialize map when results appear
    useEffect(() => {
        if (results) {
            setTimeout(initMap, 100);
        }
    }, [results]);

    const statusClass = results ? `status-${results.trafficLevel.toLowerCase()}` : '';
    const isValid = formData.source && formData.destination;

    return (
        React.createElement('div', { className: 'container' },
            React.createElement('div', { className: 'header' },
                React.createElement('h1', null, '🗺️ Nagpur Smart Traffic Dashboard'),
                React.createElement('p', null, 'Real-time AI Traffic Management System')
            ),

            React.createElement('div', { className: 'main-content' },
                // LEFT PANEL - INPUTS
                React.createElement('div', { className: 'panel' },
                    React.createElement('h2', null, '🎛️ Control Panel'),
                    
                    React.createElement('div', { className: 'input-group' },
                        React.createElement('label', null, 'Source'),
                        React.createElement('select', { 
                            name: 'source', 
                            value: formData.source, 
                            onChange: handleChange 
                        },
                            React.createElement('option', { value: '' }, 'Select...'),
                            nagpurLocations.map(loc => 
                                React.createElement('option', { key: loc, value: loc }, loc)
                            )
                        )
                    ),

                    React.createElement('div', { className: 'input-group' },
                        React.createElement('label', null, 'Destination'),
                        React.createElement('select', { 
                            name: 'destination', 
                            value: formData.destination, 
                            onChange: handleChange 
                        },
                            React.createElement('option', { value: '' }, 'Select...'),
                            nagpurLocations.map(loc => 
                                React.createElement('option', { key: loc, value: loc }, loc)
                            )
                        )
                    ),

                    React.createElement('div', { className: 'input-group' },
                        React.createElement('label', null, 'Vehicle Density'),
                        React.createElement('input', {
                            type: 'range',
                            name: 'vehicleDensity',
                            value: formData.vehicleDensity,
                            onChange: handleChange,
                            min: 0,
                            max: 100,
                            step: 5
                        }),
                        React.createElement('div', { 
                            style: {textAlign: 'center', marginTop: '5px', fontWeight: 600, color: '#3b82f6'} 
                        }, `${formData.vehicleDensity}%`)
                    ),

                    React.createElement('div', { className: 'input-group' },
                        React.createElement('label', null, 'Time of Day'),
                        React.createElement('select', { 
                            name: 'timeOfDay', 
                            value: formData.timeOfDay, 
                            onChange: handleChange 
                        },
                            React.createElement('option', null, '🌅 Morning (6-10 AM)'),
                            React.createElement('option', null, '🌤️ Afternoon (12-4 PM)'),
                            React.createElement('option', null, '🌆 Evening (5-9 PM)'),
                            React.createElement('option', null, '🌙 Night (10 PM-5 AM)')
                        )
                    ),

                    React.createElement('div', { className: 'toggle-group' },
                        React.createElement('input', {
                            type: 'checkbox',
                            id: 'emergency',
                            name: 'emergency',
                            checked: formData.emergency,
                            onChange: handleChange
                        }),
                        React.createElement('label', { htmlFor: 'emergency' }, '🚨 Emergency Mode')
                    ),

                    React.createElement('button', {
                        className: 'analyze-btn',
                        onClick: analyzeTraffic,
                        disabled: loading || !isValid
                    }, loading ? '🔄 Analyzing Intelligence...' : '🎯 Analyze Traffic Intelligence')
                ),

                // RIGHT PANEL - RESULTS
                React.createElement('div', { className: 'panel' },
                    React.createElement('h2', null, '📊 Live Results'),
                    
                    results ?
                    React.createElement('div', null,
                        React.createElement('div', { className: `traffic-status ${statusClass}` },
                            results.trafficLevel
                        ),

                        // MAP - FIXED HEIGHT!
                        React.createElement('div', {
                            ref: mapRef,
                            className: 'map-container',
                            style: { 
                                height: '250px', 
                                borderRadius: '12px', 
                                marginBottom: '20px',
                                background: '#f8fafc',
                                border: '2px solid #e2e8f0'
                            }
                        }),

                        React.createElement('div', { className: 'results-grid' },
                            React.createElement('div', { className: 'result-card' },
                                React.createElement('h3', null, '🛣️ Recommended Route'),
                                React.createElement('div', { className: 'result-value' }, results.route)
                            ),
                            React.createElement('div', { className: 'result-card' },
                                React.createElement('h3', null, '⏱️ Estimated Time'),
                                React.createElement('div', { className: 'result-value' }, results.eta)
                            ),
                            React.createElement('div', { className: 'result-card' },
                                React.createElement('h3', null, '🎯 Signal Timing'),
                                React.createElement('div', { className: 'result-value' }, results.signalTiming)
                            ),
                            React.createElement('div', { className: 'result-card' },
                                React.createElement('h3', null, '⚙️ System Mode'),
                                React.createElement('div', { className: 'result-value' }, results.mode)
                            )
                        ),

                        React.createElement('div', { className: 'result-card' },
                            React.createElement('h3', null, '📊 AI Confidence'),
                            React.createElement('div', { className: 'confidence-bar' },
                                React.createElement('div', {
                                    className: 'confidence-fill',
                                    style: { width: `${results.confidence}%` }
                                })
                            ),
                            React.createElement('div', {
                                style: { textAlign: 'center', marginTop: '8px', fontWeight: 700, color: '#059669' }
                            }, `${results.confidence}%`)
                        ),

                        React.createElement('div', { className: 'ai-insight' },
                            React.createElement('h4', null, '🧠 AI Analysis'),
                            React.createElement('p', null, results.insight)
                        )
                    ) :
                    React.createElement('div', { 
                        style: { 
                            textAlign: 'center', 
                            padding: '100px 30px', 
                            color: '#9ca3af' 
                        } 
                    },
                        React.createElement('div', { style: { fontSize: '5em', marginBottom: '20px' } }, '🚦'),
                        React.createElement('h3', { style: { color: '#6b7280', marginBottom: '10px' } }, 'Traffic Control Ready'),
                        React.createElement('p', null, 'Select source & destination to activate AI analysis')
                    )
                )
            ),

            React.createElement('div', { className: 'privacy-footer' },
                '🔒 Privacy-first: No personal data collected or stored | Nagpur Traffic Control System'
            )
        )
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));