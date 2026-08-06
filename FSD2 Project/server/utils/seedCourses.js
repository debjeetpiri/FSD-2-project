require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User     = require('../models/User');
const Course   = require('../models/Course');
const connectDB = require('../config/db');

const coursesData = [
  {
    title: 'Python Programming Essentials',
    description: 'Learn Python fundamentals, data types, functions, object-oriented programming, and real-world scripting projects.',
    category: 'Programming',
    level: 'Beginner',
    duration: '8 weeks',
    isPublished: true,
  },
  {
    title: 'Java Full-Stack Development',
    description: 'Build enterprise applications with Java, Spring Boot, REST APIs, and frontend integration using modern web technologies.',
    category: 'Programming',
    level: 'Intermediate',
    duration: '10 weeks',
    isPublished: true,
  },
  {
    title: 'JavaScript Web Development',
    description: 'Master JavaScript fundamentals, DOM manipulation, ES6+, asynchronous programming, and building interactive web apps.',
    category: 'Programming',
    level: 'Beginner',
    duration: '8 weeks',
    isPublished: true,
  },
  {
    title: 'C Programming Fundamentals',
    description: 'Understand C syntax, pointers, memory management, data structures, and low-level programming concepts.',
    category: 'Programming',
    level: 'Beginner',
    duration: '8 weeks',
    isPublished: true,
  },
  {
    title: 'C++ Systems & Game Programming',
    description: 'Learn C++ object-oriented design, STL, memory management, and practical systems/game development patterns.',
    category: 'Programming',
    level: 'Intermediate',
    duration: '10 weeks',
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

    // Remove any existing courses before seeding the requested set
    await Course.deleteMany({});

    let addedCount = 0;
    for (const item of coursesData) {
      await Course.create({
        ...item,
        faculty: faculty._id,
      });
      addedCount++;
    }

    console.log(`✅ Seeding complete! Successfully added ${addedCount} courses.`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ Seeding failed: ${err.message}`);
    process.exit(1);
  }
};

seedDB();

