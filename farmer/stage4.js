// ==========================================
// KISAN SETU - STAGE 4
// DIGITAL TOKEN, LIVE QUEUE & TOKEN SLIP
// ==========================================

const STAGE4_API_BASE_URL =
  'http://localhost:5050';


// ==========================================
// STAGE 4 INITIALIZATION
// ==========================================

document.addEventListener(
  'DOMContentLoaded',
  () => {

    console.log(
      '[Stage 4] Initializing...'
    );

    setupStage4Buttons();

    const booking =
      getStoredBooking();

    if (!booking) {

      console.warn(
        '[Stage 4] No active booking found yet.'
      );

      return;

    }

    refreshStage4();

  }
);


// ==========================================
// GET STORED BOOKING
// ==========================================

function getStoredBooking() {

  const storedBooking =
    sessionStorage.getItem(
      'kisanSetuBooking'
    );

  if (!storedBooking) {
    return null;
  }

  try {

    const booking =
      JSON.parse(
        storedBooking
      );

    if (
      !booking ||
      !booking.tokenId
    ) {

      console.error(
        '[Stage 4] Stored booking is invalid.'
      );

      return null;

    }

    return booking;

  } catch (error) {

    console.error(
      '[Stage 4] Failed to parse booking:',
      error
    );

    return null;

  }

}


// ==========================================
// GET FARMER NAME
// ==========================================

function getFarmerName(
  booking
) {

  if (
    booking?.farmerName &&
    booking.farmerName !== 'Not fetched'
  ) {

    return booking.farmerName;

  }


  const savedName =
    sessionStorage.getItem(
      'verifiedFarmerName'
    );

  if (
    savedName &&
    savedName !== 'Not fetched'
  ) {

    return savedName;

  }


  const visibleName =
    document.getElementById(
      'farmer-name-val'
    )?.innerText.trim();


  if (
    visibleName &&
    visibleName !== 'Not fetched' &&
    visibleName !== 'Verified Farmer'
  ) {

    return visibleName;

  }


  return 'Verified Farmer';

}


// ==========================================
// GET CROP DISPLAY TEXT
// ==========================================

function getCropText(
  booking
) {

  if (
    booking?.cropText
  ) {

    return booking.cropText;

  }


  const cropElement =
    document.getElementById(
      'crop-select'
    );


  if (cropElement) {

    const selectedOption =
      cropElement.options[
        cropElement.selectedIndex
      ];


    if (
      selectedOption &&
      selectedOption.text
    ) {

      return selectedOption.text;

    }

  }


  return booking?.cropType ||
    'Crop';

}


// ==========================================
// POPULATE STAGE 4
// ==========================================

function populateStage4(
  booking
) {

  if (!booking) {
    return;
  }


  const farmerName =
    getFarmerName(
      booking
    );


  const cropText =
    getCropText(
      booking
    );


  const vehicleNumber =
    booking.vehicleNumber ||
    sessionStorage.getItem(
      'vehicleNumber'
    ) ||
    'Not provided';


  const center =
    booking.center ||
    'Khanna Grain Market';


  const timeSlot =
    booking.timeSlot ||
    sessionStorage.getItem(
      'selectedTimeSlot'
    ) ||
    '09:00 AM - 11:00 AM';


  const quantity =
    Number(
      booking.quantityQuintals
    ) || 0;


  // ========================================
  // TOKEN
  // ========================================

  setText(
    'token-display-id',
    booking.tokenId
  );


  // ========================================
  // FARMER + CROP
  // ========================================

  setText(
    'token-farmer-desc',
    `${farmerName} • ${cropText}`
  );


  // ========================================
  // GATE ENTRY WINDOW
  // ========================================

  updateGateEntryWindow(
    timeSlot
  );


  // ========================================
  // QR / TOKEN SLIP
  // ========================================

  setText(
    'qr-farmer-name',
    farmerName
  );


  setText(
    'qr-crop-type',
    cropText
  );


  setText(
    'qr-booked-qty',
    `${quantity} Quintals`
  );


  setText(
    'qr-mandi-centre',
    center
  );


  setText(
    'qr-vehicle-plate',
    vehicleNumber
  );


  // ========================================
  // DISPATCH MESSAGE
  // ========================================

  const dispatchElement =
    document.getElementById(
      'dispatch-status-text'
    );


  if (dispatchElement) {

    dispatchElement.innerText =
      `"Vehicle ${vehicleNumber}, your estimated gate entry is being tracked. Current gate processing is simulated for this prototype."`;

  }


  console.log(
    '[Stage 4] UI synchronized:',
    {
      token:
        booking.tokenId,

      bookingId:
        booking.bookingId,

      farmer:
        farmerName,

      crop:
        cropText,

      quantity,

      vehicle:
        vehicleNumber,

      center,

      date:
        booking.date,

      timeSlot
    }
  );

}


// ==========================================
// REFRESH STAGE 4
// ==========================================

function refreshStage4() {

  const booking =
    getStoredBooking();


  if (!booking) {

    console.warn(
      '[Stage 4] Nothing to refresh.'
    );

    return;

  }


  populateStage4(
    booking
  );


  generateAuditHash(
    booking
  );


  loadQueueTelemetry(
    booking
  );

}


window.refreshStage4 =
  refreshStage4;


// ==========================================
// SAFE TEXT HELPER
// ==========================================

function setText(
  elementId,
  value
) {

  const element =
    document.getElementById(
      elementId
    );


  if (element) {

    element.innerText =
      value ?? '';

  }

}


// ==========================================
// UPDATE GATE ENTRY WINDOW
// ==========================================

function updateGateEntryWindow(
  timeSlot
) {

  const stage4 =
    document.getElementById(
      'stage-view-4'
    );


  if (!stage4) {
    return;
  }


  const pills =
    stage4.querySelectorAll(
      '.glass-pill'
    );


  pills.forEach(
    pill => {

      const label =
        pill.querySelector(
          'small'
        );


      if (
        label &&
        label.innerText
          .trim()
          .toLowerCase()
          .includes(
            'gate entry window'
          )
      ) {

        const value =
          pill.querySelector(
            'strong'
          );


        if (value) {

          value.innerText =
            timeSlot;

        }

      }

    }
  );

}


// ==========================================
// STAGE 4 BUTTON SETUP
// ==========================================

function setupStage4Buttons() {

  const stage4 =
    document.getElementById(
      'stage-view-4'
    );


  if (!stage4) {
    return;
  }


  const buttons =
    stage4.querySelectorAll(
      'button'
    );


  buttons.forEach(
    button => {

      const text =
        button.innerText
          .trim()
          .toLowerCase();


      if (
        text.includes(
          'print token slip'
        )
      ) {

        button.onclick =
          openQRSlipModal;

      }


      else if (
        text.includes(
          'audit hash'
        )
      ) {

        button.onclick =
          showAuditHash;

      }


      else if (
        text.includes(
          'simulate automated departure alert'
        )
      ) {

        button.onclick =
          triggerSimulatedSMS;

      }

    }
  );


  console.log(
    '[Stage 4] Buttons connected.'
  );

}


// ==========================================
// QR TOKEN SLIP MODAL
// ==========================================

function openQRSlipModal() {

  const modal =
    document.getElementById(
      'qr-slip-modal'
    );


  if (!modal) {

    console.error(
      '[Stage 4] QR slip modal not found.'
    );

    return;

  }


  const booking =
    getStoredBooking();


  if (!booking) {

    alert(
      'No active procurement token found.'
    );

    return;

  }


  populateStage4(
    booking
  );


  modal.classList.add(
    'open'
  );


  console.log(
    '[Stage 4] Token slip opened:',
    booking.tokenId
  );

}


// ==========================================
// CLOSE QR MODAL
// ==========================================

function closeQRModal() {

  const modal =
    document.getElementById(
      'qr-slip-modal'
    );


  if (modal) {

    modal.classList.remove(
      'open'
    );

  }

}


// ==========================================
// PRINT TOKEN SLIP
// ==========================================

function printTokenSlip() {

  const booking =
    getStoredBooking();


  if (!booking) {

    alert(
      'No active procurement token found.'
    );

    return;

  }


  populateStage4(
    booking
  );


  const modal =
    document.getElementById(
      'qr-slip-modal'
    );


  if (modal) {

    modal.classList.add(
      'open'
    );

  }


  setTimeout(
    () => {

      window.print();

    },
    150
  );

}


// ==========================================
// GENERATE AUDIT HASH
// ==========================================

async function generateAuditHash(
  booking
) {

  if (
    !window.crypto ||
    !window.crypto.subtle
  ) {

    console.warn(
      '[Stage 4] Web Crypto unavailable.'
    );

    return null;

  }


  try {

    const auditPayload =
      JSON.stringify({

        bookingId:
          booking.bookingId || '',

        tokenId:
          booking.tokenId || '',

        kccNumber:
          booking.kccNumber || '',

        cropType:
          booking.cropType || '',

        quantityQuintals:
          booking.quantityQuintals || 0,

        date:
          booking.date || '',

        center:
          booking.center || '',

        timeSlot:
          booking.timeSlot || '',

        vehicleNumber:
          booking.vehicleNumber || ''

      });


    const encodedData =
      new TextEncoder().encode(
        auditPayload
      );


    const hashBuffer =
      await crypto.subtle.digest(
        'SHA-256',
        encodedData
      );


    const hashArray =
      Array.from(
        new Uint8Array(
          hashBuffer
        )
      );


    const hash =
      hashArray
        .map(
          byte =>
            byte
              .toString(16)
              .padStart(
                2,
                '0'
              )
        )
        .join('');


    sessionStorage.setItem(
      'kisanSetuAuditHash',
      hash
    );


    console.log(
      '[Stage 4] Audit fingerprint:',
      hash
    );


    return hash;

  } catch (error) {

    console.error(
      '[Stage 4] Hash generation failed:',
      error
    );

    return null;

  }

}


// ==========================================
// SHOW AUDIT HASH
// ==========================================

async function showAuditHash() {

  const booking =
    getStoredBooking();


  if (!booking) {

    alert(
      'No active procurement transaction found.'
    );

    return;

  }


  let hash =
    sessionStorage.getItem(
      'kisanSetuAuditHash'
    );


  if (!hash) {

    hash =
      await generateAuditHash(
        booking
      );

  }


  if (!hash) {

    alert(
      'Unable to generate transaction fingerprint.'
    );

    return;

  }


  alert(
    'Kisan Setu Transaction Audit Fingerprint\n\n' +
    `Token: ${booking.tokenId}\n` +
    `Booking ID: ${booking.bookingId || 'N/A'}\n\n` +
    `SHA-256: 0x${hash.substring(0, 16)}...\n\n` +
    'This fingerprint is generated from the procurement ' +
    'transaction data. If the transaction data changes, ' +
    'the fingerprint changes as well.'
  );

}


// ==========================================
// LIVE QUEUE TELEMETRY
// ==========================================

async function loadQueueTelemetry(
  booking
) {

  if (!booking?.tokenId) {
    return;
  }


  try {

    const response =
      await fetch(
        `${STAGE4_API_BASE_URL}/api/queue/token/${encodeURIComponent(
          booking.tokenId
        )}`
      );


    if (!response.ok) {

      throw new Error(
        `Queue API returned HTTP ${response.status}`
      );

    }


    const data =
      await response.json();


    if (!data.success) {

      throw new Error(
        data.message ||
        'Queue lookup failed.'
      );

    }


    updateQueueUI(
      data
    );


    console.log(
      '[Stage 4] Queue telemetry:',
      data
    );

  } catch (error) {

    console.warn(
      '[Stage 4] Queue telemetry unavailable:',
      error
    );

  }

}


// ==========================================
// UPDATE QUEUE UI
// ==========================================

function updateQueueUI(
  queueData
) {

  const stage4 =
    document.getElementById(
      'stage-view-4'
    );


  if (!stage4) {
    return;
  }


  const pills =
    stage4.querySelectorAll(
      '.glass-pill'
    );


  pills.forEach(
    pill => {

      const labelElement =
        pill.querySelector(
          'small'
        );


      if (!labelElement) {
        return;
      }


      const label =
        labelElement.innerText
          .trim()
          .toLowerCase();


      // ------------------------------------
      // CURRENT POSITION
      // ------------------------------------

      if (
        label.includes(
          'current position'
        )
      ) {

        const heading =
          pill.querySelector(
            'h2'
          );


        if (
          heading &&
          queueData.queuePosition !== undefined
        ) {

          heading.innerText =
            `#${queueData.queuePosition}`;

        }

      }


      // ------------------------------------
      // ESTIMATED GATE ENTRY
      // ------------------------------------

      if (
        label.includes(
          'est. gate entry'
        )
      ) {

        const heading =
          pill.querySelector(
            'h2'
          );


        if (
          heading &&
          queueData.gateEntryTime
        ) {

          heading.innerText =
            queueData.gateEntryTime;

        }

      }


      // ------------------------------------
      // STATUS
      // ------------------------------------

      if (
        label === 'status'
      ) {

        const heading =
          pill.querySelector(
            'h2'
          );


        if (
          heading &&
          queueData.status
        ) {

          heading.innerText =
            String(
              queueData.status
            ).toUpperCase();

        }

      }

    }
  );

}


// ==========================================
// SIMULATED DEPARTURE ALERT
// ==========================================

function triggerSimulatedSMS() {

  const booking =
    getStoredBooking();


  if (!booking) {

    alert(
      'No active procurement token found.'
    );

    return;

  }


  const vehicleNumber =
    booking.vehicleNumber ||
    sessionStorage.getItem(
      'vehicleNumber'
    ) ||
    'your vehicle';


  alert(
    'Simulated Dispatch Sent via DLT Gateway:\n\n' +
    `Vehicle ${vehicleNumber}, proceed to Gate 2.\n` +
    `Current token: ${booking.tokenId}.\n\n` +
    'Channels: SMS Gateway • FCM Push • WhatsApp'
  );


  console.log(
    '[Stage 4] Simulated departure alert sent.'
  );

}


// ==========================================
// EXPOSE FUNCTIONS FOR EXISTING HTML
// ==========================================

window.openQRSlipModal =
  openQRSlipModal;

window.closeQRModal =
  closeQRModal;

window.printTokenSlip =
  printTokenSlip;

window.showAuditHash =
  showAuditHash;

window.triggerSimulatedSMS =
  triggerSimulatedSMS;
  function populateBookingDisplay() {
  const bookingData = JSON.parse(sessionStorage.getItem('bookingData') || '{}');
  const farmerName = sessionStorage.getItem('farmerName');

  if (!bookingData.tokenId) return;

  // Replace these IDs with your actual HTML element IDs
  document.getElementById('ui-farmer-name').textContent = farmerName;
  document.getElementById('ui-token-number').textContent = bookingData.tokenId;
  document.getElementById('ui-booking-date').textContent = bookingData.date;
  document.getElementById('ui-booking-slot').textContent = bookingData.timeSlot;
  document.getElementById('ui-booking-center').textContent = bookingData.center;
  document.getElementById('ui-booking-qty').textContent = `${bookingData.estimatedQuantityQuintals} qtl`;
}

// Bind to your Stage 4 transition logic
document.addEventListener('stage4-active', populateBookingDisplay);