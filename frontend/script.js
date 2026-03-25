document.addEventListener("DOMContentLoaded", function () {

    const source = document.getElementById("source");
    const destination = document.getElementById("destination");
    const emergency = document.getElementById("emergency");
    const button = document.getElementById("analyzeBtn");
    const results = document.getElementById("results");

    const locations = [
        "Sitabuldi", "Wardha Road", "Mihan", "Manewada",
        "Kalamna", "Dhantoli"
    ];

    const coords = {
        "Sitabuldi": [21.1470, 79.0827],
        "Wardha Road": [21.1333, 79.0667],
        "Mihan": [21.1000, 79.0333],
        "Manewada": [21.1167, 79.0333],
        "Kalamna": [21.1667, 79.0833],
        "Dhantoli": [21.1333, 79.0500]
    };

    locations.forEach(loc => {
        source.innerHTML += `<option>${loc}</option>`;
        destination.innerHTML += `<option>${loc}</option>`;
    });

    let map = L.map('map').setView([21.15, 79.08], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
        .addTo(map);

    let routeLine;

    function drawRoute(s, d, trafficLevel, isEmergency) {

        if (routeLine) map.removeLayer(routeLine);

        let color = "green";

        if (trafficLevel === "High") color = "red";
        else if (trafficLevel === "Medium") color = "orange";

        if (isEmergency) color = "red";

        routeLine = L.polyline([coords[s], coords[d]], {
            color: color,
            weight: isEmergency ? 8 : 5
        }).addTo(map);

        map.fitBounds([coords[s], coords[d]]);
    }

    button.addEventListener("click", async function () {

        if (!source.value || !destination.value) {
            alert("Select both locations");
            return;
        }

        const res = await fetch("http://127.0.0.1:5000/analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                source: source.value,
                destination: destination.value,
                emergency: emergency.checked
            })
        });

        const data = await res.json();

        drawRoute(source.value, destination.value, data.traffic, emergency.checked);

        results.innerHTML = `
            <h3>🚀 Analysis</h3>
            <p><b>Traffic:</b> ${data.traffic}</p>
            <p><b>Route:</b> ${data.route}</p>
            <p><b>Mode:</b> ${data.mode}</p>
            <p><b>Confidence:</b> ${Math.floor(data.confidence * 100)}%</p>
        `;
    });

});