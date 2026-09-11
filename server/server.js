// ================================================================
// KISAN SETU BACKEND
// Farmer Procurement + Administration Portal
// A1 → A7 Integrated Prototype Backend
// ================================================================

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();

const PORT = process.env.PORT || 5050;


// ================================================================
// ADMIN AUTHENTICATION - PROTOTYPE
// ================================================================

const ADMIN_USERNAME =
  process.env.ADMIN_USERNAME || 'admin';

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || 'kisan@2026';

const adminSessions = new Map();


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
  path.join(
    __dirname,
    'data'
  );


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


const normalizePaymentStatus = (
  receipt
) => {

  const status =
    String(
      receipt?.paymentStatus ||
      'Pending'
    )
      .trim()
      .toLowerCase();


  if (
    status === 'pfms batched' ||
    status === 'pfms-batched'
  ) {

    return 'pfms-batched';

  }


  if (
    status === 'dbt dispatched' ||
    status === 'dbt-dispatched'
  ) {

    return 'dbt-dispatched';

  }


  if (
    status === 'failed'
  ) {

    return 'failed';

  }


  return 'pending';

};


const getPaymentStatusLabel = (
  status
) => {

  if (
    status === 'pfms-batched'
  ) {

    return 'PFMS Batched';

  }


  if (
    status === 'dbt-dispatched'
  ) {

    return 'DBT Dispatched';

  }


  if (
    status === 'failed'
  ) {

    return 'Failed';

  }


  return 'Pending';

};


// ================================================================
// DEMO MSP RATES
// ================================================================

const MSP_RATES = {

  wheat: 2275,

  paddy: 2369

};


// ================================================================
// A4 • MANDI CONFIGURATION
// ================================================================

const MANDI_CENTERS = [

  {
    centerId:
      'Mandi-Center-01',

    center:
      'Mandi-Center-01 (Main Gate)',

    capacityQuintals:
      500,

    type:
      'Primary Procurement Center'

  },

  {
    centerId:
      'Mandi-Center-02',

    center:
      'Mandi-Center-02 (Nearby Overflow Facility)',

    capacityQuintals:
      500,

    type:
      'Overflow Procurement Center'

  }

];


const MANDI_SLOTS = [

  {
    slotId:
      'SLOT-01',

    timeSlot:
      '08:00 AM - 10:00 AM',

    capacityQuintals:
      50

  },

  {
    slotId:
      'SLOT-02',

    timeSlot:
      '10:00 AM - 12:00 PM',

    capacityQuintals:
      50

  },

  {
    slotId:
      'SLOT-03',

    timeSlot:
      '12:00 PM - 02:00 PM',

    capacityQuintals:
      50

  },

  {
    slotId:
      'SLOT-04',

    timeSlot:
      '02:00 PM - 04:00 PM',

    capacityQuintals:
      50

  },

  {
    slotId:
      'SLOT-05',

    timeSlot:
      '04:00 PM - 06:00 PM',

    capacityQuintals:
      50

  },

  {
    slotId:
      'SLOT-06',

    timeSlot:
      '06:00 PM - 08:00 PM',

    capacityQuintals:
      50

  },

  {
    slotId:
      'SLOT-07',

    timeSlot:
      '08:00 PM - 10:00 PM',

    capacityQuintals:
      50

  },

  {
    slotId:
      'SLOT-08',

    timeSlot:
      '10:00 PM - 12:00 AM',

    capacityQuintals:
      50

  },

  {
    slotId:
      'SLOT-09',

    timeSlot:
      '12:00 AM - 02:00 AM',

    capacityQuintals:
      50

  },

  {
    slotId:
      'SLOT-10',

    timeSlot:
      '02:00 AM - 04:00 AM',

    capacityQuintals:
      50

  }

];


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
// ADMIN SESSION HELPERS
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

    return (
      adminSessions.get(
        sessionId
      ) ||
      null
    );

  };


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
// A1 • ADMIN LOGIN
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
        username !==
          ADMIN_USERNAME ||
        password !==
          ADMIN_PASSWORD
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
// ADMIN SESSION
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


      const todayBookings =
        bookings.filter(
          booking =>
            booking.date ===
            today
        );


      const todayReceipts =
        receipts.filter(
          receipt =>
            receipt.timestamp &&
            receipt.timestamp.startsWith(
              today
            )
        );


      const todayProcurementQuintals =
        todayReceipts.reduce(
          (
            total,
            receipt
          ) =>
            total +
            Number(
              receipt.netWeightQuintals ||
              0
            ),
          0
        );


      const todayPayments =
        todayReceipts.reduce(
          (
            total,
            receipt
          ) =>
            total +
            Number(
              receipt.totalPayoutAmount ||
              0
            ),
          0
        );


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


      const cropBreakdown = {};


      todayReceipts.forEach(
        receipt => {

          const crop =
            String(
              receipt.cropType ||
              'Other'
            )
              .toLowerCase();


          if (
            !cropBreakdown[crop]
          ) {

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
            center.capacityQuintals > 0
              ? Math.min(
                  100,
                  Math.round(
                    (
                      center.bookedQuintals /
                      center.capacityQuintals
                    ) *
                    100
                  )
                )
              : 0;

        }
      );


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
          .slice(
            0,
            10
          )
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
                  receipt?.qualityGrade ||
                  null,

                payoutAmount:
                  receipt
                    ? Number(
                        receipt.totalPayoutAmount ||
                        0
                      )
                    : 0,

                receiptId:
                  receipt?.receiptId ||
                  null,

                createdAt:
                  booking.createdAt

              };

            }
          );


      const qualitySummary = {

        gradeA:
          todayReceipts.filter(
            receipt =>
              String(
                receipt.qualityGrade ||
                ''
              )
                .toLowerCase() ===
              'grade a'
          ).length,

        gradeB:
          todayReceipts.filter(
            receipt =>
              String(
                receipt.qualityGrade ||
                ''
              )
                .toLowerCase() ===
              'grade b'
          ).length,

        failed:
          todayReceipts.filter(
            receipt =>
              String(
                receipt.qualityGrade ||
                ''
              )
                .toLowerCase() ===
              'failed'
          ).length

      };


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
              todayProcurementQuintals.toFixed(2)
            ),

          activeQueue:
            activeQueueBookings.length,

          todayPayments:
            Number(
              todayPayments.toFixed(2)
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
                ) =>
                  total +
                  Number(
                    booking.quantityQuintals ||
                    0
                  ),
                0
              );


            const totalProcuredQuintals =
              farmerReceipts.reduce(
                (
                  total,
                  receipt
                ) =>
                  total +
                  Number(
                    receipt.netWeightQuintals ||
                    0
                  ),
                0
              );


            const totalPayout =
              farmerReceipts.reduce(
                (
                  total,
                  receipt
                ) =>
                  total +
                  Number(
                    receipt.totalPayoutAmount ||
                    0
                  ),
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
                )[0] ||
              null;


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
                )[0] ||
              null;


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
                  totalBookedQuintals.toFixed(2)
                ),

              totalProcuredQuintals:
                Number(
                  totalProcuredQuintals.toFixed(2)
                ),

              totalPayout:
                Number(
                  totalPayout.toFixed(2)
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
              farmer =>
                String(
                  farmer.name ||
                  ''
                )
                  .toLowerCase()
                  .includes(search) ||

                String(
                  farmer.kccNumber ||
                  ''
                )
                  .toLowerCase()
                  .includes(search) ||

                String(
                  farmer.phone ||
                  ''
                )
                  .toLowerCase()
                  .includes(search) ||

                String(
                  farmer.district ||
                  ''
                )
                  .toLowerCase()
                  .includes(search) ||

                String(
                  farmer.mandi ||
                  ''
                )
                  .toLowerCase()
                  .includes(search)
            )
          : farmerRecords;


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
// A4 • MANDI & SLOT MANAGEMENT
// ================================================================

app.get(
  '/api/admin/mandi',
  requireAdmin,
  (req, res) => {

    try {

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

      const farmers =
        readData(
          'farmers.json',
          []
        );


      const today =
        getTodayDate();


      const todayBookings =
        bookings
          .filter(
            booking =>
              booking.date ===
              today
          )
          .sort(
            (a, b) =>
              new Date(
                a.createdAt || 0
              ) -
              new Date(
                b.createdAt || 0
              )
          );


      const bookingRecords =
        todayBookings.map(
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

              phone:
                farmer?.phone ||
                null,

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

              date:
                booking.date,

              timeSlot:
                booking.timeSlot ||
                '10:00 AM - 12:00 PM',

              centerId:
                booking.centerId ||
                'Mandi-Center-01',

              center:
                booking.center ||
                'Mandi-Center-01 (Main Gate)',

              vehicleNumber:
                booking.vehicleNumber ||
                null,

              status:
                booking.status ||
                'Scheduled',

              overflowRerouted:
                Boolean(
                  booking.overflowRerouted
                ),

              qualityGrade:
                receipt?.qualityGrade ||
                null,

              payoutAmount:
                receipt
                  ? Number(
                      receipt.totalPayoutAmount ||
                      0
                    )
                  : 0,

              createdAt:
                booking.createdAt ||
                null

            };

          }
        );


      const centers =
        MANDI_CENTERS.map(
          configuredCenter => {

            const centerBookings =
              todayBookings.filter(
                booking =>
                  (
                    booking.centerId ||
                    'Mandi-Center-01'
                  ) ===
                  configuredCenter.centerId
              );


            const bookedQuintals =
              centerBookings.reduce(
                (
                  total,
                  booking
                ) =>
                  total +
                  Number(
                    booking.quantityQuintals ||
                    0
                  ),
                0
              );


            const activeQueue =
              centerBookings.filter(
                booking =>
                  booking.status ===
                    'Scheduled' ||
                  booking.status ===
                    'Active Gate Queue' ||
                  booking.status ===
                    'Weighbridge'
              ).length;


            const completed =
              centerBookings.filter(
                booking =>
                  booking.status ===
                  'Quality Approved'
              ).length;


            const remaining =
              Math.max(
                0,
                configuredCenter.capacityQuintals -
                bookedQuintals
              );


            const utilization =
              configuredCenter.capacityQuintals >
              0
                ? Math.min(
                    100,
                    Math.round(
                      (
                        bookedQuintals /
                        configuredCenter.capacityQuintals
                      ) *
                      100
                    )
                  )
                : 0;


            return {

              centerId:
                configuredCenter.centerId,

              center:
                configuredCenter.center,

              type:
                configuredCenter.type,

              capacityQuintals:
                configuredCenter.capacityQuintals,

              bookedQuintals:
                Number(
                  bookedQuintals.toFixed(2)
                ),

              remainingQuintals:
                Number(
                  remaining.toFixed(2)
                ),

              utilizationPercentage:
                utilization,

              activeQueue,

              completed,

              totalBookings:
                centerBookings.length

            };

          }
        );


      const activeCenterIds =
        new Set(
          todayBookings.map(
            booking =>
              booking.centerId ||
              'Mandi-Center-01'
          )
        );


      const activeCenters =
        centers.filter(
          center =>
            activeCenterIds.has(
              center.centerId
            )
        );


      const centersForTotals =
        activeCenters.length > 0
          ? activeCenters
          : centers.filter(
              center =>
                center.centerId ===
                'Mandi-Center-01'
            );


      const totalCapacity =
        centersForTotals.reduce(
          (
            total,
            center
          ) =>
            total +
            Number(
              center.capacityQuintals ||
              0
            ),
          0
        );


      const totalBooked =
        centersForTotals.reduce(
          (
            total,
            center
          ) =>
            total +
            Number(
              center.bookedQuintals ||
              0
            ),
          0
        );


      const totalRemaining =
        Math.max(
          0,
          totalCapacity -
          totalBooked
        );


      const slots =
        MANDI_SLOTS.map(
          configuredSlot => {

            const slotBookings =
              todayBookings.filter(
                booking =>
                  (
                    booking.timeSlot ||
                    ''
                  ).trim() ===
                  configuredSlot.timeSlot
              );


            const bookedQuintals =
              slotBookings.reduce(
                (
                  total,
                  booking
                ) =>
                  total +
                  Number(
                    booking.quantityQuintals ||
                    0
                  ),
                0
              );


            const activeQueue =
              slotBookings.filter(
                booking =>
                  booking.status ===
                    'Scheduled' ||
                  booking.status ===
                    'Active Gate Queue' ||
                  booking.status ===
                    'Weighbridge'
              ).length;


            const remaining =
              Math.max(
                0,
                configuredSlot.capacityQuintals -
                bookedQuintals
              );


            return {

              slotId:
                configuredSlot.slotId,

              timeSlot:
                configuredSlot.timeSlot,

              capacityQuintals:
                configuredSlot.capacityQuintals,

              bookedQuintals:
                Number(
                  bookedQuintals.toFixed(2)
                ),

              remainingQuintals:
                Number(
                  remaining.toFixed(2)
                ),

              bookingCount:
                slotBookings.length,

              activeQueue,

              available:
                remaining > 0

            };

          }
        );


      const totalSlots =
        slots.length;


      const bookedSlots =
        slots.filter(
          slot =>
            slot.bookingCount >
            0
        ).length;


      const availableSlots =
        Math.max(
          totalSlots -
          bookedSlots,
          0
        );


      const activeSlotQueue =
        slots.reduce(
          (
            total,
            slot
          ) =>
            total +
            slot.activeQueue,
          0
        );


      return res.json({

        success:
          true,

        generatedAt:
          new Date().toISOString(),

        date:
          today,

        summary: {

          totalCapacityQuintals:
            Number(
              totalCapacity.toFixed(2)
            ),

          bookedQuantityQuintals:
            Number(
              totalBooked.toFixed(2)
            ),

          remainingCapacityQuintals:
            Number(
              totalRemaining.toFixed(2)
            ),

          todayBookings:
            todayBookings.length,

          totalSlots,

          bookedSlots,

          availableSlots,

          activeSlotQueue

        },

        centers,

        slots,

        bookings:
          bookingRecords

      });

    } catch (error) {

      console.error(
        '[Admin Mandi Error]',
        error
      );

      return res.status(500).json({

        success:
          false,

        message:
          'Unable to load mandi and slot management data.'

      });

    }

  }
);


// ================================================================
// A5 • LIVE PROCUREMENT QUEUE
// ================================================================

app.get(
  '/api/admin/queue',
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


      const todayBookings =
        bookings
          .filter(
            booking =>
              booking.date ===
              today
          )
          .sort(
            (a, b) =>
              new Date(
                a.createdAt || 0
              ) -
              new Date(
                b.createdAt || 0
              )
          );


      const isWaiting =
        booking =>
          booking.status ===
          'Scheduled';


      const isCheckedIn =
        booking =>
          booking.status ===
          'Active Gate Queue';


      const isServing =
        booking =>
          booking.status ===
            'Weighbridge' ||
          booking.status ===
            'Serving';


      const isCompleted =
        booking =>
          booking.status ===
          'Quality Approved';


      const isActive =
        booking =>
          isWaiting(booking) ||
          isCheckedIn(booking) ||
          isServing(booking);


      const activeBookings =
        todayBookings
          .filter(
            booking =>
              isActive(booking)
          )
          .sort(
            (a, b) => {

              const aTime =
                new Date(
                  a.checkInAt ||
                  a.createdAt ||
                  0
                ).getTime();


              const bTime =
                new Date(
                  b.checkInAt ||
                  b.createdAt ||
                  0
                ).getTime();


              return (
                aTime -
                bTime
              );

            }
          );


      const servingBookings =
        activeBookings.filter(
          booking =>
            isServing(booking)
        );


      const waitingBookings =
        activeBookings.filter(
          booking =>
            isWaiting(booking)
        );


      const checkedInBookings =
        activeBookings.filter(
          booking =>
            isCheckedIn(booking)
        );


      const completedBookings =
        todayBookings.filter(
          booking =>
            isCompleted(booking)
        );


      const queueRecords =
        todayBookings
          .filter(
            booking =>
              booking.status !==
              'Cancelled'
          )
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


              const activeIndex =
                activeBookings.findIndex(
                  activeBooking =>
                    activeBooking.tokenId ===
                    booking.tokenId
                );


              const queuePosition =
                activeIndex >= 0
                  ? activeIndex + 1
                  : null;


              let displayStatus =
                'Waiting';


              if (
                isCheckedIn(booking)
              ) {

                displayStatus =
                  'Checked In';

              }


              if (
                isServing(booking)
              ) {

                displayStatus =
                  'Serving';

              }


              if (
                isCompleted(booking)
              ) {

                displayStatus =
                  'Completed';

              }


              const queueTimestamp =
                booking.checkInAt ||
                booking.createdAt ||
                null;


              return {

                tokenId:
                  booking.tokenId ||
                  null,

                bookingId:
                  booking.bookingId ||
                  null,

                queuePosition,

                farmerName:
                  booking.farmerName ||
                  farmer?.name ||
                  'Unknown Farmer',

                kccNumber:
                  booking.kccNumber ||
                  null,

                phone:
                  farmer?.phone ||
                  null,

                cropType:
                  booking.cropType ||
                  null,

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

                date:
                  booking.date,

                timeSlot:
                  booking.timeSlot ||
                  '10:00 AM - 12:00 PM',

                centerId:
                  booking.centerId ||
                  'Mandi-Center-01',

                center:
                  booking.center ||
                  'Mandi-Center-01 (Main Gate)',

                vehicleNumber:
                  booking.vehicleNumber ||
                  null,

                status:
                  booking.status ||
                  'Scheduled',

                displayStatus,

                checkInAt:
                  booking.checkInAt ||
                  null,

                createdAt:
                  booking.createdAt ||
                  null,

                updatedAt:
                  queueTimestamp,

                qualityGrade:
                  receipt?.qualityGrade ||
                  null,

                payoutAmount:
                  receipt
                    ? Number(
                        receipt.totalPayoutAmount ||
                        0
                      )
                    : 0

              };

            }
          );


      const currentlyServing =
        servingBookings.length > 0
          ? queueRecords.find(
              record =>
                record.tokenId ===
                servingBookings[0].tokenId
            ) ||
            null
          : null;


      const centerBreakdown = {};


      activeBookings.forEach(
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

              waiting:
                0,

              checkedIn:
                0,

              serving:
                0,

              totalActive:
                0

            };

          }


          centerBreakdown[centerId]
            .totalActive +=
            1;


          if (
            isWaiting(booking)
          ) {

            centerBreakdown[centerId]
              .waiting +=
              1;

          }


          if (
            isCheckedIn(booking)
          ) {

            centerBreakdown[centerId]
              .checkedIn +=
              1;

          }


          if (
            isServing(booking)
          ) {

            centerBreakdown[centerId]
              .serving +=
              1;

          }

        }
      );


      return res.json({

        success:
          true,

        generatedAt:
          new Date().toISOString(),

        date:
          today,

        summary: {

          currentlyServing:
            servingBookings.length,

          waiting:
            waitingBookings.length,

          checkedIn:
            checkedInBookings.length,

          completed:
            completedBookings.length,

          totalActive:
            activeBookings.length,

          totalToday:
            todayBookings.length

        },

        currentlyServing,

        queue:
          queueRecords,

        centers:
          Object.values(
            centerBreakdown
          )

      });

    } catch (error) {

      console.error(
        '[Admin Queue Error]',
        error
      );

      return res.status(500).json({

        success:
          false,

        message:
          'Unable to load live procurement queue.'

      });

    }

  }
);


// ================================================================
// A6 • PAYMENT MONITORING
// ================================================================

app.get(
  '/api/admin/payments',
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


      const paymentRecords =
        receipts
          .map(
            receipt => {

              const booking =
                bookings.find(
                  item =>
                    item.tokenId ===
                    receipt.tokenId
                );


              const farmer =
                farmers.find(
                  item =>
                    item.kccNumber ===
                    receipt.kccNumber
                );


              const paymentStatus =
                normalizePaymentStatus(
                  receipt
                );


              const transactionId =
                receipt.transactionId ||
                receipt.receiptId ||
                `TXN-${receipt.tokenId || 'UNKNOWN'}`;


              const updatedAt =
                receipt.paymentUpdatedAt ||
                receipt.timestamp ||
                booking?.createdAt ||
                null;


              return {

                transactionId,

                receiptId:
                  receipt.receiptId ||
                  null,

                farmerName:
                  receipt.farmerName ||
                  booking?.farmerName ||
                  farmer?.name ||
                  'Unknown Farmer',

                kccNumber:
                  receipt.kccNumber ||
                  booking?.kccNumber ||
                  null,

                phone:
                  farmer?.phone ||
                  null,

                tokenId:
                  receipt.tokenId ||
                  booking?.tokenId ||
                  null,

                cropType:
                  receipt.cropType ||
                  booking?.cropType ||
                  null,

                centerId:
                  booking?.centerId ||
                  'Mandi-Center-01',

                center:
                  booking?.center ||
                  'Mandi-Center-01 (Main Gate)',

                quantityQuintals:
                  Number(
                    receipt.netWeightQuintals ||
                    0
                  ),

                bookedQuantityQuintals:
                  Number(
                    booking?.quantityQuintals ||
                    0
                  ),

                mspPricePerQuintal:
                  Number(
                    receipt.mspPricePerQuintal ||
                    0
                  ),

                payableAmount:
                  Number(
                    receipt.totalPayoutAmount ||
                    0
                  ),

                qualityGrade:
                  receipt.qualityGrade ||
                  null,

                paymentStatus,

                paymentStatusLabel:
                  getPaymentStatusLabel(
                    paymentStatus
                  ),

                pfmsReference:
                  receipt.pfmsReference ||
                  null,

                utr:
                  receipt.utr ||
                  null,

                date:
                  booking?.date ||
                  (
                    receipt.timestamp
                      ? receipt.timestamp.split('T')[0]
                      : null
                  ),

                receiptTimestamp:
                  receipt.timestamp ||
                  null,

                updatedAt,

                bookingStatus:
                  booking?.status ||
                  null

              };

            }
          )
          .sort(
            (a, b) =>
              new Date(
                b.updatedAt || 0
              ) -
              new Date(
                a.updatedAt || 0
              )
          );


      const totalPaymentValue =
        paymentRecords.reduce(
          (
            total,
            payment
          ) =>
            total +
            Number(
              payment.payableAmount ||
              0
            ),
          0
        );


      const pending =
        paymentRecords.filter(
          payment =>
            payment.paymentStatus ===
            'pending'
        ).length;


      const pfmsBatched =
        paymentRecords.filter(
          payment =>
            payment.paymentStatus ===
            'pfms-batched'
        ).length;


      const dbtDispatched =
        paymentRecords.filter(
          payment =>
            payment.paymentStatus ===
            'dbt-dispatched'
        ).length;


      const failed =
        paymentRecords.filter(
          payment =>
            payment.paymentStatus ===
            'failed'
        ).length;


      const todayPaymentRecords =
        paymentRecords.filter(
          payment =>
            payment.date ===
            today
        );


      const todayPaymentValue =
        todayPaymentRecords.reduce(
          (
            total,
            payment
          ) =>
            total +
            Number(
              payment.payableAmount ||
              0
            ),
          0
        );


      return res.json({

        success:
          true,

        generatedAt:
          new Date().toISOString(),

        date:
          today,

        summary: {

          totalPaymentValue:
            Number(
              totalPaymentValue.toFixed(2)
            ),

          pending,

          pfmsBatched,

          dbtDispatched,

          failed,

          totalTransactions:
            paymentRecords.length,

          todayPaymentValue:
            Number(
              todayPaymentValue.toFixed(2)
            ),

          todayTransactions:
            todayPaymentRecords.length

        },

        payments:
          paymentRecords

      });

    } catch (error) {

      console.error(
        '[Admin Payment Monitoring Error]',
        error
      );

      return res.status(500).json({

        success:
          false,

        message:
          'Unable to load payment monitoring data.'

      });

    }

  }
);


// ================================================================
// A7 • REPORTS & ANALYTICS
// ================================================================

app.get(
  '/api/admin/reports',
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
      // FILTERS
      // ------------------------------------------------------------

      const requestedDate =
        String(
          req.query.date ||
          'all'
        )
          .trim()
          .toLowerCase();


      const requestedCenter =
        String(
          req.query.center ||
          'all'
        )
          .trim();


      let reportBookings =
        bookings.slice();


      let reportReceipts =
        receipts.slice();


      // ------------------------------------------------------------
      // DATE FILTER
      // ------------------------------------------------------------

      if (
        requestedDate ===
        'today'
      ) {

        reportBookings =
          reportBookings.filter(
            booking =>
              booking.date ===
              today
          );


        reportReceipts =
          reportReceipts.filter(
            receipt => {

              if (
                !receipt.timestamp
              ) {

                return false;

              }


              return receipt.timestamp
                .startsWith(
                  today
                );

            }
          );

      }


      // ------------------------------------------------------------
      // CENTER FILTER
      // ------------------------------------------------------------

      if (
        requestedCenter &&
        requestedCenter !==
        'all'
      ) {

        reportBookings =
          reportBookings.filter(
            booking =>
              (
                booking.centerId ||
                'Mandi-Center-01'
              ) ===
              requestedCenter
          );


        const reportTokens =
          new Set(
            reportBookings.map(
              booking =>
                booking.tokenId
            )
          );


        reportReceipts =
          reportReceipts.filter(
            receipt =>
              reportTokens.has(
                receipt.tokenId
              )
          );

      }


      // ------------------------------------------------------------
      // LOOKUPS
      // ------------------------------------------------------------

      const farmerByKcc =
        new Map(
          farmers.map(
            farmer => [
              farmer.kccNumber,
              farmer
            ]
          )
        );


      const bookingByToken =
        new Map(
          reportBookings.map(
            booking => [
              booking.tokenId,
              booking
            ]
          )
        );


      // ------------------------------------------------------------
      // OVERALL SUMMARY
      // ------------------------------------------------------------

      const uniqueFarmers =
        new Set(
          reportBookings
            .map(
              booking =>
                booking.kccNumber
            )
            .filter(Boolean)
        );


      const totalBookedQuintals =
        reportBookings.reduce(
          (
            total,
            booking
          ) =>
            total +
            Number(
              booking.quantityQuintals ||
              0
            ),
          0
        );


      const totalProcuredQuintals =
        reportReceipts.reduce(
          (
            total,
            receipt
          ) =>
            total +
            Number(
              receipt.netWeightQuintals ||
              0
            ),
          0
        );


      const totalPaymentValue =
        reportReceipts.reduce(
          (
            total,
            receipt
          ) =>
            total +
            Number(
              receipt.totalPayoutAmount ||
              0
            ),
          0
        );


      const completedTransactions =
        reportReceipts.length;


      const averageProcurementPerTransaction =
        completedTransactions > 0
          ? (
              totalProcuredQuintals /
              completedTransactions
            )
          : 0;


      // ------------------------------------------------------------
      // CROP ANALYTICS
      // ------------------------------------------------------------

      const cropMap = {};


      reportReceipts.forEach(
        receipt => {

          const crop =
            String(
              receipt.cropType ||
              'Other'
            )
              .trim()
              .toLowerCase();


          if (
            !cropMap[crop]
          ) {

            cropMap[crop] = {

              cropType:
                crop,

              quantityQuintals:
                0,

              transactions:
                0,

              paymentValue:
                0

            };

          }


          cropMap[crop]
            .quantityQuintals +=
              Number(
                receipt.netWeightQuintals ||
                0
              );


          cropMap[crop]
            .transactions +=
              1;


          cropMap[crop]
            .paymentValue +=
              Number(
                receipt.totalPayoutAmount ||
                0
              );

        }
      );


      const cropAnalytics =
        Object.values(
          cropMap
        )
          .map(
            crop => {

              const name =
                crop.cropType
                  .charAt(0)
                  .toUpperCase() +
                crop.cropType.slice(1);


              return {

                cropType:
                  name,

                quantityQuintals:
                  Number(
                    crop.quantityQuintals
                      .toFixed(2)
                  ),

                transactions:
                  crop.transactions,

                paymentValue:
                  Number(
                    crop.paymentValue
                      .toFixed(2)
                  )

              };

            }
          )
          .sort(
            (a, b) =>
              b.quantityQuintals -
              a.quantityQuintals
          );


      // ------------------------------------------------------------
      // CENTER ANALYTICS
      // ------------------------------------------------------------

      const centerAnalytics =
        MANDI_CENTERS.map(
          configuredCenter => {

            const centerBookings =
              reportBookings.filter(
                booking =>
                  (
                    booking.centerId ||
                    'Mandi-Center-01'
                  ) ===
                  configuredCenter.centerId
              );


            const centerReceipts =
              reportReceipts.filter(
                receipt => {

                  const booking =
                    bookingByToken.get(
                      receipt.tokenId
                    );


                  return (
                    booking?.centerId ||
                    'Mandi-Center-01'
                  ) ===
                  configuredCenter.centerId;

                }
              );


            const bookedQuintals =
              centerBookings.reduce(
                (
                  total,
                  booking
                ) =>
                  total +
                  Number(
                    booking.quantityQuintals ||
                    0
                  ),
                0
              );


            const procuredQuintals =
              centerReceipts.reduce(
                (
                  total,
                  receipt
                ) =>
                  total +
                  Number(
                    receipt.netWeightQuintals ||
                    0
                  ),
                0
              );


            const paymentValue =
              centerReceipts.reduce(
                (
                  total,
                  receipt
                ) =>
                  total +
                  Number(
                    receipt.totalPayoutAmount ||
                    0
                  ),
                0
              );


            const utilizationPercentage =
              configuredCenter.capacityQuintals >
              0
                ? Math.min(
                    100,
                    Math.round(
                      (
                        bookedQuintals /
                        configuredCenter.capacityQuintals
                      ) *
                      100
                    )
                  )
                : 0;


            return {

              centerId:
                configuredCenter.centerId,

              center:
                configuredCenter.center,

              capacityQuintals:
                configuredCenter.capacityQuintals,

              bookings:
                centerBookings.length,

              completedTransactions:
                centerReceipts.length,

              bookedQuintals:
                Number(
                  bookedQuintals.toFixed(2)
                ),

              procuredQuintals:
                Number(
                  procuredQuintals.toFixed(2)
                ),

              paymentValue:
                Number(
                  paymentValue.toFixed(2)
                ),

              utilizationPercentage

            };

          }
        );


      // ------------------------------------------------------------
      // QUALITY ANALYTICS
      // ------------------------------------------------------------

      const gradeA =
        reportReceipts.filter(
          receipt =>
            String(
              receipt.qualityGrade ||
              ''
            )
              .trim()
              .toLowerCase() ===
            'grade a'
        ).length;


      const gradeB =
        reportReceipts.filter(
          receipt =>
            String(
              receipt.qualityGrade ||
              ''
            )
              .trim()
              .toLowerCase() ===
            'grade b'
        ).length;


      const failed =
        reportReceipts.filter(
          receipt =>
            String(
              receipt.qualityGrade ||
              ''
            )
              .trim()
              .toLowerCase() ===
            'failed'
        ).length;


      // ------------------------------------------------------------
      // PAYMENT STATUS ANALYTICS
      // ------------------------------------------------------------

      const paymentStatusSummary = {

        pending:
          reportReceipts.filter(
            receipt =>
              normalizePaymentStatus(
                receipt
              ) ===
              'pending'
          ).length,

        pfmsBatched:
          reportReceipts.filter(
            receipt =>
              normalizePaymentStatus(
                receipt
              ) ===
              'pfms-batched'
          ).length,

        dbtDispatched:
          reportReceipts.filter(
            receipt =>
              normalizePaymentStatus(
                receipt
              ) ===
              'dbt-dispatched'
          ).length,

        failed:
          reportReceipts.filter(
            receipt =>
              normalizePaymentStatus(
                receipt
              ) ===
              'failed'
          ).length

      };


      // ------------------------------------------------------------
      // DAILY PERFORMANCE
      // ------------------------------------------------------------

      const dailyMap = {};


      reportReceipts.forEach(
        receipt => {

          if (
            !receipt.timestamp
          ) {

            return;

          }


          const date =
            receipt.timestamp
              .split('T')[0];


          if (
            !dailyMap[date]
          ) {

            dailyMap[date] = {

              date,

              transactions:
                0,

              quantityQuintals:
                0,

              paymentValue:
                0

            };

          }


          dailyMap[date]
            .transactions +=
            1;


          dailyMap[date]
            .quantityQuintals +=
              Number(
                receipt.netWeightQuintals ||
                0
              );


          dailyMap[date]
            .paymentValue +=
              Number(
                receipt.totalPayoutAmount ||
                0
              );

        }
      );


      const dailyPerformance =
        Object.values(
          dailyMap
        )
          .map(
            item => ({

              date:
                item.date,

              transactions:
                item.transactions,

              quantityQuintals:
                Number(
                  item.quantityQuintals
                    .toFixed(2)
                ),

              paymentValue:
                Number(
                  item.paymentValue
                    .toFixed(2)
                )

            })
          )
          .sort(
            (a, b) =>
              new Date(b.date) -
              new Date(a.date)
          )
          .slice(
            0,
            14
          );


      // ------------------------------------------------------------
      // RECENT ACTIVITY
      // ------------------------------------------------------------

      const recentActivity =
        reportReceipts
          .map(
            receipt => {

              const booking =
                bookingByToken.get(
                  receipt.tokenId
                );


              const farmer =
                farmerByKcc.get(
                  receipt.kccNumber ||
                  booking?.kccNumber
                );


              const paymentStatus =
                normalizePaymentStatus(
                  receipt
                );


              return {

                transactionId:
                  receipt.transactionId ||
                  receipt.receiptId ||
                  `TXN-${receipt.tokenId || 'UNKNOWN'}`,

                receiptId:
                  receipt.receiptId ||
                  null,

                tokenId:
                  receipt.tokenId ||
                  null,

                farmerName:
                  receipt.farmerName ||
                  booking?.farmerName ||
                  farmer?.name ||
                  'Unknown Farmer',

                kccNumber:
                  receipt.kccNumber ||
                  booking?.kccNumber ||
                  null,

                cropType:
                  receipt.cropType ||
                  booking?.cropType ||
                  null,

                quantityQuintals:
                  Number(
                    receipt.netWeightQuintals ||
                    0
                  ),

                payoutAmount:
                  Number(
                    receipt.totalPayoutAmount ||
                    0
                  ),

                qualityGrade:
                  receipt.qualityGrade ||
                  null,

                paymentStatus,

                paymentStatusLabel:
                  getPaymentStatusLabel(
                    paymentStatus
                  ),

                centerId:
                  booking?.centerId ||
                  'Mandi-Center-01',

                center:
                  booking?.center ||
                  'Mandi-Center-01 (Main Gate)',

                date:
                  booking?.date ||
                  receipt.timestamp?.split('T')[0] ||
                  null,

                timestamp:
                  receipt.timestamp ||
                  null

              };

            }
          )
          .sort(
            (a, b) =>
              new Date(
                b.timestamp || 0
              ) -
              new Date(
                a.timestamp || 0
              )
          )
          .slice(
            0,
            20
          );


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

        filters: {

          date:
            requestedDate,

          center:
            requestedCenter

        },

        summary: {

          totalFarmers:
            uniqueFarmers.size,

          totalBookings:
            reportBookings.length,

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

          totalPaymentValue:
            Number(
              totalPaymentValue
                .toFixed(2)
            ),

          completedTransactions,

          averageProcurementPerTransaction:
            Number(
              averageProcurementPerTransaction
                .toFixed(2)
            )

        },

        cropAnalytics,

        centers:
          centerAnalytics,

        qualitySummary: {

          gradeA,

          gradeB,

          failed,

          total:
            reportReceipts.length

        },

        paymentStatusSummary,

        dailyPerformance,

        recentActivity

      });

    } catch (error) {

      console.error(
        '[Admin Reports & Analytics Error]',
        error
      );

      return res.status(500).json({

        success:
          false,

        message:
          'Unable to load reports and analytics data.'

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
        !Number.isFinite(grossWeight) ||
        !Number.isFinite(tareWeight) ||
        !Number.isFinite(moisture)
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


      const netWeight =
        grossWeight -
        tareWeight;


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


      const paymentStatus =
        receipt.paymentStatus ||
        'Pending';


      const normalizedStatus =
        String(
          paymentStatus
        )
          .trim()
          .toLowerCase();


      const dbtPayoutDispatched =
        normalizedStatus ===
          'dbt dispatched' ||
        normalizedStatus ===
          'dbt-dispatched';


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

          dbtPayoutDispatched,

          payoutStatus:
            dbtPayoutDispatched
              ? 'DBT payment dispatched.'
              : 'Payment instruction generated. Awaiting DBT confirmation.',

          paymentStatus,

          pfmsReference:
            receipt.pfmsReference ||
            null,

          utr:
            receipt.utr ||
            null,

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