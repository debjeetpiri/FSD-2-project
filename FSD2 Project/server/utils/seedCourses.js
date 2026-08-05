require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User     = require('../models/User');
const Course   = require('../models/Course');
const connectDB = require('../config/db');

const coursesData = [
  /* ── Programming ───────────────────────────────────────────────────────── */
  {
    title: 'Full-Stack Web Development Bootcamp',
    description: 'Master modern web development from scratch using HTML5, CSS3, JavaScript ES6+, React, Node.js, Express, and MongoDB.',
    category: 'Programming',
    level: 'Beginner',
    duration: '12 weeks',
    isPublished: true,
  },
  {
    title: 'Python Data Science & Machine Learning',
    description: 'Learn data analysis, visualization, machine learning models, Pandas, NumPy, and Scikit-Learn with hands-on projects.',
    category: 'Programming',
    level: 'Intermediate',
    duration: '10 weeks',
    isPublished: true,
  },
  {
    title: 'Advanced React & Microservices Architecture',
    description: 'Deep dive into React state management, custom hooks, performance tuning, Docker containers, and REST/GraphQL APIs.',
    category: 'Programming',
    level: 'Advanced',
    duration: '8 weeks',
    isPublished: true,
  },

  /* ── Design ────────────────────────────────────────────────────────────── */
  {
    title: 'UI/UX Design Masterclass & Figma Fundamentals',
    description: 'Learn user research, wireframing, interactive prototyping, color theory, typography, and modern UI design workflows in Figma.',
    category: 'Design',
    level: 'Beginner',
    duration: '6 weeks',
    isPublished: true,
  },
  {
    title: 'Design Systems & Advanced Motion Graphics',
    description: 'Build scalable design token systems, component libraries, and interactive micro-animations for web and mobile apps.',
    category: 'Design',
    level: 'Intermediate',
    duration: '4 weeks',
    isPublished: true,
  },

  /* ── Business ──────────────────────────────────────────────────────────── */
  {
    title: 'Digital Marketing & Growth Hacking',
    description: 'Master SEO, content marketing, Google & Meta Ads, conversion rate optimization (CRO), and email funnel automation.',
    category: 'Business',
    level: 'Beginner',
    duration: '6 weeks',
    isPublished: true,
  },
  {
    title: 'Financial Management & Startup Accounting',
    description: 'Learn startup financial modeling, balance sheets, cash flow forecasting, unit economics, and venture fundraising.',
    category: 'Business',
    level: 'Intermediate',
    duration: '8 weeks',
    isPublished: true,
  },

  /* ── Science ───────────────────────────────────────────────────────────── */
  {
    title: 'Introduction to Quantum Computing & Physics',
    description: 'Explore quantum mechanics principles, qubits, quantum gates, entanglement, and IBM Qiskit quantum algorithms.',
    category: 'Science',
    level: 'Advanced',
    duration: '10 weeks',
    isPublished: true,
  },
  {
    title: 'Genomics & Molecular Biology Foundations',
    description: 'Understand DNA sequencing, gene expression analysis, CRISPR gene editing, and bioinformatics computing pipeline.',
    category: 'Science',
    level: 'Intermediate',
    duration: '8 weeks',
    isPublished: true,
  },

  /* ── Mathematics ────────────────────────────────────────────────────────── */
  {
    title: 'Linear Algebra & Vector Calculus for AI',
    description: 'Master matrices, eigenvalues, vector spaces, gradient calculus, and optimization algorithms essential for Artificial Intelligence.',
    category: 'Mathematics',
    level: 'Intermediate',
    duration: '6 weeks',
    isPublished: true,
  },
  {
    title: 'Discrete Mathematics & Applied Probability',
    description: 'Comprehensive guide to logic, set theory, combinatorics, graph theory, and probability distributions in computer science.',
    category: 'Mathematics',
    level: 'Beginner',
    duration: '8 weeks',
    isPublished: true,
  },

  /* ── Language ──────────────────────────────────────────────────────────── */
  {
    title: 'Conversational Spanish & Grammar Mastery',
    description: 'Learn practical Spanish vocabulary, sentence structuring, pronunciation, and everyday conversation skills.',
    category: 'Language',
    level: 'Beginner',
    duration: '8 weeks',
    isPublished: true,
  },
  {
    title: 'Professional Business English & Public Speaking',
    description: 'Improve business email writing, executive presentation skills, negotiation vocabulary, and formal communication.',
    category: 'Language',
    level: 'Intermediate',
    duration: '4 weeks',
    isPublished: true,
  },

  /* ── Arts ──────────────────────────────────────────────────────────────── */
  {
    title: 'Digital Illustration & Concept Art',
    description: 'Master digital painting, digital brushes, perspective lighting, character design, and environment concept art.',
    category: 'Arts',
    level: 'Beginner',
    duration: '6 weeks',
    isPublished: true,
  },
  {
    title: 'Music Production & Audio Engineering',
    description: 'Learn digital audio workstations (DAW), mixing, mastering, sound synthesis, equalization, and acoustics.',
    category: 'Arts',
    level: 'Intermediate',
    duration: '8 weeks',
    isPublished: true,
  },

  /* ── Other ─────────────────────────────────────────────────────────────── */
  {
    title: 'Mindfulness & High Performance Productivity',
    description: 'Develop habit stacking, time blocking, focus routines, stress management techniques, and cognitive energy control.',
    category: 'Other',
    level: 'Beginner',
    duration: '4 weeks',
    isPublished: true,
  },
  {
    title: 'Public Speaking & Executive Leadership',
    description: 'Overcome stage fear, master vocal modulation, structure persuasive keynotes, and lead teams effectively.',
    category: 'Other',
    level: 'Intermediate',
    duration: '5 weeks',
    isPublished: true,
  },
];

const seedDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lms_db'
    );
    console.log(`Connected to MongoDB: ${conn.connection.host}`);

    // Ensure at least one Faculty user exists
    let faculty = await User.findOne({ role: 'faculty' });
    if (!faculty) {
      faculty = await User.create({
        name: 'Prof. Sarah Jenkins',
        email: 'faculty@eduflow.io',
        password: 'password123',
        role: 'faculty',
      });
      console.log('Created default faculty user: faculty@eduflow.io');
    }

    // Insert courses
    let addedCount = 0;
    for (const item of coursesData) {
      const exists = await Course.findOne({ title: item.title });
      if (!exists) {
        await Course.create({
          ...item,
          faculty: faculty._id,
        });
        addedCount++;
      }
    }

    console.log(`✅ Seeding complete! Successfully added ${addedCount} courses across 8 categories.`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ Seeding failed: ${err.message}`);
    process.exit(1);
  }
};

seedDB();
