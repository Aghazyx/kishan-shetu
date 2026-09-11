const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();

const PORT =
  process.env.PORT || 5050;


// ================================================================
// KISAN SETU BACKEND
// Farmer Procurement + Administration Portal
// ================================================================


// ================================================================
// ADMIN AUTHENTICATION - PROTOTYPE
// ================================================================

const ADMIN_USERNAME =
  process.env.ADMIN_USERNAME || 'admin';

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || 'kisan@2026';

const adminSessions =
  new Map();


// ================================================================
// MIDDLEWARE
// ================================================================

app.use(cors());

app.use(
  express.json()
);


// ================================================================
// DATA DIRECTORY
// ================================================================

const DATA_DIR =
  path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) {

  fs.mkdirSync(
    DATA_DIR,
    {
      recursive: true
    }
  );

}


// ================================================================
// DATA PERSISTENCE HELPERS
// ================================================================

const readData = (
  fileName,
  fallback = []
) => {

  try {

    const filePath =
      path.join(
        DATA_DIR,
        fileName
      );

    if (!fs.existsSync(filePath)) {

      return fallback;

    }

    const rawData =
      fs.readFileSync(
        filePath,
        'utf8'
      );

    return JSON.parse(
      rawData
    );

  } catch (error) {

    console.error(
      `[DB Read Error] ${fileName}:`,
      error
    );

    return fallback;

  }

};


const writeData = (
  fileName,
  data
) => {

  try {

    const filePath =
      path.join(
        DATA_DIR,
        fileName
      );

    fs.writeFileSync(
      filePath,
      JSON.stringify(
        data,
        null,
        2
      )
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


const generateId = (
  prefix
) => {

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
// Prototype values.
// Verify official MSP values before presenting these as live data.
// ================================================================

const MSP_RATES = {

  wheat: 2275,

  paddy: 2369

};


// ================================================================
// SEED FARMER DATA
// ================================================================

const farmersFile =
  path.join(
    DATA_DIR,
    'farmers.json'
  );


if (!fs.existsSync(farmersFile)) {

  writeData(
    'farmers.json',
    [

      {
        id:
          'FRM-DEMO-001',

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

        crops:
          [
            'Wheat',
            'Paddy'
          ],

        verifiedBank:
          'State Bank of India (A/C ****3312)',

        createdAt:
          new Date().toISOString()
      }

    ]
  );

}


// ================================================================
// ADMIN SESSION HELPER
// ================================================================

const getAdminSession =
  (req) => {

    const sessionId =
      req.headers[
        'x-admin-session'
      ];

    if (!sessionId) {

      return null;

    }

    return adminSessions.get(
      sessionId
    ) || null;

  };


// ================================================================
// ADMIN AUTHENTICATION MIDDLEWARE
// ================================================================

const requireAdmin =
  (req, res, next) => {

    const session =
      getAdminSession(req);

    if (!session) {

      return res.status(401).json({

        success:
          false,

        authenticated:
          false,

        message:
          'Valid administrator session required.'

      });

    }

    req.adminSession =
      session;

    next();

  };


// ================================================================
// ADMIN LOGIN
// ================================================================

app.post(
  '/api/admin/login',
  (req, res) => {

    try {

      const {
        username,
        password
      } = req.body;

      if (
        !username ||
        !password
      ) {

        return res.status(400).json({

          success:
            false,

          message:
            'Username and password are required.'

        });

      }

      if (
        username !== ADMIN_USERNAME ||
        password !== ADMIN_PASSWORD
      ) {

        return res.status(401).json({

          success:
            false,

          message:
            'Invalid administrator credentials.'

        });

      }

      const sessionId =
        crypto
          .randomBytes(32)
          .toString('hex');

      adminSessions.set(
        sessionId,
        {

          username:
            ADMIN_USERNAME,

          role:
            'Administrator',

          createdAt:
            new Date().toISOString()

        }
      );

      return res.json({

        success:
          true,

        message:
          'Administrator authenticated successfully.',

        sessionId,

        admin: {

          username:
            ADMIN_USERNAME,

          role:
            'Administrator'

        }

      });

    } catch (error) {

      console.error(
        '[Admin Login Error]',
        error
      );

      return res.status(500).json({

        success:
          false,

        message:
          'Administrator authentication failed.'

      });

    }

  }
);


// ================================================================
// ADMIN SESSION VERIFICATION
// ================================================================

app.get(
  '/api/admin/session',
  requireAdmin,
  (req, res) => {

    return res.json({

      success:
        true,

      authenticated:
        true,

      admin: {

        username:
          req.adminSession.username,

        role:
          req.adminSession.role

      },

      sessionCreatedAt:
        req.adminSession.createdAt

    });

  }
);


// ================================================================
// ADMIN LOGOUT
// ================================================================

app.post(
  '/api/admin/logout',
  (req, res) => {

    const sessionId =
      req.headers[
        'x-admin-session'
      ];

    if (sessionId) {

      adminSessions.delete(
        sessionId
      );

    }

    return res.json({

      success:
        true,

      message:
        'Administrator session ended.'

    });

  }
);


// ================================================================
// A2 • ADMIN DASHBOARD
// ================================================================

app.get(
  '/api/admin/dashboard',
  requireAdmin,
  (req, res) => {

    try {

      const farmers =
        readData(
          'farmers.json',
          []
        );

      const bookings =
        readData(
          'bookings.json',
          []
        );

      const receipts =
        readData(
          'receipts.json',
          []
        );

      const today =
        getTodayDate();


      // ------------------------------------------------------------
      // TODAY'S BOOKINGS
      // ------------------------------------------------------------

      const todayBookings =
        bookings.filter(
          booking =>
            booking.date === today
        );


      // ------------------------------------------------------------
      // TODAY'S RECEIPTS
      // ------------------------------------------------------------

      const todayReceipts =
        receipts.filter(
          receipt => {

            if (!receipt.timestamp) {

              return false;

            }

            return receipt.timestamp
              .startsWith(today);

          }
        );


      // ------------------------------------------------------------
      // TODAY'S PROCUREMENT
      // ------------------------------------------------------------

      const todayProcurementQuintals =
        todayReceipts.reduce(
          (
            total,
            receipt
          ) => {

            return (
              total +
              Number(
                receipt.netWeightQuintals ||
                0
              )
            );

          },
          0
        );


      // ------------------------------------------------------------
      // TODAY'S PAYMENTS
      // ------------------------------------------------------------

      const todayPayments =
        todayReceipts.reduce(
          (
            total,
            receipt
          ) => {

            return (
              total +
              Number(
                receipt.totalPayoutAmount ||
                0
              )
            );

          },
          0
        );


      // ------------------------------------------------------------
      // ACTIVE QUEUE
      // ------------------------------------------------------------

      const activeQueueBookings =
        todayBookings.filter(
          booking =>
            booking.status ===
              'Scheduled' ||

            booking.status ===
              'Active Gate Queue' ||

            booking.status ===
              'Weighbridge'
        );


      // ------------------------------------------------------------
      // CROP BREAKDOWN
      // ------------------------------------------------------------

      const cropBreakdown = {};


      todayReceipts.forEach(
        receipt => {

          const crop =
            String(
              receipt.cropType ||
              'Other'
            ).toLowerCase();


          if (!cropBreakdown[crop]) {

            cropBreakdown[crop] = {

              quantityQuintals:
                0,

              transactions:
                0,

              amount:
                0

            };

          }


          cropBreakdown[crop]
            .quantityQuintals +=
              Number(
                receipt.netWeightQuintals ||
                0
              );


          cropBreakdown[crop]
            .transactions +=
              1;


          cropBreakdown[crop]
            .amount +=
              Number(
                receipt.totalPayoutAmount ||
                0
              );

        }
      );


      // ------------------------------------------------------------
      // CENTER BREAKDOWN
      // ------------------------------------------------------------

      const centerBreakdown = {};


      todayBookings.forEach(
        booking => {

          const centerId =
            booking.centerId ||
            'Mandi-Center-01';


          const centerName =
            booking.center ||
            'Mandi-Center-01 (Main Gate)';


          if (
            !centerBreakdown[centerId]
          ) {

            centerBreakdown[centerId] = {

              centerId,

              center:
                centerName,

              capacityQuintals:
                500,

              bookedQuintals:
                0,

              activeTokens:
                0,

              completedTokens:
                0

            };

          }


          centerBreakdown[centerId]
            .bookedQuintals +=
              Number(
                booking.quantityQuintals ||
                0
              );


          if (
            booking.status ===
              'Scheduled' ||

            booking.status ===
              'Active Gate Queue'
          ) {

            centerBreakdown[centerId]
              .activeTokens +=
                1;

          }


          if (
            booking.status ===
              'Quality Approved'
          ) {

            centerBreakdown[centerId]
              .completedTokens +=
                1;

          }

        }
      );


      Object.values(
        centerBreakdown
      ).forEach(
        center => {

          center.remainingQuintals =
            Math.max(
              0,
              center.capacityQuintals -
              center.bookedQuintals
            );


          center.utilizationPercentage =
            Math.min(
              100,
              Math.round(
                (
                  center.bookedQuintals /
                  center.capacityQuintals
                ) *
                100
              )
            );

        }
      );


      // ------------------------------------------------------------
      // RECENT TRANSACTIONS
      // ------------------------------------------------------------

      const recentTransactions =
        bookings
          .slice()
          .sort(
            (a, b) =>
              new Date(
                b.createdAt || 0
              ) -
              new Date(
                a.createdAt || 0
              )
          )
          .slice(0, 10)
          .map(
            booking => {

              const farmer =
                farmers.find(
                  farmer =>
                    farmer.kccNumber ===
                    booking.kccNumber
                );


              const receipt =
                receipts.find(
                  receipt =>
                    receipt.tokenId ===
                    booking.tokenId
                );


              return {

                tokenId:
                  booking.tokenId,

                bookingId:
                  booking.bookingId,

                farmerName:
                  booking.farmerName ||
                  farmer?.name ||
                  'Unknown Farmer',

                kccNumber:
                  booking.kccNumber,

                cropType:
                  booking.cropType,

                bookedQuantityQuintals:
                  Number(
                    booking.quantityQuintals ||
                    0
                  ),

                actualQuantityQuintals:
                  receipt
                    ? Number(
                        receipt.netWeightQuintals ||
                        0
                      )
                    : null,

                status:
                  booking.status,

                center:
                  booking.center,

                timeSlot:
                  booking.timeSlot,

                qualityGrade:
                  receipt
                    ?.qualityGrade ||
                  null,

                payoutAmount:
                  receipt
                    ? Number(
                        receipt.totalPayoutAmount ||
                        0
                      )
                    : 0,

                receiptId:
                  receipt
                    ?.receiptId ||
                  null,

                createdAt:
                  booking.createdAt

              };

            }
          );


      // ------------------------------------------------------------
      // QUALITY SUMMARY
      // ------------------------------------------------------------

      const qualitySummary = {

        gradeA:
          todayReceipts.filter(
            receipt =>
              String(
                receipt.qualityGrade
              ).toLowerCase() ===
              'grade a'
          ).length,

        gradeB:
          todayReceipts.filter(
            receipt =>
              String(
                receipt.qualityGrade
              ).toLowerCase() ===
              'grade b'
          ).length,

        failed:
          todayReceipts.filter(
            receipt =>
              String(
                receipt.qualityGrade
              ).toLowerCase() ===
              'failed'
          ).length

      };


      // ------------------------------------------------------------
      // RESPONSE
      // ------------------------------------------------------------

      return res.json({

        success:
          true,

        generatedAt:
          new Date().toISOString(),

        date:
          today,

        metrics: {

          registeredFarmers:
            farmers.length,

          todayBookings:
            todayBookings.length,

          todayProcurementQuintals:
            Number(
              todayProcurementQuintals
                .toFixed(2)
            ),

          activeQueue:
            activeQueueBookings.length,

          todayPayments:
            Number(
              todayPayments
                .toFixed(2)
            ),

          completedTransactions:
            todayReceipts.length

        },

        cropBreakdown,

        centers:
          Object.values(
            centerBreakdown
          ),

        qualitySummary,

        recentTransactions

      });

    } catch (error) {

      console.error(
        '[Admin Dashboard Error]',
        error
      );

      return res.status(500).json({

        success:
          false,

        message:
          'Unable to load administration dashboard.'

      });

    }

  }
);


// ================================================================
// A3 • ADMIN FARMER MANAGEMENT
// ================================================================

app.get(
  '/api/admin/farmers',
  requireAdmin,
  (req, res) => {

    try {

      const farmers =
        readData(
          'farmers.json',
          []
        );

      const bookings =
        readData(
          'bookings.json',
          []
        );

      const receipts =
        readData(
          'receipts.json',
          []
        );


      // ------------------------------------------------------------
      // BUILD FARMER RECORDS
      // ------------------------------------------------------------

      const farmerRecords =
        farmers.map(
          farmer => {

            const farmerBookings =
              bookings.filter(
                booking =>
                  booking.kccNumber ===
                  farmer.kccNumber
              );


            const farmerReceipts =
              receipts.filter(
                receipt =>
                  receipt.kccNumber ===
                  farmer.kccNumber
              );


            const totalBookedQuintals =
              farmerBookings.reduce(
                (
                  total,
                  booking
                ) => {

                  return (
                    total +
                    Number(
                      booking.quantityQuintals ||
                      0
                    )
                  );

                },
                0
              );


            const totalProcuredQuintals =
              farmerReceipts.reduce(
                (
                  total,
                  receipt
                ) => {

                  return (
                    total +
                    Number(
                      receipt.netWeightQuintals ||
                      0
                    )
                  );

                },
                0
              );


            const totalPayout =
              farmerReceipts.reduce(
                (
                  total,
                  receipt
                ) => {

                  return (
                    total +
                    Number(
                      receipt.totalPayoutAmount ||
                      0
                    )
                  );

                },
                0
              );


            const latestBooking =
              farmerBookings
                .slice()
                .sort(
                  (a, b) =>
                    new Date(
                      b.createdAt || 0
                    ) -
                    new Date(
                      a.createdAt || 0
                    )
                )[0] || null;


            const latestReceipt =
              farmerReceipts
                .slice()
                .sort(
                  (a, b) =>
                    new Date(
                      b.timestamp || 0
                    ) -
                    new Date(
                      a.timestamp || 0
                    )
                )[0] || null;


            return {

              id:
                farmer.id,

              kccNumber:
                farmer.kccNumber,

              name:
                farmer.name,

              phone:
                farmer.phone,

              state:
                farmer.state,

              district:
                farmer.district,

              landHoldingAcres:
                Number(
                  farmer.landHoldingAcres ||
                  0
                ),

              mandi:
                farmer.mandi,

              crops:
                farmer.crops ||
                [],

              verifiedBank:
                farmer.verifiedBank,

              registeredAt:
                farmer.createdAt,

              totalBookings:
                farmerBookings.length,

              activeBookings:
                farmerBookings.filter(
                  booking =>
                    booking.status ===
                      'Scheduled' ||

                    booking.status ===
                      'Active Gate Queue' ||

                    booking.status ===
                      'Weighbridge'
                ).length,

              completedTransactions:
                farmerReceipts.length,

              totalBookedQuintals:
                Number(
                  totalBookedQuintals
                    .toFixed(2)
                ),

              totalProcuredQuintals:
                Number(
                  totalProcuredQuintals
                    .toFixed(2)
                ),

              totalPayout:
                Number(
                  totalPayout
                    .toFixed(2)
                ),

              latestBooking:
                latestBooking
                  ? {

                      tokenId:
                        latestBooking.tokenId,

                      date:
                        latestBooking.date,

                      timeSlot:
                        latestBooking.timeSlot,

                      cropType:
                        latestBooking.cropType,

                      quantityQuintals:
                        Number(
                          latestBooking.quantityQuintals ||
                          0
                        ),

                      center:
                        latestBooking.center,

                      status:
                        latestBooking.status

                    }
                  : null,

              latestReceipt:
                latestReceipt
                  ? {

                      receiptId:
                        latestReceipt.receiptId,

                      tokenId:
                        latestReceipt.tokenId,

                      cropType:
                        latestReceipt.cropType,

                      netWeightQuintals:
                        Number(
                          latestReceipt.netWeightQuintals ||
                          0
                        ),

                      qualityGrade:
                        latestReceipt.qualityGrade,

                      totalPayoutAmount:
                        Number(
                          latestReceipt.totalPayoutAmount ||
                          0
                        ),

                      timestamp:
                        latestReceipt.timestamp

                    }
                  : null

            };

          }
        );


      // ------------------------------------------------------------
      // SEARCH
      // ------------------------------------------------------------

      const search =
        String(
          req.query.search ||
          ''
        )
          .trim()
          .toLowerCase();


      const filteredFarmers =
        search
          ? farmerRecords.filter(
              farmer => {

                return (

                  String(
                    farmer.name ||
                    ''
                  )
                    .toLowerCase()
                    .includes(search)

                  ||

                  String(
                    farmer.kccNumber ||
                    ''
                  )
                    .toLowerCase()
                    .includes(search)

                  ||

                  String(
                    farmer.phone ||
                    ''
                  )
                    .toLowerCase()
                    .includes(search)

                  ||

                  String(
                    farmer.district ||
                    ''
                  )
                    .toLowerCase()
                    .includes(search)

                  ||

                  String(
                    farmer.mandi ||
                    ''
                  )
                    .toLowerCase()
                    .includes(search)

                );

              }
            )
          : farmerRecords;


      // ------------------------------------------------------------
      // RESPONSE
      // ------------------------------------------------------------

      return res.json({

        success:
          true,

        totalFarmers:
          filteredFarmers.length,

        totalRegisteredFarmers:
          farmerRecords.length,

        farmers:
          filteredFarmers

      });

    } catch (error) {

      console.error(
        '[Admin Farmer Management Error]',
        error
      );

      return res.status(500).json({

        success:
          false,

        message:
          'Unable to load farmer management data.'

      });

    }

  }
);


// ================================================================
// A1 • FARMER REGISTRATION & VERIFICATION
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

          success:
            false,

          message:
            'KCC Number is required.'

        });

      }


      const farmers =
        readData(
          'farmers.json',
          []
        );


      // ------------------------------------------------------------
      // EXISTING FARMER
      // ------------------------------------------------------------

      const existing =
        farmers.find(
          farmer =>
            farmer.kccNumber ===
            kccNumber
        );


      if (existing) {

        return res.json({

          success:
            true,

          message:
            'Farmer details retrieved from registry.',

          farmer:
            existing

        });

      }


      // ------------------------------------------------------------
      // NEW FARMER
      // ------------------------------------------------------------

      if (!name) {

        return res.status(400).json({

          success:
            false,

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
          phone ||
          '+91 98000-00000',

        state:
          state ||
          'Punjab State',

        district:
          district ||
          'Ludhiana',

        landHoldingAcres:
          5.0,

        mandi:
          'Khanna, Ludhiana',

        crops:
          [
            'Wheat',
            'Paddy'
          ],

        verifiedBank:
          'State Bank of India (A/C ****3312)',

        createdAt:
          new Date().toISOString()

      };


      farmers.push(
        newFarmer
      );


      const saved =
        writeData(
          'farmers.json',
          farmers
        );


      if (!saved) {

        return res.status(500).json({

          success:
            false,

          message:
            'Farmer could not be saved.'

        });

      }


      return res.status(201).json({

        success:
          true,

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

        success:
          false,

        message:
          'Registration failed.'

      });

    }

  }
);


// ================================================================
// A1 • SLOT BOOKING
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
        centerId,
        timeSlot,
        vehicleNumber
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

          success:
            false,

          message:
            'KCC Number, crop type and quantity are required.'

        });

      }


      const quantity =
        Number(
          quantityQuintals
        );


      if (
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {

        return res.status(400).json({

          success:
            false,

          message:
            'Quantity must be a valid positive number.'

        });

      }


      const bookingDate =
        preferredDate ||
        getTodayDate();


      const requestedCenterId =
        centerId ||
        'Mandi-Center-01';


      const bookings =
        readData(
          'bookings.json',
          []
        );


      // ------------------------------------------------------------
      // FARMER DETAILS
      // ------------------------------------------------------------

      const farmers =
        readData(
          'farmers.json',
          []
        );


      const farmer =
        farmers.find(
          item =>
            item.kccNumber ===
            kccNumber
        );


      // ------------------------------------------------------------
      // PREVENT DUPLICATE SAME-DAY BOOKING
      // ------------------------------------------------------------

      const duplicateBooking =
        bookings.find(
          booking =>
            booking.kccNumber ===
              kccNumber &&

            booking.date ===
              bookingDate &&

            (
              booking.status ===
                'Scheduled' ||

              booking.status ===
                'Active Gate Queue'
            )
        );


      if (duplicateBooking) {

        return res.status(409).json({

          success:
            false,

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
            booking.centerId ===
              requestedCenterId &&

            booking.date ===
              bookingDate &&

            booking.status !==
              'Cancelled'
        );


      const totalBookedQty =
        centerBookings.reduce(
          (
            sum,
            booking
          ) =>
            sum +
            Number(
              booking.quantityQuintals ||
              0
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
        totalBookedQty +
        quantity >
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

        farmerName:
          farmer?.name ||
          'Kisan Setu Farmer',

        cropType:
          String(
            cropType
          ).toLowerCase(),

        quantityQuintals:
          quantity,

        date:
          bookingDate,

        centerId:
          assignedCenterId,

        center:
          assignedCenter,

        timeSlot:
          timeSlot ||
          '10:00 AM - 12:00 PM',

        vehicleNumber:
          vehicleNumber ||
          null,

        status:
          'Scheduled',

        overflowRerouted,

        createdAt:
          new Date().toISOString()

      };


      bookings.push(
        newBooking
      );


      const saved =
        writeData(
          'bookings.json',
          bookings
        );


      if (!saved) {

        return res.status(500).json({

          success:
            false,

          message:
            'Booking could not be saved.'

        });

      }


      return res.status(201).json({

        success:
          true,

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

        success:
          false,

        message:
          'Slot allocation failed.'

      });

    }

  }
);


// ================================================================
// A1 • LIVE QUEUE / TOKEN TRACKER
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
            item.tokenId ===
            tokenId
        );


      if (!booking) {

        return res.status(404).json({

          success:
            false,

          message:
            'Token ID not found.'

        });

      }


      const activeQueue =
        bookings
          .filter(
            item =>
              item.date ===
                booking.date &&

              item.centerId ===
                booking.centerId &&

              (
                item.status ===
                  'Active Gate Queue' ||

                item.status ===
                  'Scheduled'
              )
          )
          .sort(
            (a, b) =>
              new Date(
                a.createdAt
              ) -
              new Date(
                b.createdAt
              )
          );


      const queueIndex =
        activeQueue.findIndex(
          item =>
            item.tokenId ===
            tokenId
        );


      const queuePosition =
        queueIndex >= 0
          ? queueIndex + 1
          : 1;


      return res.json({

        success:
          true,

        token:
          booking.tokenId,

        status:
          booking.status,

        farmerName:
          booking.farmerName ||
          null,

        cropType:
          booking.cropType,

        quantityQuintals:
          booking.quantityQuintals,

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

        success:
          false,

        message:
          'Queue tracking failed.'

      });

    }

  }
);


// ================================================================
// A1 • GEOFENCED CHECK-IN
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

          success:
            false,

          message:
            'Token ID is required.'

        });

      }


      const bookings =
        readData(
          'bookings.json',
          []
        );


      const bookingIndex =
        bookings.findIndex(
          booking =>
            booking.tokenId ===
            tokenId
        );


      if (bookingIndex === -1) {

        return res.status(404).json({

          success:
            false,

          message:
            'Token not found.'

        });

      }


      const booking =
        bookings[
          bookingIndex
        ];


      if (
        booking.status !==
        'Scheduled'
      ) {

        return res.status(409).json({

          success:
            false,

          message:
            `Token cannot be checked in from its current state: ${booking.status}`

        });

      }


      // ------------------------------------------------------------
      // PROTOTYPE GEOFENCE
      // ------------------------------------------------------------

      booking.status =
        'Active Gate Queue';


      booking.checkInAt =
        new Date().toISOString();


      booking.location = {

        latitude:
          latitude ??
          null,

        longitude:
          longitude ??
          null

      };


      const saved =
        writeData(
          'bookings.json',
          bookings
        );


      if (!saved) {

        return res.status(500).json({

          success:
            false,

          message:
            'Check-in could not be saved.'

        });

      }


      return res.json({

        success:
          true,

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

        success:
          false,

        message:
          'Geofenced check-in failed.'

      });

    }

  }
);


// ================================================================
// A1 • PROCUREMENT & QUALITY LOGGING
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

          success:
            false,

          message:
            'Token, gross weight, tare weight and moisture are required.'

        });

      }


      const grossWeight =
        Number(
          grossWeightQuintals
        );


      const tareWeight =
        Number(
          tareWeightQuintals
        );


      const moisture =
        Number(
          moisturePercentage
        );


      if (
        !Number.isFinite(
          grossWeight
        ) ||

        !Number.isFinite(
          tareWeight
        ) ||

        !Number.isFinite(
          moisture
        )
      ) {

        return res.status(400).json({

          success:
            false,

          message:
            'Weight and moisture values must be valid numbers.'

        });

      }


      if (
        grossWeight <= 0 ||
        tareWeight < 0
      ) {

        return res.status(400).json({

          success:
            false,

          message:
            'Weight values are invalid.'

        });

      }


      if (
        grossWeight <=
        tareWeight
      ) {

        return res.status(400).json({

          success:
            false,

          message:
            'Gross weight must be greater than tare weight.'

        });

      }


      if (
        moisture < 0 ||
        moisture > 100
      ) {

        return res.status(400).json({

          success:
            false,

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
            item.tokenId ===
            tokenId
        );


      if (!booking) {

        return res.status(404).json({

          success:
            false,

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
            receipt.tokenId ===
            tokenId
        );


      if (existingReceipt) {

        return res.status(409).json({

          success:
            false,

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
        grossWeight -
        tareWeight;


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
        MSP_RATES[
          normalizedCrop
        ];


      if (
        !mspPricePerQuintal
      ) {

        return res.status(400).json({

          success:
            false,

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

        farmerName:
          booking.farmerName ||
          null,

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


      receipts.push(
        newReceipt
      );


      const savedReceipt =
        writeData(
          'receipts.json',
          receipts
        );


      if (!savedReceipt) {

        return res.status(500).json({

          success:
            false,

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

        success:
          true,

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

        success:
          false,

        message:
          'Quality logging failed.'

      });

    }

  }
);


// ================================================================
// A1 • PAYMENT / DBT STATUS
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
            item.tokenId ===
            tokenId
        );


      // ------------------------------------------------------------
      // NO RECEIPT
      // ------------------------------------------------------------

      if (!receipt) {

        return res.json({

          success:
            true,

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

        success:
          true,

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

        success:
          false,

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

    return res.json({

      success:
        true,

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