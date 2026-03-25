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

    const locations = [
        'Sitabuldi', 'Wardha Road', 'Mihan', 'Manewada',
        'Kalamna', 'Dhantoli', 'Shankar Nagar', 'Civil Lines',
        'Gandhibagh', 'Itwari', 'Besa', 'Godhni'
    ];

    const coords = {
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

    function initMap() {
        if (mapInstance.current || !mapRef.current || typeof L === 'undefined') return;

        mapInstance.current = L.map(mapRef.current).setView([21.15, 79.08], 11);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
            .addTo(mapInstance.current);
    }

    function clearMap() {
        const map = mapInstance.current;
        if (!map) return;

        map.eachLayer(function (layer) {
            if (layer instanceof L.Marker || layer instanceof L.Polyline) {
                map.removeLayer(layer);
            }
        });
    }

    function updateMap() {
        const map = mapInstance.current;
        if (!map) return;

        clearMap();

        const s = coords[formData.source];
        const d = coords[formData.destination];

        if (s) L.marker(s).addTo(map);
        if (d) L.marker(d).addTo(map);

        if (s && d) {
            const route = [s, d];

            L.polyline(route, {
                color: formData.emergency ? '#ef4444' : '#10b981',
                weight: 6
            }).addTo(map);

            map.fitBounds(route);
        }
    }

    function handleChange(e) {
        const name = e.target.name;
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;

        setFormData(function (prev) {
            return { ...prev, [name]: value };
        });
    }

    async function analyzeTraffic() {
        if (!formData.source || !formData.destination) {
            alert("Please select source and destination");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("http://localhost:5000/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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
                trafficLevel: data.traffic || "Medium",
                eta: `${data.signal_time || 20} mins`,
                route: (data.route || []).join(" → "),
                mode: data.mode || "Normal",
                confidence: Math.floor((data.confidence || 0.8) * 100),
                insight: data.reason || "AI analysis complete"
            });

            setTimeout(function () {
                initMap();
                updateMap();
            }, 300);

        } catch (err) {
            console.error(err);
            alert("Backend not responding");
        }

        setLoading(false);
    }

    useEffect(function () {
        if (results) {
            setTimeout(initMap, 200);
        }
    }, [results]);

    const isValid = formData.source && formData.destination;

    return React.createElement('div', { className: 'container' },

        React.createElement('div', { className: 'header' },
            React.createElement('h1', null, '🗺️ Smart Traffic AI'),
            React.createElement('p', null, 'Nagpur Intelligent Traffic Optimization System')
        ),

        React.createElement('div', { className: 'main-content' },

            React.createElement('div', { className: 'panel' },

                React.createElement('h2', null, '🚦 Input'),

                React.createElement('label', null, 'Source'),
                React.createElement('select', {
                    name: 'source',
                    value: formData.source,
                    onChange: handleChange
                },
                    React.createElement('option', { value: '' }, 'Select Source'),
                    locations.map(function (loc) {
                        return React.createElement('option', { key: loc, value: loc }, loc);
                    })
                ),

                React.createElement('label', null, 'Destination'),
                React.createElement('select', {
                    name: 'destination',
                    value: formData.destination,
                    onChange: handleChange
                },
                    React.createElement('option', { value: '' }, 'Select Destination'),
                    locations.map(function (loc) {
                        return React.createElement('option', { key: loc, value: loc }, loc);
                    })
                ),

                React.createElement('button', {
                    onClick: analyzeTraffic,
                    disabled: loading || !isValid,
                    className: 'analyze-btn'
                }, loading ? "Analyzing..." : "🚀 Analyze Traffic")
            ),

            React.createElement('div', { className: 'panel' },

                results ?
                    React.createElement('div', null,

                        React.createElement('div', {
                            ref: mapRef,
                            className: 'map-container',
                            style: { height: '250px', marginBottom: '20px' }
                        }),

                        React.createElement('p', null, `Traffic: ${results.trafficLevel}`),
                        React.createElement('p', null, `ETA: ${results.eta}`),
                        React.createElement('p', null, `Route: ${results.route}`),
                        React.createElement('p', null, `Mode: ${results.mode}`),
                        React.createElement('p', null, `Confidence: ${results.confidence}%`),
                        React.createElement('p', null, `Insight: ${results.insight}`)
                    )
                    :
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
    );
}

ReactDOM.createRoot(document.getElementById('root'))
    .render(React.createElement(App));