import { useAuth } from '@/context/AuthContext';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import BrokerDashboardPage from '@/pages/dashboard/BrokerDashboardPage';

const DashboardRouter: React.FC = () => {
    const { user } = useAuth();

    // Show broker dashboard for brokers, regular dashboard for members
    if (user?.role === 'Broker') {
        return <BrokerDashboardPage />;
    }

    return <DashboardPage />;
};

export default DashboardRouter;
