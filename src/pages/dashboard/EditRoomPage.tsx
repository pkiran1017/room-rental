import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight, Upload, Wifi, ParkingSquare, Dumbbell, Zap, Droplet, Shield, Square, Sofa, Camera, X } from 'lucide-react';
import { getRoomForEditing, updateRoom, uploadRoomImages } from '@/services/roomService';
import { toast } from 'sonner';
import LocationPickerMap from '@/components/maps/LocationPickerMap';

const steps = [
    { id: 1, title: 'Details' },
    { id: 2, title: 'Location' },
    { id: 3, title: 'Furnishing & Facilities' },
    { id: 4, title: 'Title & Note' },
    { id: 5, title: 'Images' },
];

type LocationDetails = {
    address?: string;
    area?: string;
    city?: string;
    pincode?: string;
    district?: string;
};

type FormDataType = {
    listing_type: 'For Rent' | 'Required Roommate' | 'For Sell';
    room_type: '1RK' | '1BHK' | '2BHK' | '3BHK' | '4BHK' | 'PG' | 'Dormitory' | 'Studio' | 'Other';
    house_type: 'Flat' | 'Apartment' | 'House';
    title: string;
    address: string;
    area: string;
    city: string;
    pincode: string;
    latitude: number;
    longitude: number;
    rent: string;
    deposit: string;
    cost: string;
    size_sqft: string;
    availability_from: string;
    preferred_gender: 'Male' | 'Female' | 'Any';
    furnishing_type: string;
    facilities: string[];
    note: string;
    images: string[];
    contact: string;
    contact_visibility: 'Private' | 'Public';
};

const facilitiesOptions = [
    { id: 'wifi', label: 'WiFi', icon: Wifi },
    { id: 'parking', label: 'Parking', icon: ParkingSquare },
    { id: 'gym', label: 'Gym', icon: Dumbbell },
    { id: 'power_backup', label: 'Power Backup', icon: Zap },
    { id: 'water_available', label: 'Water Available', icon: Droplet },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'balcony', label: 'Balcony', icon: Square },
    { id: 'kitchen', label: 'Kitchen', icon: Sofa },
    { id: 'ac', label: 'AC/Cooler', icon: Zap },
    { id: 'furniture', label: 'Furniture', icon: Sofa },
    { id: 'cctv', label: 'CCTV', icon: Camera },
];

const furnishingTypes = ['Fully Furnished', 'Semi-Furnished', 'Unfurnished'];

const toDateInputValue = (value?: string): string => {
    if (!value) {
        return new Date().toISOString().split('T')[0];
    }

    if (value.includes('T')) {
        return value.split('T')[0];
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
    }

    const parsedDate = new Date(value);
    if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString().split('T')[0];
    }

    return new Date().toISOString().split('T')[0];
};

const toStringArray = (value: unknown): string[] => {
    if (!value) return [];

    if (Array.isArray(value)) {
        return value.map((item) => String(item ?? '').trim()).filter(Boolean);
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return [];

        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return parsed.map((item) => String(item ?? '').trim()).filter(Boolean);
            }
            if (parsed && typeof parsed === 'object') {
                return Object.values(parsed as Record<string, unknown>)
                    .map((item) => String(item ?? '').trim())
                    .filter(Boolean);
            }
        } catch {
            return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
        }
    }

    if (typeof value === 'object') {
        return Object.values(value as Record<string, unknown>)
            .map((item) => String(item ?? '').trim())
            .filter(Boolean);
    }

    return [];
};

const EditRoomPage: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const imageInputRef = useRef<HTMLInputElement | null>(null);
    
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isImageUploading, setIsImageUploading] = useState(false);
    const [locationFetched, setLocationFetched] = useState(false);
    
    const [formData, setFormData] = useState<FormDataType>({
        listing_type: 'For Rent',
        room_type: '1RK',
        house_type: 'Flat',
        title: '',
        address: '',
        area: '',
        city: 'Pune',
        pincode: '',
        latitude: 18.5204,
        longitude: 73.8567,
        rent: '',
        deposit: '',
        cost: '',
        size_sqft: '',
        availability_from: toDateInputValue(),
        preferred_gender: 'Any',
        furnishing_type: '',
        facilities: [],
        note: '',
        images: [],
        contact: user?.contact || '',
        contact_visibility: 'Private',
    });

    // Load existing room data
    useEffect(() => {
        const loadRoom = async () => {
            if (!roomId) return;
            try {
                const data = await getRoomForEditing(roomId);

                // Check if user is owner (additional check - backend also validates)
                if (data.user_id !== user?.id) {
                    toast.error('You are not authorized to edit this room');
                    navigate('/dashboard/rooms');
                    return;
                }

                // Pre-fill form with room data
                setFormData({
                    listing_type: data.listing_type || 'For Rent',
                    room_type: data.room_type || '1RK',
                    house_type: data.house_type || 'Flat',
                    title: data.title || '',
                    address: data.address || '',
                    area: data.area || '',
                    city: data.city || 'Pune',
                    pincode: data.pincode || '',
                    latitude: data.latitude || 18.5204,
                    longitude: data.longitude || 73.8567,
                    rent: data.rent?.toString() || '',
                    deposit: data.deposit?.toString() || '',
                    cost: data.cost?.toString() || '',
                    size_sqft: data.size_sqft?.toString() || '',
                    availability_from: toDateInputValue(data.availability_from),
                    preferred_gender: data.preferred_gender || 'Any',
                    furnishing_type: data.furnishing_type || '',
                    facilities: toStringArray(data.facilities),
                    note: data.note || '',
                    images: toStringArray(data.images),
                    contact: data.contact || user?.contact || '',
                    contact_visibility: data.contact_visibility || 'Private',
                });
            } catch (error) {
                toast.error('Failed to load room data. Make sure the room status is "Hold" and you own this room.');
                navigate('/dashboard/rooms');
            } finally {
                setIsLoading(false);
            }
        };

        loadRoom();
    }, [roomId, user?.id, navigate]);


    const handleCoordinatesChange = useCallback((latitude: number, longitude: number) => {
        setFormData((previous) => ({
            ...previous,
            latitude: Number(latitude.toFixed(6)),
            longitude: Number(longitude.toFixed(6)),
        }));
    }, []);

    const handleLocationDetailsChange = useCallback((details: LocationDetails) => {
        setLocationFetched(true);
        setFormData((previous) => {
            const detectedCity = details.city || previous.city;
            return {
                ...previous,
                city: detectedCity,
                area: details.area || previous.area,
                address: details.address || previous.address,
                pincode: details.pincode || previous.pincode,
            };
        });
    }, []);

    const handleImageUpload = async (files: FileList) => {
        if (!files || files.length === 0) return;

        try {
            setIsImageUploading(true);
            const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
            
            if (fileArray.length === 0) {
                toast.error('Please select valid image files');
                return;
            }

            if (formData.images.length + fileArray.length > 5) {
                toast.error('Maximum 5 images allowed');
                return;
            }

            const uploadedUrls = await uploadRoomImages(fileArray);
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...uploadedUrls]
            }));
            toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);
        } catch (error) {
            toast.error('Failed to upload images');
        } finally {
            setIsImageUploading(false);
            if (imageInputRef.current) imageInputRef.current.value = '';
        }
    };

    const handleSubmit = async () => {
        if (!roomId) return;

        // Validate required fields
        if (!formData.title.trim()) {
            toast.error('Title is required');
            return;
        }
        if (!formData.address.trim()) {
            toast.error('Address is required');
            return;
        }
        if (!formData.area.trim()) {
            toast.error('Area is required');
            return;
        }
        if (formData.listing_type === 'For Sell') {
            if (!formData.cost.trim()) {
                toast.error('Cost is required for selling');
                return;
            }
            if (!formData.size_sqft.trim()) {
                toast.error('Size (sqft) is required for selling');
                return;
            }
        } else if (!formData.rent.trim()) {
            toast.error('Rent is required');
            return;
        }
        if (formData.images.length === 0) {
            toast.error('At least one image is required');
            return;
        }

        try {
            setIsSubmitting(true);
            await updateRoom(roomId, {
                listing_type: formData.listing_type,
                room_type: formData.room_type,
                house_type: formData.house_type,
                title: formData.title,
                address: formData.address,
                area: formData.area,
                city: formData.city,
                pincode: formData.pincode,
                latitude: formData.latitude,
                longitude: formData.longitude,
                rent: formData.rent ? parseFloat(formData.rent) : 0,
                deposit: formData.deposit ? parseFloat(formData.deposit) : 0,
                cost: formData.cost ? parseFloat(formData.cost) : 0,
                size_sqft: formData.size_sqft ? parseInt(formData.size_sqft) : 0,
                availability_from: formData.availability_from,
                preferred_gender: formData.preferred_gender,
                furnishing_type: formData.furnishing_type,
                facilities: formData.facilities,
                note: formData.note,
                images: formData.images,
                contact: formData.contact,
                contact_visibility: formData.contact_visibility,
            } as any);
            toast.success('Room updated successfully! It has been sent for re-approval.');
            navigate('/dashboard/rooms');
        } catch (error) {
            toast.error('Failed to update room');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNext = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 2: // Location
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-foreground">Edit Location</h2>
                            <p className="text-muted-foreground">Update room location details</p>
                        </div>
                        <LocationPickerMap
                            onCoordinatesChange={handleCoordinatesChange}
                            onLocationDetailsChange={handleLocationDetailsChange}
                            latitude={formData.latitude}
                            longitude={formData.longitude}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-semibold">
                                    City / District
                                    {locationFetched && <span className="text-green-600 ml-1">✓ Detected</span>}
                                </Label>
                                <Input 
                                    placeholder="e.g., Pune"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-semibold">
                                    Area <span className="text-red-500">*</span>
                                    {locationFetched && formData.area && <span className="text-green-600 ml-1">✓ Detected</span>}
                                </Label>
                                <Input 
                                    placeholder="e.g., Koregaon Park"
                                    value={formData.area}
                                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label className="font-semibold">
                                    Full Address <span className="text-red-500">*</span>
                                    {locationFetched && formData.address && <span className="text-green-600 ml-1">✓ Detected</span>}
                                </Label>
                                <textarea
                                    className="w-full p-3 border rounded-md border-input focus:border-ring focus:ring-2 focus:ring-ring/20 bg-background text-foreground"
                                    placeholder="Enter full address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-semibold">
                                    Pincode
                                    {locationFetched && formData.pincode && <span className="text-green-600 ml-1">✓ Detected</span>}
                                </Label>
                                <Input 
                                    placeholder="e.g., 411001"
                                    value={formData.pincode}
                                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 1: // Details
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-foreground">Room Details <span className="text-red-500 text-lg">*</span></h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="font-semibold">Listing Type</Label>
                                <select
                                    title="Listing Type"
                                    className="w-full h-10 px-3 border rounded-md border-input bg-background"
                                    value={formData.listing_type}
                                    onChange={(e) => setFormData({ ...formData, listing_type: e.target.value as FormDataType['listing_type'] })}
                                >
                                    <option value="For Rent">For Rent</option>
                                    <option value="Required Roommate">Required Roommate</option>
                                    <option value="For Sell">For Sell</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-semibold">Room Type</Label>
                                <select
                                    title="Room Type"
                                    className="w-full h-10 px-3 border rounded-md border-input bg-background"
                                    value={formData.room_type}
                                    onChange={(e) => setFormData({ ...formData, room_type: e.target.value as FormDataType['room_type'] })}
                                >
                                    {['1RK', '1BHK', '2BHK', '3BHK', '4BHK', 'PG', 'Dormitory', 'Studio', 'Other'].map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-semibold">House Type</Label>
                                <select
                                    title="House Type"
                                    className="w-full h-10 px-3 border rounded-md border-input bg-background"
                                    value={formData.house_type}
                                    onChange={(e) => setFormData({ ...formData, house_type: e.target.value as FormDataType['house_type'] })}
                                >
                                    <option value="Flat">Flat</option>
                                    <option value="Apartment">Apartment</option>
                                    <option value="House">House</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {formData.listing_type === 'For Sell' ? (
                                <>
                                    <div className="space-y-2">
                                        <Label className="font-semibold">Cost <span className="text-red-500">*</span></Label>
                                        <Input 
                                            type="number"
                                            placeholder="Enter cost amount"
                                            value={formData.cost}
                                            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-semibold">Size (sqft) <span className="text-red-500">*</span></Label>
                                        <Input 
                                            type="number"
                                            placeholder="Enter size in sqft"
                                            value={formData.size_sqft}
                                            onChange={(e) => setFormData({ ...formData, size_sqft: e.target.value })}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <Label className="font-semibold">Rent (per month) <span className="text-red-500">*</span></Label>
                                        <Input 
                                            type="number"
                                            placeholder="Enter rent amount"
                                            value={formData.rent}
                                            onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-semibold">Deposit</Label>
                                        <Input 
                                            type="number"
                                            placeholder="Enter deposit amount"
                                            value={formData.deposit}
                                            onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}
                            <div className="space-y-2">
                                <Label className="font-semibold">Available From <span className="text-red-500">*</span></Label>
                                <Input 
                                    type="date"
                                    value={formData.availability_from}
                                    onChange={(e) => setFormData({ ...formData, availability_from: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-semibold">Preferred Gender</Label>
                                <select
                                    title="Preferred Gender"
                                    className="w-full h-10 px-3 border rounded-md border-input bg-background"
                                    value={formData.preferred_gender}
                                    onChange={(e) => setFormData({ ...formData, preferred_gender: e.target.value as FormDataType['preferred_gender'] })}
                                >
                                    <option value="Any">Any</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-semibold">Contact</Label>
                                <Input 
                                    placeholder="Enter phone number"
                                    value={formData.contact}
                                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-semibold">Contact Visibility</Label>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Checkbox 
                                        id="public"
                                        checked={formData.contact_visibility === 'Public'}
                                        onCheckedChange={() => setFormData({ ...formData, contact_visibility: 'Public' })}
                                    />
                                    <Label htmlFor="public" className="cursor-pointer">Public</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox 
                                        id="private"
                                        checked={formData.contact_visibility === 'Private'}
                                        onCheckedChange={() => setFormData({ ...formData, contact_visibility: 'Private' })}
                                    />
                                    <Label htmlFor="private" className="cursor-pointer">Private</Label>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 3: // Furnishing & Facilities
                const selectedFacilities = Array.isArray(formData.facilities) ? formData.facilities : [];
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-foreground">Furnishing & Facilities</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="font-semibold">Furnishing Type</Label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {furnishingTypes.map((type) => (
                                        <div
                                            key={type}
                                            onClick={() => setFormData({ ...formData, furnishing_type: type })}
                                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                                formData.furnishing_type === type
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:border-primary/50'
                                            }`}
                                        >
                                            <p className="font-medium text-sm">{type}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="font-semibold">Facilities</Label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {facilitiesOptions.map((facility) => (
                                        <div key={facility.id} className="flex items-center gap-2">
                                            <Checkbox 
                                                id={facility.id}
                                                checked={selectedFacilities.includes(facility.label)}
                                                onCheckedChange={() => {
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        facilities: selectedFacilities.includes(facility.label)
                                                            ? selectedFacilities.filter((f) => f !== facility.label)
                                                            : [...selectedFacilities, facility.label]
                                                    }));
                                                }}
                                            />
                                            <Label htmlFor={facility.id} className="text-sm cursor-pointer">{facility.label}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 4: // Title & Note
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-foreground">Title & Description</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Title <span className="text-red-500">*</span></Label>
                                <Input 
                                    className="text-base"
                                    placeholder="Enter room title"
                                    value={formData.title}
                                    onChange={(e) => {
                                        setFormData({ ...formData, title: e.target.value });
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Note / Description</Label>
                                <textarea
                                    className="w-full min-h-[150px] p-3 border rounded-md border-input focus:border-ring focus:ring-2 focus:ring-ring/20 bg-background text-foreground"
                                    placeholder="Add any additional details about the room..."
                                    value={formData.note}
                                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 5: // Images
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-foreground">Upload Images</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                                 onClick={() => imageInputRef.current?.click()}>
                                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-sm font-medium mb-2">Click to upload images</p>
                                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                                <input 
                                    ref={imageInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    title="Select images to upload"
                                    onChange={(e) => handleImageUpload(e.target.files as FileList)}
                                    disabled={isImageUploading}
                                />
                            </div>
                            <p className="text-sm mt-4 text-muted-foreground font-semibold">Uploaded: {formData.images.length}/5</p>
                            {formData.images.length > 0 && (
                                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {formData.images.map((imageUrl: string, index: number) => (
                                        <div key={`${imageUrl}-${index}`} className="relative group rounded-lg overflow-hidden border-2 border-border">
                                            <img
                                                src={imageUrl}
                                                alt={`Room ${index + 1}`}
                                                className="w-full h-24 object-cover"
                                            />
                                            <button
                                                type="button"
                                                title="Remove image"
                                                onClick={() => {
                                                    setFormData((previous) => ({
                                                        ...previous,
                                                        images: previous.images.filter((_: string, i: number) => i !== index)
                                                    }));
                                                }}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="animate-pulse space-y-4">
                            <div className="h-8 bg-muted rounded w-1/2" />
                            <div className="h-4 bg-muted rounded w-full" />
                            <div className="h-4 bg-muted rounded w-3/4" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-6 pb-8">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" onClick={() => navigate('/dashboard/rooms')}>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <h1 className="text-2xl font-bold text-foreground">Edit Room</h1>
            </div>

            <div className="mb-8 space-y-2">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-muted-foreground">Step {currentStep} of {steps.length}</span>
                </div>
                <progress
                    className="w-full h-2 rounded-full overflow-hidden [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary"
                    value={currentStep}
                    max={steps.length}
                    aria-label={`Step ${currentStep} of ${steps.length}`}
                />
            </div>

            <Card className="shadow-sm">
                <CardContent className="p-6">
                    {renderStep()}
                </CardContent>
            </Card>

            <div className="flex gap-3 mt-8">
                <Button 
                    variant="outline" 
                    onClick={handleBack}
                    disabled={currentStep === 1}
                >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                {currentStep < steps.length ? (
                    <Button onClick={handleNext} className="ml-auto">
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                ) : (
                    <Button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting} 
                        className="ml-auto min-w-32"
                    >
                        {isSubmitting ? 'Updating...' : 'Update Room'}
                    </Button>
                )}
            </div>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                    ℹ️ Your updated room will be sent for re-approval. It will appear as "Pending" in your rooms list until admin approval.
                </p>
            </div>
        </div>
    );
};

export default EditRoomPage;
