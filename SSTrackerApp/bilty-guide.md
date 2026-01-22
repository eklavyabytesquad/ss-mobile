# 🚀 Bilty Printing - Quick Reference Guide

## 📋 Tables Used

1. **`bilty`** - Main bilty data (GR no, parties, charges, etc.)
2. **`branches`** - Branch information
3. **`cities`** - City names and codes
4. **`transports`** - Transport company details
5. **`permanent_details`** - Company bank, signature, GST
6. **`bill_books`** - GR number generation
7. **`rates`** - Freight rates

## 🔄 Print Flow (3 Steps)

```
1. SAVE BILTY
   ↓
   INSERT into bilty table
   UPDATE bill_books (increment GR)
   INSERT/UPDATE rates
   
2. SELECT PRINT TYPE
   ↓
   • Simple Print → print-bilty.js (HTML)
   • Professional PDF → pdf-generation.js (jsPDF)
   
3. PDF GENERATION
   ↓
   Fetch: permanent_details, cities, transports, branches
   Generate: QR Code
   Draw: 2 copies (Consignee + Driver)
   Output: Blob URL → Display/Download
```

## 🎨 PDF Sections (in order)

1. **Header** - Company name, GST, bank details, address
2. **QR Code & GR Box** - QR code + GR number in box
3. **Copy Type** - CONSIGNEE COPY / DRIVER COPY
4. **Date & Route** - Date, FROM TO CITY
5. **Delivery** - Transport name, GSTIN, mobile
6. **Consignor** - Name, GST, mobile
7. **Consignee** - Name, GST/Aadhar/PAN, mobile
8. **E-way Bill** - E-way bill number
9. **Invoice Details** - Date, number, value
10. **Package Details** - Content, PVT marks, city code, weight
11. **Charges** - All charges + Total (right section)
12. **Payment Status** - PAID/TO PAY
13. **Footer** - Website, notice, customer care, signature

## 🔧 Quick Customization

### Change Text Position
**File:** `src/components/bilty/pdf-generation.js`

```javascript
// Line ~120-220: COORDINATES object
COORDINATES.PEOPLE_SECTION.CONSIGNOR_NAME = { x: 12, y: 60 }
```

### Change Font Size/Style
```javascript
// Line ~245-270: STYLES object
STYLES.FONTS.ENHANCED_LABELS = { 
  size: 10.5, 
  weight: 'bold', 
  family: 'times' 
}
```

### Change Line Thickness
```javascript
// Line ~270: STYLES.LINES
STYLES.LINES.THICK = 1.0
```

## 📱 Key Functions

| Function | File | Purpose |
|----------|------|---------|
| `handleSave()` | page.js:590 | Save bilty to database |
| `generateGRNumber()` | page.js:450 | Create GR number from bill book |
| `loadAllDataAndGeneratePreview()` | pdf-generation.js:340 | Fetch all data & generate PDF |
| `drawBiltyCopy()` | pdf-generation.js:450 | Draw one copy of bilty |
| `generateQRCode()` | pdf-generation.js:920 | Create QR code with bilty data |

## 🎯 Database Operations

### Save New Bilty
```javascript
await supabase.from('bilty').insert([biltyData]);
```

### Update Existing Bilty
```javascript
await supabase.from('bilty').update(biltyData).eq('id', biltyId);
```

### Fetch for PDF
```javascript
// 5 queries run in parallel
Promise.all([
  supabase.from('permanent_details').select('*'),
  supabase.from('cities').select('*').eq('id', fromCityId),
  supabase.from('cities').select('*').eq('id', toCityId),
  supabase.from('transports').select('*'),
  supabase.from('branches').select('*')
]);
```

## 🖨️ Print Options

### 1. Simple Print (Browser)
- Uses `window.print()`
- Basic HTML layout
- Fast, no QR code
- File: `print-bilty.js`

### 2. Professional PDF
- Uses jsPDF library
- QR code included
- Enhanced styling
- Two copies on one page
- File: `pdf-generation.js`

## 📐 PDF Coordinate System

- **Unit:** Millimeters (mm)
- **Page Size:** A4 (210mm × 297mm)
- **Origin:** Top-left (0, 0)
- **Two Copies:** 
  - Top copy: y = 0 to 148
  - Bottom copy: y = 148 to 296
  - Separator: Dashed line at y = 148

## 🔍 Reprint Existing Bilty

1. Click **"Edit Bilty"** button
2. Search GR number in dropdown
3. Select bilty
4. Click **"Print"** in form
5. Choose print option

## 📦 NPM Packages

```json
{
  "jspdf": "^2.x",      // PDF generation
  "qrcode": "^1.x",     // QR code generation
  "date-fns": "^2.x",   // Date formatting
  "@supabase/supabase-js": "^2.x"  // Database
}
```

## ⚡ Performance Tips

1. **Signature Pre-processing** - Darkened once on mount
2. **Parallel Fetching** - All data fetched simultaneously
3. **PDF Caching** - Generated once, viewed multiple times
4. **Lazy Generation** - Only when user clicks print

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| QR code missing | Check internet, verify bilty data |
| Signature too light | Already pre-processed with darkening |
| PDF not downloading | Mobile auto-downloads, no embed support |
| Layout misaligned | Adjust COORDINATES in pdf-generation.js |
| Font too small | Increase font size in STYLES.FONTS |

## 📂 File Structure

```
movesure-website/src/
├── app/
│   ├── bilty/
│   │   └── page.js              ← Main form & save logic
│   └── utils/
│       └── supabase.js          ← Database connection
└── components/bilty/
    ├── grnumber-manager.js      ← GR number handling
    ├── consignor-consignee.js   ← Party details
    ├── charges.js               ← Charges section
    ├── print-model.js           ← Print options modal
    ├── print-bilty.js           ← Simple HTML print
    ├── pdf-generation.js        ← Professional PDF ⭐
    ├── pdf-viewer-ui.js         ← PDF viewer UI
    └── whatsapp-notification.js ← WhatsApp integration
```

---

**Need more details?** See `BILTY_PRINTING_DOCUMENTATION.md` for complete documentation.
