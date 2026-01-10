import React, { useState, useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { firebaseService } from "../services/firebaseService";
import { Complaint, VolunteerEvent, User } from "../types";
import { CATEGORIES, STATUS_COLORS } from "../constants";

/* ==========================
   HELPERS
========================== */
const getCreatedAtMs = (createdAt: any): number => {
  if (!createdAt) return 0;
  if (typeof createdAt === "object" && "seconds" in createdAt)
    return createdAt.seconds * 1000;
  if (typeof createdAt === "number") return createdAt;
  if (typeof createdAt === "string") {
    const d = new Date(createdAt).getTime();
    return isNaN(d) ? 0 : d;
  }
  return 0;
};

const formatDate = (createdAt: any) =>
  getCreatedAtMs(createdAt)
    ? new Date(getCreatedAtMs(createdAt)).toLocaleString()
    : "—";

export const AdminDashboard: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [events, setEvents] = useState<VolunteerEvent[]>([]);
  const [sweepers, setSweepers] = useState<User[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });

  /* 🔹 VIEW MODE (ADDED) */
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  /* 🔹 MAP REFS (ADDED) */
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);

  const [showDriveModal, setShowDriveModal] = useState(false);
  const [drive, setDrive] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
  });

  /* ==========================
     LOGOUT
  ========================== */
  const handleLogout = async () => {
    await signOut(auth);
  };

  /* ==========================
     DATA
  ========================== */
  useEffect(() => {
    const unsubComplaints = firebaseService.subscribeToComplaints((allC) => {
      const sorted = [...allC].sort((a, b) => {
        if (a.priority === "high" && b.priority !== "high") return -1;
        if (a.priority !== "high" && b.priority === "high") return 1;
        return getCreatedAtMs(b.createdAt) - getCreatedAtMs(a.createdAt);
      });

      setComplaints(sorted);
      setStats({
        total: allC.length,
        pending: allC.filter((c) => c.status !== "done").length,
        completed: allC.filter((c) => c.status === "done").length,
      });
    });

    const unsubEvents = firebaseService.subscribeToEvents(setEvents);
    firebaseService.getAllSweepers().then(setSweepers);

    return () => {
      unsubComplaints();
      unsubEvents();
    };
  }, []);

  /* ==========================
     MAP INITIALIZATION (ADDED)
  ========================== */
  useEffect(() => {
    if (viewMode !== "map" || !mapRef.current) return;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([22.5, 78.9], 5);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(mapInstance.current);

      markersLayer.current = L.layerGroup().addTo(mapInstance.current);
    }

    markersLayer.current?.clearLayers();

    complaints.forEach((c) => {
      if (!c.latitude || !c.longitude) return;

      const color =
        c.status === "done"
          ? "#34A853"
          : c.priority === "high"
          ? "#EA4335"
          : "#1A73E8";

      const marker = L.circleMarker(
        [Number(c.latitude), Number(c.longitude)],
        {
          radius: 8,
          fillColor: color,
          color: "#fff",
          weight: 2,
          fillOpacity: 0.9,
        }
      ).bindPopup(`
        <b>${c.userName}</b><br/>
        ${CATEGORIES.find(x => x.value === c.category)?.label}<br/>
        Priority: ${c.priority}<br/>
        Status: ${c.status}
      `);

      marker.addTo(markersLayer.current!);
    });

    setTimeout(() => mapInstance.current?.invalidateSize(), 200);
  }, [viewMode, complaints]);

  /* ==========================
     ACTIONS
  ========================== */
  const assignSweeper = async (complaintId: string, sweeperId: string) => {
    const sweeper = sweepers.find((s) => s.uid === sweeperId);
    if (!sweeper) return;

    await firebaseService.updateComplaint(complaintId, {
      assignedSweeperId: sweeper.uid,
      assignedSweeperName: sweeper.name,
      status: "review",
    });
  };

  const approveResolution = async (complaintId: string) => {
    await firebaseService.updateComplaint(complaintId, { status: "done" });
  };

  const createCleanupDrive = async () => {
    if (!drive.title || !drive.date || !drive.location) {
      alert("All fields required");
      return;
    }

    await firebaseService.createEvent({
      title: drive.title,
      description: drive.description,
      date: new Date(drive.date).getTime(),
      location: drive.location,
      participants: [],
    });

    setDrive({ title: "", description: "", date: "", location: "" });
    setShowDriveModal(false);
  };

  /* ==========================
     UI
  ========================== */
  return (
    <div className="space-y-8 text-black">

      {/* HEADER */}
      <div className="flex sm:flex-row flex-col gap-3 sm:gap-0 justify-between items-center">
        <h2 className="text-2xl font-bold">Admin Console</h2>

        <div className="flex gap-3">
          {/* 🔁 VIEW TOGGLE (ADDED, NO UI BREAK) */}
          <button
            onClick={() =>
              setViewMode(viewMode === "list" ? "map" : "list")
            }
            className="border sm:px-5 sm:py-3 px-2 py-1 sm:h-auto h-15 w-30 sm:w-60 rounded-xl font-bold"
          >
            {viewMode === "list" ? "🗺 View Map" : "📋 View List"}
          </button>

          <button
            onClick={() => setShowDriveModal(true)}
            className="bg-blue-600 text-white sm:px-5 px-2 py-1 sm:py-3 rounded-xl font-bold"
          >
            Clean-up Drive
          </button>

          <button
            onClick={handleLogout}
            className="bg-red-50 text-red-600 sm:px-5 sm:py-3 py-1 px-2 rounded-xl font-bold border"
          >
            Logout
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          ["Total Reports", stats.total],
          ["Pending Action", stats.pending],
          ["Cleaned Up", stats.completed],
        ].map(([label, value]) => (
          <div key={label} className="bg-white p-6 rounded-3xl border">
            <p className="text-sm text-gray-500">{label}</p>
            <h3 className="text-4xl font-black">{value}</h3>
          </div>
        ))}
      </div>

       {/* 🗺 MAP VIEW */}
      {viewMode === "map" && (
        <div className="bg-white rounded-3xl border h-125">
          <div ref={mapRef} className="w-full h-full rounded-3xl" />
        </div>
      )}

      {/* 📋 LIST VIEW */}
      {viewMode === "list" && (
        <>
          {/* COMPLAINT TABLE */}
          <div className="bg-white rounded-3xl border overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs">Before</th>
                  <th className="px-6 py-4 text-xs">After</th>
                  <th className="px-6 py-4 text-xs">Reporter</th>
                  <th className="px-6 py-4 text-xs">Category</th>
                  <th className="px-6 py-4 text-xs">Priority</th>
                  <th className="px-6 py-4 text-xs">Status</th>
                  <th className="px-6 py-4 text-xs">Assigned</th>
                  <th className="px-6 py-4 text-xs">Actions</th>
                </tr>
              </thead>

              <tbody>
                {complaints.map((c) => (
                  <tr key={c.id} className="border-t align-top">

                    {/* BEFORE */}
                    <td className="px-6 py-4">
                      <img
                        src={c.beforeImage}
                        className="w-20 h-20 object-cover rounded"
                      />
                    </td>

                    {/* AFTER */}
                    <td className="px-6 py-4">
                      {c.afterImage ? (
                        <img
                          src={c.afterImage}
                          className="w-20 h-20 object-cover rounded"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4 font-bold">{c.userName}</td>

                    <td className="px-6 py-4">
                      {CATEGORIES.find(x => x.value === c.category)?.label}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        c.priority === "high"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {c.priority}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${STATUS_COLORS[c.status]}`}>
                        {c.status}
                      </span>
                    </td>

                    {/* ASSIGN SWEEPER */}
                    <td className="px-6 py-4 text-xs">
                      {c.assignedSweeperName ? (
                        <span className="font-bold text-green-700">
                          {c.assignedSweeperName}
                        </span>
                      ) : (
                        <select
                          onChange={(e) => assignSweeper(c.id, e.target.value)}
                          defaultValue=""
                          className="border rounded px-2 py-1"
                        >
                          <option value="" disabled>
                            Assign Sweeper
                          </option>
                          {sweepers.map((s) => (
                            <option key={s.uid} value={s.uid}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-4 text-xs space-y-2">
                      <div>{formatDate(c.createdAt)}</div>

                      {c.status === "review" && c.afterImage && (
                        <button
                          onClick={() => approveResolution(c.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold"
                        >
                          ✅ Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CLEAN-UP DRIVES */}
          <div className="bg-white rounded-3xl border p-6 mt-6">
            <h3 className="text-xl font-bold mb-4">Clean-up Drives</h3>

            {events.length === 0 ? (
              <p className="text-gray-400">No drives created yet</p>
            ) : (
              events.map((e) => (
                <div key={e.id} className="border p-4 rounded-xl mb-3">
                  <p className="font-bold">{e.title}</p>
                  <p className="text-xs">📍 {e.location}</p>
                  <p className="text-xs">👥 {e.participants?.length || 0} joined</p>
                </div>
              ))
            )}
          </div>
        </>
      )}
      {/* CREATE CLEAN-UP DRIVE MODAL */}
{showDriveModal && (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
    <div className="bg-white p-6 rounded-xl w-full max-w-md space-y-3">
      <h3 className="text-lg font-bold">Create Clean-up Drive</h3>

      <input
        placeholder="Title"
        className="w-full p-3 border rounded"
        value={drive.title}
        onChange={(e) =>
          setDrive({ ...drive, title: e.target.value })
        }
      />

      <textarea
        placeholder="Description"
        className="w-full p-3 border rounded"
        value={drive.description}
        onChange={(e) =>
          setDrive({ ...drive, description: e.target.value })
        }
      />

      <input
        type="date"
        className="w-full p-3 border rounded"
        value={drive.date}
        onChange={(e) =>
          setDrive({ ...drive, date: e.target.value })
        }
      />

      <input
        placeholder="Location (e.g. Near City Park)"
        className="w-full p-3 border rounded"
        value={drive.location}
        onChange={(e) =>
          setDrive({ ...drive, location: e.target.value })
        }
      />

      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={() => setShowDriveModal(false)}
          className="px-4 py-2 border rounded"
        >
          Cancel
        </button>

        <button
          onClick={createCleanupDrive}
          className="bg-blue-600 text-white px-4 py-2 rounded font-bold"
        >
          Create
        </button>
      </div>
    </div>
  </div>
)}


    </div>
  );
};
