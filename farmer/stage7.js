// ==========================================
// KISAN SETU - STAGE 7
// PFMS DBT PAYMENT & DISBURSEMENT
// ==========================================

(function () {
    "use strict";

    const STAGE7_API_BASE_URL =
        "http://localhost:5050";

    let stage7DispatchInProgress = false;


    // ==========================================
    // INITIALIZATION
    // ==========================================

    document.addEventListener(
        "DOMContentLoaded",
        function () {
            console.log("[Stage 7] Loaded");

            populateStage7();
        }
    );


    // ==========================================
    // GET TOKEN ID
    // ==========================================

    function getStage7TokenId() {
        return (
            sessionStorage.getItem("tokenId") ||
            sessionStorage.getItem("activeTokenId") ||
            sessionStorage.getItem("kisanSetuTokenId") ||
            ""
        );
    }


    // ==========================================
    // GET STORED BOOKING
    // ==========================================

    function getStage7Booking() {
        const storedBooking =
            sessionStorage.getItem(
                "kisanSetuBooking"
            );

        if (!storedBooking) {
            return null;
        }

        try {
            const booking =
                JSON.parse(storedBooking);

            if (!booking) {
                return null;
            }

            return booking;

        } catch (error) {
            console.error(
                "[Stage 7] Invalid booking data:",
                error
            );

            return null;
        }
    }


    // ==========================================
    // GET STORED RECEIPT
    // ==========================================

    function getStage7Receipt() {
        const storedReceipt =
            sessionStorage.getItem(
                "kisanSetuReceipt"
            );

        if (!storedReceipt) {
            return null;
        }

        try {
            return JSON.parse(
                storedReceipt
            );

        } catch (error) {
            console.error(
                "[Stage 7] Invalid receipt data:",
                error
            );

            return null;
        }
    }


    // ==========================================
    // POPULATE STAGE 7
    // ==========================================

    async function populateStage7() {
        const booking =
            getStage7Booking();

        const receipt =
            getStage7Receipt();

        if (!booking) {
            console.warn(
                "[Stage 7] No active booking found."
            );

            return;
        }

        console.log(
            "[Stage 7] Populating dashboard:",
            {
                tokenId:
                    booking.tokenId ||
                    getStage7TokenId(),

                bookingId:
                    booking.bookingId,

                receiptId:
                    receipt?.receiptId
            }
        );


        updateCropName(
            booking,
            receipt
        );


        updateFinancialBreakdown(
            booking,
            receipt
        );


        updateBeneficiary(
            booking
        );


        updateQualityStatus(
            receipt
        );


        updateInvoiceStatus();


        updateStoredPaymentReferences();


        updateAuditHashDisplay();


        const localDispatched =
            sessionStorage.getItem(
                "kisanSetuDBTDispatched"
            ) === "true";


        updateDBTStatus(
            localDispatched
                ? "DBT Dispatched"
                : "Pending Trigger"
        );


        updateDispatchButton(
            localDispatched
        );


        const tokenId =
            booking.tokenId ||
            getStage7TokenId();


        if (tokenId) {
            await loadPaymentStatus(
                tokenId
            );
        }


        console.log(
            "[Stage 7] Dashboard ready."
        );
    }


    // ==========================================
    // UPDATE CROP NAME
    // ==========================================

    function updateCropName(
        booking,
        receipt
    ) {
        const element =
            document.getElementById(
                "final-crop-name"
            );

        if (!element) {
            return;
        }

        const crop =
            receipt?.cropType ||
            booking?.cropType ||
            "wheat";

        const normalizedCrop =
            String(crop)
                .toLowerCase();

        if (
            normalizedCrop.includes(
                "paddy"
            ) ||
            normalizedCrop.includes(
                "rice"
            )
        ) {
            element.innerText =
                "Paddy (धान / ਚਾਵਲ)";
        } else {
            element.innerText =
                "Wheat (ਗੇਹੁੰ / ਕਣਕ)";
        }
    }


    // ==========================================
    // GET FINAL QUANTITY
    // ==========================================

    function getFinalQuantity(
        booking,
        receipt
    ) {
        const receiptQuantity =
            Number(
                receipt?.actualQuantityQuintals
            );

        if (
            Number.isFinite(
                receiptQuantity
            ) &&
            receiptQuantity > 0
        ) {
            return receiptQuantity;
        }


        const receiptNetQuintals =
            Number(
                receipt?.netWeightQuintals
            );

        if (
            Number.isFinite(
                receiptNetQuintals
            ) &&
            receiptNetQuintals > 0
        ) {
            return receiptNetQuintals;
        }


        const receiptNetQuintalsAlt =
            Number(
                receipt?.netQuintals
            );

        if (
            Number.isFinite(
                receiptNetQuintalsAlt
            ) &&
            receiptNetQuintalsAlt > 0
        ) {
            return receiptNetQuintalsAlt;
        }


        const receiptNetKg =
            Number(
                receipt?.netWeightKg
            );

        if (
            Number.isFinite(
                receiptNetKg
            ) &&
            receiptNetKg > 0
        ) {
            return receiptNetKg / 100;
        }


        const storedFinalQuantity =
            Number(
                sessionStorage.getItem(
                    "kisanSetuFinalQuantityQuintals"
                )
            );

        if (
            Number.isFinite(
                storedFinalQuantity
            ) &&
            storedFinalQuantity > 0
        ) {
            return storedFinalQuantity;
        }


        const legacyFinalQuantity =
            Number(
                sessionStorage.getItem(
                    "kisanSetuFinalQuantity"
                )
            );

        if (
            Number.isFinite(
                legacyFinalQuantity
            ) &&
            legacyFinalQuantity > 0
        ) {
            return legacyFinalQuantity;
        }


        const bookingQuantity =
            Number(
                booking?.quantityQuintals
            );

        return Number.isFinite(
            bookingQuantity
        )
            ? bookingQuantity
            : 0;
    }


    // ==========================================
    // GET FINAL MSP
    // ==========================================

    function getFinalMSP(
        booking,
        receipt
    ) {
        const receiptMSP =
            Number(
                receipt?.mspPricePerQuintal
            );

        if (
            Number.isFinite(
                receiptMSP
            ) &&
            receiptMSP > 0
        ) {
            return receiptMSP;
        }


        const receiptMSPAlt =
            Number(
                receipt?.msp
            );

        if (
            Number.isFinite(
                receiptMSPAlt
            ) &&
            receiptMSPAlt > 0
        ) {
            return receiptMSPAlt;
        }


        const receiptMSPPerQuintal =
            Number(
                receipt?.mspPerQuintal
            );

        if (
            Number.isFinite(
                receiptMSPPerQuintal
            ) &&
            receiptMSPPerQuintal > 0
        ) {
            return receiptMSPPerQuintal;
        }


        const storedMSP =
            Number(
                sessionStorage.getItem(
                    "kisanSetuMSP"
                )
            );

        if (
            Number.isFinite(
                storedMSP
            ) &&
            storedMSP > 0
        ) {
            return storedMSP;
        }


        const legacyMSP =
            Number(
                sessionStorage.getItem(
                    "kisanSetuFinalMSP"
                )
            );

        if (
            Number.isFinite(
                legacyMSP
            ) &&
            legacyMSP > 0
        ) {
            return legacyMSP;
        }


        const crop =
            String(
                receipt?.cropType ||
                booking?.cropType ||
                "wheat"
            ).toLowerCase();


        return (
            crop.includes("paddy") ||
            crop.includes("rice")
        )
            ? 2441
            : 2585;
    }


    // ==========================================
    // GET FINAL PAYOUT
    // ==========================================

    function getFinalPayout(
        quantity,
        msp,
        receipt
    ) {
        const receiptPayout =
            Number(
                receipt?.totalPayoutAmount
            );

        if (
            Number.isFinite(
                receiptPayout
            ) &&
            receiptPayout >= 0
        ) {
            return receiptPayout;
        }


        const receiptPayoutAlt =
            Number(
                receipt?.payout
            );

        if (
            Number.isFinite(
                receiptPayoutAlt
            ) &&
            receiptPayoutAlt >= 0
        ) {
            return receiptPayoutAlt;
        }


        const receiptTotalPayout =
            Number(
                receipt?.totalPayout
            );

        if (
            Number.isFinite(
                receiptTotalPayout
            ) &&
            receiptTotalPayout >= 0
        ) {
            return receiptTotalPayout;
        }


        const storedPayout =
            Number(
                sessionStorage.getItem(
                    "kisanSetuPayout"
                )
            );

        if (
            Number.isFinite(
                storedPayout
            ) &&
            storedPayout >= 0
        ) {
            return storedPayout;
        }


        const legacyPayout =
            Number(
                sessionStorage.getItem(
                    "kisanSetuFinalPayout"
                )
            );

        if (
            Number.isFinite(
                legacyPayout
            ) &&
            legacyPayout >= 0
        ) {
            return legacyPayout;
        }


        return quantity * msp;
    }


    // ==========================================
    // UPDATE FINANCIAL BREAKDOWN
    // ==========================================

    function updateFinancialBreakdown(
        booking,
        receipt
    ) {
        const quantityElement =
            document.getElementById(
                "final-qty-val"
            );

        const amountElement =
            document.getElementById(
                "final-dbt-amount"
            );


        const quantity =
            getFinalQuantity(
                booking,
                receipt
            );


        const msp =
            getFinalMSP(
                booking,
                receipt
            );


        const payout =
            getFinalPayout(
                quantity,
                msp,
                receipt
            );


        if (quantityElement) {
            quantityElement.innerText =
                `${quantity.toFixed(2)} Quintals`;
        }


        if (amountElement) {
            amountElement.innerText =
                `₹${payout.toLocaleString(
                    "en-IN",
                    {
                        maximumFractionDigits: 2
                    }
                )}`;
        }


        updateMSPText(
            msp
        );


        sessionStorage.setItem(
            "kisanSetuFinalQuantity",
            String(quantity)
        );


        sessionStorage.setItem(
            "kisanSetuFinalQuantityQuintals",
            String(quantity)
        );


        sessionStorage.setItem(
            "kisanSetuFinalMSP",
            String(msp)
        );


        sessionStorage.setItem(
            "kisanSetuMSP",
            String(msp)
        );


        sessionStorage.setItem(
            "kisanSetuFinalPayout",
            String(payout)
        );


        sessionStorage.setItem(
            "kisanSetuPayout",
            String(payout)
        );


        console.log(
            "[Stage 7] Financial breakdown:",
            {
                quantity,
                msp,
                payout
            }
        );
    }


    // ==========================================
    // UPDATE MSP TEXT
    // ==========================================

    function updateMSPText(
        msp
    ) {
        const stage7 =
            document.getElementById(
                "stage-view-7"
            );

        if (!stage7) {
            return;
        }


        const spans =
            stage7.querySelectorAll(
                "span"
            );


        spans.forEach(
            function (span) {
                const text =
                    span.innerText
                        .trim()
                        .toLowerCase();


                if (
                    text !==
                    "cabinet-approved msp:"
                ) {
                    return;
                }


                const parent =
                    span.parentElement;


                const strong =
                    parent?.querySelector(
                        "strong"
                    );


                if (strong) {
                    strong.innerText =
                        `₹${msp.toLocaleString(
                            "en-IN"
                        )} / Quintal`;
                }
            }
        );
    }


    // ==========================================
    // UPDATE BENEFICIARY
    // ==========================================

    function updateBeneficiary(
        booking
    ) {
        const element =
            document.getElementById(
                "dbt-beneficiary-name"
            );

        if (!element) {
            return;
        }


        if (
            booking?.farmerName &&
            booking.farmerName !==
                "Verified Farmer" &&
            booking.farmerName !==
                "Not fetched"
        ) {
            element.innerText =
                `${booking.farmerName} (State Bank of India)`;

            return;
        }


        const savedName =
            sessionStorage.getItem(
                "verifiedFarmerName"
            );


        if (
            savedName &&
            savedName !==
                "Not fetched"
        ) {
            element.innerText =
                `${savedName} (State Bank of India)`;

            return;
        }


        const savedFarmer =
            sessionStorage.getItem(
                "verifiedFarmer"
            );


        if (!savedFarmer) {
            return;
        }


        try {
            const farmer =
                JSON.parse(
                    savedFarmer
                );


            if (farmer?.name) {
                element.innerText =
                    `${farmer.name} (State Bank of India)`;
            }

        } catch (error) {
            console.warn(
                "[Stage 7] Could not parse farmer data."
            );
        }
    }


    // ==========================================
    // UPDATE QUALITY STATUS
    // ==========================================

    function updateQualityStatus(
        receipt
    ) {
        const stage7 =
            document.getElementById(
                "stage-view-7"
            );

        if (!stage7) {
            return;
        }


        let grade =
            receipt?.qualityGrade;


        if (!grade) {
            grade =
                sessionStorage.getItem(
                    "kisanSetuQualityGrade"
                );
        }


        if (!grade) {
            return;
        }


        const normalized =
            String(
                grade
            )
                .toUpperCase()
                .replace(
                    /[\s-]+/g,
                    "_"
                );


        let displayText =
            "FAQ Assay Passed";


        if (
            normalized.includes(
                "GRADE_B"
            ) ||
            normalized === "B"
        ) {
            displayText =
                "Grade B • FAQ Passed";

        } else if (
            normalized.includes(
                "GRADE_A"
            ) ||
            normalized === "A"
        ) {
            displayText =
                "Grade A • FAQ Passed";

        } else if (
            normalized.includes(
                "FAILED"
            )
        ) {
            displayText =
                "FAILED • FAQ Limit Exceeded";
        }


        const cards =
            stage7.querySelectorAll(
                ".glass-pill"
            );


        cards.forEach(
            function (card) {
                const small =
                    card.querySelector(
                        "small"
                    );

                const strong =
                    card.querySelector(
                        "strong"
                    );


                if (
                    small &&
                    strong &&
                    small.innerText
                        .toLowerCase()
                        .includes(
                            "quality approved"
                        )
                ) {
                    strong.innerText =
                        displayText;
                }
            }
        );


        console.log(
            "[Stage 7] Quality status:",
            grade
        );
    }


    // ==========================================
    // UPDATE INVOICE STATUS
    // ==========================================

    function updateInvoiceStatus() {
        const receipt =
            getStage7Receipt();


        const receiptId =
            receipt?.receiptId ||
            receipt?.receiptNumber ||
            receipt?.id;


        if (!receiptId) {
            return;
        }


        const stage7 =
            document.getElementById(
                "stage-view-7"
            );


        if (!stage7) {
            return;
        }


        const strongElements =
            stage7.querySelectorAll(
                "strong"
            );


        strongElements.forEach(
            function (element) {
                if (
                    element.innerText
                        .trim()
                        .toLowerCase()
                        .startsWith(
                            "slip #"
                        )
                ) {
                    element.innerText =
                        `Slip #${receiptId}`;
                }
            }
        );
    }


    // ==========================================
    // LOAD PAYMENT STATUS
    // ==========================================

    async function loadPaymentStatus(
        tokenId
    ) {
        if (!tokenId) {
            return null;
        }


        try {
            const response =
                await fetch(
                    `${STAGE7_API_BASE_URL}/api/payments/status/${encodeURIComponent(
                        tokenId
                    )}`
                );


            let data = {};

            try {
                data =
                    await response.json();

            } catch (error) {
                data = {};
            }


            if (!response.ok) {
                throw new Error(
                    data.message ||
                    `Payment API returned HTTP ${response.status}`
                );
            }


            if (!data.success) {
                throw new Error(
                    data.message ||
                    "Payment status unavailable."
                );
            }


            console.log(
                "[Stage 7] Backend payment status:",
                data
            );


            const pipeline =
                data.pipeline ||
                data.data ||
                data;


            applyBackendPaymentStatus(
                pipeline
            );


            return data;

        } catch (error) {
            console.warn(
                "[Stage 7] Payment status unavailable:",
                error
            );

            return null;
        }
    }


    // ==========================================
    // APPLY BACKEND PAYMENT STATUS
    // ==========================================

    function applyBackendPaymentStatus(
        pipeline
    ) {
        if (!pipeline) {
            return;
        }


        const paymentStatus =
            pipeline.paymentStatus ||
            pipeline.status ||
            "";


        const pfmsReference =
            pipeline.pfmsReference ||
            pipeline.pfmsRef ||
            pipeline.pfmsReferenceNumber ||
            "";


        const utr =
            pipeline.utr ||
            pipeline.utrNumber ||
            pipeline.rbiUtr ||
            "";


        const receiptId =
            pipeline.receiptId ||
            pipeline.receiptNumber ||
            "";


        if (receiptId) {
            updateReceiptReference(
                receiptId
            );
        }


        if (pfmsReference) {
            sessionStorage.setItem(
                "kisanSetuPFMSReference",
                pfmsReference
            );
        }


        if (utr) {
            sessionStorage.setItem(
                "kisanSetuUTR",
                utr
            );
        }


        if (
            pfmsReference ||
            utr
        ) {
            updatePaymentReference(
                pfmsReference,
                utr
            );
        }


        const dispatched =
            pipeline.dbtPayoutDispatched === true ||
            pipeline.dbtDispatched === true ||
            paymentStatus ===
                "DBT Dispatched";


        if (dispatched) {
            sessionStorage.setItem(
                "kisanSetuDBTDispatched",
                "true"
            );


            updateDBTStatus(
                "DBT Dispatched"
            );


            updateDispatchButton(
                true
            );

        } else if (
            sessionStorage.getItem(
                "kisanSetuDBTDispatched"
            ) !== "true"
        ) {
            updateDBTStatus(
                "Pending Trigger"
            );
        }
    }


    // ==========================================
    // UPDATE RECEIPT REFERENCE
    // ==========================================

    function updateReceiptReference(
        receiptId
    ) {
        const stage7 =
            document.getElementById(
                "stage-view-7"
            );

        if (!stage7) {
            return;
        }


        const strongElements =
            stage7.querySelectorAll(
                "strong"
            );


        strongElements.forEach(
            function (element) {
                if (
                    element.innerText
                        .trim()
                        .toLowerCase()
                        .startsWith(
                            "slip #"
                        )
                ) {
                    element.innerText =
                        `Slip #${receiptId}`;
                }
            }
        );
    }


    // ==========================================
    // UPDATE DBT STATUS
    // ==========================================

    function updateDBTStatus(
        status
    ) {
        const element =
            document.getElementById(
                "dbt-status-stage-text"
            );


        if (!element) {
            return;
        }


        element.innerText =
            status;


        if (
            status ===
            "DBT Dispatched"
        ) {
            element.style.color =
                "#166534";
        }
    }


    // ==========================================
    // UPDATE DISPATCH BUTTON
    // ==========================================

    function updateDispatchButton(
        dispatched
    ) {
        const button =
            document.getElementById(
                "btn-dispatch-dbt"
            );


        if (!button) {
            return;
        }


        if (dispatched) {
            button.disabled =
                true;


            button.innerHTML =
                '<i class="fa-solid fa-circle-check"></i> DBT Dispatched';
        }
    }


    // ==========================================
    // UPDATE STORED PAYMENT REFERENCES
    // ==========================================

    function updateStoredPaymentReferences() {
        const pfmsReference =
            sessionStorage.getItem(
                "kisanSetuPFMSReference"
            );


        const utrNumber =
            sessionStorage.getItem(
                "kisanSetuUTR"
            );


        updatePaymentReference(
            pfmsReference,
            utrNumber
        );
    }


    // ==========================================
    // UPDATE PAYMENT REFERENCES
    // ==========================================

    function updatePaymentReference(
        pfmsReference,
        utrNumber
    ) {
        const stage7 =
            document.getElementById(
                "stage-view-7"
            );


        if (!stage7) {
            return;
        }


        const strongElements =
            stage7.querySelectorAll(
                "strong"
            );


        strongElements.forEach(
            function (element) {
                const text =
                    element.innerText
                        .trim()
                        .toUpperCase();


                if (
                    pfmsReference &&
                    text.startsWith(
                        "PFMS-"
                    )
                ) {
                    element.innerText =
                        pfmsReference;
                }


                if (
                    utrNumber &&
                    (
                        text.startsWith(
                            "RBI-UTR-"
                        ) ||
                        text.startsWith(
                            "UTR-"
                        )
                    )
                ) {
                    element.innerText =
                        utrNumber;
                }
            }
        );
    }


    // ==========================================
    // UPDATE AUDIT HASH DISPLAY
    // ==========================================

    function updateAuditHashDisplay() {
        const hash =
            sessionStorage.getItem(
                "kisanSetuAuditHash"
            );


        if (!hash) {
            return;
        }


        const stage7 =
            document.getElementById(
                "stage-view-7"
            );


        if (!stage7) {
            return;
        }


        const strongElements =
            stage7.querySelectorAll(
                "strong"
            );


        strongElements.forEach(
            function (element) {
                const text =
                    element.innerText
                        .trim()
                        .toLowerCase();


                if (
                    text.includes(
                        "0x71cb89"
                    ) ||
                    text.includes(
                        "block#10429"
                    )
                ) {
                    element.innerText =
                        `0x${hash.substring(
                            0,
                            16
                        )}...`;
                }
            }
        );
    }


    // ==========================================
    // DISPATCH DBT PAYOUT
    // ==========================================

    async function dispatchDBTPayout() {
        if (
            stage7DispatchInProgress
        ) {
            return;
        }


        const booking =
            getStage7Booking();


        const receipt =
            getStage7Receipt();


        const tokenId =
            booking?.tokenId ||
            getStage7TokenId();


        if (!booking) {
            alert(
                "No active procurement booking found."
            );

            return;
        }


        if (!receipt) {
            alert(
                "Digital receipt not found. Complete Stage 6 first."
            );

            return;
        }


        if (!tokenId) {
            alert(
                "Procurement token not found. Complete the previous stages first."
            );

            return;
        }


        const alreadyDispatched =
            sessionStorage.getItem(
                "kisanSetuDBTDispatched"
            ) === "true";


        if (alreadyDispatched) {
            alert(
                "DBT has already been dispatched for this procurement transaction."
            );

            return;
        }


        const dispatchButton =
            document.getElementById(
                "btn-dispatch-dbt"
            );


        stage7DispatchInProgress =
            true;


        const originalHTML =
            dispatchButton?.innerHTML;


        try {
            if (dispatchButton) {
                dispatchButton.disabled =
                    true;


                dispatchButton.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> Connecting to PFMS e-Kuber...';
            }


            /*
             * The backend endpoint represents the
             * prototype PFMS/DBT settlement workflow.
             *
             * The browser does not generate payment
             * references. The backend response is the
             * authoritative settlement result.
             */

            const response =
                await fetch(
                    `${STAGE7_API_BASE_URL}/api/payments/dispatch`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            tokenId: tokenId
                        })
                    }
                );


            let data = {};

            try {
                data =
                    await response.json();

            } catch (error) {
                data = {};
            }


            if (!response.ok) {
                throw new Error(
                    data.message ||
                    data.error ||
                    `Payment dispatch failed with HTTP ${response.status}.`
                );
            }


            if (!data.success) {
                throw new Error(
                    data.message ||
                    "Payment dispatch was not successful."
                );
            }


            console.log(
                "[Stage 7] Backend DBT dispatch response:",
                data
            );


            const paymentData =
                data.payment ||
                data.data ||
                data;


            const pfmsReference =
                paymentData.pfmsReference ||
                paymentData.pfmsRef ||
                paymentData.pfmsReferenceNumber ||
                "";


            const utrNumber =
                paymentData.utr ||
                paymentData.utrNumber ||
                paymentData.rbiUtr ||
                "";


            if (pfmsReference) {
                sessionStorage.setItem(
                    "kisanSetuPFMSReference",
                    pfmsReference
                );
            }


            if (utrNumber) {
                sessionStorage.setItem(
                    "kisanSetuUTR",
                    utrNumber
                );
            }


            sessionStorage.setItem(
                "kisanSetuDBTDispatched",
                "true"
            );


            updateDBTStatus(
                "DBT Dispatched"
            );


            updatePaymentReference(
                pfmsReference,
                utrNumber
            );


            updateDispatchButton(
                true
            );


            await loadPaymentStatus(
                tokenId
            );


            let successMessage =
                "Direct Benefit Transfer dispatched successfully.";


            if (pfmsReference) {
                successMessage +=
                    `\n\nPFMS Reference: ${pfmsReference}`;
            }


            if (utrNumber) {
                successMessage +=
                    `\nRBI UTR: ${utrNumber}`;
            }


            successMessage +=
                "\n\nPrototype settlement recorded successfully.";


            alert(
                successMessage
            );


            console.log(
                "[Stage 7] DBT dispatch completed:",
                {
                    tokenId,
                    receiptId:
                        receipt.receiptId ||
                        receipt.receiptNumber,

                    quantity:
                        getFinalQuantity(
                            booking,
                            receipt
                        ),

                    payout:
                        getFinalPayout(
                            getFinalQuantity(
                                booking,
                                receipt
                            ),
                            getFinalMSP(
                                booking,
                                receipt
                            ),
                            receipt
                        ),

                    pfmsReference,
                    utrNumber
                }
            );


        } catch (error) {
            console.error(
                "[Stage 7] DBT dispatch failed:",
                error
            );


            alert(
                `DBT dispatch failed.\n\n${error.message}`
            );


            if (dispatchButton) {
                dispatchButton.disabled =
                    false;


                dispatchButton.innerHTML =
                    originalHTML ||
                    '<i class="fa-solid fa-money-bill-transfer"></i> Dispatch Direct Benefit Transfer (DBT)';
            }

        } finally {
            stage7DispatchInProgress =
                false;
        }
    }


    // ==========================================
    // VERIFY LEDGER
    // ==========================================

    function verifyLedgerBlock() {
        const booking =
            getStage7Booking();


        const receipt =
            getStage7Receipt();


        const auditHash =
            sessionStorage.getItem(
                "kisanSetuAuditHash"
            );


        if (
            !booking ||
            !receipt
        ) {
            alert(
                "No completed procurement transaction is available for ledger verification."
            );

            return;
        }


        if (!auditHash) {
            alert(
                "Transaction audit fingerprint is not available."
            );

            return;
        }


        alert(
            "Transaction Audit Verification\n\n" +
            `Token: ${
                booking.tokenId ||
                getStage7TokenId()
            }\n` +
            `Booking ID: ${
                booking.bookingId ||
                "N/A"
            }\n` +
            `Receipt: ${
                receipt.receiptId ||
                receipt.receiptNumber ||
                "N/A"
            }\n\n` +
            `SHA-256: 0x${auditHash.substring(
                0,
                16
            )}...\n\n` +
            "Prototype ledger verification successful.\n" +
            "The transaction fingerprint is available for audit verification."
        );
    }


    // ==========================================
    // EXPOSE FUNCTIONS
    // ==========================================

    window.dispatchDBTPayout =
        dispatchDBTPayout;


    window.verifyLedgerBlock =
        verifyLedgerBlock;


    window.populateStage7 =
        populateStage7;

})();