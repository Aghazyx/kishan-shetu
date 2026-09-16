(function () {
    "use strict";

    // ==========================================
    // KISAN SETU - STAGE 3
    // BATCH SLOT BOOKING & TOKEN GENERATION
    // ==========================================

    const API_BASE_URL = "http://localhost:5050";

    const DEFAULT_CENTER_ID = "Mandi-Center-01";

    const DEFAULT_CENTER_NAME =
        "Khanna Grain Market (Asia's Largest)";

    const MAX_SLOT_QUANTITY = 50;

    const BACKEND_SLOTS = [
        "08:00 AM - 10:00 AM",
        "10:00 AM - 12:00 PM",
        "12:00 PM - 02:00 PM",
        "02:00 PM - 04:00 PM",
        "04:00 PM - 06:00 PM",
        "06:00 PM - 08:00 PM",
        "08:00 PM - 10:00 PM",
        "10:00 PM - 12:00 AM",
        "12:00 AM - 02:00 AM",
        "02:00 AM - 04:00 AM"
    ];

    let currentCenterId =
        DEFAULT_CENTER_ID;

    let currentTargetMandi =
        DEFAULT_CENTER_NAME;

    let currentSelectedSlot =
        BACKEND_SLOTS[0];

    let currentAvailability = [];

    let bookingInProgress = false;

    let availabilityRequestId = 0;


    // ==========================================
    // STORAGE HELPERS
    // ==========================================

    function getStorageValue(key) {

        return (
            sessionStorage.getItem(key) ||
            localStorage.getItem(key) ||
            ""
        );
    }


    function getJSON(key) {

        const raw =
            getStorageValue(key);

        if (!raw) {
            return null;
        }

        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }


    function saveJSON(
        key,
        value
    ) {

        const serialized =
            JSON.stringify(value);

        sessionStorage.setItem(
            key,
            serialized
        );

        localStorage.setItem(
            key,
            serialized
        );
    }


    // ==========================================
    // DATE
    // ==========================================

    function getLocalDateString() {

        const now =
            new Date();

        const year =
            now.getFullYear();

        const month =
            String(
                now.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                now.getDate()
            ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }


    function initializeDateField() {

        const dateInput =
            document.querySelector(
                "#stage-view-3 input[type='date']"
            );

        if (!dateInput) {
            return;
        }

        dateInput.id =
            "booking-date-input";

        const today =
            getLocalDateString();

        dateInput.min =
            today;

        if (
            !dateInput.value ||
            dateInput.value < today
        ) {
            dateInput.value =
                today;
        }

        dateInput.addEventListener(
            "change",
            refreshSlotAvailability
        );
    }


    // ==========================================
    // VERIFIED FARMER
    // ==========================================

    function getVerifiedKccNumber() {

        return (
            getStorageValue(
                "verifiedKccNumber"
            ) ||
            getStorageValue(
                "kccNumber"
            ) ||
            document.getElementById(
                "kcc-input"
            )?.value?.trim() ||
            ""
        );
    }


    function getFarmerId() {

        return (
            getStorageValue(
                "farmerId"
            ) ||
            getStorageValue(
                "verifiedFarmerId"
            ) ||
            ""
        );
    }


    function getFarmerName() {

        const element =
            document.getElementById(
                "farmer-name-val"
            );

        return (
            element?.innerText?.trim() ||
            getStorageValue(
                "verifiedFarmerName"
            ) ||
            "Verified Farmer"
        );
    }


    function getAadhaar() {

        return (
            getStorageValue(
                "verifiedAadhaar"
            ) ||
            ""
        );
    }


    // ==========================================
    // STAGE 3 FORM
    // ==========================================

    function getFormValues() {

        const cropElement =
            document.getElementById(
                "crop-select"
            );

        const quantityElement =
            document.getElementById(
                "qty-input"
            );

        const dateElement =
            document.getElementById(
                "booking-date-input"
            ) ||
            document.querySelector(
                "#stage-view-3 input[type='date']"
            );

        const vehicleElement =
            document.getElementById(
                "vehicle-input"
            );

        return {

            cropType:
                cropElement?.value ||
                "",

            quantity:
                Number(
                    quantityElement?.value
                ) || 0,

            preferredDate:
                dateElement?.value ||
                getLocalDateString(),

            vehicleNumber:
                vehicleElement?.value?.trim() ||
                "",

            cropText:
                cropElement?.options[
                    cropElement.selectedIndex
                ]?.text ||
                "Crop"
        };
    }


    // ==========================================
    // INITIALIZE TIME SLOTS
    // ==========================================

    function initializeTimeSlots() {

        const buttons =
            document.querySelectorAll(
                "#stage-view-3 .time-slot-btn"
            );

        if (!buttons.length) {
            return;
        }

        buttons.forEach(
            function (
                button,
                index
            ) {

                const backendSlot =
                    BACKEND_SLOTS[index];

                if (
                    backendSlot
                ) {

                    button.innerText =
                        backendSlot;

                    button.dataset.timeSlot =
                        backendSlot;

                    button.dataset.slotId =
                        `SLOT-${String(
                            index + 1
                        ).padStart(2, "0")}`;
                }

                button.onclick =
                    function () {
                        selectSlot(button);
                    };
            }
        );


        const selected =
            document.querySelector(
                "#stage-view-3 .time-slot-btn.selected"
            );

        if (selected) {

            currentSelectedSlot =
                selected.innerText.trim();

        } else {

            const first =
                buttons[0];

            first.classList.add(
                "selected"
            );

            currentSelectedSlot =
                first.innerText.trim();
        }
    }


    // ==========================================
    // SELECT SLOT
    // ==========================================

    function selectSlot(
        button,
        silent = false
    ) {

        if (!button) {
            return;
        }

        if (
            button.disabled &&
            !silent
        ) {

            return;
        }

        const buttons =
            document.querySelectorAll(
                "#stage-view-3 .time-slot-btn"
            );

        buttons.forEach(
            function (item) {
                item.classList.remove(
                    "selected"
                );
            }
        );

        button.classList.add(
            "selected"
        );

        currentSelectedSlot =
            button.dataset.timeSlot ||
            button.innerText.trim();

        sessionStorage.setItem(
            "selectedTimeSlot",
            currentSelectedSlot
        );

        localStorage.setItem(
            "selectedTimeSlot",
            currentSelectedSlot
        );

        if (!silent) {
            console.log(
                "[Stage 3] Selected slot:",
                currentSelectedSlot
            );
        }
    }


    // ==========================================
    // REFRESH SLOT AVAILABILITY
    // ==========================================

    async function refreshSlotAvailability() {

        const dateInput =
            document.getElementById(
                "booking-date-input"
            ) ||
            document.querySelector(
                "#stage-view-3 input[type='date']"
            );

        if (!dateInput) {
            return;
        }

        const date =
            dateInput.value ||
            getLocalDateString();

        const quantity =
            Number(
                document.getElementById(
                    "qty-input"
                )?.value
            ) || 0;

        const requestId =
            ++availabilityRequestId;


        const url =
            new URL(
                `${API_BASE_URL}/api/slots/availability`
            );

        url.searchParams.set(
            "date",
            date
        );

        url.searchParams.set(
            "centerId",
            currentCenterId
        );

        if (
            quantity > 0
        ) {

            url.searchParams.set(
                "quantityQuintals",
                String(quantity)
            );
        }


        try {

            const response =
                await fetch(
                    url.toString(),
                    {
                        method: "GET",
                        headers: {
                            Accept:
                                "application/json"
                        }
                    }
                );

            const data =
                await response.json();

            if (
                requestId !==
                availabilityRequestId
            ) {
                return;
            }

            if (
                !response.ok ||
                data.success !== true
            ) {

                throw new Error(
                    data.message ||
                    "Unable to load slot availability."
                );
            }


            currentAvailability =
                Array.isArray(
                    data.availability
                )
                    ? data.availability
                    : [];


            synchronizeVisibleSlots(
                quantity
            );


            updateMandiStatusFromAvailability();


            console.log(
                "[Stage 3] Availability:",
                currentAvailability
            );


        } catch (error) {

            console.error(
                "[Stage 3] Availability error:",
                error
            );

            currentAvailability =
                [];

            const buttons =
                document.querySelectorAll(
                    "#stage-view-3 .time-slot-btn"
                );

            buttons.forEach(
                function (button) {

                    button.disabled =
                        false;

                    button.title =
                        "Availability could not be loaded. Backend will validate the booking.";

                }
            );
        }
    }


    // ==========================================
    // SYNCHRONIZE VISIBLE SLOTS
    // ==========================================

    function synchronizeVisibleSlots(
        quantity
    ) {

        const buttons =
            Array.from(
                document.querySelectorAll(
                    "#stage-view-3 .time-slot-btn"
                )
            );

        if (!buttons.length) {
            return;
        }


        buttons.forEach(
            function (
                button,
                index
            ) {

                const availability =
                    currentAvailability[index];

                if (!availability) {
                    return;
                }

                button.innerText =
                    availability.timeSlot;

                button.dataset.timeSlot =
                    availability.timeSlot;

                button.dataset.slotId =
                    availability.slotId;

                const accepts =
                    quantity > 0
                        ? availability.canAcceptRequestedQuantity === true
                        : availability.available === true;

                button.disabled =
                    !accepts;

                button.setAttribute(
                    "aria-disabled",
                    String(!accepts)
                );


                if (
                    availability.full
                ) {

                    button.title =
                        "This slot is full.";

                } else if (
                    quantity > 0 &&
                    !accepts
                ) {

                    button.title =
                        `Only ${availability.remainingQuintals} qtl remain.`;

                } else if (
                    availability.hasBookings
                ) {

                    button.title =
                        `${availability.bookedQuintals} qtl booked. ${availability.remainingQuintals} qtl remain.`;

                } else {

                    button.title =
                        "Slot available.";
                }
            }
        );


        /*
         * Critical improvement:
         *
         * If the currently selected slot cannot
         * accept the requested quantity, automatically
         * move the selection to the first slot that can.
         */

        const selectedAvailability =
            currentAvailability.find(
                function (slot) {

                    return (
                        slot.timeSlot ===
                        currentSelectedSlot
                    );
                }
            );


        if (
            quantity > 0 &&
            (
                !selectedAvailability ||
                selectedAvailability.canAcceptRequestedQuantity !== true
            )
        ) {

            const replacement =
                currentAvailability.find(
                    function (slot) {

                        return (
                            slot.canAcceptRequestedQuantity ===
                            true
                        );
                    }
                );


            if (replacement) {

                const replacementButton =
                    buttons.find(
                        function (button) {

                            return (
                                button.dataset.timeSlot ===
                                replacement.timeSlot
                            );
                        }
                    );


                if (
                    replacementButton
                ) {

                    selectSlot(
                        replacementButton,
                        true
                    );

                    replacementButton.disabled =
                        false;

                    console.log(
                        "[Stage 3] Automatically moved to available slot:",
                        replacement.timeSlot
                    );
                }
            }
        }
    }


    // ==========================================
    // SELECTED AVAILABILITY
    // ==========================================

    function getSelectedAvailability() {

        return currentAvailability.find(
            function (slot) {

                return (
                    slot.timeSlot ===
                    currentSelectedSlot
                );
            }
        );
    }


    // ==========================================
    // MANDI STATUS
    // ==========================================

    function setMandiStatus(
        text,
        background,
        color,
        wait,
        queue
    ) {

        const badge =
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

        if (badge) {
            badge.innerText =
                text;

            badge.style.background =
                background;

            badge.style.color =
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


    function updateMandiStatusFromAvailability() {

        const selected =
            getSelectedAvailability();

        if (
            selected?.full
        ) {

            setMandiStatus(
                "SLOT FULL",
                "#fee2e2",
                "#991b1b",
                "Choose another slot",
                "FULL"
            );

            return;
        }


        if (
            selected?.canAcceptRequestedQuantity === false
        ) {

            setMandiStatus(
                "LIMITED CAPACITY",
                "#fef3c7",
                "#92400e",
                `${selected.remainingQuintals} qtl remain`,
                `${selected.bookedQuintals} qtl booked`
            );

            return;
        }


        if (
            selected?.hasBookings
        ) {

            setMandiStatus(
                "PARTIALLY BOOKED",
                "#fef3c7",
                "#92400e",
                `${selected.remainingQuintals} qtl remain`,
                `${selected.bookedQuintals} qtl booked`
            );

            return;
        }


        setMandiStatus(
            "AVAILABLE",
            "#dff2e1",
            "#236835",
            "38 min",
            "Open"
        );
    }


    function updateMandiStatus() {

        const quantity =
            Number(
                document.getElementById(
                    "qty-input"
                )?.value
            ) || 0;

        const crop =
            document.getElementById(
                "crop-select"
            )?.value ||
            "wheat";


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


        refreshSlotAvailability();
    }


    // ==========================================
    // REROUTE
    // ==========================================

    function applyReroute() {

        currentCenterId =
            "Mandi-Center-02";

        currentTargetMandi =
            "Karnal Central Krishi Mandi";


        const title =
            document.getElementById(
                "target-mandi-title"
            );

        if (title) {
            title.innerText =
                currentTargetMandi;
        }


        setMandiStatus(
            "OPTIMIZED FLOW",
            "#dff2e1",
            "#236835",
            "18 min",
            "4 Trucks"
        );


        const description =
            document.getElementById(
                "overflow-desc"
            );

        if (description) {

            description.innerHTML =
                "<strong>Successfully Rerouted!</strong> Karnal Mandi queue load-balancer lock confirmed. Turnaround guarantee active.";
        }


        refreshSlotAvailability();

        console.log(
            "[Stage 3] Rerouted to:",
            currentTargetMandi,
            currentCenterId
        );
    }


    // ==========================================
    // BOOKING BUTTON
    // ==========================================

    function getBookingButton() {

        return document.querySelector(
            "#stage-view-3 .card-panel:first-child .btn-action-dark"
        );
    }


    // ==========================================
    // BOOK SLOT
    // ==========================================

    async function submitSlotBooking() {

        if (bookingInProgress) {
            return;
        }

        bookingInProgress =
            true;


        const bookingButton =
            getBookingButton();

        const values =
            getFormValues();

        const kccNumber =
            getVerifiedKccNumber();

        const farmerId =
            getFarmerId();


        // --------------------------------------
        // BASIC VALIDATION
        // --------------------------------------

        if (!kccNumber) {

            showBookingError(
                "Farmer verification is required before slot booking."
            );

            bookingInProgress =
                false;

            return;
        }


        if (
            !values.cropType
        ) {

            showBookingError(
                "Please select a crop type."
            );

            bookingInProgress =
                false;

            return;
        }


        if (
            values.quantity <= 0
        ) {

            showBookingError(
                "Please enter a valid procurement quantity."
            );

            bookingInProgress =
                false;

            return;
        }


        if (
            values.quantity >
            MAX_SLOT_QUANTITY
        ) {

            showBookingError(
                "A single time slot can accept a maximum of 50 quintals."
            );

            bookingInProgress =
                false;

            return;
        }


        if (
            !values.preferredDate ||
            values.preferredDate <
            getLocalDateString()
        ) {

            showBookingError(
                "Please select today or a future booking date."
            );

            bookingInProgress =
                false;

            return;
        }


        if (
            !values.vehicleNumber
        ) {

            showBookingError(
                "Please enter the vehicle plate number."
            );

            bookingInProgress =
                false;

            return;
        }


        // --------------------------------------
        // REFRESH AVAILABILITY BEFORE BOOKING
        // --------------------------------------

        await refreshSlotAvailability();


        let selected =
            getSelectedAvailability();


        /*
         * If selected slot is occupied or does
         * not have enough capacity, automatically
         * choose the first valid slot.
         */

        if (
            !selected ||
            selected.canAcceptRequestedQuantity !== true
        ) {

            selected =
                currentAvailability.find(
                    function (slot) {

                        return (
                            slot.canAcceptRequestedQuantity ===
                            true
                        );
                    }
                );


            if (selected) {

                const button =
                    document.querySelector(
                        `#stage-view-3 .time-slot-btn[data-time-slot="${CSS.escape(
                            selected.timeSlot
                        )}"]`
                    );


                if (button) {

                    button.disabled =
                        false;

                    selectSlot(
                        button,
                        true
                    );
                }
            }
        }


        if (
            !selected ||
            selected.canAcceptRequestedQuantity !== true
        ) {

            const reason =
                selected
                    ? `No visible slot can accept ${values.quantity} qtl right now.`
                    : "No slot is currently available for the requested quantity.";

            showBookingError(
                reason
            );

            bookingInProgress =
                false;

            return;
        }


        // --------------------------------------
        // BUTTON LOADING
        // --------------------------------------

        const originalHTML =
            bookingButton?.innerHTML;


        if (bookingButton) {

            bookingButton.disabled =
                true;

            bookingButton.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Booking Slot...';
        }


        const payload = {

            kccNumber,

            farmerId,

            cropType:
                values.cropType,

            quantityQuintals:
                values.quantity,

            preferredDate:
                values.preferredDate,

            centerId:
                currentCenterId,

            timeSlot:
                selected.timeSlot,

            vehicleNumber:
                values.vehicleNumber
        };


        console.log(
            "[Stage 3] Booking payload:",
            payload
        );


        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/api/slots/book`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Accept:
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


            let data = {};

            try {

                data =
                    await response.json();

            } catch {

                throw new Error(
                    `Backend returned HTTP ${response.status}.`
                );
            }


            if (
                !response.ok ||
                data.success !== true
            ) {

                throw new Error(
                    getBackendErrorMessage(
                        response.status,
                        data
                    )
                );
            }


            const backendBooking =
                data.booking;


            if (
                !backendBooking?.tokenId
            ) {

                throw new Error(
                    "Booking succeeded but no digital token was returned."
                );
            }


            const normalizedBooking = {

                ...backendBooking,

                kccNumber:
                    backendBooking.kccNumber ||
                    kccNumber,

                farmerId:
                    backendBooking.farmerId ||
                    farmerId,

                farmerName:
                    backendBooking.farmerName ||
                    getFarmerName(),

                aadhaar:
                    backendBooking.aadhaar ||
                    getAadhaar(),

                vehicleNumber:
                    backendBooking.vehicleNumber ||
                    values.vehicleNumber,

                cropType:
                    backendBooking.cropType ||
                    values.cropType,

                quantityQuintals:
                    Number(
                        backendBooking.quantityQuintals
                    ) ||
                    values.quantity,

                date:
                    backendBooking.date ||
                    values.preferredDate,

                timeSlot:
                    backendBooking.timeSlot ||
                    selected.timeSlot,

                centerId:
                    backendBooking.centerId ||
                    currentCenterId,

                center:
                    backendBooking.center ||
                    currentTargetMandi,

                status:
                    backendBooking.status ||
                    "Scheduled"
            };


            // ----------------------------------
            // SAVE BOOKING EVERYWHERE
            // ----------------------------------

            saveJSON(
                "kisanSetuBooking",
                normalizedBooking
            );

            saveJSON(
                "kisanSetuStage4Booking",
                normalizedBooking
            );

            sessionStorage.setItem(
                "activeTokenId",
                normalizedBooking.tokenId
            );

            localStorage.setItem(
                "activeTokenId",
                normalizedBooking.tokenId
            );

            sessionStorage.setItem(
                "activeBookingId",
                normalizedBooking.bookingId
            );

            localStorage.setItem(
                "activeBookingId",
                normalizedBooking.bookingId
            );

            sessionStorage.setItem(
                "kisanSetuTokenId",
                normalizedBooking.tokenId
            );

            localStorage.setItem(
                "kisanSetuTokenId",
                normalizedBooking.tokenId
            );

            sessionStorage.setItem(
                "selectedTimeSlot",
                normalizedBooking.timeSlot
            );

            localStorage.setItem(
                "selectedTimeSlot",
                normalizedBooking.timeSlot
            );

            sessionStorage.setItem(
                "vehicleNumber",
                normalizedBooking.vehicleNumber
            );

            localStorage.setItem(
                "vehicleNumber",
                normalizedBooking.vehicleNumber
            );


            // ----------------------------------
            // STAGE 4
            // ----------------------------------

            updateStage4FromBooking(
                normalizedBooking
            );

            if (
                typeof window.refreshStage4 ===
                "function"
            ) {

                window.refreshStage4();
            }


            // ----------------------------------
            // NOTIFICATION MODAL
            // ----------------------------------

            updateNotificationModal(
                normalizedBooking
            );


            const modal =
                document.getElementById(
                    "notification-fanout-modal"
                );

            if (modal) {
                modal.classList.add(
                    "open"
                );
            }


            // ----------------------------------
            // REFRESH AVAILABILITY
            // ----------------------------------

            refreshSlotAvailability();


            console.log(
                "[Stage 3] Booking successful:",
                normalizedBooking
            );


        } catch (error) {

            console.error(
                "[Stage 3] Booking error:",
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

                if (
                    originalHTML
                ) {

                    bookingButton.innerHTML =
                        originalHTML;
                }
            }

            bookingInProgress =
                false;
        }
    }


    // ==========================================
    // BACKEND ERROR
    // ==========================================

    function getBackendErrorMessage(
        status,
        data
    ) {

        if (
            data?.code ===
                "SLOT_CAPACITY_EXCEEDED" &&
            data.availability
        ) {

            return (
                `This slot cannot accept the requested quantity.\n\n` +
                `Capacity: ${data.availability.capacityQuintals} qtl\n` +
                `Booked: ${data.availability.bookedQuintals} qtl\n` +
                `Remaining: ${data.availability.remainingQuintals} qtl`
            );
        }


        if (
            data?.code ===
            "SLOT_FULL"
        ) {

            return (
                data.message ||
                "This slot is full. Please choose another slot."
            );
        }


        if (
            data?.code ===
            "FARMER_DATE_ALREADY_BOOKED"
        ) {

            return (
                "This farmer already has an active booking for this date."
            );
        }


        if (
            data?.message
        ) {

            return data.message;
        }


        if (
            status === 409
        ) {

            return (
                "The selected slot cannot accept this booking. Please choose another available slot."
            );
        }


        return (
            `Slot booking failed (HTTP ${status}).`
        );
    }


    // ==========================================
    // BOOKING ERROR
    // ==========================================

    function showBookingError(
        message
    ) {

        /*
         * Keep booking errors local to Stage 3.
         * No global alert is fired by initialization.
         */

        alert(
            `Slot booking failed:\n\n${message}`
        );
    }


    // ==========================================
    // STAGE 4 SYNCHRONIZATION
    // ==========================================

    function updateStage4FromBooking(
        booking
    ) {

        const token =
            document.getElementById(
                "token-display-id"
            );

        if (token) {
            token.innerText =
                booking.tokenId;
        }


        const farmerDescription =
            document.getElementById(
                "token-farmer-desc"
            );

        if (farmerDescription) {

            farmerDescription.innerText =
                `${booking.farmerName || getFarmerName()} • ${
                    booking.cropType || "Crop"
                }`;
        }


        const gateElement =
            document.querySelector(
                "#stage-view-4 .card-panel strong"
            );

        if (
            gateElement &&
            booking.timeSlot
        ) {

            gateElement.innerText =
                booking.timeSlot;
        }


        const qrFarmer =
            document.getElementById(
                "qr-farmer-name"
            );

        if (qrFarmer) {
            qrFarmer.innerText =
                booking.farmerName ||
                getFarmerName();
        }


        const qrCrop =
            document.getElementById(
                "qr-crop-type"
            );

        if (qrCrop) {
            qrCrop.innerText =
                booking.cropType ||
                "Crop";
        }


        const qrQuantity =
            document.getElementById(
                "qr-booked-qty"
            );

        if (qrQuantity) {

            qrQuantity.innerText =
                `${booking.quantityQuintals} Quintals`;
        }


        const qrCentre =
            document.getElementById(
                "qr-mandi-centre"
            );

        if (qrCentre) {

            qrCentre.innerText =
                booking.center ||
                currentTargetMandi;
        }


        const qrVehicle =
            document.getElementById(
                "qr-vehicle-plate"
            );

        if (qrVehicle) {

            qrVehicle.innerText =
                booking.vehicleNumber ||
                "Not provided";
        }
    }


    // ==========================================
    // NOTIFICATION MODAL
    // ==========================================

    function updateNotificationModal(
        booking
    ) {

        const alertText =
            document.getElementById(
                "modal-alert-text"
            );

        const modalToken =
            document.getElementById(
                "modal-token-tag"
            );


        if (modalToken) {

            modalToken.innerText =
                booking.tokenId;
        }


        if (alertText) {

            alertText.innerText =
                `DoCA Alert: Slot confirmed for ${
                    booking.farmerName ||
                    getFarmerName()
                }. Token: ${
                    booking.tokenId
                } for ${
                    booking.cropType
                } (${
                    booking.quantityQuintals
                } qtl) on ${
                    booking.date
                } (${
                    booking.timeSlot
                }) at ${
                    booking.center ||
                    currentTargetMandi
                }.`;
        }
    }


    // ==========================================
    // EXISTING BOOKING RESTORE
    // ==========================================

    function restoreExistingBooking() {

        const booking =
            getJSON(
                "kisanSetuBooking"
            );

        if (!booking) {
            return;
        }

        if (
            !booking.tokenId
        ) {
            return;
        }

        updateStage4FromBooking(
            booking
        );

        console.log(
            "[Stage 3] Existing booking restored:",
            booking.tokenId
        );
    }


    // ==========================================
    // INITIALIZATION
    // ==========================================

    function initialize() {

        initializeDateField();

        initializeTimeSlots();

        restoreExistingBooking();


        const crop =
            document.getElementById(
                "crop-select"
            );

        const quantity =
            document.getElementById(
                "qty-input"
            );


        if (crop) {

            crop.onchange =
                function () {
                    updateMandiStatus();
                };
        }


        if (quantity) {

            quantity.oninput =
                function () {
                    updateMandiStatus();
                };
        }


        const bookingButton =
            getBookingButton();

        if (bookingButton) {

            bookingButton.onclick =
                submitSlotBooking;
        }


        const rerouteButton =
            document.querySelector(
                "#stage-view-3 .btn-reroute"
            );

        if (rerouteButton) {

            rerouteButton.onclick =
                applyReroute;
        }


        refreshSlotAvailability();


        console.log(
            "[Stage 3] Initialized."
        );
    }


    // ==========================================
    // EXPOSE
    // ==========================================

    window.selectSlot =
        selectSlot;

    window.updateMandiStatus =
        updateMandiStatus;

    window.applyReroute =
        applyReroute;

    window.submitSlotBooking =
        submitSlotBooking;

    window.refreshSlotAvailability =
        refreshSlotAvailability;

    window.updateStage4FromBooking =
        updateStage4FromBooking;


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );

    } else {

        initialize();
    }

})();