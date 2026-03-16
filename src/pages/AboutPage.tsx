
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Users, Shield, Heart } from 'lucide-react';
import { useSiteSettings } from '@/context/SiteSettingsContext';

const AboutPage: React.FC = () => {
    const { settings } = useSiteSettings();
    const businessName = settings.businessName || 'RoomRental';

    const values = [
        {
            icon: Shield,
            title: 'Trust & Safety',
            description: 'We verify all listings and users to ensure a safe and trustworthy platform.'
        },
        {
            icon: Users,
            title: 'Community First',
            description: 'Built for the community, by the community. We listen to your feedback.'
        },
        {
            icon: Heart,
            title: 'Customer Care',
            description: 'Our support team is always ready to help you with any queries.'
        },
        {
            icon: Building2,
            title: 'Quality Listings',
            description: 'Every room listing is reviewed to maintain high quality standards.'
        }
    ];

    return (
        <div className="container mx-auto px-4 py-12">
            {/* Hero Section */}
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold mb-4">About {businessName}</h1>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                    {businessName} is Maharashtra's leading platform for finding rooms, roommates, and managing shared expenses. 
                    We're on a mission to make room hunting simple, transparent, and hassle-free.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                {[
                    { value: '10,000+', label: 'Rooms Listed' },
                    { value: '50,000+', label: 'Happy Users' },
                    { value: '15+', label: 'Cities Covered' },
                    { value: '100+', label: 'Verified Brokers' }
                ].map((stat, index) => (
                    <Card key={index} className="text-center">
                        <CardContent className="p-6">
                            <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                            <div className="text-sm text-muted-foreground">{stat.label}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Our Values */}
            <div className="mb-16">
                <h2 className="text-2xl font-bold text-center mb-8">Our Values</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {values.map((value, index) => (
                        <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <value.icon className="w-7 h-7 text-primary" />
                                </div>
                                <h3 className="font-semibold mb-2">{value.title}</h3>
                                <p className="text-sm text-muted-foreground">{value.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Our Story */}
            <Card className="mb-16">
                <CardContent className="p-8">
                    <h2 className="text-2xl font-bold mb-4">Our Story</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                        {businessName} was founded in 2024 with a simple goal: to solve the room hunting problem in Maharashtra. 
                        We noticed that finding a room or a roommate was unnecessarily complicated, with scattered listings, 
                        unreliable information, and no way to manage shared expenses.
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                        Today, we're proud to be the go-to platform for thousands of people looking for accommodation 
                        across Maharashtra. From students to working professionals, our platform serves everyone 
                        looking for a place to call home.
                    </p>
                </CardContent>
            </Card>

            {/* Contact CTA */}
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Have Questions?</h2>
                <p className="text-muted-foreground mb-6">
                    We're here to help. Reach out to our team for any queries.
                </p>
                <a href="/contact" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                    Contact Us
                </a>
            </div>
        </div>
    );
};

export default AboutPage;
