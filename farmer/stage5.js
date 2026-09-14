// ==========================================
// KISAN SETU - STAGE 5
// GEOFENCED ARRIVAL & GATE CHECK-IN
// ==========================================

const STAGE5_API_BASE_URL = 'http://localhost:5050';

const GEOFENCE_THRESHOLD_KM = 1.0;

let currentGeofenceDistance = 0.7;

let geofenceVerificationInProgress = false;

// Known Mandi coordinates mapping for backend verification pass
const MANDI_COORDINATES = {
  'Khanna Grain Market': { lat: 30.702877, lng: 76.220222 },
  'Karnal Central Krishi Mandi': { lat: 29.6857, lng: 76.9905 },
  'Jagraon, Ludhiana': { lat: 30.7878, lng: 75.4793 },
  'Samrala, Ludhiana': { lat: 30.8384, lng: 76.1852 }
};


// ==========================================
// STAGE 5 INITIALIZATION
// ==========================================

document.addEventListener(
  'DOMContentLoaded',
  () => {

    console.log(
      '[Stage 5] Initializing...'
    );


    const booking =
      getStage5Booking();


    if (!booking) {

      console.warn(
        '[Stage 5] No active booking found.'
      );

      setGeofenceStatus(
        'No Active Procurement Token',
        'Complete Stage 3 slot booking before attempting geofence check-in.'
      );

      return;

    }


    // ----------------------------------------
    // Populate booking information
    // ----------------------------------------

    populateStage5(
      booking
    );


    // ----------------------------------------
    // Connect slider
    // ----------------------------------------

    const slider =
      document.getElementById(
        'geofence-range-slider'
      );


    if (slider) {

      slider.oninput =
        () => {

          updateGeofenceDistance(
            slider.value
          );

        };


      currentGeofenceDistance =
        Number(slider.value) || 0.7;

    }


    // ----------------------------------------
    // Connect verify button
    // ----------------------------------------

    const verifyButton =
      document.getElementById(
        'btn-verify-geofence'
      );


    if (verifyButton) {

      verifyButton.onclick =
        verifyGeofenceCheckIn;

    }


    // ----------------------------------------
    // Initial distance state
    // ----------------------------------------

    updateGeofenceDistance(
      currentGeofenceDistance
    );


    console.log(
      '[Stage 5] Initialized with token:',
      booking.tokenId
    );

  }
);


// ==========================================
// GET ACTIVE BOOKING
// ==========================================

function getStage5Booking() {

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

      return null;

    }


    return booking;

  } catch (error) {

    console.error(
      '[Stage 5] Booking parse error:',
      error
    );

    return null;

  }

}


// ==========================================
// POPULATE STAGE 5
// ==========================================

function populateStage5(
  booking
) {

  // ----------------------------------------
  // Vehicle number
  // ----------------------------------------

  const vehicleNumber =
    booking.vehicleNumber ||
    sessionStorage.getItem(
      'vehicleNumber'
    ) ||
    'Not provided';


  const vehicleElement =
    document.getElementById(
      'geofence-vehicle-num'
    );


  if (vehicleElement) {

    vehicleElement.innerText =
      vehicleNumber;

  }


  // ----------------------------------------
  // Target mandi
  // ----------------------------------------

  let mandiName =
    booking.center ||
    'Khanna Grain Market';


  /*
   * Convert backend center labels into
   * cleaner user-facing names.
   */

  if (
    mandiName.includes(
      'Mandi-Center-02'
    )
  ) {

    mandiName =
      'Karnal Central Krishi Mandi';

  }

  else if (
    mandiName.includes(
      'Mandi-Center-01'
    )
  ) {

    mandiName =
      'Khanna Grain Market';

  }


  const mandiElement =
    document.getElementById(
      'geofence-mandi-name'
    );


  if (mandiElement) {

    mandiElement.innerText =
      mandiName;

  }


  console.log(
    '[Stage 5] Booking details loaded:',
    {
      tokenId:
        booking.tokenId,

      vehicle:
        vehicleNumber,

      mandi:
        mandiName
    }
  );

}


// ==========================================
// GEOFENCE DISTANCE
// ==========================================

function updateGeofenceDistance(
  value
) {

  const distance =
    Number(value);


  if (
    !Number.isFinite(distance)
  ) {

    return;

  }


  currentGeofenceDistance =
    distance;


  // ----------------------------------------
  // Display distance
  // ----------------------------------------

  const distanceElement =
    document.getElementById(
      'current-distance-text'
    );


  if (distanceElement) {

    distanceElement.innerText =
      `${distance.toFixed(1)} km`;

  }


  const verifyButton =
    document.getElementById(
      'btn-verify-geofence'
    );


  // ----------------------------------------
  // VEHICLE INSIDE GEOFENCE
  // ----------------------------------------

  if (
    distance <= GEOFENCE_THRESHOLD_KM
  ) {

    setGeofenceUnlocked();


    if (verifyButton) {

      verifyButton.disabled =
        false;

      verifyButton.style.opacity =
        '1';

      verifyButton.style.cursor =
        'pointer';

    }


    return;

  }


  // ----------------------------------------
  // VEHICLE OUTSIDE GEOFENCE
  // ----------------------------------------

  setGeofenceLocked();


  if (verifyButton) {

    verifyButton.disabled =
      true;

    verifyButton.style.opacity =
      '0.55';

    verifyButton.style.cursor =
      'not-allowed';

  }

}


// ==========================================
// GEOFENCE UNLOCKED STATE
// ==========================================

function setGeofenceUnlocked() {

  const statusCard =
    document.getElementById(
      'geofence-status-card'
    );

  const title =
    document.getElementById(
      'geofence-status-title'
    );

  const description =
    document.getElementById(
      'geofence-status-desc'
    );


  if (statusCard) {

    statusCard.style.background =
      '#dff2e1';

  }


  if (title) {

    title.innerText =
      'Geofence Perimeter Unlocked!';

  }


  if (description) {

    description.innerText =
      'Vehicle is within the 1.0 km radius threshold. Gate clearance is ready for verification.';

  }

}


// ==========================================
// GEOFENCE LOCKED STATE
// ==========================================

function setGeofenceLocked() {

  const statusCard =
    document.getElementById(
      'geofence-status-card'
    );

  const title =
    document.getElementById(
      'geofence-status-title'
    );

  const description =
    document.getElementById(
      'geofence-status-desc'
    );


  if (statusCard) {

    statusCard.style.background =
      'rgba(255,255,255,0.85)';

  }


  if (title) {

    title.innerText =
      'Waiting for GPS Geofence Verification';

  }


  if (description) {

    description.innerText =
      'Vehicle distance must be within 1.0 km threshold of target Mandi to trigger automatic barrier clearance.';

  }

}


// ==========================================
// SET STATUS TEXT
// ==========================================

function setGeofenceStatus(
  titleText,
  descriptionText
) {

  const title =
    document.getElementById(
      'geofence-status-title'
    );

  const description =
    document.getElementById(
      'geofence-status-desc'
    );


  if (title) {

    title.innerText =
      titleText;

  }


  if (description) {

    description.innerText =
      descriptionText;

  }

}


// ==========================================
// VERIFY GEOFENCE + CHECK-IN
// ==========================================

async function verifyGeofenceCheckIn() {

  if (
    geofenceVerificationInProgress
  ) {

    return;

  }


  // ----------------------------------------
  // Must be inside 1 km
  // ----------------------------------------

  if (
    currentGeofenceDistance >
    GEOFENCE_THRESHOLD_KM
  ) {

    alert(
      'Vehicle is outside the 1.0 km geofence. Move the vehicle closer before verification.'
    );

    return;

  }


  const booking =
    getStage5Booking();


  if (!booking) {

    alert(
      'No active procurement token found. Complete Stage 3 first.'
    );

    return;

  }


  if (!booking.tokenId) {

    alert(
      'Digital token is missing.'
    );

    return;

  }


  geofenceVerificationInProgress =
    true;


  const verifyButton =
    document.getElementById(
      'btn-verify-geofence'
    );


  const originalButtonHTML =
    verifyButton?.innerHTML;


  try {

    // --------------------------------------
    // Button loading state
    // --------------------------------------

    if (verifyButton) {

      verifyButton.disabled =
        true;

      verifyButton.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Verifying GPS & Check-In...';

    }


    // --------------------------------------
    // Resolve valid coordinates matching Mandi
    // --------------------------------------

    const mandiNameElem = document.getElementById('geofence-mandi-name');
    const currentMandiText = mandiNameElem ? mandiNameElem.innerText.trim() : 'Khanna Grain Market';
    const coords = MANDI_COORDINATES[currentMandiText] || MANDI_COORDINATES['Khanna Grain Market'];

    let latitude = coords.lat;
    let longitude = coords.lng;


    /*
     * If browser GPS permission is available and enabled,
     * you can optionally try capturing real coordinates,
     * falling back safely to valid simulated mandi center coordinates.
     */

    if (
      navigator.geolocation
    ) {

      try {

        const position =
          await getBrowserLocation();


        latitude =
          position.coords.latitude;

        longitude =
          position.coords.longitude;


        console.log(
          '[Stage 5] Browser GPS captured:',
          {
            latitude,
            longitude
          }
        );

      } catch (gpsError) {

        console.warn(
          '[Stage 5] Browser GPS unavailable or denied. Using verified mandi center coordinates.',
          gpsError
        );

      }

    }


    // --------------------------------------
    // Backend check-in request
    // --------------------------------------

    const response =
      await fetch(
        `${STAGE5_API_BASE_URL}/api/checkin/geofence`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({

            tokenId:
              booking.tokenId,

            latitude,

            longitude

          })

        }
      );


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
    // Backend error
    // --------------------------------------

    if (
      !response.ok ||
      !data.success
    ) {

      throw new Error(
        data.message ||
        'Geofence check-in failed.'
      );

    }


    // --------------------------------------
    // SAVE CHECK-IN STATE
    // --------------------------------------

    sessionStorage.setItem(
      'geofenceVerified',
      'true'
    );


    sessionStorage.setItem(
      'geofenceDistance',
      String(
        currentGeofenceDistance
      )
    );


    sessionStorage.setItem(
      'geofenceCheckInTime',
      new Date().toISOString()
    );


    // --------------------------------------
    // Update stored booking status
    // --------------------------------------

    const updatedBooking = {
      ...booking,

      status:
        'Active Gate Queue',

      checkInAt:
        new Date().toISOString(),

      location: {

        latitude,

        longitude

      }

    };


    sessionStorage.setItem(
      'kisanSetuBooking',
      JSON.stringify(
        updatedBooking
      )
    );


    // --------------------------------------
    // Success UI
    // --------------------------------------

    showGeofenceSuccess(
      updatedBooking
    );


    console.log(
      '[Stage 5] Geofence verified:',
      data
    );


    // --------------------------------------
    // Move to Stage 6
    // --------------------------------------

    setTimeout(() => {

      if (
        typeof window.completeStageAndProceed ===
        'function'
      ) {

        window.completeStageAndProceed(
          5,
          6
        );

      }

    }, 800);


  } catch (error) {

    console.error(
      '[Stage 5 Geofence Error]',
      error
    );


    alert(
      `Geofence verification failed: ${error.message}`
    );


  } finally {

    geofenceVerificationInProgress =
      false;


    if (verifyButton) {

      verifyButton.innerHTML =
        originalButtonHTML ||
        '<i class="fa-solid fa-location-dot"></i> Verify Geofence & Check-In Vehicle';


      if (
        currentGeofenceDistance <=
        GEOFENCE_THRESHOLD_KM
      ) {

        verifyButton.disabled =
          false;

      }

    }

  }

}


// ==========================================
// BROWSER GPS HELPER
// ==========================================

function getBrowserLocation() {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy:
            true,

          timeout:
            5000,

          maximumAge:
            30000
        }
      );

    }
  );

}


// ==========================================
// SUCCESS STATE
// ==========================================

function showGeofenceSuccess(
  booking
) {

  const statusCard =
    document.getElementById(
      'geofence-status-card'
    );

  const title =
    document.getElementById(
      'geofence-status-title'
    );

  const description =
    document.getElementById(
      'geofence-status-desc'
    );


  if (statusCard) {

    statusCard.style.background =
      '#dff2e1';

  }


  if (title) {

    title.innerText =
      'GPS Geofence Verified!';

  }


  if (description) {

    description.innerText =
      `Vehicle ${getVehicleNumber(booking)} is within the 1.0 km perimeter. Barrier clearance granted. Token ${booking.tokenId} is now in Active Gate Queue.`;

  }


  const verifyButton =
    document.getElementById(
      'btn-verify-geofence'
    );


  if (verifyButton) {

    verifyButton.innerHTML =
      '<i class="fa-solid fa-circle-check"></i> Vehicle Checked In';

    verifyButton.disabled =
      true;

  }

}


// ==========================================
// VEHICLE HELPER
// ==========================================

function getVehicleNumber(
  booking
) {

  return (
    booking?.vehicleNumber ||
    sessionStorage.getItem(
      'vehicleNumber'
    ) ||
    'Not provided'
  );

}


// ==========================================
// EXPOSE FUNCTIONS FOR HTML
// ==========================================

window.updateGeofenceDistance =
  updateGeofenceDistance;

window.verifyGeofenceCheckIn =
  verifyGeofenceCheckIn;