// LearnSphere Digital University - Accredited Course Catalog Data
export const coursesData = [
  {
    id: 1,
    title: "Web Development Bootcamp",
    instructor: "Dr. Sarah Johnson",
    instructorRole: "Principal Frontend Architect",
    departmentId: "computer-science",
    departmentName: "Computer Science Department",
    difficulty: "Beginner",
    duration: "8 weeks",
    rating: 4.8,
    lessonsCount: 9,
    image: "/assets/images/web-dev.svg",
    description: "Learn semantic HTML5, modern CSS3 grid and responsive engineering, JavaScript ES6+, DOM architecture, asynchronous Fetch APIs, and persistent browser data modeling.",
    badge: "Core Foundation",
    whatYouWillLearn: [
      "Architect semantic and accessible HTML5 documents",
      "Build responsive layouts using CSS Flexbox, Grid, and clean design tokens",
      "Master modern JavaScript ES6+ (Async/Await, Closures, DOM APIs)",
      "Manage persistent browser state with LocalStorage and JSON validation",
      "Deploy production-ready Vite and React applications"
    ],
    prerequisites: ["Basic computer literacy", "A modern web browser and code editor"],
    modules: [
      {
        id: "mod-1",
        title: "Module 1: Foundations of Modern Web Architecture",
        lessons: [
          { id: "1-1", title: "Introduction to Web Protocols & Tooling", duration: "14:20", videoUrl: "https://www.youtube.com/embed/qz0aGYrrlhU", completed: false },
          { id: "1-2", title: "HTML5 Semantic Markup & Web Accessibility", duration: "18:45", videoUrl: "https://www.youtube.com/embed/kUMe1FH4CHE", completed: false },
          { id: "1-3", title: "Advanced Forms, Inputs & Client Validation", duration: "16:10", videoUrl: "https://www.youtube.com/embed/fNcJuPIZ2WE", completed: false }
        ]
      },
      {
        id: "mod-2",
        title: "Module 2: CSS Layout Systems & Architectural Styling",
        lessons: [
          { id: "1-4", title: "The Box Model, Sizing & Cascade Specificity", duration: "21:30", videoUrl: "https://www.youtube.com/embed/1PnVor36_40", completed: false },
          { id: "1-5", title: "CSS Flexbox & Two-Dimensional Grid Systems", duration: "25:15", videoUrl: "https://www.youtube.com/embed/jV8B24rSN5o", completed: false },
          { id: "1-6", title: "CSS Transforms, Transitions & Responsive Breakpoints", duration: "22:40", videoUrl: "https://www.youtube.com/embed/2L6qA3w1h60", completed: false }
        ]
      },
      {
        id: "mod-3",
        title: "Module 3: JavaScript Engine & Dynamic Applications",
        lessons: [
          { id: "1-7", title: "JavaScript Core: Scope, Closures & Execution Context", duration: "24:50", videoUrl: "https://www.youtube.com/embed/hdI2bqOjy3c", completed: false },
          { id: "1-8", title: "DOM Manipulation & Event Delegation Patterns", duration: "19:15", videoUrl: "https://www.youtube.com/embed/y17RuWkWdn8", completed: false },
          { id: "1-9", title: "Async/Await, Promises & Fetch API Integration", duration: "26:30", videoUrl: "https://www.youtube.com/embed/V_Kr9OSfDeU", completed: false }
        ]
      }
    ]
  },
  {
    id: 2,
    title: "Python & Machine Learning Foundations",
    instructor: "Prof. Michael Chen",
    instructorRole: "Senior AI Researcher",
    departmentId: "artificial-intelligence",
    departmentName: "Artificial Intelligence Department",
    difficulty: "Beginner",
    duration: "10 weeks",
    rating: 4.7,
    lessonsCount: 5,
    image: "/assets/images/python.svg",
    description: "Master Python programming from syntax fundamentals to scientific array computation with NumPy, Pandas data pipelines, and introductory predictive modeling.",
    badge: "Popular Track",
    whatYouWillLearn: [
      "Master Python data structures, functions, and object-oriented paradigms",
      "Process structured datasets with NumPy vectors and Pandas DataFrames",
      "Clean and prepare empirical datasets for machine learning evaluation",
      "Train classification and regression baselines with Scikit-Learn",
      "Implement reproducible data processing scripts"
    ],
    prerequisites: ["No prior programming experience required", "High school algebra"],
    modules: [
      {
        id: "mod-1",
        title: "Module 1: Python Core Essentials",
        lessons: [
          { id: "2-1", title: "Python Runtime, Data Types & Variables", duration: "15:10", videoUrl: "https://www.youtube.com/embed/_uQrJ0TkZlc", completed: false },
          { id: "2-2", title: "Control Flow, Iterators & List Comprehensions", duration: "19:40", videoUrl: "https://www.youtube.com/embed/rfscVS0vtbw", completed: false },
          { id: "2-3", title: "Object-Oriented Programming & Custom Classes", duration: "23:05", videoUrl: "https://www.youtube.com/embed/JeznW_7DlB0", completed: false }
        ]
      },
      {
        id: "mod-2",
        title: "Module 2: Scientific Data Processing",
        lessons: [
          { id: "2-4", title: "NumPy Multidimensional Array Computation", duration: "20:30", videoUrl: "https://www.youtube.com/embed/QUT1VHiLmmI", completed: false },
          { id: "2-5", title: "Pandas DataFrames, Data Cleaning & Feature Wrangling", duration: "28:15", videoUrl: "https://www.youtube.com/embed/vmEHCJofslg", completed: false }
        ]
      }
    ]
  },
  {
    id: 3,
    title: "Enterprise Java & Distributed Systems",
    instructor: "Dr. James Wilson",
    instructorRole: "Enterprise Systems Architect",
    departmentId: "computer-science",
    departmentName: "Computer Science Department",
    difficulty: "Intermediate",
    duration: "12 weeks",
    rating: 4.6,
    lessonsCount: 3,
    image: "/assets/images/java.svg",
    description: "Deep dive into Object-Oriented Programming, JVM memory architecture, generics, collections, concurrent threading primitives, and resilient service patterns.",
    badge: "Systems Track",
    whatYouWillLearn: [
      "Design maintainable software using strict OOP and SOLID principles",
      "Master Java Collections, Generics, and functional Streams",
      "Analyze JVM bytecode execution and garbage collection behavior",
      "Structure multi-layered service modules with clean abstractions",
      "Apply exception handling and encapsulation cleanly"
    ],
    prerequisites: ["Basic programming logic in any language"],
    modules: [
      {
        id: "mod-1",
        title: "Module 1: JVM & Object-Oriented Architecture",
        lessons: [
          { id: "3-1", title: "JVM Architecture, Bytecode & Garbage Collection", duration: "18:20", videoUrl: "https://www.youtube.com/embed/eIrMbAQSU34", completed: false },
          { id: "3-2", title: "Polymorphism, Interfaces & Abstract Classes", duration: "21:10", videoUrl: "https://www.youtube.com/embed/RRubcjpTkks", completed: false },
          { id: "3-3", title: "Generics & Collections Framework Architecture", duration: "24:45", videoUrl: "https://www.youtube.com/embed/viTHc_4XfCA", completed: false }
        ]
      }
    ]
  },
  {
    id: 4,
    title: "Data Structures & Algorithmic Optimization",
    instructor: "Prof. Michael Chen",
    instructorRole: "Chair of Algorithmic Computing",
    departmentId: "computer-science",
    departmentName: "Computer Science Department",
    difficulty: "Intermediate",
    duration: "10 weeks",
    rating: 4.9,
    lessonsCount: 5,
    image: "/assets/images/dsa.svg",
    description: "Asymptotic Big-O analysis, linear and hierarchical memory structures, balanced search trees, heaps, graph traversals, and dynamic programming techniques.",
    badge: "Honors Core",
    whatYouWillLearn: [
      "Analyze time and space complexity with Big-O, Theta, and Omega notation",
      "Implement linked lists, stacks, queues, trees, and heaps cleanly",
      "Solve topological ordering and shortest-path graph problems",
      "Compare empirical runtime characteristics of sorting algorithms",
      "Formulate recurrence relations and dynamic programming tables"
    ],
    prerequisites: ["Comfort with at least one language (Python, Java, or C++)"],
    modules: [
      {
        id: "mod-1",
        title: "Module 1: Asymptotics & Linear Structures",
        lessons: [
          { id: "4-1", title: "Asymptotic Notation & Space-Time Tradeoffs", duration: "17:15", videoUrl: "https://www.youtube.com/embed/8hly31xKli0", completed: false },
          { id: "4-2", title: "Dynamic Arrays, Singly & Doubly Linked Lists", duration: "22:30", videoUrl: "https://www.youtube.com/embed/F8AbOfQwl1c", completed: false },
          { id: "4-3", title: "Stacks, Monotonic Queues & Deques in Practice", duration: "19:50", videoUrl: "https://www.youtube.com/embed/wjI1W45ExrU", completed: false }
        ]
      },
      {
        id: "mod-2",
        title: "Module 2: Non-Linear Hierarchies & Trees",
        lessons: [
          { id: "4-4", title: "Binary Trees, Traversals & Balanced AVL Trees", duration: "25:40", videoUrl: "https://www.youtube.com/embed/oSWTXtMglKE", completed: false },
          { id: "4-5", title: "Min-Max Heaps & Priority Queue Applications", duration: "20:15", videoUrl: "https://www.youtube.com/embed/t0Cq6tVNRBA", completed: false }
        ]
      }
    ]
  },
  {
    id: 5,
    title: "Artificial Intelligence & Neural Architectures",
    instructor: "Dr. Amanda Lee",
    instructorRole: "Director of Cognitive Systems",
    departmentId: "artificial-intelligence",
    departmentName: "Artificial Intelligence Department",
    difficulty: "Advanced",
    duration: "14 weeks",
    rating: 4.9,
    lessonsCount: 3,
    image: "/assets/images/ai.svg",
    description: "Explore deep neural networks, backpropagation calculus, Convolutional Neural Networks for computer vision, attention layers, and empirical model evaluation.",
    badge: "Research Track",
    whatYouWillLearn: [
      "Derive backpropagation and gradient descent updates from first principles",
      "Understand activation functions, regularization, and generalization",
      "Architect Convolutional Neural Networks for spatial vision tasks",
      "Diagnose overfitting vs. underfitting using validation metrics",
      "Evaluate classification precision, recall, and F1 scores"
    ],
    prerequisites: ["Multivariable calculus, linear algebra, and Python proficiency"],
    modules: [
      {
        id: "mod-1",
        title: "Module 1: Foundations of Deep Learning",
        lessons: [
          { id: "5-1", title: "Neurons, Activation Functions & Loss Surfaces", duration: "21:30", videoUrl: "https://www.youtube.com/embed/aircAruvnKk", completed: false },
          { id: "5-2", title: "Backpropagation Calculus & Tensor Operations", duration: "26:45", videoUrl: "https://www.youtube.com/embed/IHZwWFHWa-w", completed: false },
          { id: "5-3", title: "Convolutional Neural Networks for Vision", duration: "24:20", videoUrl: "https://www.youtube.com/embed/KuXjwB4LzSA", completed: false }
        ]
      }
    ]
  },
  {
    id: 6,
    title: "Spatial UI/UX & Design Systems",
    instructor: "Emma Watson",
    instructorRole: "Design Director & Spatial Interface Lead",
    departmentId: "lecture-hall",
    departmentName: "Lecture Hall",
    difficulty: "Beginner",
    duration: "8 weeks",
    rating: 4.8,
    lessonsCount: 3,
    image: "/assets/images/ui-ux.svg",
    description: "Master user experience research, architectural interface hierarchy, 8-point typographic grids, component token libraries, WCAG contrast compliance, and usability testing.",
    badge: "Colloquium Series",
    whatYouWillLearn: [
      "Conduct structured user research and information architecture mapping",
      "Build scalable design token systems with clean 8-point spacing grids",
      "Apply cognitive affordances and WCAG AA contrast standards",
      "Produce interactive wireframes and usability test plans",
      "Bridge UI design tokens seamlessly with CSS custom properties"
    ],
    prerequisites: ["No prior design experience required"],
    modules: [
      {
        id: "mod-1",
        title: "Module 1: UX Principles & Cognitive Architecture",
        lessons: [
          { id: "6-1", title: "Mental Models, Affordances & Usability Heuristics", duration: "16:40", videoUrl: "https://www.youtube.com/embed/c9Wg6Cb_YlU", completed: false },
          { id: "6-2", title: "User Personas, Journey Maps & Information Architecture", duration: "20:15", videoUrl: "https://www.youtube.com/embed/wI2daZXzwt0", completed: false },
          { id: "6-3", title: "Design Systems: Frames, Auto-Layout & Design Tokens", duration: "27:50", videoUrl: "https://www.youtube.com/embed/FTFaQWZBqQ8", completed: false }
        ]
      }
    ]
  },
  {
    id: 7,
    title: "Database Architectures & Cloud Engines",
    instructor: "Dr. James Wilson",
    instructorRole: "Data Infrastructure Lead",
    departmentId: "research-lab",
    departmentName: "Research Laboratory",
    difficulty: "Intermediate",
    duration: "10 weeks",
    rating: 4.7,
    lessonsCount: 3,
    image: "/assets/images/database.svg",
    description: "Relational database modeling, ACID transactional integrity, SQL query tuning, B-Tree index internals, and distributed storage engine benchmarking.",
    badge: "Applied Lab",
    whatYouWillLearn: [
      "Normalize relational schemas across 1NF, 2NF, 3NF, and BCNF",
      "Author expressive SQL queries with joins, subqueries, and window functions",
      "Inspect query execution plans and B-Tree index scan costs",
      "Understand ACID atomicity, isolation levels, and durability guarantees",
      "Compare relational and NoSQL trade-offs for scalable systems"
    ],
    prerequisites: ["Basic understanding of tables and programming logic"],
    modules: [
      {
        id: "mod-1",
        title: "Module 1: Relational Modeling & SQL Mastery",
        lessons: [
          { id: "7-1", title: "Relational Algebra, Schemas & Entity Relationships", duration: "19:25", videoUrl: "https://www.youtube.com/embed/HXV3zeQKqGY", completed: false },
          { id: "7-2", title: "Advanced SQL Queries, Subqueries & Window Functions", duration: "24:10", videoUrl: "https://www.youtube.com/embed/7S_tz1z_5bA", completed: false },
          { id: "7-3", title: "Index Internals: B-Trees, Hash Indexes & Scan Costs", duration: "21:30", videoUrl: "https://www.youtube.com/embed/aZjYr87r1b8", completed: false }
        ]
      }
    ]
  },
  {
    id: 8,
    title: "Enterprise Cybersecurity & Threat Intelligence",
    instructor: "Alex Rivera",
    instructorRole: "Defense Strategist & Lab Lead",
    departmentId: "research-lab",
    departmentName: "Research Laboratory",
    difficulty: "Intermediate",
    duration: "10 weeks",
    rating: 4.8,
    lessonsCount: 3,
    image: "/assets/images/cybersecurity.svg",
    description: "Network protocol inspection, threat modeling, OWASP Top 10 web application defenses, asymmetric cryptography, TLS transport security, and incident response.",
    badge: "Security Lab",
    whatYouWillLearn: [
      "Inspect network packet captures and diagnose anomalous traffic",
      "Mitigate OWASP Top 10 web vulnerabilities including SQLi and XSS",
      "Apply public-key cryptography and Transport Layer Security concepts",
      "Enforce the Principle of Least Privilege across access boundaries",
      "Author clear security threat models and defense checklists"
    ],
    prerequisites: ["Basic networking knowledge (IP, TCP/UDP, DNS)"],
    modules: [
      {
        id: "mod-1",
        title: "Module 1: Network Security & Attack Vectors",
        lessons: [
          { id: "8-1", title: "The Cyber Kill Chain & Threat Modeling Frameworks", duration: "17:40", videoUrl: "https://www.youtube.com/embed/inWWhr5tnEA", completed: false },
          { id: "8-2", title: "Packet Sniffing, Wireshark & Port Scanning Defense", duration: "22:15", videoUrl: "https://www.youtube.com/embed/qpnAC0GjZAE", completed: false },
          { id: "8-3", title: "OWASP Top 10: SQL Injection & Cross-Site Scripting", duration: "25:50", videoUrl: "https://www.youtube.com/embed/2_l0G3Q2ZpA", completed: false }
        ]
      }
    ]
  },
  {
    id: 9,
    title: "Digital Venture Creation & Tech Leadership",
    instructor: "Elena Rostova",
    instructorRole: "Chair of Technology Ventures",
    departmentId: "business",
    departmentName: "Business Department",
    difficulty: "All Levels",
    duration: "6 weeks",
    rating: 4.9,
    lessonsCount: 2,
    image: "/assets/images/hero-illustration.svg",
    description: "Turn technical breakthroughs into sustainable organizations. Covers customer discovery, product-market fit, SaaS unit economics (LTV/CAC), and cross-functional leadership.",
    badge: "Executive Seminar",
    whatYouWillLearn: [
      "Validate product-market fit through structured customer discovery",
      "Model recurring unit economics (CAC, LTV, Churn, Payback period)",
      "Interpret term sheets and capital allocation principles",
      "Lead engineering, product, and design collaborations effectively"
    ],
    prerequisites: ["Interest in technology strategy and venture creation"],
    modules: [
      {
        id: "mod-1",
        title: "Module 1: Idea Validation & Unit Economics",
        lessons: [
          { id: "9-1", title: "Customer Problem Discovery & The Lean Canvas", duration: "18:10", videoUrl: "https://www.youtube.com/embed/th3RNVPrn0U", completed: false },
          { id: "9-2", title: "Unit Economics, Financial Projections & CAC/LTV", duration: "21:40", videoUrl: "https://www.youtube.com/embed/0JbSox31z7w", completed: false }
        ]
      }
    ]
  },
  {
    id: 10,
    title: "Mathematical Foundations of Deep Learning",
    instructor: "Dr. Srinivasa Raman Jr.",
    instructorRole: "Mathematical Foundations Chair",
    departmentId: "artificial-intelligence",
    departmentName: "Artificial Intelligence Department",
    difficulty: "Advanced",
    duration: "10 weeks",
    rating: 4.9,
    lessonsCount: 2,
    image: "/assets/images/dsa.svg",
    description: "The mathematical backbone of modern AI: linear transformations, eigenvalues and spectral decomposition, Jacobians, gradient vector fields, and probability distributions.",
    badge: "Graduate Core",
    whatYouWillLearn: [
      "Master vector spaces, orthogonal projections, and Singular Value Decomposition",
      "Compute Jacobians, Hessians, and multivariable directional gradients",
      "Apply Bayes Theorem and KL Divergence in statistical optimization",
      "Interpret high-dimensional latent representations geometrically"
    ],
    prerequisites: ["Multivariable calculus and Python basics"],
    modules: [
      {
        id: "mod-1",
        title: "Module 1: Matrix Calculus & Vector Spaces",
        lessons: [
          { id: "10-1", title: "Vector Spaces, Linear Independence & Projections", duration: "23:15", videoUrl: "https://www.youtube.com/embed/fNk_zzaMoSs", completed: false },
          { id: "10-2", title: "Eigenvalues, Eigenvectors & Spectral Decomposition", duration: "26:30", videoUrl: "https://www.youtube.com/embed/PFDu9oVAE-g", completed: false }
        ]
      }
    ]
  }
];
