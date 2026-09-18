
// ================================================================
// KISAN SETU ADMIN PORTAL
// A5 • LIVE PROCUREMENT QUEUE
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
// ADMIN FETCH HELPER
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


    let data = {};


    try {

        data =
            await response.json();

    } catch {

        data = {};

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
// DOM HELPERS
// ================================================================

const getElement = (
    id
) => {

    return document.getElementById(
        id
    );

};


const setText = (
    ids,
    value
) => {

    const idList =
        Array.isArray(ids)
            ? ids
            : [ids];


    for (
        const id of idList
    ) {

        const element =
            getElement(id);


        if (element) {

            element.textContent =
                value;

            return;

        }

    }

};


// ================================================================
// FORMATTERS
// ================================================================

const formatNumber = (
    value
) => {

    const number =
        Number(value);


    if (
        !Number.isFinite(number)
    ) {

        return '0';

    }


    return number.toLocaleString(
        'en-IN',
        {
            maximumFractionDigits: 2
        }
    );

};


const formatDateTime = (
    value
) => {

    if (!value) {

        return '--';

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return '--';

    }


    return date.toLocaleString(
        'en-IN',
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }
    );

};


const formatTime = (
    value
) => {

    if (!value) {

        return '--';

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return '--';

    }


    return date.toLocaleTimeString(
        'en-IN',
        {
            hour: '2-digit',
            minute: '2-digit'
        }
    );

};


const escapeHTML = (
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

    const text =
        getElement(
            'queue-connection-text'
        );


    const dot =
        getElement(
            'queue-status-dot'
        );


    if (text) {

        text.textContent =
            message;

    }


    if (dot) {

        dot.style.background =
            connected
                ? '#6c8b73'
                : '#a66b63';

    }

};


// ================================================================
// ADMIN USER
// ================================================================

const renderAdminUser = () => {

    const userName =
        getElement(
            'admin-user-name'
        );

    const adminAvatar =
        getElement(
            'admin-avatar'
        );


    const setAdminDisplay = (
        displayName
    ) => {

        const cleanName =
            String(
                displayName || 'Administrator'
            ).trim();


        if (userName) {

            userName.textContent =
                cleanName;

        }


        if (adminAvatar) {

            const nameParts =
                cleanName
                    .split(/\s+/)
                    .filter(Boolean);


            let initials = 'AD';


            if (
                nameParts.length >= 2
            ) {

                initials =
                    (
                        nameParts[0][0] +
                        nameParts[1][0]
                    ).toUpperCase();

            } else if (
                nameParts.length === 1 &&
                cleanName.toLowerCase() !==
                    'administrator' &&
                cleanName.toLowerCase() !==
                    'admin'
            ) {

                initials =
                    nameParts[0][0]
                        .toUpperCase();

            }


            adminAvatar.textContent =
                initials;

        }

    };


    try {

        const storedUser =
            sessionStorage.getItem(
                'kisanSetuAdminUser'
            );


        if (!storedUser) {

            setAdminDisplay(
                'Administrator'
            );

            return;

        }


        const user =
            JSON.parse(
                storedUser
            );


        const displayName =
            user.name ||
            user.fullName ||
            user.username ||
            user.email ||
            'Administrator';


        setAdminDisplay(
            displayName
        );


    } catch {

        setAdminDisplay(
            'Administrator'
        );

    }

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
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'x-admin-session':
                            sessionId
                    }
                }
            );

        }

    } catch (error) {

        console.warn(
            '[A5 Admin Logout]',
            error
        );

    } finally {

        clearAdminSession();

        window.location.href =
            'admin.html';

    }

};


// ================================================================
// QUEUE STATE
// ================================================================

let queueData = {

    summary: {

        currentlyServing: 0,

        waiting: 0,

        checkedIn: 0,

        completed: 0,

        totalActive: 0,

        totalToday: 0

    },

    currentlyServing:
        null,

    queue: [],

    centers: []

};


let lastQueueData = null;

let autoRefreshTimer = null;

// Prevent overlapping requests and stale responses.
let queueRequestController = null;

let queueRequestSequence = 0;

// Prevent duplicate page-wide event listeners.
let queuePageInitialized = false;


// ================================================================
// SUMMARY
// ================================================================

const renderSummary = (
    summary
) => {

    const safeSummary =
        summary || {};


    setText(
        'currently-serving',
        formatNumber(
            safeSummary.currentlyServing
        )
    );


    setText(
        'waiting-count',
        formatNumber(
            safeSummary.waiting
        )
    );


    setText(
        'checked-in-count',
        formatNumber(
            safeSummary.checkedIn
        )
    );


    setText(
        'completed-count',
        formatNumber(
            safeSummary.completed
        )
    );


    setText(
        'total-queue-count',
        formatNumber(
            safeSummary.totalActive
        )
    );

};


// ================================================================
// SLOT FILTER
// ================================================================

const populateSlotFilter = (
    records
) => {

    const select =
        getElement(
            'queue-slot-filter'
        );


    if (!select) {

        return;

    }


    const currentValue =
        select.value ||
        'all';


    const slots =
        [
            ...new Set(
                (records || [])
                    .map(
                        record =>
                            record.timeSlot
                    )
                    .filter(Boolean)
            )
        ]
            .sort(
                (a, b) =>
                    String(a).localeCompare(
                        String(b)
                    )
            );


    select.innerHTML =
        '';


    const allOption =
        document.createElement(
            'option'
        );


    allOption.value =
        'all';


    allOption.textContent =
        'All Slots';


    select.appendChild(
        allOption
    );


    slots.forEach(
        slot => {

            const option =
                document.createElement(
                    'option'
                );


            option.value =
                slot;


            option.textContent =
                slot;


            select.appendChild(
                option
            );

        }
    );


    const matchingOption =
        [...select.options]
            .find(
                option =>
                    option.value ===
                    currentValue
            );


    select.value =
        matchingOption
            ? currentValue
            : 'all';

};


// ================================================================
// STATUS HELPERS
// ================================================================

const getNormalizedStatus = (
    record
) => {

    return String(
        record?.displayStatus ||
        record?.status ||
        'Waiting'
    )
        .trim()
        .toLowerCase();

};


const getStatusClass = (
    record
) => {

    const status =
        getNormalizedStatus(
            record
        );


    if (
        status.includes(
            'checked'
        ) ||
        status.includes(
            'gate queue'
        )
    ) {

        return 'checked-in';

    }


    if (
        status.includes(
            'serving'
        ) ||
        status.includes(
            'weighbridge'
        )
    ) {

        return 'serving';

    }


    if (
        status.includes(
            'completed'
        ) ||
        status.includes(
            'quality'
        ) ||
        status.includes(
            'approved'
        )
    ) {

        return 'completed';

    }


    return 'waiting';

};


const getStatusLabel = (
    record
) => {

    const rawStatus =
        String(
            record?.displayStatus ||
            record?.status ||
            ''
        )
            .trim();


    if (!rawStatus) {

        return 'Waiting';

    }


    const normalized =
        rawStatus.toLowerCase();


    if (
        normalized.includes(
            'active gate queue'
        )
    ) {

        return 'Checked In';

    }


    if (
        normalized ===
            'weighbridge' ||
        normalized ===
            'serving'
    ) {

        return 'Serving';

    }


    if (
        normalized.includes(
            'quality approved'
        )
    ) {

        return 'Completed';

    }


    if (
        normalized ===
        'scheduled'
    ) {

        return 'Waiting';

    }


    return rawStatus;

};


// ================================================================
// CURRENTLY SERVING
// ================================================================

const renderCurrentlyServing = (
    record
) => {

    const container =
        getElement(
            'currently-serving-card'
        );


    const badge =
        getElement(
            'serving-status-badge'
        );


    if (!container) {

        return;

    }


    if (!record) {

        if (badge) {

            badge.textContent =
                'No Active Token';

        }


        container.innerHTML = `
            <div class="serving-placeholder">

                <i class="fa-solid fa-hourglass-half"></i>

                <span>
                    No farmer is currently being served.
                </span>

            </div>
        `;

        return;

    }


    if (badge) {

        badge.textContent =
            'Currently Serving';

    }


    const token =
        escapeHTML(
            record.tokenId ||
            '--'
        );


    const farmerName =
        escapeHTML(
            record.farmerName ||
            'Unknown Farmer'
        );


    const kcc =
        escapeHTML(
            record.kccNumber ||
            '--'
        );


    const slot =
        escapeHTML(
            record.timeSlot ||
            '--'
        );


    const center =
        escapeHTML(
            record.center ||
            record.centerId ||
            '--'
        );


    const vehicle =
        escapeHTML(
            record.vehicleNumber ||
            '--'
        );


    container.innerHTML = `
        <div class="serving-active-card">

            <div class="serving-token">

                <span class="serving-token-label">
                    Token
                </span>

                <span class="serving-token-value">
                    ${token}
                </span>

            </div>


            <div class="serving-farmer-details">

                <div class="serving-farmer-name">
                    ${farmerName}
                </div>


                <div class="serving-farmer-meta">

                    <span>
                        <i class="fa-solid fa-id-card"></i>
                        ${kcc}
                    </span>


                    <span>
                        <i class="fa-regular fa-clock"></i>
                        ${slot}
                    </span>


                    <span>
                        <i class="fa-solid fa-location-dot"></i>
                        ${center}
                    </span>


                    <span>
                        <i class="fa-solid fa-car"></i>
                        ${vehicle}
                    </span>

                </div>

            </div>


            <div class="serving-status">

                <span class="live-dot"></span>

                Serving

            </div>

        </div>
    `;

};


// ================================================================
// FILTER VALUES
// ================================================================

const getFilterValue = (
    id
) => {

    const element =
        getElement(
            id
        );


    if (!element) {

        return 'all';

    }


    return String(
        element.value ||
        'all'
    )
        .trim()
        .toLowerCase();

};


// ================================================================
// FILTER QUEUE
// ================================================================

const filterQueue = (
    records
) => {

    const search =
        String(
            getElement(
                'queue-search'
            )?.value ||
            ''
        )
            .trim()
            .toLowerCase();


    const center =
        getFilterValue(
            'queue-center-filter'
        );


    const slot =
        getFilterValue(
            'queue-slot-filter'
        );


    const status =
        getFilterValue(
            'queue-status-filter'
        );


    return (
        records || []
    ).filter(
        record => {

            // ------------------------------------------------------
            // SEARCH
            // ------------------------------------------------------

            if (search) {

                const searchableText =
                    [

                        record.tokenId,

                        record.bookingId,

                        record.farmerId,

                        record.farmerName,

                        record.kccNumber,

                        record.phone,

                        record.cropType,

                        record.vehicleNumber,

                        record.center,

                        record.centerId,

                        record.timeSlot,

                        record.status,

                        record.displayStatus

                    ]
                        .filter(Boolean)
                        .join(' ')
                        .toLowerCase();


                if (
                    !searchableText.includes(
                        search
                    )
                ) {

                    return false;

                }

            }


            // ------------------------------------------------------
            // CENTER
            // ------------------------------------------------------

            if (
                center !== 'all'
            ) {

                const selectedCenter =
                    center;


                const recordCenterId =
                    String(
                        record.centerId ||
                        ''
                    )
                        .trim()
                        .toLowerCase();


                const recordCenterName =
                    String(
                        record.center ||
                        ''
                    )
                        .trim()
                        .toLowerCase();


                if (
                    !recordCenterId.includes(
                        selectedCenter
                    ) &&
                    !recordCenterName.includes(
                        selectedCenter
                    )
                ) {

                    return false;

                }

            }


            // ------------------------------------------------------
            // SLOT
            // ------------------------------------------------------

            if (
                slot !== 'all'
            ) {

                const recordSlot =
                    String(
                        record.timeSlot ||
                        ''
                    )
                        .trim()
                        .toLowerCase();


                if (
                    recordSlot !==
                    slot
                ) {

                    return false;

                }

            }


            // ------------------------------------------------------
            // STATUS
            // ------------------------------------------------------

            if (
                status !== 'all'
            ) {

                const normalizedStatus =
                    getStatusClass(
                        record
                    );


                if (
                    normalizedStatus !==
                    status
                ) {

                    return false;

                }

            }


            return true;

        }
    );

};


// ================================================================
// QUEUE TABLE
// ================================================================

const renderQueueTable = (
    records
) => {

    const tbody =
        getElement(
            'queue-table-body'
        );


    const emptyState =
        getElement(
            'queue-empty-state'
        );


    if (!tbody) {

        return;

    }


    tbody.innerHTML =
        '';


    if (
        !records ||
        records.length === 0
    ) {

        tbody.innerHTML = `
            <tr>

                <td
                    colspan="8"
                    class="queue-loading-cell"
                >

                    <i class="fa-solid fa-users-slash"></i>

                    No farmers match the current queue filters.

                </td>

            </tr>
        `;


        if (emptyState) {

            emptyState.hidden =
                false;

            emptyState.style.display =
                '';

        }


        return;

    }


    if (emptyState) {

        emptyState.hidden =
            true;

        emptyState.style.display =
            'none';

    }


    records.forEach(
        (
            record,
            index
        ) => {

            const statusClass =
                getStatusClass(
                    record
                );


            const position =
                record.queuePosition ??
                (
                    statusClass ===
                    'completed'
                        ? '--'
                        : index + 1
                );


            const token =
                escapeHTML(
                    record.tokenId ||
                    '--'
                );


            const farmerName =
                escapeHTML(
                    record.farmerName ||
                    'Unknown Farmer'
                );


            const kcc =
                escapeHTML(
                    record.kccNumber ||
                    '--'
                );


            const slot =
                escapeHTML(
                    record.timeSlot ||
                    '--'
                );


            const center =
                escapeHTML(
                    record.center ||
                    record.centerId ||
                    '--'
                );


            const vehicle =
                escapeHTML(
                    record.vehicleNumber ||
                    '--'
                );


            const statusLabel =
                escapeHTML(
                    getStatusLabel(
                        record
                    )
                );


            const updated =
                escapeHTML(
                    formatTime(
                        record.updatedAt ||
                        record.createdAt ||
                        record.timestamp
                    )
                );


            const row =
                document.createElement(
                    'tr'
                );


            row.innerHTML = `
                <td>

                    <span class="queue-position">
                        ${escapeHTML(
                            position
                        )}
                    </span>

                </td>


                <td>

                    <span class="queue-token">
                        ${token}
                    </span>

                </td>


                <td>

                    <div class="queue-farmer">

                        <span class="queue-farmer-name">
                            ${farmerName}
                        </span>

                        <span class="queue-farmer-kcc">
                            ${kcc}
                        </span>

                    </div>

                </td>


                <td>

                    <span class="queue-slot">
                        ${slot}
                    </span>

                </td>


                <td>

                    <span class="queue-center">
                        ${center}
                    </span>

                </td>


                <td>

                    <span class="queue-vehicle">
                        ${vehicle}
                    </span>

                </td>


                <td>

                    <span
                        class="queue-status-badge ${statusClass}"
                    >
                        ${statusLabel}
                    </span>

                </td>


                <td>

                    <span class="queue-updated">
                        ${updated}
                    </span>

                </td>
            `;


            tbody.appendChild(
                row
            );

        }
    );

};


// ================================================================
// APPLY FILTERS
// ================================================================

const applyFilters = () => {

    const filtered =
        filterQueue(
            queueData.queue
        );


    renderQueueTable(
        filtered
    );


    /*
       When filters are active, show the number
       of matching records.

       With no filters, keep the backend's
       authoritative totalActive value.
    */


    const search =
        String(
            getElement(
                'queue-search'
            )?.value ||
            ''
        )
            .trim();


    const center =
        getFilterValue(
            'queue-center-filter'
        );


    const slot =
        getFilterValue(
            'queue-slot-filter'
        );


    const status =
        getFilterValue(
            'queue-status-filter'
        );


    const filtersActive =
        Boolean(
            search
        ) ||
        center !== 'all' ||
        slot !== 'all' ||
        status !== 'all';


    if (filtersActive) {

        setText(
            'total-queue-count',
            formatNumber(
                filtered.length
            )
        );

    } else {

        setText(
            'total-queue-count',
            formatNumber(
                queueData.summary?.totalActive
            )
        );

    }

};


// ================================================================
// RENDER ALL QUEUE DATA
// ================================================================

const renderQueueData = (
    data
) => {

    queueData = {

        summary:
            data?.summary || {},

        currentlyServing:
            data?.currentlyServing ||
            null,

        queue:
            Array.isArray(
                data?.queue
            )
                ? data.queue
                : [],

        centers:
            Array.isArray(
                data?.centers
            )
                ? data.centers
                : []

    };


    renderSummary(
        queueData.summary
    );


    renderCurrentlyServing(
        queueData.currentlyServing
    );


    populateSlotFilter(
        queueData.queue
    );


    applyFilters();


    lastQueueData =
        data;

};


// ================================================================
// LOAD QUEUE DATA
// ================================================================

const loadQueueData = async () => {

    if (
        !isAdminAuthenticated()
    ) {

        redirectToLogin();

        return;

    }


    // Cancel any previous refresh so an older response
    // cannot overwrite newer queue state.
    if (queueRequestController) {

        queueRequestController.abort();

    }


    const controller =
        new AbortController();

    queueRequestController =
        controller;

    const requestSequence =
        ++queueRequestSequence;


    try {

        setConnectionStatus(
            false,
            'Refreshing live queue...'
        );


        const data =
            await adminFetch(
                '/api/admin/queue',
                {
                    signal:
                        controller.signal
                }
            );


        // Ignore a response from an older request.
        if (
            requestSequence !==
            queueRequestSequence
        ) {

            return;

        }


        if (
            !data ||
            data.success !== true
        ) {

            throw new Error(
                data?.message ||
                'Invalid queue response.'
            );

        }


        renderQueueData(
            data
        );


        const generatedAt =
            data.generatedAt ||
            new Date().toISOString();


        setText(
            'queue-last-updated',
            formatTime(
                generatedAt
            )
        );


        setConnectionStatus(
            true,
            'Live queue connected'
        );


    } catch (error) {

        if (
            error?.name ===
            'AbortError'
        ) {

            return;

        }


        // Do not let a stale failed request replace
        // the state of a newer successful request.
        if (
            requestSequence !==
            queueRequestSequence
        ) {

            return;

        }


        console.error(
            '[A5 Queue Error]',
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
            error.message ||
            'Unable to connect to live queue.'
        );


        setText(
            'queue-last-updated',
            'Connection failed'
        );


        const tbody =
            getElement(
                'queue-table-body'
            );


        const emptyState =
            getElement(
                'queue-empty-state'
            );


        if (tbody) {

            tbody.innerHTML = `
                <tr>

                    <td
                        colspan="8"
                        class="queue-loading-cell"
                    >

                        <i class="fa-solid fa-triangle-exclamation"></i>

                        Unable to load live queue data.

                    </td>

                </tr>
            `;

        }


        if (emptyState) {

            emptyState.hidden =
                true;

            emptyState.style.display =
                'none';

        }

    } finally {

        if (
            requestSequence ===
            queueRequestSequence
        ) {

            queueRequestController =
                null;

        }

    }

};


// ================================================================
// REFRESH BUTTON
// ================================================================

const refreshQueue = async () => {

    const button =
        getElement(
            'refresh-queue-button'
        );


    // Avoid starting another manual refresh while one is active.
    if (
        button?.disabled &&
        queueRequestController
    ) {

        return;

    }


    if (button) {

        button.disabled =
            true;


        const icon =
            button.querySelector(
                'i'
            );


        if (icon) {

            icon.classList.add(
                'fa-spin'
            );

        }

    }


    try {

        await loadQueueData();

    } finally {

        if (button) {

            button.disabled =
                false;


            const icon =
                button.querySelector(
                    'i'
                );


            if (icon) {

                icon.classList.remove(
                    'fa-spin'
                );

            }

        }

    }

};


// ================================================================
// FILTER EVENT LISTENERS
// ================================================================

const setupFilters = () => {

    const search =
        getElement(
            'queue-search'
        );


    const center =
        getElement(
            'queue-center-filter'
        );


    const slot =
        getElement(
            'queue-slot-filter'
        );


    const status =
        getElement(
            'queue-status-filter'
        );


    if (search) {

        search.addEventListener(
            'input',
            applyFilters
        );

    }


    if (center) {

        center.addEventListener(
            'change',
            applyFilters
        );

    }


    if (slot) {

        slot.addEventListener(
            'change',
            applyFilters
        );

    }


    if (status) {

        status.addEventListener(
            'change',
            applyFilters
        );

    }

};


// ================================================================
// EVENT LISTENERS
// ================================================================

const setupEventListeners = () => {

    if (queuePageInitialized) {

        return;

    }


    const refreshButton =
        getElement(
            'refresh-queue-button'
        );


    if (refreshButton) {

        refreshButton.addEventListener(
            'click',
            refreshQueue
        );

    }


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


    setupFilters();

    queuePageInitialized = true;

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
                    isAdminAuthenticated()
                ) {

                    if (!queueRequestController) {

                        loadQueueData();

                    }

                } else {

                    clearInterval(
                        autoRefreshTimer
                    );

                }

            },
            30000
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

        }


        if (queueRequestController) {

            queueRequestController.abort();

            queueRequestController = null;

        }

    }
);


// ================================================================
// INITIALIZATION
// ================================================================

const initQueuePage = async () => {

    if (queuePageInitialized) {

        return;

    }


    if (
        !isAdminAuthenticated()
    ) {

        redirectToLogin();

        return;

    }


    renderAdminUser();

    setupEventListeners();

    await loadQueueData();

    startAutoRefresh();

};


document.addEventListener(
    'DOMContentLoaded',
    initQueuePage
);
// ================================================================
// DASHBOARD UI
// ================================================================

const initQueueDashboardUI = () => {

    // DARK MODE

    const themeToggle =
        document.getElementById(
            'admin-theme-toggle'
        );

    const themeIcon =
        themeToggle?.querySelector('i');


    const updateThemeIcon = () => {

        if (!themeIcon) {
            return;
        }

        const darkMode =
            document.body.classList.contains(
                'dark-mode'
            );

        themeIcon.className =
            darkMode
                ? 'fa-solid fa-sun'
                : 'fa-solid fa-moon';

    };


    const savedTheme =
        localStorage.getItem(
            'kisanSetuAdminTheme'
        );


    if (savedTheme === 'dark') {

        document.body.classList.add(
            'dark-mode'
        );

    }


    updateThemeIcon();


    if (themeToggle) {

        themeToggle.addEventListener(
            'click',
            () => {

                document.body.classList.toggle(
                    'dark-mode'
                );


                const darkMode =
                    document.body.classList.contains(
                        'dark-mode'
                    );


                localStorage.setItem(
                    'kisanSetuAdminTheme',
                    darkMode
                        ? 'dark'
                        : 'light'
                );


                updateThemeIcon();

            }
        );

    }


    // CALENDAR

    const calendarTrigger =
        document.getElementById(
            'queue-calendar-trigger'
        );

    const calendarDropdown =
        document.getElementById(
            'queue-calendar-dropdown'
        );

    const dateDisplay =
        document.getElementById(
            'queue-date-display'
        );

    const calendarTitle =
        document.getElementById(
            'queue-calendar-title'
        );

    const calendarDays =
        document.getElementById(
            'queue-calendar-days'
        );

    const previousButton =
        document.getElementById(
            'queue-calendar-prev'
        );

    const nextButton =
        document.getElementById(
            'queue-calendar-next'
        );


    if (
        !calendarTrigger ||
        !calendarDropdown ||
        !dateDisplay ||
        !calendarTitle ||
        !calendarDays
    ) {
        return;
    }


    const today =
        new Date();


    let selectedDate =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
        );


    let viewYear =
        selectedDate.getFullYear();


    let viewMonth =
        selectedDate.getMonth();


    const formatDate = date => {

        const day =
            String(
                date.getDate()
            ).padStart(
                2,
                '0'
            );


        const month =
            String(
                date.getMonth() + 1
            ).padStart(
                2,
                '0'
            );


        const year =
            date.getFullYear();


        return `${day}/${month}/${year}`;

    };


    const isSameDate = (
        firstDate,
        secondDate
    ) => {

        return (
            firstDate.getFullYear() ===
                secondDate.getFullYear() &&

            firstDate.getMonth() ===
                secondDate.getMonth() &&

            firstDate.getDate() ===
                secondDate.getDate()
        );

    };


    const renderCalendar = () => {

        calendarTitle.textContent =
            new Intl.DateTimeFormat(
                'en-IN',
                {
                    month: 'long',
                    year: 'numeric'
                }
            ).format(
                new Date(
                    viewYear,
                    viewMonth,
                    1
                )
            );


        calendarDays.innerHTML =
            '';


        const firstDay =
            new Date(
                viewYear,
                viewMonth,
                1
            ).getDay();


        const numberOfDays =
            new Date(
                viewYear,
                viewMonth + 1,
                0
            ).getDate();


        for (
            let index = 0;
            index < firstDay;
            index++
        ) {

            const emptyDay =
                document.createElement(
                    'span'
                );


            emptyDay.className =
                'queue-calendar-empty';


            calendarDays.appendChild(
                emptyDay
            );

        }


        for (
            let day = 1;
            day <= numberOfDays;
            day++
        ) {

            const date =
                new Date(
                    viewYear,
                    viewMonth,
                    day
                );


            const button =
                document.createElement(
                    'button'
                );


            button.type =
                'button';


            button.className =
                'queue-calendar-day';


            button.textContent =
                day;


            if (
                isSameDate(
                    date,
                    today
                )
            ) {

                button.classList.add(
                    'today'
                );

            }


            if (
                isSameDate(
                    date,
                    selectedDate
                )
            ) {

                button.classList.add(
                    'selected'
                );

            }


            button.addEventListener(
                'click',
                event => {

                    event.stopPropagation();


                    selectedDate =
                        new Date(
                            viewYear,
                            viewMonth,
                            day
                        );


                    dateDisplay.textContent =
                        formatDate(
                            selectedDate
                        );


                    calendarDropdown.hidden =
                        true;


                    renderCalendar();

                }
            );


            calendarDays.appendChild(
                button
            );

        }

    };


    // CURRENT DATE

    dateDisplay.textContent =
        formatDate(
            selectedDate
        );


    renderCalendar();


    // OPEN CALENDAR

    calendarTrigger.addEventListener(
        'click',
        event => {

            event.stopPropagation();


            calendarDropdown.hidden =
                !calendarDropdown.hidden;

        }
    );


    // PREVIOUS MONTH

    previousButton?.addEventListener(
        'click',
        event => {

            event.stopPropagation();


            viewMonth--;


            if (viewMonth < 0) {

                viewMonth = 11;
                viewYear--;

            }


            renderCalendar();

        }
    );


    // NEXT MONTH

    nextButton?.addEventListener(
        'click',
        event => {

            event.stopPropagation();


            viewMonth++;


            if (viewMonth > 11) {

                viewMonth = 0;
                viewYear++;

            }


            renderCalendar();

        }
    );


    // PREVENT DROPDOWN CLOSING

    calendarDropdown.addEventListener(
        'click',
        event => {

            event.stopPropagation();

        }
    );


    // CLOSE WHEN CLICKING OUTSIDE

    document.addEventListener(
        'click',
        () => {

            calendarDropdown.hidden =
                true;

        }
    );

};


// Start dashboard UI

document.addEventListener(
    'DOMContentLoaded',
    initQueueDashboardUI
);

// ================================================================
// LIVE QUEUE FOOTER STATUS SYNC
// ================================================================

const setupQueueFooterSync = () => {

    const sourceConnection =
        document.getElementById('queue-connection-text');

    const sourceUpdated =
        document.getElementById('queue-last-updated');

    const footerConnection =
        document.getElementById('footer-connection-text');

    const footerUpdated =
        document.getElementById('footer-last-updated');

    const footerDot =
        document.getElementById('footer-status-dot');


    const syncQueueFooter = () => {

        // CONNECTION STATUS
        if (sourceConnection && footerConnection) {

            const connectionText =
                sourceConnection.textContent.trim();

            footerConnection.textContent =
                connectionText;

            const lowerText =
                connectionText.toLowerCase();

            const connected =
                lowerText.includes('connected') &&
                !lowerText.includes('disconnected') &&
                !lowerText.includes('unable') &&
                !lowerText.includes('failed');

            if (footerDot) {
                footerDot.style.background =
                    connected
                        ? '#98a973'
                        : '#b65d52';
            }
        }


        // LAST REAL BACKEND UPDATE
        if (sourceUpdated && footerUpdated) {

            const updatedText =
                sourceUpdated.textContent.trim();

            if (
                updatedText &&
                updatedText !== '--' &&
                updatedText !== '—'
            ) {

                if (
                    updatedText.toLowerCase()
                        .includes('connection failed')
                ) {

                    footerUpdated.textContent =
                        'Update failed';

                } else {

                    footerUpdated.textContent =
                        `Updated ${updatedText}`;
                }

            } else {

                footerUpdated.textContent =
                    'Waiting for update';
            }
        }
    };


    // Sync immediately
    syncQueueFooter();


    // Watch backend connection changes
    if (sourceConnection) {

        new MutationObserver(
            syncQueueFooter
        ).observe(
            sourceConnection,
            {
                childList: true,
                subtree: true,
                characterData: true
            }
        );
    }


    // Watch backend timestamp changes
    if (sourceUpdated) {

        new MutationObserver(
            syncQueueFooter
        ).observe(
            sourceUpdated,
            {
                childList: true,
                subtree: true,
                characterData: true
            }
        );
    }
};


document.addEventListener(
    'DOMContentLoaded',
    setupQueueFooterSync
);
