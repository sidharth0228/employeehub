# EmployeeHub 🚀

> Modern, full-stack HR Operations & Employee Lifecycle Management System built from the Stitch UI design system.

![EmployeeHub Preview](https://img.shields.io/badge/EmployeeHub-Full--Stack%20HRMS-004ac6?style=for-the-badge&logo=googlechrome&logoColor=white)
![Express](https://img.shields.io/badge/Backend-Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Vite](https://img.shields.io/badge/Frontend-Vite%20%2B%20Vanilla%20JS-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## 🌟 Features

- **🔐 HR Authentication & Security**: JWT-based session security with bcrypt password hashing and automatic route protection.
- **📊 Real-time Dashboard**: Live workforce metrics, leave request approvals queue, compliance alerts, and recent audit activity feed.
- **👥 Employee Directory**: Dual view modes (Card Grid & Table List), real-time search, status tabs, and department filtering.
- **👤 360° Employee Profiles**: Personal details, editable data, document management, leave history, and onboarding progress.
- **➕ 4-Step Add Employee Wizard**: Form validation, auto-generated employee codes (`EH-XXX`), bank details, and review submission.
- **📂 Document & Compliance Management**: Multipart file uploads (Multer), verification & rejection workflows with reason modals, and progress tracking.
- **📋 Onboarding Review Workflow**: 4-stage stepper, compliance checklist, and one-click onboarding approval.
- **🏖️ Leave Administration**: Approval/rejection workflows with reason tracking, dynamic badge counters, and automatic status synchronization.
- **🗂️ Document Categories Configuration**: Mandatory and conditional document requirements management.
- **⚙️ HR Control Center**: Configurable organization settings, leave policy allowances, and a 50-event chronological audit log.

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/sidharth0228/employeehub.git
cd employeehub
```

### 2. Install dependencies
```bash
# Install root, backend, and frontend dependencies
npm run install:all
```

### 3. Run the application
```bash
# Terminal 1: Start Backend API (Port 3001)
npm run dev:backend

# Terminal 2: Start Frontend App (Port 5173/5174)
npm run dev:frontend
```

Open [http://localhost:5173](http://localhost:5173) or [http://localhost:5174](http://localhost:5174) in your browser.

---

## 🔑 Default Credentials

- **Email**: `admin@employeehub.com`
- **Password**: `password123`

---

## 🏗️ Project Structure

```text
employeehub/
├── backend/
│   ├── data/                 # NeDB JSON document collections (auto-seeded)
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js           # Login & /me endpoints
│   │   ├── dashboard.js      # KPIs & alerts
│   │   ├── employees.js      # CRUD, search, filter, paginate
│   │   ├── documents.js      # Uploads, verify/reject, categories
│   │   ├── leave.js          # Leave applications & approval workflows
│   │   └── settings.js       # Org config & activity log
│   ├── uploads/              # Uploaded employee documents
│   ├── db.js                 # Database schema & 15-employee seed data
│   ├── package.json
│   └── server.js             # Express server entry
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── header.js     # Search header & avatar/status helpers
│   │   │   ├── sidebar.js    # Fixed navigation sidebar
│   │   │   └── toast.js      # Toast notifications & modal dialogs
│   │   ├── pages/
│   │   │   ├── addEmployee.js
│   │   │   ├── dashboard.js
│   │   │   ├── documentCategories.js
│   │   │   ├── documents.js
│   │   │   ├── employeeProfile.js
│   │   │   ├── employees.js
│   │   │   ├── leave.js
│   │   │   ├── login.js
│   │   │   ├── onboarding.js
│   │   │   └── settings.js
│   │   ├── api.js            # Centralized API fetch wrapper
│   │   ├── main.js           # Route registration & app bootstrap
│   │   └── router.js         # Client-side SPA router
│   ├── index.html            # Shell with Tailwind tokens & Material Symbols
│   ├── package.json
│   └── vite.config.js        # Vite dev server + proxy to backend
│
├── completed.md              # Detailed implementation report
└── package.json
```

---

## 📄 License
MIT License. Created with ❤️ for EmployeeHub.
