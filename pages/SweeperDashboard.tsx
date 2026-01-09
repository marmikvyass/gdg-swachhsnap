import React, { useState, useEffect } from "react";
import { CameraView } from "../components/CameraView";
import { firebaseService } from "../services/firebaseService";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { Complaint } from "../types";
import { CATEGORIES } from "../constants";
import { uploadToCloudinary } from "../services/cloudinaryUpload";

export const SweeperDashboard: React.FC = () => {
  const [assigned, setAssigned] = useState<Complaint[]>([]);
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentUser = auth.currentUser;

  // ==========================
  // SIGN OUT
  // ==========================
  const handleSignOut = async () => {
    await signOut(auth);
  };

  // ==========================
  // SUBSCRIBE ASSIGNED TASKS
  // ==========================
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = firebaseService.subscribeToComplaints(
      (complaints) => {
        setAssigned(complaints.filter((c) => c.status !== "done"));
      },
      { assignedSweeperId: currentUser.uid }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // ==========================
  // ACTIONS
  // ==========================
  const handleComplete = (complaint: Complaint) => {
    setActiveComplaint(complaint);
    setShowCamera(true);
  };

  const submitAfterPhoto = async (image: string) => {
    if (!activeComplaint) return;

    setLoading(true);
    try {
      const imageUrl = await uploadToCloudinary(image);

      await firebaseService.updateComplaint(activeComplaint.id, {
        afterImage: imageUrl,
        status: "review",
      });

      setShowCamera(false);
      setActiveComplaint(null);
      alert("After image uploaded. Waiting for admin approval.");
    } catch (err) {
      console.error(err);
      alert("Failed to upload image.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // UI
  // ==========================
  return (
    <div className="space-y-8 pb-20 text-black">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Assigned Tasks</h2>
        <div className="flex items-center gap-3">
          <span className="bg-[#FBBC05] px-3 py-1 rounded-full text-xs font-bold">
            {assigned.length} Pending
          </span>
          <button
            onClick={handleSignOut}
            className="text-xs font-bold px-3 py-1 rounded-full border border-red-200 text-red-600 bg-red-50"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* NO TASKS */}
      {assigned.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border">
          <div className="text-4xl mb-4">🎉</div>
          <p className="text-gray-400">
            You have no pending assignments.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {assigned.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl border overflow-hidden"
            >
              <div className="grid md:grid-cols-2">
                {/* BEFORE */}
                <div className="relative">
                  <img
                    src={c.beforeImage}
                    className="w-full h-64 object-cover"
                  />
                  <span className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    Before
                  </span>
                </div>

                {/* AFTER / ACTION */}
                <div className="p-6 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-lg mb-1">
                      {
                        CATEGORIES.find(
                          (cat) => cat.value === c.category
                        )?.label
                      }
                    </h4>

                    <p className="text-sm text-gray-600 mb-4 italic">
                      {c.description || "No description provided."}
                    </p>

                    {/* AFTER IMAGE SECTION */}
                    <div className="border rounded-xl p-4 bg-gray-50">
                      <p className="text-xs font-bold mb-2">
                        After Cleanup Proof
                      </p>

                      {c.afterImage ? (
                        <>
                          <img
                            src={c.afterImage}
                            className="w-full h-40 object-cover rounded-lg mb-2"
                          />
                          <div className="text-yellow-700 text-xs font-bold">
                            ⏳ Waiting for admin approval
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-400 text-sm">
                          No after image uploaded yet
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="mt-4 flex gap-3">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${c.latitude},${c.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 bg-blue-50 text-blue-700 py-3 rounded-xl font-bold text-sm text-center"
                    >
                      📍 Navigate
                    </a>

                    {!c.afterImage && (
                      <button
                        onClick={() => handleComplete(c)}
                        disabled={loading}
                        className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold text-sm"
                      >
                        📷 Upload After Image
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CAMERA */}
      {showCamera && (
        <CameraView
          onCapture={submitAfterPhoto}
          onCancel={() => {
            setShowCamera(false);
            setActiveComplaint(null);
          }}
        />
      )}
    </div>
  );
};
