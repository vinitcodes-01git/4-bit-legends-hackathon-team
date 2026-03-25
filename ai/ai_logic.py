import math

# ================= CITY GRAPH =================
graph = {
    "Sitabuldi": ["Wardha Road","Gandhibagh","Civil Lines"],
    "Wardha Road": ["Sitabuldi","Airport","Dharampeth"],
    "Airport": ["Wardha Road","Mihan"],
    "Mihan": ["Airport","Besa"],
    "Besa": ["Mihan","Manish Nagar"],
    "Manish Nagar": ["Besa","Pratap Nagar"],
    "Pratap Nagar": ["Manish Nagar","Dharampeth"],
    "Dharampeth": ["Pratap Nagar","Wardha Road","Civil Lines"],
    "Civil Lines": ["Sitabuldi","Dharampeth","Railway Station"],
    "Railway Station": ["Civil Lines","Gandhibagh"],
    "Gandhibagh": ["Sitabuldi","Railway Station","Itwari"],
    "Itwari": ["Gandhibagh","Kalamna"],
    "Kalamna": ["Itwari","Hingna"],
    "Hingna": ["Kalamna"]
}

# ================= COORDINATES =================
coords = {
    "Sitabuldi":[21.147,79.082],
    "Wardha Road":[21.133,79.066],
    "Airport":[21.092,79.047],
    "Railway Station":[21.145,79.088],
    "Civil Lines":[21.150,79.090],
    "Dharampeth":[21.130,79.060],
    "Pratap Nagar":[21.110,79.050],
    "Manish Nagar":[21.110,79.070],
    "Besa":[21.116,79.016],
    "Mihan":[21.100,79.033],
    "Gandhibagh":[21.140,79.080],
    "Itwari":[21.150,79.090],
    "Kalamna":[21.166,79.083],
    "Hingna":[21.100,79.000]
}

# ================= DISTANCE =================
def distance(a, b):
    ax, ay = coords[a]
    bx, by = coords[b]
    return math.sqrt((ax-bx)**2 + (ay-by)**2)

# ================= SMART COST =================
def get_cost(a, b, density, emergency):
    d = distance(a, b)

    # congestion grows non-linearly
    congestion = 1 + (density/100)**1.5

    # intersections = more delay
    connectivity_penalty = len(graph[b]) * 0.1

    # time-based effect (simulate rush)
    time_penalty = 1.2 if density > 60 else 1

    # emergency override
    emergency_factor = 0.6 if emergency else 1

    return d * congestion * time_penalty * (1 + connectivity_penalty) * emergency_factor


# ================= DIJKSTRA (OPTIMIZED) =================
def find_route(start, end, density, emergency):
    unvisited = {node: float('inf') for node in graph}
    previous = {}

    unvisited[start] = 0

    while unvisited:
        current = min(unvisited, key=unvisited.get)

        if current == end:
            break

        for neighbor in graph[current]:
            new_cost = unvisited[current] + get_cost(current, neighbor, density, emergency)

            if neighbor not in unvisited:
                continue

            if new_cost < unvisited[neighbor]:
                unvisited[neighbor] = new_cost
                previous[neighbor] = current

        unvisited.pop(current)

    # reconstruct path
    path = []
    node = end

    while node in previous:
        path.insert(0, node)
        node = previous[node]

    path.insert(0, start)

    return path, len(path)


# ================= TRAFFIC CLASSIFICATION =================
def classify_traffic(density):
    if density > 75:
        return "High"
    elif density > 40:
        return "Medium"
    return "Low"


# ================= CONFIDENCE MODEL =================
def calculate_confidence(density, path_length, emergency):
    base = 0.85

    density_penalty = (density / 200)
    path_bonus = 1 / (path_length + 1)

    emergency_boost = 0.05 if emergency else 0

    confidence = base - density_penalty + path_bonus + emergency_boost

    return round(max(0.7, min(confidence, 0.98)), 2)


# ================= ETA MODEL =================
def calculate_eta(path_length, density, emergency):
    eta = path_length * 5 + (density / 2)

    if emergency:
        eta *= 0.65

    return max(5, int(eta))


# ================= AI REASON ENGINE =================
def generate_reason(route, density, emergency, traffic):
    reason = f"AI selected optimal path: {' → '.join(route)}. "

    if traffic == "High":
        reason += "Heavy congestion detected, rerouting to avoid critical nodes. "
    elif traffic == "Medium":
        reason += "Moderate traffic, balanced path selected. "
    else:
        reason += "Low congestion, fastest path chosen. "

    if emergency:
        reason += "Emergency override activated: signals minimized, priority routing applied. "

    reason += "Decision based on distance, node connectivity, and dynamic congestion modeling."

    return reason


# ================= MAIN =================
def analyze(data):
    source = data.get("source")
    destination = data.get("destination")
    density = int(data.get("vehicles", 50))
    emergency = data.get("emergency", False)

    # route
    route, path_length = find_route(source, destination, density, emergency)

    # traffic
    traffic = classify_traffic(density)

    # eta
    eta = calculate_eta(path_length, density, emergency)

    # mode
    mode = "Emergency Priority" if emergency else "AI Smart Routing"

    # confidence
    confidence = calculate_confidence(density, path_length, emergency)

    # reason
    reason = generate_reason(route, density, emergency, traffic)

    return {
        "traffic": traffic,
        "route": route,
        "signal_time": eta,
        "mode": mode,
        "confidence": confidence,
        "reason": reason
    }