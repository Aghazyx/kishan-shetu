// ================================================================
// KISAN SETU ADMIN PORTAL
// A3 • FARMER MANAGEMENT
// ================================================================

const API_BASE_URL = 'http://localhost:5050';


// ================================================================
// ADMIN SESSION
// ================================================================

const getAdminSession = () => {
  return sessionStorage.getItem('kisanSetuAdminSession');
};


const isAdminAuthenticated = () => {
  return Boolean(getAdminSession());
};


const handleSessionExpired = () => {
  sessionStorage.removeItem('kisanSetuAdminAuthenticated');
  sessionStorage.removeItem('kisanSetuAdminUser');
  sessionStorage.removeItem('kisanSetuAdminSession');

  window.location.href = 'admin.html';
};


// ================================================================
// DOM HELPERS
// ================================================================

const getElement = (...ids) => {
  for (const id of ids) {
    const element = document.getElementById(id);

    if (element) {
      return element;
    }
  }

  return null;
};


const setText = (element, value) => {
  if (element) {
    element.textContent = value;
  }
};


// ================================================================
// PAGE ELEMENTS
// ================================================================

const farmerSearchInput = getElement(
  'farmer-search-input',
  'farmer-search',
  'search-farmers',
  'farmerSearch',
  'searchInput'
);


const farmerTableBody = getElement(
  'farmer-table-body',
  'farmers-table-body',
  'farmerTableBody',
  'farmersTableBody'
);


const totalFarmersElement = getElement(
  'total-farmers',
  'totalFarmers',
  'farmer-count'
);


const activeFarmersElement = getElement(
  'active-farmers',
  'activeFarmers',
  'active-bookings'
);


const completedFarmersElement = getElement(
  'completed-farmers',
  'completedFarmers',
  'completed-transactions'
);


const totalProcurementElement = getElement(
  'total-procurement',
  'totalProcurement'
);


const pageMessage = getElement(
  'farmer-status-message',
  'farmers-message',
  'farmer-message',
  'page-message'
);


const loadingElement = getElement(
  'farmer-loading'
);


const emptyStateElement = getElement(
  'farmer-empty-state'
);


const tableContainerElement = getElement(
  'farmer-table-container'
);


const refreshButton = getElement(
  'refresh-farmers',
  'refreshFarmers',
  'refresh-button'
);


// ================================================================
// STATE
// ================================================================

let allFarmers = [];

let searchTimeout = null;

// Prevent an older API response from overwriting newer data.
let farmerRequestSequence = 0;

// Abort an older request when a new search/refresh starts.
let farmerRequestController = null;

// Prevent duplicate global event listeners.
let farmersPageInitialized = false;


// ================================================================
// FORMATTERS
// ================================================================

const formatNumber = (value) => {
  const number = Number(value || 0);

  return number.toLocaleString('en-IN', {
    maximumFractionDigits: 2
  });
};


const formatCurrency = (value) => {
  const number = Number(value || 0);

  return `₹${number.toLocaleString('en-IN', {
    maximumFractionDigits: 2
  })}`;
};


const formatDate = (value) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};


const formatCrop = (crop) => {
  if (!crop) {
    return '—';
  }

  const text = String(crop);

  return text.charAt(0).toUpperCase() +
    text.slice(1).toLowerCase();
};


const escapeHTML = (value) => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};


// ================================================================
// STATUS HELPERS
// ================================================================

const getFarmerStatus = (farmer) => {
  const activeBookings =
    Number(farmer.activeBookings || 0);

  const completedTransactions =
    Number(farmer.completedTransactions || 0);

  if (activeBookings > 0) {
    return {
      label: 'Active',
      className: 'status-active'
    };
  }

  if (completedTransactions > 0) {
    return {
      label: 'Completed',
      className: 'status-completed'
    };
  }

  return {
    label: 'Registered',
    className: 'status-registered'
  };
};


// ================================================================
// PAGE MESSAGE
// ================================================================

const showMessage = (message, type = 'info') => {
  if (!pageMessage) {
    return;
  }

  pageMessage.textContent = message;

  pageMessage.className =
    `page-message ${type}`;
};


// ================================================================
// LOADING / EMPTY STATE
// ================================================================

const setLoadingState = (isLoading) => {
  if (loadingElement) {
    loadingElement.style.display =
      isLoading ? '' : 'none';
  }

  if (refreshButton) {
    refreshButton.disabled = isLoading;
  }
};


const setEmptyState = (isEmpty) => {
  if (emptyStateElement) {
    emptyStateElement.style.display =
      isEmpty ? '' : 'none';
  }

  if (tableContainerElement) {
    tableContainerElement.style.display =
      isEmpty ? 'none' : '';
  }
};


// ================================================================
// LOAD FARMERS
// ================================================================

const loadFarmers = async (search = '') => {

  if (!isAdminAuthenticated()) {
    handleSessionExpired();
    return;
  }

  // Abort any previous request.
  if (farmerRequestController) {
    farmerRequestController.abort();
  }

  farmerRequestController =
    new AbortController();

  const requestController =
    farmerRequestController;

  const requestSequence =
    ++farmerRequestSequence;

  setLoadingState(true);

  showMessage(
    'Loading farmer records...',
    'loading'
  );

  try {

    const session = getAdminSession();

    if (!session) {
      handleSessionExpired();
      return;
    }

    const trimmedSearch =
      String(search || '').trim();

    const query =
      trimmedSearch
        ? `?search=${encodeURIComponent(trimmedSearch)}`
        : '';

    const response =
      await fetch(
        `${API_BASE_URL}/api/admin/farmers${query}`,
        {
          method: 'GET',

          headers: {
            'x-admin-session': session,
            'Accept': 'application/json'
          },

          signal: requestController.signal
        }
      );


    // A newer request has already started.
    if (requestSequence !== farmerRequestSequence) {
      return;
    }


    let data = {};

    try {
      data = await response.json();
    } catch {
      throw new Error(
        'The administration backend returned an invalid response.'
      );
    }


    // 401/403 both indicate an invalid or expired admin session.
    if (
      response.status === 401 ||
      response.status === 403 ||
      data.authenticated === false
    ) {
      handleSessionExpired();
      return;
    }


    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
        'Unable to load farmer records.'
      );
    }


    // Never replace valid data with an unexpected non-array.
    allFarmers =
      Array.isArray(data.farmers)
        ? data.farmers
        : [];


    renderSummary(data);

    renderFarmers(allFarmers);


    showMessage(
      `${allFarmers.length} farmer record(s) loaded.`,
      'success'
    );


  } catch (error) {

    // Ignore intentionally cancelled requests.
    if (error.name === 'AbortError') {
      return;
    }


    // Do not allow an older failed request
    // to overwrite the result of a newer request.
    if (requestSequence !== farmerRequestSequence) {
      return;
    }


    console.error(
      '[A3 Farmer Management Error]',
      error
    );


    allFarmers = [];

    renderSummary({
      totalRegisteredFarmers: 0,
      totalFarmers: 0
    });

    renderFarmers([]);


    showMessage(
      error.message ||
      'Unable to connect to the administration backend.',
      'error'
    );


  } finally {

    // Only the current request may control loading state.
    if (requestSequence === farmerRequestSequence) {
      setLoadingState(false);

      if (farmerRequestController === requestController) {
        farmerRequestController = null;
      }
    }

  }

};


// ================================================================
// SUMMARY CARDS
// ================================================================

const renderSummary = (data = {}) => {

  const farmers = allFarmers;


  const activeCount =
    farmers.filter(
      farmer =>
        Number(
          farmer.activeBookings || 0
        ) > 0
    ).length;


  const completedCount =
    farmers.filter(
      farmer =>
        Number(
          farmer.completedTransactions || 0
        ) > 0
    ).length;


  // IMPORTANT:
  // Use actual procured quantity from the backend.
  // Do not calculate payout/procurement from booked quantity.
  const totalProcurement =
    farmers.reduce(
      (total, farmer) => {

        return (
          total +
          Number(
            farmer.totalProcuredQuintals || 0
          )
        );

      },
      0
    );


  const totalFarmerCount =
    data.totalRegisteredFarmers ??
    data.totalFarmers ??
    farmers.length;


  setText(
    totalFarmersElement,
    formatNumber(totalFarmerCount)
  );


  setText(
    activeFarmersElement,
    formatNumber(activeCount)
  );


  setText(
    completedFarmersElement,
    formatNumber(completedCount)
  );


  setText(
    totalProcurementElement,
    `${formatNumber(totalProcurement)} qtl`
  );

};


// ================================================================
// RENDER FARMER TABLE
// ================================================================

const renderFarmers = (farmers = []) => {

  if (!farmerTableBody) {

    console.warn(
      '[A3] Farmer table body element not found.'
    );

    return;

  }


  farmerTableBody.innerHTML = '';


  if (!farmers.length) {

    setEmptyState(true);

    farmerTableBody.innerHTML = `
      <tr>
        <td
          colspan="10"
          class="empty-state"
        >
          No farmer records found.
        </td>
      </tr>
    `;

    return;

  }


  setEmptyState(false);


  farmers.forEach(farmer => {

    const status =
      getFarmerStatus(farmer);


    const row =
      document.createElement('tr');


    row.innerHTML = `

      <td>
        <strong>
          ${escapeHTML(
            farmer.name || 'Unknown Farmer'
          )}
        </strong>

        <div class="table-subtext">
          ${escapeHTML(
            farmer.id || '—'
          )}
        </div>
      </td>


      <td>
        <span class="kcc-number">
          ${escapeHTML(
            farmer.kccNumber || '—'
          )}
        </span>
      </td>


      <td>
        ${escapeHTML(
          farmer.phone || '—'
        )}
      </td>


      <td>
        ${escapeHTML(
          farmer.district || '—'
        )}
      </td>


      <td>
        ${formatNumber(
          farmer.landHoldingAcres
        )}
        acres
      </td>


      <td>
        ${formatNumber(
          farmer.totalBookings
        )}
      </td>


      <td>
        ${formatNumber(
          farmer.totalProcuredQuintals
        )}
        qtl
      </td>


      <td>
        ${formatCurrency(
          farmer.totalPayout
        )}
      </td>


      <td>
        <span
          class="status-badge ${status.className}"
        >
          ${status.label}
        </span>
      </td>


      <td>

        <button
          type="button"
          class="view-farmer-btn"
          data-farmer-id="${escapeHTML(
            farmer.id || ''
          )}"
        >
          View Details
        </button>

      </td>

    `;


    farmerTableBody.appendChild(row);

  });


  attachFarmerButtons();

};


// ================================================================
// FARMER DETAIL BUTTONS
// ================================================================

const attachFarmerButtons = () => {

  const buttons =
    document.querySelectorAll(
      '.view-farmer-btn'
    );


  buttons.forEach(button => {

    // Prevent duplicate click listeners if the table
    // is rendered repeatedly.
    if (button.dataset.bound === 'true') {
      return;
    }

    button.dataset.bound = 'true';


    button.addEventListener(
      'click',
      () => {

        const farmerId =
          button.dataset.farmerId;


        const farmer =
          allFarmers.find(
            item =>
              String(item.id) ===
              String(farmerId)
          );


        if (farmer) {
          openFarmerDetails(farmer);
        }

      }
    );

  });

};


// ================================================================
// FARMER DETAILS MODAL
// ================================================================

const openFarmerDetails = (farmer) => {

  let modal =
    document.getElementById(
      'farmer-details-modal'
    );


  if (!modal) {
    modal = createFarmerDetailsModal();
  }


  const content =
    modal.querySelector(
      '.farmer-details-content'
    );


  if (!content) {
    return;
  }


  const latestBooking =
    farmer.latestBooking;


  const latestReceipt =
    farmer.latestReceipt;


  const crops =
    Array.isArray(farmer.crops)
      ? farmer.crops.join(', ')
      : '—';


  content.innerHTML = `

    <div class="farmer-detail-grid">

      <div class="detail-group">
        <span class="detail-label">
          Farmer Name
        </span>

        <strong>
          ${escapeHTML(
            farmer.name || '—'
          )}
        </strong>
      </div>


      <div class="detail-group">
        <span class="detail-label">
          Farmer ID
        </span>

        <strong>
          ${escapeHTML(
            farmer.id || '—'
          )}
        </strong>
      </div>


      <div class="detail-group">
        <span class="detail-label">
          KCC Number
        </span>

        <strong>
          ${escapeHTML(
            farmer.kccNumber || '—'
          )}
        </strong>
      </div>


      <div class="detail-group">
        <span class="detail-label">
          Phone
        </span>

        <strong>
          ${escapeHTML(
            farmer.phone || '—'
          )}
        </strong>
      </div>


      <div class="detail-group">
        <span class="detail-label">
          State
        </span>

        <strong>
          ${escapeHTML(
            farmer.state || '—'
          )}
        </strong>
      </div>


      <div class="detail-group">
        <span class="detail-label">
          District
        </span>

        <strong>
          ${escapeHTML(
            farmer.district || '—'
          )}
        </strong>
      </div>


      <div class="detail-group">
        <span class="detail-label">
          Land Holding
        </span>

        <strong>
          ${formatNumber(
            farmer.landHoldingAcres
          )}
          acres
        </strong>
      </div>


      <div class="detail-group">
        <span class="detail-label">
          Mandi
        </span>

        <strong>
          ${escapeHTML(
            farmer.mandi || '—'
          )}
        </strong>
      </div>


      <div class="detail-group">
        <span class="detail-label">
          Registered
        </span>

        <strong>
          ${formatDate(
            farmer.registeredAt
          )}
        </strong>
      </div>


      <div class="detail-group">
        <span class="detail-label">
          Crops
        </span>

        <strong>
          ${escapeHTML(crops)}
        </strong>
      </div>

    </div>


    <div class="farmer-detail-section">

      <h4>
        Procurement Summary
      </h4>


      <div class="farmer-detail-grid">

        <div class="detail-group">
          <span class="detail-label">
            Total Bookings
          </span>

          <strong>
            ${formatNumber(
              farmer.totalBookings
            )}
          </strong>
        </div>


        <div class="detail-group">
          <span class="detail-label">
            Active Bookings
          </span>

          <strong>
            ${formatNumber(
              farmer.activeBookings
            )}
          </strong>
        </div>


        <div class="detail-group">
          <span class="detail-label">
            Completed Transactions
          </span>

          <strong>
            ${formatNumber(
              farmer.completedTransactions
            )}
          </strong>
        </div>


        <div class="detail-group">
          <span class="detail-label">
            Booked Quantity
          </span>

          <strong>
            ${formatNumber(
              farmer.totalBookedQuintals
            )}
            qtl
          </strong>
        </div>


        <div class="detail-group">
          <span class="detail-label">
            Actual Procured Quantity
          </span>

          <strong>
            ${formatNumber(
              farmer.totalProcuredQuintals
            )}
            qtl
          </strong>
        </div>


        <div class="detail-group">
          <span class="detail-label">
            Total Payout
          </span>

          <strong>
            ${formatCurrency(
              farmer.totalPayout
            )}
          </strong>
        </div>

      </div>

    </div>


    <div class="farmer-detail-section">

      <h4>
        Latest Booking
      </h4>

      ${
        latestBooking
          ? `

            <div class="detail-record">

              <div>
                <span class="detail-label">
                  Token
                </span>

                <strong>
                  ${escapeHTML(
                    latestBooking.tokenId || '—'
                  )}
                </strong>
              </div>


              <div>
                <span class="detail-label">
                  Booking ID
                </span>

                <strong>
                  ${escapeHTML(
                    latestBooking.bookingId || '—'
                  )}
                </strong>
              </div>


              <div>
                <span class="detail-label">
                  Farmer ID
                </span>

                <strong>
                  ${escapeHTML(
                    latestBooking.farmerId || farmer.id || '—'
                  )}
                </strong>
              </div>


              <div>
                <span class="detail-label">
                  Date
                </span>

                <strong>
                  ${formatDate(
                    latestBooking.date
                  )}
                </strong>
              </div>


              <div>
                <span class="detail-label">
                  Time Slot
                </span>

                <strong>
                  ${escapeHTML(
                    latestBooking.timeSlot || '—'
                  )}
                </strong>
              </div>


              <div>
                <span class="detail-label">
                  Crop
                </span>

                <strong>
                  ${formatCrop(
                    latestBooking.cropType
                  )}
                </strong>
              </div>


              <div>
                <span class="detail-label">
                  Booked Quantity
                </span>

                <strong>
                  ${formatNumber(
                    latestBooking.quantityQuintals
                  )}
                  qtl
                </strong>
              </div>


              <div>
                <span class="detail-label">
                  Center
                </span>

                <strong>
                  ${escapeHTML(
                    latestBooking.center || '—'
                  )}
                </strong>
              </div>


              <div>
                <span class="detail-label">
                  Status
                </span>

                <strong>
                  ${escapeHTML(
                    latestBooking.status || '—'
                  )}
                </strong>
              </div>

            </div>

          `
          : `

            <div class="empty-detail">
              No booking history available.
            </div>

          `
      }

    </div>


    <div class="farmer-detail-section">

      <h4>
        Latest Receipt
      </h4>

      ${
        latestReceipt
          ? `

            <div class="detail-record">

              <div>
                <span class="detail-label">
                  Receipt ID
                </span>

                <strong>
                  ${escapeHTML(
                    latestReceipt.receiptId || '—'
                  )}
                </strong>
              </div>


              <div>
                <span class="detail-label">
                  Token
                </span>

                <strong>
                  ${escapeHTML(
                    latestReceipt.tokenId || '—'
                  )}
                </strong>
              </div>


              <div>
                <span class="detail-label">
                  Booking ID
                </span>

                <strong>
                  ${escapeHTML(
                    latestReceipt.bookingId || '—'
                  )}
                </strong>
              </div>


              <div>
                <span class="detail-label">
                  Farmer ID
                </span>

                <strong>
                  ${escapeHTML(
                    latestReceipt.farmerId || farmer.id || '—'
                  )}
                </strong>
              </div>


              <div>
                <span class="detail-label">
                  Crop
                </span>

                <strong>
                  ${formatCrop(
                    latestReceipt.cropType
                  )}
                </strong>
              </div>


              <div>
                <span class="detail-label">
                  Actual Net Quantity
                </span>

                <strong>
                  ${formatNumber(
                    latestReceipt.netWeightQuintals
                  )}
                  qtl
                </strong>
              </div>


              <div>
                <span class="detail-label">
                  Quality
                </span>

                <strong>
                  ${escapeHTML(
                    latestReceipt.qualityGrade || '—'
                  )}
                </strong>
              </div>


              <div>
                <span class="detail-label">
                  Payout
                </span>

                <strong>
                  ${formatCurrency(
                    latestReceipt.totalPayoutAmount
                  )}
                </strong>
              </div>


              <div>
                <span class="detail-label">
                  Date
                </span>

                <strong>
                  ${formatDate(
                    latestReceipt.timestamp
                  )}
                </strong>
              </div>

            </div>

          `
          : `

            <div class="empty-detail">
              No procurement receipt available.
            </div>

          `
      }

    </div>

  `;


  modal.classList.add('modal-open');

  modal.style.display = 'flex';

};


// ================================================================
// CREATE DETAILS MODAL
// ================================================================

const createFarmerDetailsModal = () => {

  const modal =
    document.createElement('div');


  modal.id =
    'farmer-details-modal';


  modal.className =
    'farmer-details-modal';


  modal.innerHTML = `

    <div class="farmer-details-dialog">

      <div class="farmer-details-header">

        <div>

          <span class="section-eyebrow">
            FARMER MANAGEMENT
          </span>

          <h3>
            Farmer Details
          </h3>

        </div>


        <button
          type="button"
          class="close-farmer-modal"
          aria-label="Close"
        >
          ×
        </button>

      </div>


      <div class="farmer-details-content">
      </div>

    </div>

  `;


  document.body.appendChild(modal);


  const closeButton =
    modal.querySelector(
      '.close-farmer-modal'
    );


  if (closeButton) {

    closeButton.addEventListener(
      'click',
      closeFarmerDetails
    );

  }


  modal.addEventListener(
    'click',
    event => {

      if (event.target === modal) {
        closeFarmerDetails();
      }

    }
  );


  return modal;

};


// ================================================================
// CLOSE DETAILS MODAL
// ================================================================

const closeFarmerDetails = () => {

  const modal =
    document.getElementById(
      'farmer-details-modal'
    );


  if (!modal) {
    return;
  }


  modal.classList.remove(
    'modal-open'
  );


  modal.style.display =
    'none';

};


// ================================================================
// PAGE EVENT INITIALIZATION
// ================================================================

const initializeFarmersPage = () => {

  // Prevent duplicate initialization.
  if (farmersPageInitialized) {
    return;
  }

  farmersPageInitialized = true;


  // ==============================================================
  // SEARCH
  // ==============================================================

  if (farmerSearchInput) {

    farmerSearchInput.addEventListener(
      'input',
      event => {

        const search =
          event.target.value;


        clearTimeout(searchTimeout);


        searchTimeout =
          setTimeout(
            () => {
              loadFarmers(search);
            },
            300
          );

      }
    );

  }


  // ==============================================================
  // REFRESH BUTTON
  // ==============================================================

  if (refreshButton) {

    refreshButton.addEventListener(
      'click',
      () => {

        const search =
          farmerSearchInput
            ? farmerSearchInput.value
            : '';


        loadFarmers(search);

      }
    );

  }


  // ==============================================================
  // EXISTING MODAL CLOSE BUTTON
  // ==============================================================

  const existingCloseButton =
    getElement(
      'close-farmer-modal'
    );


  if (existingCloseButton) {

    existingCloseButton.addEventListener(
      'click',
      closeFarmerDetails
    );

  }


  // ==============================================================
  // EXISTING MODAL BACKDROP
  // ==============================================================

  const existingModal =
    getElement(
      'farmer-details-modal'
    );


  if (existingModal) {

    existingModal.addEventListener(
      'click',
      event => {

        if (
          event.target ===
          existingModal
        ) {
          closeFarmerDetails();
        }

      }
    );

  }


  // ==============================================================
  // ESCAPE KEY
  // ==============================================================

  document.addEventListener(
    'keydown',
    event => {

      if (event.key === 'Escape') {
        closeFarmerDetails();
      }

    }
  );


  // ==============================================================
  // INITIAL LOAD
  // ==============================================================

  loadFarmers();

};


// ================================================================
// INITIAL LOAD
// ================================================================

if (document.readyState === 'loading') {

  document.addEventListener(
    'DOMContentLoaded',
    initializeFarmersPage,
    { once: true }
  );

} else {

  initializeFarmersPage();

}