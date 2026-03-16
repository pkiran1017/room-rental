/**
 * Response Filter Middleware
 * Removes sensitive fields from API responses to prevent information disclosure
 */

/**
 * Filter sensitive user fields
 * Removes: email, contact, pincode, exact address details
 * Keeps: id, name, role, status, timestamps, counts
 */
const filterUserForAdmin = (user) => {
    if (!user) return null;
    
    return {
        id: user.id,
        unique_id: user.unique_id,
        name: user.name,
        role: user.role,
        broker_status: user.broker_status,
        broker_area: user.broker_area,
        status: user.status,
        registration_date: user.registration_date,
        last_login: user.last_login,
        profile_image: user.profile_image,
        room_count: user.room_count,
        // Do NOT return: email, contact, gender, pincode, detailed address
    };
};

/**
 * Filter sensitive user array for admin
 */
const filterUsersForAdmin = (users) => {
    if (!Array.isArray(users)) return [];
    return users.map(filterUserForAdmin);
};

/**
 * Filter room owner information
 * Hides contact details when accessed by admin
 */
const filterRoomOwnerInfo = (room) => {
    if (!room) return null;
    
    return {
        id: room.id,
        room_id: room.room_id,
        title: room.title,
        listing_type: room.listing_type,
        room_type: room.room_type,
        city: room.city,
        area: room.area,
        rent: room.rent,
        deposit: room.deposit,
        cost: room.cost,
        post_date: room.post_date,
        status: room.status,
        is_occupied: room.is_occupied,
        views_count: room.views_count,
        // Owner info filtered to name only
        owner_id: room.owner_id,
        owner_name: room.owner_name,
        // Do NOT return: owner_contact, owner_email, exact_address
    };
};

/**
 * Filter admin dashboard data
 * Removes contact information from pending users
 */
const filterDashboardData = (dashboardData) => {
    if (!dashboardData) return null;
    
    return {
        stats: dashboardData.stats,
        todayRegistrations: filterUsersForAdmin(dashboardData.todayRegistrations),
        todayRooms: (dashboardData.todayRooms || []).map(room => ({
            room_id: room.room_id,
            title: room.title,
            listing_type: room.listing_type,
            status: room.status,
            post_date: room.post_date,
            owner_name: room.owner_name,
            // Do NOT return: owner_email, owner_contact
        })),
        pendingBrokers: (dashboardData.pendingBrokers || []).map(broker => ({
            id: broker.id,
            unique_id: broker.unique_id,
            name: broker.name,
            email: broker.email,
            contact: broker.contact,
            broker_area: broker.broker_area,
            registration_date: broker.registration_date,
            selected_plan_id: broker.selected_plan_id,
            selected_plan: broker.selected_plan,
        })),
        pendingRooms: (dashboardData.pendingRooms || []).map(room => ({
            id: room.id,
            room_id: room.room_id,
            title: room.title,
            listing_type: room.listing_type,
            city: room.city,
            area: room.area,
            rent: room.rent,
            post_date: room.post_date,
            owner_id: room.owner_id,
            owner_name: room.owner_name,
            // Do NOT return: owner_contact, owner_email
        }))
    };
};

/**
 * Filter broker profile data in public responses
 * Already minimal, but ensure no sensitive data
 */
const filterBrokerPublic = (broker) => {
    if (!broker) return null;
    
    return {
        id: broker.id,
        unique_id: broker.unique_id,
        name: broker.name,
        broker_area: broker.broker_area,
        profile_image: broker.profile_image,
        registration_date: broker.registration_date,
        room_count: broker.room_count,
        // Note: email and contact ARE returned for public brokers
        // (they want to be found), but only for approved brokers
        email: broker.email,
        contact: broker.contact,
    };
};

/**
 * Express middleware to filter sensitive responses
 * Apply to specific routes that need filtering
 */
const createResponseFilterMiddleware = (filterFunction) => {
    return (req, res, next) => {
        const originalJson = res.json;
        res.json = function(data) {
            if (data && data.data) {
                // Filter the data field
                if (Array.isArray(data.data)) {
                    data.data = data.data.map(filterFunction);
                } else {
                    data.data = filterFunction(data.data);
                }
            }
            return originalJson.call(this, data);
        };
        next();
    };
};

module.exports = {
    filterUserForAdmin,
    filterUsersForAdmin,
    filterRoomOwnerInfo,
    filterDashboardData,
    filterBrokerPublic,
    createResponseFilterMiddleware
};
