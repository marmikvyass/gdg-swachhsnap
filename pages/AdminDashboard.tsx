import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

import { firebaseService } from "../services/firebaseService";
import { Complaint, VolunteerEvent } from "../types";
import { CATEGORIES, STATUS_COLORS } from "../constants";

/* ==========================
   HELPERS
========================== */
const getCreatedAtMs = (createdAt: any): number => {
  if (!createdAt) return 0;

  if (typeof createdAt === "object" && "seconds" in createdAt) {
    return createdAt.seconds * 1000;
  }

  if (typeof createdAt === "number") return createdAt;

  if (typeof createdAt === "string") {
    const d = new Date(createdAt).getTime();
    return isNaN(d) ? 0 : d;
  }

  return 0;
};

const formatDate = (createdAt: any) => {
  const ms = getCreatedAtMs(createdAt);
  return ms ? new Date(ms).toLocaleString() : "—";
};

export const AdminDashboard: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [events, setEvents] = useState<VolunteerEvent[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });

  const [showDriveModal, setShowDriveModal] = useState(false);
  const [drive, setDrive] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
  });

  // ==========================
  // LOGOUT
  // ==========================
  const handleLogout = async () => {
    await signOut(auth);
  };

  // ==========================
  // DATA SUBSCRIPTIONS
  // ==========================
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

    return () => {
      unsubComplaints();
      unsubEvents();
    };
  }, []);

  // ==========================
  // CREATE CLEANUP DRIVE
  // ==========================
  const createCleanupDrive = async () => {
    if (!drive.title || !drive.date || !drive.location) {
      alert("Title, Date and Location are required");
      return;
    }

    await firebaseService.createEvent({
      title: drive.title,
      description: drive.description,
      date: new Date(drive.date).getTime(),
      location: drive.location, // ✅ STRING LOCATION
      participants: [],
    });

    setDrive({
      title: "",
      description: "",
      date: "",
      location: "",
    });

    setShowDriveModal(false);
    alert("Clean-up drive created");
  };

  // ==========================
  // DELETE CLEANUP DRIVE
  // ==========================
  
  // ==========================
  // UI
  // ==========================
  return (
    <div className="space-y-8 text-black">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Admin Console</h2>

        <div className="flex gap-3">
          <button
            onClick={() => setShowDriveModal(true)}
            className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold"
          >
            ➕ Create Clean-up Drive
          </button>

          <button
            onClick={handleLogout}
            className="bg-red-50 text-red-600 px-5 py-3 rounded-xl font-bold border"
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

      {/* COMPLAINT TABLE */}
      <div className="bg-white rounded-3xl border overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-xs">Evidence</th>
              <th className="px-6 py-4 text-xs">Reporter</th>
              <th className="px-6 py-4 text-xs">Category</th>
              <th className="px-6 py-4 text-xs">Priority</th>
              <th className="px-6 py-4 text-xs">Status</th>
              <th className="px-6 py-4 text-xs">Date</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-6 py-4">
                  <img
                    src={c.beforeImage}
                    className="w-24 h-24 object-cover rounded"
                  />
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
                <td className="px-6 py-4 text-xs">
                  {formatDate(c.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CLEAN-UP DRIVES LIST */}
      <div className="bg-white rounded-3xl border p-6">
        <h3 className="text-xl font-bold mb-4">Clean-up Drives</h3>

        {events.length === 0 ? (
          <p className="text-gray-400">No drives created yet</p>
        ) : (
          <div className="space-y-3">
            {events.map((e) => (
              <div
                key={e.id}
                className="flex justify-between items-center border p-4 rounded-xl"
              >
                <div>
                  <p className="font-bold">{e.title}</p>
                  <p className="text-xs text-gray-500">
                    📍 {e.location}
                  </p>
                  <p className="text-xs text-gray-500">
                    📅 {new Date(e.date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-600">
                    👥 {e.participants?.length || 0} participants
                  </p>
                </div>

                
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE DRIVE MODAL */}
      {showDriveModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-3">
            <h3 className="font-bold text-lg">Create Clean-up Drive</h3>

            <input
              placeholder="Title"
              className="w-full p-3 border rounded"
              value={drive.title}
              onChange={(e) => setDrive({ ...drive, title: e.target.value })}
            />

            <textarea
              placeholder="Description"
              className="w-full p-3 border rounded"
              value={drive.description}
              onChange={(e) => setDrive({ ...drive, description: e.target.value })}
            />

            <input
              type="date"
              className="w-full p-3 border rounded"
              value={drive.date}
              onChange={(e) => setDrive({ ...drive, date: e.target.value })}
            />

            <input
              placeholder="Location (e.g. Near City Park, Ahmedabad)"
              className="w-full p-3 border rounded"
              value={drive.location}
              onChange={(e) => setDrive({ ...drive, location: e.target.value })}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDriveModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={createCleanupDrive}
                className="px-4 py-2 bg-blue-600 text-white rounded font-bold"
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
