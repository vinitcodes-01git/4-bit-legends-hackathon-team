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
"Civil Lines","Dharampeth","Pratap Nagar",
"Hingna","Itwari","Gandhibagh","Manish Nagar",
"Besa","Mihan","Kalamna"
];

const coords = {
"Sitabuldi":[21.147,79.082],
"Wardha Road":[21.133,79.066],
"Airport":[21.092,79.047],
"Railway Station":[21.145,79.088],
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

// ✅ FIXED MAP (REAL + CLEAR)
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

L.control.zoom({position:"bottomright"}).addTo(map);

// ================= SIGNALS =================
function signalIcon(color){
    return L.divIcon({
        html:`<div style="
            width:10px;height:10px;
            border-radius:50%;
            background:${color};
            box-shadow:0 0 6px ${color};
        "></div>`
    });
}

// dynamic signals
[
[21.147,79.082],[21.133,79.066],[21.140,79.080],
[21.110,79.050],[21.150,79.090]
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
let vehicles=[];
let animationInterval;

// ================= MARKERS =================
function markerIcon(label,color){
    return L.divIcon({
        html:`<div style="
            background:${color};
            color:white;
            padding:4px 6px;
            border-radius:6px;
            font-size:10px;
            font-weight:600;
        ">${label}</div>`
    });
}

// ================= VEHICLE ANIMATION =================
function animateVehicles(path){

    if(animationInterval) clearInterval(animationInterval);

    vehicles.forEach(v=>map.removeLayer(v));
    vehicles=[];

    const dots = path.map(p =>
        L.circleMarker(p,{
            radius:3,
            color:"#38bdf8"
        }).addTo(map)
    );

    vehicles = dots;

    let t = 0;

    animationInterval = setInterval(()=>{
        t += 0.05;

        vehicles.forEach((v,i)=>{
            const idx = Math.floor((t + i) % path.length);
            v.setLatLng(path[idx]);
        });

    },120);
}

// ================= AI TEXT =================
function typeText(el,text){
    el.innerText="";
    let i=0;

    const interval=setInterval(()=>{
        el.innerText+=text[i] || "";
        i++;
        if(i>=text.length) clearInterval(interval);
    },12);
}

// ================= SUGGESTIONS =================
function generateSuggestions(route,density,emergency){

    const s=[];

    if(density>70) s.push("Heavy traffic → avoid main roads");
    else if(density>40) s.push("Moderate traffic → expect delays");
    else s.push("Smooth traffic flow");

    if(route.includes("Gandhibagh")) s.push("Gandhibagh congestion detected");
    if(route.includes("Wardha Road")) s.push("Wardha Road faster route");
    if(route.includes("Civil Lines")) s.push("Civil Lines smoother traffic");

    if(emergency) s.push("Emergency priority enabled");

    return s;
}

// ================= ANALYZE =================
btn.onclick = async function(){

    if(!source.value || !destination.value){
        alert("Select locations");
        return;
    }

    btn.innerText="Analyzing...";
    btn.disabled=true;

    typeText(aiReason,"Analyzing traffic...");

    try {

        const res = await fetch("http://127.0.0.1:5000/analyze",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({
                source:source.value,
                destination:destination.value,
                vehicles:density.value,
                emergency:emergency.checked
            })
        });

        const data = await res.json();

        const bestRoute = data.route;
        const altRoute = [...bestRoute].reverse();

        // CLEAR OLD
        if(route1) map.removeControl(route1);
        if(route2) map.removeControl(route2);
        if(startMarker) map.removeLayer(startMarker);
        if(endMarker) map.removeLayer(endMarker);

        // ROUTES
        route1 = L.Routing.control({
            waypoints: bestRoute.map(l=>L.latLng(...coords[l])),
            lineOptions:{styles:[{color:"#ef4444",weight:6}]},
            createMarker:()=>null,
            addWaypoints:false
        }).addTo(map);

        route2 = L.Routing.control({
            waypoints: altRoute.map(l=>L.latLng(...coords[l])),
            lineOptions:{styles:[{color:"#22c55e",weight:4,dashArray:"6,6"}]},
            createMarker:()=>null,
            addWaypoints:false
        }).addTo(map);

        // MARKERS
        const start = coords[bestRoute[0]];
        const end = coords[bestRoute.at(-1)];

        startMarker = L.marker(start,{
            icon:markerIcon("A","#3b82f6")
        }).addTo(map);

        endMarker = L.marker(end,{
            icon:markerIcon("B","#ef4444")
        }).addTo(map);

        setTimeout(()=>{
            map.fitBounds(route1.getBounds(),{padding:[50,50]});
        },400);

        // VEHICLES
        animateVehicles(bestRoute.map(l=>coords[l]));

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

        const smartSuggestions = generateSuggestions(bestRoute,density.value,emergency.checked);
        suggestionText.innerText = "• " + smartSuggestions.join("\n• ");

        typeText(aiReason,data.reason || "AI selected best route based on traffic.");

    } catch(err){
        console.error(err);
        alert("Backend not running ❌");
    }

    btn.innerText="Analyze Route";
    btn.disabled=false;
};

});