# LibraryAI - Intelligent Library Management System

A modern, intelligent library management system with QR code integration, AI-powered recommendations, and a beautiful responsive UI.

## 🚀 Features

### Core Features
- **User Authentication** - Secure login/registration system with role-based access
- **Book Catalog** - Comprehensive book management with search and filtering
- **QR Code Integration** - Generate and scan QR codes for quick book access
- **Borrowing System** - Complete check-out/check-in functionality with due dates
- **AI Recommendations** - Intelligent book suggestions based on user preferences
- **Admin Dashboard** - Comprehensive management tools for staff and administrators
- **Mobile Responsive** - Optimized for all devices with touch-friendly QR scanning

### Advanced Features
- **Real-time Availability** - Live book availability status
- **Overdue Management** - Automatic fine calculation and overdue tracking
- **User Profiles** - Personalized user accounts with borrowing history
- **Analytics Dashboard** - Library statistics and usage reports
- **Bulk Import** - Mass book import functionality for administrators

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **QRCode** library for QR generation
- **bcryptjs** for password hashing

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Headless UI** for accessible components
- **Heroicons** for beautiful icons
- **QR Scanner** for camera-based scanning

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd intelligent_library
   ```

2. **Set up the Backend**
   ```bash
   cd backend
   npm install
   
   # Create .env file and configure
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   
   # Seed the database with sample data
   npm run seed
   
   # Start the development server
   npm run dev
   ```
   

3. **Set up the Frontend**
   ```bash
   cd ../client
   npm install
   
   # Create environment file
   echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
   
   # Start the development server
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Environment Variables

#### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/intelligent_library
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NODE_ENV=development
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 👥 Demo Accounts

After running the seed script, you can use these demo accounts:

- **Regular User**: `user@demo.com` / `password123`
- **Library Staff**: `staff@demo.com` / `password123`
- **Administrator**: `admin@demo.com` / `password123`

## 📱 User Roles & Permissions

### Patron (Regular User)
- Browse and search books
- Borrow and return books
- View personal borrowing history
- Scan QR codes to return books
- Receive AI-powered recommendations

### Staff
- All patron permissions
- Add, edit, and delete books
- Generate QR codes for books
- View all transactions
- Manage overdue books
- Access basic analytics

### Admin
- All staff permissions
- Manage user accounts
- Change user roles
- Access comprehensive reports
- Bulk import books
- View detailed analytics

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Books
- `GET /api/books` - Get all books (with search/filter)
- `GET /api/books/:id` - Get single book
- `POST /api/books` - Add new book (staff only)
- `PUT /api/books/:id` - Update book (staff only)
- `DELETE /api/books/:id` - Delete book (staff only)
- `GET /api/books/:id/qr` - Get QR code for book
- `GET /api/books/scan/:qrCode` - Get book info by QR code

### Transactions
- `POST /api/transactions/borrow/:bookId` - Borrow a book
- `POST /api/transactions/return/:bookId` - Return a book
- `GET /api/transactions/my-books` - Get user's borrowed books
- `GET /api/transactions/history` - Get borrowing history
- `POST /api/transactions/renew/:transactionId` - Renew a book

### Admin
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/users` - Get all users (staff only)
- `PUT /api/admin/users/:id/role` - Update user role (admin only)
- `GET /api/admin/reports/popular-books` - Popular books report
- `POST /api/admin/bulk-import` - Bulk import books

## 🔧 Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd client
npm test
```

### Code Formatting
```bash
# Format backend code
cd backend
npm run format

# Format frontend code
cd client
npm run format
```

### Database Management
```bash
# Seed database with sample data
cd backend
npm run seed

# Clear database
npm run clear-db
```

## 📱 Mobile Features

- **Responsive Design** - Optimized for all screen sizes
- **Touch-Friendly** - Large touch targets and intuitive gestures
- **QR Code Scanning** - Camera-based QR code scanning for mobile devices
- **Offline Support** - Basic offline functionality for browsing
- **Progressive Web App** - Install as a native app on mobile devices

## 🚀 Deployment

### Backend Deployment (Railway/Heroku)
1. Create a new project on Railway or Heroku
2. Connect your GitHub repository
3. Set environment variables in the deployment dashboard
4. Deploy from the main branch

### Frontend Deployment (Vercel)
1. Import project to Vercel
2. Set build command: `npm run build`
3. Set environment variables
4. Deploy automatically on push to main

### Database (MongoDB Atlas)
1. Create a MongoDB Atlas cluster
2. Get connection string
3. Update MONGODB_URI in environment variables

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📞 Support

For support, email support@libraryai.com or create an issue in the GitHub repository.

## 🙏 Acknowledgments

- Built with modern web technologies
- UI inspired by modern design principles
- QR code functionality powered by qrcode and qr-scanner libraries
- Icons provided by Heroicons
- Styling with Tailwind CSS
# intelligent_libary
