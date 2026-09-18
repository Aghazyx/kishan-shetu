
// ================================================================
// KISAN SETU • A6 PAYMENT MONITORING
// ================================================================

const API_BASE_URL =
    'http://localhost:5050';


// ================================================================
// ADMIN SESSION
// ================================================================

const getAdminSession = () => {

    return sessionStorage.getItem(
        'kisanSetuAdminSession'
    );

};


const isAdminAuthenticated = () => {

    return (
        sessionStorage.getItem(
            'kisanSetuAdminAuthenticated'
        ) === 'true' &&
        Boolean(
            getAdminSession()
        )
    );

};


const clearAdminSession = () => {

    sessionStorage.removeItem(
        'kisanSetuAdminAuthenticated'
    );

    sessionStorage.removeItem(
        'kisanSetuAdminUser'
    );

    sessionStorage.removeItem(
        'kisanSetuAdminSession'
    );

};


const redirectToLogin = () => {

    clearAdminSession();

    window.location.href =
        'admin.html';

};


// ================================================================
// AUTHENTICATION GUARD
// ================================================================

if (
    !isAdminAuthenticated()
) {

    redirectToLogin();

}


// ================================================================
// DOM HELPERS
// ================================================================

const getElement = (
    id
) => {

    return document.getElementById(
        id
    );

};


// ================================================================
// ADMIN API REQUEST
// ================================================================

const adminFetch = async (
    endpoint,
    options = {}
) => {

    const sessionId =
        getAdminSession();


    if (!sessionId) {

        redirectToLogin();

        throw new Error(
            'Administrator session expired.'
        );

    }


    const headers = {

        'Content-Type':
            'application/json',

        'Accept':
            'application/json',

        ...(options.headers || {}),

        'x-admin-session':
            sessionId

    };


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

        redirectToLogin();

        throw new Error(
            'Administrator session expired.'
        );

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
            `Request failed with status ${response.status}.`
        );

    }


    return data;

};


// ================================================================
// FORMATTERS
// ================================================================

const formatCurrency = (
    amount
) => {

    const value =
        Number(
            amount || 0
        );


    return new Intl.NumberFormat(
        'en-IN',
        {
            style:
                'currency',

            currency:
                'INR',

            maximumFractionDigits:
                0
        }
    ).format(
        Number.isFinite(value)
            ? value
            : 0
    );

};


const formatNumber = (
    value,
    decimals = 2
) => {

    const number =
        Number(
            value || 0
        );


    return new Intl.NumberFormat(
        'en-IN',
        {
            minimumFractionDigits:
                decimals,

            maximumFractionDigits:
                decimals
        }
    ).format(
        Number.isFinite(number)
            ? number
            : 0
    );

};


const formatDate = (
    dateValue
) => {

    if (!dateValue) {

        return '—';

    }


    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            dateValue
        );

    }


    return date.toLocaleDateString(
        'en-IN',
        {
            day:
                '2-digit',

            month:
                'short',

            year:
                'numeric'
        }
    );

};


const formatDateTime = (
    dateValue
) => {

    if (!dateValue) {

        return '—';

    }


    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            dateValue
        );

    }


    return date.toLocaleString(
        'en-IN',
        {
            day:
                '2-digit',

            month:
                'short',

            year:
                'numeric',

            hour:
                '2-digit',

            minute:
                '2-digit'
        }
    );

};


// ================================================================
// HTML ESCAPE
// ================================================================

const escapeHtml = (
    value
) => {

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

};


// ================================================================
// CONNECTION STATUS
// ================================================================

const setConnectionStatus = (
    connected,
    message
) => {

    const statusDot =
        getElement(
            'payment-status-dot'
        );


    const statusText =
        getElement(
            'payment-connection-text'
        );


    if (statusDot) {

        statusDot.classList.toggle(
            'connected',
            connected
        );

        statusDot.classList.toggle(
            'disconnected',
            !connected
        );

    }


    if (statusText) {

        statusText.textContent =
            message ||
            (
                connected
                    ? 'Backend Connected'
                    : 'Backend Disconnected'
            );

    }

};


// ================================================================
// LAST UPDATED
// ================================================================

const updateLastUpdated = (
    timestamp
) => {

    const element =
        getElement(
            'payment-last-updated'
        );


    if (!element) {

        return;

    }


    element.textContent =
        timestamp
            ? formatDateTime(timestamp)
            : '—';

};


// ================================================================
// ADMIN USER
// ================================================================

const loadAdminUser = () => {

    const adminUserElement =
        getElement(
            'admin-user-name'
        );


    if (!adminUserElement) {

        return;

    }


    try {

        const storedUser =
            sessionStorage.getItem(
                'kisanSetuAdminUser'
            );


        if (storedUser) {

            const user =
                JSON.parse(
                    storedUser
                );


            adminUserElement.textContent =
                user.username ||
                user.name ||
                user.email ||
                'Administrator';


            return;

        }

    } catch (error) {

        console.warn(
            '[A6] Unable to read admin user:',
            error
        );

    }


    adminUserElement.textContent =
        'Administrator';

};


// ================================================================
// LOGOUT
// ================================================================

const logoutAdmin = async () => {

    const logoutButton =
        getElement(
            'admin-logout-button'
        );


    if (logoutButton) {

        logoutButton.disabled =
            true;

    }


    try {

        const sessionId =
            getAdminSession();


        if (sessionId) {

            await fetch(
                `${API_BASE_URL}/api/admin/logout`,
                {
                    method:
                        'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'Accept':
                            'application/json',

                        'x-admin-session':
                            sessionId
                    }
                }
            );

        }

    } catch (error) {

        console.warn(
            '[A6] Logout request failed:',
            error
        );

    } finally {

        clearAdminSession();

        window.location.href =
            'admin.html';

    }

};


// ================================================================
// PAYMENT STATE
// ================================================================

let allPayments = [];

let latestPaymentData = null;

let autoRefreshTimer = null;

const AUTO_REFRESH_INTERVAL =
    30000;


// Prevent overlapping or stale API requests.
let paymentRequestController = null;

let paymentRequestSequence = 0;


// Prevent duplicate page-wide event listeners.
let paymentPageInitialized = false;


// ================================================================
// PAYMENT STATUS NORMALIZATION
// ================================================================

const normalizePaymentStatus = (
    payment
) => {

    const rawStatus =
        String(
            payment?.paymentStatus ||
            payment?.paymentStatusLabel ||
            payment?.status ||
            'pending'
        )
            .trim()
            .toLowerCase();


    if (
        rawStatus.includes(
            'dbt'
        ) &&
        rawStatus.includes(
            'dispatch'
        )
    ) {

        return 'dbt-dispatched';

    }


    if (
        rawStatus.includes(
            'pfms'
        ) &&
        (
            rawStatus.includes(
                'batch'
            ) ||
            rawStatus.includes(
                'process'
            )
        )
    ) {

        return 'pfms-batched';

    }


    if (
        rawStatus ===
            'failed' ||

        rawStatus.includes(
            'fail'
        )
    ) {

        return 'failed';

    }


    return 'pending';

};


// ================================================================
// PAYMENT STATUS LABEL
// ================================================================

const getPaymentStatusLabel = (
    payment
) => {

    switch (
        normalizePaymentStatus(
            payment
        )
    ) {

        case 'dbt-dispatched':

            return 'DBT Dispatched';


        case 'pfms-batched':

            return 'PFMS Batched';


        case 'failed':

            return 'Failed';


        case 'pending':

        default:

            return 'Pending';

    }

};


// ================================================================
// PAYMENT STATUS CSS CLASS
// ================================================================

const getPaymentStatusClass = (
    payment
) => {

    return normalizePaymentStatus(
        payment
    );

};


// ================================================================
// PAYMENT DATE
// ================================================================

const getPaymentDate = (
    payment
) => {

    if (
        payment?.date
    ) {

        return String(
            payment.date
        )
            .split('T')[0];

    }


    if (
        payment?.paymentDate
    ) {

        return String(
            payment.paymentDate
        )
            .split('T')[0];

    }


    const timestamp =
        payment?.receiptTimestamp ||
        payment?.updatedAt ||
        payment?.createdAt;


    if (!timestamp) {

        return '';

    }


    const date =
        new Date(
            timestamp
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            timestamp
        )
            .split('T')[0];

    }


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        )
            .padStart(
                2,
                '0'
            );


    const day =
        String(
            date.getDate()
        )
            .padStart(
                2,
                '0'
            );


    return `${year}-${month}-${day}`;

};


// ================================================================
// PAYMENT QUANTITY
// ================================================================
// Payment quantity must represent ACTUAL PROCUREMENT quantity.
// Booking/estimated quantity must never be preferred for payout.
//
// The backend may expose actual procurement using one of the
// explicit actual/procured quantity fields below.

const getPaymentQuantity = (
    payment
) => {

    const quantity =
        payment?.actualProcuredQuantityQuintals ??
        payment?.actualProcurementQuantityQuintals ??
        payment?.procuredQuantityQuintals ??
        payment?.actualQuantityQuintals ??
        payment?.actualProcuredQuantity ??
        payment?.procuredQuantity ??
        payment?.quantityQuintals ??
        payment?.quantity ??
        0;


    return Number(
        quantity
    ) || 0;

};


// ================================================================
// PAYMENT BOOKING ID
// ================================================================

const getPaymentBookingId = (
    payment
) => {

    return (
        payment?.bookingId ||
        payment?.booking?.bookingId ||
        ''
    );

};


// ================================================================
// PAYMENT FARMER ID
// ================================================================

const getPaymentFarmerId = (
    payment
) => {

    return (
        payment?.farmerId ||
        payment?.farmer?.farmerId ||
        payment?.farmer?.id ||
        ''
    );

};


// ================================================================
// PAYMENT MSP
// ================================================================

const getPaymentMSP = (
    payment
) => {

    const msp =
        payment?.mspPerQuintal ??
        payment?.mspRate ??
        payment?.msp ??
        payment?.minimumSupportPrice ??
        null;


    if (
        msp === null ||
        msp === undefined ||
        msp === ''
    ) {

        return null;

    }


    const value =
        Number(
            msp
        );


    return Number.isFinite(
        value
    )
        ? value
        : null;

};


// ================================================================
// PAYMENT PAYOUT
// ================================================================

const getPaymentPayout = (
    payment
) => {

    const payout =
        payment?.payoutAmount ??
        payment?.payableAmount ??
        payment?.paymentAmount ??
        payment?.amount ??
        null;


    if (
        payout === null ||
        payout === undefined ||
        payout === ''
    ) {

        return null;

    }


    const value =
        Number(
            payout
        );


    return Number.isFinite(
        value
    )
        ? value
        : null;

};


// ================================================================
// PAYMENT CENTER
// ================================================================

const getPaymentCenter = (
    payment
) => {

    return (
        payment?.center ||
        payment?.centerId ||
        '—'
    );

};


// ================================================================
// PFMS REFERENCE
// ================================================================

const getPFMSReference = (
    payment
) => {

    return (
        payment?.pfmsReference ||
        payment?.pfmsRef ||
        payment?.pfmsReferenceNumber ||
        payment?.pfmsId ||
        ''
    );

};


// ================================================================
// UTR
// ================================================================

const getUTR = (
    payment
) => {

    return (
        payment?.utr ||
        payment?.utrNumber ||
        payment?.utrReference ||
        payment?.bankUtr ||
        ''
    );

};


// ================================================================
// CALCULATE SUMMARY
// ================================================================

const calculateSummary = (
    payments
) => {

    const records =
        Array.isArray(
            payments
        )
            ? payments
            : [];


    let totalPaymentValue =
        0;

    let pending =
        0;

    let pfmsBatched =
        0;

    let dbtDispatched =
        0;

    let failed =
        0;


    records.forEach(
        payment => {

            const amount =
                getPaymentPayout(
                    payment
                );


            if (
                amount !== null
            ) {

                totalPaymentValue +=
                    amount;

            }


            const status =
                normalizePaymentStatus(
                    payment
                );


            switch (
                status
            ) {

                case 'pending':

                    pending++;

                    break;


                case 'pfms-batched':

                    pfmsBatched++;

                    break;


                case 'dbt-dispatched':

                    dbtDispatched++;

                    break;


                case 'failed':

                    failed++;

                    break;

            }

        }
    );


    return {

        totalPaymentValue,

        pending,

        pfmsBatched,

        dbtDispatched,

        failed,

        totalTransactions:
            records.length

    };

};


// ================================================================
// SUMMARY RENDERING
// ================================================================

const renderSummary = (
    backendSummary,
    payments
) => {

    const calculated =
        calculateSummary(
            payments
        );


    /*
       The payment endpoint is the source of truth for
       transaction-level rendering.

       Calculated values keep summary cards synchronized
       with the payment records returned by the backend.

       Actual payout values are used rather than booking
       estimates.
    */


    const totalPaymentValue =
        getElement(
            'total-payment-value'
        );


    if (totalPaymentValue) {

        totalPaymentValue.textContent =
            formatCurrency(
                calculated.totalPaymentValue
            );

    }


    const pendingPaymentCount =
        getElement(
            'pending-payment-count'
        );


    if (pendingPaymentCount) {

        pendingPaymentCount.textContent =
            formatNumber(
                calculated.pending,
                0
            );

    }


    const pfmsBatchedCount =
        getElement(
            'pfms-batched-count'
        );


    if (pfmsBatchedCount) {

        pfmsBatchedCount.textContent =
            formatNumber(
                calculated.pfmsBatched,
                0
            );

    }


    const dbtDispatchedCount =
        getElement(
            'dbt-dispatched-count'
        );


    if (dbtDispatchedCount) {

        dbtDispatchedCount.textContent =
            formatNumber(
                calculated.dbtDispatched,
                0
            );

    }

};


// ================================================================
// PAYMENT TABLE BODY
// ================================================================

const getPaymentTableBody = () => {

    return getElement(
        'payment-table-body'
    );

};


// ================================================================
// EMPTY STATE
// ================================================================

const setEmptyStateVisible = (
    visible
) => {

    const emptyState =
        getElement(
            'payment-empty-state'
        );


    if (!emptyState) {

        return;

    }


    emptyState.hidden =
        !visible;


    emptyState.style.display =
        visible
            ? ''
            : 'none';

};


// ================================================================
// RENDER PAYMENT TABLE
// ================================================================

const renderPaymentTable = (
    payments
) => {

    const tableBody =
        getPaymentTableBody();


    if (!tableBody) {

        console.warn(
            '[A6] Payment table body not found.'
        );

        return;

    }


    tableBody.innerHTML =
        '';


    if (
        !Array.isArray(
            payments
        ) ||
        payments.length === 0
    ) {

        setEmptyStateVisible(
            true
        );


        tableBody.innerHTML = `
            <tr>

                <td
                    colspan="8"
                    class="payment-loading-cell"
                >

                    <i class="fa-solid fa-file-invoice-dollar"></i>

                    No payment transactions match
                    the selected filters.

                </td>

            </tr>
        `;


        return;

    }


    setEmptyStateVisible(
        false
    );


    payments.forEach(
        payment => {

            const transactionId =
                payment?.transactionId ||
                payment?.receiptId ||
                '—';


            const farmerName =
                payment?.farmerName ||
                'Unknown Farmer';


            const kccNumber =
                payment?.kccNumber ||
                '—';


            const tokenId =
                payment?.tokenId ||
                '—';


            const bookingId =
                getPaymentBookingId(
                    payment
                );


            const farmerId =
                getPaymentFarmerId(
                    payment
                );


            const center =
                getPaymentCenter(
                    payment
                );


            // IMPORTANT:
            // This quantity is actual procurement quantity.
            // Estimated/booked quantity is not used as a fallback.
            const actualQuantity =
                getPaymentQuantity(
                    payment
                );


            const quantity =
                `${formatNumber(
                    actualQuantity,
                    2
                )} qtl`;


            const payout =
                getPaymentPayout(
                    payment
                );


            const amount =
                payout !== null
                    ? formatCurrency(
                        payout
                    )
                    : '—';


            const statusClass =
                getPaymentStatusClass(
                    payment
                );


            const statusLabel =
                getPaymentStatusLabel(
                    payment
                );


            const updated =
                formatDateTime(
                    payment?.updatedAt ||
                    payment?.createdAt ||
                    payment?.receiptTimestamp
                );


            const row =
                document.createElement(
                    'tr'
                );


            row.dataset.paymentId =
                String(
                    transactionId
                );


            // Preserve transaction traceability
            // without changing the existing DOM structure.
            if (tokenId !== '—') {

                row.dataset.tokenId =
                    String(
                        tokenId
                    );

            }


            if (bookingId) {

                row.dataset.bookingId =
                    String(
                        bookingId
                    );

            }


            if (farmerId) {

                row.dataset.farmerId =
                    String(
                        farmerId
                    );

            }


            row.dataset.actualQuantity =
                String(
                    actualQuantity
                );


            const msp =
                getPaymentMSP(
                    payment
                );


            if (msp !== null) {

                row.dataset.msp =
                    String(
                        msp
                    );

            }


            if (payout !== null) {

                row.dataset.payout =
                    String(
                        payout
                    );

            }


            const pfmsReference =
                getPFMSReference(
                    payment
                );


            if (pfmsReference) {

                row.dataset.pfmsReference =
                    String(
                        pfmsReference
                    );

            }


            const utr =
                getUTR(
                    payment
                );


            if (utr) {

                row.dataset.utr =
                    String(
                        utr
                    );

            }


            row.innerHTML = `
                <td>

                    <div class="payment-transaction">

                        <strong>
                            ${escapeHtml(
                                transactionId
                            )}
                        </strong>

                        <span>
                            ${escapeHtml(
                                payment?.receiptId ||
                                '—'
                            )}
                        </span>

                    </div>

                </td>


                <td>

                    <div class="payment-farmer">

                        <strong>
                            ${escapeHtml(
                                farmerName
                            )}
                        </strong>

                        <span>
                            ${escapeHtml(
                                kccNumber
                            )}
                        </span>

                    </div>

                </td>


                <td>

                    <span class="payment-reference">

                        ${escapeHtml(
                            tokenId
                        )}

                    </span>

                </td>


                <td>

                    <span class="payment-reference">

                        ${escapeHtml(
                            center
                        )}

                    </span>

                </td>


                <td>

                    <span class="payment-quantity">

                        ${escapeHtml(
                            quantity
                        )}

                    </span>

                </td>


                <td>

                    <strong class="payment-amount">

                        ${escapeHtml(
                            amount
                        )}

                    </strong>

                </td>


                <td>

                    <span
                        class="payment-status-badge ${statusClass}"
                    >

                        ${escapeHtml(
                            statusLabel
                        )}

                    </span>

                </td>


                <td>

                    <span class="payment-updated">

                        ${escapeHtml(
                            updated
                        )}

                    </span>

                </td>
            `;


            tableBody.appendChild(
                row
            );

        }
    );

};


// ================================================================
// CENTER FILTER
// ================================================================

const populateCenterFilter = (
    payments
) => {

    const centerFilter =
        getElement(
            'payment-center-filter'
        );


    if (!centerFilter) {

        return;

    }


    const currentValue =
        centerFilter.value ||
        'all';


    const centers =
        [
            ...new Set(
                (
                    Array.isArray(
                        payments
                    )
                        ? payments
                        : []
                )
                    .map(
                        payment =>
                            getPaymentCenter(
                                payment
                            )
                    )
                    .filter(
                        center =>
                            center &&
                            center !== '—'
                    )
            )
        ]
            .sort(
                (a, b) =>
                    String(a).localeCompare(
                        String(b)
                    )
            );


    centerFilter.innerHTML =
        '';


    const allOption =
        document.createElement(
            'option'
        );


    allOption.value =
        'all';


    allOption.textContent =
        'All Centers';


    centerFilter.appendChild(
        allOption
    );


    centers.forEach(
        center => {

            const option =
                document.createElement(
                    'option'
                );


            option.value =
                center;


            option.textContent =
                center;


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


    centerFilter.value =
        matchingOption
            ? currentValue
            : 'all';

};


// ================================================================
// FILTER PAYMENTS
// ================================================================

const getFilteredPayments = () => {

    const searchInput =
        getElement(
            'payment-search'
        );


    const centerFilter =
        getElement(
            'payment-center-filter'
        );


    const statusFilter =
        getElement(
            'payment-status-filter'
        );


    const dateFilter =
        getElement(
            'payment-date-filter'
        );


    const search =
        String(
            searchInput?.value ||
            ''
        )
            .trim()
            .toLowerCase();


    const selectedCenter =
        String(
            centerFilter?.value ||
            'all'
        )
            .trim()
            .toLowerCase();


    const selectedStatus =
        String(
            statusFilter?.value ||
            'all'
        )
            .trim()
            .toLowerCase();


    const selectedDate =
        String(
            dateFilter?.value ||
            'all'
        )
            .trim()
            .toLowerCase();


    const today =
        getLocalDateString(
            new Date()
        );


    return allPayments.filter(
        payment => {

            // ------------------------------------------------------
            // SEARCH
            // ------------------------------------------------------

            const searchableText =
                [

                    payment?.transactionId,

                    payment?.receiptId,

                    payment?.farmerName,

                    payment?.farmerId,

                    payment?.farmer?.farmerId,

                    payment?.kccNumber,

                    payment?.tokenId,

                    payment?.bookingId,

                    payment?.phone,

                    payment?.cropType,

                    payment?.vehicleNumber,

                    payment?.center,

                    payment?.centerId,

                    payment?.pfmsReference,

                    payment?.pfmsRef,

                    payment?.pfmsReferenceNumber,

                    payment?.utr,

                    payment?.utrNumber,

                    payment?.utrReference

                ]
                    .filter(
                        value =>
                            value !==
                            undefined &&
                            value !==
                            null &&
                            String(
                                value
                            ).trim() !== ''
                    )
                    .join(' ')
                    .toLowerCase();


            const matchesSearch =
                !search ||
                searchableText.includes(
                    search
                );


            // ------------------------------------------------------
            // CENTER
            // ------------------------------------------------------

            const paymentCenter =
                String(
                    getPaymentCenter(
                        payment
                    )
                )
                    .trim()
                    .toLowerCase();


            const matchesCenter =
                selectedCenter ===
                    'all' ||
                paymentCenter ===
                    selectedCenter;


            // ------------------------------------------------------
            // STATUS
            // ------------------------------------------------------

            const paymentStatus =
                normalizePaymentStatus(
                    payment
                );


            const matchesStatus =
                selectedStatus ===
                    'all' ||
                paymentStatus ===
                    selectedStatus;


            // ------------------------------------------------------
            // DATE
            // ------------------------------------------------------

            const paymentDate =
                getPaymentDate(
                    payment
                );


            const matchesDate =
                selectedDate ===
                    'all' ||

                (
                    selectedDate ===
                        'today' &&
                    paymentDate ===
                        today
                );


            return (
                matchesSearch &&
                matchesCenter &&
                matchesStatus &&
                matchesDate
            );

        }
    );

};


// ================================================================
// LOCAL DATE STRING
// ================================================================

const getLocalDateString = (
    date
) => {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        )
            .padStart(
                2,
                '0'
            );


    const day =
        String(
            date.getDate()
        )
            .padStart(
                2,
                '0'
            );


    return `${year}-${month}-${day}`;

};


// ================================================================
// APPLY FILTERS
// ================================================================

const applyFilters = () => {

    const filteredPayments =
        getFilteredPayments();


    renderPaymentTable(
        filteredPayments
    );

};


// ================================================================
// LOAD PAYMENT DATA
// ================================================================

const loadPaymentData = async () => {

    if (
        !isAdminAuthenticated()
    ) {

        redirectToLogin();

        return;

    }


    // --------------------------------------------------------------
    // CANCEL PREVIOUS REQUEST
    // --------------------------------------------------------------

    if (
        paymentRequestController
    ) {

        paymentRequestController.abort();

    }


    const controller =
        new AbortController();


    paymentRequestController =
        controller;


    const requestSequence =
        ++paymentRequestSequence;


    const refreshButton =
        getElement(
            'refresh-payment-button'
        );


    if (refreshButton) {

        refreshButton.disabled =
            true;

        refreshButton.classList.add(
            'loading'
        );

    }


    setConnectionStatus(
        false,
        'Connecting...'
    );


    try {

        const data =
            await adminFetch(
                '/api/admin/payments',
                {
                    signal:
                        controller.signal
                }
            );


        // Ignore an older response if a newer request
        // has already been started.
        if (
            requestSequence !==
            paymentRequestSequence
        ) {

            return;

        }


        if (
            !data ||
            data.success !== true
        ) {

            throw new Error(
                data?.message ||
                'Invalid payment data received.'
            );

        }


        latestPaymentData =
            data;


        allPayments =
            Array.isArray(
                data.payments
            )
                ? data.payments
                : [];


        // ----------------------------------------------------------
        // SUMMARY
        // ----------------------------------------------------------

        renderSummary(
            data.summary ||
            {},
            allPayments
        );


        // ----------------------------------------------------------
        // CENTER FILTER
        // ----------------------------------------------------------

        populateCenterFilter(
            allPayments
        );


        // ----------------------------------------------------------
        // TABLE
        // ----------------------------------------------------------

        applyFilters();


        // ----------------------------------------------------------
        // CONNECTION
        // ----------------------------------------------------------

        setConnectionStatus(
            true,
            'Backend Connected'
        );


        updateLastUpdated(
            data.generatedAt ||
            new Date().toISOString()
        );


    } catch (error) {

        // Aborted requests are expected when a newer
        // request supersedes an older request.
        if (
            error?.name ===
            'AbortError'
        ) {

            return;

        }


        // Never allow an older request to overwrite
        // the state produced by a newer request.
        if (
            requestSequence !==
            paymentRequestSequence
        ) {

            return;

        }


        console.error(
            '[A6] Payment monitoring error:',
            error
        );


        if (
            error.message ===
            'Administrator session expired.'
        ) {

            return;

        }


        setConnectionStatus(
            false,
            'Backend Disconnected'
        );


        updateLastUpdated(
            null
        );


        const tableBody =
            getPaymentTableBody();


        if (tableBody) {

            tableBody.innerHTML = `
                <tr>

                    <td
                        colspan="8"
                        class="payment-error-row"
                    >

                        Unable to load payment monitoring data.

                        <br>

                        <small>
                            ${escapeHtml(
                                error.message ||
                                'Unknown error.'
                            )}
                        </small>

                    </td>

                </tr>
            `;

        }


        setEmptyStateVisible(
            false
        );

    } finally {

        // Only the current request can restore the
        // refresh button and controller state.
        if (
            requestSequence ===
            paymentRequestSequence
        ) {

            if (
                paymentRequestController ===
                controller
            ) {

                paymentRequestController =
                    null;

            }


            if (refreshButton) {

                refreshButton.disabled =
                    false;

                refreshButton.classList.remove(
                    'loading'
                );

            }

        }

    }

};


// ================================================================
// EVENT LISTENERS
// ================================================================

const setupEventListeners = () => {

    // Prevent duplicate listeners if initialization
    // is triggered more than once.
    if (
        paymentPageInitialized
    ) {

        return;

    }


    // --------------------------------------------------------------
    // REFRESH
    // --------------------------------------------------------------

    const refreshButton =
        getElement(
            'refresh-payment-button'
        );


    if (refreshButton) {

        refreshButton.addEventListener(
            'click',
            () => {

                // Do not create another overlapping
                // request from a manual refresh.
                if (
                    paymentRequestController
                ) {

                    return;

                }


                loadPaymentData();

            }
        );

    }


    // --------------------------------------------------------------
    // SEARCH
    // --------------------------------------------------------------

    const searchInput =
        getElement(
            'payment-search'
        );


    if (searchInput) {

        searchInput.addEventListener(
            'input',
            applyFilters
        );

    }


    // --------------------------------------------------------------
    // CENTER
    // --------------------------------------------------------------

    const centerFilter =
        getElement(
            'payment-center-filter'
        );


    if (centerFilter) {

        centerFilter.addEventListener(
            'change',
            applyFilters
        );

    }


    // --------------------------------------------------------------
    // PAYMENT STATUS
    // --------------------------------------------------------------

    const statusFilter =
        getElement(
            'payment-status-filter'
        );


    if (statusFilter) {

        statusFilter.addEventListener(
            'change',
            applyFilters
        );

    }


    // --------------------------------------------------------------
    // DATE
    // --------------------------------------------------------------

    const dateFilter =
        getElement(
            'payment-date-filter'
        );


    if (dateFilter) {

        dateFilter.addEventListener(
            'change',
            applyFilters
        );

    }


    // --------------------------------------------------------------
    // LOGOUT
    // --------------------------------------------------------------

    const logoutButton =
        getElement(
            'admin-logout-button'
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            'click',
            logoutAdmin
        );

    }


    paymentPageInitialized =
        true;

};


// ================================================================
// AUTO REFRESH
// ================================================================

const startAutoRefresh = () => {

    if (
        autoRefreshTimer
    ) {

        clearInterval(
            autoRefreshTimer
        );

    }


    autoRefreshTimer =
        setInterval(
            () => {

                if (
                    !isAdminAuthenticated()
                ) {

                    clearInterval(
                        autoRefreshTimer
                    );

                    autoRefreshTimer =
                        null;

                    return;

                }


                // Never start another request while
                // the current request is still active.
                if (
                    paymentRequestController
                ) {

                    return;

                }


                loadPaymentData();

            },
            AUTO_REFRESH_INTERVAL
        );

};


// ================================================================
// CLEANUP
// ================================================================

window.addEventListener(
    'beforeunload',
    () => {

        if (
            autoRefreshTimer
        ) {

            clearInterval(
                autoRefreshTimer
            );

            autoRefreshTimer =
                null;

        }


        if (
            paymentRequestController
        ) {

            paymentRequestController.abort();

            paymentRequestController =
                null;

        }

    }
);


// ================================================================
// INITIALIZATION
// ================================================================

const initPaymentPage = async () => {

    if (
        paymentPageInitialized
    ) {

        return;

    }


    if (
        !isAdminAuthenticated()
    ) {

        redirectToLogin();

        return;

    }


    loadAdminUser();

    setupEventListeners();

    await loadPaymentData();

    startAutoRefresh();

};


document.addEventListener(
    'DOMContentLoaded',
    initPaymentPage
);


// ================================================================
// GLOBAL FUNCTIONS
// ================================================================

window.loadPaymentData =
    loadPaymentData;

window.applyPaymentFilters =
    applyFilters;

window.logoutAdmin =
    logoutAdmin;
