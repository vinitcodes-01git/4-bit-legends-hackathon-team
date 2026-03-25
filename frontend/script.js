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

    const locations = [
        "Sitabuldi","Wardha Road","Airport","Railway Station",
        "AIIMS","Wockhardt","Civil Lines"
    ];

    const coords = {
        "Sitabuldi":[21.147,79.082],
        "Wardha Road":[21.133,79.066],
        "Airport":[21.092,79.047],
        "Railway Station":[21.145,79.088],
        "AIIMS":[21.118,79.050],
        "Wockhardt":[21.133,79.066],
        "Civil Lines":[21.150,79.090]
    };

    locations.forEach(l=>{
        source.innerHTML += `<option>${l}</option>`;
        destination.innerHTML += `<option>${l}</option>`;
    });

    density.oninput = () => densityValue.innerText = density.value + "%";

    let map = L.map('map').setView([21.15,79.08],11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
        .addTo(map);

    let line;

    function getColor(traffic){
        if(emergency.checked) return "red";
        if(traffic==="High") return "red";
        if(traffic==="Medium") return "orange";
        return "green";
    }

    document.getElementById("analyzeBtn").onclick = async function(){

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

        if(line) map.removeLayer(line);

        line = L.polyline([coords[source.value], coords[destination.value]],{
            color: getColor(data.traffic),
            weight: emergency.checked ? 8 : 5
        }).addTo(map);

        map.fitBounds(line.getBounds());

        // UI Update
        trafficText.innerText = data.traffic;
        etaText.innerText = data.signal_time + " mins";
        modeText.innerText = data.mode;

        confidenceBar.style.width = (data.confidence*100)+"%";
    };

});