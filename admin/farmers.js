
(function () {
    "use strict";

    // ================================================================
    // KISAN SETU ADMIN PORTAL
    // A3 • FARMER MANAGEMENT
    // ================================================================

    const API_BASE_URL =
        "http://localhost:5050";

    let allFarmers = [];

    let searchTimeout = null;

    let farmerRequestController = null;

    let farmerRequestSequence = 0;

    let farmersPageInitialized = false;


    // ================================================================
    // STORAGE / SESSION
    // ================================================================

    function getAdminSession() {

        return (
            sessionStorage.getItem(
                "kisanSetuAdminSession"
            ) ||
            localStorage.getItem(
                "kisanSetuAdminSession"
            ) ||
            ""
        );
    }


    function isAdminAuthenticated() {

        const authenticated =
            sessionStorage.getItem(
                "kisanSetuAdminAuthenticated"
            ) === "true";

        const session =
            getAdminSession();

        return (
            authenticated &&
            Boolean(session)
        );
    }


    function handleSessionExpired() {

        sessionStorage.removeItem(
            "kisanSetuAdminAuthenticated"
        );

        sessionStorage.removeItem(
            "kisanSetuAdminUser"
        );

        sessionStorage.removeItem(
            "kisanSetuAdminSession"
        );

        localStorage.removeItem(
            "kisanSetuAdminAuthenticated"
        );

        localStorage.removeItem(
            "kisanSetuAdminUser"
        );

        localStorage.removeItem(
            "kisanSetuAdminSession"
        );

        window.location.href =
            "admin.html";
    }


    // ================================================================
    // DOM HELPERS
    // ================================================================

    function getElement() {

        const ids =
            Array.from(
                arguments
            );

        for (
            const id of ids
        ) {

            const element =
                document.getElementById(
                    id
                );

            if (element) {
                return element;
            }
        }

        return null;
    }


    function setText(
        element,
        value
    ) {

        if (element) {
            element.textContent =
                value;
        }
    }


    // ================================================================
    // PAGE ELEMENTS
    // ================================================================

    const farmerSearchInput =
        getElement(
            "farmer-search-input",
            "farmer-search",
            "search-farmers",
            "farmerSearch",
            "searchInput"
        );


    const farmerTableBody =
        getElement(
            "farmer-table-body",
            "farmers-table-body",
            "farmerTableBody",
            "farmersTableBody"
        );


    const totalFarmersElement =
        getElement(
            "total-farmers",
            "totalFarmers",
            "farmer-count"
        );


    const activeBookingsElement =
        getElement(
            "active-bookings",
            "active-farmers",
            "activeFarmers"
        );


    const totalProcurementElement =
        getElement(
            "total-procurement",
            "totalProcurement"
        );


    const totalPayoutElement =
        getElement(
            "total-payout",
            "totalPayout"
        );


    const pageMessage =
        getElement(
            "farmer-status-message",
            "farmers-message",
            "farmer-message",
            "page-message"
        );


    const loadingElement =
        getElement(
            "farmer-loading"
        );


    const emptyStateElement =
        getElement(
            "farmer-empty-state"
        );


    const tableContainerElement =
        getElement(
            "farmer-table-container"
        );


    // ================================================================
    // FORMATTERS
    // ================================================================

    function formatNumber(
        value
    ) {

        const number =
            Number(value);

        return (
            Number.isFinite(number)
                ? number
                : 0
        ).toLocaleString(
            "en-IN",
            {
                maximumFractionDigits:
                    2
            }
        );
    }


    function formatCurrency(
        value
    ) {

        const number =
            Number(value);

        return `₹${(
            Number.isFinite(number)
                ? number
                : 0
        ).toLocaleString(
            "en-IN",
            {
                maximumFractionDigits:
                    2
            }
        )}`;
    }


    function formatDate(
        value
    ) {

        if (!value) {
            return "—";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return String(value);
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric"
            }
        );
    }


    function formatCrop(
        value
    ) {

        if (!value) {
            return "—";
        }

        const text =
            String(value);

        return (
            text.charAt(0).toUpperCase() +
            text.slice(1).toLowerCase()
        );
    }


    function escapeHTML(
        value
    ) {

        return String(
            value ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }


    // ================================================================
    // STATUS
    // ================================================================

    function getFarmerStatus(
        farmer
    ) {

        const activeBookings =
            Number(
                farmer?.activeBookings || 0
            );

        const completedTransactions =
            Number(
                farmer?.completedTransactions || 0
            );


        if (
            activeBookings > 0
        ) {

            return {
                label:
                    "Active",

                className:
                    "status-active"
            };
        }


        if (
            completedTransactions > 0
        ) {

            return {
                label:
                    "Completed",

                className:
                    "status-completed"
            };
        }


        return {
            label:
                "Registered",

            className:
                "status-registered"
        };
    }


    // ================================================================
    // PAGE MESSAGE
    // ================================================================

    function showMessage(
        message,
        type = "info"
    ) {

        if (!pageMessage) {
            return;
        }

        pageMessage.hidden =
            false;

        pageMessage.textContent =
            message;

        pageMessage.className =
            `farmer-status-message ${type}`;
    }


    function hideMessage() {

        if (!pageMessage) {
            return;
        }

        pageMessage.hidden =
            true;

        pageMessage.textContent =
            "";

        pageMessage.className =
            "farmer-status-message";
    }


    // ================================================================
    // LOADING STATE
    // ================================================================

    function setLoadingState(
        loading
    ) {

        if (loadingElement) {

            loadingElement.hidden =
                !loading;

            loadingElement.style.display =
                loading
                    ? "flex"
                    : "none";
        }
    }


    function setEmptyState(
        empty
    ) {

        if (emptyStateElement) {

            emptyStateElement.hidden =
                !empty;

            emptyStateElement.style.display =
                empty
                    ? ""
                    : "none";
        }


        if (tableContainerElement) {

            tableContainerElement.hidden =
                empty;

            tableContainerElement.style.display =
                empty
                    ? "none"
                    : "";
        }
    }


    // ================================================================
    // SUMMARY
    // ================================================================

    function renderSummary(
        data = {}
    ) {

        const farmers =
            Array.isArray(
                allFarmers
            )
                ? allFarmers
                : [];


        const activeBookings =
            farmers.reduce(
                (
                    total,
                    farmer
                ) =>
                    total +
                    Number(
                        farmer.activeBookings ||
                        0
                    ),
                0
            );


        const totalProcurement =
            farmers.reduce(
                (
                    total,
                    farmer
                ) =>
                    total +
                    Number(
                        farmer.totalProcuredQuintals ||
                        0
                    ),
                0
            );


        const totalPayout =
            farmers.reduce(
                (
                    total,
                    farmer
                ) =>
                    total +
                    Number(
                        farmer.totalPayout ||
                        0
                    ),
                0
            );


        const totalFarmerCount =
            data.totalRegisteredFarmers ??
            data.totalFarmers ??
            farmers.length;


        setText(
            totalFarmersElement,
            formatNumber(
                totalFarmerCount
            )
        );


        setText(
            activeBookingsElement,
            formatNumber(
                activeBookings
            )
        );


        setText(
            totalProcurementElement,
            `${formatNumber(
                totalProcurement
            )} qtl`
        );


        setText(
            totalPayoutElement,
            formatCurrency(
                totalPayout
            )
        );
    }


    // ================================================================
    // LOAD FARMERS
    // ================================================================

    async function loadFarmers(
        search = ""
    ) {

        if (
            !isAdminAuthenticated()
        ) {

            handleSessionExpired();

            return;
        }


        if (
            farmerRequestController
        ) {

            farmerRequestController.abort();
        }


        farmerRequestController =
            new AbortController();


        const requestController =
            farmerRequestController;


        const requestSequence =
            ++farmerRequestSequence;


        setLoadingState(
            true
        );


        hideMessage();


        const session =
            getAdminSession();


        const trimmedSearch =
            String(
                search || ""
            ).trim();


        const query =
            trimmedSearch
                ? `?search=${encodeURIComponent(
                    trimmedSearch
                )}`
                : "";


        try {

            const timeoutController =
                new AbortController();


            const timeout =
                setTimeout(
                    function () {

                        timeoutController.abort();

                    },
                    10000
                );


            const combinedSignal =
                timeoutController.signal;


            const response =
                await fetch(
                    `${API_BASE_URL}/api/admin/farmers${query}`,
                    {
                        method:
                            "GET",

                        headers: {
                            "x-admin-session":
                                session,

                            "Accept":
                                "application/json"
                        },

                        signal:
                            combinedSignal
                    }
                );


            clearTimeout(
                timeout
            );


            if (
                requestSequence !==
                farmerRequestSequence
            ) {

                return;
            }


            let data =
                {};


            try {

                data =
                    await response.json();

            } catch {

                throw new Error(
                    "The administration backend returned an invalid response."
                );
            }


            if (
                response.status === 401 ||
                response.status === 403 ||
                data.authenticated === false
            ) {

                handleSessionExpired();

                return;
            }


            if (
                !response.ok ||
                data.success !== true
            ) {

                throw new Error(
                    data.message ||
                    "Unable to load farmer records."
                );
            }


            allFarmers =
                Array.isArray(
                    data.farmers
                )
                    ? data.farmers
                    : [];


            renderSummary(
                data
            );


            renderFarmers(
                allFarmers
            );


            showMessage(
                `${allFarmers.length} farmer record${
                    allFarmers.length === 1
                        ? ""
                        : "s"
                } loaded.`,
                "success"
            );


        } catch (error) {

            if (
                error.name ===
                "AbortError"
            ) {

                /*
                 * Abort can mean either a search was replaced
                 * or the backend timed out.
                 */

                if (
                    requestSequence !==
                    farmerRequestSequence
                ) {

                    return;
                }


                allFarmers =
                    [];


                renderSummary(
                    {
                        totalRegisteredFarmers:
                            0
                    }
                );


                renderFarmers(
                    []
                );


                showMessage(
                    "The farmer records request timed out. Check that the Kisan Setu backend is running on port 5050.",
                    "error"
                );


                return;
            }


            if (
                requestSequence !==
                farmerRequestSequence
            ) {

                return;
            }


            console.error(
                "[A3 Farmer Management Error]",
                error
            );


            allFarmers =
                [];


            renderSummary(
                {
                    totalRegisteredFarmers:
                        0
                }
            );


            renderFarmers(
                []
            );


            showMessage(
                error.message ||
                "Unable to connect to the administration backend.",
                "error"
            );


        } finally {

            if (
                requestSequence ===
                farmerRequestSequence
            ) {

                setLoadingState(
                    false
                );


                if (
                    farmerRequestController ===
                    requestController
                ) {

                    farmerRequestController =
                        null;
                }
            }
        }
    }


    // ================================================================
    // RENDER FARMERS
    // ================================================================

    function renderFarmers(
        farmers = []
    ) {

        if (!farmerTableBody) {

            console.warn(
                "[A3] Farmer table body not found."
            );

            return;
        }


        farmerTableBody.innerHTML =
            "";


        if (
            !Array.isArray(farmers) ||
            !farmers.length
        ) {

            setEmptyState(
                true
            );

            return;
        }


        setEmptyState(
            false
        );


        farmers.forEach(
            function (
                farmer
            ) {

                const status =
                    getFarmerStatus(
                        farmer
                    );


                const row =
                    document.createElement(
                        "tr"
                    );


                const farmerInitial =
                    String(
                        farmer.name ||
                        "F"
                    )
                        .trim()
                        .charAt(0)
                        .toUpperCase();


                const location =
                    farmer.district
                        ? `${farmer.district}${
                            farmer.state
                                ? `, ${farmer.state}`
                                : ""
                        }`
                        : (
                            farmer.state ||
                            "—"
                        );


                row.innerHTML =
                    `
                    <td>
                        <div class="farmer-identity">

                            <div class="farmer-avatar">
                                ${escapeHTML(
                                    farmerInitial
                                )}
                            </div>

                            <div>
                                <div class="farmer-name">
                                    ${escapeHTML(
                                        farmer.name ||
                                        "Unknown Farmer"
                                    )}
                                </div>

                                <div class="farmer-phone">
                                    ${escapeHTML(
                                        farmer.phone ||
                                        "Phone unavailable"
                                    )}
                                </div>
                            </div>

                        </div>
                    </td>

                    <td>
                        <span class="farmer-kcc">
                            ${escapeHTML(
                                farmer.kccNumber ||
                                "—"
                            )}
                        </span>
                    </td>

                    <td>
                        <div class="farmer-location">

                            <strong>
                                ${escapeHTML(
                                    location
                                )}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    farmer.mandi ||
                                    "Mandi not assigned"
                                )}
                            </span>

                        </div>
                    </td>

                    <td>
                        <span class="farmer-number">
                            ${formatNumber(
                                farmer.landHoldingAcres
                            )}
                            acres
                        </span>
                    </td>

                    <td>
                        <span class="farmer-number">
                            ${formatNumber(
                                farmer.totalBookings
                            )}
                        </span>
                    </td>

                    <td>
                        <span class="farmer-number">
                            ${formatNumber(
                                farmer.totalProcuredQuintals
                            )}
                            qtl
                        </span>
                    </td>

                    <td>
                        <span class="farmer-number">
                            ${formatCurrency(
                                farmer.totalPayout
                            )}
                        </span>
                    </td>

                    <td>
                        <span class="farmer-status-badge">
                            <i class="fa-solid fa-circle"></i>
                            ${escapeHTML(
                                status.label
                            )}
                        </span>
                    </td>

                    <td>
                        <button
                            type="button"
                            class="farmer-view-button"
                            data-farmer-id="${escapeHTML(
                                farmer.id ||
                                farmer.farmerId ||
                                ""
                            )}"
                        >
                            <i class="fa-solid fa-eye"></i>
                            View
                        </button>
                    </td>
                    `;


                farmerTableBody.appendChild(
                    row
                );
            }
        );


        attachFarmerButtons();
    }


    // ================================================================
    // FARMER DETAILS BUTTONS
    // ================================================================

    function attachFarmerButtons() {

        const buttons =
            document.querySelectorAll(
                ".farmer-view-button"
            );


        buttons.forEach(
            function (
                button
            ) {

                if (
                    button.dataset.bound ===
                    "true"
                ) {

                    return;
                }


                button.dataset.bound =
                    "true";


                button.addEventListener(
                    "click",
                    function () {

                        const farmerId =
                            button.dataset.farmerId;


                        const farmer =
                            allFarmers.find(
                                function (
                                    item
                                ) {

                                    return (
                                        String(
                                            item.id ||
                                            item.farmerId
                                        ) ===
                                        String(
                                            farmerId
                                        )
                                    );
                                }
                            );


                        if (
                            farmer
                        ) {

                            openFarmerDetails(
                                farmer
                            );
                        }
                    }
                );
            }
        );
    }


    // ================================================================
    // FARMER DETAILS MODAL
    // ================================================================

    function openFarmerDetails(
        farmer
    ) {

        const modal =
            document.getElementById(
                "farmer-details-modal"
            );


        if (!modal) {
            return;
        }


        setText(
            document.getElementById(
                "modal-farmer-name"
            ),
            farmer.name ||
            "Farmer Details"
        );


        setText(
            document.getElementById(
                "modal-kcc"
            ),
            farmer.kccNumber ||
            "—"
        );


        setText(
            document.getElementById(
                "modal-phone"
            ),
            farmer.phone ||
            "—"
        );


        setText(
            document.getElementById(
                "modal-state"
            ),
            farmer.state ||
            "—"
        );


        setText(
            document.getElementById(
                "modal-district"
            ),
            farmer.district ||
            "—"
        );


        setText(
            document.getElementById(
                "modal-mandi"
            ),
            farmer.mandi ||
            "—"
        );


        setText(
            document.getElementById(
                "modal-land"
            ),
            `${formatNumber(
                farmer.landHoldingAcres
            )} acres`
        );


        setText(
            document.getElementById(
                "modal-bank"
            ),
            farmer.verifiedBank ||
            "—"
        );


        setText(
            document.getElementById(
                "modal-crops"
            ),
            Array.isArray(
                farmer.crops
            )
                ? farmer.crops.join(
                    ", "
                )
                : "—"
        );


        setText(
            document.getElementById(
                "modal-bookings"
            ),
            formatNumber(
                farmer.totalBookings
            )
        );


        setText(
            document.getElementById(
                "modal-active-bookings"
            ),
            formatNumber(
                farmer.activeBookings
            )
        );


        setText(
            document.getElementById(
                "modal-procurement"
            ),
            `${formatNumber(
                farmer.totalProcuredQuintals
            )} qtl`
        );


        setText(
            document.getElementById(
                "modal-payout"
            ),
            formatCurrency(
                farmer.totalPayout
            )
        );


        renderLatestBooking(
            farmer.latestBooking
        );


        renderLatestReceipt(
            farmer.latestReceipt
        );


        modal.hidden =
            false;

        modal.style.display =
            "block";

        modal.classList.add(
            "modal-open"
        );
    }


    // ================================================================
    // LATEST BOOKING
    // ================================================================

    function renderLatestBooking(
        booking
    ) {

        const element =
            document.getElementById(
                "modal-latest-booking"
            );


        if (!element) {
            return;
        }


        if (!booking) {

            element.innerHTML =
                `
                <p>
                    No booking history available.
                </p>
                `;

            return;
        }


        element.innerHTML =
            `
            <div class="modal-record-grid">

                <div class="modal-record-item">
                    <span>Token</span>
                    <strong>
                        ${escapeHTML(
                            booking.tokenId ||
                            "—"
                        )}
                    </strong>
                </div>

                <div class="modal-record-item">
                    <span>Booking ID</span>
                    <strong>
                        ${escapeHTML(
                            booking.bookingId ||
                            "—"
                        )}
                    </strong>
                </div>

                <div class="modal-record-item">
                    <span>Date</span>
                    <strong>
                        ${formatDate(
                            booking.date
                        )}
                    </strong>
                </div>

                <div class="modal-record-item">
                    <span>Time Slot</span>
                    <strong>
                        ${escapeHTML(
                            booking.timeSlot ||
                            "—"
                        )}
                    </strong>
                </div>

                <div class="modal-record-item">
                    <span>Crop</span>
                    <strong>
                        ${escapeHTML(
                            formatCrop(
                                booking.cropType
                            )
                        )}
                    </strong>
                </div>

                <div class="modal-record-item">
                    <span>Quantity</span>
                    <strong>
                        ${formatNumber(
                            booking.quantityQuintals
                        )}
                        qtl
                    </strong>
                </div>

                <div class="modal-record-item">
                    <span>Center</span>
                    <strong>
                        ${escapeHTML(
                            booking.center ||
                            "—"
                        )}
                    </strong>
                </div>

                <div class="modal-record-item">
                    <span>Status</span>
                    <strong>
                        ${escapeHTML(
                            booking.status ||
                            "—"
                        )}
                    </strong>
                </div>

            </div>
            `;
    }


    // ================================================================
    // LATEST RECEIPT
    // ================================================================

    function renderLatestReceipt(
        receipt
    ) {

        const element =
            document.getElementById(
                "modal-latest-receipt"
            );


        if (!element) {
            return;
        }


        if (!receipt) {

            element.innerHTML =
                `
                <p>
                    No procurement receipt available.
                </p>
                `;

            return;
        }


        element.innerHTML =
            `
            <div class="modal-record-grid">

                <div class="modal-record-item">
                    <span>Receipt ID</span>
                    <strong>
                        ${escapeHTML(
                            receipt.receiptId ||
                            "—"
                        )}
                    </strong>
                </div>

                <div class="modal-record-item">
                    <span>Token</span>
                    <strong>
                        ${escapeHTML(
                            receipt.tokenId ||
                            "—"
                        )}
                    </strong>
                </div>

                <div class="modal-record-item">
                    <span>Quantity</span>
                    <strong>
                        ${formatNumber(
                            receipt.actualQuantityQuintals ||
                            receipt.netWeightQuintals
                        )}
                        qtl
                    </strong>
                </div>

                <div class="modal-record-item">
                    <span>Quality Grade</span>
                    <strong>
                        ${escapeHTML(
                            receipt.qualityGrade ||
                            "—"
                        )}
                    </strong>
                </div>

                <div class="modal-record-item">
                    <span>MSP</span>
                    <strong>
                        ${formatCurrency(
                            receipt.mspPricePerQuintal
                        )}
                        / qtl
                    </strong>
                </div>

                <div class="modal-record-item">
                    <span>Payout</span>
                    <strong>
                        ${formatCurrency(
                            receipt.totalPayoutAmount
                        )}
                    </strong>
                </div>

                <div class="modal-record-item">
                    <span>Date</span>
                    <strong>
                        ${formatDate(
                            receipt.timestamp
                        )}
                    </strong>
                </div>

            </div>
            `;
    }


    // ================================================================
    // CLOSE MODAL
    // ================================================================

    function closeFarmerDetails() {

        const modal =
            document.getElementById(
                "farmer-details-modal"
            );


        if (!modal) {
            return;
        }


        modal.classList.remove(
            "modal-open"
        );


        modal.hidden =
            true;


        modal.style.display =
            "none";
    }


    // ================================================================
    // SEARCH
    // ================================================================

    function initializeSearch() {

        if (
            !farmerSearchInput
        ) {
            return;
        }


        farmerSearchInput.addEventListener(
            "input",
            function (
                event
            ) {

                const search =
                    event.target.value;


                clearTimeout(
                    searchTimeout
                );


                searchTimeout =
                    setTimeout(
                        function () {

                            loadFarmers(
                                search
                            );

                        },
                        300
                    );
            }
        );
    }


    // ================================================================
    // MODAL EVENTS
    // ================================================================

    function initializeModal() {

        const closeButton =
            document.getElementById(
                "close-farmer-modal"
            );


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                closeFarmerDetails
            );
        }


        const modal =
            document.getElementById(
                "farmer-details-modal"
            );


        if (modal) {

            const backdrop =
                modal.querySelector(
                    ".farmer-modal-backdrop"
                );


            if (backdrop) {

                backdrop.addEventListener(
                    "click",
                    closeFarmerDetails
                );
            }


            modal.addEventListener(
                "click",
                function (
                    event
                ) {

                    if (
                        event.target ===
                        modal
                    ) {

                        closeFarmerDetails();
                    }
                }
            );
        }


        document.addEventListener(
            "keydown",
            function (
                event
            ) {

                if (
                    event.key ===
                    "Escape"
                ) {

                    closeFarmerDetails();
                }
            }
        );
    }


    // ================================================================
    // INITIALIZATION
    // ================================================================

    function initializeFarmersPage() {

        if (
            farmersPageInitialized
        ) {

            return;
        }


        farmersPageInitialized =
            true;


        initializeSearch();

        initializeModal();


        loadFarmers();
    }


    // ================================================================
    // EXPOSE
    // ================================================================

    window.loadFarmers =
        loadFarmers;

    window.closeFarmerDetails =
        closeFarmerDetails;


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeFarmersPage,
            {
                once:
                    true
            }
        );

    } else {

        initializeFarmersPage();
    }

})();
