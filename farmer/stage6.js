(function () {
    "use strict";

    // ==========================================
    // KISAN SETU - STAGE 6
    // WEIGHMENT, QUALITY ASSAY & DIGITAL RECEIPT
    // ==========================================

    const STAGE6_API_BASE_URL =
        "http://localhost:5050";

    // Frontend reference values.
    // Backend remains the final source of truth.
    const MSP_RATES = {
        wheat: 2585,
        paddy: 2441
    };

    const QUALITY_LIMITS = {
        gradeA: {
            moisture: 12,
            foreignMatter: 0.50
        },

        gradeB: {
            moisture: 14,
            foreignMatter: 0.75
        }
    };

    let submissionInProgress = false;
    let listenersAttached = false;


    // ==========================================
    // SAFE DOM HELPER
    // ==========================================

    function getElement(id) {
        return document.getElementById(id);
    }


    // ==========================================
    // STORAGE HELPERS
    // ==========================================

    function getStorageValue(key) {

        const localValue =
            localStorage.getItem(key);

        if (
            localValue !== null &&
            localValue !== ""
        ) {
            return localValue;
        }

        const sessionValue =
            sessionStorage.getItem(key);

        if (
            sessionValue !== null &&
            sessionValue !== ""
        ) {
            return sessionValue;
        }

        return null;
    }


    function setStorageValue(
        key,
        value
    ) {

        const stringValue =
            String(value);

        localStorage.setItem(
            key,
            stringValue
        );

        sessionStorage.setItem(
            key,
            stringValue
        );
    }


    function removeStorageValue(key) {

        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    }


    function getJSONStorageValue(key) {

        const raw =
            getStorageValue(key);

        if (!raw) {
            return null;
        }

        try {

            return JSON.parse(raw);

        } catch (error) {

            console.warn(
                `[Stage 6] Invalid JSON in ${key}:`,
                error
            );

            return null;
        }
    }


    function setJSONStorageValue(
        key,
        value
    ) {

        const serialized =
            JSON.stringify(value);

        localStorage.setItem(
            key,
            serialized
        );

        sessionStorage.setItem(
            key,
            serialized
        );
    }


    // ==========================================
    // GET BOOKING DATA
    // ==========================================

    function getBookingData() {

        const booking =
            getJSONStorageValue(
                "kisanSetuBooking"
            );

        if (booking) {
            return booking;
        }

        return {};
    }


    // ==========================================
    // GET TOKEN ID
    // ==========================================

    function getTokenId() {

        const booking =
            getBookingData();

        return (
            booking?.tokenId ||
            getStorageValue("tokenId") ||
            getStorageValue("activeTokenId") ||
            getStorageValue("kisanSetuTokenId") ||
            ""
        );
    }


    // ==========================================
    // GET CURRENT CROP
    // ==========================================

    function getCurrentCrop() {

        const booking =
            getBookingData();

        return String(
            booking?.cropType ||
            booking?.crop ||
            getStorageValue("cropType") ||
            "wheat"
        ).toLowerCase();
    }


    // ==========================================
    // GET MSP
    // ==========================================

    function getMSP() {

        const crop =
            getCurrentCrop();

        if (
            crop.includes("paddy") ||
            crop.includes("rice")
        ) {

            return MSP_RATES.paddy;
        }

        return MSP_RATES.wheat;
    }


    // ==========================================
    // NORMALIZE NUMBER
    // ==========================================

    function normalizeNumber(value) {

        const number =
            Number(value);

        return Number.isFinite(number)
            ? number
            : 0;
    }


    // ==========================================
    // FORMAT CURRENCY
    // ==========================================

    function formatCurrency(value) {

        return `₹${normalizeNumber(
            value
        ).toLocaleString("en-IN", {
            maximumFractionDigits: 2
        })}`;
    }


    // ==========================================
    // SET TEXT
    // ==========================================

    function setText(
        id,
        value
    ) {

        const element =
            getElement(id);

        if (element) {
            element.textContent = value;
        }
    }


    // ==========================================
    // FIND QUALITY INPUT
    // ==========================================

    function findQualityInput(
        labelText
    ) {

        const labels =
            document.querySelectorAll(
                "#stage-view-6 label, #stage6 label, #stage-6 label, label"
            );

        for (
            const label of labels
        ) {

            const labelContent =
                String(
                    label.textContent || ""
                )
                    .trim()
                    .toLowerCase();

            if (
                !labelContent.includes(
                    labelText.toLowerCase()
                )
            ) {
                continue;
            }


            const forId =
                label.getAttribute("for");

            if (forId) {

                const input =
                    getElement(forId);

                if (input) {
                    return input;
                }
            }


            const nestedInput =
                label.querySelector(
                    "input, textarea, select"
                );

            if (nestedInput) {
                return nestedInput;
            }


            const parentInput =
                label.parentElement
                    ? label.parentElement.querySelector(
                          "input, textarea, select"
                      )
                    : null;

            if (parentInput) {
                return parentInput;
            }
        }

        return null;
    }


    // ==========================================
    // STAGE 6 INITIALIZATION
    // ==========================================

    function initializeStage6() {

        const grossInput =
            getElement(
                "gross-weight-input"
            );

        const tareInput =
            getElement(
                "tare-weight-input"
            );

        const moistureInput =
            findQualityInput(
                "Grain Moisture"
            );

        const foreignMatterInput =
            findQualityInput(
                "Foreign Matter"
            );


        if (grossInput) {
            grossInput.value = "";
        }

        if (tareInput) {
            tareInput.value = "";
        }

        if (moistureInput) {
            moistureInput.value = "";
        }

        if (foreignMatterInput) {
            foreignMatterInput.value = "";
        }


        setText(
            "net-grain-value",
            "0.00 qtl"
        );

        setText(
            "net-kg-display",
            "0 kg"
        );

        setText(
            "final-qty-val",
            "0.00 qtl"
        );

        setText(
            "final-dbt-amount",
            "₹0"
        );

        setText(
            "quality-result-text",
            "Awaiting quality assessment"
        );

        setText(
            "quality-grade-badge",
            "Pending"
        );


        attachInputListeners();
        attachReceiptButton();

        console.log(
            "[Stage 6] Initialized."
        );
    }


    // ==========================================
    // INPUT LISTENERS
    // ==========================================

    function attachInputListeners() {

        if (listenersAttached) {
            return;
        }

        listenersAttached = true;


        const grossInput =
            getElement(
                "gross-weight-input"
            );

        const tareInput =
            getElement(
                "tare-weight-input"
            );

        const moistureInput =
            findQualityInput(
                "Grain Moisture"
            );

        const foreignMatterInput =
            findQualityInput(
                "Foreign Matter"
            );


        if (grossInput) {

            grossInput.addEventListener(
                "input",
                calculateNetProcured
            );

            grossInput.addEventListener(
                "change",
                calculateNetProcured
            );
        }


        if (tareInput) {

            tareInput.addEventListener(
                "input",
                calculateNetProcured
            );

            tareInput.addEventListener(
                "change",
                calculateNetProcured
            );
        }


        if (moistureInput) {

            moistureInput.addEventListener(
                "input",
                evaluateQuality
            );

            moistureInput.addEventListener(
                "change",
                evaluateQuality
            );
        }


        if (foreignMatterInput) {

            foreignMatterInput.addEventListener(
                "input",
                evaluateQuality
            );

            foreignMatterInput.addEventListener(
                "change",
                evaluateQuality
            );
        }
    }


    // ==========================================
    // FIND RECEIPT BUTTON
    // ==========================================

    function findReceiptButton() {

        const stage6 =
            getElement(
                "stage-view-6"
            );

        if (!stage6) {
            return null;
        }

        const buttons =
            stage6.querySelectorAll(
                "button"
            );

        for (
            const button of buttons
        ) {

            const text =
                String(
                    button.textContent || ""
                )
                    .trim()
                    .toLowerCase();

            if (
                text.includes(
                    "issue digital receipt"
                ) ||
                text.includes(
                    "save quality assay"
                ) ||
                text.includes(
                    "generate receipt"
                )
            ) {

                return button;
            }
        }

        return null;
    }


    // ==========================================
    // ATTACH RECEIPT BUTTON
    // ==========================================

    function attachReceiptButton() {

        const receiptButton =
            findReceiptButton();

        if (!receiptButton) {
            return;
        }

        receiptButton.onclick =
            function (event) {

                if (event) {
                    event.preventDefault();
                }

                submitQualityLog();
            };
    }


    // ==========================================
    // CALCULATE NET PROCURED
    // ==========================================

    function calculateNetProcured() {

        const grossInput =
            getElement(
                "gross-weight-input"
            );

        const tareInput =
            getElement(
                "tare-weight-input"
            );

        const grossKg =
            normalizeNumber(
                grossInput?.value
            );

        const tareKg =
            normalizeNumber(
                tareInput?.value
            );


        if (
            grossKg <= 0 ||
            tareKg < 0 ||
            tareKg >= grossKg
        ) {

            setText(
                "net-grain-value",
                "0.00 qtl"
            );

            setText(
                "net-kg-display",
                "0 kg"
            );

            setText(
                "final-qty-val",
                "0.00 qtl"
            );

            setText(
                "final-dbt-amount",
                "₹0"
            );

            return 0;
        }


        const netKg =
            grossKg - tareKg;

        const netQuintals =
            netKg / 100;


        setText(
            "net-grain-value",
            `${netQuintals.toFixed(2)} qtl`
        );

        setText(
            "net-kg-display",
            `${netKg.toFixed(2)} kg`
        );

        setText(
            "final-qty-val",
            `${netQuintals.toFixed(2)} qtl`
        );


        calculatePayout(
            netQuintals
        );


        setStorageValue(
            "kisanSetuFinalQuantityQuintals",
            netQuintals
        );

        setStorageValue(
            "kisanSetuNetWeightKg",
            netKg
        );


        return netQuintals;
    }


    // ==========================================
    // PAYOUT PREVIEW
    // ==========================================

    function calculatePayout(
        quantityQuintals
    ) {

        const quantity =
            normalizeNumber(
                quantityQuintals
            );

        const payout =
            quantity * getMSP();


        setText(
            "final-dbt-amount",
            formatCurrency(
                payout
            )
        );


        return payout;
    }


    // ==========================================
    // QUALITY EVALUATION
    // ==========================================

    function evaluateQuality() {

        const moistureInput =
            findQualityInput(
                "Grain Moisture"
            );

        const foreignMatterInput =
            findQualityInput(
                "Foreign Matter"
            );


        if (
            !moistureInput ||
            !foreignMatterInput
        ) {

            console.warn(
                "[Stage 6] Quality inputs not found."
            );

            return {
                grade: "PENDING",
                approved: false,
                moisture: 0,
                foreignMatter: 0
            };
        }


        if (
            moistureInput.value === "" ||
            foreignMatterInput.value === ""
        ) {

            updateQualityUI(
                "PENDING"
            );

            return {
                grade: "PENDING",
                approved: false,
                moisture: 0,
                foreignMatter: 0
            };
        }


        const moisture =
            Number(
                moistureInput.value
            );

        const foreignMatter =
            Number(
                foreignMatterInput.value
            );


        if (
            !Number.isFinite(moisture) ||
            !Number.isFinite(foreignMatter) ||
            moisture < 0 ||
            moisture > 100 ||
            foreignMatter < 0 ||
            foreignMatter > 100
        ) {

            updateQualityUI(
                "PENDING"
            );

            return {
                grade: "PENDING",
                approved: false,
                moisture,
                foreignMatter
            };
        }


        let grade =
            "FAILED";


        if (
            moisture <=
                QUALITY_LIMITS.gradeA.moisture &&
            foreignMatter <=
                QUALITY_LIMITS.gradeA.foreignMatter
        ) {

            grade = "A";

        } else if (
            moisture <=
                QUALITY_LIMITS.gradeB.moisture &&
            foreignMatter <=
                QUALITY_LIMITS.gradeB.foreignMatter
        ) {

            grade = "B";
        }


        updateQualityUI(
            grade
        );


        setStorageValue(
            "kisanSetuQualityGrade",
            grade
        );

        setStorageValue(
            "kisanSetuMoisture",
            moisture
        );

        setStorageValue(
            "kisanSetuForeignMatter",
            foreignMatter
        );


        return {
            grade,
            approved:
                grade === "A" ||
                grade === "B",
            moisture,
            foreignMatter
        };
    }


    // ==========================================
    // QUALITY UI
    // ==========================================

    function updateQualityUI(
        grade
    ) {

        const resultText =
            getElement(
                "quality-result-text"
            );

        const gradeBadge =
            getElement(
                "quality-grade-badge"
            );


        if (
            grade === "A"
        ) {

            if (resultText) {
                resultText.textContent =
                    "Quality Approved: Grade A";
            }

            if (gradeBadge) {
                gradeBadge.textContent =
                    "Grade A";
            }

            return;
        }


        if (
            grade === "B"
        ) {

            if (resultText) {
                resultText.textContent =
                    "Quality Approved: Grade B";
            }

            if (gradeBadge) {
                gradeBadge.textContent =
                    "Grade B";
            }

            return;
        }


        if (
            grade === "FAILED"
        ) {

            if (resultText) {
                resultText.textContent =
                    "Quality Failed: Does not meet procurement standards.";
            }

            if (gradeBadge) {
                gradeBadge.textContent =
                    "FAILED";
            }

            return;
        }


        if (resultText) {
            resultText.textContent =
                "Enter moisture and foreign matter values.";
        }

        if (gradeBadge) {
            gradeBadge.textContent =
                "Pending";
        }
    }


    // ==========================================
    // VERIFY STAGE 5 COMPLETION
    // ==========================================

    function verifyStage5Completion(
        booking,
        tokenId
    ) {

        const geofenceVerified =
            getStorageValue(
                "geofenceVerified"
            ) === "true";

        const verifiedToken =
            getStorageValue(
                "geofenceTokenId"
            );


        const bookingStatus =
            String(
                booking?.status ||
                booking?.bookingStatus ||
                getStorageValue(
                    "kisanSetuBookingStatus"
                ) ||
                ""
            ).toLowerCase();


        const activeGateQueue =
            bookingStatus ===
            "active gate queue";


        /*
         * Primary path:
         *
         * Stage 5 verified the geofence,
         * the verification belongs to this token,
         * and the booking is now in Active Gate Queue.
         */

        if (
            geofenceVerified &&
            verifiedToken === tokenId &&
            activeGateQueue
        ) {

            return true;
        }


        /*
         * Compatibility path:
         *
         * Some older Stage 5 / booking flows may persist
         * the booking status separately.
         */

        if (
            geofenceVerified &&
            verifiedToken === tokenId
        ) {

            return true;
        }


        return false;
    }


    // ==========================================
    // SUBMIT QUALITY LOG
    // ==========================================

    async function submitQualityLog() {

        if (submissionInProgress) {
            return false;
        }


        const booking =
            getBookingData();

        const tokenId =
            getTokenId();


        // --------------------------------------
        // TOKEN CHECK
        // --------------------------------------

        if (!tokenId) {

            alert(
                "No active digital token was found. Please complete Stage 3 and Stage 4 first."
            );

            return false;
        }


        // --------------------------------------
        // STAGE 5 CHECK
        // --------------------------------------

        if (
            !verifyStage5Completion(
                booking,
                tokenId
            )
        ) {

            alert(
                "Geofence verification is incomplete. Complete Stage 5 check-in before recording weighment and quality."
            );

            return false;
        }


        // --------------------------------------
        // INPUTS
        // --------------------------------------

        const grossInput =
            getElement(
                "gross-weight-input"
            );

        const tareInput =
            getElement(
                "tare-weight-input"
            );

        const moistureInput =
            findQualityInput(
                "Grain Moisture"
            );

        const foreignMatterInput =
            findQualityInput(
                "Foreign Matter"
            );


        if (
            !grossInput ||
            !tareInput ||
            !moistureInput ||
            !foreignMatterInput
        ) {

            alert(
                "Stage 6 input fields could not be found."
            );

            return false;
        }


        // --------------------------------------
        // PARSE VALUES
        // --------------------------------------

        const grossKg =
            Number(
                grossInput.value
            );

        const tareKg =
            Number(
                tareInput.value
            );

        const moisture =
            Number(
                moistureInput.value
            );

        const foreignMatter =
            Number(
                foreignMatterInput.value
            );


        // --------------------------------------
        // WEIGHT VALIDATION
        // --------------------------------------

        if (
            !Number.isFinite(grossKg) ||
            grossKg <= 0
        ) {

            alert(
                "Please enter a valid gross weight."
            );

            return false;
        }


        if (
            !Number.isFinite(tareKg) ||
            tareKg < 0 ||
            tareKg >= grossKg
        ) {

            alert(
                "Please enter a valid tare weight. Tare must be less than gross weight."
            );

            return false;
        }


        // --------------------------------------
        // QUALITY VALIDATION
        // --------------------------------------

        if (
            !Number.isFinite(moisture) ||
            moisture < 0 ||
            moisture > 100
        ) {

            alert(
                "Please enter a valid moisture percentage."
            );

            return false;
        }


        if (
            !Number.isFinite(foreignMatter) ||
            foreignMatter < 0 ||
            foreignMatter > 100
        ) {

            alert(
                "Please enter a valid foreign matter percentage."
            );

            return false;
        }


        const qualityResult =
            evaluateQuality();


        if (
            !qualityResult.approved
        ) {

            alert(
                "The quality assay failed or is incomplete. The procurement transaction cannot be completed."
            );

            return false;
        }


        // --------------------------------------
        // CALCULATE NET WEIGHT
        // --------------------------------------

        const netKg =
            grossKg - tareKg;

        const netQuintals =
            netKg / 100;


        if (
            netQuintals <= 0
        ) {

            alert(
                "Net procurement quantity must be greater than zero."
            );

            return false;
        }


        // --------------------------------------
        // CROP
        // --------------------------------------

        const cropType =
            String(
                booking?.cropType ||
                booking?.crop ||
                getCurrentCrop()
            )
                .trim()
                .toLowerCase();


        // --------------------------------------
        // IMPORTANT BACKEND CONTRACT
        // --------------------------------------
        //
        // The current Kisan Setu backend quality-log
        // endpoint expects weights in QUINTALS.
        //
        // Therefore:
        //
        //  grossKg / 100 = grossWeightQuintals
        //  tareKg  / 100 = tareWeightQuintals
        //
        // The backend calculates the authoritative
        // net quantity and payout.
        // --------------------------------------

        const payload = {

            tokenId:
                tokenId,

            grossWeightQuintals:
                grossKg / 100,

            tareWeightQuintals:
                tareKg / 100,

            moisturePercentage:
                moisture,

            foreignMatterPercentage:
                foreignMatter,

            qualityGrade:
                qualityResult.grade,

            cropType:
                cropType
        };


        console.log(
            "[Stage 6] Quality payload:",
            payload
        );


        submissionInProgress =
            true;


        const receiptButton =
            findReceiptButton();


        let originalButtonHTML =
            "";


        if (receiptButton) {

            originalButtonHTML =
                receiptButton.innerHTML;

            receiptButton.disabled =
                true;

            receiptButton.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Processing Quality Assay...';
        }


        try {

            // ----------------------------------
            // BACKEND REQUEST
            // ----------------------------------

            const response =
                await fetch(
                    `${STAGE6_API_BASE_URL}/api/procurement/quality-log`,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


            // ----------------------------------
            // PARSE RESPONSE
            // ----------------------------------

            let data = {};

            try {

                data =
                    await response.json();

            } catch (error) {

                throw new Error(
                    "Server returned an invalid response."
                );
            }


            console.log(
                "[Stage 6] Backend response:",
                data
            );


            // ----------------------------------
            // HTTP ERROR
            // ----------------------------------

            if (
                !response.ok
            ) {

                throw new Error(
                    data.message ||
                    data.error ||
                    `Quality logging failed with HTTP ${response.status}.`
                );
            }


            // ----------------------------------
            // API ERROR
            // ----------------------------------

            if (
                data.success === false
            ) {

                throw new Error(
                    data.message ||
                    "Backend rejected the quality log."
                );
            }


            // ----------------------------------
            // RECEIPT
            // ----------------------------------

            const receipt =
                data.receipt ||
                data.data ||
                null;


            if (!receipt) {

                throw new Error(
                    "Backend accepted the quality log but did not return a digital receipt."
                );
            }


            // ----------------------------------
            // NORMALIZE RECEIPT
            // ----------------------------------

            const normalizedReceipt =
                normalizeReceipt(
                    receipt,
                    {
                        grossKg,
                        tareKg,
                        netKg,
                        netQuintals,
                        moisture,
                        foreignMatter,
                        qualityGrade:
                            qualityResult.grade,
                        cropType
                    }
                );


            // ----------------------------------
            // SAVE RECEIPT
            // ----------------------------------

            setJSONStorageValue(
                "kisanSetuReceipt",
                normalizedReceipt
            );

            setJSONStorageValue(
                "receiptData",
                normalizedReceipt
            );


            const receiptId =
                normalizedReceipt.receiptId ||
                normalizedReceipt.receiptNumber ||
                normalizedReceipt.id ||
                "";


            if (receiptId) {

                setStorageValue(
                    "activeReceiptId",
                    receiptId
                );
            }


            // ----------------------------------
            // SAVE FINAL PROCUREMENT DATA
            // ----------------------------------

            setStorageValue(
                "kisanSetuFinalQuantityQuintals",
                normalizedReceipt.netWeightQuintals
            );

            setStorageValue(
                "kisanSetuNetWeightKg",
                normalizedReceipt.netWeightKg
            );

            setStorageValue(
                "kisanSetuMSP",
                normalizedReceipt.mspPricePerQuintal
            );

            setStorageValue(
                "kisanSetuPayout",
                normalizedReceipt.totalPayoutAmount
            );

            setStorageValue(
                "kisanSetuQualityGrade",
                normalizedReceipt.qualityGrade
            );


            // ----------------------------------
            // UPDATE BOOKING
            // ----------------------------------

            const updatedBooking =
                {
                    ...booking,

                    status:
                        "Quality Approved",

                    bookingStatus:
                        "Quality Approved",

                    qualityLogged:
                        true,

                    qualityGrade:
                        normalizedReceipt.qualityGrade,

                    finalQuantityQuintals:
                        normalizedReceipt.netWeightQuintals,

                    netWeightKg:
                        normalizedReceipt.netWeightKg,

                    mspPricePerQuintal:
                        normalizedReceipt.mspPricePerQuintal,

                    payoutAmount:
                        normalizedReceipt.totalPayoutAmount,

                    receiptId:
                        receiptId,

                    stage6Completed:
                        true,

                    stage6CompletedAt:
                        new Date().toISOString()
                };


            setJSONStorageValue(
                "kisanSetuBooking",
                updatedBooking
            );


            setStorageValue(
                "kisanSetuBookingStatus",
                "Quality Approved"
            );


            // ----------------------------------
            // SUCCESS FLAGS
            // ----------------------------------

            setStorageValue(
                "stage6Completed",
                "true"
            );

            setStorageValue(
                "stage6TokenId",
                tokenId
            );


            // ----------------------------------
            // DISPLAY AUTHORITATIVE DATA
            // ----------------------------------

            displayReceiptData(
                normalizedReceipt
            );


            // ----------------------------------
            // SUCCESS MESSAGE
            // ----------------------------------

            if (receiptId) {

                alert(
                    `Digital receipt generated successfully.\n\nReceipt ID: ${receiptId}`
                );

            } else {

                alert(
                    "Digital receipt generated successfully."
                );
            }


            // ----------------------------------
            // MOVE TO STAGE 7
            // ----------------------------------

            if (
                typeof window.completeStageAndProceed ===
                "function"
            ) {

                window.completeStageAndProceed(
                    6,
                    7
                );

            } else {

                console.warn(
                    "[Stage 6] completeStageAndProceed() is unavailable."
                );
            }


            return true;

        } catch (error) {

            console.error(
                "[Stage 6] Submission failed:",
                error
            );


            alert(
                `Unable to complete weighment and quality logging.\n\n${error.message}`
            );


            return false;

        } finally {

            submissionInProgress =
                false;


            if (receiptButton) {

                receiptButton.disabled =
                    false;

                if (
                    originalButtonHTML
                ) {

                    receiptButton.innerHTML =
                        originalButtonHTML;
                }
            }
        }
    }


    // ==========================================
    // NORMALIZE BACKEND RECEIPT
    // ==========================================

    function normalizeReceipt(
        receipt,
        localData
    ) {

        const backendNetQuintals =
            normalizeNumber(
                receipt.netWeightQuintals
            );


        const backendNetKg =
            normalizeNumber(
                receipt.netWeightKg
            );


        const finalNetQuintals =
            backendNetQuintals > 0
                ? backendNetQuintals
                : backendNetKg > 0
                ? backendNetKg / 100
                : localData.netQuintals;


        const finalNetKg =
            backendNetKg > 0
                ? backendNetKg
                : finalNetQuintals * 100;


        const backendMSP =
            normalizeNumber(
                receipt.mspPricePerQuintal
            );


        const finalMSP =
            backendMSP > 0
                ? backendMSP
                : getMSP();


        const backendPayout =
            normalizeNumber(
                receipt.totalPayoutAmount
            );


        const finalPayout =
            backendPayout > 0
                ? backendPayout
                : finalNetQuintals *
                  finalMSP;


        return {

            ...receipt,

            grossWeight:
                normalizeNumber(
                    receipt.grossWeight
                ) || localData.grossKg,

            tareWeight:
                normalizeNumber(
                    receipt.tareWeight
                ) || localData.tareKg,

            grossWeightKg:
                localData.grossKg,

            tareWeightKg:
                localData.tareKg,

            netWeightKg:
                finalNetKg,

            netWeightQuintals:
                finalNetQuintals,

            actualQuantityQuintals:
                finalNetQuintals,

            moisturePercentage:
                normalizeNumber(
                    receipt.moisturePercentage
                ) || localData.moisture,

            foreignMatterPercentage:
                normalizeNumber(
                    receipt.foreignMatterPercentage
                ) ||
                localData.foreignMatter,

            qualityGrade:
                receipt.qualityGrade ||
                localData.qualityGrade,

            cropType:
                receipt.cropType ||
                localData.cropType,

            mspPricePerQuintal:
                finalMSP,

            totalPayoutAmount:
                finalPayout
        };
    }


    // ==========================================
    // DISPLAY RECEIPT DATA
    // ==========================================

    function displayReceiptData(
        receipt
    ) {

        const quantityQuintals =
            normalizeNumber(
                receipt.netWeightQuintals
            );

        const netKg =
            normalizeNumber(
                receipt.netWeightKg
            );

        const payout =
            normalizeNumber(
                receipt.totalPayoutAmount
            );

        const grade =
            receipt.qualityGrade ||
            "A";


        setText(
            "net-grain-value",
            `${quantityQuintals.toFixed(2)} qtl`
        );

        setText(
            "net-kg-display",
            `${netKg.toFixed(2)} kg`
        );

        setText(
            "final-qty-val",
            `${quantityQuintals.toFixed(2)} qtl`
        );

        setText(
            "final-dbt-amount",
            formatCurrency(
                payout
            )
        );

        setText(
            "quality-result-text",
            `Quality Approved: Grade ${grade}`
        );

        setText(
            "quality-grade-badge",
            `Grade ${grade}`
        );
    }


    // ==========================================
    // EXPOSE FUNCTIONS FOR HTML
    // ==========================================

    window.calculateNetProcured =
        calculateNetProcured;

    window.evaluateQuality =
        evaluateQuality;

    window.submitQualityLog =
        submitQualityLog;


    // ==========================================
    // START
    // ==========================================

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeStage6
        );

    } else {

        initializeStage6();
    }

})();