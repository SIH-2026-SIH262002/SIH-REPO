import React, { useState } from 'react';
import { Truck, PackageCheck, Route, AlertCircle, CheckCircle2, Clock, MapPin, ShieldAlert, ArrowRight, FileCheck } from 'lucide-react';

interface FleetVehicle {
  id: string;
  code: string;
  driver: string;
  origin: string;
  destination: string;
  cargo: string;
  speed: string;
  fuel: number;
  eta: string;
  status: 'ON_TRACK' | 'DELAYED' | 'AT_RISK';
}

interface CommodityStock {
  id: string;
  category: string;
  locationHub: string;
  quantity: string;
  daysRemaining: number;
  status: 'OPTIMAL' | 'LOW' | 'CRITICAL_DEPLETION';
}

interface PendingReroute {
  id: string;
  vehicleCode: string;
  currentSegment: string;
  suggestedBypass: string;
  timeSavings: string;
  riskReduction: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface DeliveryProof {
  id: string;
  shipmentId: string;
  destination: string;
  recipient: string;
  photoUrl: string;
  status: 'PENDING_CONFIRMATION' | 'CONFIRMED';
  timestamp: string;
}

export const LogisticsOperatorView: React.FC = () => {
  // 1. Fleet Vehicles
  const [fleet, setFleet] = useState<FleetVehicle[]>([
    { id: 'V-01', code: 'NER-07', driver: 'Raju Boro', origin: 'Guwahati Hub', destination: 'Silchar Civil Hospital', cargo: '2.5T Medical Supplies & Oxygen', speed: '48 km/h', fuel: 76, eta: '45 mins', status: 'ON_TRACK' },
    { id: 'V-02', code: 'NER-04', driver: 'T. Jamir', origin: 'Dimapur Freight Hub', destination: 'Kohima Relief Camp', cargo: '10T Rice & Emergency Food Packets', speed: '22 km/h', fuel: 42, eta: '2 hrs 10 mins', status: 'DELAYED' },
    { id: 'V-03', code: 'NER-02', driver: 'B. Kalita', origin: 'Shillong Warehouse', destination: 'Jowai Primary Health Center', cargo: 'Essential Insulin & Vaccines', speed: '0 km/h (Stopped)', fuel: 88, eta: 'UNKNOWN (Landslide Warning)', status: 'AT_RISK' },
    { id: 'V-04', code: 'NER-11', driver: 'D. Sharma', origin: 'Agartala Port', destination: 'Dharmanagar Sub-depot', cargo: 'Diesel Fuel Tanker', speed: '55 km/h', fuel: 91, eta: '1 hr 30 mins', status: 'ON_TRACK' },
  ]);

  // 2. Essential Commodities Supply Monitor
  const [stocks] = useState<CommodityStock[]>([
    { id: 'STK-01', category: 'Medical Oxygen & Critical ICU Drugs', locationHub: 'Silchar Civil Depot', quantity: '420 Cylinders', daysRemaining: 2, status: 'CRITICAL_DEPLETION' },
    { id: 'STK-02', category: 'Emergency Rice & Grains', locationHub: 'Guwahati Central Grain Silo', quantity: '1,450 Metric Tons', daysRemaining: 18, status: 'OPTIMAL' },
    { id: 'STK-03', category: 'Diesel & Petroleum Stock', locationHub: 'Imphal Valley Fuel Depot', quantity: '45,000 Liters', daysRemaining: 4, status: 'LOW' },
    { id: 'STK-04', category: 'Water Purification Tablets & Kits', locationHub: 'Haflong Relief Center', quantity: '12,000 Units', daysRemaining: 8, status: 'OPTIMAL' },
  ]);

  // 3. AI Reroute Recommendations
  const [reroutes, setReroutes] = useState<PendingReroute[]>([
    {
      id: 'RR-101',
      vehicleCode: 'NER-02',
      currentSegment: 'NH-27 Highway (Blockage at Haflong Km 42)',
      suggestedBypass: 'GraphHopper Bypass via Umrongso Alternate Route',
      timeSavings: '-45 Minutes',
      riskReduction: 'Landslide Risk 82% → 14%',
      status: 'PENDING',
    },
    {
      id: 'RR-102',
      vehicleCode: 'NER-04',
      currentSegment: 'NH-29 Kohima Highway Pass',
      suggestedBypass: 'Bypass via Old Kohima Bypass Valley Road',
      timeSavings: '-25 Minutes',
      riskReduction: 'Landslide Risk 65% → 22%',
      status: 'PENDING',
    },
  ]);

  // 4. Delivery Proof Confirmations
  const [deliveryProofs, setDeliveryProofs] = useState<DeliveryProof[]>([
    {
      id: 'DEL-901',
      shipmentId: 'SHIP-SILCHAR-08',
      destination: 'Silchar Civil Hospital',
      recipient: 'Chief Medical Officer Dr. H. Das',
      photoUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400&auto=format&fit=crop&q=80',
      status: 'PENDING_CONFIRMATION',
      timestamp: '14:40:15',
    },
  ]);

  // Action: Approve AI Reroute (DECISION_APPROVE)
  const handleApproveReroute = (id: string) => {
    setReroutes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'APPROVED' } : r))
    );
    // Also update vehicle state
    setFleet((prev) =>
      prev.map((v) => (v.code === 'NER-02' ? { ...v, status: 'ON_TRACK', speed: '35 km/h', eta: '1 hr 15 mins' } : v))
    );
  };

  // Action: Confirm Delivery Proof (DELIVERY_CONFIRM)
  const handleConfirmDelivery = (id: string) => {
    setDeliveryProofs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'CONFIRMED' } : d))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Regional Fleet & Supply Chain Command
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-blue-500/20 border border-blue-500/40 text-blue-300">
                LOGISTICS_OPERATOR ROLE
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Monitor active convoy telemetry, essential commodity inventory, GraphHopper AI reroute approvals, and delivery verification.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            <PackageCheck className="w-4 h-4" />
            Supply Chain Status: Active (4 Convoys)
          </span>
        </div>
      </div>

      {/* Convoy Fleet Tracking Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Convoy Telematics & Active Fleet Grid
            </h3>
            <p className="text-xs text-slate-400">Real-time GPS coordinates, fuel reserves, speed, and hazard threat status.</p>
          </div>
          <span className="text-xs font-mono text-slate-400">4 Monitored Vehicles</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {fleet.map((v) => (
            <div key={v.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex justify-between items-start">
                  <span className="font-mono text-sm font-bold text-blue-300">{v.code}</span>
                  {v.status === 'ON_TRACK' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      ON TRACK
                    </span>
                  )}
                  {v.status === 'DELAYED' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      DELAYED
                    </span>
                  )}
                  {v.status === 'AT_RISK' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300 animate-pulse">
                      AT RISK
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-white mt-1">{v.driver}</div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">{v.cargo}</div>
              </div>

              <div className="space-y-1.5 border-t border-slate-800/80 pt-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Speed:</span>
                  <span className="font-mono text-white">{v.speed}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Fuel Level:</span>
                  <span className="font-mono text-emerald-400">{v.fuel}%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>ETA Destination:</span>
                  <span className="font-mono text-sky-300">{v.eta}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Reroute Approval & Delivery Confirmations (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Reroute Approval Panel (DECISION_APPROVE) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Route className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-white text-sm">GraphHopper AI Reroute Approvals</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                DECISION_APPROVE
              </span>
            </div>

            <div className="space-y-3">
              {reroutes.map((r) => (
                <div key={r.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-sky-300">Convoy {r.vehicleCode}</span>
                    <span className="text-[11px] text-amber-400 font-medium">{r.riskReduction}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    <span className="text-rose-400 line-through mr-2">{r.currentSegment}</span>
                  </div>
                  <div className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>{r.suggestedBypass} ({r.timeSavings})</span>
                  </div>

                  <div className="pt-2 flex justify-end">
                    {r.status === 'PENDING' ? (
                      <button
                        onClick={() => handleApproveReroute(r.id)}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Reroute Corridor</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Reroute Approved & Dispatched</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Delivery Proof Reviewer (DELIVERY_CONFIRM) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Delivery Proof Verification</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                DELIVERY_CONFIRM
              </span>
            </div>

            <div className="space-y-3">
              {deliveryProofs.map((dp) => (
                <div key={dp.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex gap-4 items-center">
                  <img
                    src={dp.photoUrl}
                    alt="Proof of Delivery"
                    className="w-20 h-20 object-cover rounded-lg border border-slate-700 shrink-0"
                  />
                  <div className="flex-1 space-y-1 text-xs">
                    <div className="font-bold text-white">{dp.shipmentId}</div>
                    <div className="text-slate-400">Destination: <strong className="text-slate-200">{dp.destination}</strong></div>
                    <div className="text-slate-400">Signed Recipient: <strong className="text-slate-200">{dp.recipient}</strong></div>
                    <div className="text-[10px] font-mono text-slate-500">Timestamp: {dp.timestamp}</div>

                    <div className="pt-2">
                      {dp.status === 'PENDING_CONFIRMATION' ? (
                        <button
                          onClick={() => handleConfirmDelivery(dp.id)}
                          className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition shadow-sm"
                        >
                          Confirm & Close Delivery Ticket
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded inline-block">
                          Delivery Confirmed & Archival Logged
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Essential Commodity Stock Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          Essential Commodity Inventory & Regional Stock Depletion Monitor
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stocks.map((stk) => (
            <div key={stk.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-xs text-white">{stk.category}</span>
                {stk.status === 'CRITICAL_DEPLETION' && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    CRITICAL
                  </span>
                )}
                {stk.status === 'LOW' && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    LOW STOCK
                  </span>
                )}
                {stk.status === 'OPTIMAL' && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    OPTIMAL
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">{stk.locationHub}</div>
              <div className="text-lg font-extrabold text-white mt-1">{stk.quantity}</div>
              <div className="text-[11px] text-slate-400 font-mono">Est. Reserve: {stk.daysRemaining} Days</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
