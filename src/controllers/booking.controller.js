const bookingModel = require('../models/booking.model');
const providerModel = require('../models/provider.model');
const addressModel = require('../models/address.model');
const payoutModel = require('../models/payout.model');   
const paymentModel = require('../models/payment.model'); 
const mediaModel = require('../models/media.model'); // NEW
const { success, error } = require('../utils/response');

// 1. Create Booking (Updated with Socket.io & Security Check)
exports.createBooking = async (req, res) => {
  try {
    const data = { ...req.body, customerId: req.user.id };

    // A. Validate Provider (if direct booking)
    if (data.providerId) {
        const hasHistory = await bookingModel.hasPreviousRelation(req.user.id, data.providerId);
        if (!hasHistory) {
            return error(res, "You can only directly book providers you have hired before.", 403);
        }
        const targetProvider = await providerModel.findById(data.providerId);
        if (!targetProvider) return error(res, "Provider does not exist.", 404);
        if (targetProvider.VerificationStatus !== 'Verified') {
            return error(res, "This provider is currently unavailable for direct booking.", 400);
        }
    }

    // B. Validate Address & Check Ownership (Security Fix)
    const address = await addressModel.findById(data.addressId);
    if (!address) return error(res, 'Invalid address', 400);
    
    if (address.UserId.toLowerCase() !== req.user.id.toLowerCase()) {
        return error(res, 'Unauthorized: You cannot use this address.', 403);
    }

    // C. Create Booking in DB
    const booking = await bookingModel.create(data);
    
    // --- SOCKET.IO TRIGGER ---
    const io = req.app.get('io'); 
    
    if (io) {
      io.to('providers').emit('new_job_available', { 
        message: "New job posted nearby!", 
        bookingId: booking.Id 
      });
    }

    const msg = data.providerId 
        ? 'Direct booking sent to your previous provider!' 
        : 'Service request broadcasted to nearby providers!';
        
    return success(res, booking, msg, 201);

  } catch (err) {
    return error(res, err.message);
  }
};

// 2. List Available Jobs (Provider Radar)
exports.listAvailableJobs = async (req, res) => {
  try {
    const provider = await providerModel.findByUserId(req.user.id);
    if (!provider) return error(res, 'Profile not found', 404);
    
    const addressList = await addressModel.listByUserId(req.user.id);
    const workAddress = addressList[0]; 

    if (!workAddress || !workAddress.Latitude) {
        return error(res, 'Please set your work location to see jobs.', 400);
    }

    const jobs = await bookingModel.findNearbyPending(workAddress.Latitude, workAddress.Longitude, 5);
    return success(res, jobs);
  } catch (err) {
    return error(res, err.message);
  }
};

// 3. Accept Job (Updated with Credit Deduction)
exports.acceptJob = async (req, res) => {
  try {
    const { id } = req.params;
    const provider = await providerModel.findByUserId(req.user.id);
    if (!provider) return error(res, 'Profile not found', 404);

    // --- CREDIT CHECK & DEDUCTION ---
    const JOB_COST = 10; // Configurable cost per job
    
    try {
        // This function throws an error if balance is low
        await providerModel.deductCredits(provider.Id, JOB_COST, id);
    } catch (creditErr) {
        return error(res, 'Insufficient credits. Please Top-Up your wallet to accept jobs.', 402);
    }
    // --------------------------------

    // Attempt to claim the job
    const result = await bookingModel.claim(id, provider.Id);
    
    if (!result || result.ProviderId !== provider.Id) {
        // EDGE CASE: If claim failed (someone else took it), we must REFUND the credits
        console.warn(`Refund triggered for Provider ${provider.Id} on Booking ${id}`);
        await providerModel.topUpCredits(provider.Id, JOB_COST, id); // Refund
        return error(res, 'Too late! This job was just taken by another provider.', 409);
    }

    return success(res, result, `Job accepted! ${JOB_COST} Credits deducted.`);
  } catch (err) {
    return error(res, err.message);
  }
};

// 4. List My Bookings
exports.listMyBookings = async (req, res) => {
  try {
    let entityId = req.user.id;

    if (req.user.role === 'provider') {
        const provider = await providerModel.findByUserId(req.user.id);
        if (!provider) {
            return error(res, 'Provider profile not found', 404);
        }
        entityId = provider.Id;
    }

    const bookings = await bookingModel.listForUser(entityId, req.user.role);
    return success(res, bookings);
  } catch (err) { 
      return error(res, err.message); 
  }
};

// 5. Get Single Booking
exports.getBookingById = async (req, res) => {
  try {
    const booking = await bookingModel.findById(req.params.id);
    return booking ? success(res, booking) : error(res, 'Not found', 404);
  } catch (err) { return error(res, err.message); }
};

// 6. Update Status (With Payout Fix)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // A. Update the Status
    const result = await bookingModel.updateStatus(id, status);

    // B. IF Status is COMPLETED -> Process Earnings
    if (status === 'completed') {
        const alreadyPaid = await paymentModel.isPaid(id);
        
        // 1. ALWAYS Add to Provider Earnings Wallet (Internal Record)
        await payoutModel.addTransaction({
            providerId: result.ProviderId,
            bookingId: id,
            amount: result.Price,
            type: 'earnings'
        });
        
        // 2. If not paid online, Record Payment as 'Cash/Offline' for balancing books
        if (!alreadyPaid) {
            console.log(`💰 Recording Cash Payment for Booking ${id}...`);
            await paymentModel.create({
                bookingId: id,
                customerId: result.CustomerId,
                providerId: result.ProviderId,
                amount: result.Price,
                paymentProvider: 'Cash/Offline'
            });
        }
    }
    
    // C. IF Status is CANCELLED -> Refund Logic
    if (status === 'cancelled') {
        const booking = await bookingModel.findById(id);
        
        // Refund credit if Customer cancelled after Provider accepted
        if (booking.ProviderId && req.body.cancelledBy === 'customer') {
            await providerModel.topUpCredits(booking.ProviderId, 10, `Refund: Booking ${id}`);
            console.log(`Reacting to cancellation: Refunded credits to provider ${booking.ProviderId}`);
        }
    }

    return success(res, result, 'Status updated');
  } catch (err) { 
    console.error("Update Status Error:", err);
    return error(res, err.message); 
  }
};

// 7. Assign Provider (Admin)
exports.assignProvider = async (req, res) => {
  try {
    let inputId = req.body.providerId; 
    let providerProfileId = inputId;

    // Check if ID is a UserID or ProviderID
    let provider = await providerModel.findByUserId(inputId);

    if (provider) {
        providerProfileId = provider.Id;
    } else {
        const existingProvider = await providerModel.findById(inputId);
        if (!existingProvider) {
            return error(res, 'Provider ID is invalid or does not exist.', 404);
        }
    }
    
    const result = await bookingModel.assignProvider(req.params.id, providerProfileId);
    return success(res, result, 'Assigned');

  } catch (err) { 
      return error(res, err.message); 
  }
};

// 8. Get Services Linked to Booking
exports.getBookingServices = async (req, res) => {
  try {
    const { id } = req.params;
    
    const services = await bookingModel.getServicesByBookingId(id);
    
    if (!services || services.length === 0) {
        return error(res, 'No services found for this booking', 404);
    }

    return success(res, services);
  } catch (err) {
    return error(res, err.message);
  }
};

// 9. NEW: Get Recent Clients
exports.getRecentClients = async (req, res) => {
  try {
    const provider = await providerModel.findByUserId(req.user.id);
    if (!provider) return error(res, 'Provider profile not found', 404);

    const clients = await bookingModel.getRecentClients(provider.Id);
    
    // Fetch profile images for these clients (optional, but nice for UI)
    const clientsWithImages = await Promise.all(clients.map(async (client) => {
        const media = await mediaModel.listByEntity('User', client.Id);
        const profilePic = media.find(m => m.MediaType === 'profile');
        return {
            ...client,
            profileImage: profilePic ? profilePic.Id : null
        };
    }));

    return success(res, clientsWithImages);
  } catch (err) {
    return error(res, err.message);
  }
};