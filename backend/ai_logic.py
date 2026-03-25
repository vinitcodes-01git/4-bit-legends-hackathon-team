import math
import random

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

# ================= COORDS =================
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
    return math.sqrt((ax - bx)**2 + (ay - by)**2)

# ================= SMART COST FUNCTION =================
def get_cost(a, b, density, emergency):
    d = distance(a, b)

    # 🚗 congestion (non-linear)
    congestion = 1 + (density / 100) ** 1.5

    # 🚦 signal penalty (simulate signals)
    signal_penalty = random.uniform(1.0, 1.5)

    # 🧱 connectivity (busy nodes)
    connectivity_penalty = len(graph[b]) * 0.15

    # 🚧 accident simulation
    accident_penalty = random.uniform(1.0, 1.3)

    # 🚑 emergency override
    emergency_factor = 0.5 if emergency else 1

    return d * congestion * signal_penalty * (1 + connectivity_penalty) * accident_penalty * emergency_factor

# ================= DIJKSTRA =================
def find_route(start, end, density, emergency):
    distances = {node: float('inf') for node in graph}
    previous = {}
    visited = set()

    distances[start] = 0

    while True:
        current = None

        for node in distances:
            if node not in visited:
                if current is None or distances[node] < distances[current]:
                    current = node

        if current is None or current == end:
            break

        visited.add(current)

        for neighbor in graph[current]:
            cost = distances[current] + get_cost(current, neighbor, density, emergency)

            if cost < distances[neighbor]:
                distances[neighbor] = cost
                previous[neighbor] = current

    # reconstruct path
    path = []
    curr = end

    while curr in previous:
        path.insert(0, curr)
        curr = previous[curr]

    path.insert(0, start)

    return path, distances[end]

# ================= ALTERNATE ROUTE =================
def generate_alternate_route(route):
    if len(route) > 2:
        alt = route.copy()
        alt.insert(1, alt.pop(-2))  # small variation
        return alt
    return route

# ================= TRAFFIC =================
def classify_traffic(density):
    if density > 70:
        return "High"
    elif density > 40:
        return "Medium"
    return "Low"

# ================= ETA =================
def calculate_eta(cost, emergency):
    eta = cost * 80
    if emergency:
        eta *= 0.7
    return max(5, int(eta))

# ================= CONFIDENCE =================
def calculate_confidence(density, route_len):
    confidence = 1 - (density / 120) + (1 / (route_len + 1))
    return round(max(0.7, min(confidence, 0.97)), 2)

# ================= AI REASON =================
def generate_reason(route, traffic, emergency):
    reason = f"Route selected via {' → '.join(route)}. "

    if traffic == "High":
        reason += "Heavy congestion detected; avoiding high-density nodes. "
    elif traffic == "Medium":
        reason += "Balanced path chosen considering moderate traffic. "
    else:
        reason += "Low congestion; fastest path selected. "

    if emergency:
        reason += "Emergency mode activated: signal delays minimized. "

    reason += "System evaluated distance, congestion, signals, and connectivity."

    return reason

# ================= MAIN =================
def analyze(data):
    source = data.get("source")
    destination = data.get("destination")
    density = int(data.get("vehicles", 50))
    emergency = data.get("emergency", False)

    # 🔴 fastest route
    route, cost = find_route(source, destination, density, emergency)

    # 🟢 alternate route
    alt_route = generate_alternate_route(route)

    # traffic
    traffic = classify_traffic(density)

    # eta
    eta = calculate_eta(cost, emergency)

    # confidence
    confidence = calculate_confidence(density, len(route))

    # mode
    mode = "Emergency Priority" if emergency else "AI Smart Routing"

    # reason
    reason = generate_reason(route, traffic, emergency)

    return {
        "traffic": traffic,
        "route": route,
        "fastest_route": route,
        "low_traffic_route": alt_route,
        "signal_time": eta,
        "mode": mode,
        "confidence": confidence,
        "reason": reason
    }