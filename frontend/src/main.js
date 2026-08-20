import { register, initRouter, navigate } from './router.js';
import loginPage from './pages/login.js';
import dashboardPage from './pages/dashboard.js';
import employeesPage from './pages/employees.js';
import employeeProfilePage from './pages/employeeProfile.js';
import addEmployeePage from './pages/addEmployee.js';
import leavePage from './pages/leave.js';
import settingsPage from './pages/settings.js';
import documentCategoriesPage from './pages/documentCategories.js';
import documentsPage from './pages/documents.js';
import onboardingPage from './pages/onboarding.js';
import payrollPage from './pages/payroll.js';

// Register all routes
register('/', loginPage);
register('/dashboard', dashboardPage);
register('/employees', employeesPage);
register('/employees/new', addEmployeePage);
register('/employees/:id/documents', documentsPage);
register('/employees/:id/onboarding', onboardingPage);
register('/employees/:id', employeeProfilePage);
register('/documents', documentsPage);
register('/onboarding', onboardingPage);
register('/payroll', payrollPage);
register('/payslips', payrollPage);
register('/leave', leavePage);
register('/settings', settingsPage);
register('/settings/document-categories', documentCategoriesPage);
register('/document-categories', documentCategoriesPage);

// Initialize router (handles browser navigation)
initRouter();
