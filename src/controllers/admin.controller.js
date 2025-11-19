// src/controllers/admin.controller.js
const userModel = require('../models/user.model');
const bookingModel = require('../models/booking.model');
const paymentModel = require('../models/payment.model');
const { success, error } = require('../utils/response');

exports.getDashboardStats = async (req, res) => {
    try {
        // Fetch all required data concurrently
        const [
            totalCustomers,
            activeProviders,
            bookingStats,
            totalRevenue
        ] = await Promise.all([
            userModel.countByRole('customer'),
            userModel.countByRole('provider', true),
            bookingModel.getStats(),
            paymentModel.getRevenueStats()
        ]);

        const stats = {
            totalBookings: bookingStats.TotalBookings || 0,
            completedBookings: bookingStats.CompletedBookings || 0,
            totalRevenue: totalRevenue || 0,
            totalCustomers: totalCustomers,
            activeProviders: activeProviders,
        };

        return success(res, stats);
    } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        return error(res, err.message);
    }
};