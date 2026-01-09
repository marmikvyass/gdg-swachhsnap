# 🧹 SwachhSnap  
**AI-Powered Smart City Cleanliness & Complaint Management System**

SwachhSnap is a **real-time, location-aware civic engagement platform** that enables citizens to report cleanliness issues, allows municipal sweepers to resolve them efficiently, and provides administrators with a live operational command center.

The system combines **geolocation, cloud imaging, priority intelligence, and role-based workflows** to create a transparent, scalable, and smart sanitation ecosystem.

---

## 🚀 Why SwachhSnap?

Cities suffer from:
- Duplicate complaints  
- Delayed clean-ups  
- No proof of work  
- No priority intelligence  
- Poor citizen engagement  

SwachhSnap solves this by introducing:
- **GPS-verified reports**
- **Image-based evidence**
- **Duplicate detection**
- **Priority zoning**
- **Live maps**
- **Accountability & audit trail**

---

## 🧩 Core Architecture

Citizen App → Firebase → Admin Console → Sweeper App
│ │ │
└── Cloudinary ── Firestore ── Live Map
│
Evidence Storage

---

## 👥 User Roles

| Role | Capabilities |
|------|--------------|
| **Citizen** | Submit complaints, upload photos, track status, give feedback, join clean-up events |
| **Sweeper** | View assigned tasks, upload after-clean photos, get navigation |
| **Admin** | Assign sweepers, approve work, see real-time city map, manage events |

---

## 🧠 Smart Intelligence

### 1️⃣ Duplicate Detection  
When a citizen submits a complaint, the system checks if another complaint exists within **50 meters**.

If yes:  
> “A similar complaint already exists in this location.”

This prevents spam and saves municipal resources.

---

### 2️⃣ Priority Engine  
Every complaint is classified automatically using real-world geography.

If garbage is near:
- 🏥 Hospital  
- 🏫 School  
- 🚌 Bus stop  
- 🚉 Railway station  
- 🚻 Public toilets  

→ **Priority becomes HIGH**

Otherwise → **Normal**

This ensures health-critical zones get cleaned first.

---

### 3️⃣ Proof-Based Workflow

| Stage | Proof |
|------|------|
| Citizen | Uploads **Before Photo** |
| Sweeper | Uploads **After Photo** |
| Admin | Approves based on evidence |

No false reports.  
No fake cleanups.  
Full accountability.

---

## 🗺️ Live Command Center

Admins get a **real-time city map**:

🔴 High priority  
🔵 Normal  
🟢 Cleaned  

Each dot = one real complaint with photo, GPS & status.

---

## ☁️ Cloud Architecture

| Service | Purpose |
|--------|--------|
| **Firebase Auth** | Login & role-based access |
| **Firestore** | Complaints, users, events |
| **Firebase Functions** | Secure Cloudinary signing |
| **Cloudinary** | High-quality image storage |
| **Leaflet.js** | Live map visualization |

---

## 🌐 Multi-Language Support

SwachhSnap supports:
- English 🇬🇧  
- Hindi 🇮🇳  
- Gujarati 🇮🇳  

Using `i18next`, the entire UI can be switched dynamically — making it usable for real municipal deployments.

---

## 🧪 Data Integrity

Every complaint contains:
- GPS coordinates  
- Timestamp  
- User ID  
- Before & After images  
- Sweeper name  
- Feedback rating  

Nothing can be faked or erased.

---

## 📊 What Makes This Special?

SwachhSnap is not just an app.  
It is a **city operating system**.

It brings:
- **Transparency**
- **Real-time operations**
- **Geospatial intelligence**
- **Citizen trust**
- **Municipal accountability**

---

## 🏁 Built With

- React + TypeScript  
- Firebase  
- Cloudinary  
- Leaflet Maps  
- OpenStreetMap  
- i18next  
- Tailwind CSS  

---

## 🧠 Vision

SwachhSnap can scale to:
- Entire cities  
- State governments  
- Smart City missions  
- CSR cleanliness programs  
- Waste-management contracts  

With minimal cost and massive impact.

---

## ❤️ Final Note

This project is designed not just to work —  
but to **change how cities stay clean**.
