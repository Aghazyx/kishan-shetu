// ==========================================
// KISAN SETU - STAGE 3
// BATCH SLOT BOOKING & TOKEN GENERATION
// DATABASE-BACKED SLOT AVAILABILITY
// ==========================================

"use strict";

const STAGE3_API_BASE_URL = "http://localhost:5050";

const STAGE3_STORAGE_KEYS = {
    booking: "kisanSetuBooking",
    stage4Booking: "stage4BookingData",
    bookingId: "activeBookingId",
    tokenId: "activeTokenId",
    tokenIdLegacy: "tokenId",
    bookingIdLegacy: "bookingId",
    bookingDataLegacy: "bookingData",
    selectedTimeSlot: "selectedTimeSlot",
    vehicleNumber: "vehicleNumber",
    bookingDate: "bookingDate",
    farmerName: "verifiedFarmerName",
    aadhaar: "verifiedAadhaar"
};

const STAGE3_DEFAULTS = {
    centerId: "Mandi-Center-01",
    centerName: "Khanna Grain Market (Asia's Largest)",

    /*
     * Backend slot configuration:
     * 08:00 AM - 10:00 AM
     * 10:00 AM - 12:00 PM
     * 12:00 PM - 02:00 PM
     * 02:00 PM - 04:00 PM
     * 04:00 PM - 06:00 PM
     * 06:00 PM - 08:00 PM
     * 08:00 PM - 10:00 PM
     * 10:00 PM - 12:00 AM
     * 12:00 AM - 02:00 AM
     * 02:00 AM - 04:00 AM
     */
    timeSlot: "10:00 AM - 12:00 PM",

    maxQuantityQuintals: 50
};

let currentTargetMandi =
    STAGE3_DEFAULTS.centerName;

let currentSelectedSlot =
    STAGE3_DEFAULTS.timeSlot;

let currentCenterId =
    STAGE3_DEFAULTS.centerId;

let currentAvailability = [];

let bookingInProgress = false;
let availabilityRequestId = 0;


// ==========================================
// STAGE 3 INITIALIZATION
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "[Stage 3] Initializing..."
        );

        initializeDateField();

        initializeTimeSlots();

        initializeFormControls();

        initializeBookingButton();

        initializeRerouteButton();

        restoreSavedSlot();

        restoreExistingBooking();

        updateMandiStatus();

        refreshSlotAvailability();

        console.log(
            "[Stage 3] Initialized successfully."
        );

    }
);


// ==========================================
// DATE INITIALIZATION
// ==========================================

function initializeDateField() {

    const dateElement =
        document.querySelector(
            "#stage-view-3 input[type='date']"
        );

    if (!dateElement) {
        return;
    }

    const localToday =
        getLocalDateString();

    /*
     * The original HTML may contain an old
     * demonstration date. Replace it only
     * when it is missing or already in the past.
     */

    if (
        !dateElement.value ||
        dateElement.value < localToday
    ) {

        dateElement.value =
            localToday;

    }

    dateElement.min =
        localToday;

    dateElement.addEventListener(
        "change",
        () => {

            if (
                !dateElement.value
            ) {
                return;
            }

            if (
                dateElement.value <
                getLocalDateString()
            ) {

                dateElement.value =
                    getLocalDateString();

            }

            sessionStorage.setItem(
                STAGE3_STORAGE_KEYS.bookingDate,
                dateElement.value
            );

            refreshSlotAvailability();

        }
    );

}


// ==========================================
// LOCAL DATE
// ==========================================

function getLocalDateString() {

    const currentDate =
        new Date();

    const year =
        currentDate.getFullYear();

    const month =
        String(
            currentDate.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            currentDate.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${year}-${month}-${day}`;

}


// ==========================================
// TIME SLOT INITIALIZATION
// ==========================================

function initializeTimeSlots() {

    const slotButtons =
        document.querySelectorAll(
            "#stage-view-3 .time-slot-btn"
        );

    slotButtons.forEach(
        (button) => {

            button.onclick =
                () => {

                    if (
                        button.disabled
                    ) {
                        return;
                    }

                    selectSlot(
                        button
                    );

                };

        }
    );

    const initiallySelected =
        document.querySelector(
            "#stage-view-3 .time-slot-btn.selected"
        );

    if (
        initiallySelected &&
        !initiallySelected.disabled
    ) {

        currentSelectedSlot =
            initiallySelected.innerText.trim();

    }

}


// ==========================================
// FORM CONTROL INITIALIZATION
// ==========================================

function initializeFormControls() {

    const cropSelect =
        document.getElementById(
            "crop-select"
        );

    const quantityInput =
        document.getElementById(
            "qty-input"
        );

    if (cropSelect) {

        cropSelect.onchange =
            () => {

                updateMandiStatus();

                refreshSlotAvailability();

            };

    }

    if (quantityInput) {

        quantityInput.oninput =
            () => {

                updateMandiStatus();

                refreshSlotAvailability();

            };

    }

}


// ==========================================
// BOOKING BUTTON INITIALIZATION
// ==========================================

function initializeBookingButton() {

    const bookingButton =
        document.querySelector(
            "#stage-view-3 .card-panel:first-child .btn-action-dark"
        );

    if (!bookingButton) {
        return;
    }

    bookingButton.onclick =
        submitSlotBooking;

}


// ==========================================
// REROUTE BUTTON INITIALIZATION
// ==========================================

function initializeRerouteButton() {

    const rerouteButton =
        document.querySelector(
            "#stage-view-3 .btn-reroute"
        );

    if (!rerouteButton) {
        return;
    }

    rerouteButton.onclick =
        applyReroute;

}


// ==========================================
// RESTORE SAVED SLOT
// ==========================================

function restoreSavedSlot() {

    const savedSlot =
        sessionStorage.getItem(
            STAGE3_STORAGE_KEYS.selectedTimeSlot
        );

    if (!savedSlot) {
        return;
    }

    const slotButtons =
        document.querySelectorAll(
            "#stage-view-3 .time-slot-btn"
        );

    const matchingSlot =
        Array.from(
            slotButtons
        ).find(
            (button) =>
                button.innerText.trim() ===
                savedSlot
        );

    if (matchingSlot) {

        selectSlot(
            matchingSlot,
            false
        );

    }

}


// ==========================================
// RESTORE EXISTING BOOKING
// ==========================================

function restoreExistingBooking() {

    const savedBooking =
        sessionStorage.getItem(
            STAGE3_STORAGE_KEYS.booking
        );

    if (!savedBooking) {
        return;
    }

    try {

        const booking =
            JSON.parse(
                savedBooking
            );

        if (
            booking &&
            booking.tokenId
        ) {

            updateStage4FromBooking(
                booking
            );

            console.log(
                "[Stage 3] Existing booking restored:",
                booking.tokenId
            );

        }

    } catch (error) {

        console.warn(
            "[Stage 3] Could not restore saved booking.",
            error
        );

    }

}


// ==========================================
// TIME SLOT SELECTION
// ==========================================

function selectSlot(
    element,
    saveToSession = true
) {

    if (!element) {
        return;
    }

    if (
        element.disabled
    ) {

        console.warn(
            "[Stage 3] Attempted to select unavailable slot:",
            element.innerText
        );

        return;

    }

    const slotButtons =
        document.querySelectorAll(
            "#stage-view-3 .time-slot-btn"
        );

    slotButtons.forEach(
        (slot) => {

            slot.classList.remove(
                "selected"
            );

        }
    );

    element.classList.add(
        "selected"
    );

    currentSelectedSlot =
        element.innerText.trim();

    if (saveToSession) {

        sessionStorage.setItem(
            STAGE3_STORAGE_KEYS.selectedTimeSlot,
            currentSelectedSlot
        );

    }

    console.log(
        "[Stage 3] Selected slot:",
        currentSelectedSlot
    );

}


// ==========================================
// SLOT AVAILABILITY
// ==========================================

async function refreshSlotAvailability() {

    const dateElement =
        document.querySelector(
            "#stage-view-3 input[type='date']"
        );

    if (!dateElement) {
        return;
    }

    const requestedDate =
        dateElement.value;

    if (!requestedDate) {
        return;
    }

    const requestId =
        ++availabilityRequestId;

    const quantityElement =
        document.getElementById(
            "qty-input"
        );

    const requestedQuantity =
        Number(
            quantityElement?.value
        ) || 0;

    const url =
        new URL(
            `${STAGE3_API_BASE_URL}/api/slots/availability`
        );

    url.searchParams.set(
        "date",
        requestedDate
    );

    url.searchParams.set(
        "centerId",
        currentCenterId
    );

    if (
        requestedQuantity > 0
    ) {

        url.searchParams.set(
            "quantityQuintals",
            requestedQuantity
        );

    }

    try {

        console.log(
            "[Stage 3] Loading slot availability:",
            url.toString()
        );

        const response =
            await fetch(
                url.toString(),
                {
                    method: "GET",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );

        let data;

        try {

            data =
                await response.json();

        } catch {

            throw new Error(
                `Invalid availability response (HTTP ${response.status}).`
            );

        }

        if (
            requestId !==
            availabilityRequestId
        ) {
            return;
        }

        if (
            !response.ok ||
            data?.success !== true
        ) {

            throw new Error(
                data?.message ||
                `Availability request failed with HTTP ${response.status}.`
            );

        }

        currentAvailability =
            Array.isArray(
                data.availability
            )
                ? data.availability
                : [];

        applyAvailabilityToTimeSlots(
            currentAvailability,
            requestedQuantity
        );

        updateSelectedSlotAgainstAvailability(
            requestedQuantity
        );

        updateMandiStatusFromAvailability(
            currentAvailability
        );

        console.log(
            "[Stage 3] Slot availability loaded:",
            currentAvailability
        );

    } catch (error) {

        console.error(
            "[Stage 3 Availability Error]",
            error
        );

        if (
            requestId !==
            availabilityRequestId
        ) {
            return;
        }

        /*
         * Do not silently pretend that slots are
         * available if the backend cannot be reached.
         */

        markAvailabilityUnavailable();

    }

}


// ==========================================
// APPLY AVAILABILITY TO EXISTING BUTTONS
// ==========================================

function applyAvailabilityToTimeSlots(
    availability,
    requestedQuantity
) {

    const slotButtons =
        document.querySelectorAll(
            "#stage-view-3 .time-slot-btn"
        );

    if (
        !slotButtons.length
    ) {
        return;
    }

    /*
     * The backend is the source of truth for
     * slot names and capacity.
     *
     * Existing button styling remains untouched.
     * Only button text/state/attributes are
     * synchronized.
     */

    const backendSlots =
        availability.map(
            (slot) => slot.timeSlot
        );

    /*
     * If the original HTML uses outdated slot
     * labels, synchronize those labels with the
     * backend timetable while preserving the
     * existing button elements and styling.
     */

    slotButtons.forEach(
        (button, index) => {

            const backendSlot =
                availability[index];

            if (!backendSlot) {

                button.disabled =
                    true;

                button.setAttribute(
                    "aria-disabled",
                    "true"
                );

                button.title =
                    "No slot information available.";

                return;

            }

            button.innerText =
                backendSlot.timeSlot;

            button.dataset.slotId =
                backendSlot.slotId;

            button.dataset.timeSlot =
                backendSlot.timeSlot;

            const canAccept =
                requestedQuantity > 0
                    ? backendSlot.canAcceptRequestedQuantity === true
                    : backendSlot.available === true;

            const isFull =
                backendSlot.full === true;

            const hasBookings =
                backendSlot.hasBookings === true;

            button.disabled =
                !canAccept;

            button.setAttribute(
                "aria-disabled",
                String(
                    !canAccept
                )
            );

            /*
             * These classes do not alter the existing
             * design unless corresponding CSS exists.
             * They allow the UI to distinguish:
             *
             * - partially booked
             * - full
             * - available
             */
            button.classList.toggle(
                "slot-partially-booked",
                hasBookings &&
                !isFull
            );

            button.classList.toggle(
                "slot-full",
                isFull
            );

            button.classList.toggle(
                "slot-available",
                backendSlot.available === true
            );

            if (isFull) {

                button.title =
                    "This slot is full.";

            } else if (
                hasBookings &&
                requestedQuantity > 0 &&
                !canAccept
            ) {

                button.title =
                    `Only ${backendSlot.remainingQuintals} quintals remain in this slot.`;

            } else if (
                hasBookings
            ) {

                button.title =
                    `${backendSlot.bookedQuintals} quintals already booked. ${backendSlot.remainingQuintals} quintals remain.`;

            } else {

                button.title =
                    "Slot available.";

            }

        }
    );

    /*
     * If there are fewer frontend buttons than
     * backend slots, the available backend data is
     * still stored in currentAvailability and the
     * booking request can only use an actual visible
     * button.
     */

    if (
        backendSlots.length !==
        slotButtons.length
    ) {

        console.warn(
            "[Stage 3] Frontend/backend slot count differs:",
            {
                frontendButtons:
                    slotButtons.length,
                backendSlots:
                    backendSlots.length
            }
        );

    }

}


// ==========================================
// MARK AVAILABILITY FAILURE
// ==========================================

function markAvailabilityUnavailable() {

    currentAvailability = [];

    const slotButtons =
        document.querySelectorAll(
            "#stage-view-3 .time-slot-btn"
        );

    slotButtons.forEach(
        (button) => {

            button.disabled =
                true;

            button.setAttribute(
                "aria-disabled",
                "true"
            );

            button.title =
                "Unable to verify slot availability from the Kisan Setu backend.";

        }
    );

}


// ==========================================
// CHECK SELECTED SLOT AGAINST AVAILABILITY
// ==========================================

function updateSelectedSlotAgainstAvailability(
    requestedQuantity
) {

    const selected =
        currentAvailability.find(
            (slot) =>
                slot.timeSlot ===
                currentSelectedSlot
        );

    if (!selected) {

        const firstAvailable =
            currentAvailability.find(
                (slot) =>
                    requestedQuantity > 0
                        ? slot.canAcceptRequestedQuantity === true
                        : slot.available === true
            );

        if (firstAvailable) {

            const matchingButton =
                findSlotButton(
                    firstAvailable.timeSlot
                );

            if (matchingButton) {

                selectSlot(
                    matchingButton,
                    true
                );

            }

        }

        return;

    }

    const canAccept =
        requestedQuantity > 0
            ? selected.canAcceptRequestedQuantity === true
            : selected.available === true;

    if (
        !canAccept
    ) {

        const firstAvailable =
            currentAvailability.find(
                (slot) =>
                    requestedQuantity > 0
                        ? slot.canAcceptRequestedQuantity === true
                        : slot.available === true
            );

        if (firstAvailable) {

            const matchingButton =
                findSlotButton(
                    firstAvailable.timeSlot
                );

            if (matchingButton) {

                selectSlot(
                    matchingButton,
                    true
                );

            }

        } else {

            currentSelectedSlot =
                "";

            sessionStorage.removeItem(
                STAGE3_STORAGE_KEYS.selectedTimeSlot
            );

        }

    }

}


// ==========================================
// FIND SLOT BUTTON
// ==========================================

function findSlotButton(
    timeSlot
) {

    const slotButtons =
        document.querySelectorAll(
            "#stage-view-3 .time-slot-btn"
        );

    return Array.from(
        slotButtons
    ).find(
        (button) =>
            button.innerText.trim() ===
            timeSlot
    ) || null;

}


// ==========================================
// SELECTED SLOT AVAILABILITY
// ==========================================

function getSelectedSlotAvailability() {

    return (
        currentAvailability.find(
            (slot) =>
                slot.timeSlot ===
                currentSelectedSlot
        ) ||
        null
    );

}


// ==========================================
// MANDI / CONGESTION STATUS
// ==========================================

function updateMandiStatus() {

    const quantityElement =
        document.getElementById(
            "qty-input"
        );

    const cropElement =
        document.getElementById(
            "crop-select"
        );

    const statusBadge =
        document.getElementById(
            "mandi-status-badge"
        );

    if (
        !quantityElement ||
        !cropElement ||
        !statusBadge
    ) {
        return;
    }

    const quantity =
        Number(
            quantityElement.value
        ) || 0;

    const crop =
        cropElement.value;

    /*
     * The congestion display remains the same
     * prototype logic as the original UI.
     *
     * Actual slot capacity comes from the backend.
     */

    if (
        quantity >= 80
    ) {

        setMandiStatus(
            "HIGH CONGESTION",
            "#fee2e2",
            "#991b1b",
            "54 min",
            "28 Trucks"
        );

    } else if (
        quantity >= 60 ||
        crop === "paddy"
    ) {

        setMandiStatus(
            "MODERATE-HIGH",
            "#fef3c7",
            "#92400e",
            "45 min",
            "20 Trucks"
        );

    } else {

        setMandiStatus(
            "MODERATE CONGESTION",
            "#fef3c7",
            "#92400e",
            "38 min",
            "12 Trucks"
        );

    }

}


// ==========================================
// UPDATE MANDI STATUS FROM BACKEND
// ==========================================

function updateMandiStatusFromAvailability(
    availability
) {

    if (
        !Array.isArray(
            availability
        ) ||
        availability.length === 0
    ) {
        return;
    }

    const totalSlots =
        availability.length;

    const fullSlots =
        availability.filter(
            (slot) =>
                slot.full === true
        ).length;

    const partiallyBookedSlots =
        availability.filter(
            (slot) =>
                slot.status ===
                "partially-booked"
        ).length;

    const selectedSlot =
        getSelectedSlotAvailability();

    /*
     * Preserve the existing visual/status
     * language but make it respond to actual
     * backend occupancy when possible.
     */

    if (
        selectedSlot?.full
    ) {

        setMandiStatus(
            "SLOT FULL",
            "#fee2e2",
            "#991b1b",
            "Please select another slot",
            `${fullSlots} Full`
        );

        return;

    }

    if (
        fullSlots ===
        totalSlots
    ) {

        setMandiStatus(
            "FULLY BOOKED",
            "#fee2e2",
            "#991b1b",
            "No slots available",
            `${fullSlots} Full`
        );

        return;

    }

    if (
        partiallyBookedSlots >
        0
    ) {

        setMandiStatus(
            "MODERATE CONGESTION",
            "#fef3c7",
            "#92400e",
            selectedSlot?.remainingQuintals != null
                ? `${selectedSlot.remainingQuintals} qtl remain`
                : "38 min",
            `${partiallyBookedSlots} Partial`
        );

        return;

    }

    updateMandiStatus();

}


// ==========================================
// SET MANDI STATUS
// ==========================================

function setMandiStatus(
    status,
    background,
    color,
    wait,
    queue
) {

    const statusBadge =
        document.getElementById(
            "mandi-status-badge"
        );

    const waitElement =
        document.getElementById(
            "est-wait-val"
        );

    const queueElement =
        document.getElementById(
            "active-queue-val"
        );

    if (statusBadge) {

        statusBadge.innerText =
            status;

        statusBadge.style.background =
            background;

        statusBadge.style.color =
            color;

    }

    if (waitElement) {

        waitElement.innerText =
            wait;

    }

    if (queueElement) {

        queueElement.innerText =
            queue;

    }

}


// ==========================================
// OVERFLOW REROUTING
// ==========================================

function applyReroute() {

    currentTargetMandi =
        "Karnal Central Krishi Mandi";

    currentCenterId =
        "Mandi-Center-02";

    const mandiTitle =
        document.getElementById(
            "target-mandi-title"
        );

    const statusBadge =
        document.getElementById(
            "mandi-status-badge"
        );

    const waitElement =
        document.getElementById(
            "est-wait-val"
        );

    const queueElement =
        document.getElementById(
            "active-queue-val"
        );

    const overflowDescription =
        document.getElementById(
            "overflow-desc"
        );

    if (mandiTitle) {

        mandiTitle.innerText =
            currentTargetMandi;

    }

    if (statusBadge) {

        statusBadge.innerText =
            "OPTIMIZED FLOW";

        statusBadge.style.background =
            "#dff2e1";

        statusBadge.style.color =
            "#236835";

    }

    if (waitElement) {

        waitElement.innerText =
            "18 min";

    }

    if (queueElement) {

        queueElement.innerText =
            "4 Trucks";

    }

    if (overflowDescription) {

        overflowDescription.innerHTML =
            "<strong>Successfully Rerouted!</strong> " +
            "Karnal Mandi queue load-balancer lock confirmed. " +
            "Turnaround guarantee active.";

    }

    console.log(
        "[Stage 3] Rerouted to:",
        currentTargetMandi,
        currentCenterId
    );

    /*
     * Rerouting changes the actual backend center
     * against which availability must be checked.
     */

    refreshSlotAvailability();

}


// ==========================================
// GET VERIFIED KCC
// ==========================================

function getVerifiedKccNumber() {

    const possibleKeys = [
        "verifiedKccNumber",
        "kccNumber"
    ];

    for (
        const key of possibleKeys
    ) {

        const value =
            sessionStorage.getItem(
                key
            );

        if (
            value &&
            value.trim()
        ) {

            return value.trim();

        }

    }

    const kccInput =
        document.getElementById(
            "kcc-input"
        );

    if (
        kccInput &&
        kccInput.value.trim()
    ) {

        return kccInput.value.trim();

    }

    return "";

}


// ==========================================
// GET VERIFIED FARMER
// ==========================================

function getVerifiedFarmerName() {

    const visibleFarmer =
        document
            .getElementById(
                "farmer-name-val"
            )
            ?.innerText
            .trim();

    if (
        visibleFarmer &&
        visibleFarmer !==
            "Not fetched" &&
        visibleFarmer !==
            "Verified Farmer"
    ) {

        return visibleFarmer;

    }

    const savedFarmer =
        sessionStorage.getItem(
            STAGE3_STORAGE_KEYS.farmerName
        );

    if (
        savedFarmer &&
        savedFarmer.trim()
    ) {

        return savedFarmer.trim();

    }

    const savedFarmerObject =
        sessionStorage.getItem(
            "verifiedFarmer"
        );

    if (savedFarmerObject) {

        try {

            const farmer =
                JSON.parse(
                    savedFarmerObject
                );

            if (
                typeof farmer ===
                    "string" &&
                farmer.trim()
            ) {

                return farmer.trim();

            }

            if (
                farmer?.name &&
                farmer.name.trim()
            ) {

                return farmer.name.trim();

            }

        } catch (error) {

            console.warn(
                "[Stage 3] Could not parse verified farmer data."
            );

        }

    }

    return "Verified Farmer";

}


// ==========================================
// GET VERIFIED AADHAAR
// ==========================================

function getVerifiedAadhaar() {

    return (
        sessionStorage.getItem(
            STAGE3_STORAGE_KEYS.aadhaar
        ) ||
        sessionStorage.getItem(
            "verifiedAadhaar"
        ) ||
        ""
    );

}


// ==========================================
// GET FARMER ID
// ==========================================

function getFarmerId() {

    return (
        sessionStorage.getItem(
            "farmerId"
        ) ||
        sessionStorage.getItem(
            "verifiedFarmerId"
        ) ||
        ""
    );

}


// ==========================================
// SLOT BOOKING
// ==========================================

async function submitSlotBooking() {

    if (
        bookingInProgress
    ) {

        console.warn(
            "[Stage 3] Booking already in progress."
        );

        return;

    }

    bookingInProgress =
        true;

    const bookingButton =
        document.querySelector(
            "#stage-view-3 .card-panel:first-child .btn-action-dark"
        );

    const cropElement =
        document.getElementById(
            "crop-select"
        );

    const quantityElement =
        document.getElementById(
            "qty-input"
        );

    const dateElement =
        document.querySelector(
            "#stage-view-3 input[type='date']"
        );

    const vehicleElement =
        document.getElementById(
            "vehicle-input"
        );

    const kccNumber =
        getVerifiedKccNumber();

    const cropType =
        cropElement?.value;

    const quantity =
        Number(
            quantityElement?.value
        );

    const preferredDate =
        dateElement?.value;

    const vehicleNumber =
        vehicleElement?.value.trim();

    // ======================================
    // VALIDATION
    // ======================================

    if (!kccNumber) {

        showBookingError(
            "Farmer verification is required before slot booking."
        );

        resetBookingState();

        return;

    }

    if (!cropType) {

        showBookingError(
            "Please select a crop type."
        );

        resetBookingState();

        return;

    }

    if (
        !Number.isFinite(
            quantity
        ) ||
        quantity <= 0
    ) {

        showBookingError(
            "Please enter a valid procurement quantity greater than 0."
        );

        resetBookingState();

        return;

    }

    if (
        quantity >
        STAGE3_DEFAULTS.maxQuantityQuintals
    ) {

        showBookingError(
            `Maximum bookable quantity is ${STAGE3_DEFAULTS.maxQuantityQuintals} quintals per time slot.`
        );

        resetBookingState();

        return;

    }

    if (!preferredDate) {

        showBookingError(
            "Please select a preferred date."
        );

        resetBookingState();

        return;

    }

    const localToday =
        getLocalDateString();

    if (
        preferredDate <
        localToday
    ) {

        showBookingError(
            "The selected booking date has already passed. Please select today or a future date."
        );

        resetBookingState();

        return;

    }

    if (!vehicleNumber) {

        showBookingError(
            "Please enter the vehicle plate number."
        );

        resetBookingState();

        return;

    }

    if (!currentSelectedSlot) {

        showBookingError(
            "Please select an arrival time slot."
        );

        resetBookingState();

        return;

    }

    // ======================================
    // VERIFY CURRENT SLOT AVAILABILITY
    // ======================================

    const selectedAvailability =
        getSelectedSlotAvailability();

    if (!selectedAvailability) {

        /*
         * Force a fresh backend check before
         * allowing a booking when availability
         * has not been loaded.
         */

        await refreshSlotAvailability();

        const refreshedAvailability =
            getSelectedSlotAvailability();

        if (!refreshedAvailability) {

            showBookingError(
                "The selected slot could not be verified. Please wait for availability to load and try again."
            );

            resetBookingState();

            return;

        }

    }

    const finalSelectedAvailability =
        getSelectedSlotAvailability();

    if (
        !finalSelectedAvailability
    ) {

        showBookingError(
            "The selected slot is not available for booking."
        );

        resetBookingState();

        return;

    }

    if (
        finalSelectedAvailability.full
    ) {

        showBookingError(
            "The selected time slot is already full. Please choose another available slot."
        );

        resetBookingState();

        return;

    }

    if (
        finalSelectedAvailability.canAcceptRequestedQuantity ===
        false
    ) {

        showBookingError(
            `The selected slot has only ${finalSelectedAvailability.remainingQuintals} quintals remaining. Your booking requires ${quantity} quintals.`
        );

        resetBookingState();

        return;

    }

    // ======================================
    // PREVENT DUPLICATE EXISTING BOOKING
    // ======================================

    const existingBooking =
        sessionStorage.getItem(
            STAGE3_STORAGE_KEYS.booking
        );

    if (existingBooking) {

        try {

            const parsedBooking =
                JSON.parse(
                    existingBooking
                );

            if (
                parsedBooking?.tokenId &&
                parsedBooking?.status &&
                parsedBooking.status !==
                    "Cancelled"
            ) {

                const proceed =
                    window.confirm(
                        `An active booking already exists with token ${parsedBooking.tokenId}.\n\nDo you want to create another booking?`
                    );

                if (!proceed) {

                    resetBookingState();

                    return;

                }

            }

        } catch {

            /*
             * Ignore malformed stale session
             * data and allow backend validation.
             */

        }

    }

    // ======================================
    // BUTTON STATE
    // ======================================

    const originalHTML =
        bookingButton?.innerHTML;

    try {

        if (bookingButton) {

            bookingButton.disabled =
                true;

            bookingButton.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Booking Slot...';

        }

        // ==================================
        // BUILD BACKEND PAYLOAD
        // ==================================

        const payload = {

            kccNumber,

            farmerId:
                getFarmerId(),

            cropType,

            quantityQuintals:
                quantity,

            preferredDate,

            centerId:
                currentCenterId,

            timeSlot:
                currentSelectedSlot,

            vehicleNumber

        };

        console.log(
            "[Stage 3] Booking payload:",
            payload
        );

        // ==================================
        // BACKEND REQUEST
        // ==================================

        const response =
            await fetch(
                `${STAGE3_API_BASE_URL}/api/slots/book`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )

                }
            );

        // ==================================
        // READ RESPONSE
        // ==================================

        let data;

        try {

            data =
                await response.json();

        } catch {

            throw new Error(
                `Backend returned an invalid response (HTTP ${response.status}).`
            );

        }

        // ==================================
        // HANDLE BACKEND ERROR
        // ==================================

        if (!response.ok) {

            const message =
                getBackendErrorMessage(
                    response.status,
                    data
                );

            throw new Error(
                message
            );

        }

        if (
            !data ||
            data.success !== true
        ) {

            throw new Error(
                data?.message ||
                "Slot booking failed."
            );

        }

        // ==================================
        // VERIFY BOOKING OBJECT
        // ==================================

        const booking =
            data.booking;

        if (
            !booking ||
            !booking.tokenId ||
            !booking.bookingId
        ) {

            throw new Error(
                "Booking succeeded but the backend did not return a valid booking ID and digital token."
            );

        }

        console.log(
            "[Stage 3] Backend booking successful:",
            booking
        );

        // ==================================
        // BACKEND SOURCE OF TRUTH
        // ==================================

        const finalToken =
            booking.tokenId;

        const finalBookingId =
            booking.bookingId;

        const finalDate =
            booking.date ||
            booking.preferredDate ||
            preferredDate;

        const finalTimeSlot =
            booking.timeSlot ||
            currentSelectedSlot;

        const finalCenterId =
            booking.centerId ||
            currentCenterId;

        const finalCenter =
            booking.center ||
            booking.centerName ||
            currentTargetMandi;

        const finalQuantity =
            Number(
                booking.quantityQuintals
            );

        const safeQuantity =
            Number.isFinite(
                finalQuantity
            )
                ? finalQuantity
                : quantity;

        const finalVehicle =
            booking.vehicleNumber ||
            vehicleNumber;

        const farmerName =
            booking.farmerName ||
            getVerifiedFarmerName();

        const aadhaar =
            booking.aadhaar ||
            getVerifiedAadhaar();

        const selectedCropText =
            cropElement?.options[
                cropElement.selectedIndex
            ]?.text ||
            cropType;

        // ==================================
        // NORMALIZED FRONTEND BOOKING
        // ==================================

        const frontendBooking = {

            ...booking,

            bookingId:
                finalBookingId,

            tokenId:
                finalToken,

            kccNumber,

            farmerId:
                booking.farmerId ||
                getFarmerId(),

            farmerName,

            aadhaar,

            cropType,

            cropText:
                selectedCropText,

            quantityQuintals:
                safeQuantity,

            date:
                finalDate,

            timeSlot:
                finalTimeSlot,

            centerId:
                finalCenterId,

            center:
                finalCenter,

            vehicleNumber:
                finalVehicle

        };

        // ==================================
        // SAVE CANONICAL SESSION STATE
        // ==================================

        saveBookingSession(
            frontendBooking
        );

        // ==================================
        // UPDATE STAGE 4
        // ==================================

        updateStage4FromBooking(
            frontendBooking
        );

        if (
            typeof window.refreshStage4 ===
            "function"
        ) {

            window.refreshStage4();

        }

        // ==================================
        // UPDATE NOTIFICATION MODAL
        // ==================================

        updateNotificationModal(
            frontendBooking
        );

        const notificationModal =
            document.getElementById(
                "notification-fanout-modal"
            );

        if (notificationModal) {

            notificationModal.classList.add(
                "open"
            );

        }

        /*
         * Refresh availability after a successful
         * booking so the newly occupied quantity
         * immediately becomes visible.
         */

        refreshSlotAvailability();

        console.log(
            "[Stage 3] Booking completed successfully:",
            frontendBooking
        );

    } catch (error) {

        console.error(
            "[Stage 3 Booking Error]",
            error
        );

        showBookingError(
            error.message ||
            "Unable to complete slot booking."
        );

    } finally {

        if (bookingButton) {

            bookingButton.disabled =
                false;

            if (originalHTML) {

                bookingButton.innerHTML =
                    originalHTML;

            }

        }

        bookingInProgress =
            false;

    }

}


// ==========================================
// SAVE BOOKING SESSION
// ==========================================

function saveBookingSession(
    booking
) {

    const bookingJSON =
        JSON.stringify(
            booking
        );

    sessionStorage.setItem(
        STAGE3_STORAGE_KEYS.booking,
        bookingJSON
    );

    sessionStorage.setItem(
        STAGE3_STORAGE_KEYS.stage4Booking,
        bookingJSON
    );

    sessionStorage.setItem(
        STAGE3_STORAGE_KEYS.bookingId,
        booking.bookingId
    );

    sessionStorage.setItem(
        STAGE3_STORAGE_KEYS.tokenId,
        booking.tokenId
    );

    /*
     * Legacy keys are retained so older
     * Stage 4/5/6 scripts can still resolve
     * the active transaction.
     */

    sessionStorage.setItem(
        STAGE3_STORAGE_KEYS.bookingIdLegacy,
        booking.bookingId
    );

    sessionStorage.setItem(
        STAGE3_STORAGE_KEYS.tokenIdLegacy,
        booking.tokenId
    );

    sessionStorage.setItem(
        STAGE3_STORAGE_KEYS.bookingDataLegacy,
        bookingJSON
    );

    sessionStorage.setItem(
        STAGE3_STORAGE_KEYS.selectedTimeSlot,
        booking.timeSlot
    );

    sessionStorage.setItem(
        STAGE3_STORAGE_KEYS.vehicleNumber,
        booking.vehicleNumber
    );

    sessionStorage.setItem(
        STAGE3_STORAGE_KEYS.bookingDate,
        booking.date
    );

    sessionStorage.setItem(
        STAGE3_STORAGE_KEYS.farmerName,
        booking.farmerName
    );

    sessionStorage.setItem(
        STAGE3_STORAGE_KEYS.aadhaar,
        booking.aadhaar || ""
    );

}


// ==========================================
// BACKEND ERROR MESSAGE
// ==========================================

function getBackendErrorMessage(
    status,
    data
) {

    if (
        data &&
        data.message
    ) {

        if (
            data.code ===
            "SLOT_CAPACITY_EXCEEDED" &&
            data.availability
        ) {

            return (
                `${data.message}\n\n` +
                `Slot capacity: ${data.availability.capacityQuintals} qtl\n` +
                `Already booked: ${data.availability.bookedQuintals} qtl\n` +
                `Remaining: ${data.availability.remainingQuintals} qtl`
            );

        }

        if (
            data.code ===
            "SLOT_FULL"
        ) {

            return data.message;

        }

        if (
            data.code ===
            "FARMER_DATE_ALREADY_BOOKED"
        ) {

            return (
                `${data.message}\n\n` +
                `Existing token: ${data.booking?.tokenId || "Already booked"}`
            );

        }

        return data.message;

    }

    if (
        status === 400
    ) {

        return (
            "The booking information is invalid. " +
            "Please check the entered details."
        );

    }

    if (
        status === 404
    ) {

        return (
            "The selected mandi or booking resource could not be found."
        );

    }

    if (
        status === 409
    ) {

        return (
            "The selected slot is full or does not have enough remaining capacity. Please choose another slot."
        );

    }

    if (
        status === 500
    ) {

        return (
            "The Kisan Setu backend encountered an internal error while creating the booking."
        );

    }

    return (
        `Slot booking failed with HTTP ${status}.`
    );

}


// ==========================================
// UPDATE STAGE 4
// ==========================================

function updateStage4FromBooking(
    booking
) {

    if (!booking) {
        return;
    }

    // ======================================
    // TOKEN
    // ======================================

    const tokenDisplay =
        document.getElementById(
            "token-display-id"
        );

    if (tokenDisplay) {

        tokenDisplay.innerText =
            booking.tokenId ||
            "Pending";

    }

    // ======================================
    // FARMER
    // ======================================

    const farmerName =
        booking.farmerName ||
        getVerifiedFarmerName();

    // ======================================
    // CROP
    // ======================================

    const cropElement =
        document.getElementById(
            "crop-select"
        );

    const selectedCropText =
        booking.cropText ||
        cropElement?.options[
            cropElement.selectedIndex
        ]?.text ||
        booking.cropType ||
        "Crop";

    const farmerDescription =
        document.getElementById(
            "token-farmer-desc"
        );

    if (farmerDescription) {

        farmerDescription.innerText =
            `${farmerName} • ${selectedCropText}`;

    }

    // ======================================
    // STAGE 4 TOKEN DETAILS
    // ======================================

    const stage4Elements = {

        token:
            document.getElementById(
                "token-display-id"
            ),

        farmer:
            document.getElementById(
                "token-farmer-desc"
            )

    };

    if (stage4Elements.token) {

        stage4Elements.token.innerText =
            booking.tokenId ||
            "Pending";

    }

    // ======================================
    // QR / TOKEN SLIP
    // ======================================

    const qrFarmer =
        document.getElementById(
            "qr-farmer-name"
        );

    const qrCrop =
        document.getElementById(
            "qr-crop-type"
        );

    const qrQuantity =
        document.getElementById(
            "qr-booked-qty"
        );

    const qrCentre =
        document.getElementById(
            "qr-mandi-centre"
        );

    const qrVehicle =
        document.getElementById(
            "qr-vehicle-plate"
        );

    const qrDateSlot =
        document.getElementById(
            "qr-date-slot"
        );

    if (qrFarmer) {

        qrFarmer.innerText =
            farmerName;

    }

    if (qrCrop) {

        qrCrop.innerText =
            selectedCropText;

    }

    if (qrQuantity) {

        qrQuantity.innerText =
            `${booking.quantityQuintals || 0} Quintals`;

    }

    if (qrCentre) {

        qrCentre.innerText =
            booking.center ||
            currentTargetMandi;

    }

    if (qrVehicle) {

        qrVehicle.innerText =
            booking.vehicleNumber ||
            "Not provided";

    }

    if (qrDateSlot) {

        qrDateSlot.innerText =
            `${booking.date || ""} (${booking.timeSlot || ""})`;

    }

    // ======================================
    // STAGE 4 SESSION STATE
    // ======================================

    sessionStorage.setItem(
        STAGE3_STORAGE_KEYS.stage4Booking,
        JSON.stringify(
            booking
        )
    );

    console.log(
        "[Stage 3] Stage 4 synchronized:",
        {
            token:
                booking.tokenId,

            farmer:
                farmerName,

            crop:
                selectedCropText,

            quantity:
                booking.quantityQuintals,

            date:
                booking.date,

            slot:
                booking.timeSlot,

            center:
                booking.center,

            vehicle:
                booking.vehicleNumber
        }
    );

}


// ==========================================
// NOTIFICATION MODAL
// ==========================================

function updateNotificationModal(
    booking
) {

    const modalToken =
        document.getElementById(
            "modal-token-tag"
        );

    const alertText =
        document.getElementById(
            "modal-alert-text"
        );

    if (modalToken) {

        modalToken.innerText =
            booking.tokenId;

    }

    if (alertText) {

        alertText.innerText =
            `DoCA Alert: Slot confirmed for ` +
            `${booking.farmerName}. ` +
            `Token: ${booking.tokenId} for ` +
            `${booking.cropText} ` +
            `(${booking.quantityQuintals} qtl) on ` +
            `${booking.date} ` +
            `(${booking.timeSlot}) at ` +
            `${booking.center}.`;

    }

}


// ==========================================
// RESET BOOKING STATE
// ==========================================

function resetBookingState() {

    bookingInProgress =
        false;

}


// ==========================================
// BOOKING ERROR
// ==========================================

function showBookingError(
    message
) {

    alert(
        `Slot booking failed:\n\n${message}`
    );

}


// ==========================================
// OPTIONAL PROGRAMMATIC BOOKING API
// ==========================================

async function bookSlotBackend(
    bookingParams
) {

    if (!bookingParams) {

        return false;

    }

    const payload = {

        kccNumber:
            getVerifiedKccNumber(),

        farmerId:
            getFarmerId(),

        cropType:
            bookingParams.crop,

        quantityQuintals:
            Number(
                bookingParams.quantity
            ),

        preferredDate:
            bookingParams.date,

        centerId:
            bookingParams.centerId ||
            currentCenterId,

        timeSlot:
            bookingParams.timeSlot ||
            currentSelectedSlot,

        vehicleNumber:
            bookingParams.vehicle

    };

    try {

        const response =
            await fetch(
                `${STAGE3_API_BASE_URL}/api/slots/book`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )

                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            data.success !== true ||
            !data.booking
        ) {

            console.error(
                "[Stage 3] Backend booking failed:",
                data
            );

            return false;

        }

        const booking =
            data.booking;

        const normalizedBooking = {

            ...booking,

            kccNumber:
                payload.kccNumber,

            farmerId:
                booking.farmerId ||
                payload.farmerId,

            cropType:
                booking.cropType ||
                payload.cropType,

            quantityQuintals:
                Number(
                    booking.quantityQuintals
                ) ||
                payload.quantityQuintals,

            date:
                booking.date ||
                payload.preferredDate,

            timeSlot:
                booking.timeSlot ||
                payload.timeSlot,

            centerId:
                booking.centerId ||
                payload.centerId,

            vehicleNumber:
                booking.vehicleNumber ||
                payload.vehicleNumber,

            farmerName:
                booking.farmerName ||
                getVerifiedFarmerName()

        };

        saveBookingSession(
            normalizedBooking
        );

        updateStage4FromBooking(
            normalizedBooking
        );

        refreshSlotAvailability();

        return true;

    } catch (error) {

        console.error(
            "[Stage 3] API Error:",
            error
        );

        return false;

    }

}


// ==========================================
// EXPOSE FUNCTIONS
// ==========================================

window.selectSlot =
    selectSlot;

window.updateMandiStatus =
    updateMandiStatus;

window.applyReroute =
    applyReroute;

window.submitSlotBooking =
    submitSlotBooking;

window.updateStage4FromBooking =
    updateStage4FromBooking;

window.bookSlotBackend =
    bookSlotBackend;

window.refreshSlotAvailability =
    refreshSlotAvailability;