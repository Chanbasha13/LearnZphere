// KL University (KLEF), Vaddeswaram — LMS Departments Mapped to Real KLU Campus Academic Blocks
// Preserves LearnSphere LMS department IDs while anchoring each faculty in its physical KLU building.

export const DEPARTMENTS = [
  {
    id: 'computer-science',
    name: 'Computer Science & Engineering',
    code: 'C-BLK',
    kluBuildingId: 'c-block',
    buildingName: 'C Block & FED Wing',
    architecturalStyle: 'Six-Story U/E-Wing Concrete & Glazed Computing Core',
    accentColor: '#16324F',
    accentHighlight: '#9A5B25',
    tagline: 'Software engineering, distributed systems, web architecture, and foundational computing.',
    description:
      'Anchored in KLU C Block along the southern academic spine alongside FED Block for foundational engineering, housing computing studios, Jasmine Hall, and student developer communities (KLGLUG).',
    dean: 'Dr. Sarah Johnson, Principal Systems Architect',
    visitingHours: 'Mon – Sat, 07:30 – 21:00',
    locationQuadrant: 'South-Central Campus (C Block)',
    coordinates: { x: -126.1, z: 167.1 },
    cameraOffset: { x: 45, y: 42, z: 72 },
    lookAtOffset: { x: 0, y: 9, z: 0 },
    facilities: [
      'C Block Programming & Web Studios',
      'Jasmine Hall & Seminar Suites',
      'KLGLUG Student Computing Centre (C424)',
      'FED Block Freshman Engineering Wing'
    ],
    courseIds: [1, 3, 4]
  },
  {
    id: 'artificial-intelligence',
    name: 'Artificial Intelligence & Knowledge Systems',
    code: 'SKC',
    kluBuildingId: 'skc-block',
    buildingName: 'SKC-Block',
    architecturalStyle: 'East Academic Computing Corridor Wing',
    accentColor: '#214E4B',
    accentHighlight: '#9A5B25',
    tagline: 'Machine learning pipelines, neural architectures, and mathematical optimization.',
    description:
      'Centered in SKC-Block along the eastern academic strip adjacent to Mech Labs and the Cricket Ground, dedicated to applied artificial intelligence, deep learning, and computational mathematics.',
    dean: 'Dr. Amanda Lee, Director of Cognitive Systems',
    visitingHours: 'Mon – Sat, 08:00 – 21:00',
    locationQuadrant: 'East-Central Strip (SKC-Block)',
    coordinates: { x: 35.4, z: 19.6 },
    cameraOffset: { x: 42, y: 34, z: 58 },
    lookAtOffset: { x: 0, y: 7, z: 0 },
    facilities: [
      'Neural Computation & Tensor Lab',
      'Applied Calculus & Modeling Hall',
      'Data Analytics Workstation Pods',
      'AI Colloquium & Research Commons'
    ],
    courseIds: [2, 5, 10]
  },
  {
    id: 'business',
    name: 'KL Business School & Skill Centre',
    code: 'SDC / S',
    kluBuildingId: 'sdc-block',
    buildingName: 'SDC-Block (S Block)',
    architecturalStyle: 'Curved Stadium-End LEED Green Tower with Solar Array',
    accentColor: '#3D3126',
    accentHighlight: '#8C6239',
    tagline: 'Digital venture creation, technology leadership, and sustainable unit economics.',
    description:
      'Housed inside the iconic rounded-end Skill Development Centre (S Block) in the north-west quadrant near KGH and Aravali/Vindhya hostels, uniting management strategy with technical readiness training.',
    dean: 'Elena Rostova, Chair of Technology Ventures',
    visitingHours: 'Mon – Fri, 08:00 – 20:30',
    locationQuadrant: 'North-West Campus (S Block)',
    coordinates: { x: -243.0, z: -158.1 },
    cameraOffset: { x: 52, y: 46, z: 75 },
    lookAtOffset: { x: 0, y: 12, z: 0 },
    facilities: [
      'KL Business School Executive Case Suites',
      'Competitive Coding & Placement Readiness Hall',
      'Venture Strategy & Financial Modeling Lab',
      'Rooftop Solar LEED Energy Core'
    ],
    courseIds: [9]
  },
  {
    id: 'digital-library',
    name: 'Central Library & Academic Archive',
    code: 'L-BLK',
    kluBuildingId: 'central-library',
    buildingName: 'Central Library / L-Block',
    architecturalStyle: 'White Stucco Massing with Timber Entry Canopy & 3-Story Sunlit Atrium',
    accentColor: '#2B3A4A',
    accentHighlight: '#9A5B25',
    tagline: 'Open-access academic archives, technical documentation, and quiet study atrium.',
    description:
      'Standing at the heart of KL University west of Arts Block, L-Block welcomes scholars up red granite steps beneath a signature warm timber soffit into a three-story daylight reading atrium.',
    dean: 'Samuel Thorne, Chief University Archivist',
    visitingHours: 'Open Daily, 07:00 – 23:00',
    locationQuadrant: 'Central Campus Core (L-Block)',
    coordinates: { x: -129.4, z: 16.8 },
    cameraOffset: { x: -45, y: 34, z: 58 },
    lookAtOffset: { x: 0, y: 7, z: 0 },
    facilities: [
      'Three-Story Sunlit Central Atrium',
      'Digital E-Journal & Course Syllabus Bank',
      'Silent Reading & Reference Carrels',
      'Academic Certification & Verification Desk'
    ],
    courseIds: [1, 4, 5, 6, 7, 8]
  },
  {
    id: 'research-lab',
    name: 'Research & Engineering Laboratories',
    code: 'R&D',
    kluBuildingId: 'rnd-block',
    buildingName: 'R&D Block & Mech Labs',
    architecturalStyle: 'Charcoal Precast Top Tier, White Portal Frames & Terracotta Spandrels',
    accentColor: '#2E3B4E',
    accentHighlight: '#C8643B',
    tagline: 'Database storage engines, cloud security testing, and enterprise engineering labs.',
    description:
      'Anchored in KLU flagship 6-story R&D Block alongside Mech Labs and M Block, pairing double-height stone portals and glazed research bays with cybersecurity sandboxes and database clusters.',
    dean: 'Alex Rivera & Dr. James Wilson, Co-Directors',
    visitingHours: 'Mon – Sat, 08:00 – 21:00',
    locationQuadrant: 'South-East Academic Core (R&D Block)',
    coordinates: { x: 49.1, z: 136.2 },
    cameraOffset: { x: 65, y: 45, z: 68 },
    lookAtOffset: { x: 0, y: 10, z: 0 },
    facilities: [
      'Isolated Cybersecurity & Packet Forensics Lab',
      'Distributed Database Benchmarking Cluster',
      'Innovation & Sponsored Research Wing',
      'Adjacent Mech Labs & Engineering Bays'
    ],
    courseIds: [7, 8]
  },
  {
    id: 'lecture-hall',
    name: 'Arts, Design & Amphitheater Precinct',
    code: 'ARTS / OAT',
    kluBuildingId: 'arts-block',
    buildingName: 'Arts Block & Open Air Theatre',
    architecturalStyle: 'Three-Story H-Courtyard Block & 4,500-Seat Sunken Amphitheater',
    accentColor: '#4A3628',
    accentHighlight: '#9A5B25',
    tagline: 'Spatial design colloquia, multidisciplinary lectures, and cultural convocations.',
    description:
      'Spanning the 3-level Arts Block East of Central Library and the sunken Open Air Theatre cradled inside M Block, hosting design critiques, keynote lectures, and campus assemblies.',
    dean: 'Emma Watson, Curator of Design & Academic Programs',
    visitingHours: 'Mon – Sun, 08:00 – 21:00',
    locationQuadrant: 'Central & South-Central (Arts / OAT)',
    coordinates: { x: -50.1, z: 24.8 },
    cameraOffset: { x: 52, y: 38, z: 58 },
    lookAtOffset: { x: 0, y: 6, z: 0 },
    facilities: [
      'Arts Block Design & Lecture Studios',
      '4,500-Seat Open Air Theatre (OAT)',
      'UI/UX Critique & Seminar Rooms',
      'Central Courtyard Assembly Lawn'
    ],
    courseIds: [6, 1, 9]
  }
];
