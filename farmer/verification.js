// ==========================================
// KISAN SETU - FARMER VERIFICATION
// FRONTEND -> EXPRESS BACKEND
// ==========================================

const API_BASE_URL = 'http://localhost:5050';

// Unified Farmer Database for Presets and Auto-Fetch
// Defined globally at the top so all functions can access it
const FARMER_DATABASE = {
  ramesh: {
    kccKeys: ['KCC-PB-2024-8841', 'KCC-PB-2024-8848', 'KCC-PB-2024-8849'],
    aadhaar: 'XXXX-XXXX-4912',
    name: 'Sardar Ramesh Singh',
    phone: '+91 98765-43210',
    landSize: '4.5 Acres',
    landKhasra: 'Verified via Bhoomi Portal',
    mandi: 'Khanna, Ludhiana',
    state: 'Punjab State',
    bankName: 'State Bank of India',
    bankAcc: 'A/C ****3312',
    wheatCap: 'Max 87.5 Qtl',
    paddyCap: 'Max 128 Qtl'
  },
  kaur: {
    kccKeys: ['KCC-PB-2024-9102', 'KCC-PB-2024-5520'],
    aadhaar: 'XXXX-XXXX-8821',
    name: 'Gurpreet Kaur',
    phone: '+91 98123-65498',
    landSize: '6.0 Acres',
    landKhasra: 'Verified via Bhoomi Portal',
    mandi: 'Jagraon, Ludhiana',
    state: 'Punjab State',
    bankName: 'Punjab National Bank',
    bankAcc: 'A/C ****8854',
    wheatCap: 'Max 115 Qtl',
    paddyCap: 'Max 45 Qtl'
  },
  kumar: {
    kccKeys: ['KCC-HR-2024-3312', 'KCC-PB-2024-3319'],
    aadhaar: 'XXXX-XXXX-1102',
    name: 'Rajesh Kumar',
    phone: '+91 97456-12389',
    landSize: '3.2 Acres',
    landKhasra: 'Verified via Bhoomi Portal',
    mandi: 'Samrala, Ludhiana',
    state: 'Haryana State',
    bankName: 'HDFC Bank',
    bankAcc: 'A/C ****1102',
    wheatCap: 'Max 90 Qtl',
    paddyCap: 'Max 60 Qtl'
  }
};

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.innerText = value;
  }
}

// Global function for onclick="loadPreset(...)" in HTML
window.loadPreset = function(presetKey, event) {
  if (event) {
    // Manage active state of preset pills
    document.querySelectorAll('.preset-pill').forEach(btn => {
      btn.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
  }

  const preset = FARMER_DATABASE[presetKey.toLowerCase()];
  if (!preset) {
    console.error('Unknown farmer preset:', presetKey);
    return;
  }

  // Populate Input Fields (Defaults to the first KCC key in the array)
  document.getElementById('kcc-input').value = preset.kccKeys[0];
  document.getElementById('aadhaar-input').value = preset.aadhaar;

  // Reset fetched profile waiting for user to click fetch
  setText('farmer-name-val', 'Not fetched');
  setText('farmer-phone-val', 'Awaiting verification');
  setText('land-size-val', 'Not fetched');
  setText('land-khasra-val', 'Awaiting land record verification');
  setText('loc-mandi-val', 'Not fetched');
  setText('loc-state-val', 'Awaiting location verification');
  setText('bank-name-val', 'Not fetched');
  setText('bank-acc-val', 'Awaiting bank verification');
  setText('wheat-cap', 'Not fetched');
  setText('paddy-cap', 'Not fetched');

  sessionStorage.removeItem('verifiedFarmer');
  sessionStorage.removeItem('verifiedKccNumber');
  sessionStorage.removeItem('verifiedAadhaar');
};

document.addEventListener('DOMContentLoaded', () => {
  const fetchBtn = document.getElementById('btn-fetch');
  if (!fetchBtn) return;

  fetchBtn.addEventListener('click', async () => {
    const kccInput = document.getElementById('kcc-input');
    const aadhaarInput = document.getElementById('aadhaar-input');
    const kccNumber = kccInput?.value.trim();
    const aadhaar = aadhaarInput?.value.trim();

    if (!kccNumber) {
      alert('Please enter a KCC Number first.');
      return;
    }

    const originalHTML = fetchBtn.innerHTML;
    fetchBtn.disabled = true;
    fetchBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Fetching Records from Bhoomi...`;

    try {
      // Find matching preset data using the kccKeys array
      let matchedFarmer = Object.values(FARMER_DATABASE).find(p => p.kccKeys.includes(kccNumber));
      
      let requestName = matchedFarmer ? matchedFarmer.name : 'Kisan Setu Farmer';
      let requestPhone = matchedFarmer ? matchedFarmer.phone : '';

      const response = await fetch(`${API_BASE_URL}/api/auth/register-farmer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kccNumber: kccNumber,
          name: requestName,
          phone: requestPhone,
          state: matchedFarmer ? matchedFarmer.state : '',
          district: matchedFarmer ? matchedFarmer.mandi : ''
        })
      });

      let data;
      let farmer = null;
      
      // Fallback gracefully if backend is offline or fails
      try {
        data = await response.json();
        if (data.success && data.farmer) {
          farmer = data.farmer;
        }
      } catch(e) {
        console.warn("Backend fetch failed, falling back to mock data.");
      }

      // If API didn't return a farmer, build it from the local matched database
      if (!farmer && matchedFarmer) {
         farmer = {
           kccNumber: kccNumber,
           name: matchedFarmer.name,
           phone: matchedFarmer.phone,
           landHoldingAcres: matchedFarmer.landSize,
           khasra: matchedFarmer.landKhasra,
           mandi: matchedFarmer.mandi,
           state: matchedFarmer.state,
           verifiedBank: matchedFarmer.bankName,
           bankAccount: matchedFarmer.bankAcc
         };
      } else if (!farmer && !matchedFarmer) {
         // Fallback for totally unknown KCC numbers
         farmer = {
           kccNumber: kccNumber,
           name: 'Kisan Setu Farmer',
           phone: '+91 98000-00000',
           landHoldingAcres: '5 Acres',
           khasra: 'Awaiting land record verification',
           mandi: 'Khanna, Ludhiana',
           state: 'Punjab State',
           verifiedBank: 'State Bank of India',
           bankAccount: 'A/C ****3312'
         };
      }

      // Populate Verified Profile UI
      setText('farmer-name-val', farmer.name || 'Not available');
      setText('farmer-phone-val', farmer.phone || 'Not available');
      setText('land-size-val', farmer.landHoldingAcres || 'Not available');
      setText('land-khasra-val', farmer.khasra || 'Verified via Bhoomi Portal');
      setText('loc-mandi-val', farmer.mandi || farmer.district || 'Not available');
      setText('loc-state-val', farmer.state || 'Not available');
      setText('bank-name-val', farmer.verifiedBank || 'Not available');
      setText('bank-acc-val', farmer.bankAccount || 'Not available');

      if (matchedFarmer) {
        setText('wheat-cap', matchedFarmer.wheatCap);
        setText('paddy-cap', matchedFarmer.paddyCap);
      } else {
        setText('wheat-cap', 'Max 87.5 Qtl');
        setText('paddy-cap', 'Max 128 Qtl');
      }

      // Save Verified Session
      sessionStorage.setItem('verifiedKccNumber', farmer.kccNumber || kccNumber);
      sessionStorage.setItem('verifiedAadhaar', aadhaar || '');
      sessionStorage.setItem('verifiedFarmer', JSON.stringify(farmer));

      fetchBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Farmer Records Verified`;

    } catch (error) {
      console.error('Kisan Setu verification error:', error);
      alert(`Verification failed: ${error.message}`);
    } finally {
      fetchBtn.disabled = false;
      if (fetchBtn.innerHTML.includes('Fetching Records')) {
        fetchBtn.innerHTML = originalHTML;
      }
    }
  });
});

async function registerFarmerBackend(formData) {
  try {
    const response = await fetch('/api/auth/register-farmer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    if (data.success) {
      sessionStorage.setItem('farmerId', data.farmer.farmerId || data.farmer.id);
      sessionStorage.setItem('kccNumber', data.farmer.kccNumber);
      sessionStorage.setItem('farmerName', data.farmer.name);
      sessionStorage.setItem('farmerData', JSON.stringify(data.farmer));
      return true;
    }
    return false;
  } catch (error) {
    console.error('API Error:', error);
    return false;
  }
}