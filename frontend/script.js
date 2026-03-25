document.addEventListener("DOMContentLoaded", function () {

// ================= ELEMENTS =================
const source = document.getElementById("source");
const destination = document.getElementById("destination");
const density = document.getElementById("density");
const densityValue = document.getElementById("densityValue");
const emergency = document.getElementById("emergency");

const trafficText = document.getElementById("traffic");
const etaText = document.getElementById("eta");
const modeText = document.getElementById("mode");
const confidenceBar = document.getElementById("confidenceBar");
const aiReason = document.getElementById("aiReason");

// 🔥 NEW UI ELEMENTS
const predictionText = document.getElementById("predictionText");
const suggestionText = document.getElementById("suggestionText");

const btn = document.getElementById("analyzeBtn");

// ================= LOCATIONS =================
const locations = [
"Sitabuldi","Wardha Road","Airport","Railway Station",
"AIIMS Nagpur","Wockhardt Hospital","Seven Star Hospital",
"KIMS Kingsway Hospital","Orange City Hospital","Care Hospital",
"Alexis Hospital","Mayo Hospital","Daga Hospital",
"Civil Lines","Dharampeth","Pratap Nagar",
"Hingna","Itwari","Gandhibagh","Manish Nagar",
"Besa","Mihan","Kalamna"
];

const coords = {
"Sitabuldi":[21.147,79.082],
"Wardha Road":[21.133,79.066],
"Airport":[21.092,79.047],
"Railway Station":[21.145,79.088],
"AIIMS Nagpur":[21.118,79.050],
"Wockhardt Hospital":[21.133,79.066],
"Seven Star Hospital":[21.150,79.083],
"KIMS Kingsway Hospital":[21.145,79.085],
"Orange City Hospital":[21.130,79.070],
"Care Hospital":[21.120,79.040],
"Alexis Hospital":[21.110,79.060],
"Mayo Hospital":[21.145,79.088],
"Daga Hospital":[21.147,79.082],
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

// Populate dropdowns
locations.forEach(loc => {
    source.innerHTML += `<option>${loc}</option>`;
    destination.innerHTML += `<option>${loc}</option>`;
});

// ================= UI =================
density.oninput = () => {
    densityValue.innerText = density.value + "%";
};

// ================= MAP =================
let map = L.map("map",{zoomControl:false}).setView([21.1458,79.0882],13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
L.control.zoom({position:"bottomright"}).addTo(map);

// ================= 🚦 SIGNALS =================
function createSignal(latlng){
    let state = 0;
    const colors = ["#22c55e","#f59e0b","#ef4444"];

    const marker = L.circleMarker(latlng,{
        radius:10,
        color:colors[state],
        fillOpacity:1
    }).addTo(map);

    setInterval(()=>{
        state = (state+1)%3;
        marker.setStyle({color:colors[state]});
    },2500);
}

[
[21.147,79.082],
[21.133,79.066],
[21.140,79.080],
[21.110,79.050],
[21.150,79.090],
[21.145,79.085],
[21.135,79.075]
].forEach(createSignal);

// ================= 🚧 METRO =================
[
[21.140,79.078],
[21.130,79.065],
[21.120,79.055]
].forEach(loc=>{
    L.circle(loc,{
        radius:200,
        color:"#f97316",
        fillOpacity:0.2
    }).addTo(map).bindPopup("🚧 Metro Construction");
});

// ================= 🚧 ACCIDENT =================
function generateAccident(){
    const loc = Object.values(coords)[Math.floor(Math.random()*locations.length)];
    L.circle(loc,{
        radius:150,
        color:"#ef4444",
        fillOpacity:0.3
    }).addTo(map).bindPopup("🚧 Accident");
}

// ================= CROWD =================
function showCrowd(level){
    if(level < 40) return;

    for(let i=0;i<Math.floor(level/15);i++){
        const loc = Object.values(coords)[Math.floor(Math.random()*locations.length)];

        L.circle(loc,{
            radius:120,
            color:"#fb923c",
            fillOpacity:0.15
        }).addTo(map);
    }
}

// ================= ROUTE =================
let route1, route2;

function smoothPath(path){
    const smooth = [];
    for(let i=0;i<path.length-1;i++){
        smooth.push(path[i]);
        smooth.push([
            (path[i][0]+path[i+1][0])/2,
            (path[i][1]+path[i+1][1])/2
        ]);
    }
    smooth.push(path[path.length-1]);
    return smooth;
}

// ================= ANALYZE =================
btn.onclick = async function(){

    if(!source.value || !destination.value){
        alert("Select locations");
        return;
    }

    btn.innerText = "⚡ AI THINKING...";
    btn.disabled = true;

    try {

        generateAccident();

        const res = await fetch("http://127.0.0.1:5000/analyze",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({
                source: source.value,
                destination: destination.value,
                vehicles: density.value,
                emergency: emergency.checked
            })
        });

        const data = await res.json();

        const bestRoute = data.route;
        const altRoute = [...bestRoute].reverse();

        const path1 = smoothPath(bestRoute.map(l=>coords[l]));
        const path2 = smoothPath(altRoute.map(l=>coords[l]));

        if(route1) map.removeLayer(route1);
        if(route2) map.removeLayer(route2);

        route1 = L.polyline(path1,{color:"#ef4444",weight:6}).addTo(map);
        route2 = L.polyline(path2,{color:"#22c55e",weight:4,dashArray:"6,6"}).addTo(map);

        map.fitBounds(route1.getBounds());

        showCrowd(density.value);

        // ================= AI LOGIC =================
        const prediction =
            density.value > 70 ? "High congestion expected" :
            density.value > 40 ? "Moderate traffic expected" :
            "Smooth traffic expected";

        const suggestions = [
            "Avoid Gandhibagh during peak hours",
            "Civil Lines is faster alternative",
            "Travel early morning for best results"
        ];

        // ================= UI =================
        trafficText.innerText = data.traffic;
        etaText.innerText = data.signal_time + " min";
        modeText.innerText = data.mode;

        confidenceBar.style.width = (data.confidence*100)+"%";

        // 🔥 UPDATE NEW PANELS
        predictionText.innerText = prediction;
        suggestionText.innerText = "✔ " + suggestions.join("\n✔ ");

        // 🤖 AI TEXT
        aiReason.innerText =
        "🧠 AI Analysis:\n\n" +
        prediction + ".\n\n" +
        "🚦 Signals, congestion, accidents, and metro zones analyzed.\n\n" +
        (emergency.checked ? "🚑 Emergency priority enabled.\n\n" : "") +
        "⚡ Fastest route shown in red.\n🌿 Alternative route in green.\n\n" +
        "📍 Selected: " + bestRoute.join(" → ");

    } catch(err){
        alert("Backend error");
    }

    btn.innerText = "🚀 Analyze Traffic";
    btn.disabled = false;
};

});