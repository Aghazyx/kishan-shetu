// ================================================================
// KISAN SETU
// A7 • REPORTS & ANALYTICS
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
// DOM HELPER
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


    const response =
        await fetch(
            `${API_BASE_URL}${endpoint}`,
            {

                ...options,

                headers: {

                    'Content-Type':
                        'application/json',

                    ...(options.headers || {}),

                    'x-admin-session':
                        sessionId

                }

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
// FORMATTERS
// ================================================================

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


const formatCurrency = (
    value
) => {

    const number =
        Number(
            value || 0
        );


    return `₹${new Intl.NumberFormat(
        'en-IN',
        {

            minimumFractionDigits:
                2,

            maximumFractionDigits:
                2

        }
    ).format(
        Number.isFinite(number)
            ? number
            : 0
    )}`;

};


const formatShortCurrency = (
    value
) => {

    const number =
        Number(
            value || 0
        );


    if (
        !Number.isFinite(number)
    ) {

        return '₹0.00';

    }


    if (
        number >= 10000000
    ) {

        return `₹${(
            number / 10000000
        ).toFixed(2)} Cr`;

    }


    if (
        number >= 100000
    ) {

        return `₹${(
            number / 100000
        ).toFixed(2)} L`;

    }


    if (
        number >= 1000
    ) {

        return `₹${(
            number / 1000
        ).toFixed(1)}K`;

    }


    return formatCurrency(
        number
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
// ADMIN USER
// ================================================================

const loadAdminUser = () => {

    const adminUserName =
        getElement(
            'admin-user-name'
        );


    if (!adminUserName) {

        return;

    }


    try {

        const storedUser =
            sessionStorage.getItem(
                'kisanSetuAdminUser'
            );


        if (!storedUser) {

            adminUserName.textContent =
                'Administrator';

            return;

        }


        const user =
            JSON.parse(
                storedUser
            );


        adminUserName.textContent =
            user.username ||
            user.name ||
            user.email ||
            'Administrator';

    } catch {

        adminUserName.textContent =
            'Administrator';

    }

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
            'reports-status-dot'
        );


    const statusText =
        getElement(
            'reports-connection-text'
        );


    if (statusDot) {

        statusDot.classList.toggle(
            'connected',
            connected
        );

        statusDot.classList.toggle(
            'error',
            !connected
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
                    ? 'Connected'
                    : 'Connection Error'
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
            'reports-last-updated'
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
        rawStatus.includes('dbt') &&
        rawStatus.includes('dispatch')
    ) {

        return 'dbt-dispatched';

    }


    if (
        rawStatus.includes('pfms') &&
        (
            rawStatus.includes('batch') ||
            rawStatus.includes('process')
        )
    ) {

        return 'pfms-batched';

    }


    if (
        rawStatus.includes('fail')
    ) {

        return 'failed';

    }


    return 'pending';

};


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
// QUALITY NORMALIZATION
// ================================================================

const normalizeQualityGrade = (
    value
) => {

    const grade =
        String(
            value ?? ''
        )
            .trim()
            .toUpperCase()
            .replace(
                /[\s_-]+/g,
                ''
            );


    if (
        grade === 'A' ||
        grade === 'GRADEA'
    ) {

        return 'A';

    }


    if (
        grade === 'B' ||
        grade === 'GRADEB'
    ) {

        return 'B';

    }


    if (
        grade === 'FAILED' ||
        grade === 'FAIL' ||
        grade === 'REJECTED'
    ) {

        return 'FAILED';

    }


    return '';

};


// ================================================================
// QUALITY SUMMARY NORMALIZATION
// ================================================================

const normalizeQualitySummary = (
    quality = {}
) => {

    const gradeA =
        Number(
            quality.gradeA ??
            quality.grade_a ??
            quality.A ??
            quality.a ??
            quality.gradeACount ??
            0
        );


    const gradeB =
        Number(
            quality.gradeB ??
            quality.grade_b ??
            quality.B ??
            quality.b ??
            quality.gradeBCount ??
            0
        );


    const failed =
        Number(
            quality.failed ??
            quality.qualityFailed ??
            quality.gradeFailed ??
            quality.failedCount ??
            0
        );


    const explicitTotal =
        Number(
            quality.total ??
            quality.totalRecords ??
            quality.totalQualityRecords ??
            0
        );


    const calculatedTotal =
        gradeA +
        gradeB +
        failed;


    return {

        gradeA:
            Number.isFinite(
                gradeA
            )
                ? gradeA
                : 0,

        gradeB:
            Number.isFinite(
                gradeB
            )
                ? gradeB
                : 0,

        failed:
            Number.isFinite(
                failed
            )
                ? failed
                : 0,

        total:
            explicitTotal > 0
                ? explicitTotal
                : calculatedTotal

    };

};


// ================================================================
// SUMMARY RENDERING
// ================================================================

const renderSummary = (
    summary = {}
) => {

    const registeredFarmers =
        getElement(
            'report-registered-farmers'
        );


    const totalProcurement =
        getElement(
            'report-total-procurement'
        );


    const totalTransactions =
        getElement(
            'report-total-transactions'
        );


    const totalPayment =
        getElement(
            'report-total-payment'
        );


    if (registeredFarmers) {

        registeredFarmers.textContent =
            formatNumber(
                summary.totalFarmers ??
                summary.registeredFarmers ??
                0,
                0
            );

    }


    if (totalProcurement) {

        totalProcurement.textContent =
            `${formatNumber(
                summary.totalProcuredQuintals ??
                summary.totalProcurement ??
                0
            )} qtl`;

    }


    if (totalTransactions) {

        totalTransactions.textContent =
            formatNumber(
                summary.completedTransactions ??
                summary.totalTransactions ??
                0,
                0
            );

    }


    if (totalPayment) {

        totalPayment.textContent =
            formatShortCurrency(
                summary.totalPaymentValue ??
                0
            );

    }

};


// ================================================================
// SELECTED CROP
// ================================================================

const getSelectedCrop = () => {

    return (
        getElement(
            'report-crop-filter'
        )?.value ||
        'all'
    )
        .trim()
        .toLowerCase();

};


// ================================================================
// CROP MATCHING
// ================================================================

const matchesSelectedCrop = (
    record,
    selectedCrop
) => {

    if (
        selectedCrop === 'all'
    ) {

        return true;

    }


    const crop =
        String(
            record?.cropType ||
            record?.crop ||
            ''
        )
            .trim()
            .toLowerCase();


    return crop ===
        selectedCrop;

};


// ================================================================
// CROP ANALYTICS
// ================================================================

const getFilteredCropAnalytics = (
    crops = []
) => {

    const selectedCrop =
        getSelectedCrop();


    const records =
        Array.isArray(
            crops
        )
            ? crops
            : [];


    if (
        selectedCrop === 'all'
    ) {

        return records;

    }


    return records.filter(
        crop =>
            matchesSelectedCrop(
                crop,
                selectedCrop
            )
    );

};


const renderCropAnalytics = (
    crops = []
) => {

    const container =
        getElement(
            'crop-analytics-container'
        );


    if (!container) {

        return;

    }


    const filteredCrops =
        getFilteredCropAnalytics(
            crops
        );


    if (
        filteredCrops.length === 0
    ) {

        container.innerHTML = `
            <div class="reports-empty-state">
                No crop procurement data available.
            </div>
        `;

        return;

    }


    container.innerHTML =
        filteredCrops
            .map(
                crop => {

                    return `
                        <div class="report-data-row">

                            <div>

                                <strong>
                                    ${escapeHtml(
                                        crop.cropType ||
                                        crop.crop ||
                                        '—'
                                    )}
                                </strong>

                            </div>


                            <div>
                                ${formatNumber(
                                    crop.quantityQuintals ??
                                    crop.procuredQuintals ??
                                    0
                                )}
                                qtl
                            </div>


                            <div>
                                ${formatNumber(
                                    crop.transactions ??
                                    crop.transactionCount ??
                                    0,
                                    0
                                )}
                                transactions
                            </div>


                            <div>
                                ${formatCurrency(
                                    crop.paymentValue ??
                                    0
                                )}
                            </div>

                        </div>
                    `;

                }
            )
            .join('');

};


// ================================================================
// CENTER ANALYTICS
// ================================================================

const renderCenterAnalytics = (
    centers = []
) => {

    const container =
        getElement(
            'center-analytics-container'
        );


    if (!container) {

        return;

    }


    if (
        !Array.isArray(
            centers
        ) ||
        centers.length === 0
    ) {

        container.innerHTML = `
            <div class="reports-empty-state">
                No mandi center data available.
            </div>
        `;

        return;

    }


    container.innerHTML =
        centers
            .map(
                center => {

                    return `
                        <div class="report-data-row">

                            <div>

                                <strong>
                                    ${escapeHtml(
                                        center.center ||
                                        center.centerId ||
                                        '—'
                                    )}
                                </strong>

                            </div>


                            <div>
                                ${formatNumber(
                                    center.bookedQuintals ??
                                    0
                                )}
                                qtl booked
                            </div>


                            <div>
                                ${formatNumber(
                                    center.procuredQuintals ??
                                    0
                                )}
                                qtl procured
                            </div>


                            <div>
                                ${formatNumber(
                                    center.utilizationPercentage ??
                                    0,
                                    0
                                )}%
                            </div>


                            <div>
                                ${formatCurrency(
                                    center.paymentValue ??
                                    0
                                )}
                            </div>

                        </div>
                    `;

                }
            )
            .join('');

};


// ================================================================
// QUALITY SUMMARY
// ================================================================

const renderQualitySummary = (
    quality = {}
) => {

    const normalized =
        normalizeQualitySummary(
            quality
        );


    setText(
        'report-grade-a',
        formatNumber(
            normalized.gradeA,
            0
        )
    );


    setText(
        'report-grade-b',
        formatNumber(
            normalized.gradeB,
            0
        )
    );


    setText(
        'report-quality-failed',
        formatNumber(
            normalized.failed,
            0
        )
    );


    setText(
        'report-quality-total',
        formatNumber(
            normalized.total,
            0
        )
    );


};


// ================================================================
// TEXT SETTER
// ================================================================

const setText = (
    id,
    value
) => {

    const element =
        getElement(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

};


// ================================================================
// PAYMENT STATUS
// ================================================================

const renderPaymentStatus = (
    payment = {},
    summary = {}
) => {

    setText(
        'report-pending-payments',
        formatNumber(
            payment.pending ??
            0,
            0
        )
    );


    setText(
        'report-pfms-batched',
        formatNumber(
            payment.pfmsBatched ??
            0,
            0
        )
    );


    setText(
        'report-dbt-dispatched',
        formatNumber(
            payment.dbtDispatched ??
            0,
            0
        )
    );


    setText(
        'report-failed-payments',
        formatNumber(
            payment.failed ??
            0,
            0
        )
    );


    setText(
        'report-payment-liability',
        formatCurrency(
            summary.totalPaymentValue ??
            0
        )
    );

};


// ================================================================
// DAILY PERFORMANCE
// ================================================================

const renderDailyPerformance = (
    dailyData = []
) => {

    const tbody =
        getElement(
            'daily-performance-body'
        );


    if (!tbody) {

        return;

    }


    if (
        !Array.isArray(
            dailyData
        ) ||
        dailyData.length === 0
    ) {

        tbody.innerHTML = `
            <tr>

                <td
                    colspan="4"
                    class="reports-empty-cell"
                >
                    No daily performance data available.
                </td>

            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        dailyData
            .map(
                item => {

                    return `
                        <tr>

                            <td>
                                ${escapeHtml(
                                    formatDate(
                                        item.date
                                    )
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    item.transactions ??
                                    0,
                                    0
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    item.quantityQuintals ??
                                    item.procuredQuintals ??
                                    0
                                )}
                                qtl
                            </td>

                            <td>
                                ${formatCurrency(
                                    item.paymentValue ??
                                    0
                                )}
                            </td>

                        </tr>
                    `;

                }
            )
            .join('');

};


// ================================================================
// RECENT ACTIVITY
// ================================================================

const filterRecentActivity =
    (
        activities = []
    ) => {

        const selectedCrop =
            getSelectedCrop();


        if (
            selectedCrop === 'all'
        ) {

            return Array.isArray(
                activities
            )
                ? activities
                : [];

        }


        return (
            Array.isArray(
                activities
            )
                ? activities
                : []
        ).filter(
            activity =>
                matchesSelectedCrop(
                    activity,
                    selectedCrop
                )
        );

    };


const renderRecentActivity = (
    activities = []
) => {

    const tbody =
        getElement(
            'reports-activity-table-body'
        );


    const emptyState =
        getElement(
            'reports-activity-empty-state'
        );


    const activityCount =
        getElement(
            'report-activity-count'
        );


    if (!tbody) {

        return;

    }


    const filteredActivities =
        filterRecentActivity(
            activities
        );


    if (
        filteredActivities.length === 0
    ) {

        tbody.innerHTML =
            '';


        if (emptyState) {

            emptyState.hidden =
                false;

        }


        if (activityCount) {

            activityCount.textContent =
                '0 records';

        }


        return;

    }


    if (emptyState) {

        emptyState.hidden =
            true;

    }


    if (activityCount) {

        activityCount.textContent =
            `${filteredActivities.length} ${
                filteredActivities.length === 1
                    ? 'record'
                    : 'records'
            }`;

    }


    tbody.innerHTML =
        filteredActivities
            .map(
                activity => {

                    const paymentStatus =
                        normalizePaymentStatus(
                            activity
                        );


                    const paymentLabel =
                        getPaymentStatusLabel(
                            activity
                        );


                    const quality =
                        normalizeQualityGrade(
                            activity.qualityGrade ||
                            activity.quality ||
                            activity.grade
                        );


                    return `
                        <tr>

                            <td>

                                <strong>
                                    ${escapeHtml(
                                        activity.tokenId ||
                                        activity.transactionId ||
                                        '—'
                                    )}
                                </strong>

                            </td>


                            <td>

                                <div>
                                    ${escapeHtml(
                                        activity.farmerName ||
                                        '—'
                                    )}
                                </div>

                                <small>
                                    ${escapeHtml(
                                        activity.kccNumber ||
                                        ''
                                    )}
                                </small>

                            </td>


                            <td>
                                ${escapeHtml(
                                    activity.cropType ||
                                    activity.crop ||
                                    '—'
                                )}
                            </td>


                            <td>
                                ${formatNumber(
                                    activity.quantityQuintals ??
                                    activity.procuredQuintals ??
                                    0
                                )}
                                qtl
                            </td>


                            <td>
                                ${escapeHtml(
                                    activity.center ||
                                    activity.centerId ||
                                    '—'
                                )}
                            </td>


                            <td>
                                ${escapeHtml(
                                    quality ||
                                    activity.qualityGrade ||
                                    activity.quality ||
                                    '—'
                                )}
                            </td>


                            <td>

                                <span
                                    class="payment-status-badge ${paymentStatus}"
                                >
                                    ${escapeHtml(
                                        paymentLabel
                                    )}
                                </span>

                            </td>


                            <td>
                                ${escapeHtml(
                                    formatDate(
                                        activity.date ||
                                        activity.timestamp ||
                                        activity.createdAt
                                    )
                                )}
                            </td>

                        </tr>
                    `;

                }
            )
            .join('');

};


// ================================================================
// CENTER FILTER
// ================================================================

const populateCenterFilter = (
    centers = []
) => {

    const select =
        getElement(
            'report-center-filter'
        );


    if (!select) {

        return;

    }


    const currentValue =
        select.value ||
        'all';


    const normalizedCenters =
        Array.isArray(
            centers
        )
            ? centers
            : [];


    select.innerHTML = `
        <option value="all">
            All Centers
        </option>
    `;


    normalizedCenters.forEach(
        center => {

            const centerId =
                center.centerId ||
                center.center;


            if (!centerId) {

                return;

            }


            const option =
                document.createElement(
                    'option'
                );


            option.value =
                centerId;


            option.textContent =
                center.center ||
                center.centerId;


            select.appendChild(
                option
            );

        }
    );


    const optionExists =
        Array.from(
            select.options
        ).some(
            option =>
                option.value ===
                currentValue
        );


    select.value =
        optionExists
            ? currentValue
            : 'all';

};


// ================================================================
// QUERY PARAMETERS
// ================================================================

const buildReportQuery = () => {

    const params =
        new URLSearchParams();


    const dateFilter =
        getElement(
            'report-date-filter'
        );


    const centerFilter =
        getElement(
            'report-center-filter'
        );


    if (
        dateFilter &&
        dateFilter.value &&
        dateFilter.value !== 'all'
    ) {

        params.set(
            'date',
            dateFilter.value
        );

    }


    if (
        centerFilter &&
        centerFilter.value &&
        centerFilter.value !== 'all'
    ) {

        params.set(
            'center',
            centerFilter.value
        );

    }


    const query =
        params.toString();


    return query
        ? `?${query}`
        : '';

};


// ================================================================
// LOADING STATE
// ================================================================

const setLoadingState = (
    loading
) => {

    const refreshButton =
        getElement(
            'refresh-reports-button'
        );


    if (!refreshButton) {

        return;

    }


    refreshButton.disabled =
        loading;


    refreshButton.classList.toggle(
        'loading',
        loading
    );


    const icon =
        refreshButton.querySelector(
            'i'
        );


    if (icon) {

        icon.classList.toggle(
            'fa-spin',
            loading
        );

    }

};


// ================================================================
// CHART STORAGE
// ================================================================

let cropChart =
    null;

let centerChart =
    null;

let qualityChart =
    null;

let dailyChart =
    null;


// ================================================================
// CHART CLEANUP
// ================================================================

const destroyChart = (
    chart
) => {

    if (
        chart
    ) {

        chart.destroy();

    }

};


const destroyCharts = () => {

    destroyChart(
        cropChart
    );

    destroyChart(
        centerChart
    );

    destroyChart(
        qualityChart
    );

    destroyChart(
        dailyChart
    );


    cropChart =
        null;

    centerChart =
        null;

    qualityChart =
        null;

    dailyChart =
        null;

};


// ================================================================
// CROP CHART
// ================================================================

const renderCropChart = (
    crops = []
) => {

    const canvas =
        getElement(
            'crop-analytics-chart'
        );


    if (
        !canvas ||
        typeof Chart ===
            'undefined'
    ) {

        return;

    }


    const filteredCrops =
        getFilteredCropAnalytics(
            crops
        );


    destroyChart(
        cropChart
    );


    if (
        filteredCrops.length === 0
    ) {

        cropChart =
            null;

        return;

    }


    cropChart =
        new Chart(
            canvas,
            {

                type:
                    'bar',

                data: {

                    labels:
                        filteredCrops.map(
                            crop =>
                                crop.cropType ||
                                crop.crop
                        ),

                    datasets: [

                        {

                            label:
                                'Procurement (Qtl)',

                            data:
                                filteredCrops.map(
                                    crop =>
                                        Number(
                                            crop.quantityQuintals ??
                                            crop.procuredQuintals ??
                                            0
                                        )
                                )

                        }

                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {

                            display:
                                true

                        }

                    },

                    scales: {

                        y: {

                            beginAtZero:
                                true

                        }

                    }

                }

            }
        );

};


// ================================================================
// CENTER CHART
// ================================================================

const renderCenterChart = (
    centers = []
) => {

    const canvas =
        getElement(
            'center-analytics-chart'
        );


    if (
        !canvas ||
        typeof Chart ===
            'undefined'
    ) {

        return;

    }


    destroyChart(
        centerChart
    );


    if (
        !Array.isArray(
            centers
        ) ||
        centers.length === 0
    ) {

        centerChart =
            null;

        return;

    }


    centerChart =
        new Chart(
            canvas,
            {

                type:
                    'bar',

                data: {

                    labels:
                        centers.map(
                            center =>
                                center.centerId ||
                                center.center
                        ),

                    datasets: [

                        {

                            label:
                                'Procured Quantity (Qtl)',

                            data:
                                centers.map(
                                    center =>
                                        Number(
                                            center.procuredQuintals ||
                                            0
                                        )
                                )

                        }

                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {

                            display:
                                true

                        }

                    },

                    scales: {

                        y: {

                            beginAtZero:
                                true

                        }

                    }

                }

            }
        );

};


// ================================================================
// QUALITY CHART
// ================================================================

const renderQualityChart = (
    quality = {}
) => {

    const canvas =
        getElement(
            'quality-report-chart'
        );


    if (
        !canvas ||
        typeof Chart ===
            'undefined'
    ) {

        return;

    }


    const normalized =
        normalizeQualitySummary(
            quality
        );


    destroyChart(
        qualityChart
    );


    if (
        normalized.total === 0
    ) {

        qualityChart =
            null;

        return;

    }


    qualityChart =
        new Chart(
            canvas,
            {

                type:
                    'doughnut',

                data: {

                    labels: [

                        'Grade A',

                        'Grade B',

                        'Failed'

                    ],

                    datasets: [

                        {

                            data: [

                                normalized.gradeA,

                                normalized.gradeB,

                                normalized.failed

                            ]

                        }

                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false

                }

            }

        );

};


// ================================================================
// DAILY CHART
// ================================================================

const renderDailyChart = (
    dailyData = []
) => {

    const canvas =
        getElement(
            'daily-report-chart'
        );


    if (
        !canvas ||
        typeof Chart ===
            'undefined'
    ) {

        return;

    }


    destroyChart(
        dailyChart
    );


    if (
        !Array.isArray(
            dailyData
        ) ||
        dailyData.length === 0
    ) {

        dailyChart =
            null;

        return;

    }


    const ordered =
        dailyData
            .slice()
            .sort(
                (a, b) =>
                    new Date(
                        a.date
                    ) -
                    new Date(
                        b.date
                    )
            );


    dailyChart =
        new Chart(
            canvas,
            {

                type:
                    'line',

                data: {

                    labels:
                        ordered.map(
                            item =>
                                formatDate(
                                    item.date
                                )
                        ),

                    datasets: [

                        {

                            label:
                                'Procurement (Qtl)',

                            data:
                                ordered.map(
                                    item =>
                                        Number(
                                            item.quantityQuintals ??
                                            item.procuredQuintals ??
                                            0
                                        )
                                ),

                            tension:
                                0.3,

                            fill:
                                false

                        }

                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {

                            display:
                                true

                        }

                    },

                    scales: {

                        y: {

                            beginAtZero:
                                true

                        }

                    }

                }

            }
        );

};


// ================================================================
// REPORT TYPE
// ================================================================

const applyReportType = () => {

    const reportType =
        getElement(
            'report-type-filter'
        );


    if (!reportType) {

        return;

    }


    const type =
        reportType.value;


    const panels = {

        crop:
            document.querySelector(
                '.reports-crop-panel'
            ),

        center:
            document.querySelector(
                '.reports-center-panel'
            ),

        payment:
            document.querySelector(
                '.reports-payment-panel'
            ),

        quality:
            document.querySelector(
                '.reports-quality-panel'
            ),

        daily:
            document.querySelector(
                '.reports-daily-panel'
            ),

        activity:
            document.querySelector(
                '.reports-activity-panel'
            )

    };


    Object.values(
        panels
    ).forEach(
        panel => {

            if (panel) {

                panel.style.display =
                    '';

            }

        }
    );


    if (
        type ===
        'crop'
    ) {

        hidePanel(
            panels.center
        );

        hidePanel(
            panels.payment
        );

        hidePanel(
            panels.quality
        );

    }


    if (
        type ===
        'center'
    ) {

        hidePanel(
            panels.crop
        );

        hidePanel(
            panels.payment
        );

        hidePanel(
            panels.quality
        );

    }


    if (
        type ===
        'payment'
    ) {

        hidePanel(
            panels.crop
        );

        hidePanel(
            panels.center
        );

        hidePanel(
            panels.quality
        );

    }


    if (
        type ===
        'quality'
    ) {

        hidePanel(
            panels.crop
        );

        hidePanel(
            panels.center
        );

        hidePanel(
            panels.payment
        );

    }

};


const hidePanel = (
    panel
) => {

    if (panel) {

        panel.style.display =
            'none';

    }

};


// ================================================================
// CSV EXPORT
// ================================================================

const csvEscape = (
    value
) => {

    const text =
        String(
            value ?? ''
        );


    return `"${text.replace(
        /"/g,
        '""'
    )}"`;

};


const exportReportCSV = () => {

    if (!latestReportData) {

        alert(
            'No report data is available to export yet.'
        );

        return;

    }


    const activities =
        filterRecentActivity(
            latestReportData.recentActivity || []
        );


    if (
        activities.length === 0
    ) {

        alert(
            'There are no procurement records available for export.'
        );

        return;

    }


    const headers = [

        'Token',

        'Farmer',

        'KCC Number',

        'Crop',

        'Quantity (Qtl)',

        'Center',

        'Quality',

        'Payment Status',

        'Payment Amount',

        'Date'

    ];


    const rows =
        activities.map(
            activity => [

                activity.tokenId ||
                activity.transactionId ||
                '',

                activity.farmerName ||
                '',

                activity.kccNumber ||
                '',

                activity.cropType ||
                activity.crop ||
                '',

                Number(
                    activity.quantityQuintals ??
                    activity.procuredQuintals ??
                    0
                ).toFixed(2),

                activity.center ||
                activity.centerId ||
                '',

                activity.qualityGrade ||
                activity.quality ||
                activity.grade ||
                '',

                getPaymentStatusLabel(
                    activity
                ),

                Number(
                    activity.payoutAmount ??
                    activity.payableAmount ??
                    activity.paymentAmount ??
                    0
                ).toFixed(2),

                activity.date ||
                activity.timestamp ||
                activity.createdAt ||
                ''

            ]
        );


    const csvContent =
        [
            headers,
            ...rows
        ]
            .map(
                row =>
                    row
                        .map(
                            csvEscape
                        )
                        .join(',')
            )
            .join('\n');


    const blob =
        new Blob(
            [csvContent],
            {
                type:
                    'text/csv;charset=utf-8;'
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            'a'
        );


    link.href =
        url;


    link.download =
        `kisan-setu-report-${getLocalDateString(
            new Date()
        )}.csv`;


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    URL.revokeObjectURL(
        url
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
// LATEST REPORT DATA
// ================================================================

let latestReportData =
    null;


// ================================================================
// LOAD REPORT DATA
// ================================================================

const loadReportData = async () => {

    if (
        !isAdminAuthenticated()
    ) {

        redirectToLogin();

        return;

    }


    setLoadingState(
        true
    );


    setConnectionStatus(
        false,
        'Connecting...'
    );


    try {

        const query =
            buildReportQuery();


        const data =
            await adminFetch(
                `/api/admin/reports${query}`
            );


        if (
            !data ||
            data.success !== true
        ) {

            throw new Error(
                data?.message ||
                'Unable to load reports.'
            );

        }


        latestReportData =
            data;


        // ----------------------------------------------------------
        // SUMMARY
        // ----------------------------------------------------------

        renderSummary(
            data.summary ||
            {}
        );


        // ----------------------------------------------------------
        // CROP
        // ----------------------------------------------------------

        renderCropAnalytics(
            data.cropAnalytics ||
            []
        );


        renderCropChart(
            data.cropAnalytics ||
            []
        );


        // ----------------------------------------------------------
        // CENTER
        // ----------------------------------------------------------

        populateCenterFilter(
            data.centers ||
            []
        );


        renderCenterAnalytics(
            data.centers ||
            []
        );


        renderCenterChart(
            data.centers ||
            []
        );


        // ----------------------------------------------------------
        // QUALITY
        // ----------------------------------------------------------

        const normalizedQuality =
            normalizeQualitySummary(
                data.qualitySummary ||
                {}
            );


        renderQualitySummary(
            normalizedQuality
        );


        renderQualityChart(
            normalizedQuality
        );


        // ----------------------------------------------------------
        // PAYMENT
        // ----------------------------------------------------------

        renderPaymentStatus(
            data.paymentStatusSummary ||
            {},
            data.summary ||
            {}
        );


        // ----------------------------------------------------------
        // DAILY PERFORMANCE
        // ----------------------------------------------------------

        renderDailyPerformance(
            data.dailyPerformance ||
            []
        );


        renderDailyChart(
            data.dailyPerformance ||
            []
        );


        // ----------------------------------------------------------
        // RECENT ACTIVITY
        // ----------------------------------------------------------

        renderRecentActivity(
            data.recentActivity ||
            []
        );


        // ----------------------------------------------------------
        // REPORT TYPE
        // ----------------------------------------------------------

        applyReportType();


        // ----------------------------------------------------------
        // CONNECTION
        // ----------------------------------------------------------

        setConnectionStatus(
            true,
            'Connected'
        );


        updateLastUpdated(
            data.generatedAt ||
            new Date().toISOString()
        );


    } catch (error) {

        console.error(
            '[A7 Reports Error]',
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
            'Connection Error'
        );


        updateLastUpdated(
            null
        );


        const activityBody =
            getElement(
                'reports-activity-table-body'
            );


        if (activityBody) {

            activityBody.innerHTML = `
                <tr>

                    <td
                        colspan="8"
                        class="reports-error-cell"
                    >

                        Unable to load report data.

                        <br>

                        <small>
                            ${escapeHtml(
                                error.message ||
                                'Please verify that the Kisan Setu backend is running.'
                            )}
                        </small>

                    </td>

                </tr>
            `;

        }


        const activityEmptyState =
            getElement(
                'reports-activity-empty-state'
            );


        if (activityEmptyState) {

            activityEmptyState.hidden =
                true;

        }

    } finally {

        setLoadingState(
            false
        );

    }

};


// ================================================================
// REFRESH
// ================================================================

const refreshReports = () => {

    loadReportData();

};


// ================================================================
// EVENT LISTENERS
// ================================================================

const setupEventListeners = () => {

    const refreshButton =
        getElement(
            'refresh-reports-button'
        );


    if (refreshButton) {

        refreshButton.addEventListener(
            'click',
            refreshReports
        );

    }


    const dateFilter =
        getElement(
            'report-date-filter'
        );


    if (dateFilter) {

        dateFilter.addEventListener(
            'change',
            loadReportData
        );

    }


    const centerFilter =
        getElement(
            'report-center-filter'
        );


    if (centerFilter) {

        centerFilter.addEventListener(
            'change',
            loadReportData
        );

    }


    const cropFilter =
        getElement(
            'report-crop-filter'
        );


    if (cropFilter) {

        cropFilter.addEventListener(
            'change',
            () => {

                if (!latestReportData) {

                    return;

                }


                renderCropAnalytics(
                    latestReportData.cropAnalytics ||
                    []
                );


                renderCropChart(
                    latestReportData.cropAnalytics ||
                    []
                );


                renderRecentActivity(
                    latestReportData.recentActivity ||
                    []
                );


                applyReportType();

            }
        );

    }


    const reportTypeFilter =
        getElement(
            'report-type-filter'
        );


    if (reportTypeFilter) {

        reportTypeFilter.addEventListener(
            'change',
            applyReportType
        );

    }


    const exportButton =
        getElement(
            'export-report-button'
        );


    if (exportButton) {

        exportButton.addEventListener(
            'click',
            exportReportCSV
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

                        'x-admin-session':
                            sessionId

                    }

                }
            );

        }

    } catch (error) {

        console.warn(
            '[A7 Logout Error]',
            error
        );

    } finally {

        clearAdminSession();

        window.location.href =
            'admin.html';

    }

};


// ================================================================
// AUTO REFRESH
// ================================================================

const AUTO_REFRESH_INTERVAL =
    30000;


let autoRefreshTimer =
    null;


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

                    loadReportData();

                } else {

                    clearInterval(
                        autoRefreshTimer
                    );

                }

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

        }


        destroyCharts();

    }
);


// ================================================================
// GLOBAL FUNCTIONS
// ================================================================

window.loadReportData =
    loadReportData;

window.refreshReports =
    refreshReports;

window.exportReportCSV =
    exportReportCSV;

window.logoutAdmin =
    logoutAdmin;


// ================================================================
// INITIALIZATION
// ================================================================

const initReportsPage = async () => {

    if (
        !isAdminAuthenticated()
    ) {

        redirectToLogin();

        return;

    }


    loadAdminUser();

    setupEventListeners();

    await loadReportData();

    startAutoRefresh();

};


document.addEventListener(
    'DOMContentLoaded',
    initReportsPage
);