import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSiteSettings } from '@/context/SiteSettingsContext';

export default function TermsAndConditionsPage() {
    const navigate = useNavigate();
    const { settings } = useSiteSettings();

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="mb-6"
                >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>

                <Card className="shadow-lg">
                    <CardHeader className="bg-primary text-primary-foreground">
                        <CardTitle className="text-3xl">Terms & Conditions</CardTitle>
                        <CardDescription className="text-primary-foreground/80">
                            Room Rental Management Platform
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8 space-y-6">
                        <section>
                            <h2 className="text-2xl font-bold mb-3 text-gray-900">1. General Terms</h2>
                            <p className="text-gray-700 leading-relaxed">
                                By posting a room listing on our platform, you agree to comply with all applicable laws and regulations. The platform is provided as-is for property owners and renters to connect and facilitate room rentals.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-3 text-gray-900">2. Room Listing Requirements</h2>
                            <ul className="text-gray-700 leading-relaxed space-y-2 ml-4">
                                <li>• Room information must be accurate and up-to-date</li>
                                <li>• All images must be genuine photos of the actual property</li>
                                <li>• Pricing and availability information must be correct</li>
                                <li>• Location details must accurately reflect the property&apos;s position</li>
                                <li>• All amenities listed must be available at the property</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-3 text-gray-900">3. Content Responsibility</h2>
                            <p className="text-gray-700 leading-relaxed">
                                Property owners are responsible for all content posted in their listings. We reserve the right to remove any listings that contain inappropriate, misleading, or false information, or that violate any laws or regulations.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-3 text-gray-900">4. User Conduct</h2>
                            <p className="text-gray-700 leading-relaxed mb-3">
                                Users agree not to:
                            </p>
                            <ul className="text-gray-700 leading-relaxed space-y-2 ml-4">
                                <li>• Post discriminatory or hateful content</li>
                                <li>• Engage in fraud or misrepresentation</li>
                                <li>• Post spam or irrelevant content</li>
                                <li>• Violate any intellectual property rights</li>
                                <li>• Attempt to bypass platform security measures</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-3 text-gray-900">5. Liability Disclaimer</h2>
                            <p className="text-gray-700 leading-relaxed">
                                The platform is provided on an &quot;as-is&quot; basis. We do not guarantee the accuracy of listings or the conduct of other users. We are not responsible for disputes between property owners and renters, property damage, or any other issues arising from room rentals arranged through our platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-3 text-gray-900">6. Privacy & Data</h2>
                            <p className="text-gray-700 leading-relaxed">
                                Your personal data is processed in accordance with applicable data protection laws. We use your information to facilitate room listings and communications. Please review our Privacy Policy for more details.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-3 text-gray-900">7. Intellectual Property</h2>
                            <p className="text-gray-700 leading-relaxed">
                                All content and materials on the platform are owned or licensed by us. You may not copy, reproduce, or distribute any content without permission.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-3 text-gray-900">8. Termination</h2>
                            <p className="text-gray-700 leading-relaxed">
                                We reserve the right to suspend or terminate user accounts that violate these terms or engage in prohibited behavior.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-3 text-gray-900">9. Changes to Terms</h2>
                            <p className="text-gray-700 leading-relaxed">
                                We may update these terms at any time. Continued use of the platform constitutes acceptance of the updated terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-3 text-gray-900">10. Contact Us</h2>
                            <p className="text-gray-700 leading-relaxed">
                                For questions about these terms, please contact our support team at {settings.supportEmail}
                            </p>
                        </section>

                        <div className="pt-6 border-t">
                            <p className="text-sm text-gray-500">
                                Last updated: {new Date().toLocaleDateString()}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-8 text-center">
                    <Button size="lg" onClick={() => navigate(-1)}>
                        Back to Room Listing
                    </Button>
                </div>
            </div>
        </div>
    );
}
