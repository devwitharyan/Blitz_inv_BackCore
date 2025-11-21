const bookingModel = require('../models/booking.model');
const providerModel = require('../models/provider.model');
const addressModel = require('../models/address.model');
const payoutModel = require('../models/payout.model');   
const paymentModel = require('../models/payment.model'); 
const mediaModel = require('../models/media.model');
const { success, error } = require('../utils/response');
const admin = require('../config/firebase'); 

// 1. Create Booking
exports.createBooking = async (req, res) => {
  try {
    const data = { ...req.body, customerId: req.user.id };

    if (data.providerId) {
        const hasHistory = await bookingModel.hasPreviousRelation(req.user.id, data.providerId);
        if (!hasHistory) return error(res, "You can only directly book providers you have hired before.", 403);
        const targetProvider = await providerModel.findById(data.providerId);
        if (!targetProvider) return error(res, "Provider does not exist.", 404);
        if (targetProvider.VerificationStatus !== 'Verified') return error(res, "Provider unavailable.", 400);
    }

    const address = await addressModel.findById(data.addressId);
    if (!address) return error(res, 'Invalid address', 400);
    if (address.UserId.toLowerCase() !== req.user.id.toLowerCase()) return error(res, 'Unauthorized address.', 403);

    const booking = await bookingModel.create(data);
    
    // SOCKET: Broadcast New Job
    const io = req.app.get('io'); 
    if (io) {
      io.to('providers').emit('new_job_available', { 
        message: "New job posted nearby!", 
        bookingId: booking.Id 
      });
    }

    // FCM Push Notification
    if (!data.providerId && admin) {
        try {
            const nearbyProviders = await providerModel.listAll(address.Latitude, address.Longitude, 'Verified');
            const tokens = nearbyProviders.filter(p => p.Distance <= 20 && p.FcmToken).map(p => p.FcmToken);
            if (tokens.length > 0) {
                await admin.messaging().sendEachForMulticast({
                    tokens: tokens,
                    notification: { title: 'New Job Alert!', body: `New service request ${nearbyProviders[0].Distance.toFixed(1)}km away.` },
                    data: { type: 'new_job', bookingId: booking.Id }
                });
            }
        } catch (fcmError) { console.error("FCM Error:", fcmError); }
    }

    return success(res, booking, 'Booking created', 201);
  } catch (err) { return error(res, err.message); }
};

// 2. List Available Jobs
exports.listAvailableJobs = async (req, res) => {
  try {
    const provider = await providerModel.findByUserId(req.user.id);
    if (!provider) return error(res, 'Profile not found', 404);
    const addressList = await addressModel.listByUserId(req.user.id);
    if (!addressList[0] || !addressList[0].Latitude) return error(res, 'Please set work location.', 400);
    const jobs = await bookingModel.findNearbyPending(addressList[0].Latitude, addressList[0].Longitude, 5);
    return success(res, jobs);
  } catch (err) { return error(res, err.message); }
};

// 3. Accept Job
exports.acceptJob = async (req, res) => {
  try {
    const { id } = req.params;
    const provider = await providerModel.findByUserId(req.user.id);
    if (!provider) return error(res, 'Profile not found', 404);

    const JOB_COST = 10; 
    
    try {
        await providerModel.deductCredits(provider.Id, JOB_COST, id);
    } catch (creditErr) {
        return error(res, 'Insufficient credits. Top-Up wallet to accept.', 402);
    }

    const result = await bookingModel.claim(id, provider.Id);
    
    // RACE CONDITION CHECK: 
    // If result.ProviderId is NOT current provider, someone else took it.
    if (!result || result.ProviderId !== provider.Id) {
        await providerModel.topUpCredits(provider.Id, JOB_COST, id); // Refund
        return error(res, 'Too late! This job was just taken by another provider.', 409);
    }

    // SUCCESS: Broadcast 'job_taken' so other apps remove it
    const io = req.app.get('io');
    if (io) {
        io.to('providers').emit('job_taken', { 
            bookingId: id 
        });
        console.log(`🔒 Job ${id} taken. Broadcast sent.`);
    }

    return success(res, result, `Job accepted! ${JOB_COST} Credits deducted.`);
  } catch (err) {
    return error(res, err.message);
  }
};

// ... [listMyBookings, getBookingById remain the same] ...
exports.listMyBookings = async (req, res) => {
  try {
    let entityId = req.user.id;
    if (req.user.role === 'provider') {
        const provider = await providerModel.findByUserId(req.user.id);
        if (!provider) return error(res, 'Provider profile not found', 404);
        entityId = provider.Id;
    }
    const bookings = await bookingModel.listForUser(entityId, req.user.role);
    return success(res, bookings);
  } catch (err) { return error(res, err.message); }
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await bookingModel.findById(req.params.id);
    return booking ? success(res, booking) : error(res, 'Not found', 404);
  } catch (err) { return error(res, err.message); }
};

// 6. Update Status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await bookingModel.updateStatus(id, status);

    // Handle Cancellation
    if (status === 'cancelled') {
        // SOCKET: Notify providers to remove from list
        const io = req.app.get('io');
        if (io) {
            io.to('providers').emit('booking_cancelled', { 
                bookingId: id,
                message: "Booking cancelled by customer."
            });
        }

        const booking = await bookingModel.findById(id);
        if (booking.ProviderId && req.body.cancelledBy === 'customer') {
            await providerModel.topUpCredits(booking.ProviderId, 10, `Refund: Booking ${id}`);
        }
    }

    if (status === 'completed') {
        const alreadyPaid = await paymentModel.isPaid(id);
        await payoutModel.addTransaction({ providerId: result.ProviderId, bookingId: id, amount: result.Price, type: 'earnings' });
        if (!alreadyPaid) {
            await paymentModel.create({ bookingId: id, customerId: result.CustomerId, providerId: result.ProviderId, amount: result.Price, paymentProvider: 'Cash/Offline' });
        }
    }

    return success(res, result, 'Status updated');
  } catch (err) { return error(res, err.message); }
};

exports.assignProvider = async (req, res) => {
  try {
    let inputId = req.body.providerId; 
    let providerProfileId = inputId;
    let provider = await providerModel.findByUserId(inputId);
    if (provider) providerProfileId = provider.Id;
    else {
        const existingProvider = await providerModel.findById(inputId);
        if (!existingProvider) return error(res, 'Provider ID invalid', 404);
    }
    const result = await bookingModel.assignProvider(req.params.id, providerProfileId);
    return success(res, result, 'Assigned');
  } catch (err) { return error(res, err.message); }
};

exports.getBookingServices = async (req, res) => {
  try {
    const services = await bookingModel.getServicesByBookingId(req.params.id);
    if (!services || services.length === 0) return error(res, 'No services found', 404);
    return success(res, services);
  } catch (err) { return error(res, err.message); }
};

exports.getRecentClients = async (req, res) => {
  try {
    const provider = await providerModel.findByUserId(req.user.id);
    if (!provider) return error(res, 'Provider profile not found', 404);
    const clients = await bookingModel.getRecentClients(provider.Id);
    const clientsWithImages = await Promise.all(clients.map(async (client) => {
        const media = await mediaModel.listByEntity('User', client.Id);
        const profilePic = media.find(m => m.MediaType === 'profile');
        return { ...client, profileImage: profilePic ? profilePic.Id : null };
    }));
    return success(res, clientsWithImages);
  } catch (err) { return error(res, err.message); }
};