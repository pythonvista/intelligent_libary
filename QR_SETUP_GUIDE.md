# Quick Setup & Testing Guide - QR Code System

## Prerequisites

Before testing the QR code functionality, ensure:
- Backend server is running on `http://localhost:5000`
- Frontend is running on `http://localhost:3000`
- MongoDB is connected
- At least one user account exists (patron role)
- At least one staff/admin account exists
- At least one book exists in the system

## Quick Start

### Step 1: Generate User QR Codes for Existing Users

Run this script to add QR codes to existing users:

```bash
cd backend
node -e "
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function addQRCodes() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/library');
  
  const users = await User.find({ qrCode: { \$exists: false } });
  
  for (let user of users) {
    user.qrCode = \`STUDENT_\${Date.now()}_\${Math.random().toString(36).substr(2, 9).toUpperCase()}\`;
    await user.save();
    console.log(\`Added QR code for user: \${user.name}\`);
  }
  
  console.log(\`Updated \${users.length} users\`);
  mongoose.connection.close();
}

addQRCodes();
"
```

### Step 2: Update Book QR Codes

Run this script to update book QR codes with the new format:

```bash
cd backend
node -e "
const mongoose = require('mongoose');
const Book = require('./models/Book');
require('dotenv').config();

async function updateBookQRCodes() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/library');
  
  const books = await Book.find({});
  
  for (let book of books) {
    book.qrCode = \`BOOK_\${Date.now()}_\${Math.random().toString(36).substr(2, 9).toUpperCase()}\`;
    await book.save();
    console.log(\`Updated QR code for book: \${book.title}\`);
  }
  
  console.log(\`Updated \${books.length} books\`);
  mongoose.connection.close();
}

updateBookQRCodes();
"
```

## Testing Workflows

### Test 1: Student Views Their QR Code

1. Log in as a student (patron role)
2. Navigate to "Profile" page
3. Scroll down to see "My Library QR Code" section
4. Verify:
   - QR code image is displayed
   - User name and email shown below QR
   - Download and Print buttons work
   - Instructions are clear

### Test 2: Student Borrows Book via QR

#### Setup:
- Ensure you have a book with a QR code
- From admin panel, go to Books → Click a book → "View QR Code"
- Open the QR code on another device or print it

#### Steps:
1. Log in as a student
2. Click "Borrow Book" in the navigation
3. Click "Scan Book QR Code"
4. Allow camera access
5. Point camera at the book's QR code
6. Verify:
   - Book is successfully borrowed
   - Success message displayed
   - Book details shown
   - Due date displayed
   - "View My Books" button works

### Test 3: Admin Processes Borrow Transaction

#### Setup:
- Have student QR code ready (from profile page)
- Have book QR code ready (from admin book management)

#### Steps:
1. Log in as admin/staff
2. Click "QR Scanner" in navigation
3. Select "Borrow Book" action
4. Click "Scan Student QR Code"
5. Allow camera access
6. Scan student's QR code
7. Verify student info is displayed
8. Click "Scan Book QR Code"
9. Scan book's QR code
10. Verify:
    - Transaction completed successfully
    - Student and book info displayed
    - "Process Another Transaction" works

### Test 4: Admin Processes Return Transaction

1. Log in as admin/staff
2. Click "QR Scanner" in navigation
3. Select "Return Book" action
4. Scan student's QR code
5. Scan book's QR code that the student has borrowed
6. Verify:
   - Book returned successfully
   - Fine displayed if book is overdue
   - Transaction recorded

### Test 5: Error Handling

#### Test Invalid QR Code:
1. Go to borrow page or admin scanner
2. Try scanning a random QR code (not from the system)
3. Verify: Error message displayed

#### Test Borrowing Limit:
1. As a student, borrow 5 books
2. Try to borrow a 6th book via QR
3. Verify: Error message about limit reached

#### Test Duplicate Borrowing:
1. Borrow a book
2. Try to borrow the same book again
3. Verify: Error message about already borrowed

## Quick Test Script

Save this as `test_qr.sh`:

```bash
#!/bin/bash

echo "=== Testing QR Code System ==="
echo ""

# Test 1: Get user QR code
echo "Test 1: Getting user QR code..."
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/auth/my-qr
echo ""
echo ""

# Test 2: Borrow via QR (replace with actual QR code)
echo "Test 2: Borrowing book via QR..."
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bookQrCode":"BOOK_1234567890_ABCDEFGH"}' \
  http://localhost:5000/api/transactions/borrow-qr
echo ""
echo ""

# Test 3: Process dual QR (admin)
echo "Test 3: Processing dual QR scan..."
curl -X POST \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userQrCode":"STUDENT_1234567890_ABCDEFGH","bookQrCode":"BOOK_1234567890_ABCDEFGH","action":"return"}' \
  http://localhost:5000/api/transactions/process-qr
echo ""
```

## Common Issues & Solutions

### Issue: Camera Not Working
**Solution:**
- Ensure you're accessing the site via HTTPS or localhost
- Grant camera permissions in browser
- Check browser console for errors

### Issue: QR Code Not Scanning
**Solution:**
- Ensure good lighting
- Hold device steady
- Make sure QR code is clearly visible on screen
- Try moving camera closer/farther

### Issue: "Book not found for this QR code"
**Solution:**
- Ensure book QR codes have been generated (run Step 2 above)
- Verify QR code format starts with "BOOK_"

### Issue: "User not found for this QR code"
**Solution:**
- Ensure user QR codes have been generated (run Step 1 above)
- Verify QR code format starts with "STUDENT_"

### Issue: Transaction Failed
**Solution:**
- Check if user has reached borrowing limit (5 books)
- Verify book is available
- Check if user already has this book borrowed
- Review backend logs for detailed error

## Browser Compatibility

The QR scanner requires camera access. Tested on:
- ✅ Chrome (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (iOS)
- ✅ Edge (Desktop)

**Note:** Camera API requires HTTPS in production. For local testing, use `localhost`.

## Production Deployment Notes

Before deploying to production:

1. **SSL Certificate Required**
   - Camera API only works on HTTPS
   - Obtain SSL certificate for your domain

2. **Environment Variables**
   ```bash
   NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
   ```

3. **QR Code Size**
   - Ensure printed QR codes are at least 2cm x 2cm
   - Use high-contrast printing (black on white)
   - Laminate QR codes for durability

4. **Camera Permissions**
   - Update privacy policy to mention camera usage
   - Inform users why camera access is needed

## Tips for Best Experience

### For Students:
- Save your QR code to phone's photos for quick access
- Or print and laminate your QR code
- Bookmark the "Borrow Book" page for quick access

### For Staff:
- Keep the admin QR scanner page open during busy hours
- Have students present QR codes on phones
- For returns, keep book QR codes easily accessible
- Use tablet or phone for better portability

### For Books:
- Print QR codes on durable labels
- Place QR codes on back cover or inside front cover
- Ensure QR codes are not obstructed by protective covers
- Keep backup of all book QR codes

## Support Resources

- **Full Documentation:** See `QR_CODE_IMPLEMENTATION.md`
- **API Reference:** See API section in full documentation
- **Troubleshooting:** See Troubleshooting section in full documentation

---

**Ready to Test!** Follow the workflows above to test the QR code system.

