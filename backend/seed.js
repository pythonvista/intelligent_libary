const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');
require('dotenv').config();

const User = require('./models/User');
const Book = require('./models/Book');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/intelligent_library');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

const sampleBooks = [
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "978-0-7432-7356-5",
    subject: "Literature",
    description: "A classic American novel set in the Jazz Age, exploring themes of wealth, love, and the American Dream.",
    publisher: "Scribner",
    publishedYear: 1925,
    pages: 180,
    language: "English",
    totalCopies: 3,
    availableCopies: 3,
    location: { shelf: "A1", section: "Fiction", floor: "1" },
    tags: ["classic", "american literature", "jazz age"]
  },
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "978-0-06-112008-4",
    subject: "Literature",
    description: "A novel about racial injustice and childhood innocence in the American South.",
    publisher: "J.B. Lippincott & Co.",
    publishedYear: 1960,
    pages: 281,
    language: "English",
    totalCopies: 2,
    availableCopies: 2,
    location: { shelf: "A2", section: "Fiction", floor: "1" },
    tags: ["classic", "american literature", "social justice"]
  },
  {
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen",
    isbn: "978-0-262-03384-8",
    subject: "Computer Science",
    description: "Comprehensive textbook on computer algorithms and data structures.",
    publisher: "MIT Press",
    publishedYear: 2009,
    pages: 1312,
    language: "English",
    totalCopies: 5,
    availableCopies: 5,
    location: { shelf: "B1", section: "Computer Science", floor: "2" },
    tags: ["algorithms", "computer science", "programming"]
  },
  {
    title: "Clean Code",
    author: "Robert C. Martin",
    isbn: "978-0-13-235088-4",
    subject: "Computer Science",
    description: "A handbook of agile software craftsmanship focusing on writing clean, maintainable code.",
    publisher: "Prentice Hall",
    publishedYear: 2008,
    pages: 464,
    language: "English",
    totalCopies: 4,
    availableCopies: 4,
    location: { shelf: "B2", section: "Programming", floor: "2" },
    tags: ["programming", "software engineering", "best practices"]
  },
  {
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    isbn: "978-0-06-231609-7",
    subject: "History",
    description: "An exploration of how Homo sapiens came to dominate the world.",
    publisher: "Harper",
    publishedYear: 2014,
    pages: 443,
    language: "English",
    totalCopies: 3,
    availableCopies: 3,
    location: { shelf: "C1", section: "History", floor: "1" },
    tags: ["history", "anthropology", "human evolution"]
  },
  {
    title: "The Selfish Gene",
    author: "Richard Dawkins",
    isbn: "978-0-19-286092-7",
    subject: "Science",
    description: "A book on evolution that introduced the concept of the 'selfish gene'.",
    publisher: "Oxford University Press",
    publishedYear: 1976,
    pages: 360,
    language: "English",
    totalCopies: 2,
    availableCopies: 2,
    location: { shelf: "D1", section: "Biology", floor: "2" },
    tags: ["evolution", "biology", "genetics"]
  },
  {
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    isbn: "978-0-374-53355-7",
    subject: "Psychology",
    description: "A summary of research in cognitive psychology and behavioral economics.",
    publisher: "Farrar, Straus and Giroux",
    publishedYear: 2011,
    pages: 499,
    language: "English",
    totalCopies: 3,
    availableCopies: 3,
    location: { shelf: "E1", section: "Psychology", floor: "1" },
    tags: ["psychology", "cognitive science", "decision making"]
  },
  {
    title: "The Art of War",
    author: "Sun Tzu",
    isbn: "978-1-59030-963-7",
    subject: "Philosophy",
    description: "An ancient Chinese military treatise on strategy and warfare.",
    publisher: "Shambhala Publications",
    publishedYear: -500,
    pages: 273,
    language: "English",
    totalCopies: 2,
    availableCopies: 2,
    location: { shelf: "F1", section: "Philosophy", floor: "1" },
    tags: ["strategy", "philosophy", "military", "ancient wisdom"]
  }
];

const sampleUsers = [
  {
    name: "John Doe",
    email: "user@demo.com",
    password: "password123",
    role: "patron",
    phoneNumber: "+1-555-0123",
    address: "123 Main St, Anytown, USA"
  },
  {
    name: "Jane Smith",
    email: "jane@demo.com",
    password: "password123",
    role: "patron",
    phoneNumber: "+1-555-0124",
    address: "456 Oak Ave, Anytown, USA"
  },
  {
    name: "Library Staff",
    email: "staff@demo.com",
    password: "password123",
    role: "staff",
    phoneNumber: "+1-555-0125",
    address: "789 Pine St, Anytown, USA"
  },
  {
    name: "Library Admin",
    email: "admin@demo.com",
    password: "password123",
    role: "admin",
    phoneNumber: "+1-555-0126",
    address: "321 Elm St, Anytown, USA"
  }
];

const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Book.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const users = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      users.push(user);
      console.log(`Created user: ${user.email}`);
    }

    // Create books with QR codes
    const books = [];
    for (const bookData of sampleBooks) {
      // Generate unique QR code
      const qrData = `LIBRARY_BOOK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const book = new Book({
        ...bookData,
        qrCode: qrData
      });
      
      await book.save();
      books.push(book);
      console.log(`Created book: ${book.title}`);
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nDemo accounts:');
    console.log('User: user@demo.com / password123');
    console.log('Staff: staff@demo.com / password123');
    console.log('Admin: admin@demo.com / password123');
    console.log(`\nCreated ${users.length} users and ${books.length} books`);

  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seeder
connectDB().then(() => {
  seedDatabase();
});
