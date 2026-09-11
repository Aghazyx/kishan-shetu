// ================================================================
// KISAN SETU ADMIN DASHBOARD
// A2 • Dashboard Overview
// ================================================================

const API_BASE_URL = 'http://localhost:5050';


// ================================================================
// AUTHENTICATION
// ================================================================

function getAdminSession() {
    return sessionStorage.getItem('kisanSetuAdminSession');
}


function requireAdminSession() {

    const session = getAdminSession();

    if (!session) {

        window.location.href = 'admin.html';

        return null;

    }

    return session;

}


// ================================================================
// DOM HELPERS
// ================================================================

function getElement(id) {
    return document.getElementById(id);
}


function setText(id, value) {

    const element = getElement(id);

    if (element) {
        element.textContent = value;
    }

}


// ================================================================
// NUMBER / CURRENCY FORMATTING
// ================================================================

function formatNumber(value) {

    const number = Number(value || 0);

    return number.toLocaleString('en-IN', {
        maximumFractionDigits: 2
    });

}


function formatCurrency(value) {

    const number = Number(value || 0);

    return number.toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    });

}


// ================================================================
// DATE FORMATTING
// ================================================================

function formatDashboardDate(dateString) {

    if (!dateString) {
        return 'Date unavailable';
    }

    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

}


// ================================================================
// DASHBOARD DATA FETCH
// ================================================================

async function fetchDashboardData() {

    const session = requireAdminSession();

    if (!session) {
        return;
    }


    try {

        updateSystemStatus(
            'loading',
            'Connecting to Kisan Setu backend...'
        );


        const response = await fetch(
            `${API_BASE_URL}/api/admin/dashboard`,
            {
                method: 'GET',

                headers: {
                    'x-admin-session': session
                }
            }
        );


        if (response.status === 401) {

            sessionStorage.removeItem(
                'kisanSetuAdminSession'
            );

            sessionStorage.removeItem(
                'kisanSetuAdminAuthenticated'
            );

            window.location.href = 'admin.html';

            return;
        }


        const data = await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                'Unable to load dashboard data.'
            );

        }


        renderDashboard(data);


        updateSystemStatus(
            'online',
            `Backend connected • Updated ${new Date().toLocaleTimeString('en-IN')}`
        );


    } catch (error) {

        console.error(
            '[Admin Dashboard Error]',
            error
        );


        updateSystemStatus(
            'error',
            'Unable to connect to Kisan Setu backend.'
        );


        showDashboardError(
            error.message
        );

    }

}


// ================================================================
// RENDER COMPLETE DASHBOARD
// ================================================================

function renderDashboard(data) {

    const metrics =
        data.metrics || {};


    // ------------------------------------------------------------
    // DATE
    // ------------------------------------------------------------

    setText(
        'dashboard-date',
        formatDashboardDate(data.date)
    );


    // ------------------------------------------------------------
    // KPI METRICS
    // ------------------------------------------------------------

    setText(
        'registered-farmers',
        formatNumber(
            metrics.registeredFarmers
        )
    );


    setText(
        'today-bookings',
        formatNumber(
            metrics.todayBookings
        )
    );


    setText(
        'active-queue',
        formatNumber(
            metrics.activeQueue
        )
    );


    setText(
        'today-procurement',
        `${formatNumber(
            metrics.todayProcurementQuintals
        )} qtl`
    );


    setText(
        'today-payments',
        formatCurrency(
            metrics.todayPayments
        )
    );


    setText(
        'completed-transactions',
        formatNumber(
            metrics.completedTransactions
        )
    );


    // ------------------------------------------------------------
    // CROP BREAKDOWN
    // ------------------------------------------------------------

    renderCropBreakdown(
        data.cropBreakdown || {}
    );


    // ------------------------------------------------------------
    // QUALITY SUMMARY
    // ------------------------------------------------------------

    renderQualitySummary(
        data.qualitySummary || {}
    );


    // ------------------------------------------------------------
    // CENTER STATUS
    // ------------------------------------------------------------

    renderCenterStatus(
        data.centers || []
    );


    // ------------------------------------------------------------
    // RECENT TRANSACTIONS
    // ------------------------------------------------------------

    renderRecentTransactions(
        data.recentTransactions || []
    );

}


// ================================================================
// CROP BREAKDOWN
// ================================================================

function renderCropBreakdown(cropBreakdown) {

    const container =
        getElement('crop-breakdown');


    if (!container) {
        return;
    }


    const crops =
        Object.entries(
            cropBreakdown
        );


    if (crops.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-wheat-awn"></i>
                <p>No procurement recorded today.</p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        crops.map(
            ([crop, data]) => {

                const cropName =
                    crop.charAt(0).toUpperCase() +
                    crop.slice(1);


                return `
                    <div class="crop-row">

                        <div class="crop-info">

                            <span class="crop-name">
                                ${escapeHtml(cropName)}
                            </span>

                            <span class="crop-transactions">
                                ${formatNumber(
                                    data.transactions
                                )} transaction(s)
                            </span>

                        </div>


                        <div class="crop-quantity">

                            <strong>
                                ${formatNumber(
                                    data.quantityQuintals
                                )}
                            </strong>

                            <span>
                                qtl
                            </span>

                        </div>


                        <div class="crop-amount">

                            ${formatCurrency(
                                data.amount
                            )}

                        </div>

                    </div>
                `;

            }
        )
        .join('');

}


// ================================================================
// QUALITY SUMMARY
// ================================================================

function renderQualitySummary(summary) {

    setText(
        'grade-a',
        formatNumber(
            summary.gradeA
        )
    );


    setText(
        'grade-b',
        formatNumber(
            summary.gradeB
        )
    );


    setText(
        'grade-failed',
        formatNumber(
            summary.failed
        )
    );

}


// ================================================================
// CENTER STATUS
// ================================================================

function renderCenterStatus(centers) {

    const container =
        getElement('center-status');


    if (!container) {
        return;
    }


    if (centers.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-warehouse"></i>
                <p>No center booking data available today.</p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        centers.map(
            center => {

                const utilization =
                    Number(
                        center.utilizationPercentage || 0
                    );


                return `
                    <div class="center-row">

                        <div class="center-main">

                            <div class="center-title">

                                <strong>
                                    ${escapeHtml(
                                        center.center ||
                                        center.centerId ||
                                        'Mandi Center'
                                    )}
                                </strong>

                                <span>
                                    ${escapeHtml(
                                        center.centerId ||
                                        ''
                                    )}
                                </span>

                            </div>


                            <div class="capacity-text">

                                ${formatNumber(
                                    center.bookedQuintals
                                )}
                                /
                                ${formatNumber(
                                    center.capacityQuintals
                                )}
                                qtl booked

                            </div>

                        </div>


                        <div class="center-progress">

                            <div class="progress-track">

                                <div
                                    class="progress-fill"
                                    style="width: ${Math.min(
                                        utilization,
                                        100
                                    )}%"
                                ></div>

                            </div>


                            <span>
                                ${formatNumber(
                                    utilization
                                )}%
                            </span>

                        </div>


                        <div class="center-stats">

                            <span>
                                <strong>
                                    ${formatNumber(
                                        center.activeTokens
                                    )}
                                </strong>
                                active
                            </span>

                            <span>
                                <strong>
                                    ${formatNumber(
                                        center.completedTokens
                                    )}
                                </strong>
                                completed
                            </span>

                        </div>

                    </div>
                `;

            }
        )
        .join('');

}


// ================================================================
// RECENT TRANSACTIONS
// ================================================================

function renderRecentTransactions(transactions) {

    const tbody =
        getElement('transactions-body');


    if (!tbody) {
        return;
    }


    if (transactions.length === 0) {

        tbody.innerHTML = `
            <tr>

                <td
                    colspan="7"
                    class="table-empty"
                >

                    No transactions available.

                </td>

            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        transactions.map(
            transaction => {

                const statusClass =
                    getStatusClass(
                        transaction.status
                    );


                const payment =
                    transaction.payoutAmount > 0
                        ? formatCurrency(
                            transaction.payoutAmount
                        )
                        : 'Pending';


                return `
                    <tr>

                        <td>

                            <span class="token-badge">

                                ${escapeHtml(
                                    transaction.tokenId ||
                                    'N/A'
                                )}

                            </span>

                        </td>


                        <td>

                            <div class="farmer-cell">

                                <strong>
                                    ${escapeHtml(
                                        transaction.farmerName ||
                                        'Unknown Farmer'
                                    )}
                                </strong>

                                <small>
                                    ${escapeHtml(
                                        transaction.kccNumber ||
                                        ''
                                    )}
                                </small>

                            </div>

                        </td>


                        <td>

                            ${escapeHtml(
                                capitalize(
                                    transaction.cropType ||
                                    'Unknown'
                                )
                            )}

                        </td>


                        <td>

                            <div class="quantity-cell">

                                <strong>
                                    ${formatNumber(
                                        transaction.actualQuantityQuintals ??
                                        transaction.bookedQuantityQuintals
                                    )}
                                </strong>

                                <small>
                                    qtl
                                </small>

                            </div>

                        </td>


                        <td>

                            ${escapeHtml(
                                transaction.center ||
                                'Mandi Center'
                            )}

                        </td>


                        <td>

                            <span class="status-badge ${statusClass}">

                                ${escapeHtml(
                                    transaction.status ||
                                    'Unknown'
                                )}

                            </span>

                        </td>


                        <td>

                            <strong class="payment-value">

                                ${payment}

                            </strong>

                        </td>

                    </tr>
                `;

            }
        )
        .join('');

}


// ================================================================
// STATUS CLASS
// ================================================================

function getStatusClass(status) {

    const normalized =
        String(
            status || ''
        )
        .toLowerCase();


    if (
        normalized.includes('approved') ||
        normalized.includes('completed')
    ) {

        return 'status-success';

    }


    if (
        normalized.includes('queue') ||
        normalized.includes('scheduled') ||
        normalized.includes('weighbridge')
    ) {

        return 'status-active';

    }


    if (
        normalized.includes('cancel')
    ) {

        return 'status-danger';

    }


    return 'status-pending';

}


// ================================================================
// SYSTEM STATUS
// ================================================================

function updateSystemStatus(
    type,
    message
) {

    const indicator =
        getElement(
            'system-status-indicator'
        );


    const text =
        getElement(
            'system-status-text'
        );


    if (indicator) {

        indicator.className =
            `status-dot status-${type}`;

    }


    if (text) {

        text.textContent =
            message;

    }

}


// ================================================================
// ERROR DISPLAY
// ================================================================

function showDashboardError(message) {

    const containers = [

        'crop-breakdown',
        'center-status'

    ];


    containers.forEach(
        id => {

            const element =
                getElement(id);


            if (element) {

                element.innerHTML = `
                    <div class="error-state">

                        <i class="fa-solid fa-triangle-exclamation"></i>

                        <p>
                            ${escapeHtml(
                                message ||
                                'Unable to load data.'
                            )}
                        </p>

                    </div>
                `;

            }

        }
    );


    const tbody =
        getElement(
            'transactions-body'
        );


    if (tbody) {

        tbody.innerHTML = `
            <tr>

                <td
                    colspan="7"
                    class="table-error"
                >

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    Unable to load transactions.

                </td>

            </tr>
        `;

    }

}


// ================================================================
// HTML SAFETY
// ================================================================

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


function capitalize(value) {

    const text =
        String(
            value || ''
        );


    return text.charAt(0).toUpperCase() +
        text.slice(1);

}


// ================================================================
// LOGOUT
// ================================================================

async function logoutAdmin() {

    const session =
        getAdminSession();


    try {

        if (session) {

            await fetch(
                `${API_BASE_URL}/api/admin/logout`,
                {
                    method: 'POST',

                    headers: {
                        'x-admin-session': session
                    }
                }
            );

        }

    } catch (error) {

        console.error(
            '[Admin Logout Error]',
            error
        );

    } finally {

        sessionStorage.removeItem(
            'kisanSetuAdminSession'
        );

        sessionStorage.removeItem(
            'kisanSetuAdminAuthenticated'
        );

        sessionStorage.removeItem(
            'kisanSetuAdminUser'
        );


        window.location.href =
            'admin.html';

    }

}


// ================================================================
// EVENT LISTENERS
// ================================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        // --------------------------------------------------------
        // AUTH CHECK
        // --------------------------------------------------------

        const session =
            requireAdminSession();


        if (!session) {
            return;
        }


        // --------------------------------------------------------
        // ADMIN USER
        // --------------------------------------------------------

        const storedUser =
            sessionStorage.getItem(
                'kisanSetuAdminUser'
            );


        if (storedUser) {

            try {

                const user =
                    JSON.parse(
                        storedUser
                    );


                setText(
                    'admin-user-name',
                    user.username ||
                    'Administrator'
                );

            } catch (error) {

                console.warn(
                    'Unable to parse admin user session.'
                );

            }

        }


        // --------------------------------------------------------
        // LOGOUT
        // --------------------------------------------------------

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


        // --------------------------------------------------------
        // REFRESH
        // --------------------------------------------------------

        const refreshButton =
            getElement(
                'refresh-dashboard'
            );


        if (refreshButton) {

            refreshButton.addEventListener(
                'click',
                () => {

                    fetchDashboardData();

                }
            );

        }


        // --------------------------------------------------------
        // INITIAL LOAD
        // --------------------------------------------------------

        fetchDashboardData();

    }
);