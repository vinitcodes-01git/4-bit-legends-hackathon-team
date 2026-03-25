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

// ================= ALL LOCATIONS (RESTORED) =================
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

// ✅ CLEAN + CLEAR MAP
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

L.control.zoom({position:"bottomright"}).addTo(map);

// ================= SIGNALS =================
function signalIcon(color){
    return L.divIcon({
        html:`<div style="width:10px;height:10px;border-radius:50%;
        background:${color};box-shadow:0 0 6px ${color};"></div>`
    });
}

// realistic signals
[
[21.147,79.082],[21.133,79.066],[21.140,79.080],
[21.110,79.050],[21.150,79.090],[21.145,79.085],
[21.138,79.060],[21.128,79.072]
].forEach(loc=>{
    let state=0;
    const colors=["#22c55e","#f59e0b","#ef4444"];

    const marker=L.marker(loc,{icon:signalIcon(colors[state])}).addTo(map);

    function loop(){
        let delay = density.value > 70 ? 1500 :
                    density.value > 40 ? 2500 : 3500;

        state=(state+1)%3;
        marker.setIcon(signalIcon(colors[state]));

        setTimeout(loop, delay);
    }

    loop();
});

// ================= ROUTES =================
let route1, route2;
let startMarker, endMarker;

// marker style
function markerIcon(label,color){
    return L.divIcon({
        html:`<div style="background:${color};color:white;
        padding:4px 6px;border-radius:6px;font-size:10px;font-weight:600">
        ${label}</div>`
    });
}

// ================= ANALYZE =================
btn.onclick = async function(){

    if(!source.value || !destination.value){
        alert("Select locations");
        return;
    }

    btn.innerText="Analyzing...";
    btn.disabled=true;

    aiReason.innerText="Analyzing traffic...";

    try {

        // ✅ FIXED BACKEND URL
        const res = await fetch("http://localhost:5000/analyze",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({
                source:source.value,
                destination:destination.value,
                vehicles:density.value,
                emergency:emergency.checked
            })
        });

        if(!res.ok) throw new Error("Server error");

        const data = await res.json();

        const bestRoute = data.fastest_route || data.route;
        const altRoute = data.low_traffic_route || [...bestRoute].reverse();

        // CLEAR OLD
        if(route1) map.removeControl(route1);
        if(route2) map.removeControl(route2);
        if(startMarker) map.removeLayer(startMarker);
        if(endMarker) map.removeLayer(endMarker);

        // 🔴 FASTEST ROUTE
        route1 = L.Routing.control({
            waypoints: bestRoute.map(l=>L.latLng(...coords[l])),
            lineOptions:{styles:[{color:"#ef4444",weight:6}]},
            createMarker:()=>null,
            addWaypoints:false
        }).addTo(map);

        // 🟢 ALT ROUTE
        route2 = L.Routing.control({
            waypoints: altRoute.map(l=>L.latLng(...coords[l])),
            lineOptions:{styles:[{color:"#22c55e",weight:4,dashArray:"6,6"}]},
            createMarker:()=>null,
            addWaypoints:false
        }).addTo(map);

        // MARKERS
        const start = coords[bestRoute[0]];
        const end = coords[bestRoute.at(-1)];

        startMarker = L.marker(start,{icon:markerIcon("A","#3b82f6")}).addTo(map);
        endMarker = L.marker(end,{icon:markerIcon("B","#ef4444")}).addTo(map);

        setTimeout(()=>{
            map.fitBounds(route1.getBounds(),{padding:[50,50]});
        },400);

        // ================= UI =================
        trafficText.innerText = data.traffic;
        etaText.innerText = data.signal_time + " min";
        modeText.innerText = data.mode;
        confidenceBar.style.width = (data.confidence*100)+"%";

        const prediction =
            density.value>70?"High congestion expected":
            density.value>40?"Moderate traffic expected":
            "Smooth traffic expected";

        predictionText.innerText = prediction;

        suggestionText.innerText =
        "• Route optimized based on traffic\n" +
        "• Alternate path available\n" +
        (emergency.checked ? "• Emergency priority enabled" : "• Normal routing");

        aiReason.innerText = data.reason;

    } catch(err){
        console.error(err);
        alert("Backend not connected ❌");
    }

    btn.innerText="Analyze Route";
    btn.disabled=false;
};

});