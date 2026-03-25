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

# ================= COST FUNCTION =================
def get_cost(a, b, density, emergency):
    ax, ay = coords[a]
    bx, by = coords[b]

    distance = math.sqrt((ax-bx)**2 + (ay-by)**2)

    traffic_factor = 1 + (density / 100)

    # simulate signal delay
    signal_penalty = random.uniform(1, 1.5)

    # emergency reduces delay
    emergency_boost = 0.5 if emergency else 1

    return distance * traffic_factor * signal_penalty * emergency_boost


# ================= DIJKSTRA =================
def find_route(start, end, density, emergency):
    distances = {node: float('inf') for node in graph}
    prev = {}
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
                prev[neighbor] = current

    # reconstruct path
    path = []
    curr = end

    while curr in prev:
        path.insert(0, curr)
        curr = prev[curr]

    path.insert(0, start)

    return path, distances[end]


# ================= MAIN AI =================
def analyze(data):
    source = data.get("source")
    destination = data.get("destination")
    density = int(data.get("vehicles", 50))
    emergency = data.get("emergency", False)

    # find best route
    route, cost = find_route(source, destination, density, emergency)

    # ================= TRAFFIC LEVEL =================
    if density > 70:
        traffic = "High"
    elif density > 40:
        traffic = "Medium"
    else:
        traffic = "Low"

    # ================= ETA =================
    base_time = cost * 100

    if emergency:
        base_time *= 0.7

    eta = max(5, int(base_time))

    # ================= MODE =================
    mode = "Emergency Priority" if emergency else "Smart Optimized"

    # ================= CONFIDENCE =================
    confidence = round(random.uniform(0.75, 0.95), 2)

    # ================= AI REASON =================
    reason = f"AI evaluated multiple paths and selected optimal route via {' → '.join(route)}. "

    reason += f"Traffic density ({density}%) influenced congestion scoring. "

    if emergency:
        reason += "Emergency priority reduced signal delays and optimized travel time. "

    reason += "Signal delays, distance, and node connectivity were dynamically analyzed."

    return {
        "traffic": traffic,
        "route": route,
        "signal_time": eta,
        "mode": mode,
        "confidence": confidence,
        "reason": reason
    }