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
            data.message ||
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


    if (!userName) {

        return;

    }


    try {

        const storedUser =
            sessionStorage.getItem(
                'kisanSetuAdminUser'
            );


        if (!storedUser) {

            userName.textContent =
                'Administrator';

            return;

        }


        const user =
            JSON.parse(
                storedUser
            );


        userName.textContent =
            user.username ||
            user.name ||
            user.email ||
            'Administrator';

    } catch {

        userName.textContent =
            'Administrator';

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


    try {

        setConnectionStatus(
            false,
            'Refreshing live queue...'
        );


        const data =
            await adminFetch(
                '/api/admin/queue'
            );


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
            formatDateTime(
                generatedAt
            )
        );


        setConnectionStatus(
            true,
            'Live queue connected'
        );


    } catch (error) {

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

                    loadQueueData();

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

    }
);


// ================================================================
// INITIALIZATION
// ================================================================

const initQueuePage = async () => {

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