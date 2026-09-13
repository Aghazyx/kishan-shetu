// ==========================================
// KISAN SETU - FARMER VERIFICATION
// FRONTEND -> EXPRESS BACKEND
// ==========================================

const API_BASE_URL = 'http://localhost:5050';


// ==========================================
// DEMO FARMER PRESETS
// ==========================================

const presets = {
  ramesh: {
    kcc: 'KCC-PB-2024-8841',
    aadhaar: 'XXXX-XXXX-4912'
  },

  kaur: {
    kcc: 'KCC-PB-2024-9102',
    aadhaar: 'XXXX-XXXX-8821'
  },

  kumar: {
    kcc: 'KCC-HR-2024-3312',
    aadhaar: 'XXXX-XXXX-1102'
  }
};


// ==========================================
// HELPER
// ==========================================

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.innerText = value;
  }
}


// ==========================================
// PAGE INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {

  // ========================================
  // PRESET BUTTONS
  // ========================================

  const presetButtons =
    document.querySelectorAll('.preset-pill');

  presetButtons.forEach(button => {

    button.addEventListener('click', () => {

      presetButtons.forEach(btn => {
        btn.classList.remove('active');
      });

      button.classList.add('active');

      const presetKey =
        button.getAttribute('data-preset');

      const preset =
        presets[presetKey];

      if (!preset) {
        console.error(
          'Unknown farmer preset:',
          presetKey
        );

        return;
      }

      // Only populate the INPUT fields.
      // Do NOT populate the verified profile.
      document.getElementById('kcc-input').value =
        preset.kcc;

      document.getElementById('aadhaar-input').value =
        preset.aadhaar;

      // Reset fetched profile whenever
      // a different farmer is selected.

      setText(
        'farmer-name-val',
        'Not fetched'
      );

      setText(
        'farmer-phone-val',
        'Awaiting verification'
      );

      setText(
        'land-size-val',
        'Not fetched'
      );

      setText(
        'land-khasra-val',
        'Awaiting land record verification'
      );

      setText(
        'loc-mandi-val',
        'Not fetched'
      );

      setText(
        'loc-state-val',
        'Awaiting location verification'
      );

      setText(
        'bank-name-val',
        'Not fetched'
      );

      setText(
        'bank-acc-val',
        'Awaiting bank verification'
      );

      setText(
        'wheat-cap',
        'Not fetched'
      );

      setText(
        'paddy-cap',
        'Not fetched'
      );

      sessionStorage.removeItem('verifiedFarmer');
      sessionStorage.removeItem('verifiedKccNumber');
      sessionStorage.removeItem('verifiedAadhaar');

    });

  });


  // ========================================
  // AUTO-FETCH / BACKEND VERIFICATION
  // ========================================

  const fetchBtn =
    document.getElementById('btn-fetch');

  if (!fetchBtn) {

    console.error(
      'Kisan Setu: #btn-fetch was not found.'
    );

    return;
  }


  fetchBtn.addEventListener('click', async () => {

    const kccInput =
      document.getElementById('kcc-input');

    const aadhaarInput =
      document.getElementById('aadhaar-input');

    const kccNumber =
      kccInput?.value.trim();

    const aadhaar =
      aadhaarInput?.value.trim();


    // ======================================
    // VALIDATION
    // ======================================

    if (!kccNumber) {

      alert(
        'Please enter a KCC Number first.'
      );

      return;
    }


    // ======================================
    // SAVE ORIGINAL BUTTON
    // ======================================

    const originalHTML =
      fetchBtn.innerHTML;


    try {

      // ====================================
      // LOADING STATE
      // ====================================

      fetchBtn.disabled = true;

      fetchBtn.innerHTML =
        `<i class="fa-solid fa-spinner fa-spin"></i>
         Fetching Records from Bhoomi...`;


      console.log(
        'Kisan Setu: Requesting farmer data...',
        kccNumber
      );


      // ====================================
      // BACKEND REQUEST
      // ====================================

      const response =
        await fetch(
          `${API_BASE_URL}/api/auth/register-farmer`,
          {
            method: 'POST',

            headers: {
              'Content-Type': 'application/json'
            },

            body: JSON.stringify({

              kccNumber: kccNumber,

              // Backend currently requires a name
              // when creating a new farmer.
              // For the seeded demo KCC, the backend
              // will return the existing farmer record.

              name: 'Kisan Setu Farmer',

              phone: '',

              state: '',

              district: ''

            })
          }
        );


      // ====================================
      // READ RESPONSE
      // ====================================

      const data =
        await response.json();


      console.log(
        'Kisan Setu backend response:',
        data
      );


      // ====================================
      // ERROR CHECK
      // ====================================

      if (!response.ok || !data.success) {

        throw new Error(
          data.message ||
          'Farmer verification failed.'
        );

      }


      const farmer =
        data.farmer;


      if (!farmer) {

        throw new Error(
          'Backend returned no farmer profile.'
        );

      }


      // ====================================
      // POPULATE VERIFIED PROFILE
      // ====================================

      setText(
        'farmer-name-val',
        farmer.name || 'Not available'
      );


      setText(
        'farmer-phone-val',
        farmer.phone || 'Not available'
      );


      if (
        farmer.landHoldingAcres !== undefined
      ) {

        setText(
          'land-size-val',
          `${farmer.landHoldingAcres} Acres`
        );

      }


      if (farmer.khasra) {

        setText(
          'land-khasra-val',
          farmer.khasra
        );

      }


      if (farmer.mandi) {

        setText(
          'loc-mandi-val',
          farmer.mandi
        );

      } else if (farmer.district) {

        setText(
          'loc-mandi-val',
          farmer.district
        );

      }


      if (farmer.state) {

        setText(
          'loc-state-val',
          farmer.state
        );

      }


      if (farmer.verifiedBank) {

        setText(
          'bank-name-val',
          farmer.verifiedBank
        );

      }


      if (farmer.bankAccount) {

        setText(
          'bank-acc-val',
          farmer.bankAccount
        );

      }


      // ====================================
      // DEMO CROP LIMITS
      // ====================================
      // Current backend does not return crop
      // capacity values, so these are only
      // populated for the seeded demo farmer.

      if (farmer.kccNumber === 'KCC-PB-2024-8841') {

        setText(
          'wheat-cap',
          'Max 87.5 Qtl'
        );

        setText(
          'paddy-cap',
          'Max 128 Qtl'
        );

      }


      // ====================================
      // SAVE VERIFIED SESSION
      // ====================================

      sessionStorage.setItem(
        'verifiedKccNumber',
        farmer.kccNumber || kccNumber
      );

      sessionStorage.setItem(
        'verifiedAadhaar',
        aadhaar || ''
      );

      sessionStorage.setItem(
        'verifiedFarmer',
        JSON.stringify(farmer)
      );


      // ====================================
      // SUCCESS STATE
      // ====================================

      fetchBtn.innerHTML =
        `<i class="fa-solid fa-circle-check"></i>
         Farmer Records Verified`;


      console.log(
        'Kisan Setu: Farmer verified successfully:',
        farmer
      );


      alert(
        data.message ||
        'Land records & bank credentials verified successfully.'
      );


    } catch (error) {

      // ====================================
      // ERROR HANDLING
      // ====================================

      console.error(
        'Kisan Setu verification error:',
        error
      );


      alert(
        `Verification failed: ${error.message}`
      );


    } finally {

      // ====================================
      // RESTORE BUTTON
      // ====================================

      fetchBtn.disabled = false;

      if (
        fetchBtn.innerHTML.includes(
          'Fetching Records'
        )
      ) {

        fetchBtn.innerHTML =
          originalHTML;

      }

    }

  });

});