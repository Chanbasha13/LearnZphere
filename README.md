# 🎓 LearnSphere — Immersive 3D University Learning Management System

<p align="center">
  <strong>A Modern Learning Management System with an Interactive 360° KL University Campus Experience</strong>
</p>

<p align="center">
  Built with React, Vite, Three.js, JavaScript and modern web technologies.
</p>

---

## 🌐 Project Overview

**LearnSphere** is a frontend-focused Learning Management System (LMS) designed to deliver a modern, interactive and immersive digital university experience.

Unlike traditional LMS platforms, LearnSphere combines academic management features with an interactive **360° 3D digital representation of KL University (KLEF), Vaddeswaram, Andhra Pradesh, India.**

Users can explore the university campus, interact with buildings, discover academic facilities and access learning resources through a unified platform.

The platform provides dedicated interfaces for Students, Instructors and Administrators.

## ✨ Key Features

### 🏛️ Interactive 360° KL University Campus

- Interactive Three.js-powered 3D university environment.
- 360-degree camera rotation and orbit controls.
- Zoom, pan and free camera movement.
- Interactive campus buildings and landmarks.
- Cinematic camera transitions.
- Ground-level campus exploration.
- Building information panels.
- Guided campus navigation and location presets.
- Desktop and mobile responsive experience.
- High and reduced graphics quality settings.

The campus reconstruction uses surveyed OpenStreetMap building footprints, campus layout references, aerial imagery and available university photographs.

### 👨‍🎓 Student Portal

- Personalized student dashboard.
- Enrolled course management.
- Course progress tracking.
- Interactive quizzes and assessments.
- Assignment management.
- Learning progress analytics.
- Achievement tracking.
- Certificate management.
- Student profile management.

### 👨‍🏫 Instructor Portal

- Instructor dashboard.
- Course creation and management.
- Course and lesson organization.
- Student progress monitoring.
- Assignment management.
- Quiz and assessment management.

### 🛡️ Administrator Portal

- Administrative dashboard.
- User and role management.
- Course management.
- Platform overview and statistics.
- Administrative controls.

### 📚 Learning Management System

- Course catalogue.
- Individual course details.
- Learning classroom interface.
- Quiz and assessment pages.
- Assignment tracking.
- Learning analytics.
- Certificate generation.

### 🎨 User Experience

- Modern university-inspired interface.
- Responsive layouts.
- Interactive navigation.
- Light and dark themes.
- Smooth transitions and animations.
- Dedicated authentication pages.
- Role-based navigation and protected routes.

---

## 🧰 Technology Stack

| Technology | Purpose |
|---|---|
| React.js | Frontend development |
| Vite | Development server and build tool |
| JavaScript | Application logic |
| Three.js | 3D campus visualization |
| React Router | Application navigation |
| CSS3 | Styling and responsive layouts |
| HTML5 | Application structure |
| LocalStorage | Frontend data persistence |
| GLTF / GLB | 3D architectural assets |
| Git & GitHub | Version control |

---

## 🏗️ Project Architecture

LearnSphere follows a component-based React architecture.

```text
LearnSphere/
│
├── public/
│   └── assets/
│       └── models/
│           ├── central_library.glb
│           ├── rnd_block.glb
│           ├── c_block.glb
│           └── ... campus models
│
├── src/
│   ├── components/
│   │
│   ├── context/
│   │
│   ├── data/
│   │
│   ├── pages/
│   │
│   ├── scenes/
│   │   ├── Campus3DScene.jsx
│   │   ├── campusBuildings.js
│   │   ├── kluModularArch.js
│   │   └── kluAssetLoader.js
│   │
│   ├── styles/
│   │
│   ├── utils/
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── scripts/
│   └── buildKluGlbAssets.mjs
│
├── package.json
└── README.md
```

*Note: This is a representative structure. Some files and folders may differ in the actual repository.*

---

## 🚀 Installation and Setup

### Prerequisites

- Node.js
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Chanbasha13/LearnZphere.git
```

### 2. Navigate to the project

```bash
cd LearnZphere
```

### 3. Navigate to the frontend application

```bash
cd learnsphere
```

### 4. Install dependencies

```bash
npm install
```

### 5. Start the development server

```bash
npm run dev
```

### 6. Open the application

Visit:

```text
http://localhost:5173
```

### 7. Production build

```bash
npm run build
```

---

## 🏫 KL University Digital Campus

One of the main highlights of LearnSphere is its interactive 3D representation of KL University, Vaddeswaram.

The reconstructed campus includes academic, residential, recreational and administrative landmarks.

Some of the represented locations include:

- Central Library (L-Block)
- C Block
- FED Block
- M Block
- R&D Block
- SDC / S Block
- Arts Block
- SKC Block
- Mechanical Laboratories
- Himalaya Girls Hostel
- Tulip Boys Hostel
- Lotus Girls Hostel
- Kanchanaganga Hostel
- Aravali Hostel
- Vindhya Hostel
- Indoor Stadium
- Open Air Theatre
- Cricket Ground
- Swimming Pool
- Basketball Courts
- University Temple
- Main Canteen
- Bus Stand and Parking Areas

The 3D environment is designed to provide an immersive way to explore university facilities.

---

## 🎯 Project Objectives

1. Develop a centralized digital learning platform.
2. Improve the student learning experience through interactive interfaces.
3. Integrate a 360° 3D university campus experience.
4. Provide dedicated interfaces for students, instructors and administrators.
5. Demonstrate the application of modern frontend technologies.
6. Make university navigation and academic resources more accessible.

---

## 🔮 Future Enhancements

- Backend integration with Node.js and Express.
- Database integration using MongoDB or PostgreSQL.
- Secure authentication and authorization.
- Real-time notifications.
- Live instructor-student communication.
- Advanced academic analytics.
- More detailed campus 3D assets.
- Real-time campus navigation.
- Virtual campus tour enhancements.
- Cloud deployment and production optimization.

---

## 👨‍💻 Development Team

**Project Name:** LearnSphere  
**Project Type:** Frontend Web Application / Learning Management System  
**University:** KL University (KLEF), Vaddeswaram  
**Repository:** [GitHub – LearnSphere](https://github.com/Chanbasha13/LearnZphere)

---

## 📜 Disclaimer

LearnSphere is an academic project developed for educational and demonstration purposes.

The 3D campus environment is a digital reconstruction based on available geographic data, aerial references and university photography. It is not an official architectural survey or an official product of KL University.

University names and campus references belong to their respective owners.

---

<p align="center">
  <strong>LearnSphere — Explore. Learn. Achieve.</strong>
</p>

<p align="center">
  Built with ❤️ using React and Three.js.
</p>
