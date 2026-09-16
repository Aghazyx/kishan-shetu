(function () {
    "use strict";

    // ==========================================
    // KISAN SETU - STAGE 4
    // DIGITAL TOKEN, LIVE QUEUE & TOKEN SLIP
    // ==========================================

    const STAGE4_API_BASE_URL =
        "http://localhost:5050";

    // ==========================================
    // INITIALIZATION
    // ==========================================

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            console.log(
                "[Stage 4] Initializing..."
            );

            setupStage4Buttons();

            const booking =
                getStoredBooking();

            if (!booking) {

                console.warn(
                    "[Stage 4] No active booking found yet."
                );

                return;
            }

            refreshStage4();
        }
    );


    // ==========================================
    // GET STORED BOOKING
    // ==========================================

    function getStoredBooking() {

        const storedBooking =
            sessionStorage.getItem(
                "kisanSetuBooking"
            );

        if (!storedBooking) {

            return null;
        }

        try {

            const booking =
                JSON.parse(
                    storedBooking
                );

            if (
                !booking ||
                typeof booking !== "object"
            ) {

                console.error(
                    "[Stage 4] Stored booking is empty."
                );

                return null;
            }

            return booking;

        } catch (error) {

            console.error(
                "[Stage 4] Failed to parse booking:",
                error
            );

            return null;
        }
    }


    // ==========================================
    // GET TOKEN ID
    // ==========================================

    function getTokenId(
        booking
    ) {

        return (
            booking?.tokenId ||
            sessionStorage.getItem(
                "tokenId"
            ) ||
            sessionStorage.getItem(
                "activeTokenId"
            ) ||
            sessionStorage.getItem(
                "kisanSetuTokenId"
            ) ||
            ""
        );
    }


    // ==========================================
    // GET FARMER NAME
    // ==========================================

    function getFarmerName(
        booking
    ) {

        if (
            booking?.farmerName &&
            booking.farmerName !==
                "Not fetched" &&
            booking.farmerName !==
                "Verified Farmer"
        ) {

            return booking.farmerName;
        }


        const savedName =
            sessionStorage.getItem(
                "verifiedFarmerName"
            );


        if (
            savedName &&
            savedName !==
                "Not fetched" &&
            savedName !==
                "Verified Farmer"
        ) {

            return savedName;
        }


        const savedFarmer =
            sessionStorage.getItem(
                "verifiedFarmer"
            );


        if (savedFarmer) {

            try {

                const farmer =
                    JSON.parse(
                        savedFarmer
                    );

                if (
                    farmer?.name
                ) {

                    return farmer.name;
                }

            } catch (error) {

                console.warn(
                    "[Stage 4] Unable to parse verified farmer data."
                );
            }
        }


        const visibleName =
            document
                .getElementById(
                    "farmer-name-val"
                )
                ?.innerText
                ?.trim();


        if (
            visibleName &&
            visibleName !==
                "Not fetched" &&
            visibleName !==
                "Verified Farmer"
        ) {

            return visibleName;
        }


        return "Verified Farmer";
    }


    // ==========================================
    // GET CROP DISPLAY TEXT
    // ==========================================

    function getCropText(
        booking
    ) {

        if (
            booking?.cropText
        ) {

            return booking.cropText;
        }


        const cropElement =
            document.getElementById(
                "crop-select"
            );


        if (cropElement) {

            const selectedOption =
                cropElement.options[
                    cropElement.selectedIndex
                ];


            if (
                selectedOption &&
                selectedOption.text
            ) {

                return selectedOption.text;
            }
        }


        return (
            booking?.cropType ||
            "Crop"
        );
    }


    // ==========================================
    // GET VEHICLE NUMBER
    // ==========================================

    function getVehicleNumber(
        booking
    ) {

        return (
            booking?.vehicleNumber ||
            sessionStorage.getItem(
                "vehicleNumber"
            ) ||
            "Not provided"
        );
    }


    // ==========================================
    // GET MANDI / CENTER
    // ==========================================

    function getCenter(
        booking
    ) {

        return (
            booking?.center ||
            booking?.centerName ||
            "Khanna Grain Market"
        );
    }


    // ==========================================
    // GET CENTER ID
    // ==========================================

    function getCenterId(
        booking
    ) {

        return (
            booking?.centerId ||
            sessionStorage.getItem(
                "selectedCenterId"
            ) ||
            ""
        );
    }


    // ==========================================
    // GET TIME SLOT
    // ==========================================

    function getTimeSlot(
        booking
    ) {

        return (
            booking?.timeSlot ||
            sessionStorage.getItem(
                "selectedTimeSlot"
            ) ||
            "09:00 AM - 11:00 AM"
        );
    }


    // ==========================================
    // GET BOOKED QUANTITY
    // ==========================================

    function getBookedQuantity(
        booking
    ) {

        const quantity =
            Number(
                booking?.quantityQuintals
            );


        if (
            Number.isFinite(
                quantity
            )
        ) {

            return quantity;
        }


        const estimatedQuantity =
            Number(
                booking?.estimatedQuantityQuintals
            );


        if (
            Number.isFinite(
                estimatedQuantity
            )
        ) {

            return estimatedQuantity;
        }


        return 0;
    }


    // ==========================================
    // POPULATE STAGE 4
    // ==========================================

    function populateStage4(
        booking
    ) {

        if (!booking) {

            return;
        }


        const farmerName =
            getFarmerName(
                booking
            );

        const cropText =
            getCropText(
                booking
            );

        const vehicleNumber =
            getVehicleNumber(
                booking
            );

        const center =
            getCenter(
                booking
            );

        const centerId =
            getCenterId(
                booking
            );

        const timeSlot =
            getTimeSlot(
                booking
            );

        const quantity =
            getBookedQuantity(
                booking
            );

        const tokenId =
            getTokenId(
                booking
            );


        // ======================================
        // TOKEN
        // ======================================

        setText(
            "token-display-id",
            tokenId
        );


        // ======================================
        // FARMER + CROP
        // ======================================

        setText(
            "token-farmer-desc",
            `${farmerName} • ${cropText}`
        );


        // ======================================
        // GATE ENTRY WINDOW
        // ======================================

        updateGateEntryWindow(
            timeSlot
        );


        // ======================================
        // QR / TOKEN SLIP
        // ======================================

        setText(
            "qr-farmer-name",
            farmerName
        );

        setText(
            "qr-crop-type",
            cropText
        );

        setText(
            "qr-booked-qty",
            `${quantity} Quintals`
        );

        setText(
            "qr-mandi-centre",
            center
        );

        setText(
            "qr-vehicle-plate",
            vehicleNumber
        );

        setText(
            "qr-date-slot",
            `${booking.date || "Not specified"} • ${timeSlot}`
        );


        // ======================================
        // DISPATCH MESSAGE
        // ======================================

        const dispatchElement =
            document.getElementById(
                "dispatch-status-text"
            );


        if (dispatchElement) {

            dispatchElement.innerText =
                `"Vehicle ${vehicleNumber}, your estimated gate entry is being tracked. Current gate processing is simulated for this prototype."`;
        }


        console.log(
            "[Stage 4] UI synchronized:",
            {
                token:
                    tokenId,

                bookingId:
                    booking.bookingId,

                farmer:
                    farmerName,

                crop:
                    cropText,

                quantity,

                vehicle:
                    vehicleNumber,

                center,

                centerId,

                date:
                    booking.date,

                timeSlot
            }
        );
    }


    // ==========================================
    // REFRESH STAGE 4
    // ==========================================

    async function refreshStage4() {

        const booking =
            getStoredBooking();


        if (!booking) {

            console.warn(
                "[Stage 4] Nothing to refresh."
            );

            return;
        }


        populateStage4(
            booking
        );


        generateAuditHash(
            booking
        );


        await loadQueueTelemetry(
            booking
        );
    }


    // ==========================================
    // SAFE TEXT HELPER
    // ==========================================

    function setText(
        elementId,
        value
    ) {

        const element =
            document.getElementById(
                elementId
            );


        if (element) {

            element.innerText =
                value ?? "";
        }
    }


    // ==========================================
    // UPDATE GATE ENTRY WINDOW
    // ==========================================

    function updateGateEntryWindow(
        timeSlot
    ) {

        const stage4 =
            document.getElementById(
                "stage-view-4"
            );


        if (!stage4) {

            return;
        }


        const pills =
            stage4.querySelectorAll(
                ".glass-pill"
            );


        pills.forEach(
            function (pill) {

                const label =
                    pill.querySelector(
                        "small"
                    );


                if (!label) {

                    return;
                }


                if (
                    label.innerText
                        .trim()
                        .toLowerCase()
                        .includes(
                            "gate entry window"
                        )
                ) {

                    const value =
                        pill.querySelector(
                            "strong"
                        );


                    if (value) {

                        value.innerText =
                            timeSlot;
                    }
                }
            }
        );
    }


    // ==========================================
    // STAGE 4 BUTTON SETUP
    // ==========================================

    function setupStage4Buttons() {

        const stage4 =
            document.getElementById(
                "stage-view-4"
            );


        if (!stage4) {

            return;
        }


        const buttons =
            stage4.querySelectorAll(
                "button"
            );


        buttons.forEach(
            function (button) {

                const text =
                    String(
                        button.innerText || ""
                    )
                        .trim()
                        .toLowerCase();


                if (
                    text.includes(
                        "print token slip"
                    )
                ) {

                    button.onclick =
                        openQRSlipModal;

                } else if (
                    text.includes(
                        "audit hash"
                    )
                ) {

                    button.onclick =
                        showAuditHash;

                } else if (
                    text.includes(
                        "simulate automated departure alert"
                    )
                ) {

                    button.onclick =
                        triggerSimulatedSMS;
                }
            }
        );


        console.log(
            "[Stage 4] Buttons connected."
        );
    }


    // ==========================================
    // QR TOKEN SLIP MODAL
    // ==========================================

    function openQRSlipModal() {

        const modal =
            document.getElementById(
                "qr-slip-modal"
            );


        if (!modal) {

            console.error(
                "[Stage 4] QR slip modal not found."
            );

            return;
        }


        const booking =
            getStoredBooking();


        if (!booking) {

            alert(
                "No active procurement token found."
            );

            return;
        }


        populateStage4(
            booking
        );


        modal.classList.add(
            "open"
        );


        console.log(
            "[Stage 4] Token slip opened:",
            getTokenId(
                booking
            )
        );
    }


    // ==========================================
    // CLOSE QR MODAL
    // ==========================================

    function closeQRModal() {

        const modal =
            document.getElementById(
                "qr-slip-modal"
            );


        if (modal) {

            modal.classList.remove(
                "open"
            );
        }
    }


    // ==========================================
    // PRINT TOKEN SLIP
    // ==========================================

    function printTokenSlip() {

        const booking =
            getStoredBooking();


        if (!booking) {

            alert(
                "No active procurement token found."
            );

            return;
        }


        populateStage4(
            booking
        );


        const modal =
            document.getElementById(
                "qr-slip-modal"
            );


        if (modal) {

            modal.classList.add(
                "open"
            );
        }


        setTimeout(
            function () {

                window.print();

            },
            150
        );
    }


    // ==========================================
    // GENERATE AUDIT HASH
    // ==========================================

    async function generateAuditHash(
        booking
    ) {

        if (
            !window.crypto ||
            !window.crypto.subtle
        ) {

            console.warn(
                "[Stage 4] Web Crypto unavailable."
            );

            return null;
        }


        try {

            const auditPayload =
                JSON.stringify({

                    bookingId:
                        booking.bookingId ||
                        "",

                    tokenId:
                        getTokenId(
                            booking
                        ),

                    kccNumber:
                        booking.kccNumber ||
                        "",

                    cropType:
                        booking.cropType ||
                        "",

                    quantityQuintals:
                        booking.quantityQuintals ??
                        booking.estimatedQuantityQuintals ??
                        0,

                    date:
                        booking.date ||
                        "",

                    centerId:
                        getCenterId(
                            booking
                        ),

                    center:
                        booking.center ||
                        booking.centerName ||
                        "",

                    timeSlot:
                        booking.timeSlot ||
                        "",

                    vehicleNumber:
                        booking.vehicleNumber ||
                        ""
                });


            const encodedData =
                new TextEncoder().encode(
                    auditPayload
                );


            const hashBuffer =
                await window.crypto.subtle.digest(
                    "SHA-256",
                    encodedData
                );


            const hashArray =
                Array.from(
                    new Uint8Array(
                        hashBuffer
                    )
                );


            const hash =
                hashArray
                    .map(
                        function (byte) {

                            return byte
                                .toString(16)
                                .padStart(
                                    2,
                                    "0"
                                );
                        }
                    )
                    .join("");


            sessionStorage.setItem(
                "kisanSetuAuditHash",
                hash
            );


            console.log(
                "[Stage 4] Audit fingerprint:",
                hash
            );


            return hash;

        } catch (error) {

            console.error(
                "[Stage 4] Hash generation failed:",
                error
            );

            return null;
        }
    }


    // ==========================================
    // SHOW AUDIT HASH
    // ==========================================

    async function showAuditHash() {

        const booking =
            getStoredBooking();


        if (!booking) {

            alert(
                "No active procurement transaction found."
            );

            return;
        }


        let hash =
            sessionStorage.getItem(
                "kisanSetuAuditHash"
            );


        if (!hash) {

            hash =
                await generateAuditHash(
                    booking
                );
        }


        if (!hash) {

            alert(
                "Unable to generate transaction fingerprint."
            );

            return;
        }


        alert(
            "Kisan Setu Transaction Audit Fingerprint\n\n" +
                `Token: ${getTokenId(
                    booking
                )}\n` +
                `Booking ID: ${
                    booking.bookingId ||
                    "N/A"
                }\n\n` +
                `SHA-256: 0x${hash.substring(
                    0,
                    16
                )}...\n\n` +
                "This fingerprint is generated from the procurement " +
                "transaction data. If the transaction data changes, " +
                "the fingerprint changes as well."
        );
    }


    // ==========================================
    // NORMALIZE QUEUE DATA
    // ==========================================

    function normalizeQueueData(
        rawData
    ) {

        const data =
            rawData?.data ||
            rawData?.queue ||
            rawData ||
            {};


        const queue =
            rawData?.queue ||
            data?.queue ||
            {};


        const positionCandidates = [

            rawData?.queuePosition,

            rawData?.position,

            rawData?.currentPosition,

            rawData?.queue_position,

            rawData?.queueNumber,

            rawData?.queue_number,


            data?.queuePosition,

            data?.position,

            data?.currentPosition,

            data?.queue_position,

            data?.queueNumber,

            data?.queue_number,


            queue?.queuePosition,

            queue?.position,

            queue?.currentPosition,

            queue?.queue_position,

            queue?.queueNumber,

            queue?.queue_number
        ];


        const gateEntryCandidates = [

            rawData?.gateEntryTime,

            rawData?.estimatedGateEntry,

            rawData?.estimatedGateEntryTime,

            rawData?.gate_entry_time,

            rawData?.estimated_gate_entry,


            data?.gateEntryTime,

            data?.estimatedGateEntry,

            data?.estimatedGateEntryTime,

            data?.gate_entry_time,

            data?.estimated_gate_entry,


            queue?.gateEntryTime,

            queue?.estimatedGateEntry,

            queue?.estimatedGateEntryTime,

            queue?.gate_entry_time,

            queue?.estimated_gate_entry
        ];


        const statusCandidates = [

            rawData?.status,

            rawData?.bookingStatus,

            rawData?.queueStatus,


            data?.status,

            data?.bookingStatus,

            data?.queueStatus,


            queue?.status,

            queue?.bookingStatus,

            queue?.queueStatus
        ];


        const firstDefined =
            function (values) {

                return values.find(
                    function (value) {

                        return (
                            value !==
                                undefined &&
                            value !==
                                null &&
                            value !== ""
                        );
                    }
                );
            };


        const rawPosition =
            firstDefined(
                positionCandidates
            );


        const numericPosition =
            Number(
                rawPosition
            );


        let normalizedPosition =
            null;


        if (
            Number.isFinite(
                numericPosition
            ) &&
            numericPosition >= 1
        ) {

            normalizedPosition =
                Math.floor(
                    numericPosition
                );

        } else if (
            typeof rawPosition ===
                "string" &&
            rawPosition.trim()
        ) {

            normalizedPosition =
                rawPosition.trim();
        }


        return {

            queuePosition:
                normalizedPosition,

            gateEntryTime:
                firstDefined(
                    gateEntryCandidates
                ) || null,

            status:
                firstDefined(
                    statusCandidates
                ) || null,

            raw:
                rawData
        };
    }


    // ==========================================
    // LIVE QUEUE TELEMETRY
    // ==========================================

    async function loadQueueTelemetry(
        booking
    ) {

        const tokenId =
            getTokenId(
                booking
            );


        if (!tokenId) {

            console.warn(
                "[Stage 4] No token ID available for queue lookup."
            );

            return;
        }


        try {

            const response =
                await fetch(
                    `${STAGE4_API_BASE_URL}/api/queue/token/${encodeURIComponent(
                        tokenId
                    )}`
                );


            if (!response.ok) {

                throw new Error(
                    `Queue API returned HTTP ${response.status}`
                );
            }


            const data =
                await response.json();


            if (
                data?.success !== true
            ) {

                throw new Error(
                    data?.message ||
                    "Queue lookup failed."
                );
            }


            console.log(
                "[Stage 4] Raw queue response:",
                data
            );


            const normalizedQueue =
                normalizeQueueData(
                    data
                );


            console.log(
                "[Stage 4] Normalized queue data:",
                normalizedQueue
            );


            updateQueueUI(
                normalizedQueue
            );

        } catch (error) {

            console.warn(
                "[Stage 4] Queue telemetry unavailable:",
                error
            );
        }
    }


    // ==========================================
    // UPDATE QUEUE UI
    // ==========================================

    function updateQueueUI(
        queueData
    ) {

        const stage4 =
            document.getElementById(
                "stage-view-4"
            );


        if (!stage4) {

            return;
        }


        const pills =
            stage4.querySelectorAll(
                ".glass-pill"
            );


        pills.forEach(
            function (pill) {

                const labelElement =
                    pill.querySelector(
                        "small"
                    );


                if (!labelElement) {

                    return;
                }


                const label =
                    labelElement.innerText
                        .trim()
                        .toLowerCase();


                // --------------------------------
                // CURRENT POSITION
                // --------------------------------

                if (
                    label.includes(
                        "current position"
                    )
                ) {

                    const heading =
                        pill.querySelector(
                            "h2"
                        );


                    if (!heading) {

                        return;
                    }


                    if (
                        queueData.queuePosition !==
                            null &&
                        queueData.queuePosition !==
                            undefined &&
                        queueData.queuePosition !==
                            ""
                    ) {

                        heading.innerText =
                            `#${queueData.queuePosition}`;

                    } else {

                        heading.innerText =
                            "Awaiting Queue";
                    }
                }


                // --------------------------------
                // ESTIMATED GATE ENTRY
                // --------------------------------

                if (
                    label.includes(
                        "est. gate entry"
                    )
                ) {

                    const heading =
                        pill.querySelector(
                            "h2"
                        );


                    if (!heading) {

                        return;
                    }


                    if (
                        queueData.gateEntryTime
                    ) {

                        heading.innerText =
                            String(
                                queueData.gateEntryTime
                            );

                    } else {

                        heading.innerText =
                            "Calculating...";
                    }
                }


                // --------------------------------
                // STATUS
                // --------------------------------

                if (
                    label ===
                    "status"
                ) {

                    const heading =
                        pill.querySelector(
                            "h2"
                        );


                    if (!heading) {

                        return;
                    }


                    if (
                        queueData.status
                    ) {

                        heading.innerText =
                            String(
                                queueData.status
                            ).toUpperCase();
                    }
                }
            }
        );
    }


    // ==========================================
    // SIMULATED DEPARTURE ALERT
    // ==========================================

    function triggerSimulatedSMS() {

        const booking =
            getStoredBooking();


        if (!booking) {

            alert(
                "No active procurement token found."
            );

            return;
        }


        const vehicleNumber =
            getVehicleNumber(
                booking
            );


        alert(
            "Simulated Dispatch Sent via DLT Gateway:\n\n" +
                `Vehicle ${vehicleNumber}, proceed to Gate 2.\n` +
                `Current token: ${getTokenId(
                    booking
                )}.\n\n` +
                "Channels: SMS Gateway • FCM Push • WhatsApp"
        );


        console.log(
            "[Stage 4] Simulated departure alert sent."
        );
    }


    // ==========================================
    // EXPOSE FUNCTIONS FOR EXISTING HTML
    // ==========================================

    window.openQRSlipModal =
        openQRSlipModal;

    window.closeQRModal =
        closeQRModal;

    window.printTokenSlip =
        printTokenSlip;

    window.showAuditHash =
        showAuditHash;

    window.triggerSimulatedSMS =
        triggerSimulatedSMS;

    window.refreshStage4 =
        refreshStage4;

})();