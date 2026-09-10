"""
Warehouse Inventory & Essential Commodity Feed Service.
Manages live stock levels, consumption rates, reorder thresholds, and warehouse status
for district depots across the North Eastern Region.
"""

from typing import Dict, Any, List

# Connected Warehouse Inventory Feed Registry
WAREHOUSES: Dict[str, Dict[str, Any]] = {
    "WH-GHY-01": {
        "warehouse_code": "WH-GHY-01",
        "warehouse_name": "Guwahati Central Logistics Depot",
        "district": "Kamrup Metro",
        "state": "Assam",
        "commodity_type": "MEDICAL_SUPPLIES",
        "stock_quantity": 1250.0,
        "unit": "Boxes",
        "reorder_threshold": 200.0,
        "consumption_rate_per_hr": 15.5,
        "status": "CONNECTED_LIVE",
        "lat": 26.1445,
        "lon": 91.7362
    },
    "WH-HAF-01": {
        "warehouse_code": "WH-HAF-01",
        "warehouse_name": "Dima Hasao Civil Hospital Depot",
        "district": "Dima Hasao",
        "state": "Assam",
        "commodity_type": "OXYGEN_CYLINDERS",
        "stock_quantity": 45.0,
        "unit": "Cylinders",
        "reorder_threshold": 30.0,
        "consumption_rate_per_hr": 2.5,
        "status": "CONNECTED_LIVE",
        "lat": 25.4800,
        "lon": 93.0200
    },
    "WH-SLC-01": {
        "warehouse_code": "WH-SLC-01",
        "warehouse_name": "Silchar Medical College Depot",
        "district": "Cachar",
        "state": "Assam",
        "commodity_type": "EMERGENCY_MEDICINES",
        "stock_quantity": 180.0,
        "unit": "Kits",
        "reorder_threshold": 50.0,
        "consumption_rate_per_hr": 4.2,
        "status": "CONNECTED_LIVE",
        "lat": 24.8300,
        "lon": 92.7800
    },
    "WH-SHL-01": {
        "warehouse_code": "WH-SHL-01",
        "warehouse_name": "Shillong State Vaccine Hub",
        "district": "East Khasi Hills",
        "state": "Meghalaya",
        "commodity_type": "COLD_CHAIN_VACCINES",
        "stock_quantity": 850.0,
        "unit": "Vials",
        "reorder_threshold": 150.0,
        "consumption_rate_per_hr": 12.0,
        "status": "CONNECTED_LIVE",
        "lat": 25.5788,
        "lon": 91.8933
    },
    "WH-IMP-01": {
        "warehouse_code": "WH-IMP-01",
        "warehouse_name": "Imphal Food Security Warehouse",
        "district": "Imphal West",
        "state": "Manipur",
        "commodity_type": "BABY_FOOD_FORMULA",
        "stock_quantity": 320.0,
        "unit": "Cartons",
        "reorder_threshold": 80.0,
        "consumption_rate_per_hr": 3.8,
        "status": "CONNECTED_LIVE",
        "lat": 24.8170,
        "lon": 93.9368
    },
    "WH-KOH-01": {
        "warehouse_code": "WH-KOH-01",
        "warehouse_name": "Kohima Disaster Relief Store",
        "district": "Kohima",
        "state": "Nagaland",
        "commodity_type": "TARPAULINS_TENTS",
        "stock_quantity": 620.0,
        "unit": "Units",
        "reorder_threshold": 100.0,
        "consumption_rate_per_hr": 5.0,
        "status": "CONNECTED_LIVE",
        "lat": 25.6751,
        "lon": 94.1086
    },
    "WH-AIZ-01": {
        "warehouse_code": "WH-AIZ-01",
        "warehouse_name": "Aizawl Emergency Fuel Reserve",
        "district": "Aizawl",
        "state": "Mizoram",
        "commodity_type": "DIESEL_FUEL",
        "stock_quantity": 18500.0,
        "unit": "Liters",
        "reorder_threshold": 4000.0,
        "consumption_rate_per_hr": 250.0,
        "status": "CONNECTED_LIVE",
        "lat": 23.7176,
        "lon": 92.7176
    },
    "WH-ITN-01": {
        "warehouse_code": "WH-ITN-01",
        "warehouse_name": "Itanagar Essential Supplies Hub",
        "district": "Papum Pare",
        "state": "Arunachal Pradesh",
        "commodity_type": "DRY_RATIONS",
        "stock_quantity": 980.0,
        "unit": "Packs",
        "reorder_threshold": 200.0,
        "consumption_rate_per_hr": 18.0,
        "status": "CONNECTED_LIVE",
        "lat": 27.1000,
        "lon": 93.6200
    },
    "WH-GTK-01": {
        "warehouse_code": "WH-GTK-01",
        "warehouse_name": "Gangtok High Altitude Depot",
        "district": "East Sikkim",
        "state": "Sikkim",
        "commodity_type": "HEATING_FUEL",
        "stock_quantity": 4200.0,
        "unit": "Liters",
        "reorder_threshold": 800.0,
        "consumption_rate_per_hr": 65.0,
        "status": "CONNECTED_LIVE",
        "lat": 27.3389,
        "lon": 88.6065
    }
}


def list_warehouses() -> List[Dict[str, Any]]:
    return list(WAREHOUSES.values())


def get_warehouse_by_district(district: str) -> Dict[str, Any] | None:
    d_clean = district.lower().strip()
    for w in WAREHOUSES.values():
        if d_clean in w["district"].lower() or w["district"].lower() in d_clean:
            return w
    return None


def update_warehouse_stock(warehouse_code: str, new_quantity: float) -> Dict[str, Any] | None:
    w = WAREHOUSES.get(warehouse_code)
    if w:
        w["stock_quantity"] = max(0.0, float(new_quantity))
        return w
    return None
