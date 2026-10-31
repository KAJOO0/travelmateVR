import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';

const HomePage = lazy(() => import('@/pages/HomePage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const CreditsPage = lazy(() => import('@/pages/CreditsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const ExplorePage = lazy(() => import('@/pages/explore/ExplorePage'));
const DestinationsPage = lazy(() => import('@/pages/explore/DestinationsPage'));
const DestinationPage = lazy(() => import('@/pages/explore/DestinationPage'));
const VrLibraryPage = lazy(() => import('@/pages/vr/VrLibraryPage'));
const ExperienceModePage = lazy(() => import('@/pages/vr/ExperienceModePage'));
const MarketplacePage = lazy(() => import('@/pages/marketplace/MarketplacePage'));
const ListingPage = lazy(() => import('@/pages/marketplace/ListingPage'));
const PartnerPage = lazy(() => import('@/pages/marketplace/PartnerPage'));
const BookingFlowPage = lazy(() => import('@/pages/booking/BookingFlowPage'));
const BookingDetailPage = lazy(() => import('@/pages/booking/BookingDetailPage'));
const AiPage = lazy(() => import('@/pages/trip/AiPage'));
const PlannerPage = lazy(() => import('@/pages/trip/PlannerPage'));
const ItineraryBuilderPage = lazy(() => import('@/pages/trip/ItineraryBuilderPage'));
const TripsPage = lazy(() => import('@/pages/trip/TripsPage'));
const TripControlPage = lazy(() => import('@/pages/trip/TripControlPage'));
const BookingsPage = lazy(() => import('@/pages/account/BookingsPage'));
const WishlistPage = lazy(() => import('@/pages/account/WishlistPage'));
const NotificationsPage = lazy(() => import('@/pages/account/NotificationsPage'));
const AccountPage = lazy(() => import('@/pages/account/AccountPage'));
const SignInPage = lazy(() => import('@/pages/account/SignInPage'));
const HelpPage = lazy(() => import('@/pages/support/HelpPage'));
const TicketPage = lazy(() => import('@/pages/support/HelpPage').then(m => ({ default: m.TicketPage })));
const ContactPage = lazy(() => import('@/pages/support/HelpPage').then(m => ({ default: m.ContactPage })));
const ContentPage = lazy(() => import('@/pages/ContentPage'));

// Business portal shell (lazy: travellers never download portal code)
const PortalLayout = lazy(() => import('@/components/portal/PortalLayout').then(m => ({ default: m.PortalLayout })));
const portal = (kind: 'partner' | 'board' | 'admin') => <Suspense fallback={null}><PortalLayout kind={kind} /></Suspense>;
// Public business pages
const PartnersLandingPage = lazy(() => import('@/pages/business/PartnersLandingPage'));
const PartnerJoinPage = lazy(() => import('@/pages/business/JoinPage'));
const BoardsLandingPage = lazy(() => import('@/pages/board/BoardsLandingPage'));
const FaqPage = lazy(() => import('@/pages/FaqPage'));
const CreatorsPage = lazy(() => import('@/pages/creators/CreatorsPage'));
const CreatorApplyPage = lazy(() => import('@/pages/creators/CreatorsPage').then(m => ({ default: m.CreatorApplyPage })));
// Partner portal
const BizOverview = lazy(() => import('@/pages/business/OverviewPage'));
const BizBookings = lazy(() => import('@/pages/business/BookingsPage'));
const BizCalendar = lazy(() => import('@/pages/business/CalendarPage'));
const BizListings = lazy(() => import('@/pages/business/ListingsPage'));
const BizListingEdit = lazy(() => import('@/pages/business/ListingEditPage'));
const BizNewListing = lazy(() => import('@/pages/business/NewListingPage'));
const BizCustomers = lazy(() => import('@/pages/business/CustomersPage'));
const BizMessages = lazy(() => import('@/pages/business/MessagesPage'));
const BizReviews = lazy(() => import('@/pages/business/ReviewsPage'));
const BizRevenue = lazy(() => import('@/pages/business/RevenuePage'));
const BizMarketing = lazy(() => import('@/pages/business/MarketingPage'));
const BizAnalytics = lazy(() => import('@/pages/business/AnalyticsPage'));
const BizVr = lazy(() => import('@/pages/business/VrPage'));
const BizProfile = lazy(() => import('@/pages/business/ProfilePage'));
const BizTeam = lazy(() => import('@/pages/business/TeamPage'));
const BizSettings = lazy(() => import('@/pages/business/SettingsPage'));
// Admin Command Center
const AdminDashboard = lazy(() => import('@/pages/admin/DashboardPage'));
const AdminUsers = lazy(() => import('@/pages/admin/UsersPage'));
const AdminPartners = lazy(() => import('@/pages/admin/PartnersPage'));
const AdminDestinations = lazy(() => import('@/pages/admin/DestinationsPage'));
const AdminBookings = lazy(() => import('@/pages/admin/BookingsPage'));
const AdminVr = lazy(() => import('@/pages/admin/VrPage'));
const AdminAi = lazy(() => import('@/pages/admin/AiPage'));
const AdminReviews = lazy(() => import('@/pages/admin/ReviewsPage'));
const AdminMarketing = lazy(() => import('@/pages/admin/MarketingPages').then(m => ({ default: m.AdminMarketingPage })));
const AdminPromotions = lazy(() => import('@/pages/admin/MarketingPages').then(m => ({ default: m.AdminPromotionsPage })));
const AdminAnalytics = lazy(() => import('@/pages/admin/InsightPages').then(m => ({ default: m.AdminAnalyticsPage })));
const AdminSustainability = lazy(() => import('@/pages/admin/InsightPages').then(m => ({ default: m.AdminSustainabilityPage })));
const AdminSupport = lazy(() => import('@/pages/admin/SupportPage'));
const AdminReports = lazy(() => import('@/pages/admin/ReportsPage'));
const AdminSecurity = lazy(() => import('@/pages/admin/SecuritySettingsPages').then(m => ({ default: m.AdminSecurityPage })));
const AdminSettings = lazy(() => import('@/pages/admin/SecuritySettingsPages').then(m => ({ default: m.AdminSettingsPage })));
// Tourism board portal
const BoardOverview = lazy(() => import('@/pages/board/OverviewPage'));
const BoardDestinations = lazy(() => import('@/pages/board/DestinationsPage'));
const BoardDestinationEdit = lazy(() => import('@/pages/board/DestinationsPage').then(m => ({ default: m.BoardDestinationEditPage })));
const BoardContent = lazy(() => import('@/pages/board/ContentPage'));
const BoardCampaigns = lazy(() => import('@/pages/board/CampaignsPage'));
const BoardVisitors = lazy(() => import('@/pages/board/InsightPages').then(m => ({ default: m.BoardVisitorsPage })));
const BoardAttractions = lazy(() => import('@/pages/board/InsightPages').then(m => ({ default: m.BoardAttractionsPage })));
const BoardTrends = lazy(() => import('@/pages/board/InsightPages').then(m => ({ default: m.BoardTrendsPage })));
const BoardPartners = lazy(() => import('@/pages/board/InsightPages').then(m => ({ default: m.BoardPartnersPage })));
const BoardSustainability = lazy(() => import('@/pages/board/InsightPages').then(m => ({ default: m.BoardSustainabilityPage })));

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'credits', element: <CreditsPage /> },
      { path: 'explore', element: <ExplorePage /> },
      { path: 'destinations', element: <DestinationsPage /> },
      { path: 'destinations/:slug', element: <DestinationPage /> },
      { path: 'vr', element: <VrLibraryPage /> },
      { path: 'vr/:slug', element: <ExperienceModePage /> },
      { path: 'experiences', element: <MarketplacePage key="local" type="local" /> },
      { path: 'marketplace', element: <MarketplacePage key="all" /> },
      { path: 'stays', element: <MarketplacePage key="stay" type="stay" /> },
      { path: 'safaris', element: <MarketplacePage key="safari" type="safari" /> },
      { path: 'activities', element: <MarketplacePage key="activity" type="activity" /> },
      { path: 'transport', element: <MarketplacePage key="transport" type="transport" /> },
      { path: 'restaurants', element: <MarketplacePage key="restaurant" type="restaurant" /> },
      { path: 'events', element: <MarketplacePage key="event" type="event" /> },
      { path: 'listing/:slug', element: <ListingPage /> },
      { path: 'partner/:slug', element: <PartnerPage /> },
      { path: 'book/:slug', element: <BookingFlowPage /> },
      { path: 'bookings', element: <BookingsPage /> },
      { path: 'bookings/:id', element: <BookingDetailPage /> },
      { path: 'ai', element: <AiPage /> },
      { path: 'plan', element: <PlannerPage /> },
      { path: 'plan/:id', element: <ItineraryBuilderPage /> },
      { path: 'trips', element: <TripsPage /> },
      { path: 'trips/:id', element: <TripControlPage /> },
      { path: 'wishlist', element: <WishlistPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'account', element: <AccountPage /> },
      { path: 'account/:section', element: <AccountPage /> },
      { path: 'signin', element: <SignInPage /> },
      { path: 'help', element: <HelpPage /> },
      { path: 'help/tickets/:id', element: <TicketPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'about', element: <ContentPage key="about" page="about" /> },
      { path: 'sustainability', element: <ContentPage key="sustainability" page="sustainability" /> },
      { path: 'privacy', element: <ContentPage key="privacy" page="privacy" /> },
      { path: 'terms', element: <ContentPage key="terms" page="terms" /> },
      { path: 'security', element: <ContentPage key="security" page="security" /> },
      { path: 'partners', element: <PartnersLandingPage /> },
      { path: 'partners/join', element: <PartnerJoinPage /> },
      { path: 'tourism-boards', element: <BoardsLandingPage /> },
      { path: 'creators', element: <CreatorsPage /> },
      { path: 'faq', element: <FaqPage /> },
      { path: 'creators/apply', element: <CreatorApplyPage /> },
      { path: '*', element: <NotFoundPage /> }
    ]
  },
  // Business portals have their own shell (separate experience, role-gated).
  {
    path: 'business',
    element: portal('partner'),
    children: [
      { index: true, element: <BizOverview /> },
      { path: 'bookings', element: <BizBookings /> },
      { path: 'calendar', element: <BizCalendar /> },
      { path: 'listings', element: <BizListings /> },
      { path: 'listings/new', element: <BizNewListing /> },
      { path: 'listings/:id', element: <BizListingEdit /> },
      { path: 'customers', element: <BizCustomers /> },
      { path: 'messages', element: <BizMessages /> },
      { path: 'reviews', element: <BizReviews /> },
      { path: 'revenue', element: <BizRevenue /> },
      { path: 'marketing', element: <BizMarketing /> },
      { path: 'analytics', element: <BizAnalytics /> },
      { path: 'vr', element: <BizVr /> },
      { path: 'profile', element: <BizProfile /> },
      { path: 'team', element: <BizTeam /> },
      { path: 'settings', element: <BizSettings /> },
      { path: '*', element: <NotFoundPage /> }
    ]
  },
  {
    path: 'board',
    element: portal('board'),
    children: [
      { index: true, element: <BoardOverview /> },
      { path: 'destinations', element: <BoardDestinations /> },
      { path: 'destinations/:id', element: <BoardDestinationEdit /> },
      { path: 'content', element: <BoardContent /> },
      { path: 'campaigns', element: <BoardCampaigns /> },
      { path: 'visitors', element: <BoardVisitors /> },
      { path: 'attractions', element: <BoardAttractions /> },
      { path: 'trends', element: <BoardTrends /> },
      { path: 'partners', element: <BoardPartners /> },
      { path: 'sustainability', element: <BoardSustainability /> },
      { path: '*', element: <NotFoundPage /> }
    ]
  },
  {
    path: 'admin',
    element: portal('admin'),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'users', element: <AdminUsers /> },
      { path: 'partners', element: <AdminPartners /> },
      { path: 'destinations', element: <AdminDestinations /> },
      { path: 'bookings', element: <AdminBookings /> },
      { path: 'vr', element: <AdminVr /> },
      { path: 'ai', element: <AdminAi /> },
      { path: 'reviews', element: <AdminReviews /> },
      { path: 'marketing', element: <AdminMarketing /> },
      { path: 'promotions', element: <AdminPromotions /> },
      { path: 'analytics', element: <AdminAnalytics /> },
      { path: 'sustainability', element: <AdminSustainability /> },
      { path: 'support', element: <AdminSupport /> },
      { path: 'reports', element: <AdminReports /> },
      { path: 'security', element: <AdminSecurity /> },
      { path: 'settings', element: <AdminSettings /> },
      { path: '*', element: <NotFoundPage /> }
    ]
  }
];
