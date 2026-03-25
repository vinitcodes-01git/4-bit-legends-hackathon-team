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

// MAP
let map = L.map("map").setView([21.15,79.08], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
.addTo(map);

map.zoomControl.setPosition("bottomright");

// ================= SIGNAL ICONS =================
const signalIcon = (color) => L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};box-shadow:0 0 10px ${color}"></div>`
});

const signals = [
[21.147,79.082],
[21.133,79.066],
[21.140,79.080],
[21.110,79.050],
[21.150,79.090]
];

signals.forEach((s,i)=>{
    const colors = ["green","orange","red"];
    const color = colors[i % 3];

    L.marker(s,{icon: signalIcon(color)})
    .addTo(map)
    .bindPopup(`🚦 Smart Signal (${color})`);
});

// ================= HOSPITAL =================
Object.keys(coords).forEach(loc => {
    if (loc.toLowerCase().includes("hospital") || loc.includes("AIIMS")) {
        L.marker(coords[loc])
        .addTo(map)
        .bindPopup("🏥 " + loc);
    }
});

// ================= ROUTE =================
let route;
let vehicles = [];
let animationInterval;

// COLOR
function getTrafficColor(level){
    if(emergency.checked) return "#ff0000";
    if(level==="High") return "#ef4444";
    if(level==="Medium") return "#f59e0b";
    return "#22c55e";
}

// 🚗 VEHICLE ANIMATION
function spawnVehicles(path){
    vehicles.forEach(v => map.removeLayer(v));
    vehicles = [];

    path.forEach(coord => {
        const car = L.circleMarker(coord,{
            radius:5,
            color:"#38bdf8"
        }).addTo(map);

        vehicles.push(car);
    });

    let index = 0;

    animationInterval = setInterval(()=>{
        vehicles.forEach((v,i)=>{
            if(path[index+i]){
                v.setLatLng(path[index+i]);
            }
        });
        index++;
        if(index > path.length) index = 0;
    },300);
}

// ================= ANALYZE =================
btn.onclick = async function(){

    if(!source.value || !destination.value){
        alert("Select both locations");
        return;
    }

    document.body.style.filter = "brightness(0.8)";

    btn.innerText = "⚡ AI MODE ACTIVE";
    btn.disabled = true;

    try {

        const res = await fetch("http://127.0.0.1:5000/analyze",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({
                source: source.value,
                destination: destination.value,
                vehicles: density.value,
                time: "morning",
                emergency: emergency.checked
            })
        });

        const data = await res.json();

        const bestRoute = data.route;
        const path = bestRoute.map(loc => coords[loc]).filter(Boolean);

        if(route) map.removeLayer(route);
        if(animationInterval) clearInterval(animationInterval);

        // CURVED PATH (adds realism)
        const curvedPath = [];
        for(let i=0;i<path.length-1;i++){
            curvedPath.push(path[i]);
            const mid = [
                (path[i][0]+path[i+1][0])/2 + 0.002,
                (path[i][1]+path[i+1][1])/2 - 0.002
            ];
            curvedPath.push(mid);
        }
        curvedPath.push(path[path.length-1]);

        route = L.polyline(curvedPath,{
            color: getTrafficColor(data.traffic),
            weight: emergency.checked ? 10 : 6,
            opacity:0.9
        }).addTo(map);

        map.flyToBounds(route.getBounds(), {duration:1.5});

        // 🚨 EMERGENCY EFFECT
        if(emergency.checked){
            let glow = true;
            animationInterval = setInterval(()=>{
                route.setStyle({weight: glow ? 12 : 8});
                glow = !glow;
            },400);
        }

        // 🚗 VEHICLES
        spawnVehicles(curvedPath);

        // UI
        trafficText.innerText = data.traffic;
        etaText.innerText = data.signal_time + " min";
        modeText.innerText = data.mode;

        confidenceBar.style.width = (data.confidence * 100) + "%";

        aiReason.innerText =
        "🧠 AI SYSTEM ACTIVE\n" +
        data.reason +
        "\n\nOptimal Path: " + bestRoute.join(" → ");

    } catch(err){
        console.error(err);
        alert("Backend not responding");
    }

    setTimeout(()=>{
        document.body.style.filter = "brightness(1)";
        btn.innerText = "🚀 Analyze Traffic";
        btn.disabled = false;
    },1000);
};

});