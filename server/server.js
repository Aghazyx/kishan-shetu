require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5050;

const ADMIN_USERNAME =
  process.env.ADMIN_USERNAME || 'admin';

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || 'kisan@2026';

const adminSessions = new Map();

app.use(cors());
app.use(express.json());

/* ============================================================
   PROJECT / FRONTEND HOSTING
   ============================================================ */

const PROJECT_ROOT = path.resolve(__dirname, '..');
const FARMER_DIR = path.join(PROJECT_ROOT, 'farmer');
const ADMIN_DIR = path.join(PROJECT_ROOT, 'admin');

if (fs.existsSync(FARMER_DIR)) {
  app.use('/farmer', express.static(FARMER_DIR));
}

if (fs.existsSync(ADMIN_DIR)) {
  app.use('/admin', express.static(ADMIN_DIR));
}

app.get('/', (req, res) => {
  if (
    fs.existsSync(
      path.join(FARMER_DIR, 'portal-gateway.html')
    )
  ) {
    return res.redirect('/farmer/portal-gateway.html');
  }

  if (
    fs.existsSync(
      path.join(FARMER_DIR, 'index.html')
    )
  ) {
    return res.redirect('/farmer/index.html');
  }

  return res.json({
    success: true,
    message:
      'Kisan Setu Procurement Backend is running.'
  });
});

/* ============================================================
   DATA STORAGE
   ============================================================ */

const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, {
    recursive: true
  });
}

const now = () =>
  new Date().toISOString();

const today = () => {
  const current = new Date();

  const year = current.getFullYear();
  const month = String(
    current.getMonth() + 1
  ).padStart(2, '0');
  const day = String(
    current.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const num = (
  value,
  fallback = 0
) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

const round2 = value =>
  Number(num(value).toFixed(2));

const crop = value =>
  String(value || 'wheat')
    .trim()
    .toLowerCase();

/* ============================================================
   DATE HELPERS

   IMPORTANT:
   Do not use toISOString() to validate a calendar date.
   The application operates on local calendar dates and
   converting midnight to UTC can move an IST date backward.
   ============================================================ */

const isValidDateString = value => {
  if (typeof value !== 'string') {
    return false;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [
    yearString,
    monthString,
    dayString
  ] = value.split('-');

  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);

  const parsed = new Date(
    year,
    month - 1,
    day
  );

  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
};

const isPastDate = value =>
  value < today();

const readData = (
  file,
  fallback = []
) => {
  try {
    const filePath = path.join(
      DATA_DIR,
      file
    );

    if (!fs.existsSync(filePath)) {
      return fallback;
    }

    return JSON.parse(
      fs.readFileSync(
        filePath,
        'utf8'
      )
    );
  } catch (error) {
    console.error(
      `[DB Read Error] ${file}:`,
      error
    );

    return fallback;
  }
};

const writeData = (
  file,
  data
) => {
  try {
    const filePath = path.join(
      DATA_DIR,
      file
    );

    const tempPath = `${filePath}.tmp`;

    fs.writeFileSync(
      tempPath,
      JSON.stringify(
        data,
        null,
        2
      )
    );

    fs.renameSync(
      tempPath,
      filePath
    );

    return true;
  } catch (error) {
    console.error(
      `[DB Write Error] ${file}:`,
      error
    );

    return false;
  }
};

/* ============================================================
   ID / TOKEN HELPERS
   ============================================================ */

const generateId = prefix =>
  `${prefix}-${Date.now()}-${crypto
    .randomBytes(3)
    .toString('hex')
    .toUpperCase()}`;

const generateUniqueToken = bookings => {
  let tokenId;

  do {
    tokenId =
      `TKN-${Date.now()
        .toString()
        .slice(-8)}-${crypto
        .randomBytes(2)
        .toString('hex')
        .toUpperCase()}`;
  } while (
    bookings.some(
      booking =>
        booking.tokenId === tokenId
    )
  );

  return tokenId;
};

/* ============================================================
   MSP / MANDI CONFIGURATION
   ============================================================ */

const MSP_RATES = {
  wheat: 2585,
  paddy: 2441
};

const MANDI_CENTERS = [
  {
    centerId: 'Mandi-Center-01',
    center:
      'Mandi-Center-01 (Main Gate)',
    capacityQuintals: 500,
    type:
      'Primary Procurement Center',
    latitude: num(
      process.env.MANDI_CENTER_01_LAT,
      30.702877
    ),
    longitude: num(
      process.env.MANDI_CENTER_01_LNG,
      76.220222
    ),
    geofenceRadiusMeters: num(
      process.env.MANDI_CENTER_01_RADIUS,
      500
    )
  },
  {
    centerId: 'Mandi-Center-02',
    center:
      'Mandi-Center-02 (Nearby Overflow Facility)',
    capacityQuintals: 500,
    type:
      'Overflow Procurement Center',
    latitude: num(
      process.env.MANDI_CENTER_02_LAT,
      30.702877
    ),
    longitude: num(
      process.env.MANDI_CENTER_02_LNG,
      76.220222
    ),
    geofenceRadiusMeters: num(
      process.env.MANDI_CENTER_02_RADIUS,
      500
    )
  }
];

const MANDI_SLOTS = [
  '08:00 AM - 10:00 AM',
  '10:00 AM - 12:00 PM',
  '12:00 PM - 02:00 PM',
  '02:00 PM - 04:00 PM',
  '04:00 PM - 06:00 PM',
  '06:00 PM - 08:00 PM',
  '08:00 PM - 10:00 PM',
  '10:00 PM - 12:00 AM',
  '12:00 AM - 02:00 AM',
  '02:00 AM - 04:00 AM'
].map(
  (timeSlot, index) => ({
    slotId:
      `SLOT-${String(
        index + 1
      ).padStart(2, '0')}`,
    timeSlot,
    capacityQuintals: 50
  })
);

const getCenter = centerId =>
  MANDI_CENTERS.find(
    center =>
      center.centerId === centerId
  ) || null;

const getSlot = timeSlot =>
  MANDI_SLOTS.find(
    slot =>
      slot.timeSlot === timeSlot
  ) || null;

const getBookingQuantity = booking =>
  num(
    booking?.estimatedQuantityQuintals ??
      booking?.quantityQuintals ??
      booking?.quantity,
    0
  );

const getReceiptQuantity = receipt =>
  num(
    receipt?.actualQuantityQuintals ??
      receipt?.netWeightQuintals ??
      receipt?.quantityQuintals,
    0
  );

/* ============================================================
   BOOKING STATUS / AVAILABILITY
   ============================================================ */

const BOOKING_OCCUPIES_SLOT = [
  'Scheduled',
  'Active Gate Queue',
  'Weighbridge',
  'Serving'
];

const bookingOccupiesSlot = booking =>
  BOOKING_OCCUPIES_SLOT.includes(
    booking?.status
  );

const getCenterIdForBooking = booking =>
  booking?.centerId ||
  MANDI_CENTERS[0].centerId;

const getSlotBookings = (
  bookings,
  date,
  centerId,
  timeSlot
) =>
  bookings.filter(
    booking =>
      booking.date === date &&
      getCenterIdForBooking(
        booking
      ) === centerId &&
      String(
        booking.timeSlot || ''
      ).trim() ===
        String(
          timeSlot || ''
        ).trim() &&
      bookingOccupiesSlot(
        booking
      )
  );

const getBookedQuantityForSlot = (
  bookings,
  date,
  centerId,
  timeSlot
) =>
  getSlotBookings(
    bookings,
    date,
    centerId,
    timeSlot
  ).reduce(
    (total, booking) =>
      total +
      getBookingQuantity(
        booking
      ),
    0
  );

const getSlotAvailability = (
  bookings,
  date,
  center,
  slot,
  requestedQuantity = null
) => {
  const slotBookings =
    getSlotBookings(
      bookings,
      date,
      center.centerId,
      slot.timeSlot
    );

  const bookedQuintals =
    slotBookings.reduce(
      (total, booking) =>
        total +
        getBookingQuantity(
          booking
        ),
      0
    );

  const remainingQuintals =
    Math.max(
      0,
      slot.capacityQuintals -
        bookedQuintals
    );

  let status = 'available';

  if (remainingQuintals <= 0) {
    status = 'full';
  } else if (slotBookings.length > 0) {
    status = 'partially-booked';
  }

  const availability = {
    date,

    centerId:
      center.centerId,

    center:
      center.center,

    slotId:
      slot.slotId,

    timeSlot:
      slot.timeSlot,

    capacityQuintals:
      slot.capacityQuintals,

    bookedQuintals:
      round2(
        bookedQuintals
      ),

    remainingQuintals:
      round2(
        remainingQuintals
      ),

    bookingCount:
      slotBookings.length,

    hasBookings:
      slotBookings.length > 0,

    booked:
      slotBookings.length > 0,

    full:
      remainingQuintals <= 0,

    available:
      remainingQuintals > 0,

    status
  };

  if (
    requestedQuantity !== null
  ) {
    availability.requestedQuantityQuintals =
      round2(
        requestedQuantity
      );

    availability.canAcceptRequestedQuantity =
      requestedQuantity > 0 &&
      requestedQuantity <=
        remainingQuintals;
  }

  return availability;
};

/* ============================================================
   PAYMENT HELPERS
   ============================================================ */

const getPaymentStatus = payment => {
  const status =
    String(
      payment?.status ??
        payment?.paymentStatus ??
        'pending'
    )
      .trim()
      .toLowerCase();

  if (
    [
      'pfms batched',
      'pfms-batched',
      'pfms_batched'
    ].includes(status)
  ) {
    return 'pfms-batched';
  }

  if (
    [
      'dbt dispatched',
      'dbt-dispatched',
      'dbt_dispatched'
    ].includes(status)
  ) {
    return 'dbt-dispatched';
  }

  if (status === 'failed') {
    return 'failed';
  }

  return 'pending';
};

const getPaymentStatusLabel = status => {
  if (status === 'pfms-batched') {
    return 'PFMS Batched';
  }

  if (status === 'dbt-dispatched') {
    return 'DBT Dispatched';
  }

  if (status === 'failed') {
    return 'Failed';
  }

  return 'Pending';
};

/* ============================================================
   FARMER HELPERS
   ============================================================ */

const findFarmer = (
  farmers,
  kccNumber,
  farmerId
) =>
  farmers.find(
    farmer =>
      (
        farmerId &&
        (
          farmer.farmerId === farmerId ||
          farmer.id === farmerId
        )
      ) ||
      (
        kccNumber &&
        farmer.kccNumber === kccNumber
      )
  );

/* ============================================================
   AUDIT TRAIL
   ============================================================ */

const appendAuditEvent = (
  eventType,
  entityType,
  entityId,
  payload = {}
) => {
  const audit =
    readData(
      'audit.json',
      []
    );

  const previousHash =
    audit.length > 0
      ? audit[
          audit.length - 1
        ].hash
      : 'GENESIS';

  const event = {
    auditId:
      generateId('AUD'),
    eventType,
    entityType,
    entityId,
    timestamp:
      now(),
    payload,
    previousHash
  };

  event.hash =
    crypto
      .createHash('sha256')
      .update(
        JSON.stringify(event)
      )
      .digest('hex');

  audit.push(event);

  writeData(
    'audit.json',
    audit
  );

  return event;
};

/* ============================================================
   GEOFENCE
   ============================================================ */

const haversineDistanceMeters = (
  latitude1,
  longitude1,
  latitude2,
  longitude2
) => {
  const earthRadiusMeters =
    6371000;

  const radians = degrees =>
    degrees *
    Math.PI /
    180;

  const deltaLatitude =
    radians(
      latitude2 -
        latitude1
    );

  const deltaLongitude =
    radians(
      longitude2 -
        longitude1
    );

  const a =
    Math.sin(
      deltaLatitude / 2
    ) ** 2 +
    Math.cos(
      radians(latitude1)
    ) *
      Math.cos(
        radians(latitude2)
      ) *
      Math.sin(
        deltaLongitude / 2
      ) ** 2;

  return (
    earthRadiusMeters *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
};

/* ============================================================
   ADMIN SESSION
   ============================================================ */

const getAdminSession = req =>
  adminSessions.get(
    req.headers[
      'x-admin-session'
    ]
  ) || null;

const requireAdmin = (
  req,
  res,
  next
) => {
  const session =
    getAdminSession(req);

  if (!session) {
    return res.status(401).json({
      success: false,
      authenticated: false,
      message:
        'Valid administrator session required.'
    });
  }

  req.adminSession = session;

  next();
};

/* ============================================================
   BOOKING STATUS
   ============================================================ */

const ACTIVE_STATUSES = [
  'Scheduled',
  'Active Gate Queue',
  'Weighbridge',
  'Serving'
];

const QUEUE_STATUSES = [
  'Active Gate Queue',
  'Weighbridge',
  'Serving'
];

const COMPLETED_STATUS =
  'Quality Approved';

/* ============================================================
   DEMO FARMER
   ============================================================ */

if (
  !fs.existsSync(
    path.join(
      DATA_DIR,
      'farmers.json'
    )
  )
) {
  writeData(
    'farmers.json',
    [
      {
        id:
          'FRM-DEMO-001',

        farmerId:
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

        crops: [
          'Wheat',
          'Paddy'
        ],

        verifiedBank:
          'State Bank of India (A/C ****3312)',

        verificationStatus:
          'VERIFIED',

        createdAt:
          now()
      }
    ]
  );
}

/* ============================================================
   ADMIN AUTHENTICATION
   ============================================================ */

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
          success: false,
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
          success: false,
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
            now()
        }
      );

      return res.json({
        success: true,
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
        success: false,
        message:
          'Administrator authentication failed.'
      });
    }
  }
);

app.get(
  '/api/admin/session',
  requireAdmin,
  (req, res) => {
    return res.json({
      success: true,
      authenticated:
        true,
      admin: {
        username:
          req.adminSession
            .username,
        role:
          req.adminSession
            .role
      },
      sessionCreatedAt:
        req.adminSession
          .createdAt
    });
  }
);

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
      success: true,
      message:
        'Administrator session ended.'
    });
  }
);

/* ============================================================
   ADMIN DASHBOARD
   ============================================================ */

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

      const currentDate =
        today();

      const todayBookings =
        bookings.filter(
          booking =>
            booking.date ===
            currentDate
        );

      const todayReceipts =
        receipts.filter(
          receipt =>
            receipt.timestamp &&
            receipt.timestamp.startsWith(
              currentDate
            )
        );

      const cropBreakdown = {};

      todayReceipts.forEach(
        receipt => {
          const cropType =
            crop(
              receipt.cropType
            );

          if (
            !cropBreakdown[
              cropType
            ]
          ) {
            cropBreakdown[
              cropType
            ] = {
              quantityQuintals:
                0,
              transactions:
                0,
              amount:
                0
            };
          }

          cropBreakdown[
            cropType
          ].quantityQuintals +=
            getReceiptQuantity(
              receipt
            );

          cropBreakdown[
            cropType
          ].transactions += 1;

          cropBreakdown[
            cropType
          ].amount +=
            num(
              receipt.totalPayoutAmount
            );
        }
      );

      const centers =
        MANDI_CENTERS.map(
          configuredCenter => {
            const centerBookings =
              todayBookings.filter(
                booking =>
                  getCenterIdForBooking(
                    booking
                  ) ===
                  configuredCenter.centerId
              );

            const booked =
              centerBookings.reduce(
                (
                  total,
                  booking
                ) =>
                  total +
                  getBookingQuantity(
                    booking
                  ),
                0
              );

            return {
              centerId:
                configuredCenter.centerId,

              center:
                configuredCenter.center,

              capacityQuintals:
                configuredCenter.capacityQuintals,

              bookedQuintals:
                round2(booked),

              remainingQuintals:
                round2(
                  Math.max(
                    0,
                    configuredCenter.capacityQuintals -
                      booked
                  )
                ),

              activeTokens:
                centerBookings.filter(
                  booking =>
                    ACTIVE_STATUSES.includes(
                      booking.status
                    )
                ).length,

              completedTokens:
                centerBookings.filter(
                  booking =>
                    booking.status ===
                    COMPLETED_STATUS
                ).length,

              utilizationPercentage:
                configuredCenter.capacityQuintals
                  ? Math.min(
                      100,
                      Math.round(
                        (
                          booked /
                          configuredCenter.capacityQuintals
                        ) *
                        100
                      )
                    )
                  : 0
            };
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
          .slice(0, 10)
          .map(booking => {
            const farmer =
              findFarmer(
                farmers,
                booking.kccNumber,
                booking.farmerId
              );

            const receipt =
              receipts.find(
                item =>
                  item.tokenId ===
                  booking.tokenId
              );

            return {
              tokenId:
                booking.tokenId,

              bookingId:
                booking.bookingId,

              farmerId:
                booking.farmerId ||
                farmer?.farmerId ||
                null,

              farmerName:
                booking.farmerName ||
                farmer?.name ||
                'Unknown Farmer',

              kccNumber:
                booking.kccNumber,

              cropType:
                booking.cropType,

              bookedQuantityQuintals:
                getBookingQuantity(
                  booking
                ),

              actualQuantityQuintals:
                receipt
                  ? getReceiptQuantity(
                      receipt
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
                  ? num(
                      receipt.totalPayoutAmount
                    )
                  : 0,

              receiptId:
                receipt?.receiptId ||
                null,

              paymentStatus:
                receipt?.paymentStatus ||
                null,

              createdAt:
                booking.createdAt
            };
          });

      return res.json({
        success: true,

        generatedAt:
          now(),

        date:
          currentDate,

        metrics: {
          registeredFarmers:
            farmers.length,

          todayBookings:
            todayBookings.length,

          todayProcurementQuintals:
            round2(
              todayReceipts.reduce(
                (
                  total,
                  receipt
                ) =>
                  total +
                  getReceiptQuantity(
                    receipt
                  ),
                0
              )
            ),

          activeQueue:
            todayBookings.filter(
              booking =>
                QUEUE_STATUSES.includes(
                  booking.status
                )
            ).length,

          todayPayments:
            round2(
              todayReceipts.reduce(
                (
                  total,
                  receipt
                ) =>
                  total +
                  num(
                    receipt.totalPayoutAmount
                  ),
                0
              )
            ),

          completedTransactions:
            todayReceipts.length
        },

        cropBreakdown,

        centers,

        qualitySummary: {
          gradeA:
            todayReceipts.filter(
              receipt =>
                String(
                  receipt.qualityGrade ||
                    ''
                ).toLowerCase() ===
                'grade a'
            ).length,

          gradeB:
            todayReceipts.filter(
              receipt =>
                String(
                  receipt.qualityGrade ||
                    ''
                ).toLowerCase() ===
                'grade b'
            ).length,

          failed:
            todayReceipts.filter(
              receipt =>
                String(
                  receipt.qualityGrade ||
                    ''
                ).toLowerCase() ===
                'failed'
            ).length
        },

        recentTransactions
      });
    } catch (error) {
      console.error(
        '[Admin Dashboard Error]',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Unable to load administration dashboard.'
      });
    }
  }
);

/* ============================================================
   ADMIN FARMER MANAGEMENT
   ============================================================ */

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
        farmers.map(farmer => {
          const farmerBookings =
            bookings.filter(
              booking =>
                booking.farmerId ===
                  farmer.farmerId ||
                booking.kccNumber ===
                  farmer.kccNumber
            );

          const farmerReceipts =
            receipts.filter(
              receipt =>
                receipt.farmerId ===
                  farmer.farmerId ||
                receipt.kccNumber ===
                  farmer.kccNumber
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

            farmerId:
              farmer.farmerId ||
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
              num(
                farmer.landHoldingAcres
              ),

            mandi:
              farmer.mandi,

            crops:
              farmer.crops || [],

            verifiedBank:
              farmer.verifiedBank,

            registeredAt:
              farmer.createdAt,

            totalBookings:
              farmerBookings.length,

            activeBookings:
              farmerBookings.filter(
                booking =>
                  QUEUE_STATUSES.includes(
                    booking.status
                  ) ||
                  booking.status ===
                    'Scheduled'
              ).length,

            completedTransactions:
              farmerReceipts.length,

            totalBookedQuintals:
              round2(
                farmerBookings.reduce(
                  (
                    total,
                    booking
                  ) =>
                    total +
                    getBookingQuantity(
                      booking
                    ),
                  0
                )
              ),

            totalProcuredQuintals:
              round2(
                farmerReceipts.reduce(
                  (
                    total,
                    receipt
                  ) =>
                    total +
                    getReceiptQuantity(
                      receipt
                    ),
                  0
                )
              ),

            totalPayout:
              round2(
                farmerReceipts.reduce(
                  (
                    total,
                    receipt
                  ) =>
                    total +
                    num(
                      receipt.totalPayoutAmount
                    ),
                  0
                )
              ),

            latestBooking:
              latestBooking
                ? {
                    bookingId:
                      latestBooking.bookingId,

                    tokenId:
                      latestBooking.tokenId,

                    date:
                      latestBooking.date,

                    timeSlot:
                      latestBooking.timeSlot,

                    cropType:
                      latestBooking.cropType,

                    quantityQuintals:
                      getBookingQuantity(
                        latestBooking
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
                      getReceiptQuantity(
                        latestReceipt
                      ),

                    qualityGrade:
                      latestReceipt.qualityGrade,

                    totalPayoutAmount:
                      num(
                        latestReceipt.totalPayoutAmount
                      ),

                    timestamp:
                      latestReceipt.timestamp
                  }
                : null
          };
        });

      const search =
        String(
          req.query.search || ''
        )
          .trim()
          .toLowerCase();

      const filteredFarmers =
        search
          ? farmerRecords.filter(
              farmer =>
                [
                  farmer.name,
                  farmer.kccNumber,
                  farmer.phone,
                  farmer.district,
                  farmer.mandi
                ].some(
                  value =>
                    String(
                      value || ''
                    )
                      .toLowerCase()
                      .includes(search)
                )
            )
          : farmerRecords;

      return res.json({
        success: true,

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
        success: false,
        message:
          'Unable to load farmer management data.'
      });
    }
  }
);

/* ============================================================
   ADMIN MANDI MANAGEMENT
   ============================================================ */

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

      const currentDate =
        today();

      const todayBookings =
        bookings
          .filter(
            booking =>
              booking.date ===
              currentDate
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
              findFarmer(
                farmers,
                booking.kccNumber,
                booking.farmerId
              );

            const receipt =
              receipts.find(
                item =>
                  item.tokenId ===
                  booking.tokenId
              );

            return {
              tokenId:
                booking.tokenId,

              bookingId:
                booking.bookingId,

              farmerId:
                booking.farmerId ||
                farmer?.farmerId ||
                null,

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
                getBookingQuantity(
                  booking
                ),

              actualQuantityQuintals:
                receipt
                  ? getReceiptQuantity(
                      receipt
                    )
                  : null,

              date:
                booking.date,

              timeSlot:
                booking.timeSlot,

              centerId:
                getCenterIdForBooking(
                  booking
                ),

              center:
                booking.center ||
                MANDI_CENTERS[0].center,

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
                  ? num(
                      receipt.totalPayoutAmount
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
                  getCenterIdForBooking(
                    booking
                  ) ===
                  configuredCenter.centerId
              );

            const booked =
              centerBookings.reduce(
                (
                  total,
                  booking
                ) =>
                  total +
                  getBookingQuantity(
                    booking
                  ),
                0
              );

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
                round2(booked),

              remainingQuintals:
                round2(
                  Math.max(
                    0,
                    configuredCenter.capacityQuintals -
                      booked
                  )
                ),

              utilizationPercentage:
                configuredCenter.capacityQuintals
                  ? Math.min(
                      100,
                      Math.round(
                        (
                          booked /
                          configuredCenter.capacityQuintals
                        ) *
                        100
                      )
                    )
                  : 0,

              activeQueue:
                centerBookings.filter(
                  booking =>
                    QUEUE_STATUSES.includes(
                      booking.status
                    )
                ).length,

              completed:
                centerBookings.filter(
                  booking =>
                    booking.status ===
                    COMPLETED_STATUS
                ).length,

              totalBookings:
                centerBookings.length
            };
          }
        );

      const slots =
        MANDI_SLOTS.map(
          configuredSlot => {
            const slotBookings =
              todayBookings.filter(
                booking =>
                  String(
                    booking.timeSlot || ''
                  ).trim() ===
                  configuredSlot.timeSlot
              );

            const booked =
              slotBookings.reduce(
                (
                  total,
                  booking
                ) =>
                  total +
                  getBookingQuantity(
                    booking
                  ),
                0
              );

            return {
              slotId:
                configuredSlot.slotId,

              timeSlot:
                configuredSlot.timeSlot,

              capacityQuintals:
                configuredSlot.capacityQuintals,

              bookedQuintals:
                round2(booked),

              remainingQuintals:
                round2(
                  Math.max(
                    0,
                    configuredSlot.capacityQuintals -
                      booked
                  )
                ),

              bookingCount:
                slotBookings.length,

              activeQueue:
                slotBookings.filter(
                  booking =>
                    QUEUE_STATUSES.includes(
                      booking.status
                    )
                ).length,

              available:
                booked <
                configuredSlot.capacityQuintals
            };
          }
        );

      const totalCapacity =
        MANDI_CENTERS.reduce(
          (
            total,
            center
          ) =>
            total +
            center.capacityQuintals,
          0
        );

      const totalBooked =
        centers.reduce(
          (
            total,
            center
          ) =>
            total +
            center.bookedQuintals,
          0
        );

      return res.json({
        success: true,

        generatedAt:
          now(),

        date:
          currentDate,

        summary: {
          totalCapacityQuintals:
            round2(totalCapacity),

          bookedQuantityQuintals:
            round2(totalBooked),

          remainingCapacityQuintals:
            round2(
              Math.max(
                0,
                totalCapacity -
                  totalBooked
              )
            ),

          todayBookings:
            todayBookings.length,

          totalSlots:
            slots.length,

          bookedSlots:
            slots.filter(
              slot =>
                slot.bookingCount > 0
            ).length,

          availableSlots:
            slots.filter(
              slot =>
                slot.available
            ).length,

          activeSlotQueue:
            slots.reduce(
              (
                total,
                slot
              ) =>
                total +
                slot.activeQueue,
              0
            )
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
        success: false,
        message:
          'Unable to load mandi and slot management data.'
      });
    }
  }
);

/* ============================================================
   FARMER SLOT AVAILABILITY
   ============================================================ */

app.get(
  '/api/slots/availability',
  (req, res) => {
    try {
      const requestedDate =
        String(
          req.query.date ||
            today()
        ).trim();

      const requestedCenterId =
        String(
          req.query.centerId ||
            ''
        ).trim();

      const requestedQuantityRaw =
        req.query.quantityQuintals;

      let requestedQuantity = null;

      if (
        requestedQuantityRaw !==
        undefined &&
        requestedQuantityRaw !==
        ''
      ) {
        requestedQuantity =
          num(
            requestedQuantityRaw,
            NaN
          );

        if (
          !Number.isFinite(
            requestedQuantity
          ) ||
          requestedQuantity <= 0
        ) {
          return res.status(400).json({
            success: false,

            message:
              'quantityQuintals must be a valid positive number.'
          });
        }
      }

      if (
        !isValidDateString(
          requestedDate
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            'Date must be in YYYY-MM-DD format.'
        });
      }

      if (
        isPastDate(
          requestedDate
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            'Slot availability cannot be requested for a past date.'
        });
      }

      if (
        requestedCenterId &&
        !getCenter(
          requestedCenterId
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            'Invalid mandi center.'
        });
      }

      const bookings =
        readData(
          'bookings.json',
          []
        );

      const centersToCheck =
        requestedCenterId
          ? MANDI_CENTERS.filter(
              center =>
                center.centerId ===
                requestedCenterId
            )
          : MANDI_CENTERS;

      const availability =
        centersToCheck.flatMap(
          center =>
            MANDI_SLOTS.map(
              slot =>
                getSlotAvailability(
                  bookings,
                  requestedDate,
                  center,
                  slot,
                  requestedQuantity
                )
            )
        );

      const availableSlots =
        availability.filter(
          slot =>
            slot.available
        );

      const fullSlots =
        availability.filter(
          slot =>
            slot.full
        );

      const bookedSlots =
        availability.filter(
          slot =>
            slot.hasBookings
        );

      const partiallyBookedSlots =
        availability.filter(
          slot =>
            slot.status ===
            'partially-booked'
        );

      const quantityAcceptingSlots =
        requestedQuantity !== null
          ? availability.filter(
              slot =>
                slot.canAcceptRequestedQuantity
            )
          : availableSlots;

      return res.json({
        success: true,

        generatedAt:
          now(),

        date:
          requestedDate,

        centerId:
          requestedCenterId ||
          null,

        requestedQuantityQuintals:
          requestedQuantity,

        summary: {
          totalSlots:
            availability.length,

          availableSlots:
            availableSlots.length,

          partiallyBookedSlots:
            partiallyBookedSlots.length,

          fullSlots:
            fullSlots.length,

          bookedSlots:
            bookedSlots.length,

          quantityAcceptingSlots:
            quantityAcceptingSlots.length
        },

        availability
      });
    } catch (error) {
      console.error(
        '[Slot Availability Error]',
        error
      );

      return res.status(500).json({
        success: false,

        message:
          'Unable to load slot availability.'
      });
    }
  }
);

/* ============================================================
   SLOT BOOKING
   ============================================================ */

app.post(
  '/api/slots/book',
  (req, res) => {
    try {
      const {
        kccNumber,
        farmerId,
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
          success: false,

          message:
            'KCC Number, crop type and quantity are required.'
        });
      }

      const quantity =
        num(
          quantityQuintals,
          NaN
        );

      if (
        !Number.isFinite(
          quantity
        ) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            'Quantity must be a valid positive number.'
        });
      }

      if (
        quantity > 500
      ) {
        return res.status(400).json({
          success: false,

          message:
            'A single booking cannot exceed 500 quintals.'
        });
      }

      const bookingDate =
        String(
          preferredDate ||
            today()
        ).trim();

      if (
        !isValidDateString(
          bookingDate
        )
      ) {
        return res.status(400).json({
          success: false,

          code:
            'INVALID_DATE',

          message:
            'Preferred date must be in YYYY-MM-DD format.'
        });
      }

      if (
        isPastDate(
          bookingDate
        )
      ) {
        return res.status(400).json({
          success: false,

          code:
            'PAST_DATE',

          message:
            'A procurement slot cannot be booked for a past date.'
        });
      }

      const requestedCenter =
        centerId
          ? getCenter(centerId)
          : MANDI_CENTERS[0];

      if (!requestedCenter) {
        return res.status(400).json({
          success: false,

          message:
            'Invalid mandi center.'
        });
      }

      const requestedSlot =
        timeSlot
          ? getSlot(timeSlot)
          : MANDI_SLOTS[1];

      if (!requestedSlot) {
        return res.status(400).json({
          success: false,

          message:
            'Invalid time slot.'
        });
      }

      if (
        quantity >
        requestedSlot.capacityQuintals
      ) {
        return res.status(400).json({
          success: false,

          code:
            'SLOT_QUANTITY_EXCEEDED',

          message:
            `The selected time slot can accept a maximum of ${requestedSlot.capacityQuintals} quintals per booking.`
        });
      }

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
        findFarmer(
          farmers,
          kccNumber,
          farmerId
        );

      if (!farmer) {
        return res.status(404).json({
          success: false,

          message:
            'Farmer is not registered. Complete verification before booking.'
        });
      }

      /* --------------------------------------------------------
         ONE ACTIVE BOOKING PER FARMER PER DATE
         -------------------------------------------------------- */

      const duplicateBooking =
        bookings.find(
          booking =>
            (
              booking.farmerId ===
                farmer.farmerId ||
              booking.kccNumber ===
                farmer.kccNumber
            ) &&
            booking.date ===
              bookingDate &&
            bookingOccupiesSlot(
              booking
            )
        );

      if (
        duplicateBooking
      ) {
        return res.status(409).json({
          success: false,

          code:
            'FARMER_DATE_ALREADY_BOOKED',

          message:
            'This farmer already has an active booking for this date.',

          booking:
            duplicateBooking
        });
      }

      /* --------------------------------------------------------
         ACTIVE BOOKINGS FOR THIS DATE ONLY
         -------------------------------------------------------- */

      const activeBookings =
        bookings.filter(
          booking =>
            booking.date ===
              bookingDate &&
            bookingOccupiesSlot(
              booking
            )
        );

      const getBookedAtCenter =
        targetCenterId =>
          activeBookings
            .filter(
              booking =>
                getCenterIdForBooking(
                  booking
                ) ===
                targetCenterId
            )
            .reduce(
              (
                total,
                booking
              ) =>
                total +
                getBookingQuantity(
                  booking
                ),
              0
            );

      const getBookedAtSlot =
        (
          targetCenterId,
          targetTimeSlot
        ) =>
          activeBookings
            .filter(
              booking =>
                getCenterIdForBooking(
                  booking
                ) ===
                  targetCenterId &&
                String(
                  booking.timeSlot ||
                    ''
                ).trim() ===
                  targetTimeSlot
            )
            .reduce(
              (
                total,
                booking
              ) =>
                total +
                getBookingQuantity(
                  booking
                ),
              0
            );

      let assignedCenter =
        requestedCenter;

      let overflowRerouted =
        false;

      /* --------------------------------------------------------
         CENTER CAPACITY
         -------------------------------------------------------- */

      if (
        getBookedAtCenter(
          assignedCenter.centerId
        ) +
          quantity >
        assignedCenter.capacityQuintals
      ) {
        const overflowCenter =
          MANDI_CENTERS.find(
            center =>
              center.centerId !==
                assignedCenter.centerId &&
              getBookedAtCenter(
                center.centerId
              ) +
                quantity <=
                center.capacityQuintals
          );

        if (!overflowCenter) {
          return res.status(409).json({
            success: false,

            code:
              'NO_CENTER_CAPACITY',

            message:
              'No mandi center has enough remaining capacity for this booking.'
          });
        }

        assignedCenter =
          overflowCenter;

        overflowRerouted =
          true;
      }

      /* --------------------------------------------------------
         SLOT CAPACITY AFTER CENTER ASSIGNMENT
         -------------------------------------------------------- */

      const bookedAtAssignedSlot =
        getBookedAtSlot(
          assignedCenter.centerId,
          requestedSlot.timeSlot
        );

      const slotBookingsAtAssignedCenter =
        getSlotBookings(
          bookings,
          bookingDate,
          assignedCenter.centerId,
          requestedSlot.timeSlot
        );

      const remainingAtAssignedSlot =
        Math.max(
          0,
          requestedSlot.capacityQuintals -
            bookedAtAssignedSlot
        );

      if (
        remainingAtAssignedSlot <=
        0
      ) {
        return res.status(409).json({
          success: false,

          code:
            'SLOT_FULL',

          message:
            `The selected time slot is full at ${assignedCenter.center}. Please choose another available slot.`,

          availability: {
            date:
              bookingDate,

            centerId:
              assignedCenter.centerId,

            slotId:
              requestedSlot.slotId,

            timeSlot:
              requestedSlot.timeSlot,

            capacityQuintals:
              requestedSlot.capacityQuintals,

            bookedQuintals:
              round2(
                bookedAtAssignedSlot
              ),

            remainingQuintals:
              0,

            bookingCount:
              slotBookingsAtAssignedCenter.length,

            available:
              false,

            full:
              true,

            status:
              'full'
          }
        });
      }

      if (
        quantity >
        remainingAtAssignedSlot
      ) {
        return res.status(409).json({
          success: false,

          code:
            'SLOT_CAPACITY_EXCEEDED',

          message:
            `The selected time slot has only ${round2(
              remainingAtAssignedSlot
            )} quintals remaining at ${assignedCenter.center}. Please choose another slot.`,

          availability: {
            date:
              bookingDate,

            centerId:
              assignedCenter.centerId,

            slotId:
              requestedSlot.slotId,

            timeSlot:
              requestedSlot.timeSlot,

            capacityQuintals:
              requestedSlot.capacityQuintals,

            bookedQuintals:
              round2(
                bookedAtAssignedSlot
              ),

            remainingQuintals:
              round2(
                remainingAtAssignedSlot
              ),

            bookingCount:
              slotBookingsAtAssignedCenter.length,

            available:
              true,

            full:
              false,

            status:
              'partially-booked',

            requestedQuantityQuintals:
              round2(quantity),

            canAcceptRequestedQuantity:
              false
          }
        });
      }

      /* --------------------------------------------------------
         CREATE BOOKING
         -------------------------------------------------------- */

      const bookingId =
        generateId('BOOK');

      const tokenId =
        generateUniqueToken(
          bookings
        );

      const timestamp =
        now();

      const newBooking = {
        bookingId,

        tokenId,

        farmerId:
          farmer.farmerId ||
          farmer.id,

        kccNumber:
          farmer.kccNumber,

        farmerName:
          farmer.name,

        cropType:
          crop(cropType),

        estimatedQuantityQuintals:
          round2(quantity),

        quantityQuintals:
          round2(quantity),

        date:
          bookingDate,

        centerId:
          assignedCenter.centerId,

        center:
          assignedCenter.center,

        timeSlot:
          requestedSlot.timeSlot,

        slotId:
          requestedSlot.slotId,

        vehicleNumber:
          vehicleNumber ||
          null,

        status:
          'Scheduled',

        overflowRerouted,

        createdAt:
          timestamp,

        updatedAt:
          timestamp
      };

      bookings.push(
        newBooking
      );

      if (
        !writeData(
          'bookings.json',
          bookings
        )
      ) {
        return res.status(500).json({
          success: false,

          message:
            'Booking could not be saved.'
        });
      }

      appendAuditEvent(
        'BOOKING_CREATED',
        'BOOKING',
        bookingId,
        {
          farmerId:
            newBooking.farmerId,

          tokenId,

          quantityQuintals:
            newBooking.estimatedQuantityQuintals,

          centerId:
            newBooking.centerId,

          date:
            bookingDate,

          timeSlot:
            newBooking.timeSlot
        }
      );

      return res.status(201).json({
        success: true,

        message:
          overflowRerouted
            ? 'Requested center is full. Booking rerouted to the overflow facility.'
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

/* ============================================================
   ADMIN LIVE QUEUE
   ============================================================ */

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

      const currentDate =
        today();

      const todayBookings =
        bookings
          .filter(
            booking =>
              booking.date ===
              currentDate
          )
          .sort(
            (a, b) =>
              new Date(
                a.checkInAt ||
                  a.createdAt ||
                  0
              ) -
              new Date(
                b.checkInAt ||
                  b.createdAt ||
                  0
              )
          );

      const waiting =
        booking =>
          booking.status ===
          'Scheduled';

      const checkedIn =
        booking =>
          booking.status ===
          'Active Gate Queue';

      const serving =
        booking =>
          [
            'Weighbridge',
            'Serving'
          ].includes(
            booking.status
          );

      const activeBookings =
        todayBookings.filter(
          booking =>
            QUEUE_STATUSES.includes(
              booking.status
            )
        );

      const servingBookings =
        activeBookings.filter(
          serving
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
                findFarmer(
                  farmers,
                  booking.kccNumber,
                  booking.farmerId
                );

              const receipt =
                receipts.find(
                  item =>
                    item.tokenId ===
                    booking.tokenId
                );

              const activeIndex =
                activeBookings.findIndex(
                  item =>
                    item.tokenId ===
                    booking.tokenId
                );

              let displayStatus =
                'Waiting';

              if (
                checkedIn(
                  booking
                )
              ) {
                displayStatus =
                  'Checked In';
              }

              if (
                serving(
                  booking
                )
              ) {
                displayStatus =
                  'Serving';
              }

              if (
                booking.status ===
                COMPLETED_STATUS
              ) {
                displayStatus =
                  'Completed';
              }

              return {
                tokenId:
                  booking.tokenId ||
                  null,

                bookingId:
                  booking.bookingId ||
                  null,

                farmerId:
                  booking.farmerId ||
                  farmer?.farmerId ||
                  null,

                queuePosition:
                  activeIndex >= 0
                    ? activeIndex + 1
                    : null,

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
                  getBookingQuantity(
                    booking
                  ),

                actualQuantityQuintals:
                  receipt
                    ? getReceiptQuantity(
                        receipt
                      )
                    : null,

                date:
                  booking.date,

                timeSlot:
                  booking.timeSlot,

                centerId:
                  booking.centerId,

                center:
                  booking.center,

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
                  booking.updatedAt ||
                  booking.checkInAt ||
                  booking.createdAt ||
                  null,

                qualityGrade:
                  receipt?.qualityGrade ||
                  null,

                payoutAmount:
                  receipt
                    ? num(
                        receipt.totalPayoutAmount
                      )
                    : 0
              };
            }
          );

      const centerBreakdown = {};

      activeBookings.forEach(
        booking => {
          const centerId =
            getCenterIdForBooking(
              booking
            );

          const centerName =
            booking.center ||
            MANDI_CENTERS[0].center;

          if (
            !centerBreakdown[
              centerId
            ]
          ) {
            centerBreakdown[
              centerId
            ] = {
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

          centerBreakdown[
            centerId
          ].totalActive += 1;

          if (
            waiting(
              booking
            )
          ) {
            centerBreakdown[
              centerId
            ].waiting += 1;
          }

          if (
            checkedIn(
              booking
            )
          ) {
            centerBreakdown[
              centerId
            ].checkedIn += 1;
          }

          if (
            serving(
              booking
            )
          ) {
            centerBreakdown[
              centerId
            ].serving += 1;
          }
        }
      );

      const currentlyServing =
        servingBookings.length > 0
          ? queueRecords.find(
              record =>
                record.tokenId ===
                servingBookings[0]
                  .tokenId
            ) || null
          : null;

      return res.json({
        success: true,

        generatedAt:
          now(),

        date:
          currentDate,

        summary: {
          currentlyServing:
            servingBookings.length,

          waiting:
            todayBookings.filter(
              waiting
            ).length,

          checkedIn:
            activeBookings.filter(
              checkedIn
            ).length,

          completed:
            todayBookings.filter(
              booking =>
                booking.status ===
                COMPLETED_STATUS
            ).length,

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
        success: false,

        message:
          'Unable to load live procurement queue.'
      });
    }
  }
);

/* ============================================================
   ADMIN PAYMENT MONITORING
   ============================================================ */

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

      const payments =
        readData(
          'payments.json',
          []
        );

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
                findFarmer(
                  farmers,
                  receipt.kccNumber,
                  receipt.farmerId ||
                    booking?.farmerId
                );

              const payment =
                payments.find(
                  item =>
                    item.tokenId ===
                    receipt.tokenId
                );

              const status =
                getPaymentStatus(
                  payment ||
                    receipt
                );

              return {
                transactionId:
                  receipt.transactionId ||
                  payment?.transactionId ||
                  receipt.receiptId ||
                  `TXN-${receipt.tokenId || 'UNKNOWN'}`,

                paymentId:
                  payment?.paymentId ||
                  null,

                receiptId:
                  receipt.receiptId ||
                  null,

                farmerId:
                  receipt.farmerId ||
                  payment?.farmerId ||
                  booking?.farmerId ||
                  farmer?.farmerId ||
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
                  receipt.tokenId,

                cropType:
                  receipt.cropType ||
                  booking?.cropType ||
                  null,

                centerId:
                  booking?.centerId ||
                  MANDI_CENTERS[0]
                    .centerId,

                center:
                  booking?.center ||
                  MANDI_CENTERS[0]
                    .center,

                quantityQuintals:
                  getReceiptQuantity(
                    receipt
                  ),

                bookedQuantityQuintals:
                  booking
                    ? getBookingQuantity(
                        booking
                      )
                    : 0,

                mspPricePerQuintal:
                  num(
                    receipt.mspPricePerQuintal
                  ),

                payableAmount:
                  num(
                    receipt.totalPayoutAmount
                  ),

                qualityGrade:
                  receipt.qualityGrade ||
                  null,

                paymentStatus:
                  status,

                paymentStatusLabel:
                  getPaymentStatusLabel(
                    status
                  ),

                pfmsReference:
                  payment?.pfmsReference ||
                  receipt.pfmsReference ||
                  null,

                utr:
                  payment?.utr ||
                  receipt.utr ||
                  null,

                date:
                  booking?.date ||
                  receipt.timestamp?.split(
                    'T'
                  )[0] ||
                  null,

                receiptTimestamp:
                  receipt.timestamp ||
                  null,

                updatedAt:
                  payment?.updatedAt ||
                  receipt.paymentUpdatedAt ||
                  receipt.timestamp ||
                  null,

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

      const currentDate =
        today();

      const todayPayments =
        paymentRecords.filter(
          payment =>
            payment.date ===
            currentDate
        );

      return res.json({
        success: true,

        generatedAt:
          now(),

        date:
          currentDate,

        summary: {
          totalPaymentValue:
            round2(
              paymentRecords.reduce(
                (
                  total,
                  payment
                ) =>
                  total +
                  payment.payableAmount,
                0
              )
            ),

          pending:
            paymentRecords.filter(
              payment =>
                payment.paymentStatus ===
                'pending'
            ).length,

          pfmsBatched:
            paymentRecords.filter(
              payment =>
                payment.paymentStatus ===
                'pfms-batched'
            ).length,

          dbtDispatched:
            paymentRecords.filter(
              payment =>
                payment.paymentStatus ===
                'dbt-dispatched'
            ).length,

          failed:
            paymentRecords.filter(
              payment =>
                payment.paymentStatus ===
                'failed'
            ).length,

          totalTransactions:
            paymentRecords.length,

          todayPaymentValue:
            round2(
              todayPayments.reduce(
                (
                  total,
                  payment
                ) =>
                  total +
                  payment.payableAmount,
                0
              )
            ),

          todayTransactions:
            todayPayments.length
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
        success: false,

        message:
          'Unable to load payment monitoring data.'
      });
    }
  }
);

/* ============================================================
   ADMIN REPORTS
   ============================================================ */

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

      const payments =
        readData(
          'payments.json',
          []
        );

      const currentDate =
        today();

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
        ).trim();

      let reportBookings =
        bookings.slice();

      let reportReceipts =
        receipts.slice();

      if (
        requestedDate ===
        'today'
      ) {
        reportBookings =
          reportBookings.filter(
            booking =>
              booking.date ===
              currentDate
          );

        reportReceipts =
          reportReceipts.filter(
            receipt =>
              receipt.timestamp &&
              receipt.timestamp.startsWith(
                currentDate
              )
          );
      }

      if (
        requestedCenter &&
        requestedCenter !==
          'all'
      ) {
        reportBookings =
          reportBookings.filter(
            booking =>
              getCenterIdForBooking(
                booking
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

      const bookingByToken =
        new Map(
          reportBookings.map(
            booking => [
              booking.tokenId,
              booking
            ]
          )
        );

      const farmerByKcc =
        new Map(
          farmers.map(
            farmer => [
              farmer.kccNumber,
              farmer
            ]
          )
        );

      const uniqueFarmers =
        new Set(
          reportBookings
            .map(
              booking =>
                booking.farmerId ||
                booking.kccNumber
            )
            .filter(Boolean)
        );

      const totalBooked =
        reportBookings.reduce(
          (
            total,
            booking
          ) =>
            total +
            getBookingQuantity(
              booking
            ),
          0
        );

      const totalProcured =
        reportReceipts.reduce(
          (
            total,
            receipt
          ) =>
            total +
            getReceiptQuantity(
              receipt
            ),
          0
        );

      const totalPayments =
        reportReceipts.reduce(
          (
            total,
            receipt
          ) =>
            total +
            num(
              receipt.totalPayoutAmount
            ),
          0
        );

      const cropMap = {};

      reportReceipts.forEach(
        receipt => {
          const cropType =
            crop(
              receipt.cropType
            );

          if (
            !cropMap[
              cropType
            ]
          ) {
            cropMap[
              cropType
            ] = {
              cropType,

              quantityQuintals:
                0,

              transactions:
                0,

              paymentValue:
                0
            };
          }

          cropMap[
            cropType
          ].quantityQuintals +=
            getReceiptQuantity(
              receipt
            );

          cropMap[
            cropType
          ].transactions += 1;

          cropMap[
            cropType
          ].paymentValue +=
            num(
              receipt.totalPayoutAmount
            );
        }
      );

      const cropAnalytics =
        Object.values(
          cropMap
        )
          .map(
            item => ({
              cropType:
                item.cropType
                  .charAt(0)
                  .toUpperCase() +
                item.cropType.slice(1),

              quantityQuintals:
                round2(
                  item.quantityQuintals
                ),

              transactions:
                item.transactions,

              paymentValue:
                round2(
                  item.paymentValue
                )
            })
          )
          .sort(
            (a, b) =>
              b.quantityQuintals -
              a.quantityQuintals
          );

      const centerAnalytics =
        MANDI_CENTERS.map(
          configuredCenter => {
            const centerBookings =
              reportBookings.filter(
                booking =>
                  getCenterIdForBooking(
                    booking
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
                    getCenterIdForBooking(
                      booking
                    ) ===
                    configuredCenter.centerId
                  );
                }
              );

            const booked =
              centerBookings.reduce(
                (
                  total,
                  booking
                ) =>
                  total +
                  getBookingQuantity(
                    booking
                  ),
                0
              );

            const procured =
              centerReceipts.reduce(
                (
                  total,
                  receipt
                ) =>
                  total +
                  getReceiptQuantity(
                    receipt
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
                  num(
                    receipt.totalPayoutAmount
                  ),
                0
              );

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
                round2(booked),

              procuredQuintals:
                round2(procured),

              paymentValue:
                round2(paymentValue),

              utilizationPercentage:
                configuredCenter.capacityQuintals
                  ? Math.min(
                      100,
                      Math.round(
                        (
                          booked /
                          configuredCenter.capacityQuintals
                        ) *
                        100
                      )
                    )
                  : 0
            };
          }
        );

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

      const getReportPayment =
        receipt =>
          payments.find(
            payment =>
              payment.tokenId ===
              receipt.tokenId
          ) || receipt;

      const paymentStatusSummary = {
        pending:
          reportReceipts.filter(
            receipt =>
              getPaymentStatus(
                getReportPayment(
                  receipt
                )
              ) ===
              'pending'
          ).length,

        pfmsBatched:
          reportReceipts.filter(
            receipt =>
              getPaymentStatus(
                getReportPayment(
                  receipt
                )
              ) ===
              'pfms-batched'
          ).length,

        dbtDispatched:
          reportReceipts.filter(
            receipt =>
              getPaymentStatus(
                getReportPayment(
                  receipt
                )
              ) ===
              'dbt-dispatched'
          ).length,

        failed:
          reportReceipts.filter(
            receipt =>
              getPaymentStatus(
                getReportPayment(
                  receipt
                )
              ) ===
              'failed'
          ).length
      };

      const dailyMap = {};

      reportReceipts.forEach(
        receipt => {
          if (!receipt.timestamp) {
            return;
          }

          const date =
            receipt.timestamp.split(
              'T'
            )[0];

          if (
            !dailyMap[
              date
            ]
          ) {
            dailyMap[
              date
            ] = {
              date,

              transactions:
                0,

              quantityQuintals:
                0,

              paymentValue:
                0
            };
          }

          dailyMap[
            date
          ].transactions += 1;

          dailyMap[
            date
          ].quantityQuintals +=
            getReceiptQuantity(
              receipt
            );

          dailyMap[
            date
          ].paymentValue +=
            num(
              receipt.totalPayoutAmount
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
                round2(
                  item.quantityQuintals
                ),

              paymentValue:
                round2(
                  item.paymentValue
                )
            })
          )
          .sort(
            (a, b) =>
              new Date(
                b.date
              ) -
              new Date(
                a.date
              )
          )
          .slice(0, 14);

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

              const payment =
                payments.find(
                  item =>
                    item.tokenId ===
                    receipt.tokenId
                );

              const status =
                getPaymentStatus(
                  payment ||
                    receipt
                );

              return {
                transactionId:
                  receipt.transactionId ||
                  receipt.receiptId ||
                  `TXN-${receipt.tokenId || 'UNKNOWN'}`,

                paymentId:
                  payment?.paymentId ||
                  null,

                receiptId:
                  receipt.receiptId ||
                  null,

                tokenId:
                  receipt.tokenId ||
                  null,

                farmerId:
                  receipt.farmerId ||
                  booking?.farmerId ||
                  farmer?.farmerId ||
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
                  getReceiptQuantity(
                    receipt
                  ),

                payoutAmount:
                  num(
                    receipt.totalPayoutAmount
                  ),

                qualityGrade:
                  receipt.qualityGrade ||
                  null,

                paymentStatus:
                  status,

                paymentStatusLabel:
                  getPaymentStatusLabel(
                    status
                  ),

                centerId:
                  getCenterIdForBooking(
                    booking
                  ),

                center:
                  booking?.center ||
                  MANDI_CENTERS[0].center,

                date:
                  booking?.date ||
                  receipt.timestamp?.split(
                    'T'
                  )[0] ||
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
          .slice(0, 20);

      return res.json({
        success: true,

        generatedAt:
          now(),

        date:
          currentDate,

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
            round2(totalBooked),

          totalProcuredQuintals:
            round2(totalProcured),

          totalPaymentValue:
            round2(totalPayments),

          completedTransactions:
            reportReceipts.length,

          averageProcurementPerTransaction:
            reportReceipts.length
              ? round2(
                  totalProcured /
                    reportReceipts.length
                )
              : 0
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
        success: false,

        message:
          'Unable to load reports and analytics data.'
      });
    }
  }
);

/* ============================================================
   FARMER REGISTRATION
   ============================================================ */

app.post(
  '/api/auth/register-farmer',
  (req, res) => {
    try {
      const {
        kccNumber,
        name,
        phone,
        state,
        district,
        aadhaarNumber,
        landHoldingAcres,
        mandi
      } = req.body;

      if (!kccNumber) {
        return res.status(400).json({
          success: false,

          message:
            'KCC Number is required.'
        });
      }

      const farmers =
        readData(
          'farmers.json',
          []
        );

      const normalizedKcc =
        String(
          kccNumber
        ).trim();

      const existing =
        farmers.find(
          farmer =>
            farmer.kccNumber ===
            normalizedKcc
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

      if (!name) {
        return res.status(400).json({
          success: false,

          message:
            'Name is required for a new farmer registration.'
        });
      }

      const farmerId =
        generateId('FRM');

      const newFarmer = {
        id:
          farmerId,

        farmerId,

        kccNumber:
          normalizedKcc,

        aadhaarNumber:
          aadhaarNumber ||
          null,

        name:
          String(
            name
          ).trim(),

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
          num(
            landHoldingAcres,
            5
          ),

        mandi:
          mandi ||
          'Khanna, Ludhiana',

        crops: [
          'Wheat',
          'Paddy'
        ],

        verifiedBank:
          'State Bank of India (A/C ****3312)',

        verificationStatus:
          'VERIFIED',

        createdAt:
          now()
      };

      farmers.push(
        newFarmer
      );

      if (
        !writeData(
          'farmers.json',
          farmers
        )
      ) {
        return res.status(500).json({
          success: false,

          message:
            'Farmer could not be saved.'
        });
      }

      appendAuditEvent(
        'FARMER_REGISTERED',
        'FARMER',
        farmerId,
        {
          farmerId,

          kccNumber:
            newFarmer.kccNumber
        }
      );

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

/* ============================================================
   TOKEN QUEUE
   ============================================================ */

const getQueueForBooking = (
  booking,
  bookings
) =>
  bookings
    .filter(
      item =>
        item.date ===
          booking.date &&
        item.centerId ===
          booking.centerId &&
        QUEUE_STATUSES.includes(
          item.status
        )
    )
    .sort(
      (a, b) =>
        new Date(
          a.checkInAt ||
            a.createdAt ||
            0
        ) -
        new Date(
          b.checkInAt ||
            b.createdAt ||
            0
        )
    );

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
          success: false,

          message:
            'Token ID not found.'
        });
      }

      const activeQueue =
        getQueueForBooking(
          booking,
          bookings
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
          : null;

      return res.json({
        success: true,

        token:
          booking.tokenId,

        bookingId:
          booking.bookingId,

        farmerId:
          booking.farmerId ||
          null,

        status:
          booking.status,

        farmerName:
          booking.farmerName ||
          null,

        cropType:
          booking.cropType,

        quantityQuintals:
          getBookingQuantity(
            booking
          ),

        center:
          booking.center,

        centerId:
          booking.centerId,

        date:
          booking.date,

        timeSlot:
          booking.timeSlot,

        queuePosition,

        estimatedWaitTime:
          queuePosition !==
          null
            ? `${queuePosition * 15} mins`
            : 'Not in active queue',

        gateEntryTime:
          booking.checkInAt ||
          null
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

/* ============================================================
   GEOFENCE CHECK-IN
   ============================================================ */

const handleGeofenceCheckIn =
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

      const lat =
        num(
          latitude,
          NaN
        );

      const lng =
        num(
          longitude,
          NaN
        );

      if (
        !Number.isFinite(
          lat
        ) ||
        !Number.isFinite(
          lng
        ) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        return res.status(400).json({
          success: false,

          message:
            'Valid latitude and longitude are required for geofence check-in.'
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

      if (
        bookingIndex ===
        -1
      ) {
        return res.status(404).json({
          success: false,

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
          success: false,

          message:
            `Token cannot be checked in from its current state: ${booking.status}`
        });
      }

      const mandiCenter =
        getCenter(
          booking.centerId
        );

      if (!mandiCenter) {
        return res.status(500).json({
          success: false,

          message:
            'Configured mandi center could not be found.'
        });
      }

      const distanceMeters =
        haversineDistanceMeters(
          lat,
          lng,
          mandiCenter.latitude,
          mandiCenter.longitude
        );

      const insideGeofence =
        distanceMeters <=
        mandiCenter.geofenceRadiusMeters;

      if (!insideGeofence) {
        return res.status(403).json({
          success: false,

          insideGeofence:
            false,

          distanceMeters:
            round2(
              distanceMeters
            ),

          allowedRadiusMeters:
            mandiCenter.geofenceRadiusMeters,

          center:
            mandiCenter.center,

          message:
            'Farmer is outside the permitted mandi geofence. Check-in denied.'
        });
      }

      const checkInTime =
        now();

      booking.status =
        'Active Gate Queue';

      booking.checkInAt =
        checkInTime;

      booking.updatedAt =
        checkInTime;

      booking.location = {
        latitude:
          lat,

        longitude:
          lng
      };

      booking.geofence = {
        insideGeofence:
          true,

        distanceMeters:
          round2(
            distanceMeters
          ),

        allowedRadiusMeters:
          mandiCenter.geofenceRadiusMeters,

        verifiedAt:
          checkInTime
      };

      if (
        !writeData(
          'bookings.json',
          bookings
        )
      ) {
        return res.status(500).json({
          success: false,

          message:
            'Check-in could not be saved.'
        });
      }

      appendAuditEvent(
        'GEOFENCE_CHECK_IN',
        'BOOKING',
        booking.bookingId,
        {
          tokenId,

          farmerId:
            booking.farmerId,

          centerId:
            booking.centerId,

          distanceMeters:
            round2(
              distanceMeters
            ),

          allowedRadiusMeters:
            mandiCenter.geofenceRadiusMeters
        }
      );

      return res.json({
        success: true,

        insideGeofence:
          true,

        distanceMeters:
          round2(
            distanceMeters
          ),

        allowedRadiusMeters:
          mandiCenter.geofenceRadiusMeters,

        message:
          'Geofence check-in verified. Token moved to Active Gate Queue.',

        tokenId,

        bookingId:
          booking.bookingId,

        status:
          booking.status,

        checkInAt:
          checkInTime
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
  };

app.post(
  '/api/checkin/geofence',
  handleGeofenceCheckIn
);

app.post(
  '/api/geofence/check',
  handleGeofenceCheckIn
);

/* ============================================================
   PROCUREMENT + QUALITY
   ============================================================ */

app.post(
  '/api/procurement/quality-log',
  (req, res) => {
    try {
      const {
        tokenId,

        grossWeightKg,
        tareWeightKg,

        grossWeightQuintals,
        tareWeightQuintals,

        moisturePercentage,

        foreignMatterPercentage,
        foreignMatter,

        cropType
      } = req.body;

      if (
        !tokenId ||
        moisturePercentage ==
          null ||
        (
          grossWeightKg ==
            null &&
          grossWeightQuintals ==
            null
        ) ||
        (
          tareWeightKg ==
            null &&
          tareWeightQuintals ==
            null
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            'Token, gross weight, tare weight and moisture are required.'
        });
      }

      const grossKg =
        grossWeightKg !=
        null
          ? num(
              grossWeightKg,
              NaN
            )
          : num(
              grossWeightQuintals,
              NaN
            ) * 100;

      const tareKg =
        tareWeightKg !=
        null
          ? num(
              tareWeightKg,
              NaN
            )
          : num(
              tareWeightQuintals,
              NaN
            ) * 100;

      const moisture =
        num(
          moisturePercentage,
          NaN
        );

      const foreignMatterValue =
        num(
          foreignMatterPercentage ??
            foreignMatter,
          0
        );

      if (
        !Number.isFinite(
          grossKg
        ) ||
        !Number.isFinite(
          tareKg
        ) ||
        !Number.isFinite(
          moisture
        ) ||
        !Number.isFinite(
          foreignMatterValue
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            'Weight and quality values must be valid numbers.'
        });
      }

      if (
        grossKg <= 0 ||
        tareKg < 0 ||
        grossKg <= tareKg
      ) {
        return res.status(400).json({
          success: false,

          message:
            'Gross weight must be greater than tare weight and both values must be valid.'
        });
      }

      if (
        moisture < 0 ||
        moisture > 100 ||
        foreignMatterValue <
          0 ||
        foreignMatterValue >
          100
      ) {
        return res.status(400).json({
          success: false,

          message:
            'Moisture and foreign matter values must be between 0 and 100.'
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

      if (
        bookingIndex ===
        -1
      ) {
        return res.status(404).json({
          success: false,

          message:
            'Token not found.'
        });
      }

      const booking =
        bookings[
          bookingIndex
        ];

      if (
        ![
          'Active Gate Queue',
          'Weighbridge',
          'Serving'
        ].includes(
          booking.status
        )
      ) {
        return res.status(409).json({
          success: false,

          message:
            `Weighment is not allowed from the current booking state: ${booking.status}`
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

      if (
        existingReceipt
      ) {
        return res.status(409).json({
          success: false,

          message:
            'A receipt already exists for this token.',

          receipt:
            existingReceipt
        });
      }

      const normalizedCrop =
        crop(
          cropType ||
            booking.cropType ||
            'wheat'
        );

      const mspPricePerQuintal =
        MSP_RATES[
          normalizedCrop
        ];

      if (
        !mspPricePerQuintal
      ) {
        return res.status(400).json({
          success: false,

          message:
            `MSP rate not configured for crop: ${normalizedCrop}`
        });
      }

      const netWeightKg =
        grossKg -
        tareKg;

      const actualQuantityQuintals =
        netWeightKg /
        100;

      let finalQualityGrade =
        'Grade A';

      if (
        moisture > 12 ||
        foreignMatterValue >
          0.5
      ) {
        finalQualityGrade =
          'Grade B';
      }

      if (
        moisture > 14 ||
        foreignMatterValue >
          0.75
      ) {
        finalQualityGrade =
          'Failed';
      }

      const procurementId =
        generateId('PROC');

      const qualityId =
        generateId('QUALITY');

      const receiptId =
        generateId('RCP');

      const transactionId =
        generateId('TXN');

      const paymentId =
        generateId('PAY');

      const timestamp =
        now();

      const procurement = {
        procurementId,

        bookingId:
          booking.bookingId,

        tokenId,

        farmerId:
          booking.farmerId,

        kccNumber:
          booking.kccNumber,

        grossWeightKg:
          round2(
            grossKg
          ),

        tareWeightKg:
          round2(
            tareKg
          ),

        netWeightKg:
          round2(
            netWeightKg
          ),

        actualQuantityQuintals:
          round2(
            actualQuantityQuintals
          ),

        cropType:
          normalizedCrop,

        status:
          'QUALITY_COMPLETED',

        createdAt:
          timestamp
      };

      const quality = {
        qualityId,

        procurementId,

        bookingId:
          booking.bookingId,

        tokenId,

        farmerId:
          booking.farmerId,

        moisturePercentage:
          round2(
            moisture
          ),

        foreignMatterPercentage:
          round2(
            foreignMatterValue
          ),

        qualityGrade:
          finalQualityGrade,

        createdAt:
          timestamp
      };

      const totalPayoutAmount =
        round2(
          actualQuantityQuintals *
            mspPricePerQuintal
        );

      const receipt = {
        receiptId,

        transactionId,

        procurementId,

        qualityId,

        bookingId:
          booking.bookingId,

        tokenId,

        farmerId:
          booking.farmerId,

        kccNumber:
          booking.kccNumber,

        farmerName:
          booking.farmerName ||
          null,

        cropType:
          normalizedCrop,

        grossWeightKg:
          round2(
            grossKg
          ),

        tareWeightKg:
          round2(
            tareKg
          ),

        grossWeight:
          round2(
            grossKg
          ),

        tareWeight:
          round2(
            tareKg
          ),

        netWeightKg:
          round2(
            netWeightKg
          ),

        netWeightQuintals:
          round2(
            actualQuantityQuintals
          ),

        actualQuantityQuintals:
          round2(
            actualQuantityQuintals
          ),

        moisturePercentage:
          round2(
            moisture
          ),

        foreignMatterPercentage:
          round2(
            foreignMatterValue
          ),

        qualityGrade:
          finalQualityGrade,

        mspPricePerQuintal:
          mspPricePerQuintal,

        totalPayoutAmount:
          totalPayoutAmount,

        status:
          'Quality Approved',

        paymentStatus:
          'Pending',

        timestamp:
          timestamp
      };

      const payment = {
        paymentId,

        transactionId,

        receiptId,

        procurementId,

        tokenId,

        farmerId:
          booking.farmerId,

        amount:
          totalPayoutAmount,

        quantityQuintals:
          round2(
            actualQuantityQuintals
          ),

        mspPricePerQuintal:
          mspPricePerQuintal,

        status:
          'PENDING',

        pfmsReference:
          null,

        utr:
          null,

        createdAt:
          timestamp,

        updatedAt:
          timestamp
      };

      const procurements =
        readData(
          'procurements.json',
          []
        );

      const qualityRecords =
        readData(
          'quality.json',
          []
        );

      const payments =
        readData(
          'payments.json',
          []
        );

      procurements.push(
        procurement
      );

      qualityRecords.push(
        quality
      );

      receipts.push(
        receipt
      );

      payments.push(
        payment
      );

      const saved =
        writeData(
          'procurements.json',
          procurements
        ) &&
        writeData(
          'quality.json',
          qualityRecords
        ) &&
        writeData(
          'receipts.json',
          receipts
        ) &&
        writeData(
          'payments.json',
          payments
        );

      if (!saved) {
        return res.status(500).json({
          success: false,

          message:
            'Procurement transaction could not be saved.'
        });
      }

      booking.status =
        'Quality Approved';

      booking.qualityLoggedAt =
        timestamp;

      booking.updatedAt =
        timestamp;

      if (
        !writeData(
          'bookings.json',
          bookings
        )
      ) {
        return res.status(500).json({
          success: false,

          message:
            'Booking state could not be updated.'
        });
      }

      appendAuditEvent(
        'WEIGHMENT_COMPLETED',
        'PROCUREMENT',
        procurementId,
        {
          tokenId,

          grossWeightKg:
            procurement.grossWeightKg,

          tareWeightKg:
            procurement.tareWeightKg,

          netWeightKg:
            procurement.netWeightKg,

          actualQuantityQuintals:
            procurement.actualQuantityQuintals
        }
      );

      appendAuditEvent(
        'QUALITY_COMPLETED',
        'QUALITY',
        qualityId,
        {
          tokenId,

          procurementId,

          qualityGrade:
            finalQualityGrade,

          moisturePercentage:
            moisture,

          foreignMatterPercentage:
            foreignMatterValue
        }
      );

      appendAuditEvent(
        'RECEIPT_GENERATED',
        'RECEIPT',
        receiptId,
        {
          tokenId,

          procurementId,

          qualityId,

          amount:
            receipt.totalPayoutAmount
        }
      );

      return res.status(201).json({
        success: true,

        message:
          'Weighment and quality parameters logged. Digital receipt generated.',

        procurement,

        quality,

        receipt,

        payment
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

/* ============================================================
   PROTOTYPE DBT DISPATCH
   ============================================================ */

app.post(
  '/api/payments/dispatch',
  (req, res) => {
    try {
      const {
        tokenId
      } = req.body;

      if (!tokenId) {
        return res.status(400).json({
          success: false,

          message:
            'Token ID is required.'
        });
      }

      const receipts =
        readData(
          'receipts.json',
          []
        );

      const bookings =
        readData(
          'bookings.json',
          []
        );

      const payments =
        readData(
          'payments.json',
          []
        );

      const receiptIndex =
        receipts.findIndex(
          receipt =>
            receipt.tokenId ===
            tokenId
        );

      if (
        receiptIndex <
        0
      ) {
        return res.status(404).json({
          success: false,

          message:
            'Receipt not found. Complete weighment and quality logging first.'
        });
      }

      const receipt =
        receipts[
          receiptIndex
        ];

      const booking =
        bookings.find(
          item =>
            item.tokenId ===
            tokenId
        );

      let payment =
        payments.find(
          item =>
            item.tokenId ===
            tokenId
        );

      if (!payment) {
        payment = {
          paymentId:
            generateId('PAY'),

          transactionId:
            receipt.transactionId ||
            generateId('TXN'),

          receiptId:
            receipt.receiptId,

          procurementId:
            receipt.procurementId ||
            null,

          tokenId,

          farmerId:
            receipt.farmerId ||
            booking?.farmerId ||
            null,

          amount:
            num(
              receipt.totalPayoutAmount
            ),

          quantityQuintals:
            getReceiptQuantity(
              receipt
            ),

          mspPricePerQuintal:
            num(
              receipt.mspPricePerQuintal
            ),

          status:
            'PENDING',

          pfmsReference:
            null,

          utr:
            null,

          createdAt:
            now(),

          updatedAt:
            now()
        };

        payments.push(
          payment
        );
      }

      const currentStatus =
        getPaymentStatus(
          payment
        );

      if (
        currentStatus ===
        'dbt-dispatched'
      ) {
        return res.json({
          success: true,

          message:
            'DBT payout has already been dispatched.',

          payment
        });
      }

      payment.status =
        'DBT_DISPATCHED';

      payment.pfmsReference =
        payment.pfmsReference ||
        `PFMS-${new Date()
          .getFullYear()}-${crypto
          .randomBytes(3)
          .toString('hex')
          .toUpperCase()}`;

      payment.utr =
        payment.utr ||
        `UTR-${new Date()
          .getFullYear()}-${crypto
          .randomBytes(4)
          .toString('hex')
          .toUpperCase()}`;

      payment.updatedAt =
        now();

      if (
        !writeData(
          'payments.json',
          payments
        )
      ) {
        return res.status(500).json({
          success: false,

          message:
            'Payment dispatch could not be saved.'
        });
      }

      receipt.paymentStatus =
        'DBT Dispatched';

      receipt.pfmsReference =
        payment.pfmsReference;

      receipt.utr =
        payment.utr;

      receipt.paymentUpdatedAt =
        payment.updatedAt;

      receipts[
        receiptIndex
      ] = receipt;

      if (
        !writeData(
          'receipts.json',
          receipts
        )
      ) {
        return res.status(500).json({
          success: false,

          message:
            'Receipt payment status could not be updated.'
        });
      }

      appendAuditEvent(
        'DBT_DISPATCHED',
        'PAYMENT',
        payment.paymentId,
        {
          tokenId,

          receiptId:
            payment.receiptId,

          amount:
            payment.amount,

          pfmsReference:
            payment.pfmsReference,

          utr:
            payment.utr
        }
      );

      return res.json({
        success: true,

        message:
          'Prototype DBT payout dispatched successfully.',

        payment
      });
    } catch (error) {
      console.error(
        '[Payment Dispatch Error]',
        error
      );

      return res.status(500).json({
        success: false,

        message:
          'Payment dispatch failed.'
      });
    }
  }
);

/* ============================================================
   PAYMENT STATUS
   ============================================================ */

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

      const payments =
        readData(
          'payments.json',
          []
        );

      const receipt =
        receipts.find(
          item =>
            item.tokenId ===
            tokenId
        );

      const payment =
        payments.find(
          item =>
            item.tokenId ===
            tokenId
        );

      if (!receipt) {
        return res.json({
          success: true,

          pipeline: {
            stage:
              'Awaiting Weighbridge',

            receiptId:
              null,

            paymentId:
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

      const status =
        getPaymentStatus(
          payment ||
            receipt
        );

      const dispatched =
        status ===
        'dbt-dispatched';

      return res.json({
        success: true,

        pipeline: {
          stage:
            dispatched
              ? 'DBT Dispatched'
              : 'DBT Processing',

          receiptId:
            receipt.receiptId,

          paymentId:
            payment?.paymentId ||
            null,

          amountToCredit:
            num(
              receipt.totalPayoutAmount
            ),

          quantityQuintals:
            getReceiptQuantity(
              receipt
            ),

          invoiceGenerated:
            true,

          dbtPayoutDispatched:
            dispatched,

          payoutStatus:
            dispatched
              ? 'DBT payment dispatched.'
              : 'Payment instruction generated. Awaiting DBT confirmation.',

          paymentStatus:
            payment?.status ||
            receipt.paymentStatus ||
            'Pending',

          pfmsReference:
            payment?.pfmsReference ||
            receipt.pfmsReference ||
            null,

          utr:
            payment?.utr ||
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
        success: false,

        message:
          'Disbursement tracking failed.'
      });
    }
  }
);

/* ============================================================
   ADMIN AUDIT TRAIL
   ============================================================ */

app.get(
  '/api/admin/audit',
  requireAdmin,
  (req, res) => {
    try {
      const audit =
        readData(
          'audit.json',
          []
        );

      return res.json({
        success: true,

        count:
          audit.length,

        events:
          audit
            .slice(-100)
            .reverse()
      });
    } catch (error) {
      console.error(
        '[Admin Audit Error]',
        error
      );

      return res.status(500).json({
        success: false,

        message:
          'Unable to load audit trail.'
      });
    }
  }
);

/* ============================================================
   HEALTH CHECK
   ============================================================ */

app.get(
  '/api/health',
  (req, res) =>
    res.json({
      success: true,

      service:
        'Kisan Setu Procurement Backend',

      status:
        'Operational',

      timestamp:
        now(),

      configuration: {
        mandiCenters:
          MANDI_CENTERS.map(
            center => ({
              centerId:
                center.centerId,

              center:
                center.center,

              latitude:
                center.latitude,

              longitude:
                center.longitude,

              geofenceRadiusMeters:
                center.geofenceRadiusMeters
            })
          ),

        mspRates:
          MSP_RATES,

        slotCapacityQuintals:
          50,

        slotCount:
          MANDI_SLOTS.length
      }
    })
);
/* ============================================================
   OPENWEATHERMAP WEATHER API
   ============================================================ */

app.get(
  '/api/weather',
  async (req, res) => {

    try {

      const city =
        String(
          req.query.city || 'Ludhiana'
        ).trim();

      const apiKey =
        process.env.WEATHER_API_KEY;

      if (!apiKey) {

        return res.status(500).json({
          success: false,

          message:
            'Weather API key is not configured on the server.'
        });

      }

      if (!city) {

        return res.status(400).json({
          success: false,

          message:
            'City is required.'
        });

      }

      const weatherUrl =
        `https://api.openweathermap.org/data/2.5/weather` +
        `?q=${encodeURIComponent(city)}` +
        `&appid=${encodeURIComponent(apiKey)}` +
        `&units=metric`;

      const response =
        await fetch(weatherUrl);

      const data =
        await response.json();

      if (!response.ok) {

        console.error(
          '[Weather API Error]',
          data
        );

        return res.status(
          response.status
        ).json({
          success: false,

          message:
            data?.message ||
            'Unable to fetch weather data.'
        });

      }

      return res.json({

        success: true,

        weather: {

          city:
            data.name,

          country:
            data.sys?.country || '',

          temperature:
            data.main?.temp ?? null,

          feelsLike:
            data.main?.feels_like ?? null,

          humidity:
            data.main?.humidity ?? null,

          pressure:
            data.main?.pressure ?? null,

          windSpeed:
            data.wind?.speed ?? null,

          weather:
            data.weather?.[0]?.main || '',

          description:
            data.weather?.[0]?.description || '',

          icon:
            data.weather?.[0]?.icon || '',

          visibility:
            data.visibility ?? null

        }

      });

    } catch (error) {

      console.error(
        '[Weather Server Error]',
        error
      );

      return res.status(500).json({

        success: false,

        message:
          'Failed to connect to the weather service.'
      });

    }

  }
);
/* ============================================================
   404 API HANDLER
   ============================================================ */

app.use(
  '/api',
  (req, res) => {
    return res.status(404).json({
      success: false,

      message:
        `API endpoint not found: ${req.method} ${req.originalUrl}`
    });
  }
);

/* ============================================================
   GLOBAL ERROR HANDLER
   ============================================================ */

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      '[Unhandled Server Error]',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        'Internal server error.'
    });
  }
);

/* ============================================================
   START SERVER
   ============================================================ */

app.listen(
  PORT,
  () => {
    console.log(
      `Kisan Setu Procurement Backend active on http://localhost:${PORT}`
    );

    console.log(
      `Health check: http://localhost:${PORT}/api/health`
    );

    console.log(
      `Slot availability: http://localhost:${PORT}/api/slots/availability?date=${today()}&centerId=Mandi-Center-01`
    );

    console.log(
      `Farmer portal: http://localhost:${PORT}/farmer/`
    );

    console.log(
      `Admin portal: http://localhost:${PORT}/admin/admin.html`
    );
  }
);