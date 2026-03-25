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
                color: formData.emergency ? 'red' : 'green',
                weight: 5
            }).addTo(map);

            map.fitBounds(routeCoords);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    // ✅ FIXED FUNCTION
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

    const statusClass = results ? `status-${results.trafficLevel.toLowerCase()}` : '';
    const isValid = formData.source && formData.destination;

    return (
        React.createElement('div', { className: 'container' },
            React.createElement('h1', null, 'Smart Traffic Dashboard'),

            React.createElement('select', { name: 'source', onChange: handleChange },
                React.createElement('option', { value: '' }, 'Select Source'),
                nagpurLocations.map(loc =>
                    React.createElement('option', { key: loc, value: loc }, loc)
                )
            ),

            React.createElement('select', { name: 'destination', onChange: handleChange },
                React.createElement('option', { value: '' }, 'Select Destination'),
                nagpurLocations.map(loc =>
                    React.createElement('option', { key: loc, value: loc }, loc)
                )
            ),

            React.createElement('button', { onClick: analyzeTraffic }, 'Analyze'),

            results && React.createElement('div', null,
                React.createElement('h3', null, `Traffic: ${results.trafficLevel}`),
                React.createElement('p', null, `Route: ${results.route}`),
                React.createElement('p', null, `Mode: ${results.mode}`),
                React.createElement('p', null, `Confidence: ${results.confidence}%`)
            ),

            React.createElement('div', { ref: mapRef, style: { height: '300px', marginTop: '20px' } })
        )
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));