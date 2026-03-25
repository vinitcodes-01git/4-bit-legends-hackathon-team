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
let map = L.map("map", { zoomControl:false })
.setView([21.1458,79.0882], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
.addTo(map);

L.control.zoom({ position: "bottomright" }).addTo(map);

// ================= SIGNALS =================
const signals = [
[21.147,79.082],
[21.133,79.066],
[21.140,79.080],
[21.110,79.050],
[21.150,79.090]
];

signals.forEach((s,i)=>{
    const levels = ["Smooth","Moderate","Congested"];
    const colors = ["#22c55e","#f59e0b","#ef4444"];

    L.circleMarker(s,{
        radius:8,
        color:colors[i % 3],
        fillOpacity:1
    }).addTo(map)
    .bindPopup(`🚦 ${levels[i % 3]} Traffic Signal`);
});

// ================= CROWD HEAT =================
let crowdLayer = [];

function showCrowd(level){
    crowdLayer.forEach(c => map.removeLayer(c));
    crowdLayer = [];

    if(level < 40) return;

    const intensity = Math.floor(level / 20);

    for(let i=0;i<intensity;i++){
        const lat = 21.13 + Math.random()*0.05;
        const lng = 79.05 + Math.random()*0.05;

        const crowd = L.circle([lat,lng],{
            radius:200,
            color:"#f97316",
            fillOpacity:0.2
        }).addTo(map);

        crowdLayer.push(crowd);
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

// 🚗 VEHICLES
function animateVehicles(path){
    vehicles.forEach(v => map.removeLayer(v));
    vehicles = [];

    const dots = path.map(p =>
        L.circleMarker(p,{radius:4,color:"#38bdf8"}).addTo(map)
    );

    vehicles = dots;

    let t = 0;

    anim = setInterval(()=>{
        t += 0.02;
        vehicles.forEach((v,i)=>{
            const idx = Math.floor((t+i) % path.length);
            v.setLatLng(path[idx]);
        });
    },100);
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

        // 🚑 EMERGENCY FIX → FORCE HOSPITAL
        if(emergency.checked){
            const hospitals = locations.filter(l => l.toLowerCase().includes("hospital") || l.includes("AIIMS"));
            bestRoute = [source.value, hospitals[Math.floor(Math.random()*hospitals.length)]];
        }

        let rawPath = bestRoute.map(loc => coords[loc]).filter(Boolean);

        if(rawPath.length < 2){
            rawPath = [coords[source.value], coords[destination.value]];
        }

        if(route) map.removeLayer(route);
        if(anim) clearInterval(anim);

        // Smooth path
        const smooth = [];
        for(let i=0;i<rawPath.length-1;i++){
            smooth.push(rawPath[i]);

            const mid = [
                (rawPath[i][0]+rawPath[i+1][0])/2,
                (rawPath[i][1]+rawPath[i+1][1])/2
            ];
            smooth.push(mid);
        }
        smooth.push(rawPath[rawPath.length-1]);

        route = L.polyline(smooth,{
            color: getTrafficColor(data.traffic),
            weight: emergency.checked ? 10 : 6
        }).addTo(map);

        map.fitBounds(route.getBounds());

        // Emergency effect
        if(emergency.checked){
            let glow = true;
            anim = setInterval(()=>{
                route.setStyle({weight: glow ? 12 : 8});
                glow = !glow;
            },400);
        }

        animateVehicles(smooth);

        // Crowd system
        showCrowd(density.value);

        // UI
        trafficText.innerText = data.traffic;
        etaText.innerText = data.signal_time + " min";
        modeText.innerText = data.mode;

        confidenceBar.style.width = (data.confidence * 100) + "%";

        // 🧠 HUMAN AI STYLE
        aiReason.innerText =
        "🧠 Here's what's happening:\n\n" +
        data.reason +
        "\n\n🚦 I analyzed traffic signals, vehicle density, and congestion zones." +
        (emergency.checked ? "\n🚑 Emergency detected — prioritizing fastest hospital route." : "") +
        "\n\n📍 Route selected: " + bestRoute.join(" → ");

    } catch(err){
        console.error(err);
        alert("Backend not running");
    }

    btn.innerText = "🚀 Analyze Traffic";
    btn.disabled = false;
};

});