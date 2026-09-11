const presets = {
  ramesh: {
    kcc: 'KCC-PB-2024-8841',
    aadhaar: 'XXXX-XXXX-4912',
    name: 'Sardar Ramesh Singh',
    phone: '+91 98765-43210',
    land: '4.5 Acres',
    khasra: 'Khatauni 114/208, Khasra 41//12/2',
    mandi: 'Khanna, Ludhiana',
    state: 'Punjab State',
    bank: 'State Bank of India',
    acc: 'A/C XXXX-XXXX-3312 • SBIN0001234',
    wheat: 'Max 87.5 Qtl',
    paddy: 'Max 128 Qtl'
  },
  kaur: {
    kcc: 'KCC-PB-2024-9102',
    aadhaar: 'XXXX-XXXX-8821',
    name: 'Surjit Kaur',
    phone: '+91 98123-55678',
    land: '6.2 Acres',
    khasra: 'Khatauni 88/102, Khasra 14//02',
    mandi: 'Jagraon, Ludhiana',
    state: 'Punjab State',
    bank: 'Punjab National Bank',
    acc: 'A/C XXXX-XXXX-9901 • PUNB0102000',
    wheat: 'Max 120 Qtl',
    paddy: 'Max 175 Qtl'
  },
  kumar: {
    kcc: 'KCC-HR-2024-3312',
    aadhaar: 'XXXX-XXXX-1102',
    name: 'Rajesh Kumar',
    phone: '+91 97290-12345',
    land: '3.0 Acres',
    khasra: 'Khatauni 42/55, Khasra 08//11',
    mandi: 'Karnal Mandi',
    state: 'Haryana State',
    bank: 'HDFC Bank',
    acc: 'A/C XXXX-XXXX-4412 • HDFC0000240',
    wheat: 'Max 60 Qtl',
    paddy: 'Max 90 Qtl'
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const presetButtons = document.querySelectorAll('.preset-pill');
  presetButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      presetButtons.forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');

      const presetKey = e.target.getAttribute('data-preset');
      const data = presets[presetKey];

      document.getElementById('kcc-input').value = data.kcc;
      document.getElementById('aadhaar-input').value = data.aadhaar;
      document.getElementById('farmer-name-val').innerText = data.name;
      document.getElementById('farmer-phone-val').innerText = data.phone;
      document.getElementById('land-size-val').innerText = data.land;
      document.getElementById('land-khasra-val').innerText = data.khasra;
      document.getElementById('loc-mandi-val').innerText = data.mandi;
      document.getElementById('loc-state-val').innerText = data.state;
      document.getElementById('bank-name-val').innerText = data.bank;
      document.getElementById('bank-acc-val').innerText = data.acc;
      document.getElementById('wheat-cap').innerText = data.wheat;
      document.getElementById('paddy-cap').innerText = data.paddy;
    });
  });

  const fetchBtn = document.getElementById('btn-fetch');
  if (fetchBtn) {
    fetchBtn.addEventListener('click', () => {
      fetchBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Fetching Records from Bhoomi...`;
      setTimeout(() => {
        fetchBtn.innerHTML = `<i class="fa-solid fa-shield-halved"></i> Auto-Fetch Verified Land & Bank Data`;
        alert('Land records & bank credentials verified successfully via Bhoomi API.');
      }, 700);
    });
  }
});