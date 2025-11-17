# QR Code System - Quick Reference Card

## 🎯 Quick Start

### For Students
1. **View My QR Code:** Profile page (bottom)
2. **Borrow Book:** Navigation → "Borrow Book" → Scan book QR
3. **Return Book:** Visit library desk with book

### For Staff/Admin
1. **Process Transaction:** Navigation → "QR Scanner"
2. **Get Book QR:** Admin → Books → Select book → "View QR Code"

---

## 📱 QR Code Formats

```
Student: STUDENT_1234567890_ABCDEFGH
Book:    BOOK_1234567890_ABCDEFGH
```

---

## 🔄 Workflows

### Student Self-Service Borrow
```
1. Click "Borrow Book"
2. Scan book's QR code
3. Done! ✅
```

### Staff Assisted Borrow
```
1. Open "QR Scanner"
2. Select "Borrow"
3. Scan student's QR
4. Scan book's QR
5. Done! ✅
```

### Staff Process Return
```
1. Open "QR Scanner"
2. Select "Return"
3. Scan student's QR
4. Scan book's QR
5. Pay fine if shown
6. Done! ✅
```

---

## 📊 Business Rules

| Rule | Value |
|------|-------|
| Max Books | 5 per student |
| Loan Period | 14 days |
| Renewals | 3 times max |
| Late Fee | ₦1 per day |
| Max Fine | ₦50 |

---

## 🔗 Important URLs

| Page | URL | Access |
|------|-----|--------|
| Borrow Book | `/borrow-book` | Students |
| QR Scanner | `/admin/qr-scanner` | Staff/Admin |
| My Profile | `/profile` | All users |
| Admin Books | `/admin/books` | Staff/Admin |

---

## ✅ Validation Checks

**Before Borrowing:**
- ✓ Book is available
- ✓ Student has < 5 books
- ✓ Not already borrowed by student
- ✓ Valid QR codes

**On Return:**
- ✓ Active transaction exists
- ✓ Calculate days overdue
- ✓ Calculate fine if late
- ✓ Update book availability

---

## 🚨 Common Errors

| Error | Solution |
|-------|----------|
| "Invalid QR code" | Ensure scanning correct type (STUDENT_ or BOOK_) |
| "Book not available" | Book is currently borrowed |
| "Maximum limit reached" | Student already has 5 books |
| "Already borrowed" | Student already has this book |
| "Camera not working" | Grant camera permission, use HTTPS |
| "Transaction not found" | Wrong book or not currently borrowed |

---

## 🛠️ Admin Tasks

### Generate Book QR Code
```
Admin → Books → Click book → "View QR Code" → Download/Print
```

### View All Transactions
```
Admin → Transactions → Filter by status
```

### Check User's Books
```
Admin → QR Scanner → Scan student QR → View borrowed books
```

---

## 📋 Setup Checklist

### Initial Setup
- [ ] Run migration script: `node backend/scripts/add-qr-codes.js`
- [ ] Print all book QR codes
- [ ] Attach QR codes to physical books
- [ ] Train staff on QR scanner

### Per-Book Setup
- [ ] Add book to system
- [ ] Generate QR code
- [ ] Print QR code
- [ ] Attach to book cover

### Per-User Setup
- [ ] User registers (QR auto-generated)
- [ ] User views profile to see QR
- [ ] User saves/prints QR code

---

## 🔐 Security

- 🔒 All endpoints require login
- 🔒 Staff features need staff/admin role
- 🔒 QR codes are unique and unpredictable
- 🔒 Validation happens server-side
- 🔒 No way to guess or enumerate QR codes

---

## 📱 Camera Requirements

- ✅ HTTPS or localhost
- ✅ Camera permission granted
- ✅ Modern browser (Chrome, Firefox, Safari, Edge)
- ✅ Good lighting conditions
- ✅ Steady hand (or use tripod)

---

## 🎨 UI Locations

**Students See:**
- "Borrow Book" in nav (QR icon)
- QR code on profile page
- Download/print buttons

**Staff See:**
- "QR Scanner" in nav (QR icon)
- "View QR Code" on book pages
- Transaction history

---

## ⚡ Performance Tips

### For Students
- Save QR to phone photos
- Bookmark borrow page
- Good lighting when scanning

### For Staff
- Keep QR scanner page open
- Use tablet for portability
- Have students prepare QR before counter

### For Library
- Print durable QR labels
- Laminate QR codes
- Place QR in consistent location on books

---

## 📞 Support

**Cannot scan QR code?**
→ Check camera permission
→ Ensure good lighting
→ Try different angle

**Transaction failed?**
→ Read error message carefully
→ Check borrowing limit
→ Verify book availability

**QR code not showing?**
→ Ensure logged in
→ Check internet connection
→ Try refreshing page

---

## 🎓 Training Points

### For Students (5 min)
1. Show where to find their QR code
2. Demo self-service borrowing
3. Explain borrowing limits and due dates
4. Show how to view borrowed books

### For Staff (10 min)
1. Demo QR scanner workflow
2. Practice both borrow and return
3. Show fine calculation
4. Explain error messages
5. Show transaction history

---

## 📊 Success Metrics

Track these to measure impact:
- ⏱️ Average transaction time
- 📈 Self-service borrow rate
- 😊 User satisfaction
- 📉 Error rate
- 🎯 Staff efficiency

---

## 🔮 Coming Soon

Potential future features:
- 📱 Mobile app
- 🖨️ Bulk QR printing
- 📊 Usage analytics
- 📍 Shelf location tracking
- 🔔 QR-based notifications

---

## 📚 Documentation

**Need more details?**
- Features: `QR_FEATURES_SUMMARY.md`
- Technical: `QR_CODE_IMPLEMENTATION.md`
- Setup: `QR_SETUP_GUIDE.md`
- Complete: `QR_IMPLEMENTATION_COMPLETE.md`

---

## 💡 Pro Tips

**For Best Results:**
- 🎯 Train users before launch
- 📋 Print clear instructions near scanner
- 🖨️ Use high-quality QR printing
- 🛡️ Laminate QR codes for durability
- 📱 Test on multiple devices
- 💬 Gather user feedback
- 📊 Monitor usage patterns
- 🔄 Iterate based on feedback

---

**Version:** 1.0.0  
**Last Updated:** November 2, 2025  
**Status:** ✅ Production Ready

---

### 🎉 That's it! You're ready to use the QR code system!

Keep this reference card handy for quick lookups. For detailed information, refer to the full documentation files.

