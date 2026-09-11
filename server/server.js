const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5050;


// ================================================================
// MIDDLEWARE
// ================================================================

app.use(cors());
app.use(express.json());


// ================================================================
// DATA DIRECTORY
// ================================================================

const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}


// ================================================================
// DATA PERSISTENCE HELPERS
// ================================================================

const readData = (fileName, fallback = []) => {

  try {

    const filePath =
      path.join(DATA_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      return fallback;
    }

    const rawData =
      fs.readFileSync(filePath, 'utf8');

    return JSON.parse(rawData);

  } catch (error) {

    console.error(
      `[DB Read Error] ${fileName}:`,
      error
    );

    return fallback;
  }
};


const writeData = (fileName, data) => {

  try {

    const filePath =
      path.join(DATA_DIR, fileName);

    fs.writeFileSync(
      filePath,
      JSON.stringify(data, null, 2)
    );

    return true;

  } catch (error) {

    console.error(
      `[DB Write Error] ${fileName}:`,
      error
    );

    return false;
  }
};


// ================================================================
// UTILITY FUNCTIONS
// ================================================================

const getTodayDate = () => {

  return new Date()
    .toISOString()
    .split('T')[0];

};


const generateId = (prefix) => {

  return `${prefix}-${Date.now()}-${Math.floor(
    Math.random() * 1000
  )}`;

};


const generateToken = () => {

  return `TKN-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

};


// ================================================================
// DEMO MSP RATES
// ================================================================
// These are prototype values. Verify current official MSP data
// before presenting these numbers as live government data.
// ================================================================

const MSP_RATES = {

  wheat: 2275,

  paddy: 2369

};


// ================================================================
// SEED FARMER DATA
// ================================================================

const farmersFile =
  path.join(DATA_DIR, 'farmers.json');

if (!fs.existsSync(farmersFile)) {

  writeData('farmers.json', [

    {
      id: 'FRM-DEMO-001',

      kccNumber:
        'KCC-PB-2024-8841',

      name:
        'Sardar Ramesh Singh',

      phone:
        '+91 98765-43210',

      landHoldingAcres:
        4.5,

      state:
        'Punjab State',

      district:
        'Ludhiana',

      mandi:
        'Khanna, Ludhiana',

      verifiedBank:
        'State Bank of India (A/C ****3312)',

      createdAt:
        new Date().toISOString()
    }

  ]);

}


// ================================================================
// 1. FARMER REGISTRATION & VERIFICATION
// ================================================================

app.post(
  '/api/auth/register-farmer',
  (req, res) => {

    try {

      const {
        kccNumber,
        name,
        phone,
        state,
        district
      } = req.body;


      // ------------------------------------------------------------
      // VALIDATION
      // ------------------------------------------------------------

      if (!kccNumber) {

        return res.status(400).json({

          success: false,

          message:
            'KCC Number is required.'

        });

      }


      const farmers =
        readData('farmers.json', []);


      // ------------------------------------------------------------
      // CHECK EXISTING FARMER
      // ------------------------------------------------------------

      const existing =
        farmers.find(
          farmer =>
            farmer.kccNumber === kccNumber
        );


      if (existing) {

        return res.json({

          success: true,

          message:
            'Farmer details retrieved from registry.',

          farmer:
            existing

        });

      }


      // ------------------------------------------------------------
      // CREATE DEMO FARMER
      // ------------------------------------------------------------
      // This is a prototype registry.
      // Real Bhoomi integration should replace this section.
      // ------------------------------------------------------------

      if (!name) {

        return res.status(400).json({

          success: false,

          message:
            'Name is required for a new farmer registration.'

        });

      }


      const newFarmer = {

        id:
          generateId('FRM'),

        kccNumber,

        name,

        phone:
          phone || '+91 98000-00000',

        state:
          state || 'Punjab State',

        district:
          district || 'Ludhiana',

        landHoldingAcres:
          5.0,

        verifiedBank:
          'State Bank of India (A/C ****3312)',

        createdAt:
          new Date().toISOString()

      };


      farmers.push(newFarmer);

      const saved =
        writeData(
          'farmers.json',
          farmers
        );


      if (!saved) {

        return res.status(500).json({

          success: false,

          message:
            'Farmer could not be saved.'

        });

      }


      return res.status(201).json({

        success: true,

        message:
          'Farmer registered in the prototype registry. Land and bank records are simulated.',

        farmer:
          newFarmer

      });

    } catch (error) {

      console.error(
        '[Farmer Registration Error]',
        error
      );

      return res.status(500).json({

        success: false,

        message:
          'Registration failed.'

      });

    }

  }
);


// ================================================================
// 2. SLOT BOOKING
// ================================================================

app.post(
  '/api/slots/book',
  (req, res) => {

    try {

      const {
        kccNumber,
        cropType,
        quantityQuintals,
        preferredDate,
        centerId
      } = req.body;


      // ------------------------------------------------------------
      // VALIDATION
      // ------------------------------------------------------------

      if (
        !kccNumber ||
        !cropType ||
        quantityQuintals == null
      ) {

        return res.status(400).json({

          success: false,

          message:
            'KCC Number, crop type and quantity are required.'

        });

      }


      const quantity =
        Number(quantityQuintals);


      if (
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Quantity must be a valid positive number.'

        });

      }


      const bookingDate =
        preferredDate || getTodayDate();


      const requestedCenterId =
        centerId || 'Mandi-Center-01';


      const bookings =
        readData(
          'bookings.json',
          []
        );


      // ------------------------------------------------------------
      // PREVENT DUPLICATE SAME-DAY BOOKING
      // ------------------------------------------------------------

      const duplicateBooking =
        bookings.find(
          booking =>
            booking.kccNumber === kccNumber &&
            booking.date === bookingDate &&
            (
              booking.status === 'Scheduled' ||
              booking.status === 'Active Gate Queue'
            )
        );


      if (duplicateBooking) {

        return res.status(409).json({

          success: false,

          message:
            'This farmer already has an active booking for this date.',

          booking:
            duplicateBooking

        });

      }


      // ------------------------------------------------------------
      // CENTER CAPACITY
      // ------------------------------------------------------------

      const CENTER_CAPACITY =
        500;


      const centerBookings =
        bookings.filter(
          booking =>
            booking.centerId === requestedCenterId &&
            booking.date === bookingDate &&
            booking.status !== 'Cancelled'
        );


      const totalBookedQty =
        centerBookings.reduce(
          (sum, booking) =>
            sum +
            Number(
              booking.quantityQuintals || 0
            ),
          0
        );


      // ------------------------------------------------------------
      // CENTER ASSIGNMENT
      // ------------------------------------------------------------

      let assignedCenterId =
        requestedCenterId;

      let assignedCenter =
        'Mandi-Center-01 (Main Gate)';

      let overflowRerouted =
        false;


      if (
        totalBookedQty + quantity >
        CENTER_CAPACITY
      ) {

        assignedCenterId =
          'Mandi-Center-02';

        assignedCenter =
          'Mandi-Center-02 (Nearby Overflow Facility)';

        overflowRerouted =
          true;

      }


      // ------------------------------------------------------------
      // CREATE BOOKING
      // ------------------------------------------------------------

      const newBooking = {

        bookingId:
          generateId('SLT'),

        tokenId:
          generateToken(),

        kccNumber,

        cropType:
          String(cropType).toLowerCase(),

        quantityQuintals:
          quantity,

        date:
          bookingDate,

        centerId:
          assignedCenterId,

        center:
          assignedCenter,

        timeSlot:
          '10:00 AM - 12:00 PM',

        status:
          'Scheduled',

        overflowRerouted,

        createdAt:
          new Date().toISOString()

      };


      bookings.push(newBooking);


      const saved =
        writeData(
          'bookings.json',
          bookings
        );


      if (!saved) {

        return res.status(500).json({

          success: false,

          message:
            'Booking could not be saved.'

        });

      }


      return res.status(201).json({

        success: true,

        message:
          overflowRerouted
            ? 'Main center is at capacity. Booking rerouted to nearby overflow facility.'
            : 'Arrival slot booked successfully!',

        booking:
          newBooking

      });

    } catch (error) {

      console.error(
        '[Slot Booking Error]',
        error
      );

      return res.status(500).json({

        success: false,

        message:
          'Slot allocation failed.'

      });

    }

  }
);


// ================================================================
// 3. LIVE QUEUE / TOKEN TRACKER
// ================================================================

app.get(
  '/api/queue/token/:tokenId',
  (req, res) => {

    try {

      const tokenId =
        req.params.tokenId;


      const bookings =
        readData(
          'bookings.json',
          []
        );


      const booking =
        bookings.find(
          item =>
            item.tokenId === tokenId
        );


      if (!booking) {

        return res.status(404).json({

          success: false,

          message:
            'Token ID not found.'

        });

      }


      // ------------------------------------------------------------
      // ONLY INCLUDE SAME-DAY ACTIVE QUEUE
      // ------------------------------------------------------------

      const activeQueue =
        bookings
          .filter(
            item =>
              item.date === booking.date &&
              item.centerId === booking.centerId &&
              (
                item.status ===
                  'Active Gate Queue' ||
                item.status ===
                  'Scheduled'
              )
          )
          .sort(
            (a, b) =>
              new Date(a.createdAt) -
              new Date(b.createdAt)
          );


      const queueIndex =
        activeQueue.findIndex(
          item =>
            item.tokenId === tokenId
        );


      const queuePosition =
        queueIndex >= 0
          ? queueIndex + 1
          : 1;


      return res.json({

        success: true,

        token:
          booking.tokenId,

        status:
          booking.status,

        center:
          booking.center,

        date:
          booking.date,

        timeSlot:
          booking.timeSlot,

        queuePosition,

        estimatedWaitTime:
          `${queuePosition * 15} mins`,

        gateEntryTime:
          '10:30 AM'

      });

    } catch (error) {

      console.error(
        '[Queue Error]',
        error
      );

      return res.status(500).json({

        success: false,

        message:
          'Queue tracking failed.'

      });

    }

  }
);


// ================================================================
// 4. GEOFENCED CHECK-IN
// ================================================================

app.post(
  '/api/checkin/geofence',
  (req, res) => {

    try {

      const {
        tokenId,
        latitude,
        longitude
      } = req.body;


      if (!tokenId) {

        return res.status(400).json({

          success: false,

          message:
            'Token ID is required.'

        });

      }


      let bookings =
        readData(
          'bookings.json',
          []
        );


      const bookingIndex =
        bookings.findIndex(
          booking =>
            booking.tokenId === tokenId
        );


      if (bookingIndex === -1) {

        return res.status(404).json({

          success: false,

          message:
            'Token not found.'

        });

      }


      const booking =
        bookings[bookingIndex];


      // ------------------------------------------------------------
      // TOKEN STATE VALIDATION
      // ------------------------------------------------------------

      if (
        booking.status !== 'Scheduled'
      ) {

        return res.status(409).json({

          success: false,

          message:
            `Token cannot be checked in from its current state: ${booking.status}`

        });

      }


      // ------------------------------------------------------------
      // PROTOTYPE GEOFENCE
      // ------------------------------------------------------------
      // GPS coordinates are accepted here.
      // Actual 1 KM distance calculation can be added later.
      // ------------------------------------------------------------

      booking.status =
        'Active Gate Queue';

      booking.checkInAt =
        new Date().toISOString();

      booking.location = {

        latitude:
          latitude ?? null,

        longitude:
          longitude ?? null

      };


      const saved =
        writeData(
          'bookings.json',
          bookings
        );


      if (!saved) {

        return res.status(500).json({

          success: false,

          message:
            'Check-in could not be saved.'

        });

      }


      return res.json({

        success: true,

        message:
          'Geofence check-in verified. Token moved to Active Gate Queue.',

        tokenId,

        status:
          booking.status

      });

    } catch (error) {

      console.error(
        '[Geofence Error]',
        error
      );

      return res.status(500).json({

        success: false,

        message:
          'Geofenced check-in failed.'

      });

    }

  }
);


// ================================================================
// 5. PROCUREMENT & QUALITY LOGGING
// ================================================================

app.post(
  '/api/procurement/quality-log',
  (req, res) => {

    try {

      const {
        tokenId,
        grossWeightQuintals,
        tareWeightQuintals,
        moisturePercentage,
        qualityGrade,
        cropType
      } = req.body;


      // ------------------------------------------------------------
      // VALIDATION
      // ------------------------------------------------------------

      if (
        !tokenId ||
        grossWeightQuintals == null ||
        tareWeightQuintals == null ||
        moisturePercentage == null
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Token, gross weight, tare weight and moisture are required.'

        });

      }


      const grossWeight =
        Number(grossWeightQuintals);

      const tareWeight =
        Number(tareWeightQuintals);

      const moisture =
        Number(moisturePercentage);


      if (
        !Number.isFinite(grossWeight) ||
        !Number.isFinite(tareWeight) ||
        !Number.isFinite(moisture)
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Weight and moisture values must be valid numbers.'

        });

      }


      if (
        grossWeight <= 0 ||
        tareWeight < 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Weight values are invalid.'

        });

      }


      if (
        grossWeight <= tareWeight
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Gross weight must be greater than tare weight.'

        });

      }


      if (
        moisture < 0 ||
        moisture > 100
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Moisture percentage must be between 0 and 100.'

        });

      }


      // ------------------------------------------------------------
      // VERIFY TOKEN
      // ------------------------------------------------------------

      const bookings =
        readData(
          'bookings.json',
          []
        );


      const booking =
        bookings.find(
          item =>
            item.tokenId === tokenId
        );


      if (!booking) {

        return res.status(404).json({

          success: false,

          message:
            'Token not found.'

        });

      }


      // ------------------------------------------------------------
      // PREVENT DUPLICATE RECEIPT
      // ------------------------------------------------------------

      const receipts =
        readData(
          'receipts.json',
          []
        );


      const existingReceipt =
        receipts.find(
          receipt =>
            receipt.tokenId === tokenId
        );


      if (existingReceipt) {

        return res.status(409).json({

          success: false,

          message:
            'A receipt already exists for this token.',

          receipt:
            existingReceipt

        });

      }


      // ------------------------------------------------------------
      // CALCULATE NET WEIGHT
      // ------------------------------------------------------------

      const netWeight =
        grossWeight - tareWeight;


      // ------------------------------------------------------------
      // DETERMINE MSP
      // ------------------------------------------------------------

      const normalizedCrop =
        String(
          cropType ||
          booking.cropType ||
          'wheat'
        ).toLowerCase();


      const mspPricePerQuintal =
        MSP_RATES[normalizedCrop];


      if (!mspPricePerQuintal) {

        return res.status(400).json({

          success: false,

          message:
            `MSP rate not configured for crop: ${normalizedCrop}`

        });

      }


      const totalPayoutAmount =
        netWeight *
        mspPricePerQuintal;


      // ------------------------------------------------------------
      // CREATE RECEIPT
      // ------------------------------------------------------------

      const newReceipt = {

        receiptId:
          generateId('RCP'),

        tokenId,

        kccNumber:
          booking.kccNumber,

        cropType:
          normalizedCrop,

        grossWeight,

        tareWeight,

        netWeightQuintals:
          netWeight,

        moisturePercentage:
          moisture,

        qualityGrade:
          qualityGrade ||
          'Grade A',

        mspPricePerQuintal,

        totalPayoutAmount,

        status:
          'Quality Approved',

        timestamp:
          new Date().toISOString()

      };


      receipts.push(newReceipt);


      const saved =
        writeData(
          'receipts.json',
          receipts
        );


      if (!saved) {

        return res.status(500).json({

          success: false,

          message:
            'Receipt could not be saved.'

        });

      }


      // ------------------------------------------------------------
      // UPDATE BOOKING STATE
      // ------------------------------------------------------------

      booking.status =
        'Quality Approved';

      booking.qualityLoggedAt =
        new Date().toISOString();

      writeData(
        'bookings.json',
        bookings
      );


      return res.status(201).json({

        success: true,

        message:
          'Quality parameters logged and digital receipt generated.',

        receipt:
          newReceipt

      });

    } catch (error) {

      console.error(
        '[Quality Log Error]',
        error
      );

      return res.status(500).json({

        success: false,

        message:
          'Quality logging failed.'

      });

    }

  }
);


// ================================================================
// 6. PAYMENT / DBT STATUS
// ================================================================

app.get(
  '/api/payments/status/:tokenId',
  (req, res) => {

    try {

      const tokenId =
        req.params.tokenId;


      const receipts =
        readData(
          'receipts.json',
          []
        );


      const receipt =
        receipts.find(
          item =>
            item.tokenId === tokenId
        );


      // ------------------------------------------------------------
      // NO RECEIPT YET
      // ------------------------------------------------------------

      if (!receipt) {

        return res.json({

          success: true,

          pipeline: {

            stage:
              'Awaiting Weighbridge',

            receiptId:
              null,

            amountToCredit:
              0,

            invoiceGenerated:
              false,

            dbtPayoutDispatched:
              false,

            payoutStatus:
              'Pending On-Site Weighbridge Logging'

          }

        });

      }


      // ------------------------------------------------------------
      // RECEIPT EXISTS
      // ------------------------------------------------------------

      return res.json({

        success: true,

        pipeline: {

          stage:
            'DBT Processing',

          receiptId:
            receipt.receiptId,

          amountToCredit:
            receipt.totalPayoutAmount,

          invoiceGenerated:
            true,

          dbtPayoutDispatched:
            false,

          payoutStatus:
            'Payment instruction generated. Awaiting DBT confirmation.',

          bankSyncStatus:
            'Bank account verified'

        }

      });

    } catch (error) {

      console.error(
        '[Payment Status Error]',
        error
      );

      return res.status(500).json({

        success: false,

        message:
          'Disbursement tracking failed.'

      });

    }

  }
);


// ================================================================
// HEALTH CHECK
// ================================================================

app.get(
  '/api/health',
  (req, res) => {

    res.json({

      success: true,

      service:
        'Kisan Setu Procurement Backend',

      status:
        'Operational',

      timestamp:
        new Date().toISOString()

    });

  }
);


// ================================================================
// START SERVER
// ================================================================

app.listen(
  PORT,
  () => {

    console.log(
      `🌾 Kisan Setu Procurement Backend active on http://localhost:${PORT}`
    );

    console.log(
      `📡 Health check: http://localhost:${PORT}/api/health`
    );

  }
);