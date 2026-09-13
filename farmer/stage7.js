// ==========================================
// KISAN SETU - STAGE 7
// PFMS DBT PAYMENT & DISBURSEMENT
// ==========================================

const STAGE7_API_BASE_URL =
    'http://localhost:5050';

let stage7DispatchInProgress =
    false;


// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener(
    'DOMContentLoaded',
    function () {

        console.log(
            '[Stage 7] Loaded'
        );

        populateStage7();

    }
);


// ==========================================
// GET STORED BOOKING
// ==========================================

function getStage7Booking() {

    const storedBooking =
        sessionStorage.getItem(
            'kisanSetuBooking'
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
            !booking.tokenId
        ) {

            return null;

        }


        return booking;

    } catch (error) {

        console.error(
            '[Stage 7] Invalid booking data:',
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
            'kisanSetuReceipt'
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
            '[Stage 7] Invalid receipt data:',
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
            '[Stage 7] No active booking found.'
        );

        return;

    }


    console.log(
        '[Stage 7] Populating dashboard:',
        {
            tokenId:
                booking.tokenId,

            bookingId:
                booking.bookingId,

            receiptId:
                receipt?.receiptId
        }
    );


    // ----------------------------------------
    // Crop
    // ----------------------------------------

    updateCropName(
        booking,
        receipt
    );


    // ----------------------------------------
    // Financial breakdown
    // ----------------------------------------

    updateFinancialBreakdown(
        booking,
        receipt
    );


    // ----------------------------------------
    // Beneficiary
    // ----------------------------------------

    updateBeneficiary(
        booking
    );


    // ----------------------------------------
    // Quality result
    // ----------------------------------------

    updateQualityStatus(
        receipt
    );


    // ----------------------------------------
    // Receipt / invoice
    // ----------------------------------------

    updateInvoiceStatus();


    // ----------------------------------------
    // Payment references
    // ----------------------------------------

    updateStoredPaymentReferences();


    // ----------------------------------------
    // Audit hash
    // ----------------------------------------

    updateAuditHashDisplay();


    // ----------------------------------------
    // DBT state
    // ----------------------------------------

    const dispatched =
        sessionStorage.getItem(
            'kisanSetuDBTDispatched'
        ) === 'true';


    updateDBTStatus(
        dispatched
            ? 'DBT Dispatched'
            : 'Pending Trigger'
    );


    updateDispatchButton(
        dispatched
    );


    // ----------------------------------------
    // Backend payment status
    // ----------------------------------------

    await loadPaymentStatus(
        booking.tokenId
    );


    console.log(
        '[Stage 7] Dashboard ready.'
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
            'final-crop-name'
        );


    if (!element) {
        return;
    }


    const crop =
        receipt?.cropType ||
        booking?.cropType ||
        'wheat';


    const normalizedCrop =
        String(
            crop
        ).toLowerCase();


    if (
        normalizedCrop.includes(
            'paddy'
        )
    ) {

        element.innerText =
            'Paddy (धान / ਚਾਵਲ)';

    } else {

        element.innerText =
            'Wheat (ਗੇਹੁੰ / ਕਣਕ)';

    }

}


// ==========================================
// GET FINAL QUANTITY
// ==========================================

function getFinalQuantity(
    booking,
    receipt
) {

    // ----------------------------------------
    // Receipt quantity
    // ----------------------------------------

    const receiptQuantity =
        Number(
            receipt?.netWeightQuintals
        );


    if (
        Number.isFinite(
            receiptQuantity
        )
    ) {

        return receiptQuantity;

    }


    // ----------------------------------------
    // Alternative receipt field
    // ----------------------------------------

    const receiptNetQuintals =
        Number(
            receipt?.netQuintals
        );


    if (
        Number.isFinite(
            receiptNetQuintals
        )
    ) {

        return receiptNetQuintals;

    }


    // ----------------------------------------
    // Net kg
    // ----------------------------------------

    const receiptNetKg =
        Number(
            receipt?.netWeightKg
        );


    if (
        Number.isFinite(
            receiptNetKg
        )
    ) {

        return receiptNetKg / 100;

    }


    // ----------------------------------------
    // Gross / tare from receipt
    // ----------------------------------------

    const gross =
        Number(
            receipt?.grossWeightQuintals
        );


    const tare =
        Number(
            receipt?.tareWeightQuintals
        );


    if (
        Number.isFinite(gross) &&
        Number.isFinite(tare)
    ) {

        return gross - tare;

    }


    // ----------------------------------------
    // Stage 6 session data
    // ----------------------------------------

    const storedFinalQuantity =
        Number(
            sessionStorage.getItem(
                'kisanSetuFinalQuantity'
            )
        );


    if (
        Number.isFinite(
            storedFinalQuantity
        )
    ) {

        return storedFinalQuantity;

    }


    // ----------------------------------------
    // Last fallback: booking quantity
    // ----------------------------------------

    return Number(
        booking?.quantityQuintals
    ) || 0;

}


// ==========================================
// GET MSP
// ==========================================

function getFinalMSP(
    booking,
    receipt
) {

    const receiptMSP =
        Number(
            receipt?.msp
        );


    if (
        Number.isFinite(
            receiptMSP
        )
    ) {

        return receiptMSP;

    }


    const receiptMSPPerQuintal =
        Number(
            receipt?.mspPerQuintal
        );


    if (
        Number.isFinite(
            receiptMSPPerQuintal
        )
    ) {

        return receiptMSPPerQuintal;

    }


    const storedMSP =
        Number(
            sessionStorage.getItem(
                'kisanSetuFinalMSP'
            )
        );


    if (
        Number.isFinite(
            storedMSP
        )
    ) {

        return storedMSP;

    }


    const crop =
        String(
            receipt?.cropType ||
            booking?.cropType ||
            'wheat'
        ).toLowerCase();


    return crop === 'paddy'
        ? 2369
        : 2275;

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
            receipt?.payout
        );


    if (
        Number.isFinite(
            receiptPayout
        )
    ) {

        return receiptPayout;

    }


    const totalPayout =
        Number(
            receipt?.totalPayout
        );


    if (
        Number.isFinite(
            totalPayout
        )
    ) {

        return totalPayout;

    }


    const storedPayout =
        Number(
            sessionStorage.getItem(
                'kisanSetuFinalPayout'
            )
        );


    if (
        Number.isFinite(
            storedPayout
        )
    ) {

        return storedPayout;

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
            'final-qty-val'
        );


    const amountElement =
        document.getElementById(
            'final-dbt-amount'
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


    // ----------------------------------------
    // Quantity
    // ----------------------------------------

    if (quantityElement) {

        quantityElement.innerText =
            `${quantity.toFixed(2)} Quintals`;

    }


    // ----------------------------------------
    // DBT amount
    // ----------------------------------------

    if (amountElement) {

        amountElement.innerText =
            `₹${payout.toLocaleString(
                'en-IN',
                {
                    maximumFractionDigits: 2
                }
            )}`;

    }


    // ----------------------------------------
    // MSP
    // ----------------------------------------

    updateMSPText(
        msp
    );


    // ----------------------------------------
    // Persist authoritative financial data
    // ----------------------------------------

    sessionStorage.setItem(
        'kisanSetuFinalQuantity',
        String(quantity)
    );


    sessionStorage.setItem(
        'kisanSetuFinalMSP',
        String(msp)
    );


    sessionStorage.setItem(
        'kisanSetuFinalPayout',
        String(payout)
    );


    console.log(
        '[Stage 7] Financial breakdown:',
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
            'stage-view-7'
        );


    if (!stage7) {
        return;
    }


    const spans =
        stage7.querySelectorAll(
            'span'
        );


    spans.forEach(
        function (span) {

            if (
                span.innerText
                    .trim()
                    .toLowerCase() !==
                'cabinet-approved msp:'
            ) {

                return;

            }


            const parent =
                span.parentElement;


            const strong =
                parent?.querySelector(
                    'strong'
                );


            if (strong) {

                strong.innerText =
                    `₹${msp.toLocaleString(
                        'en-IN'
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
            'dbt-beneficiary-name'
        );


    if (!element) {
        return;
    }


    // ----------------------------------------
    // Booking farmer
    // ----------------------------------------

    if (
        booking?.farmerName &&
        booking.farmerName !== 'Verified Farmer' &&
        booking.farmerName !== 'Not fetched'
    ) {

        element.innerText =
            `${booking.farmerName} (State Bank of India)`;

        return;

    }


    // ----------------------------------------
    // Saved farmer name
    // ----------------------------------------

    const savedName =
        sessionStorage.getItem(
            'verifiedFarmerName'
        );


    if (
        savedName &&
        savedName !== 'Not fetched'
    ) {

        element.innerText =
            `${savedName} (State Bank of India)`;

        return;

    }


    // ----------------------------------------
    // Verified farmer object
    // ----------------------------------------

    const savedFarmer =
        sessionStorage.getItem(
            'verifiedFarmer'
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

                element.innerText =
                    `${farmer.name} (State Bank of India)`;

            }

        } catch (error) {

            console.warn(
                '[Stage 7] Could not parse farmer data.'
            );

        }

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
            'stage-view-7'
        );


    if (!stage7) {
        return;
    }


    let grade =
        receipt?.qualityGrade;


    // ----------------------------------------
    // Session fallback
    // ----------------------------------------

    if (!grade) {

        grade =
            sessionStorage.getItem(
                'kisanSetuQualityGrade'
            );

    }


    if (!grade) {

        grade =
            'GRADE_A';

    }


    const normalized =
        String(
            grade
        )
        .toUpperCase()
        .replace(
            /[\s-]+/g,
            '_'
        );


    let displayText =
        'FAQ Assay Passed';


    if (
        normalized.includes(
            'GRADE_B'
        )
    ) {

        displayText =
            'Grade B • FAQ Passed';

    }

    else if (
        normalized.includes(
            'GRADE_A'
        )
    ) {

        displayText =
            'Grade A • FAQ Passed';

    }

    else if (
        normalized.includes(
            'FAILED'
        )
    ) {

        displayText =
            'FAILED • FAQ Limit Exceeded';

    }


    // ----------------------------------------
    // Update pipeline first card
    // ----------------------------------------

    const cards =
        stage7.querySelectorAll(
            '.glass-pill'
        );


    cards.forEach(
        function (card) {

            const small =
                card.querySelector(
                    'small'
                );


            const strong =
                card.querySelector(
                    'strong'
                );


            if (
                small &&
                strong &&
                small.innerText
                    .toLowerCase()
                    .includes(
                        'quality approved'
                    )
            ) {

                strong.innerText =
                    displayText;

            }

        }
    );


    console.log(
        '[Stage 7] Quality status:',
        grade
    );

}


// ==========================================
// UPDATE INVOICE STATUS
// ==========================================

function updateInvoiceStatus() {

    const receipt =
        getStage7Receipt();


    if (
        !receipt?.receiptId
    ) {

        return;

    }


    const stage7 =
        document.getElementById(
            'stage-view-7'
        );


    if (!stage7) {
        return;
    }


    const strongElements =
        stage7.querySelectorAll(
            'strong'
        );


    strongElements.forEach(
        function (element) {

            if (
                element.innerText
                    .trim()
                    .toLowerCase()
                    .startsWith(
                        'slip #'
                    )
            ) {

                element.innerText =
                    `Slip #${receipt.receiptId}`;

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
        return;
    }


    try {

        const response =
            await fetch(
                `${STAGE7_API_BASE_URL}/api/payments/status/${encodeURIComponent(
                    tokenId
                )}`
            );


        if (!response.ok) {

            throw new Error(
                `Payment API returned HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.message ||
                'Payment status unavailable.'
            );

        }


        console.log(
            '[Stage 7] Backend payment status:',
            data
        );


        // ------------------------------------
        // Invoice
        // ------------------------------------

        if (
            data.invoiceGenerated === true
        ) {

            updateInvoiceStatus();

        }


        // ------------------------------------
        // DBT
        // ------------------------------------

        if (
            data.dbtDispatched === true ||
            data.status === 'DBT Dispatched'
        ) {

            sessionStorage.setItem(
                'kisanSetuDBTDispatched',
                'true'
            );


            updateDBTStatus(
                'DBT Dispatched'
            );


            updateDispatchButton(
                true
            );

        }

        else {

            /*
             * Do not overwrite an already completed
             * local prototype dispatch.
             */

            if (
                sessionStorage.getItem(
                    'kisanSetuDBTDispatched'
                ) !== 'true'
            ) {

                updateDBTStatus(
                    'Pending Trigger'
                );

            }

        }

    } catch (error) {

        console.warn(
            '[Stage 7] Payment status unavailable:',
            error
        );

    }

}


// ==========================================
// UPDATE DBT STATUS
// ==========================================

function updateDBTStatus(
    status
) {

    const element =
        document.getElementById(
            'dbt-status-stage-text'
        );


    if (!element) {
        return;
    }


    element.innerText =
        status;


    if (
        status === 'DBT Dispatched'
    ) {

        element.style.color =
            '#166534';

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
            'btn-dispatch-dbt'
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
            'kisanSetuPFMSReference'
        );


    const utrNumber =
        sessionStorage.getItem(
            'kisanSetuUTR'
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
            'stage-view-7'
        );


    if (!stage7) {
        return;
    }


    const strongElements =
        stage7.querySelectorAll(
            'strong'
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
                    'PFMS-'
                )
            ) {

                element.innerText =
                    pfmsReference;

            }


            if (
                utrNumber &&
                text.startsWith(
                    'RBI-UTR-'
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
            'kisanSetuAuditHash'
        );


    if (!hash) {
        return;
    }


    const stage7 =
        document.getElementById(
            'stage-view-7'
        );


    if (!stage7) {
        return;
    }


    const strongElements =
        stage7.querySelectorAll(
            'strong'
        );


    strongElements.forEach(
        function (element) {

            const text =
                element.innerText
                    .trim()
                    .toLowerCase();


            if (
                text.includes(
                    '0x71cb89'
                ) ||
                text.includes(
                    'block#10429'
                )
            ) {

                element.innerText =
                    `0x${hash.substring(0, 16)}...`;

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


    if (!booking) {

        alert(
            'No active procurement booking found.'
        );

        return;

    }


    if (!receipt) {

        alert(
            'Digital receipt not found. Complete Stage 6 first.'
        );

        return;

    }


    const alreadyDispatched =
        sessionStorage.getItem(
            'kisanSetuDBTDispatched'
        ) === 'true';


    if (alreadyDispatched) {

        alert(
            'DBT has already been dispatched for this procurement transaction.'
        );

        return;

    }


    const dispatchButton =
        document.getElementById(
            'btn-dispatch-dbt'
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
         * IMPORTANT:
         *
         * The current Kisan Setu backend does not
         * expose a real PFMS/RBI payment endpoint.
         *
         * Therefore this is a prototype settlement
         * simulation, not an actual bank transfer.
         */

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    1200
                )
        );


        const timestamp =
            Date.now();


        const pfmsReference =
            `PFMS-2026-${String(
                timestamp
            ).slice(-6)}`;


        const utrNumber =
            `RBI-UTR-${String(
                timestamp
            ).slice(-8)}`;


        // ------------------------------------
        // Store settlement references
        // ------------------------------------

        sessionStorage.setItem(
            'kisanSetuDBTDispatched',
            'true'
        );


        sessionStorage.setItem(
            'kisanSetuPFMSReference',
            pfmsReference
        );


        sessionStorage.setItem(
            'kisanSetuUTR',
            utrNumber
        );


        // ------------------------------------
        // Update UI
        // ------------------------------------

        updateDBTStatus(
            'DBT Dispatched'
        );


        updatePaymentReference(
            pfmsReference,
            utrNumber
        );


        updateDispatchButton(
            true
        );


        alert(
            'Direct Benefit Transfer dispatched successfully.\n\n' +
            `PFMS Reference: ${pfmsReference}\n` +
            `RBI UTR: ${utrNumber}\n\n` +
            'Prototype settlement recorded successfully.'
        );


        console.log(
            '[Stage 7] Prototype DBT dispatch:',
            {
                tokenId:
                    booking.tokenId,

                receiptId:
                    receipt.receiptId,

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
            '[Stage 7] DBT dispatch failed:',
            error
        );


        alert(
            `DBT dispatch failed: ${error.message}`
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
            'kisanSetuAuditHash'
        );


    if (
        !booking ||
        !receipt
    ) {

        alert(
            'No completed procurement transaction is available for ledger verification.'
        );

        return;

    }


    if (!auditHash) {

        alert(
            'Transaction audit fingerprint is not available.'
        );

        return;

    }


    alert(
        'Transaction Audit Verification\n\n' +
        `Token: ${booking.tokenId}\n` +
        `Booking ID: ${booking.bookingId || 'N/A'}\n` +
        `Receipt: ${receipt.receiptId || 'N/A'}\n\n` +
        `SHA-256: 0x${auditHash.substring(0, 16)}...\n\n` +
        'Prototype ledger verification successful.\n' +
        'The transaction fingerprint is available for audit verification.'
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
    async function fetchPaymentStatusBackend() {
  const tokenId = sessionStorage.getItem('tokenId');
  if (!tokenId) return;

  try {
    const response = await fetch(`/api/payments/status/${tokenId}`);
    const data = await response.json();
    
    if (data.success) {
      updatePaymentUI(data.pipeline);
    }
  } catch (error) {
    console.error('API Error:', error);
  }
}

async function dispatchDbtPayment() {
  const tokenId = sessionStorage.getItem('tokenId');
  
  try {
    const response = await fetch('/api/payments/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenId })
    });
    
    const data = await response.json();
    
    if (data.success) {
      await fetchPaymentStatusBackend(); 
    } else {
      console.error('Dispatch Failed:', data.message);
    }
  } catch (error) {
    console.error('API Error:', error);
  }
}

function updatePaymentUI(pipeline) {
  // Replace these IDs with your actual HTML element IDs
  document.getElementById('ui-receipt-number').textContent = pipeline.receiptId || 'Pending';
  document.getElementById('ui-payment-amount').textContent = `₹${pipeline.amountToCredit}`;
  document.getElementById('ui-payment-status').textContent = pipeline.paymentStatus;
  
  if (pipeline.dbtPayoutDispatched) {
    document.getElementById('ui-pfms-ref').textContent = pipeline.pfmsReference || 'Processing';
    document.getElementById('ui-utr-number').textContent = pipeline.utr || 'Processing';
  } else {
    document.getElementById('ui-pfms-ref').textContent = 'N/A';
    document.getElementById('ui-utr-number').textContent = 'N/A';
  }
}

// Bind dispatchDbtPayment() to your existing "Dispatch Payment" UI button