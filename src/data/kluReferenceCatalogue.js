// KL University (KLEF), Vaddeswaram — Stage A Building & Visual Reference Catalogue
// Grounds every 3D digital-twin building in surveyed OSM geometry, aerial orthophotos, official KLU galleries & YouTube campus tours.

export const KLU_MEDIA_SOURCES = {
  officialTour: {
    id: 'LZh9CHNvuGs',
    title: 'Campus Tour: Take a virtual journey of all three campuses of KL University',
    author: 'KL University Official (@kluniversityofficial)',
    url: 'https://www.youtube.com/watch?v=LZh9CHNvuGs',
    embedUrl: 'https://www.youtube.com/embed/LZh9CHNvuGs'
  },
  studentTour: {
    id: 'tTRuOhukLiE',
    title: 'KL University Tour | BTech Campus Walkthrough',
    author: 'Solomon One (@SolomonOne)',
    url: 'https://www.youtube.com/watch?v=tTRuOhukLiE',
    embedUrl: 'https://www.youtube.com/embed/tTRuOhukLiE'
  },
  hostelsTour: {
    id: 'Cxm34DpgJlM',
    title: 'KL University Hostels Tour',
    author: 'KL University Official (@kluniversityofficial)',
    url: 'https://www.youtube.com/watch?v=Cxm34DpgJlM',
    embedUrl: 'https://www.youtube.com/embed/Cxm34DpgJlM'
  },
  website: 'https://www.kluniversity.in/',
  librarySite: 'https://library.kluniversity.in/',
  virtualTour: 'https://www.kluniversity.in/KLUFL/'
};

/**
 * Auditable Multi-Source Geospatial & Architectural Reference Registry.
 * Accurately records verified sources, licensing constraints, features confirmed, and inaccessible platforms.
 */
export const KLU_SOURCE_REGISTRY = [
  {
    sourceName: 'OpenStreetMap Cadastral Vector Survey (Vaddeswaram)',
    url: 'https://www.openstreetmap.org/',
    description: 'Surveyed building polygons, road centerlines, boundary fence, Krishna Western Delta canal, sports grounds, and 75 adjacent residential structures centered at 16.4420°N, 80.6225°E.',
    dateCaptured: '2025–2026 live community database snapshot (api/0.6/map.json)',
    licence: 'Open Data Commons Open Database License (ODbL 1.0) — © OpenStreetMap contributors',
    verifiedFeatures: 'All 26 campus footprints, campus rotation (-0.098 rad), internal road hierarchy, main parking, bus bay, cricket oval, swimming pool, basketball & sports quads.',
    confidence: 'High'
  },
  {
    sourceName: 'Esri World Imagery (ArcGIS Online Visual Reference)',
    url: 'https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9',
    description: 'High-resolution aerial imagery inspected visually for valley agricultural field orientation (~16° rotated plot subdivisions), completed building roofs, canal levee banks, and tree canopy pockets.',
    dateCaptured: 'Reference layer inspected 2026 (Provider: Esri, Maxar, Earthstar Geographics)',
    licence: 'Esri Master License Agreement — attribution required; offline tile scraping/redistribution prohibited (terrain uses legal procedural synthesis rather than bundled imagery tiles).',
    verifiedFeatures: 'Completed Lotus Hostel exterior/solar panels, East Woodland Grove, East Hostel Courts, Main Canteen & Mechanical Labs roof orientations, canal turbidity & dike width.',
    confidence: 'High'
  },
  {
    sourceName: 'KL University Official Portal, Library Site & KLUFL 360 Virtual Tour',
    url: 'https://www.kluniversity.in/',
    description: 'Official institutional pages and infrastructure photo galleries covering Vaddeswaram academic blocks, library atrium, hostels, and sports venues.',
    dateCaptured: '2024–2026 institutional web publications',
    licence: 'Copyright KL Deemed to be University — used strictly as visual architectural reference',
    verifiedFeatures: 'Central Library timber fascia & granite steps (library.kluniversity.in), R&D Block charcoal crown & terracotta spandrel portals, FED Block facade, Indoor Stadium (~30,000 sq.ft brick-pilaster barrel vault), Hindu Temple shikhara, Tulip/Himalaya/Lotus/KGH/Aravali hostels, Main Gate arch.',
    confidence: 'High'
  },
  {
    sourceName: 'Official & Student YouTube Campus Walkthroughs',
    url: 'https://www.youtube.com/watch?v=LZh9CHNvuGs',
    description: 'Video walkthroughs (@kluniversityofficial, @SolomonOne) providing street-level proportions, colonnades, courtyard bridges, AC condenser rhythm, and hostel room balconies.',
    dateCaptured: 'Published 2022–2025',
    licence: 'Standard YouTube License — embedded/linked only',
    verifiedFeatures: 'C Block ground colonnade arcade, deep punched window jambs, courtyard skybridge, R&D entry portico lobby, Hostel exterior balcony railings & aqua privacy panels.',
    confidence: 'High'
  },
  {
    sourceName: 'Copernicus Sentinel-2 & OpenAerialMap Regional Check',
    url: 'https://openaerialmap.org/',
    description: 'Checked regional land-cover palette norms and open aerial availability for the Vaddeswaram–Vijayawada–Guntur agricultural belt.',
    dateCaptured: '2026 Policy & Availability Check',
    licence: 'Copernicus Open Data Policy (Sentinel-2) / CC-BY 4.0 (OpenAerialMap OIN)',
    verifiedFeatures: 'Regional Krishna Delta alluvial paddy & cotton-soil color calibration; no localized public UAV orthomosaic available on OpenAerialMap for Vaddeswaram campus itself.',
    confidence: 'Moderate (Regional Macro Context Only)'
  },
  {
    sourceName: 'Wikimedia Commons Regional Photography',
    url: 'https://commons.wikimedia.org/wiki/Category:Vaddeswaram',
    description: 'Public Wikimedia Commons entries verified for Vaddeswaram locality & KL University seminar interior.',
    dateCaptured: 'Community uploads checked 2026',
    licence: 'Creative Commons Attribution-ShareAlike (CC BY-SA)',
    verifiedFeatures: 'Regional exterior context checks.',
    confidence: 'Low–Moderate (Limited Exterior Coverage)'
  },
  {
    sourceName: 'Google Earth / Google Maps Street View / Apple Maps Look Around',
    url: 'https://earth.google.com/',
    description: 'External proprietary 3D/Street View platforms NOT directly accessed or verified in this session.',
    dateCaptured: 'N/A — Not retrieved',
    licence: 'Proprietary Terms of Service — not scraped or reproduced',
    verifiedFeatures: 'None claimed; structures lacking close-up public photos retain provisional tags (e.g., SE Annex, Sports Complex, minor hostel facades).',
    confidence: 'Unverified / Not Accessed'
  }
];

/**
 * Evidence-backed architectural notes, real exterior visual signatures & source verification tags
 * keyed by building id in kluCampusData.js.
 */
export const KLU_BUILDING_CATALOGUE = {
  'central-library': {
    verificationStatus: 'Verified (OSM + KLU Library Portal + KLUFL Tour)',
    architecturalFeatures: [
      'Wide dark-mirror curtain-glass entrance bay crossed by thin black horizontal & vertical mullions',
      'Signature slim horizontal warm timber-fascia entrance beam canopy & projecting glass vestibule box',
      'Four low-riser red-brown granite front steps flanked by corner stone-walled fern planter beds',
      'Multi-story oak wood mezzanine galleries & daylight stacks visible behind glass lobby'
    ],
    facilities: ['RFID Circulation Desk & Lobby', 'Stack Areas 1 & 2', '120+ Digital Library Terminals', 'Reference & Periodical Atrium'],
    videoSourceKey: 'officialTour'
  },
  'rnd-block': {
    verificationStatus: 'Verified (OSM + Designhaaus Architectural Portfolio + KLU Gallery)',
    architecturalFeatures: [
      'Cantilevered 6th-story dark charcoal precast crown with ribbon clerestory & vertical concrete roof fins',
      'Five lower floors recessed curtain-glass bays framed by projecting white concrete portal piers',
      'Terracotta-orange horizontal sun-breaker spandrel louvers across each facade floor line',
      'Double-height stone-clad entry portal lobby & rooftop photovoltaic solar array'
    ],
    facilities: ['Sponsored R&D Labs', 'Database & Cybersecurity Research Bays', 'Innovation Incubator & Lounges', 'Campus Cafe Concourse'],
    videoSourceKey: 'officialTour'
  },
  'c-block': {
    verificationStatus: 'Verified (OSM 6F + KLUFL Tour + Official Aerial Tour Video)',
    architecturalFeatures: [
      '6-level U/E-wing courtyard plan along south-central campus avenue',
      'Signature vertical recessed triple-height glazed stairwell slot & upper penthouse ribbon floor',
      'Ground-floor continuous white arcade colonnade lining inner courtyard walkways',
      'Deep-punched concrete window jambs with AC condenser bays & rooftop solar arrays'
    ],
    facilities: ['CSE Laboratories & Lecture Suites', 'Jasmine Hall', 'KLGLUG Open-Source Computing Cell (C424)', 'Shaded Colonnade Walkways'],
    videoSourceKey: 'officialTour'
  },
  'fed-block': {
    verificationStatus: 'Verified (OSM 7F + KLUFL Admin/FED Tour)',
    architecturalFeatures: [
      'Sweeping curved multi-wing Freshman Engineering facade anchoring the SW Main Gate avenue',
      'Double-height dark mirror curtain-glass lower lobby beneath 5 upper punched-masonry classroom stories',
      'Vertical projecting white structural fins flanking paired dark classroom windows & stepped stair towers'
    ],
    facilities: ['First-Year Engineering Lecture Halls', 'Basic Sciences & Physics/Chemistry Labs', 'Engineering Drawing Studios'],
    videoSourceKey: 'officialTour'
  },
  'sdc-block': {
    verificationStatus: 'Verified Footprint & Exterior (OSM + Aerial Imagery; 7–9F range harmonized at 8F)',
    architecturalFeatures: [
      'Distinctive elongated stadium pill footprint with full semi-circular rounded east & west drums',
      'Continuous curved horizontal window glazing and projecting white slab brise-soleil rings',
      'Rooftop solar photovoltaic rows atop flat parapet terrace'
    ],
    facilities: ['Skill Development & Coding Bootcamps', 'KL Business School Case Halls', 'CRT & Career Readiness Wing'],
    videoSourceKey: 'officialTour'
  },
  'arts-block': {
    verificationStatus: 'Verified Footprint & 3F Height (OSM + Aerial Imagery)',
    architecturalFeatures: [
      '3-level H/E courtyard plan immediately East of Central Library across shaded avenue',
      'White stucco structural colonnade bays with deep-punched classroom windows & skybridge link'
    ],
    facilities: ['Arts, Design & Humanities Studios', 'Seminar Rooms', 'Central Courtyard Garden'],
    videoSourceKey: 'studentTour'
  },
  'm-block': {
    verificationStatus: 'Verified Footprint (OSM + Aerial Imagery; ~5F height provisionally approximated)',
    architecturalFeatures: [
      'Curving L-shaped wing embracing the sunken Open Air Theatre bowl',
      'Recessed horizontal corridor glazing between projecting white structural columns & PV array roof'
    ],
    facilities: ['Mechanical & Civil Drafting Studios', 'Material Testing & Engineering Labs'],
    videoSourceKey: 'studentTour'
  },
  'skc-block': {
    verificationStatus: 'Verified Footprint (OSM + Aerial Imagery; ~4F height provisionally approximated)',
    architecturalFeatures: [
      'Clean linear white concrete wing on the east academic strip north of Mech Labs',
      'Punched classroom window bays with overhanging concrete chajja sun-hoods'
    ],
    facilities: ['Specialized Knowledge & AI Computing Labs', 'Faculty Studios'],
    videoSourceKey: 'studentTour'
  },
  'mech-labs': {
    verificationStatus: 'Verified Footprint (OSM + Aerial Imagery; 2–3F workshop height approximated)',
    architecturalFeatures: [
      'Long-span industrial engineering workshop bay between SKC-Block and R&D Block',
      'Clerestory high-bay glazing and heavy service roll-up apron'
    ],
    facilities: ['CAD/CAM & Manufacturing Workshops', 'Thermal & Fluid Mechanics Testing Bays'],
    videoSourceKey: 'studentTour'
  },
  'se-annex-provisional': {
    verificationStatus: 'Provisional (Unnamed OSM polygon #1249470911 + Aerial confirmation)',
    architecturalFeatures: [
      'Compact 2-story utility/academic annex SE of R&D Block matching aerial roof outline',
      'Retained with provisional identification pending campus confirmation'
    ],
    facilities: ['Utility / Annex Facility (Provisional)'],
    videoSourceKey: 'officialTour'
  },
  'himalaya-hostel': {
    verificationStatus: 'Verified (OSM + KLU Girls Hostel Photos + Aerial Imagery)',
    architecturalFeatures: [
      '10-floor U-shaped residential wing opening West toward the central campus',
      'Deep recessed concrete balcony galleries accented with aqua-teal safety railings on every floor',
      'Dark cantilevered front entry portico canopy and dense rooftop solar water/PV banks'
    ],
    facilities: ['Student Residential Wings', 'Dining Hall & Reading Room', 'Courtyard Garden'],
    videoSourceKey: 'studentTour'
  },
  'tulip-hostel': {
    verificationStatus: 'Verified (OSM 13F + KLU Boys Hostel Gallery + Aerial Imagery)',
    architecturalFeatures: [
      '13-floor twin high-rise H-spine towers housing dual inner ventilation lightwells',
      'Double-height curtain-glazed lobby podium supporting 11 repetitive white balcony tiers',
      'Full rooftop solar array spanning both parallel wings'
    ],
    facilities: ['Boys Residential High-Rise Wings', 'Common Rooms & Mess Hall', 'Sports Courts West Plaza'],
    videoSourceKey: 'officialTour'
  },
  'lotus-hostel-provisional': {
    verificationStatus: 'Aerial & KLU Gallery Verified Completed Building (OSM tags legacy construction)',
    architecturalFeatures: [
      '12-story square hollow-courtyard residence tower directly east of Himalaya Girls Hostel',
      'Completed exterior and rooftop solar PV arrays confirmed on Esri World Imagery',
      'Continuous recessed perimeter balcony decks overlooking central lightwell & east hostel courts'
    ],
    facilities: ['Girls Residential Tower Wings', 'Inner Courtyard Quad', 'Adjacent Outdoor Sports Courts'],
    videoSourceKey: 'studentTour'
  },
  'kgh-hostel': {
    verificationStatus: 'Verified Exterior Geometry (OSM Multipolygon + KLU Photo; Boys/Girls naming conflict noted)',
    architecturalFeatures: [
      '5-story hollow courtyard perimeter block enclosing a palm garden quad',
      'Signature vertical muted purple-plum stairwell core shafts interrupting crisp white balcony bays',
      'Projecting white concrete roof pergola beam grid circling the top parapet'
    ],
    facilities: ['Residential Rooms & Central Lawn', 'Courtyard Study Spaces'],
    videoSourceKey: 'studentTour'
  },
  'aravali-hostel': {
    verificationStatus: 'Verified (OSM + KLU Photo + Aerial Imagery)',
    architecturalFeatures: [
      '6–7 floor twin parallel north-west residence wings joined by covered bridge walkway',
      'Recessed punched balcony bays facing lush sports lawns'
    ],
    facilities: ['NW Residential Hostel Wing', 'Adjacent Green Sports Courts'],
    videoSourceKey: 'studentTour'
  },
  'vindhya-hostel': {
    verificationStatus: 'Verified (OSM + Aerial Imagery)',
    architecturalFeatures: [
      'Paired twin parallel residential complex standing immediately East of Aravali Hostel',
      'Covered mid-level courtyard skybridge and white parapet roofs'
    ],
    facilities: ['Student Residential Rooms', 'Lawn & Volleyball Court Proximity'],
    videoSourceKey: 'studentTour'
  },
  'indoor-stadium': {
    verificationStatus: 'Verified (OSM + KLUFL 360 Pano + Aerial Imagery)',
    architecturalFeatures: [
      'Terracotta-brick masonry arena walls articulated with rhythmic white concrete pilasters',
      'Long-span curved metallic barrel-vault roof crowned by exterior exposed steel arch ribs',
      '~30,000 sq.ft indoor courts hall with upper perimeter daylight clerestory'
    ],
    facilities: ['Indoor Badminton & Table Tennis Courts', 'Gymnasium & Indoor Sports Pavilion'],
    videoSourceKey: 'officialTour'
  },
  'sports-complex-provisional': {
    verificationStatus: 'Provisional (OSM: sports complex / construction; Aerial: 3-bay concrete shell)',
    architecturalFeatures: [
      'Multi-courtyard architectural concrete shell between Indoor Stadium and Cricket Ground',
      'Preserved honestly as under-finish sports complex structure based on satellite outline'
    ],
    facilities: ['Multi-Bay Sports Complex Structure (In Progress)'],
    videoSourceKey: 'officialTour'
  },
  'cricket-ground': {
    verificationStatus: 'Verified (OSM + KLU Sports Gallery + Aerial Imagery)',
    architecturalFeatures: [
      'Striped natural turf cricket outfield encircled by a terracotta clay multi-lane running track',
      'Center 22-yard clay cricket pitch strip, white track lane markings & 4 corner LED floodlight towers'
    ],
    facilities: ['Championship Cricket Oval', '400m Athletics Running Track', 'Floodlit Sports Field'],
    videoSourceKey: 'officialTour'
  },
  'open-air-theatre': {
    verificationStatus: 'Verified (OSM + KLU Campus Profile)',
    architecturalFeatures: [
      '4,500-capacity stepped concentric amphitheater nestled inside M Block arc',
      'Radial granite seating tiers descending to an elevated covered performance proscenium stage'
    ],
    facilities: ['Open-Air Convocation Bowl', 'Acoustic Stage Pavilion'],
    videoSourceKey: 'officialTour'
  },
  'hindu-temple': {
    verificationStatus: 'Verified (OSM + KLUFL 360 Temple Pano)',
    architecturalFeatures: [
      'White stepped marble plinth with radial floor patterning and pillared open mandapa colonnade',
      'Arched sanctuary facade topped by tiered octagonal shikhara dome & gilded kalasha spire'
    ],
    facilities: ['Campus Spiritual Sanctuary', 'Shaded Entry Plaza'],
    videoSourceKey: 'officialTour'
  },
  'swimming-pool': {
    verificationStatus: 'Verified (OSM + Aerial Imagery — open-air sky-blue pool confirmed)',
    architecturalFeatures: [
      'Competition-proportion azure lap pool with animated reflective water surface & lane lines',
      'Paved limestone coping deck, starter blocks & north-side changing pavilion shelter'
    ],
    facilities: ['Campus Aquatics Pool', 'Changing & Lifeguard Pavilion'],
    videoSourceKey: 'officialTour'
  }
};

/**
 * 12 Cinematic Aerial + Architectural Presets + 7 Ground Pedestrian Tour Waypoints (human eye-level y = 1.78m)
 */
export const AERIAL_TOUR_PRESETS = [
  { id: 'overview', label: 'Aerial Overview', pos: [-8, 360, 578], target: [32, 6, 8] },
  { id: 'main-gate', label: 'Main Gate', pos: [-430, 82, 145], target: [-268, 8, 28] },
  { id: 'central-library', label: 'Central Library', pos: [-215, 44, 52], target: [-129, 10, 17] },
  { id: 'c-block', label: 'C Block', pos: [-65, 58, 255], target: [-126, 11, 167] },
  { id: 'fed-block', label: 'FED Block', pos: [-265, 56, 178], target: [-189, 12, 108] },
  { id: 'rnd-block', label: 'R&D Block', pos: [-25, 54, 198], target: [49, 12, 136] },
  { id: 'm-block', label: 'M Block', pos: [-18, 52, 232], target: [-53, 9, 164] },
  { id: 'sdc-block', label: 'SDC Block', pos: [-310, 58, -75], target: [-243, 14, -158] },
  { id: 'hostels', label: 'Hostels', pos: [175, 118, 268], target: [315, 22, 96] },
  { id: 'sports-complex', label: 'Sports Complex', pos: [10, 115, -35], target: [60, 6, -98] },
  { id: 'indoor-stadium', label: 'Indoor Stadium', pos: [-125, 42, -25], target: [-67, 8, -76] },
  { id: 'open-air-theatre', label: 'Open Air Theatre', pos: [25, 42, 152], target: [-29, 5, 122] }
];

export const GROUND_TOUR_WAYPOINTS = [
  {
    id: 'walk-gate',
    label: 'SW Main Gate Entrance',
    pos: [-274, 1.8, 25],
    lookAt: [-210, 6.5, 42],
    hint: 'Looking East from KLEF Road Main Gate toward FED Block & Temple'
  },
  {
    id: 'walk-library',
    label: 'Central Library Steps',
    pos: [-186, 1.85, 28],
    lookAt: [-129, 8.4, 16],
    hint: 'Facing Central Library timber canopy, steel columns & sunlit atrium'
  },
  {
    id: 'walk-cblock',
    label: 'C-Block Colonnade Walk',
    pos: [-126, 1.8, 116],
    lookAt: [-126, 11, 167],
    hint: 'Standing along C Block central avenue looking at the south academic core'
  },
  {
    id: 'walk-rnd',
    label: 'R&D Block Plaza',
    pos: [-6.5, 1.85, 96],
    lookAt: [20, 10.8, 126],
    hint: 'Viewing R&D Block charcoal crown, terracotta louvers, stone portico & curved glass'
  },
  {
    id: 'walk-oat',
    label: 'Open Air Theatre Rim',
    pos: [-28, 4.6, 86],
    lookAt: [-28, 1.8, 130],
    hint: 'Overlooking the 4,500-seat sunken Open Air Theatre bowl & M Block'
  },
  {
    id: 'walk-sports',
    label: 'Stadium & Sports Quad',
    pos: [-28, 1.8, -32],
    lookAt: [-66, 7.5, -76],
    hint: 'Between Indoor Stadium barrel-vault hall, cricket oval & courts'
  },
  {
    id: 'walk-hostels',
    label: 'East Hostel Promenade',
    pos: [185, 1.8, 32],
    lookAt: [215, 18, 92],
    hint: 'Facing Himalaya, Lotus & Tulip high-rise residential towers'
  }
];
