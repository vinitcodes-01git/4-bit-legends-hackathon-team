document.addEventListener("DOMContentLoaded", function () {

    const source = document.getElementById("source");
    const destination = document.getElementById("destination");
    const density = document.getElementById("density");
    const densityValue = document.getElementById("densityValue");
    const emergency = document.getElementById("emergency");

    const trafficText = document.getElementById("traffic");
    const etaText = document.getElementById("eta");
    const modeText = document.getElementById("mode");
    const confidenceBar = document.getElementById("confidenceBar");

    const button = document.getElementById("analyzeBtn");

    // 🚀 Expanded Nagpur Locations
    const locations = [
        "Sitabuldi","Wardha Road","Airport","Railway Station",
        "AIIMS","Wockhardt","Civil Lines","Dharampeth",
        "Pratap Nagar","Hingna","Itwari","Gandhibagh"
    ];

    const coords = {
        "Sitabuldi":[21.147,79.082],
        "Wardha Road":[21.133,79.066],
        "Airport":[21.092,79.047],
        "Railway Station":[21.145,79.088],
        "AIIMS":[21.118,79.050],
        "Wockhardt":[21.133,79.066],
        "Civil Lines":[21.150,79.090],
        "Dharampeth":[21.130,79.060],
        "Pratap Nagar":[21.110,79.050],
        "Hingna":[21.100,79.000],
        "Itwari":[21.150,79.090],
        "Gandhibagh":[21.140,79.080]
    };

    // Populate dropdowns
    locations.forEach(loc => {
        source.innerHTML += `<option>${loc}</option>`;
        destination.innerHTML += `<option>${loc}</option>`;
    });

    // Density UI
    density.oninput = function () {
        densityValue.innerText = density.value + "%";
    };

    // 🚀 Map Init
    let map = L.map('map').setView([21.15,79.08],11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
        .addTo(map);

    map.zoomControl.setPosition('bottomright');

    let routeLine;

    function getColor(traffic){
        if (emergency.checked) return "#ef4444";
        if (traffic === "High") return "#ef4444";
        if (traffic === "Medium") return "#f59e0b";
        return "#22c55e";
    }

    function setTrafficColorUI(level) {
        if (level === "High") trafficText.style.color = "#ef4444";
        else if (level === "Medium") trafficText.style.color = "#f59e0b";
        else trafficText.style.color = "#22c55e";
    }

    // 🚀 MAIN ACTION
    button.onclick = async function(){

        if (!source.value || !destination.value) {
            alert("Please select both source and destination");
            return;
        }

        if (source.value === destination.value) {
            alert("Source and destination cannot be same");
            return;
        }

        button.innerText = "Analyzing...";
        button.disabled = true;

        try {

            const res = await fetch("http://127.0.0.1:5000/analyze",{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body: JSON.stringify({
                    source: source.value,
                    destination: destination.value,
                    density: density.value,
                    emergency: emergency.checked
                })
            });

            const data = await res.json();

            // Remove old route
            if(routeLine) map.removeLayer(routeLine);

            // Draw new route
            routeLine = L.polyline(
                [coords[source.value], coords[destination.value]],
                {
                    color: getColor(data.traffic),
                    weight: emergency.checked ? 8 : 5,
                    opacity: 0.9
                }
            ).addTo(map);

            map.fitBounds(routeLine.getBounds(), {padding:[50,50]});

            // 🚀 UI UPDATE
            trafficText.innerText = data.traffic || "Medium";
            etaText.innerText = (data.signal_time || 20) + " min";
            modeText.innerText = data.mode || "Normal";

            confidenceBar.style.width = ((data.confidence || 0.8) * 100) + "%";

            setTrafficColorUI(data.traffic);

        } catch (err) {
            console.error(err);
            alert("⚠️ Backend not responding");
        }

        button.innerText = "Analyze Traffic";
        button.disabled = false;
    };

});