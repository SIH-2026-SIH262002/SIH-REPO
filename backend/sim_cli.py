import sys
import time
import requests

BASE_URL = "http://localhost:8000/api"

NODES = [
    "guwahati", "shillong", "silchar", "imphal", "kohima", 
    "aizawl", "agartala", "itanagar", "gangtok", "tezpur", 
    "jorhat", "dibrugarh", "dimapur", "haflong", "lunglei"
]

def check_backend():
    try:
        res = requests.get(f"{BASE_URL}/health", timeout=2)
        if res.status_code == 200:
            return True
    except Exception:
        pass
    return False

def print_banner():
    print("\n" + "=" * 70)
    print(" 🏆 NER LOGISENSE — SIH PROTOTYPE DEMO SIMULATION CONTROLLER")
    print("=" * 70)
    print(" Target Server : http://localhost:8000")
    print(" Active Mode   : Standalone CLI Terminal Controller")
    print("=" * 70)

def menu():
    print("\nSelect a Demo Scenario to execute live across the web dashboard:")
    print(" [1] 🟢 Scenario 1: Reset Baseline (Normal Telemetry Operations)")
    print(" [2] 🌩️ Scenario 2: Inject Severe Monsoon Storm in Silchar Corridor (NH-27)")
    print(" [3] 🚨 Scenario 3: Trigger Driver Emergency SOS Breakdown (Vehicle NER-07)")
    print(" [4] 📝 Scenario 4: Submit Field Officer Ground Truth Override Report")
    print(" [5] ⚡ Custom Telemetry Injector (Select Node & Rainfall)")
    print(" [6] ❌ Exit Controller\n")

def run_scenario_1():
    print("\n[ACTION] Resetting system network baseline telemetry...")
    try:
        res = requests.post(f"{BASE_URL}/sensors/reset-scenario", timeout=3)
        if res.status_code == 200:
            print(" ✅ SUCCESS: All 18 NER sensor nodes reset to normal baseline (0-20% risk).")
        else:
            print(f" ⚠️ Response: {res.status_code} - {res.text}")
    except Exception as e:
        print(f" ❌ Error connecting to server: {e}")

def run_scenario_2():
    print("\n[ACTION] Injecting Severe Storm Event at SILCHAR (NH-27 Corridor)...")
    try:
        payload = {
            "node_key": "silchar",
            "rainfall_24h": 145.0,
            "vibration": 5.2,
            "duration_ticks": 15
        }
        res = requests.post(f"{BASE_URL}/sensors/inject-storm", json=payload, timeout=3)
        if res.status_code == 200:
            print(" ⚡ SUCCESS: Storm injected!")
            print(" 🛰️ Silchar Risk Score -> 88 (SEVERE)")
            print(" 📲 Check Web Dashboard: Live map risk circle glowing RED, AI route reroute suggested, Twilio alert outbox logged!")
        else:
            print(f" ⚠️ Response: {res.status_code} - {res.text}")
    except Exception as e:
        print(f" ❌ Error connecting to server: {e}")

def run_scenario_3():
    print("\n[ACTION] Dispatching Emergency SOS Breakdown for Vehicle NER-07...")
    try:
        payload = {
            "vehicle_id": "v-07",
            "vehicle_code": "NER-07",
            "driver_name": "Rajesh Sharma",
            "location_name": "Dima Hasao Pass (NH-27)",
            "latitude": 25.18,
            "longitude": 92.93,
            "emergency_type": "ENGINE_FAILURE_LANDSLIDE_BLOCKED",
            "description": "Logistics truck carrying emergency medical supplies blocked by loose scree & mudslide.",
            "cargo": "Emergency Medicines & Oxygen Cylinders"
        }
        res = requests.post(f"{BASE_URL}/sos", json=payload, timeout=3)
        if res.status_code == 200:
            print(" 🚨 SUCCESS: Driver SOS alert broadcast!")
            print(" 📲 Check Web Dashboard: Emergency SOS radar pulsing red with 1-click dispatch option!")
        else:
            print(f" ⚠️ Response: {res.status_code} - {res.text}")
    except Exception as e:
        print(f" ❌ Error connecting to server: {e}")

def run_scenario_4():
    print("\n[ACTION] Submitting Field Officer Ground Truth Report Override...")
    try:
        payload = {
            "node_key": "SILCHAR",
            "officer_id": "FO-8042",
            "officer_name": "Officer T. Rongmei",
            "hazard_type": "LANDSLIDE_BLOCKAGE",
            "severity": "CRITICAL",
            "description": "Confirmed ground-truth slope collapse at KM 42 NH-27. Road blocked completely.",
            "manual_override_score": 95.0
        }
        res = requests.post(f"{BASE_URL}/reports", json=payload, timeout=3)
        if res.status_code == 200:
            print(" 📝 SUCCESS: Field report submitted & ground-truth score overridden (95/100).")
            print(" 📲 Check Web Dashboard: Field reports tab updated & map risk overridden live!")
        else:
            print(f" ⚠️ Response: {res.status_code} - {res.text}")
    except Exception as e:
        print(f" ❌ Error connecting to server: {e}")

def run_custom():
    print("\nAvailable Sensor Nodes:")
    for idx, node in enumerate(NODES, 1):
        print(f"  [{idx:2d}] {node.upper()}")
    
    choice = input("\nSelect node number (default 3 - Silchar): ").strip()
    try:
        idx = int(choice) - 1
        selected_node = NODES[idx] if 0 <= idx < len(NODES) else "silchar"
    except Exception:
        selected_node = "silchar"
    
    rain = input("Enter 24h Rainfall in mm (e.g. 150): ").strip()
    try:
        rain_val = float(rain)
    except Exception:
        rain_val = 120.0

    print(f"\n[ACTION] Injecting {rain_val}mm rainfall at node {selected_node.upper()}...")
    try:
        payload = {
            "node_key": selected_node,
            "rainfall_24h": rain_val,
            "vibration": 4.8,
            "duration_ticks": 12
        }
        res = requests.post(f"{BASE_URL}/sensors/inject-storm", json=payload, timeout=3)
        if res.status_code == 200:
            print(f" ⚡ SUCCESS: Injected rainfall at {selected_node.upper()}!")
        else:
            print(f" ⚠️ Response: {res.status_code}")
    except Exception as e:
        print(f" ❌ Error: {e}")

def main():
    print_banner()
    if not check_backend():
        print(" ⚠️ WARNING: Backend API is not responding on http://localhost:8000.")
        print(" Please start the backend service first (`python backend/app/main.py` or double click `start.bat`).\n")
    else:
        print(" 🟢 Backend Connection Verified: http://localhost:8000 is ONLINE.")

    while True:
        menu()
        cmd = input("Enter choice [1-6]: ").strip()
        if cmd == '1':
            run_scenario_1()
        elif cmd == '2':
            run_scenario_2()
        elif cmd == '3':
            run_scenario_3()
        elif cmd == '4':
            run_scenario_4()
        elif cmd == '5':
            run_custom()
        elif cmd == '6' or cmd.lower() == 'exit':
            print("\nExiting Simulation Controller. Goodbye!\n")
            sys.exit(0)
        else:
            print("Invalid choice. Please select 1 to 6.")
        time.sleep(1)

if __name__ == "__main__":
    main()
