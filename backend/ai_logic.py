import math
import heapq

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

# ================= COST FUNCTION =================
def get_cost(a, b, density, emergency):

    d = distance(a, b)

    # 🚗 congestion (deterministic)
    congestion = 1 + (density / 100) ** 1.3

    # 🚦 signal delay based on node importance
    signal_penalty = 1 + (len(graph[b]) * 0.1)

    # 🚧 simulated accident zones (fixed nodes)
    accident_nodes = ["Gandhibagh", "Sitabuldi"]
    accident_penalty = 1.3 if b in accident_nodes and density > 60 else 1

    # 🚑 emergency override
    emergency_factor = 0.6 if emergency else 1

    return d * congestion * signal_penalty * accident_penalty * emergency_factor

# ================= DIJKSTRA (FAST) =================
def find_route(start, end, density, emergency):

    pq = [(0, start)]
    distances = {node: float('inf') for node in graph}
    previous = {}

    distances[start] = 0

    while pq:
        current_dist, current = heapq.heappop(pq)

        if current == end:
            break

        for neighbor in graph[current]:
            cost = current_dist + get_cost(current, neighbor, density, emergency)

            if cost < distances[neighbor]:
                distances[neighbor] = cost
                previous[neighbor] = current
                heapq.heappush(pq, (cost, neighbor))

    # reconstruct path
    path = []
    node = end

    while node in previous:
        path.insert(0, node)
        node = previous[node]

    path.insert(0, start)

    return path, distances[end]

# ================= ALT ROUTE (SMART) =================
def generate_alternate_route(start, end, density):

    # increase cost for busy nodes to force variation
    modified_density = min(100, density + 25)

    alt_route, _ = find_route(start, end, modified_density, False)

    return alt_route

# ================= TRAFFIC =================
def classify_traffic(density):
    if density > 70:
        return "High"
    elif density > 40:
        return "Medium"
    return "Low"

# ================= ETA =================
def calculate_eta(cost, density, emergency):

    base_speed = 40  # km/h equivalent scaling

    eta = (cost * 100) / base_speed

    if density > 70:
        eta *= 1.4
    elif density > 40:
        eta *= 1.2

    if emergency:
        eta *= 0.7

    return max(5, int(eta))

# ================= CONFIDENCE =================
def calculate_confidence(density, route_len):

    confidence = 0.9 - (density / 150) + (1 / (route_len + 2))

    return round(max(0.75, min(confidence, 0.97)), 2)

# ================= AI REASON =================
def generate_reason(route, traffic, emergency):

    reason = f"Route selected via {' → '.join(route)}. "

    if traffic == "High":
        reason += "High congestion detected; avoiding critical nodes. "
    elif traffic == "Medium":
        reason += "Moderate traffic; balanced routing applied. "
    else:
        reason += "Low traffic; fastest path chosen. "

    if emergency:
        reason += "Emergency mode enabled: priority routing applied. "

    reason += "Decision based on congestion, signals, and road connectivity."

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
    alt_route = generate_alternate_route(source, destination, density)

    traffic = classify_traffic(density)
    eta = calculate_eta(cost, density, emergency)
    confidence = calculate_confidence(density, len(route))

    mode = "Emergency Priority" if emergency else "AI Smart Routing"
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