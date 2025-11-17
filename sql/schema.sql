-- Create database
CREATE DATABASE HomeServiceDB;

-- Users Table
CREATE TABLE Users (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(200) NOT NULL,
    Email NVARCHAR(200) UNIQUE NULL,
    Mobile NVARCHAR(50) UNIQUE NULL,
    PasswordHash NVARCHAR(500) NOT NULL,
    Role NVARCHAR(50) NOT NULL, -- customer | provider | admin
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL
);

-- Customers Table
CREATE TABLE Customers (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    Birthdate DATE NULL,
    Gender NVARCHAR(50) NULL,
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL,
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);

-- Providers Table
CREATE TABLE Providers (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    Bio NVARCHAR(1000) NULL,
    ExperienceYears INT NULL,
    Gender NVARCHAR(50) NULL,
    Age INT NULL,
    Birthdate DATE NULL,
    AadharNo NVARCHAR(50) NULL,
    AadharFormat NVARCHAR(10) NULL,
    PanNo NVARCHAR(50) NULL,
    PanFormat NVARCHAR(10) NULL,
    VerificationStatus NVARCHAR(50) DEFAULT 'Pending',
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL,
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);

-- Run this in your SQL Database
CREATE TABLE ProviderServices (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ProviderId UNIQUEIDENTIFIER NOT NULL,
    ServiceId UNIQUEIDENTIFIER NOT NULL,
    CustomPrice DECIMAL(18,2) NULL, -- Optional: If provider charges differently than base price
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    FOREIGN KEY (ProviderId) REFERENCES Providers(Id),
    FOREIGN KEY (ServiceId) REFERENCES Services(Id),
    CONSTRAINT UK_Provider_Service UNIQUE(ProviderId, ServiceId) -- Prevent duplicate entries
);

-- Addresses Table (Updated for Fix 1.B: Geolocation)
CREATE TABLE Addresses (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    Label NVARCHAR(100),
    Line1 NVARCHAR(400),
    Line2 NVARCHAR(400),
    City NVARCHAR(200),
    State NVARCHAR(200),
    Pincode NVARCHAR(50),
    Latitude DECIMAL(9,6) NULL,
    Longitude DECIMAL(9,6) NULL,
    
    -- Computed Column: Automatically creates a Geography point from Lat/Long
    -- PERSISTED means it is stored on disk, allowing us to Index it.
    GeoLocation AS (CASE WHEN Latitude IS NOT NULL AND Longitude IS NOT NULL 
                         THEN geography::Point(Latitude, Longitude, 4326) 
                         ELSE NULL END) PERSISTED,

    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL,
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);

-- Create Spatial Index on Addresses (Critical for Performance)
CREATE SPATIAL INDEX [IX_Addresses_GeoLocation] ON Addresses(GeoLocation);


-- Service Categories Table
CREATE TABLE ServiceCategories (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(1000) NULL,
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL
);

-- Services Table
CREATE TABLE Services (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(300) NOT NULL,
    Description NVARCHAR(1000),
    CategoryId UNIQUEIDENTIFIER,
    BasePrice DECIMAL(18,2) DEFAULT 0,
    Duration INT NULL, -- in minutes
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL,
    FOREIGN KEY (CategoryId) REFERENCES ServiceCategories(Id)
);

-- Bookings Table
CREATE TABLE Bookings (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ProviderId UNIQUEIDENTIFIER NULL,  -- optional: assigned later after provider accepts
    CustomerId UNIQUEIDENTIFIER NOT NULL,
    ScheduledAt DATETIME2 NULL,
    AddressId UNIQUEIDENTIFIER NOT NULL,
    Price DECIMAL(18,2) DEFAULT 0,  -- Total aggregated price of linked services
    Status NVARCHAR(50) DEFAULT 'pending', -- pending, accepted, completed, cancelled
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL,
    FOREIGN KEY (ProviderId) REFERENCES Providers(Id),
    FOREIGN KEY (CustomerId) REFERENCES Users(Id),
    FOREIGN KEY (AddressId) REFERENCES Addresses(Id)
);

-- BookingServices Table
CREATE TABLE BookingServices (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    BookingId UNIQUEIDENTIFIER NOT NULL,
    ServiceId UNIQUEIDENTIFIER NOT NULL,
    Price DECIMAL(18,2) NOT NULL, -- price for each individual service
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL,
    FOREIGN KEY (BookingId) REFERENCES Bookings(Id),
    FOREIGN KEY (ServiceId) REFERENCES Services(Id)
);

-- Payments Table
CREATE TABLE Payments (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    BookingId UNIQUEIDENTIFIER NOT NULL,
    Amount DECIMAL(18,2) NOT NULL,
    ProviderId UNIQUEIDENTIFIER NULL,
    CustomerId UNIQUEIDENTIFIER NOT NULL,
    Status NVARCHAR(50) NOT NULL, -- pending, success, failed
    PaymentProvider NVARCHAR(200) NULL,
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    FOREIGN KEY (BookingId) REFERENCES Bookings(Id),
    FOREIGN KEY (ProviderId) REFERENCES Providers(Id),
    FOREIGN KEY (CustomerId) REFERENCES Users(Id)
);

-- Reviews Table
CREATE TABLE Reviews (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    BookingId UNIQUEIDENTIFIER NOT NULL,
    ServiceId UNIQUEIDENTIFIER NOT NULL,
    CustomerId UNIQUEIDENTIFIER NOT NULL,
    ProviderId UNIQUEIDENTIFIER NOT NULL,
    Rating INT CHECK (Rating BETWEEN 1 AND 5),
    Comment NVARCHAR(2000),
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    FOREIGN KEY (BookingId) REFERENCES Bookings(Id),
    FOREIGN KEY (ServiceId) REFERENCES Services(Id),
    FOREIGN KEY (CustomerId) REFERENCES Users(Id),
    FOREIGN KEY (ProviderId) REFERENCES Providers(Id)
);

-- Notifications Table
CREATE TABLE Notifications (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    Title NVARCHAR(200),
    Message NVARCHAR(1000),
    IsRead BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);

-- Payout Requests Table
CREATE TABLE PayoutRequests (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ProviderId UNIQUEIDENTIFIER NOT NULL,
    Amount DECIMAL(18,2) NOT NULL,
    Status NVARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    FOREIGN KEY (ProviderId) REFERENCES Providers(Id)
);

-- Provider Earnings Table
CREATE TABLE ProviderEarnings (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ProviderId UNIQUEIDENTIFIER NOT NULL,
    BookingId UNIQUEIDENTIFIER NULL,
    Amount DECIMAL(18,2) NOT NULL,
    Type NVARCHAR(100) NOT NULL, -- earnings, payout
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    FOREIGN KEY (ProviderId) REFERENCES Providers(Id),
    FOREIGN KEY (BookingId) REFERENCES Bookings(Id)
);

-- Admin Logs Table
CREATE TABLE AdminLogs (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    AdminId UNIQUEIDENTIFIER NOT NULL,
    Action NVARCHAR(1000) NOT NULL,
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    FOREIGN KEY (AdminId) REFERENCES Users(Id)
);

-- Centralized Media Files Table (Note: For production, consider cloud storage instead of VARBINARY)
CREATE TABLE MediaFiles (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    EntityId UNIQUEIDENTIFIER NOT NULL,    -- ID of related entity
    EntityType NVARCHAR(50) NOT NULL,      -- Provider, Service, Category, etc.
    MediaType NVARCHAR(50) NULL,           -- Profile, Aadhar, Pan, ServiceImage, etc.
    ImageData VARBINARY(MAX) NOT NULL,     -- Binary image data
    Format NVARCHAR(10) NULL,              -- png, jpg, etc.
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);


