// ==========================================
// KISAN SETU - STAGE 3
// BATCH SLOT BOOKING & TOKEN GENERATION
// ==========================================

const STAGE3_API_BASE_URL = 'http://localhost:5050';

let currentTargetMandi =
  'Khanna Grain Market (Asia\'s Largest)';

let currentSelectedSlot =
  '09:00 AM - 11:00 AM';

let currentCenterId =
  'Mandi-Center-01';


// ==========================================
// STAGE 3 INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {

  console.log('[Stage 3] Initializing...');


  // ----------------------------------------
  // TIME SLOT SELECTION
  // ----------------------------------------

  const slotButtons =
    document.querySelectorAll(
      '#stage-view-3 .time-slot-btn'
    );


  slotButtons.forEach(button => {

    /*
     * Replace existing inline onclick
     * instead of adding another listener.
     *
     * This prevents duplicate execution.
     */

    button.onclick = () => {
      selectSlot(button);
    };

  });


  // ----------------------------------------
  // CROP / QUANTITY CHANGE
  // ----------------------------------------

  const cropSelect =
    document.getElementById(
      'crop-select'
    );

  const quantityInput =
    document.getElementById(
      'qty-input'
    );


  if (cropSelect) {

    cropSelect.onchange =
      updateMandiStatus;

  }


  if (quantityInput) {

    quantityInput.oninput =
      updateMandiStatus;

  }


  // ----------------------------------------
  // BOOKING BUTTON
  // ----------------------------------------

  const bookingButton =
    document.querySelector(
      '#stage-view-3 .card-panel:first-child .btn-action-dark'
    );


  if (bookingButton) {

    /*
     * Replace inline onclick.
     *
     * This guarantees only one booking
     * request is sent per click.
     */

    bookingButton.onclick =
      submitSlotBooking;

  }


  // ----------------------------------------
  // REROUTE BUTTON
  // ----------------------------------------

  const rerouteButton =
    document.querySelector(
      '#stage-view-3 .btn-reroute'
    );


  if (rerouteButton) {

    rerouteButton.onclick =
      applyReroute;

  }


  // ----------------------------------------
  // INITIAL SELECTED SLOT
  // ----------------------------------------

  const initiallySelected =
    document.querySelector(
      '#stage-view-3 .time-slot-btn.selected'
    );


  if (initiallySelected) {

    currentSelectedSlot =
      initiallySelected.innerText.trim();

  }


  // ----------------------------------------
  // RESTORE SAVED SLOT IF AVAILABLE
  // ----------------------------------------

  const savedSlot =
    sessionStorage.getItem(
      'selectedTimeSlot'
    );


  if (savedSlot) {

    const matchingSlot =
      Array.from(slotButtons).find(
        button =>
          button.innerText.trim() === savedSlot
      );


    if (matchingSlot) {

      selectSlot(
        matchingSlot
      );

    }

  }


  // ----------------------------------------
  // INITIAL MANDI STATUS
  // ----------------------------------------

  updateMandiStatus();


  console.log(
    '[Stage 3] Initialized successfully.'
  );

});


// ==========================================
// TIME SLOT SELECTION
// ==========================================

function selectSlot(element) {

  if (!element) {
    return;
  }


  const slotButtons =
    document.querySelectorAll(
      '#stage-view-3 .time-slot-btn'
    );


  slotButtons.forEach(slot => {

    slot.classList.remove(
      'selected'
    );

  });


  element.classList.add(
    'selected'
  );


  currentSelectedSlot =
    element.innerText.trim();


  sessionStorage.setItem(
    'selectedTimeSlot',
    currentSelectedSlot
  );


  console.log(
    '[Stage 3] Selected slot:',
    currentSelectedSlot
  );

}


// ==========================================
// MANDI / CONGESTION STATUS
// ==========================================

function updateMandiStatus() {

  const quantityElement =
    document.getElementById(
      'qty-input'
    );

  const cropElement =
    document.getElementById(
      'crop-select'
    );


  if (
    !quantityElement ||
    !cropElement
  ) {

    return;

  }


  const quantity =
    Number(
      quantityElement.value
    ) || 0;


  const crop =
    cropElement.value;


  const statusBadge =
    document.getElementById(
      'mandi-status-badge'
    );

  const waitElement =
    document.getElementById(
      'est-wait-val'
    );

  const queueElement =
    document.getElementById(
      'active-queue-val'
    );


  if (!statusBadge) {
    return;
  }


  // ----------------------------------------
  // HIGH CONGESTION
  // ----------------------------------------

  if (quantity >= 80) {

    statusBadge.innerText =
      'HIGH CONGESTION';

    statusBadge.style.background =
      '#fee2e2';

    statusBadge.style.color =
      '#991b1b';


    if (waitElement) {

      waitElement.innerText =
        '54 min';

    }


    if (queueElement) {

      queueElement.innerText =
        '28 Trucks';

    }

  }


  // ----------------------------------------
  // MODERATE-HIGH CONGESTION
  // ----------------------------------------

  else if (
    quantity >= 60 ||
    crop === 'paddy'
  ) {

    statusBadge.innerText =
      'MODERATE-HIGH';

    statusBadge.style.background =
      '#fef3c7';

    statusBadge.style.color =
      '#92400e';


    if (waitElement) {

      waitElement.innerText =
        '45 min';

    }


    if (queueElement) {

      queueElement.innerText =
        '20 Trucks';

    }

  }


  // ----------------------------------------
  // NORMAL / MODERATE
  // ----------------------------------------

  else {

    statusBadge.innerText =
      'MODERATE CONGESTION';

    statusBadge.style.background =
      '#fef3c7';

    statusBadge.style.color =
      '#92400e';


    if (waitElement) {

      waitElement.innerText =
        '38 min';

    }


    if (queueElement) {

      queueElement.innerText =
        '12 Trucks';

    }

  }

}


// ==========================================
// OVERFLOW REROUTING
// ==========================================

function applyReroute() {

  currentTargetMandi =
    'Karnal Central Krishi Mandi';

  currentCenterId =
    'Mandi-Center-02';


  const mandiTitle =
    document.getElementById(
      'target-mandi-title'
    );

  const statusBadge =
    document.getElementById(
      'mandi-status-badge'
    );

  const waitElement =
    document.getElementById(
      'est-wait-val'
    );

  const queueElement =
    document.getElementById(
      'active-queue-val'
    );

  const overflowDescription =
    document.getElementById(
      'overflow-desc'
    );


  if (mandiTitle) {

    mandiTitle.innerText =
      currentTargetMandi;

  }


  if (statusBadge) {

    statusBadge.innerText =
      'OPTIMIZED FLOW';

    statusBadge.style.background =
      '#dff2e1';

    statusBadge.style.color =
      '#236835';

  }


  if (waitElement) {

    waitElement.innerText =
      '18 min';

  }


  if (queueElement) {

    queueElement.innerText =
      '4 Trucks';

  }


  if (overflowDescription) {

    overflowDescription.innerHTML =
      '<strong>Successfully Rerouted!</strong> ' +
      'Karnal Mandi queue load-balancer lock confirmed. ' +
      'Turnaround guarantee active.';

  }


  console.log(
    '[Stage 3] Rerouted to:',
    currentTargetMandi
  );

}


// ==========================================
// GET VERIFIED FARMER
// ==========================================

function getVerifiedFarmerName() {

  // ----------------------------------------
  // First try visible Stage 2 value
  // ----------------------------------------

  const visibleFarmer =
    document.getElementById(
      'farmer-name-val'
    )?.innerText.trim();


  if (
    visibleFarmer &&
    visibleFarmer !== 'Not fetched' &&
    visibleFarmer !== 'Verified Farmer'
  ) {

    return visibleFarmer;

  }


  // ----------------------------------------
  // Then try saved verification object
  // ----------------------------------------

  const savedFarmer =
    sessionStorage.getItem(
      'verifiedFarmer'
    );


  if (savedFarmer) {

    try {

      const farmer =
        JSON.parse(
          savedFarmer
        );


      if (
        typeof farmer === 'string' &&
        farmer.trim()
      ) {

        return farmer.trim();

      }


      if (
        farmer?.name &&
        farmer.name.trim()
      ) {

        return farmer.name.trim();

      }

    } catch (error) {

      console.warn(
        '[Stage 3] Could not parse verified farmer data.'
      );

    }

  }


  return 'Verified Farmer';

}


// ==========================================
// GET VERIFIED AADHAAR
// ==========================================

function getVerifiedAadhaar() {

  const savedAadhaar =
    sessionStorage.getItem(
      'verifiedAadhaar'
    );


  if (savedAadhaar) {

    return savedAadhaar;

  }


  return '';

}


// ==========================================
// SLOT BOOKING
// ==========================================

async function submitSlotBooking() {

  /*
   * Prevent accidental double-clicks.
   */

  if (
    window.__kisanSetuBookingInProgress
  ) {

    console.warn(
      '[Stage 3] Booking already in progress.'
    );

    return;

  }


  window.__kisanSetuBookingInProgress =
    true;


  const bookingButton =
    document.querySelector(
      '#stage-view-3 .card-panel:first-child .btn-action-dark'
    );


  const cropElement =
    document.getElementById(
      'crop-select'
    );


  const quantityElement =
    document.getElementById(
      'qty-input'
    );


  const dateElement =
    document.querySelector(
      '#stage-view-3 input[type="date"]'
    );


  const vehicleElement =
    document.getElementById(
      'vehicle-input'
    );


  // ----------------------------------------
  // FARMER KCC
  // ----------------------------------------

  const kccNumber =
    sessionStorage.getItem(
      'verifiedKccNumber'
    ) ||
    document.getElementById(
      'kcc-input'
    )?.value.trim();


  // ----------------------------------------
  // FORM VALUES
  // ----------------------------------------

  const cropType =
    cropElement?.value;


  const quantity =
    Number(
      quantityElement?.value
    );


  const preferredDate =
    dateElement?.value;


  const vehicleNumber =
    vehicleElement?.value.trim();


  // ----------------------------------------
  // VALIDATION
  // ----------------------------------------

  if (!kccNumber) {

    alert(
      'Farmer verification is required before slot booking.'
    );

    window.__kisanSetuBookingInProgress =
      false;

    return;

  }


  if (!cropType) {

    alert(
      'Please select a crop type.'
    );

    window.__kisanSetuBookingInProgress =
      false;

    return;

  }


  if (
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {

    alert(
      'Please enter a valid procurement quantity.'
    );

    window.__kisanSetuBookingInProgress =
      false;

    return;

  }


  if (!preferredDate) {

    alert(
      'Please select a preferred date.'
    );

    window.__kisanSetuBookingInProgress =
      false;

    return;

  }


  if (!vehicleNumber) {

    alert(
      'Please enter the vehicle plate number.'
    );

    window.__kisanSetuBookingInProgress =
      false;

    return;

  }


  if (!currentSelectedSlot) {

    alert(
      'Please select an arrival time slot.'
    );

    window.__kisanSetuBookingInProgress =
      false;

    return;

  }


  // ----------------------------------------
  // BUTTON STATE
  // ----------------------------------------

  const originalHTML =
    bookingButton?.innerHTML;


  try {

    if (bookingButton) {

      bookingButton.disabled =
        true;

      bookingButton.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> ' +
        'Booking Slot...';

    }


    console.log(
      '[Stage 3] Sending booking request:',
      {
        kccNumber,
        cropType,
        quantity,
        preferredDate,
        centerId: currentCenterId,
        timeSlot: currentSelectedSlot,
        vehicleNumber
      }
    );


    // --------------------------------------
    // BACKEND REQUEST
    // --------------------------------------

    const response =
      await fetch(
        `${STAGE3_API_BASE_URL}/api/slots/book`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({

            kccNumber,

            cropType,

            quantityQuintals:
              quantity,

            preferredDate,

            centerId:
              currentCenterId,

            timeSlot:
              currentSelectedSlot,

            vehicleNumber

          })

        }
      );


    // --------------------------------------
    // READ RESPONSE
    // --------------------------------------

    let data;


    try {

      data =
        await response.json();

    } catch {

      throw new Error(
        `Backend returned HTTP ${response.status}.`
      );

    }


    // --------------------------------------
    // BACKEND ERROR
    // --------------------------------------

    if (
      !response.ok ||
      !data.success
    ) {

      throw new Error(
        data.message ||
        'Slot booking failed.'
      );

    }


    // --------------------------------------
    // REAL BOOKING
    // --------------------------------------

    const booking =
      data.booking;


    if (
      !booking ||
      !booking.tokenId
    ) {

      throw new Error(
        'Booking succeeded but no digital token was returned.'
      );

    }


    console.log(
      '[Stage 3] REAL TOKEN GENERATED:',
      booking.tokenId
    );


    // ======================================
    // BACKEND IS SOURCE OF TRUTH
    // ======================================

    const finalToken =
      booking.tokenId;


    const finalBookingId =
      booking.bookingId;


    const finalDate =
      booking.date ||
      preferredDate;


    const finalTimeSlot =
      booking.timeSlot ||
      currentSelectedSlot;


    const finalCenter =
      booking.center ||
      currentTargetMandi;


    const finalCenterId =
      booking.centerId ||
      currentCenterId;


    const finalQuantity =
      Number(
        booking.quantityQuintals
      ) || quantity;


    const finalVehicle =
      booking.vehicleNumber ||
      vehicleNumber;


    const farmerName =
      getVerifiedFarmerName();


    const aadhaar =
      getVerifiedAadhaar();


    const cropText =
      cropElement?.options[
        cropElement.selectedIndex
      ]?.text ||
      cropType;


    // ======================================
    // NORMALIZE BOOKING OBJECT
    // ======================================

    /*
     * Keep the backend booking untouched,
     * but enrich the frontend session copy
     * with information needed by later stages.
     */

    const frontendBooking = {

      ...booking,

      tokenId:
        finalToken,

      bookingId:
        finalBookingId,

      date:
        finalDate,

      timeSlot:
        finalTimeSlot,

      center:
        finalCenter,

      centerId:
        finalCenterId,

      quantityQuintals:
        finalQuantity,

      vehicleNumber:
        finalVehicle,

      farmerName:
        farmerName,

      aadhaar:
        aadhaar,

      cropText:
        cropText

    };


    // ======================================
    // SAVE SINGLE TRANSACTION STATE
    // ======================================

    sessionStorage.setItem(
      'kisanSetuBooking',
      JSON.stringify(
        frontendBooking
      )
    );


    sessionStorage.setItem(
      'activeTokenId',
      finalToken
    );


    sessionStorage.setItem(
      'activeBookingId',
      finalBookingId
    );


    sessionStorage.setItem(
      'selectedTimeSlot',
      finalTimeSlot
    );


    sessionStorage.setItem(
      'vehicleNumber',
      finalVehicle
    );


    sessionStorage.setItem(
      'bookingDate',
      finalDate
    );


    sessionStorage.setItem(
      'verifiedFarmerName',
      farmerName
    );


    sessionStorage.setItem(
      'verifiedAadhaar',
      aadhaar
    );


    // ======================================
    // UPDATE STAGE 4
    // ======================================

    updateStage4FromBooking(
      frontendBooking
    );


    if (
      typeof window.refreshStage4 ===
      'function'
    ) {

      window.refreshStage4();

    }


    // ======================================
    // NOTIFICATION MODAL
    // ======================================

    const modalToken =
      document.getElementById(
        'modal-token-tag'
      );


    const alertText =
      document.getElementById(
        'modal-alert-text'
      );


    if (modalToken) {

      modalToken.innerText =
        finalToken;

    }


    if (alertText) {

      alertText.innerText =
        `DoCA Alert: Slot confirmed for ` +
        `${farmerName}. ` +
        `Token: ${finalToken} for ` +
        `${cropText} (${finalQuantity} qtl) on ` +
        `${finalDate} (${finalTimeSlot}) ` +
        `at ${finalCenter}.`;

    }


    const notificationModal =
      document.getElementById(
        'notification-fanout-modal'
      );


    if (notificationModal) {

      notificationModal.classList.add(
        'open'
      );

    }


    console.log(
      '[Stage 3] Booking completed successfully:',
      frontendBooking
    );


  } catch (error) {

    console.error(
      '[Stage 3 Booking Error]',
      error
    );


    alert(
      `Slot booking failed: ${error.message}`
    );


  } finally {

    if (bookingButton) {

      bookingButton.disabled =
        false;

      bookingButton.innerHTML =
        originalHTML;

    }


    window.__kisanSetuBookingInProgress =
      false;

  }

}


// ==========================================
// UPDATE STAGE 4 FROM REAL BOOKING
// ==========================================

function updateStage4FromBooking(
  booking
) {

  if (!booking) {
    return;
  }


  // ----------------------------------------
  // TOKEN
  // ----------------------------------------

  const tokenDisplay =
    document.getElementById(
      'token-display-id'
    );


  if (tokenDisplay) {

    tokenDisplay.innerText =
      booking.tokenId ||
      'Pending';

  }


  // ----------------------------------------
  // FARMER
  // ----------------------------------------

  const farmerName =
    booking.farmerName ||
    getVerifiedFarmerName();


  // ----------------------------------------
  // CROP
  // ----------------------------------------

  const cropElement =
    document.getElementById(
      'crop-select'
    );


  const selectedCropText =
    booking.cropText ||
    cropElement?.options[
      cropElement.selectedIndex
    ]?.text ||
    booking.cropType ||
    'Crop';


  const farmerDescription =
    document.getElementById(
      'token-farmer-desc'
    );


  if (farmerDescription) {

    farmerDescription.innerText =
      `${farmerName} • ${selectedCropText}`;

  }


  // ========================================
  // QR / TOKEN SLIP DATA
  // ========================================

  const qrFarmer =
    document.getElementById(
      'qr-farmer-name'
    );


  const qrCrop =
    document.getElementById(
      'qr-crop-type'
    );


  const qrQuantity =
    document.getElementById(
      'qr-booked-qty'
    );


  const qrCentre =
    document.getElementById(
      'qr-mandi-centre'
    );


  const qrVehicle =
    document.getElementById(
      'qr-vehicle-plate'
    );


  const qrDateSlot =
    document.getElementById(
      'qr-date-slot'
    );


  if (qrFarmer) {

    qrFarmer.innerText =
      farmerName;

  }


  if (qrCrop) {

    qrCrop.innerText =
      selectedCropText;

  }


  if (qrQuantity) {

    qrQuantity.innerText =
      `${booking.quantityQuintals || 0} Quintals`;

  }


  if (qrCentre) {

    qrCentre.innerText =
      booking.center ||
      currentTargetMandi;

  }


  if (qrVehicle) {

    qrVehicle.innerText =
      booking.vehicleNumber ||
      sessionStorage.getItem(
        'vehicleNumber'
      ) ||
      'Not provided';

  }


  if (qrDateSlot) {

    qrDateSlot.innerText =
      `${booking.date || ''} (${booking.timeSlot || ''})`;

  }


  // ========================================
  // SAVE FOR STAGE 4
  // ========================================

  sessionStorage.setItem(
    'stage4BookingData',
    JSON.stringify(
      booking
    )
  );


  console.log(
    '[Stage 3] Stage 4 synchronized:',
    {
      token: booking.tokenId,
      farmer: farmerName,
      crop: selectedCropText,
      quantity: booking.quantityQuintals,
      date: booking.date,
      slot: booking.timeSlot,
      center: booking.center,
      vehicle: booking.vehicleNumber
    }
  );

}


// ==========================================
// EXPOSE FUNCTIONS FOR EXISTING HTML
// ==========================================

window.selectSlot =
  selectSlot;

window.updateMandiStatus =
  updateMandiStatus;

window.applyReroute =
  applyReroute;

window.submitSlotBooking =
  submitSlotBooking;

window.updateStage4FromBooking =
  updateStage4FromBooking;