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

const btn = document.getElementById("analyzeBtn");

// 🔥 FULL NAGPUR LOCATIONS
const locations = [
"Sitabuldi","Wardha Road","Airport","Railway Station",
"AIIMS","Wockhardt","Civil Lines","Dharampeth",
"Pratap Nagar","Hingna","Itwari","Gandhibagh",
"Manish Nagar","Besa","Mihan","Kalamna"
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
"Gandhibagh":[21.140,79.080],
"Manish Nagar":[21.110,79.070],
"Besa":[21.116,79.016],
"Mihan":[21.100,79.033],
"Kalamna":[21.166,79.083]
};

locations.forEach(l=>{
    source.innerHTML += `<option>${l}</option>`;
    destination.innerHTML += `<option>${l}</option>`;
});

density.oninput = ()=> densityValue.innerText = density.value+"%";

// 🚀 MAP
let map = L.map("map").setView([21.15,79.08],11);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

// 🚦 Traffic signals (static demo)
const signals = [
[21.147,79.082],
[21.133,79.066],
[21.140,79.080],
[21.110,79.050]
];

signals.forEach(s=>{
    L.circleMarker(s,{
        radius:6,
        color:"orange"
    }).addTo(map).bindPopup("Traffic Signal");
});

let route;

// 🚀 ANALYZE
btn.onclick = async function(){

    if(!source.value || !destination.value){
        alert("Select locations");
        return;
    }

    btn.innerText = "Analyzing...";
    btn.disabled = true;

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

    if(route) map.removeLayer(route);

    const color = emergency.checked ? "red" :
        data.traffic==="High" ? "red" :
        data.traffic==="Medium" ? "orange" : "green";

    route = L.polyline(
        [coords[source.value], coords[destination.value]],
        {
            color: color,
            weight: emergency.checked ? 8 : 5
        }
    ).addTo(map);

    map.fitBounds(route.getBounds());

    // UI
    trafficText.innerText = data.traffic;
    etaText.innerText = data.signal_time+" min";
    modeText.innerText = data.mode;

    confidenceBar.style.width = (data.confidence*100)+"%";

    btn.innerText = "Analyze Traffic";
    btn.disabled = false;
};

});