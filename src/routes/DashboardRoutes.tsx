import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const DashboardLayout = lazy(() => import('@/components/layouts/DashboardLayout'));
const ProtectedRoute = lazy(() => import('@/components/auth/ProtectedRoute'));

const BrokerDashboardPage = lazy(() => import('@/pages/dashboard/BrokerDashboardPage'));
const DashboardRouter = lazy(() => import('@/pages/dashboard/DashboardRouter'));
const MyRoomsPage = lazy(() => import('@/pages/dashboard/MyRoomsPage'));
const PostRoomPage = lazy(() => import('@/pages/dashboard/PostRoomPage'));
const EditRoomPage = lazy(() => import('@/pages/dashboard/EditRoomPage'));
const ExpensesPage = lazy(() => import('@/pages/dashboard/ExpensesPage'));
const RoommatesPage = lazy(() => import('@/pages/dashboard/RoommatesPage'));
const ChatPage = lazy(() => import('@/pages/dashboard/ChatPage'));
const ProfilePage = lazy(() => import('@/pages/dashboard/ProfilePage'));
const SettingsPage = lazy(() => import('@/pages/dashboard/SettingsPage'));

const DashboardRoutes: React.FC = () => {
    return (
        <Suspense fallback={null}>
            <Routes>
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<DashboardRouter />} />
                    <Route path="plans" element={<BrokerDashboardPage />} />
                    <Route path="rooms" element={<MyRoomsPage />} />
                    <Route path="rooms/post" element={<PostRoomPage />} />
                    <Route path="rooms/edit/:roomId" element={<EditRoomPage />} />
                    <Route path="expenses" element={<ExpensesPage />} />
                    <Route path="roommates" element={<RoommatesPage />} />
                    <Route path="chat" element={<ChatPage />} />
                    <Route path="chat/:roomId" element={<ChatPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="settings" element={<SettingsPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </Suspense>
    );
};

export default DashboardRoutes;
