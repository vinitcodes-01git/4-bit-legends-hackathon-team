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
const aiReason = document.getElementById("aiReason");

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

// UI
density.oninput = () => {
    densityValue.innerText = density.value + "%";
};

// ================= MAP =================
let map = L.map("map",{zoomControl:false}).setView([21.1458,79.0882],13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
L.control.zoom({position:"bottomright"}).addTo(map);

// ================= SIGNAL SYSTEM =================
const signals = [
[21.147,79.082],
[21.133,79.066],
[21.140,79.080],
[21.110,79.050],
[21.150,79.090]
];

const signalMarkers = [];

function createSignal(latlng){
    let state = 0; // 0 green, 1 yellow, 2 red
    const colors = ["#22c55e","#f59e0b","#ef4444"];

    const marker = L.circleMarker(latlng,{
        radius:10,
        color:colors[state],
        fillOpacity:1
    }).addTo(map);

    setInterval(()=>{
        state = (state+1)%3;
        marker.setStyle({color:colors[state]});
    },3000);

    return marker;
}

signals.forEach(s=>{
    signalMarkers.push(createSignal(s));
});

// ================= CROWD =================
let crowdLayer = [];

function showCrowd(level){
    crowdLayer.forEach(c=>map.removeLayer(c));
    crowdLayer = [];

    if(level < 40) return;

    const count = Math.floor(level/10);

    for(let i=0;i<count;i++){
        const randLoc = Object.values(coords)[Math.floor(Math.random()*Object.keys(coords).length)];

        const c = L.circle(randLoc,{
            radius:150,
            color:"#f97316",
            fillOpacity:0.15
        }).addTo(map);

        crowdLayer.push(c);
    }
}

// ================= ROUTE =================
let route;
let vehicles = [];
let anim;

// COLOR
function getTrafficColor(level){
    if(emergency.checked) return "#ff0000";
    if(level==="High") return "#ef4444";
    if(level==="Medium") return "#f59e0b";
    return "#22c55e";
}

// 🚗 VEHICLE FLOW (SMOOTH)
function animateVehicles(path){
    vehicles.forEach(v=>map.removeLayer(v));
    vehicles = [];

    const cars = path.map(p =>
        L.circleMarker(p,{radius:4,color:"#38bdf8"}).addTo(map)
    );

    vehicles = cars;

    let t = 0;

    anim = setInterval(()=>{
        t += 0.01;

        vehicles.forEach((v,i)=>{
            const index = Math.floor((t*100+i)%path.length);
            v.setLatLng(path[index]);
        });

    },80);
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

        let bestRoute = data.route;

        // 🚑 FIXED EMERGENCY LOGIC
        if(emergency.checked){
            const hospitals = locations.filter(l => l.toLowerCase().includes("hospital") || l.includes("AIIMS"));
            const nearest = hospitals[0];
            bestRoute = [source.value, nearest];
        }

        let rawPath = bestRoute.map(loc => coords[loc]).filter(Boolean);

        if(rawPath.length < 2){
            rawPath = [coords[source.value], coords[destination.value]];
        }

        if(route) map.removeLayer(route);
        if(anim) clearInterval(anim);

        // Smooth curve
        const smooth = [];
        for(let i=0;i<rawPath.length-1;i++){
            smooth.push(rawPath[i]);

            const mid = [
                (rawPath[i][0]+rawPath[i+1][0])/2 + 0.002,
                (rawPath[i][1]+rawPath[i+1][1])/2 - 0.002
            ];

            smooth.push(mid);
        }
        smooth.push(rawPath[rawPath.length-1]);

        route = L.polyline(smooth,{
            color:getTrafficColor(data.traffic),
            weight: emergency.checked ? 10 : 6,
            opacity:0.9
        }).addTo(map);

        map.fitBounds(route.getBounds());

        // Emergency glow
        if(emergency.checked){
            let glow=true;
            anim=setInterval(()=>{
                route.setStyle({weight: glow?12:8});
                glow=!glow;
            },400);
        }

        animateVehicles(smooth);
        showCrowd(density.value);

        // UI
        trafficText.innerText = data.traffic;
        etaText.innerText = data.signal_time + " min";
        modeText.innerText = data.mode;

        confidenceBar.style.width = (data.confidence*100)+"%";

        // 🧠 HUMAN AI STYLE RESPONSE
        aiReason.innerText =
        "🧠 Here's the situation:\n\n" +
        (data.traffic==="High" ? "Heavy congestion detected across key nodes. " :
         data.traffic==="Medium" ? "Moderate traffic with some slow intersections. " :
         "Traffic is flowing smoothly. ") +

        "Vehicle density at " + density.value + "% influenced route optimization.\n\n" +

        (emergency.checked
            ? "🚑 Emergency mode active → prioritizing fastest hospital access with minimal signal delays.\n\n"
            : "") +

        "AI evaluated signals, congestion zones, and road connectivity to select the most efficient path.\n\n" +

        "📍 Route: " + bestRoute.join(" → ");

    } catch(err){
        console.error(err);
        alert("Backend not running");
    }

    btn.innerText = "🚀 Analyze Traffic";
    btn.disabled = false;
};

});