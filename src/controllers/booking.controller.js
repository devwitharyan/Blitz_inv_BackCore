const bookingModel = require('../models/booking.model');
const providerModel = require('../models/provider.model');
const addressModel = require('../models/address.model');
const { success, error } = require('../utils/response');

exports.createBooking = async (req, res) => {
  try {
    const data = { ...req.body, customerId: req.user.id };

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

    const address = await addressModel.findById(data.addressId);
    if (!address) return error(res, 'Invalid address', 400);

    const booking = await bookingModel.create(data);
    
    const msg = data.providerId 
        ? 'Direct booking sent to your previous provider!' 
        : 'Service request broadcasted to nearby providers!';
        
    return success(res, booking, msg, 201);

  } catch (err) {
    return error(res, err.message);
  }
};

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

exports.acceptJob = async (req, res) => {
  try {
    const { id } = req.params;
    const provider = await providerModel.findByUserId(req.user.id);
    if (!provider) return error(res, 'Profile not found', 404);

    const result = await bookingModel.claim(id, provider.Id);
    
    if (!result || result.ProviderId !== provider.Id) {
        return error(res, 'Too late! This job was just taken by another provider.', 409);
    }

    return success(res, result, 'You got the job!');
  } catch (err) {
    return error(res, err.message);
  }
};

// --- CRITICAL FIX HERE ---
exports.listMyBookings = async (req, res) => {
  try {
    let entityId = req.user.id;

    // If the user is a PROVIDER, we must find their Profile ID (Provider.Id)
    // because the Booking table stores ProviderId, not UserId.
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
// -------------------------

exports.getBookingById = async (req, res) => {
  try {
    const booking = await bookingModel.findById(req.params.id);
    return booking ? success(res, booking) : error(res, 'Not found', 404);
  } catch (err) { return error(res, err.message); }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const result = await bookingModel.updateStatus(req.params.id, req.body.status);
    return success(res, result, 'Status updated');
  } catch (err) { return error(res, err.message); }
};

exports.assignProvider = async (req, res) => {
  try {
    let inputId = req.body.providerId; // ID entered by the Admin
    let providerProfileId = inputId;

    // 1. Try to find the Provider Profile using the input ID (Assuming it's a User ID)
    let provider = await providerModel.findByUserId(inputId);

    // 2. If a profile is found, use its actual Providers.Id
    if (provider) {
        providerProfileId = provider.Id;
    } 
    // 3. If no profile is found, assume the admin entered the correct Providers.Id
    //    and proceed (the database will handle the final validation/failure if invalid).
    //    However, to be safer, we can check if the ID is valid now:
    else {
        // Double-check if the input ID is actually a valid Providers.Id
        const existingProvider = await providerModel.findById(inputId);
        if (!existingProvider) {
            return error(res, 'Provider ID is invalid or does not exist.', 404);
        }
    }
    
    // 4. Use the validated/converted Provider Profile ID to update the booking
    const result = await bookingModel.assignProvider(req.params.id, providerProfileId);
    
    return success(res, result, 'Assigned');

  } catch (err) { 
      return error(res, err.message); 
  }
};

exports.getBookingServices = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Authorization Check: Ensure the user owns the booking before proceeding
    const booking = await bookingModel.findById(id);
    const userId = req.user.id;
    
    if (!booking || booking.CustomerId !== userId) {
        return error(res, 'Booking not found or unauthorized', 404);
    }
    
    const services = await bookingModel.getServicesByBookingId(id);
    
    if (!services || services.length === 0) {
        return error(res, 'No services found for this booking', 404);
    }

    return success(res, services);
  } catch (err) {
    return error(res, err.message);
  }
};