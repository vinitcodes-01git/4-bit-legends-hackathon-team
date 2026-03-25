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

// ================= UI =================
density.oninput = () => {
    densityValue.innerText = density.value + "%";
};

// ================= MAP =================
let map = L.map("map").setView([21.15,79.08], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
.addTo(map);

map.zoomControl.setPosition("bottomright");

// ================= TRAFFIC SIGNALS =================
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

    L.circleMarker(s,{
        radius:8,
        color:color,
        fillOpacity:1
    }).addTo(map)
    .bindPopup(`🚦 Signal (${color.toUpperCase()})`);
});

// ================= HOSPITAL MARKERS =================
Object.keys(coords).forEach(loc => {
    if (loc.toLowerCase().includes("hospital") || loc.includes("AIIMS")) {
        L.circleMarker(coords[loc], {
            radius: 6,
            color: "#3b82f6",
            fillOpacity: 1
        }).addTo(map).bindPopup("🏥 " + loc);
    }
});

// ================= ROUTE =================
let route;
let animationInterval;
let trafficDots = [];

// Color logic
function getTrafficColor(level){
    if(emergency.checked) return "#ff0000";
    if(level==="High") return "#ef4444";
    if(level==="Medium") return "#f59e0b";
    return "#22c55e";
}

// 🚗 Traffic simulation dots
function animateTraffic(path){
    trafficDots.forEach(dot => map.removeLayer(dot));
    trafficDots = [];

    path.forEach(coord => {
        const dot = L.circleMarker(coord,{
            radius:4,
            color:"#38bdf8"
        }).addTo(map);

        trafficDots.push(dot);
    });
}

// ================= ANALYZE =================
btn.onclick = async function(){

    if(!source.value || !destination.value){
        alert("Select both locations");
        return;
    }

    if(source.value === destination.value){
        alert("Source & Destination cannot be same");
        return;
    }

    btn.innerText = "Analyzing...";
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

        // Remove old route
        if(route) map.removeLayer(route);
        if(animationInterval) clearInterval(animationInterval);

        const path = [coords[source.value], coords[destination.value]];

        // Draw route
        route = L.polyline(path,{
            color: getTrafficColor(data.traffic),
            weight: emergency.checked ? 9 : 6,
            dashArray: emergency.checked ? "10,10" : null
        }).addTo(map);

        map.flyToBounds(route.getBounds(), {duration:1.2});

        // 🚨 Emergency blinking
        if(emergency.checked){
            let visible = true;
            animationInterval = setInterval(()=>{
                route.setStyle({opacity: visible ? 0.3 : 1});
                visible = !visible;
            },500);
        }

        // 🚗 Traffic animation
        animateTraffic(path);

        // ================= UI =================
        trafficText.innerText = data.traffic;
        etaText.innerText = data.signal_time + " min";
        modeText.innerText = data.mode;

        confidenceBar.style.width = (data.confidence * 100) + "%";

        // Color
        trafficText.style.color =
            data.traffic === "High" ? "#ef4444" :
            data.traffic === "Medium" ? "#f59e0b" : "#22c55e";

        // ================= AI REASON =================
        let reason = "";

        if(data.traffic === "High"){
            reason += "Heavy congestion detected. ";
        } else if(data.traffic === "Medium"){
            reason += "Moderate traffic conditions. ";
        } else {
            reason += "Smooth traffic flow. ";
        }

        if(density.value > 70){
            reason += "High vehicle density increasing delay. ";
        } else if(density.value < 30){
            reason += "Low density allows faster movement. ";
        }

        if(emergency.checked){
            reason += "🚑 Emergency mode activated: prioritizing fastest route. ";
        }

        reason += "AI optimized route using shortest time logic.";

        aiReason.innerText = reason;

    } catch(err){
        console.error(err);
        alert("Backend not responding");
    }

    btn.innerText = "Analyze Traffic";
    btn.disabled = false;
};

});