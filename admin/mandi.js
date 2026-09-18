
/* ================================================================
   KISAN SETU ADMIN PORTAL
   A4 • MANDI & SLOT MANAGEMENT
   ================================================================ */

const API_BASE_URL = 'http://localhost:5050';


// ================================================================
// STATE
// ================================================================

let mandiData = null;
let allBookings = [];
let mandiRefreshTimer = null;

// Prevent overlapping refreshes from applying stale data.
let mandiRequestController = null;
let mandiRequestSequence = 0;
let mandiPageInitialized = false;


// ================================================================
// ADMIN SESSION
// ================================================================

function getAdminSession() {
    return sessionStorage.getItem(
        'kisanSetuAdminSession'
    );
}


function isAdminAuthenticated() {
    return (
        sessionStorage.getItem(
            'kisanSetuAdminAuthenticated'
        ) === 'true' &&
        Boolean(getAdminSession())
    );
}


function redirectToLogin() {
    window.location.href = 'admin.html';
}


function clearAdminSession() {
    sessionStorage.removeItem(
        'kisanSetuAdminAuthenticated'
    );

    sessionStorage.removeItem(
        'kisanSetuAdminSession'
    );

    sessionStorage.removeItem(
        'kisanSetuAdminUser'
    );
}


// ================================================================
// API HELPER
// ================================================================

async function adminFetch(
    endpoint,
    options = {}
) {

    const sessionId =
        getAdminSession();


    if (!sessionId) {
        clearAdminSession();
        redirectToLogin();
        return null;
    }


    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers || {}),
        'x-admin-session': sessionId
    };


    try {

        const response =
            await fetch(
                `${API_BASE_URL}${endpoint}`,
                {
                    ...options,
                    headers
                }
            );


        if (
            response.status === 401 ||
            response.status === 403
        ) {

            clearAdminSession();

            redirectToLogin();

            return null;

        }


        let data;

        try {

            data =
                await response.json();

        } catch {

            throw new Error(
                'Backend returned an invalid response.'
            );

        }


        if (!response.ok) {

            throw new Error(
                data?.message ||
                'Request failed.'
            );

        }


        return data;

    } catch (error) {

        if (error?.name === 'AbortError') {
            return null;
        }


        console.error(
            '[A4 Mandi API Error]',
            error
        );


        showConnectionError(
            error.message
        );


        return null;

    }

}


// ================================================================
// DOM HELPERS
// ================================================================

function getElement(...ids) {

    for (const id of ids) {

        const element =
            document.getElementById(id);

        if (element) {
            return element;
        }

    }

    return null;

}


function setText(
    ids,
    value
) {

    const element =
        Array.isArray(ids)
            ? getElement(...ids)
            : getElement(ids);


    if (element) {
        element.textContent = value;
    }

}


// ================================================================
// FORMATTERS
// ================================================================

function formatNumber(value) {

    const number =
        Number(value || 0);


    return number.toLocaleString(
        'en-IN',
        {
            maximumFractionDigits: 2
        }
    );

}


function formatDate(dateValue) {

    if (!dateValue) {
        return '-';
    }


    const raw =
        String(dateValue);


    /*
       Preserve YYYY-MM-DD values without
       timezone conversion.
    */

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ) {

        const [
            year,
            month,
            day
        ] = raw.split('-');


        return `${day}/${month}/${year}`;

    }


    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return raw;

    }


    return date.toLocaleDateString(
        'en-IN',
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }
    );

}


function formatCrop(crop) {

    if (!crop) {
        return 'Other';
    }


    const value =
        String(crop)
            .trim()
            .toLowerCase();


    if (value === 'wheat') {
        return 'Wheat';
    }


    if (value === 'paddy') {
        return 'Paddy';
    }


    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );

}


function escapeHtml(value) {

    return String(
        value ?? ''
    )
        .replace(
            /&/g,
            '&amp;'
        )
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        )
        .replace(
            /"/g,
            '&quot;'
        )
        .replace(
            /'/g,
            '&#039;'
        );

}


// ================================================================
// CONNECTION STATUS
// ================================================================

function updateConnectionStatus(
    message
) {

    const text =
        getElement(
            'mandi-connection-text'
        );


    if (text) {
        text.textContent = message;
    }


    const status =
        getElement(
            'mandi-connection-status'
        );


    if (!status) {
        return;
    }


    status.classList.remove(
        'error',
        'disconnected'
    );

}


function updateLastUpdated() {

    setText(
        'mandi-last-updated',
        `Updated ${new Date().toLocaleTimeString(
            'en-IN'
        )}`
    );

}


function showConnectionError(
    message
) {

    updateConnectionStatus(
        'Backend connection error'
    );


    const status =
        getElement(
            'mandi-connection-status'
        );


    if (status) {

        status.classList.add(
            'error'
        );

    }


    setText(
        'mandi-last-updated',
        message ||
        'Unable to reach backend.'
    );

}


function showConnectionSuccess() {

    updateConnectionStatus(
        'Backend connected'
    );


    updateLastUpdated();

}


// ================================================================
// STATUS BADGES
// ================================================================

function getStatusClass(
    status
) {

    const normalized =
        String(
            status || ''
        )
            .trim()
            .toLowerCase();


    if (
        normalized.includes(
            'active'
        )
    ) {

        return 'mandi-status-active';

    }


    if (
        normalized.includes(
            'weighbridge'
        )
    ) {

        return 'mandi-status-weighbridge';

    }


    if (
        normalized.includes(
            'approved'
        )
    ) {

        return 'mandi-status-approved';

    }


    if (
        normalized.includes(
            'cancel'
        )
    ) {

        return 'mandi-status-cancelled';

    }


    return 'mandi-status-scheduled';

}


function createStatusBadge(
    status
) {

    const badge =
        document.createElement(
            'span'
        );


    badge.className =
        `mandi-status-badge ${getStatusClass(
            status
        )}`;


    badge.textContent =
        status ||
        'Scheduled';


    return badge;

}


// ================================================================
// BOOKINGS TABLE
// ================================================================

function getBookingsTableBody() {

    const explicitBody =
        getElement(
            'booking-table-body',
            'mandi-bookings-body',
            'bookings-table-body',
            'mandi-table-body',
            'slot-table-body'
        );


    if (explicitBody) {
        return explicitBody;
    }


    const tables =
        document.querySelectorAll(
            'table'
        );


    for (
        const table of tables
    ) {

        const headerText =
            table
                .querySelector('thead')
                ?.textContent
                ?.toLowerCase() ||
            '';


        if (
            headerText.includes('token') &&
            headerText.includes('farmer') &&
            headerText.includes('status')
        ) {

            return table.querySelector(
                'tbody'
            );

        }

    }


    return document.querySelector(
        'table tbody'
    ) || null;

}


// ================================================================
// LOAD A4 DATA
// ================================================================

async function loadMandiData() {

    if (!isAdminAuthenticated()) {

        clearAdminSession();
        redirectToLogin();

        return;

    }


    updateConnectionStatus(
        'Connecting to procurement backend...'
    );


    // Cancel an older refresh so it cannot overwrite newer data.
    if (mandiRequestController) {
        mandiRequestController.abort();
    }


    mandiRequestController =
        new AbortController();

    const requestSequence =
        ++mandiRequestSequence;


    const data =
        await adminFetch(
            '/api/admin/mandi',
            {
                signal:
                    mandiRequestController.signal
            }
        );


    // Ignore responses/errors from an older request.
    if (
        requestSequence !==
        mandiRequestSequence
    ) {
        return;
    }


    if (
        !data ||
        !data.success
    ) {

        if (data && data.message) {
            showConnectionError(
                data.message
            );
        }

        if (
            requestSequence ===
            mandiRequestSequence
        ) {
            mandiRequestController = null;
        }

        return;

    }


    mandiData =
        data;


    allBookings =
        Array.isArray(
            data.bookings
        )
            ? [...data.bookings]
            : [];


    /*
       Newest booking first.
       This only orders backend records; it does not
       create or replace any transaction identifiers.
    */

    allBookings.sort(
        (
            a,
            b
        ) => {

            const dateA =
                new Date(
                    a.createdAt ||
                    a.timestamp ||
                    a.date ||
                    0
                )
                    .getTime();


            const dateB =
                new Date(
                    b.createdAt ||
                    b.timestamp ||
                    b.date ||
                    0
                )
                    .getTime();


            return dateB - dateA;

        }
    );


    renderSummary();

    renderCenters();

    populateCenterFilter();

    renderSlotSummary();

    renderSlotList();

    renderBookings();


    showConnectionSuccess();


    if (
        requestSequence ===
        mandiRequestSequence
    ) {
        mandiRequestController = null;
    }

}


// ================================================================
// SUMMARY CARDS
// ================================================================

function renderSummary() {

    if (!mandiData) {
        return;
    }


    const summary =
        mandiData.summary ||
        {};


    const totalCapacity =
        Number(
            summary.totalCapacityQuintals ||
            0
        );


    const bookedQuantity =
        Number(
            summary.bookedQuantityQuintals ||
            0
        );


    const remainingCapacity =
        Number(
            summary.remainingCapacityQuintals ||
            0
        );


    const todayBookings =
        Number(
            summary.todayBookings ||
            0
        );


    setText(
        [
            'total-capacity',
            'total-mandi-capacity',
            'mandi-total-capacity'
        ],
        `${formatNumber(
            totalCapacity
        )} qtl`
    );


    setText(
        [
            'total-booked',
            'today-booked-quantity',
            'mandi-booked-quantity'
        ],
        `${formatNumber(
            bookedQuantity
        )} qtl`
    );


    setText(
        [
            'total-remaining',
            'available-mandi-capacity',
            'mandi-available-capacity',
            'available-capacity'
        ],
        `${formatNumber(
            remainingCapacity
        )} qtl`
    );


    setText(
        [
            'today-bookings',
            'mandi-today-bookings'
        ],
        formatNumber(
            todayBookings
        )
    );

}


// ================================================================
// CENTER STATUS
// ================================================================

function renderCenters() {

    if (!mandiData) {
        return;
    }


    const centers =
        Array.isArray(
            mandiData.centers
        )
            ? mandiData.centers
            : [];


    const container =
        getElement(
            'center-status-container',
            'centers-container',
            'mandi-centers'
        );


    if (!container) {
        return;
    }


    container.innerHTML = '';


    if (!centers.length) {

        container.innerHTML = `
            <div class="mandi-empty-state">
                <i class="fa-solid fa-warehouse"></i>

                <h3>
                    No mandi centers found
                </h3>

                <p>
                    No center booking information is currently available.
                </p>
            </div>
        `;

        return;

    }


    centers.forEach(
        center => {

            const capacity =
                Number(
                    center.capacityQuintals ||
                    center.capacity ||
                    0
                );


            const booked =
                Number(
                    center.bookedQuintals ||
                    center.bookedQuantityQuintals ||
                    center.booked ||
                    0
                );


            let utilization =
                Number(
                    center.utilizationPercentage
                );


            if (
                !Number.isFinite(
                    utilization
                )
            ) {

                utilization =
                    capacity > 0
                        ? (
                            booked /
                            capacity
                        ) * 100
                        : 0;

            }


            utilization =
                Math.min(
                    100,
                    Math.max(
                        0,
                        utilization
                    )
                );


            const activeTokens =
                Number(
                    center.activeQueue ??
                    center.activeTokens ??
                    center.active ??
                    0
                );


            const completed =
                Number(
                    center.completed ??
                    center.completedTokens ??
                    0
                );


            const card =
                document.createElement(
                    'div'
                );


            card.className =
                'center-status-card';


            card.innerHTML = `
                <div class="center-main-info">

                    <h3>
                        ${escapeHtml(
                            center.center ||
                            center.centerName ||
                            center.centerId ||
                            'Mandi Center'
                        )}
                    </h3>

                    <span class="center-id">
                        ${escapeHtml(
                            center.centerId ||
                            '-'
                        )}
                    </span>

                    <span class="center-booked">
                        ${formatNumber(booked)}
                        /
                        ${formatNumber(capacity)}
                        qtl booked
                    </span>

                </div>


                <div class="center-progress-area">

                    <div class="center-progress-header">

                        <span class="center-progress-label">
                            Capacity utilization
                        </span>

                        <span class="center-progress-value">
                            ${formatNumber(utilization)}%
                        </span>

                    </div>


                    <div class="center-progress-track">

                        <div
                            class="center-progress-fill"
                            style="width: ${utilization}%"
                        ></div>

                    </div>

                </div>


                <div class="center-stats">

                    <div class="center-stat">

                        <strong>
                            ${formatNumber(activeTokens)}
                        </strong>

                        <span>
                            active
                        </span>

                    </div>


                    <div class="center-stat">

                        <strong>
                            ${formatNumber(completed)}
                        </strong>

                        <span>
                            completed
                        </span>

                    </div>

                </div>
            `;


            container.appendChild(
                card
            );

        }
    );

}


// ================================================================
// CENTER FILTER
// ================================================================

function populateCenterFilter() {

    const centerFilter =
        getElement(
            'center-filter'
        );


    if (!centerFilter) {
        return;
    }


    const currentValue =
        centerFilter.value ||
        'all';


    const centers =
        Array.isArray(
            mandiData?.centers
        )
            ? mandiData.centers
            : [];


    const centerNames =
        centers
            .map(
                center =>
                    center.center ||
                    center.centerName ||
                    center.centerId
            )
            .filter(Boolean);


    /*
       Also include centers found directly
       in bookings.
    */

    allBookings.forEach(
        booking => {

            const bookingCenter =
                booking.center ||
                booking.centerName ||
                booking.centerId;


            if (
                bookingCenter &&
                !centerNames.includes(
                    bookingCenter
                )
            ) {

                centerNames.push(
                    bookingCenter
                );

            }

        }
    );


    const uniqueCenters =
        [...new Set(centerNames)]
            .sort(
                (a, b) =>
                    String(a).localeCompare(
                        String(b)
                    )
            );


    centerFilter.innerHTML = `
        <option value="all">
            All Centers
        </option>
    `;


    uniqueCenters.forEach(
        center => {

            const option =
                document.createElement(
                    'option'
                );


            option.value =
                String(center);


            option.textContent =
                String(center);


            centerFilter.appendChild(
                option
            );

        }
    );


    const matchingOption =
        [...centerFilter.options]
            .find(
                option =>
                    option.value ===
                    currentValue
            );


    if (matchingOption) {

        centerFilter.value =
            currentValue;

    } else {

        centerFilter.value =
            'all';

    }

}


// ================================================================
// SLOT SUMMARY
// ================================================================

function renderSlotSummary() {

    if (!mandiData) {
        return;
    }


    const summary =
        mandiData.summary ||
        {};


    setText(
        [
            'total-slots',
            'mandi-total-slots'
        ],
        formatNumber(
            summary.totalSlots
        )
    );


    setText(
        [
            'booked-slots',
            'mandi-booked-slots'
        ],
        formatNumber(
            summary.bookedSlots
        )
    );


    setText(
        [
            'available-slots',
            'mandi-available-slots'
        ],
        formatNumber(
            summary.availableSlots
        )
    );


    setText(
        [
            'active-slot-queue',
            'slot-active-queue',
            'mandi-slot-active-queue'
        ],
        formatNumber(
            summary.activeSlotQueue
        )
    );

}


// ================================================================
// SLOT LIST
// ================================================================

function renderSlotList() {

    if (!mandiData) {
        return;
    }


    const slots =
        Array.isArray(
            mandiData.slots
        )
            ? mandiData.slots
            : [];


    const container =
        getElement(
            'slot-list',
            'mandi-slot-list'
        );


    if (!container) {
        return;
    }


    container.innerHTML = '';


    if (!slots.length) {

        container.innerHTML = `
            <div class="mandi-empty-state">

                <i class="fa-solid fa-calendar-xmark"></i>

                <h3>
                    No slot information available
                </h3>

                <p>
                    Slot data will appear here once the backend
                    is connected.
                </p>

            </div>
        `;

        return;

    }


    slots.forEach(
        slot => {

            const slotCard =
                document.createElement(
                    'div'
                );


            slotCard.className =
                'mandi-slot-item';


            const capacity =
                Number(
                    slot.capacityQuintals ||
                    slot.capacity ||
                    0
                );


            const booked =
                Number(
                    slot.bookedQuintals ||
                    slot.bookedQuantityQuintals ||
                    slot.booked ||
                    0
                );


            const remaining =
                Number(
                    slot.remainingQuintals ??
                    slot.remainingCapacityQuintals ??
                    Math.max(
                        capacity - booked,
                        0
                    )
                );


            const bookingCount =
                Number(
                    slot.bookingCount ||
                    slot.bookings ||
                    0
                );


            const activeQueue =
                Number(
                    slot.activeQueue ||
                    0
                );


            const isAvailable =
                slot.available !== false &&
                remaining > 0;


            slotCard.innerHTML = `
                <div class="slot-main-info">

                    <strong>
                        ${escapeHtml(
                            slot.timeSlot ||
                            slot.slot ||
                            '-'
                        )}
                    </strong>

                    <span>
                        ${formatNumber(
                            bookingCount
                        )}
                        booking${bookingCount === 1 ? '' : 's'}
                    </span>

                </div>


                <div class="slot-capacity-info">

                    <span>
                        ${formatNumber(booked)}
                        /
                        ${formatNumber(capacity)}
                        qtl
                    </span>

                    <span>
                        ${formatNumber(remaining)}
                        qtl available
                    </span>

                </div>


                <div class="slot-status">

                    <span class="slot-status-badge ${
                        isAvailable
                            ? 'slot-available'
                            : 'slot-full'
                    }">

                        ${
                            isAvailable
                                ? 'Available'
                                : 'Full'
                        }

                    </span>


                    ${
                        activeQueue > 0
                            ? `
                                <span class="slot-queue-count">

                                    ${formatNumber(
                                        activeQueue
                                    )}

                                    active

                                </span>
                            `
                            : ''
                    }

                </div>
            `;


            container.appendChild(
                slotCard
            );

        }
    );

}


// ================================================================
// BOOKING QUANTITY
// ================================================================

function getBookingQuantity(
    booking
) {

    /*
       Mandi capacity is based on the booking quantity.
       Actual procurement quantity must be taken from the
       procurement/receipt records in the payment and report
       flows, not substituted here.
    */

    return Number(
        booking.bookedQuantityQuintals ??
        booking.quantityQuintals ??
        booking.quantity ??
        booking.estimatedQuantityQuintals ??
        0
    );

}


// ================================================================
// BOOKINGS TABLE
// ================================================================

function renderBookings() {

    const tableBody =
        getBookingsTableBody();


    if (!tableBody) {

        console.warn(
            '[A4] Booking table body not found.'
        );

        return;

    }


    tableBody.innerHTML = '';


    const emptyState =
        getElement(
            'booking-empty-state'
        );


    if (!allBookings.length) {

        tableBody.innerHTML = `
            <tr>

                <td
                    colspan="8"
                    class="mandi-table-loading"
                >
                    No bookings found for today.
                </td>

            </tr>
        `;


        if (emptyState) {
            emptyState.classList.remove('hidden');
        }


        return;

    }


    if (emptyState) {
        emptyState.classList.add('hidden');
    }


    allBookings.forEach(
        booking => {

            const row =
                document.createElement(
                    'tr'
                );


            const farmerName =
                booking.farmerName ||
                booking.name ||
                'Unknown Farmer';


            const crop =
                formatCrop(
                    booking.cropType ||
                    booking.crop
                );


            const bookedQuantity =
                getBookingQuantity(
                    booking
                );


            const status =
                booking.status ||
                'Scheduled';


            const center =
                booking.center ||
                booking.centerName ||
                booking.centerId ||
                '-';


            const date =
                formatDate(
                    booking.date ||
                    booking.bookingDate
                );


            const timeSlot =
                booking.timeSlot ||
                booking.slot ||
                '-';


            row.dataset.status =
                String(
                    status
                )
                    .trim()
                    .toLowerCase();


            row.dataset.crop =
                String(
                    booking.cropType ||
                    booking.crop ||
                    ''
                )
                    .trim()
                    .toLowerCase();


            row.dataset.center =
                String(
                    center
                )
                    .trim()
                    .toLowerCase();


            row.dataset.search =
                [
                    booking.tokenId,
                    booking.bookingId,
                    farmerName,
                    booking.kccNumber,
                    booking.farmerId,
                    crop,
                    center,
                    status,
                    timeSlot
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();


            row.innerHTML = `
                <td>

                    <span class="mandi-token">
                        ${escapeHtml(
                            booking.tokenId ||
                            '-'
                        )}
                    </span>

                </td>


                <td>

                    <span class="mandi-farmer-name">
                        ${escapeHtml(
                            farmerName
                        )}
                    </span>

                    <span class="mandi-kcc">
                        ${escapeHtml(
                            booking.kccNumber ||
                            '-'
                        )}
                    </span>

                </td>


                <td>
                    ${escapeHtml(
                        crop
                    )}
                </td>


                <td>

                    <span class="mandi-quantity">
                        ${formatNumber(
                            bookedQuantity
                        )}
                    </span>

                    <span class="mandi-quantity-unit">
                        qtl
                    </span>

                </td>


                <td>
                    ${escapeHtml(
                        date
                    )}
                </td>


                <td>
                    ${escapeHtml(
                        timeSlot
                    )}
                </td>


                <td>
                    ${escapeHtml(
                        center
                    )}
                </td>


                <td class="mandi-status-cell"></td>
            `;


            const statusCell =
                row.querySelector(
                    '.mandi-status-cell'
                );


            if (statusCell) {

                statusCell.appendChild(
                    createStatusBadge(
                        status
                    )
                );

            }


            tableBody.appendChild(
                row
            );

        }
    );


    applyBookingFilters();

}


// ================================================================
// FILTER HELPERS
// ================================================================

function getFilterValue(
    ids
) {

    const element =
        getElement(
            ...ids
        );


    return String(
        element?.value ||
        ''
    )
        .trim()
        .toLowerCase();

}


// ================================================================
// SEARCH + FILTER
// ================================================================

function applyBookingFilters() {

    const search =
        getFilterValue(
            [
                'booking-search',
                'mandi-search',
                'slot-search'
            ]
        );


    const statusFilter =
        getFilterValue(
            [
                'status-filter',
                'mandi-status-filter',
                'booking-status-filter'
            ]
        );


    const centerFilter =
        getFilterValue(
            [
                'center-filter',
                'mandi-center-filter',
                'booking-center-filter'
            ]
        );


    const cropFilter =
        getFilterValue(
            [
                'crop-filter',
                'mandi-crop-filter',
                'booking-crop-filter'
            ]
        );


    const tableBody =
        getBookingsTableBody();


    if (!tableBody) {
        return;
    }


    const rows =
        tableBody.querySelectorAll(
            'tr'
        );


    let visibleRows = 0;


    rows.forEach(
        row => {

            /*
               Ignore loading and empty rows.
            */

            if (!row.dataset.status) {
                return;
            }


            const rowSearch =
                row.dataset.search ||
                row.textContent.toLowerCase();


            const rowStatus =
                row.dataset.status ||
                '';


            const rowCenter =
                row.dataset.center ||
                '';


            const rowCrop =
                row.dataset.crop ||
                '';


            const matchesSearch =
                !search ||
                rowSearch.includes(
                    search
                );


            const matchesStatus =
                !statusFilter ||
                statusFilter === 'all' ||
                rowStatus === statusFilter ||
                rowStatus.includes(
                    statusFilter
                );


            const matchesCenter =
                !centerFilter ||
                centerFilter === 'all' ||
                rowCenter === centerFilter ||
                rowCenter.includes(
                    centerFilter
                );


            const matchesCrop =
                !cropFilter ||
                cropFilter === 'all' ||
                rowCrop === cropFilter;


            const visible =
                matchesSearch &&
                matchesStatus &&
                matchesCenter &&
                matchesCrop;


            row.style.display =
                visible
                    ? ''
                    : 'none';


            if (visible) {
                visibleRows++;
            }

        }
    );


    const emptyState =
        getElement(
            'booking-empty-state'
        );


    if (emptyState) {

        if (
            allBookings.length > 0 &&
            visibleRows === 0
        ) {

            emptyState.classList.remove(
                'hidden'
            );

        } else {

            emptyState.classList.add(
                'hidden'
            );

        }

    }

}


// ================================================================
// REFRESH
// ================================================================

async function refreshMandiData() {

    const refreshButton =
        getElement(
            'refresh-mandi-button'
        );


    if (
        refreshButton?.disabled &&
        mandiRequestController
    ) {
        return;
    }


    if (refreshButton) {

        refreshButton.disabled =
            true;

        refreshButton.classList.add(
            'is-loading'
        );

    }


    const requestSequence =
        mandiRequestSequence + 1;


    try {

        await loadMandiData();

    } finally {

        if (
            refreshButton &&
            requestSequence >=
                mandiRequestSequence
        ) {

            refreshButton.disabled =
                false;

            refreshButton.classList.remove(
                'is-loading'
            );

        }

    }

}


// ================================================================
// LOGOUT
// ================================================================

function setupLogout() {

    if (mandiPageInitialized) {
        return;
    }


    const logoutButton =
        getElement(
            'admin-logout-button'
        );


    if (!logoutButton) {
        return;
    }


    logoutButton.addEventListener(
        'click',
        () => {

            clearAdminSession();

            window.location.href =
                'admin.html';

        }
    );

}


// ================================================================
// ADMIN USER
// ================================================================

function loadAdminUser() {

    const userElement =
        getElement(
            'admin-username'
        );


    if (!userElement) {
        return;
    }


    const storedUser =
        sessionStorage.getItem(
            'kisanSetuAdminUser'
        );


    if (!storedUser) {
        return;
    }


    try {

        const user =
            JSON.parse(
                storedUser
            );


        userElement.textContent =
            user.name ||
            user.username ||
            user.email ||
            'admin';

    } catch {

        userElement.textContent =
            storedUser;

    }

}


// ================================================================
// EVENT LISTENERS
// ================================================================

function setupMandiEvents() {

    if (mandiPageInitialized) {
        return;
    }


    const searchInput =
        getElement(
            'booking-search'
        );


    const statusFilter =
        getElement(
            'status-filter'
        );


    const centerFilter =
        getElement(
            'center-filter'
        );


    const cropFilter =
        getElement(
            'crop-filter'
        );


    const refreshButton =
        getElement(
            'refresh-mandi-button'
        );


    if (searchInput) {

        searchInput.addEventListener(
            'input',
            applyBookingFilters
        );

    }


    if (statusFilter) {

        statusFilter.addEventListener(
            'change',
            applyBookingFilters
        );

    }


    if (centerFilter) {

        centerFilter.addEventListener(
            'change',
            applyBookingFilters
        );

    }


    if (cropFilter) {

        cropFilter.addEventListener(
            'change',
            applyBookingFilters
        );

    }


    if (refreshButton) {

        refreshButton.addEventListener(
            'click',
            refreshMandiData
        );

    }

}


// ================================================================
// AUTO REFRESH
// ================================================================

function startAutoRefresh() {

    if (mandiRefreshTimer) {

        clearInterval(
            mandiRefreshTimer
        );

    }


    mandiRefreshTimer =
        setInterval(
            () => {

                if (
                    isAdminAuthenticated()
                ) {

                    if (!mandiRequestController) {
                        loadMandiData();
                    }

                } else {

                    clearInterval(
                        mandiRefreshTimer
                    );

                }

            },
            30000
        );

}


// ================================================================
// CLEANUP
// ================================================================

window.addEventListener(
    'beforeunload',
    () => {

        if (mandiRefreshTimer) {

            clearInterval(
                mandiRefreshTimer
            );

        }


        if (mandiRequestController) {
            mandiRequestController.abort();
        }

    }
);


// ================================================================
// INITIALIZATION
// ================================================================

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        if (
            !isAdminAuthenticated()
        ) {

            redirectToLogin();

            return;

        }


        loadAdminUser();

        setupLogout();

        setupMandiEvents();

        mandiPageInitialized = true;

        await loadMandiData();

        startAutoRefresh();

    }
);
