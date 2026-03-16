import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Camera, Lock, MapPin, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { updateProfile, uploadProfileImage, forgotPassword } from '@/services/authService';
import { getProfileImageUrl } from '@/lib/utils';
import type { User as UserType } from '@/types';

const BROKER_AREA_SUGGESTIONS = [
    'Nigdi', 'Katraj', 'Kothrud', 'Hinjewadi', 'Wakad', 'Baner',
    'Aundh', 'Pimple Saudagar', 'Pimple Nilakh', 'Hadapsar', 'Magarpatta',
    'Viman Nagar', 'Koregaon Park', 'Shivajinagar', 'Deccan', 'FC Road',
    'Swargate', 'Warje', 'Karve Nagar', 'Kharadi', 'Pune Station',
    'Camp', 'Kondhwa', 'NIBM', 'Undri', 'Pimpri', 'Chinchwad',
    'Akurdi', 'Bhosari', 'Chakan', 'Talegaon', 'Balewadi', 'Sus',
    'Pashan', 'Bavdhan', 'Narhe', 'Dhayari', 'Sinhagad Road',
    'Market Yard', 'Bibwewadi', 'Parvati', 'Sadashiv Peth',
    'Yerawada', 'Kalyani Nagar', 'Wadgaon Sheri', 'Dhanori', 'Lohegaon'
];

const ProfilePage: React.FC = () => {
    const { user, updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const areaInputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const [formData, setFormData] = useState<Partial<UserType>>({
        name: user?.name || '',
        contact: user?.contact || '',
        gender: (user?.gender || '') as 'Male' | 'Female' | 'Other',
        pincode: user?.pincode || '',
        broker_area: user?.broker_area || ''
    });
    const [brokerAreas, setBrokerAreas] = useState<string[]>([]);
    const [currentArea, setCurrentArea] = useState('');
    const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
    const [filteredAreaSuggestions, setFilteredAreaSuggestions] = useState<string[]>([]);

    useEffect(() => {
        setFormData({
            name: user?.name || '',
            contact: user?.contact || '',
            gender: (user?.gender || '') as 'Male' | 'Female' | 'Other',
            pincode: user?.pincode || '',
            broker_area: user?.broker_area || ''
        });

        const areas = (user?.broker_area || '')
            .split(',')
            .map((area) => area.trim())
            .filter(Boolean);
        setBrokerAreas(areas);
    }, [user]);

    useEffect(() => {
        if (currentArea.trim().length > 0) {
            const filtered = BROKER_AREA_SUGGESTIONS.filter((area) =>
                area.toLowerCase().includes(currentArea.toLowerCase()) &&
                !brokerAreas.some((existing) => existing.toLowerCase() === area.toLowerCase())
            );
            setFilteredAreaSuggestions(filtered);
            setShowAreaSuggestions(filtered.length > 0);
        } else {
            setShowAreaSuggestions(false);
            setFilteredAreaSuggestions([]);
        }
    }, [currentArea, brokerAreas]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node) &&
                areaInputRef.current &&
                !areaInputRef.current.contains(event.target as Node)
            ) {
                setShowAreaSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const addBrokerArea = (area: string) => {
        const normalizedArea = area.trim();
        if (!normalizedArea) {
            return;
        }

        const exists = brokerAreas.some((existing) => existing.toLowerCase() === normalizedArea.toLowerCase());
        if (exists) {
            toast.error('Area already added');
            return;
        }

        setBrokerAreas((prev) => [...prev, normalizedArea]);
        setCurrentArea('');
        setShowAreaSuggestions(false);
    };

    const handleSaveProfile = async () => {
        const payload: Partial<UserType> = {
            ...formData,
            broker_area: user?.role === 'Broker' ? brokerAreas.join(', ') : formData.broker_area
        };

        try {
            setIsSaving(true);
            await updateProfile(payload);
            toast.success('Profile updated successfully');
            setIsEditing(false);
            updateUser(payload);
        } catch (error) {

            toast.error('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleProfileImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }

        try {
            setIsSaving(true);
            const imageUrl = await uploadProfileImage(file);
            toast.success('Profile picture updated successfully');
            // Update user with the new image URL
            updateUser({ profile_image: imageUrl });
        } catch (error) {
            toast.error('Failed to upload profile picture');
        } finally {
            setIsSaving(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!user?.email) {
            toast.error('Email not found');
            return;
        }

        try {
            setIsSaving(true);
            await forgotPassword(user.email);
            toast.success('Password reset link sent to your email');
        } catch (error) {
            toast.error('Failed to request password reset');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setCurrentArea('');
        setShowAreaSuggestions(false);
        setFormData({
            name: user?.name || '',
            contact: user?.contact || '',
            gender: (user?.gender || '') as 'Male' | 'Female' | 'Other',
            pincode: user?.pincode || '',
            broker_area: user?.broker_area || ''
        });
        const areas = (user?.broker_area || '')
            .split(',')
            .map((area) => area.trim())
            .filter(Boolean);
        setBrokerAreas(areas);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Profile</h1>
                <p className="text-muted-foreground">Manage your profile information</p>
            </div>

            <Tabs defaultValue="profile">
                <TabsList>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-6 mb-6">
                                <div className="relative">
                                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {user?.profile_image ? (
                                            <img 
                                                src={getProfileImageUrl(user.profile_image)} 
                                                alt={user.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User className="w-12 h-12 text-primary" />
                                        )}
                                    </div>
                                    <Button 
                                        size="icon" 
                                        variant="secondary" 
                                        className="absolute bottom-0 right-0"
                                        onClick={handleProfileImageClick}
                                        disabled={isSaving}
                                    >
                                        <Camera className="w-4 h-4" />
                                    </Button>
                                    <input
                                        ref={fileInputRef}
                                        id="profile-image-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                        disabled={isSaving}
                                        title="Upload profile picture"
                                        aria-label="Upload profile picture"
                                    />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold">{user?.name}</h2>
                                    <p className="text-muted-foreground">{user?.unique_id}</p>
                                    <Badge className="mt-2">{user?.role}</Badge>
                                </div>
                            </div>

                            {user?.role === 'Broker' && (
                                <div className="mb-6 space-y-3">
                                    <Label className="flex items-center gap-2 text-base font-semibold">
                                        <MapPin className="w-4 h-4" />
                                        Area Covered
                                    </Label>

                                    <div className="relative">
                                        <div className="flex gap-2">
                                            <Input
                                                ref={areaInputRef}
                                                value={currentArea}
                                                onChange={(e) => setCurrentArea(e.target.value)}
                                                onFocus={() => {
                                                    if (currentArea.trim().length > 0 && filteredAreaSuggestions.length > 0) {
                                                        setShowAreaSuggestions(true);
                                                    }
                                                }}
                                                placeholder="Type area name (e.g., Nigdi, Katraj)"
                                                disabled={!isEditing || isSaving}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && isEditing && !isSaving) {
                                                        e.preventDefault();
                                                        addBrokerArea(currentArea);
                                                    }
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => addBrokerArea(currentArea)}
                                                className="flex-shrink-0"
                                                aria-label="Add area"
                                                disabled={!isEditing || isSaving}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {isEditing && showAreaSuggestions && filteredAreaSuggestions.length > 0 && (
                                            <div
                                                ref={suggestionsRef}
                                                className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                                            >
                                                {filteredAreaSuggestions.slice(0, 10).map((suggestion) => (
                                                    <button
                                                        key={suggestion}
                                                        type="button"
                                                        className="w-full text-left px-4 py-2 hover:bg-primary/10 transition-colors border-b border-gray-100 last:border-b-0"
                                                        onClick={() => addBrokerArea(suggestion)}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                                                <Plus className="h-3 w-3 text-primary" />
                                                            </div>
                                                            <span className="text-sm font-medium">{suggestion}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {brokerAreas.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {brokerAreas.map((area) => (
                                                <div
                                                    key={area}
                                                    className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                                                >
                                                    <span>{area}</span>
                                                    {isEditing && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setBrokerAreas((prev) => prev.filter((item) => item !== area));
                                                            }}
                                                            className="hover:bg-primary/20 rounded-full p-0.5"
                                                            aria-label={`Remove ${area}`}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input 
                                        name="name"
                                        value={formData.name} 
                                        onChange={handleInputChange}
                                        disabled={!isEditing || isSaving} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input value={user?.email} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input 
                                        name="contact"
                                        value={formData.contact}
                                        onChange={handleInputChange}
                                        disabled={!isEditing || isSaving}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Gender</Label>
                                    <Input 
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleInputChange}
                                        disabled={!isEditing || isSaving}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>PIN Code</Label>
                                    <Input 
                                        name="pincode"
                                        value={formData.pincode}
                                        onChange={handleInputChange}
                                        disabled={!isEditing || isSaving}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Member Since</Label>
                                    <Input value={new Date(user?.registration_date || '').toLocaleDateString()} disabled />
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 mt-6">
                                {isEditing ? (
                                    <>
                                        <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleSaveProfile} disabled={isSaving}>
                                            {isSaving ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </>
                                ) : (
                                    <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                    <Card>
                        <CardContent className="p-6 space-y-6">
                            <div>
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    <Lock className="w-4 h-4" />
                                    Change Password
                                </h3>
                                <div className="space-y-4 max-w-md">
                                    <div className="space-y-2">
                                        <Label htmlFor="current-password">Current Password</Label>
                                        <Input 
                                            id="current-password"
                                            type="password" 
                                            placeholder="Enter your current password"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-password">New Password</Label>
                                        <Input 
                                            id="new-password"
                                            type="password"
                                            placeholder="Enter your new password"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                                        <Input 
                                            id="confirm-password"
                                            type="password"
                                            placeholder="Confirm your new password"
                                        />
                                    </div>
                                    <Button>Update Password</Button>
                                </div>
                            </div>

                            <div className="border-t pt-6">
                                <h3 className="font-semibold mb-4">Forgot Password</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    If you've forgotten your password, you can reset it by receiving a link in your email.
                                </p>
                                <Button 
                                    variant="outline"
                                    onClick={handleForgotPassword}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Sending...' : 'Request Password Reset'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ProfilePage;
