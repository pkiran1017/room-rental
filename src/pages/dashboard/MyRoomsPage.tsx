import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Building2,
    Plus,
    Edit,
    Trash2,
    Eye,
    MapPin,
    CheckCircle2,
    AlertTriangle
} from 'lucide-react';
import type { Room } from '@/types';
import { getMyRooms, deleteRoom, markRoomOccupied } from '@/services/roomService';
import { parseImages } from '@/lib/utils';
import { toast } from 'sonner';

const MyRoomsPage: React.FC = () => {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [activeTab, setActiveTab] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [imageIndexes, setImageIndexes] = useState<Record<string, number>>({});
    const [occupancyDialog, setOccupancyDialog] = useState<{ roomId: string; isOccupied: boolean } | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ roomId: string; roomTitle: string } | null>(null);
    const [isUpdatingOccupancy, setIsUpdatingOccupancy] = useState(false);

    const roomImages = useMemo(() => {
        const map: Record<string, string[]> = {};
        rooms.forEach((room) => {
            map[room.room_id] = parseImages(room.images);
        });
        return map;
    }, [rooms]);

    const fetchRooms = useCallback(async () => {
        try {
            setIsLoading(true);
            const status = activeTab === 'all' ? undefined : activeTab;
            const data = await getMyRooms(status);
            setRooms(data.data);
        } catch {
            toast.error('Failed to load your rooms');
        } finally {
            setIsLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        void fetchRooms();
    }, [fetchRooms]);

    // Use a single interval to rotate all room images, avoiding one timer per card.
    useEffect(() => {
        if (!rooms.length) return;

        const interval = setInterval(() => {
            setImageIndexes(prev => {
                const next = { ...prev };

                rooms.forEach((room) => {
                    const images = roomImages[room.room_id] ?? [];
                    if (images.length > 1) {
                        next[room.room_id] = ((prev[room.room_id] || 0) + 1) % images.length;
                    }
                });

                return next;
            });
        }, 2500);

        return () => clearInterval(interval);
    }, [roomImages, rooms]);

    const handleDelete = async (roomId: string) => {
        try {
            await deleteRoom(roomId);
            toast.success('Room deleted successfully');
            setDeleteDialog(null);
            void fetchRooms();
        } catch (error) {
            toast.error('Failed to delete room');
        }
    };

    const handleMarkOccupied = async (roomId: string, isOccupied: boolean) => {
        try {
            setIsUpdatingOccupancy(true);
            await markRoomOccupied(roomId, isOccupied);
            toast.success(isOccupied ? 'Room marked as occupied' : 'Room marked as available');
            void fetchRooms();
            setOccupancyDialog(null);
        } catch {
            toast.error(isOccupied ? 'Failed to mark room as occupied' : 'Failed to update room occupancy');
        } finally {
            setIsUpdatingOccupancy(false);
        }
    };

    const filteredRooms = useMemo(() => (
        activeTab === 'all'
            ? rooms
            : rooms.filter((room) => room.status.toLowerCase() === activeTab)
    ), [activeTab, rooms]);

    return (
        <div className="space-y-5 md:space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">My Rooms</h1>
                    <p className="text-muted-foreground">Manage your room listings</p>
                </div>
                <Button onClick={() => navigate('/dashboard/rooms/post')} className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Post New Room
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full overflow-x-auto justify-start">
                    <TabsTrigger value="all">All ({rooms.length})</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="hold">Hold</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                    {isLoading ? (
                        <div className="text-center py-12">Loading...</div>
                    ) : filteredRooms.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                                <h3 className="text-lg font-semibold mb-2">No rooms found</h3>
                                <p className="text-muted-foreground mb-4">
                                    {activeTab === 'all' 
                                        ? "You haven't posted any rooms yet"
                                        : `No ${activeTab} rooms found`
                                    }
                                </p>
                                <Button onClick={() => navigate('/dashboard/rooms/post')}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Post Your First Room
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                            {filteredRooms.map((room) => {
                                const images = roomImages[room.room_id] ?? [];
                                const currentImageIndex = imageIndexes[room.room_id] || 0;
                                const currentImage = images[currentImageIndex];
                                const isOccupied = Boolean((room as Room & { is_occupied: boolean | number }).is_occupied);
                                
                                return (
                                <Card key={room.room_id}>
                                    <CardContent className="p-0">
                                        <div className="aspect-video bg-muted relative overflow-hidden">
                                            {currentImage ? (
                                                <img 
                                                    src={currentImage} 
                                                    alt={room.title}
                                                    loading="lazy"
                                                    decoding="async"
                                                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Building2 className="w-12 h-12 text-muted-foreground/50" />
                                                </div>
                                            )}
                                            <Badge className="absolute top-3 left-3" 
                                                   variant={room.status === 'Approved' ? 'default' : 'secondary'}>
                                                {room.status}
                                            </Badge>
                                            {images.length > 1 && (
                                                <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-xs">
                                                    {currentImageIndex + 1}/{images.length}
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-semibold mb-1 line-clamp-1">{room.title}</h3>
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                                                <MapPin className="w-4 h-4" />
                                                {room.area}, {room.city}
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 mb-4">
                                                <div className="text-lg font-bold text-primary">
                                                    ₹{room.rent?.toLocaleString() || room.cost?.toLocaleString()}
                                                </div>
                                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <Eye className="w-4 h-4" />
                                                    {room.views_count} views
                                                </div>
                                            </div>
                                            {isOccupied && (
                                                <div className="mb-3 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md px-2 py-1 inline-flex items-center gap-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Occupied
                                                </div>
                                            )}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <Button variant="outline" size="sm" className="w-full"
                                                        onClick={() => navigate(`/room/${room.room_id}`)}>
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    View
                                                </Button>
                                                {!isOccupied && room.status !== 'Expired' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full"
                                                        onClick={() => setOccupancyDialog({ roomId: room.room_id, isOccupied: true })}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                                        Mark Occupied
                                                    </Button>
                                                )}
                                                {isOccupied && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full"
                                                        onClick={() => setOccupancyDialog({ roomId: room.room_id, isOccupied: false })}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                                        Unmark Occupied
                                                    </Button>
                                                )}
                                                {room.status === 'Hold' && (
                                                    <Button variant="outline" size="sm" className="w-full"
                                                            onClick={() => navigate(`/dashboard/rooms/edit/${room.room_id}`)}>
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Edit
                                                    </Button>
                                                )}
                                                <Button variant="destructive" size="sm" className="w-full sm:col-span-2"
                                                        onClick={() => setDeleteDialog({ roomId: room.room_id, roomTitle: room.title })}>
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )})}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-2">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <AlertDialogTitle>Delete Room?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <span className="font-medium">"{deleteDialog?.roomTitle}"</span>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteDialog && void handleDelete(deleteDialog.roomId)}
                        >
                            Yes, Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!occupancyDialog} onOpenChange={(open) => !open && setOccupancyDialog(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-2">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <AlertDialogTitle>
                            {occupancyDialog?.isOccupied ? 'Mark Room as Occupied?' : 'Unmark Occupied?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {occupancyDialog?.isOccupied
                                ? 'This room will be marked occupied and status will change to Expired. You can unmark later if needed.'
                                : 'This room will be marked as available again and occupancy status will be removed.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isUpdatingOccupancy}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isUpdatingOccupancy}
                            onClick={(e) => {
                                e.preventDefault();
                                if (!occupancyDialog) return;
                                void handleMarkOccupied(occupancyDialog.roomId, occupancyDialog.isOccupied);
                            }}
                        >
                            {isUpdatingOccupancy
                                ? 'Updating...'
                                : (occupancyDialog?.isOccupied ? 'Yes, Mark Occupied' : 'Yes, Unmark')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default MyRoomsPage;
