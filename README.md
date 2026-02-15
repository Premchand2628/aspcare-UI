# Car Wash Web Application

A complete responsive car wash web application built with React and Vite.

## 🚗 Features

- **11 Complete UI Screens**:
  1. Home/Dashboard - User greeting, rewards, service cards
  2. Services - Self Drive, Home, ASP care, Teflon services
  3. Select Center - Choose washing center location
  4. Booking - Map view with vehicle selection
  5. Review/Payment - Order summary and payment
  6. Orders List - View all user orders
  7. Order Details - Detailed order information
  8. Terms & Conditions - Service agreement
  9. Membership Plans - BASIC, PREMIUM, ULTRA tiers
  10. Membership Details - Benefits and payment history
  11. Profile - User profile and settings

- **Responsive Design** - Works on desktop and mobile
- **Modern UI** - Clean, colorful interface with smooth animations
- **React Router** - Seamless navigation between screens
- **Component-based** - Reusable components for maintainability

## 📁 Project Structure

```
MainApp/
├── public/
│   └── images/           # Place your images here
├── src/
│   ├── components/
│   │   └── BottomNav.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Services.jsx
│   │   ├── SelectCenter.jsx
│   │   ├── Booking.jsx
│   │   ├── Review.jsx
│   │   ├── Orders.jsx
│   │   ├── OrderDetail.jsx
│   │   ├── TermsConditions.jsx
│   │   ├── MembershipPlans.jsx
│   │   ├── MembershipDetail.jsx
│   │   └── Profile.jsx
│   ├── styles/
│   │   ├── global.css
│   │   ├── Home.css
│   │   ├── Services.css
│   │   ├── SelectCenter.css
│   │   ├── Booking.css
│   │   ├── Review.css
│   │   ├── Orders.css
│   │   ├── OrderDetail.css
│   │   ├── TermsConditions.css
│   │   ├── MembershipPlans.css
│   │   ├── MembershipDetail.css
│   │   ├── Profile.css
│   │   └── BottomNav.css
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Start the development server**:
```bash
npm run dev
```

**Note**: The app uses OpenStreetMap's Nominatim API for geocoding - completely free with no API key required!

3. **Open your browser** and navigate to:
```
http://localhost:3000
```

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## 🎨 Customization

### Adding Images

Place your images in the `public/images/` directory. The application expects these images:
- `user-avatar.png`
- `rewards-icon.png`
- `notification-icon.png`
- `checkout-icon.png`
- `membership-icon.png`
- `car-main.png`
- `car-wash.png`
- `car-detail.png`
- `car-wash-splash.png`
- `trophy.png`
- `orders.png`

### Changing Colors

Edit the CSS files in `src/styles/` to customize:
- Primary color: `#5E4DB2` (purple)
- Secondary color: `#4FC3F7` (cyan)
- Accent colors: `#FFD700` (gold), `#FF8C00` (orange), `#FF6B9D` (pink)

### Modifying Routes

Edit `src/App.jsx` to add or modify routes.

## 📱 Responsive Breakpoints

- **Mobile**: < 480px
- **Tablet**: 480px - 768px
- **Desktop**: > 768px

## 🧭 Navigation Flow

1. **Home** → Services/Membership
2. **Services** → Select Center
3. **Select Center** → Booking
4. **Booking** → Review
5. **Review** → Terms & Conditions
6. **Terms** → Membership Detail
7. **Profile** → Orders/Membership/Settings

## 🎯 Next Steps (Functionality)

The UI is complete and ready for functionality implementation:
- Add state management (Redux/Context API)
- Integrate backend API
- Add form validation
- Implement payment gateway
- Add authentication
- Connect to map services
- Add real-time tracking

## 📝 License

This project is open source and available for customization.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

**Note**: This is a UI-only implementation. Backend integration and functionality will be added as per requirements.
