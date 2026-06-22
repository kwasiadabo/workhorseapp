import { createBrowserRouter } from 'react-router-dom';

import AuthLayout from './layouts/AuthLayout';
import TenantAppLayout from './layouts/TenantAppLayout';
import SuperAdminLayout from './layouts/SuperAdminLayout';

import ProtectedRoute from '@/routes/ProtectedRoute';
import GuestRoute from '@/routes/GuestRoute';
import RoleRoute from '@/routes/RoleRoute';

import LandingPage from '@/pages/LandingPage';
import NotFoundPage from '@/pages/NotFoundPage';
import ForbiddenPage from '@/pages/ForbiddenPage';
import LoginPage from '@/features/auth/LoginPage';
import RegisterTenantPage from '@/features/auth/RegisterTenantPage';
import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/features/auth/ResetPasswordPage';
import ChangePasswordPage from '@/features/auth/ChangePasswordPage';
import DashboardPage from '@/features/dashboard/DashboardPage';
import GettingStartedPage from '@/features/onboarding/GettingStartedPage';
import BranchesPage from '@/features/branches/BranchesPage';
import EmployeesPage from '@/features/employees/EmployeesPage';
import UsersPage from '@/features/users/UsersPage';
import UserDetailPage from '@/features/users/UserDetailPage';
import CustomersPage from '@/features/customers/CustomersPage';
import ServicesPage from '@/features/services/ServicesPage';
import BookingsListPage from '@/features/bookings/BookingsListPage';
import ServicePaymentsPage from '@/features/bookings/ServicePaymentsPage';
import BusinessAnalyticsPage from '@/features/reports/BusinessAnalyticsPage';
import BookingCreatePage from '@/features/bookings/BookingCreatePage';
import BookingDetailPage from '@/features/bookings/BookingDetailPage';
import MyServicesPage from '@/features/bookings/MyServicesPage';
import QueuesPage from '@/features/bookings/QueuesPage';
import PaymentsPage from '@/features/payments/PaymentsPage';
import CashHandoversPage from '@/features/cashHandovers/CashHandoversPage';
import ExpensesPage from '@/features/expenses/ExpensesPage';
import ExpenseReportPage from '@/features/expenses/ExpenseReportPage';
import BookingsReportPage from '@/features/bookings/BookingsReportPage';
import VehicleTypesPage from '@/features/bookings/VehicleTypesPage';
import PaymentsReportPage from '@/features/payments/PaymentsReportPage';
import RevenueReportPage from '@/features/reports/RevenueReportPage';
import CommissionReportPage from '@/features/reports/CommissionReportPage';
import ServiceProviderReportPage from '@/features/reports/ServiceProviderReportPage';
import SubscriptionPage from '@/features/subscription/SubscriptionPage';
import SubscriptionCallbackPage from '@/features/subscription/SubscriptionCallbackPage';
import PortalSettingsPage from '@/features/portal/PortalSettingsPage';
import SuperAdminTenantsPage from '@/features/superAdmin/SuperAdminTenantsPage';
import SuperAdminTenantDetailPage from '@/features/superAdmin/SuperAdminTenantDetailPage';
import SuperAdminUsersPage from '@/features/superAdmin/SuperAdminUsersPage';
import SuperAdminUserDetailPage from '@/features/superAdmin/SuperAdminUserDetailPage';
import SuperAdminBusinessTypesPage from '@/features/superAdmin/SuperAdminBusinessTypesPage';
import BankingSetupPage from '@/features/banking/BankingSetupPage';
import BankTransactionsPage from '@/features/banking/BankTransactionsPage';
import BankReportsPage from '@/features/banking/BankReportsPage';
import LoyaltyPage from '@/features/loyalty/LoyaltyPage';
import ReviewsPage from '@/features/reviews/ReviewsPage';
import PublicReviewPage from '@/features/reviews/PublicReviewPage';
import BookingPortalPage from '@/features/portal/BookingPortalPage';
import SmsCampaignsPage from '@/features/sms/SmsCampaignsPage';

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/403', element: <ForbiddenPage /> },
  { path: '/review/:token', element: <PublicReviewPage /> },
  { path: '/book/:slug', element: <BookingPortalPage /> },
  {
    element: <GuestRoute />,
    children: [
      { path: '/register', element: <RegisterTenantPage /> },
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/forgot-password', element: <ForgotPasswordPage /> },
          { path: '/reset-password', element: <ResetPasswordPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/change-password', element: <ChangePasswordPage /> },
      {
        path: '/app',
        element: <TenantAppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'getting-started', element: <GettingStartedPage /> },
          {
            element: <RoleRoute permissions={['branches.view']} />,
            children: [{ path: 'branches', element: <BranchesPage /> }],
          },
          {
            element: <RoleRoute permissions={['employees.view']} />,
            children: [{ path: 'employees', element: <EmployeesPage /> }],
          },
          {
            element: <RoleRoute permissions={['users.view']} />,
            children: [
              { path: 'users', element: <UsersPage /> },
              { path: 'users/:id', element: <UserDetailPage /> },
            ],
          },
          {
            element: <RoleRoute permissions={['customers.view']} />,
            children: [{ path: 'customers', element: <CustomersPage /> }],
          },
          {
            element: <RoleRoute permissions={['services.view']} />,
            children: [{ path: 'services', element: <ServicesPage /> }],
          },
          {
            element: <RoleRoute permissions={['bookings.view']} />,
            children: [{ path: 'bookings', element: <BookingsListPage /> }],
          },
          {
            element: <RoleRoute permissions={['bookings.view', 'bookings.view_own']} />,
            children: [{ path: 'bookings/:id', element: <BookingDetailPage /> }],
          },
          {
            element: <RoleRoute permissions={['bookings.create']} />,
            children: [{ path: 'bookings/new', element: <BookingCreatePage /> }],
          },
          {
            element: <RoleRoute roles={['employee']} />,
            children: [{ path: 'my-services', element: <MyServicesPage /> }],
          },
          {
            element: <RoleRoute permissions={['bookings.manage']} />,
            children: [{ path: 'queues', element: <QueuesPage /> }],
          },
          {
            element: <RoleRoute permissions={['bookings.manage']} />,
            children: [{ path: 'vehicle-types', element: <VehicleTypesPage /> }],
          },
          {
            element: <RoleRoute permissions={['payments.create']} />,
            children: [{ path: 'service-payments', element: <ServicePaymentsPage /> }],
          },
          {
            element: <RoleRoute permissions={['payments.view']} />,
            children: [{ path: 'payments', element: <PaymentsPage /> }],
          },
          {
            element: (
              <RoleRoute permissions={['cash_handovers.view', 'cash_handovers.manage']} />
            ),
            children: [{ path: 'cash-handovers', element: <CashHandoversPage /> }],
          },
          {
            element: <RoleRoute roles={['tenant_owner']} />,
            children: [{ path: 'analytics', element: <BusinessAnalyticsPage /> }],
          },
          {
            element: <RoleRoute roles={['tenant_owner']} />,
            children: [
              { path: 'subscription', element: <SubscriptionPage /> },
              { path: 'subscription/callback', element: <SubscriptionCallbackPage /> },
              { path: 'portal-settings', element: <PortalSettingsPage /> },
            ],
          },
          {
            element: <RoleRoute permissions={['expenses.view']} />,
            children: [{ path: 'expenses', element: <ExpensesPage /> }],
          },
          {
            element: <RoleRoute permissions={['expenses.view']} />,
            children: [{ path: 'expense-report', element: <ExpenseReportPage /> }],
          },
          {
            element: <RoleRoute permissions={['reports.view']} />,
            children: [{ path: 'bookings-report', element: <BookingsReportPage /> }],
          },
          {
            element: <RoleRoute permissions={['reports.view']} />,
            children: [{ path: 'payments-report', element: <PaymentsReportPage /> }],
          },
          {
            element: <RoleRoute permissions={['reports.view']} />,
            children: [{ path: 'revenue-report', element: <RevenueReportPage /> }],
          },
          {
            element: <RoleRoute permissions={['employees.manage']} />,
            children: [{ path: 'commission-report', element: <CommissionReportPage /> }],
          },
          {
            element: <RoleRoute permissions={['reports.view']} />,
            children: [{ path: 'service-provider-report', element: <ServiceProviderReportPage /> }],
          },
          {
            element: <RoleRoute permissions={['customers.view']} />,
            children: [{ path: 'loyalty', element: <LoyaltyPage /> }],
          },
          {
            element: <RoleRoute permissions={['bookings.view']} />,
            children: [{ path: 'reviews', element: <ReviewsPage /> }],
          },
          {
            element: <RoleRoute permissions={['banking.manage']} />,
            children: [{ path: 'banking/setup', element: <BankingSetupPage /> }],
          },
          {
            element: <RoleRoute permissions={['banking.view']} />,
            children: [{ path: 'banking/transactions', element: <BankTransactionsPage /> }],
          },
          {
            element: <RoleRoute permissions={['banking.view']} />,
            children: [{ path: 'banking/reports', element: <BankReportsPage /> }],
          },
          {
            element: <RoleRoute permissions={['sms.manage']} />,
            children: [{ path: 'sms', element: <SmsCampaignsPage /> }],
          },
        ],
      },
      {
        path: '/admin',
        element: <RoleRoute roles={['super_admin']} />,
        children: [
          {
            element: <SuperAdminLayout />,
            children: [
              { path: 'tenants', element: <SuperAdminTenantsPage /> },
              { path: 'tenants/:id', element: <SuperAdminTenantDetailPage /> },
              { path: 'users', element: <SuperAdminUsersPage /> },
              { path: 'users/:id', element: <SuperAdminUserDetailPage /> },
              { path: 'business-types', element: <SuperAdminBusinessTypesPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
