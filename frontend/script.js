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

// ================= 🚦 SIGNAL SYSTEM =================
function signalIcon(color){
    return L.divIcon({
        className:'',
        html:`<div style="width:14px;height:14px;border-radius:50%;
        background:${color};box-shadow:0 0 10px ${color};"></div>`
    });
}

function createSignal(latlng){
    let state = 0;
    const colors = ["#22c55e","#f59e0b","#ef4444"];

    const marker = L.marker(latlng,{icon:signalIcon(colors[state])}).addTo(map);

    function updateSignal(){
        const trafficLevel = density.value;

        let delay = trafficLevel > 70 ? 1500 :
                    trafficLevel > 40 ? 2500 : 3500;

        state = (state+1)%3;
        marker.setIcon(signalIcon(colors[state]));

        setTimeout(updateSignal, delay);
    }

    updateSignal();
}

// More realistic signals
[
[21.147,79.082],[21.133,79.066],[21.140,79.080],
[21.110,79.050],[21.150,79.090],[21.145,79.085],
[21.135,79.075],[21.138,79.060],[21.128,79.072],
[21.120,79.065],[21.155,79.095],[21.142,79.078]
].forEach(createSignal);

// ================= 🚧 METRO =================
const metroZones = [
[21.140,79.078],
[21.130,79.065],
[21.120,79.055]
];

metroZones.forEach(loc=>{
    L.circle(loc,{
        radius:200,
        color:"#f97316",
        fillOpacity:0.25
    }).addTo(map).bindPopup("🚧 Metro Construction Zone");
});

// ================= 🚧 ACCIDENT =================
let accidentPoint = null;

function generateAccident(){
    accidentPoint = Object.values(coords)[Math.floor(Math.random()*locations.length)];

    L.circle(accidentPoint,{
        radius:150,
        color:"#ef4444",
        fillOpacity:0.3
    }).addTo(map).bindPopup("🚨 Accident Detected");
}

// ================= CROWD =================
function showCrowd(level){
    if(level < 40) return;

    for(let i=0;i<Math.floor(level/12);i++){
        const loc = Object.values(coords)[Math.floor(Math.random()*locations.length)];

        L.circle(loc,{
            radius:120,
            color:"#fb923c",
            fillOpacity:0.15
        }).addTo(map);
    }
}

// ================= 🧠 SMART SUGGESTIONS =================
function generateSuggestions(route, trafficLevel, emergencyMode){

    const suggestions = [];

    if(trafficLevel > 70){
        suggestions.push("Heavy congestion → avoid main intersections");
    } else if(trafficLevel > 40){
        suggestions.push("Moderate traffic → expect signal delays");
    } else {
        suggestions.push("Smooth traffic → optimal route");
    }

    if(route.includes("Gandhibagh")){
        suggestions.push("Avoid Gandhibagh (high congestion)");
    }

    if(route.includes("Sitabuldi")){
        suggestions.push("Sitabuldi is a busy hub → delays possible");
    }

    if(route.includes("Wardha Road")){
        suggestions.push("Wardha Road gives faster highway access");
    }

    if(route.includes("Civil Lines")){
        suggestions.push("Civil Lines is smoother alternative route");
    }

    const destinationNode = route[route.length-1];

    if(destinationNode.toLowerCase().includes("hospital")){
        suggestions.push("Hospital route prioritized");
    }

    if(destinationNode === "Airport"){
        suggestions.push("Airport route → keep buffer time");
    }

    // Accident awareness
    if(accidentPoint){
        suggestions.push("Accident nearby → rerouting applied");
    }

    // Metro awareness
    if(route.some(r => r === "Dharampeth" || r === "Sitabuldi")){
        suggestions.push("Metro construction may slow traffic");
    }

    if(emergencyMode){
        suggestions.push("Emergency mode → signals overridden");
    }

    return suggestions;
}

// ================= ROUTING =================
let route1, route2;

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

        if(route1) map.removeControl(route1);
        if(route2) map.removeControl(route2);

        route1 = L.Routing.control({
            waypoints: bestRoute.map(loc => L.latLng(...coords[loc])),
            lineOptions: { styles:[{color:"#ef4444",weight:6}] },
            createMarker: () => null,
            addWaypoints:false
        }).addTo(map);

        route2 = L.Routing.control({
            waypoints: altRoute.map(loc => L.latLng(...coords[loc])),
            lineOptions: { styles:[{color:"#22c55e",weight:4,dashArray:"6,6"}] },
            createMarker: () => null,
            addWaypoints:false
        }).addTo(map);

        showCrowd(density.value);

        // ================= AI =================
        const prediction =
            density.value > 70 ? "High congestion expected" :
            density.value > 40 ? "Moderate traffic expected" :
            "Smooth traffic expected";

        const smartSuggestions = generateSuggestions(
            bestRoute,
            density.value,
            emergency.checked
        );

        trafficText.innerText = data.traffic;
        etaText.innerText = data.signal_time + " min";
        modeText.innerText = data.mode;

        confidenceBar.style.width = (data.confidence*100)+"%";

        predictionText.innerText = prediction;
        suggestionText.innerText = "✔ " + smartSuggestions.join("\n✔ ");

        aiReason.innerText =
        "🧠 AI Analysis:\n\n" +
        prediction + "\n\n" +
        "🚦 Signals + congestion + accidents analyzed.\n" +
        "🚧 Metro zones considered.\n\n" +
        (emergency.checked ? "🚑 Emergency routing enabled.\n\n" : "") +
        "🔴 Fastest route\n🟢 Alternative route\n\n" +
        "📍 " + bestRoute.join(" → ");

    } catch(err){
        alert("Backend error");
    }

    btn.innerText = "🚀 Analyze Traffic";
    btn.disabled = false;
};

});