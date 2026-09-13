// ==========================================
// KISAN SETU - STAGE 6
// WEIGHMENT & QUALITY ASSURANCE
// ==========================================

const STAGE6_API_BASE_URL =
    'http://localhost:5050';

let stage6SubmissionInProgress =
    false;


// ==========================================
// STAGE 6 INITIALIZATION
// ==========================================

document.addEventListener(
    'DOMContentLoaded',
    function () {

        console.log(
            '[Stage 6] Loaded'
        );


        const grossInput =
            document.getElementById(
                'gross-weight-input'
            );

        const tareInput =
            document.getElementById(
                'tare-weight-input'
            );

        const moistureInput =
            findInputByLabel(
                'Grain Moisture'
            );

        const foreignMatterInput =
            findInputByLabel(
                'Foreign Matter'
            );


        // ------------------------------------
        // Remove preset values
        // ------------------------------------

        if (grossInput) {
            grossInput.value = '';
        }

        if (tareInput) {
            tareInput.value = '';
        }

        if (moistureInput) {
            moistureInput.value = '';
        }

        if (foreignMatterInput) {
            foreignMatterInput.value = '';
        }


        // ------------------------------------
        // Weight listeners
        // ------------------------------------

        if (grossInput) {

            grossInput.oninput =
                calculateNetProcured;

        }


        if (tareInput) {

            tareInput.oninput =
                calculateNetProcured;

        }


        // ------------------------------------
        // Quality listeners
        // ------------------------------------

        if (moistureInput) {

            moistureInput.oninput =
                evaluateQuality;

        }


        if (foreignMatterInput) {

            foreignMatterInput.oninput =
                evaluateQuality;

        }


        // ------------------------------------
        // Receipt button
        // ------------------------------------

        const receiptButton =
            findReceiptButton();


        if (receiptButton) {

            receiptButton.onclick =
                submitQualityLog;

        }


        // ------------------------------------
        // Initial display
        // ------------------------------------

        setText(
            'net-grain-value',
            'Enter Weights'
        );


        setText(
            'net-kg-display',
            'Enter gross and tare weights'
        );


        setText(
            'final-qty-val',
            'Enter Weights'
        );


        setText(
            'final-dbt-amount',
            '₹0'
        );


        updateQualityDisplay(
            'PENDING'
        );


        console.log(
            '[Stage 6] Ready.'
        );

    }
);


// ==========================================
// FIND INPUT USING LABEL
// ==========================================

function findInputByLabel(
    labelText
) {

    const stage6 =
        document.getElementById(
            'stage-view-6'
        );


    if (!stage6) {
        return null;
    }


    const groups =
        stage6.querySelectorAll(
            '.form-group'
        );


    for (
        const group of groups
    ) {

        const label =
            group.querySelector(
                'label'
            );

        const input =
            group.querySelector(
                'input'
            );


        if (
            label &&
            input &&
            label.innerText
                .toLowerCase()
                .includes(
                    labelText.toLowerCase()
                )
        ) {

            return input;

        }

    }


    return null;
}


// ==========================================
// CALCULATE NET GRAIN
// ==========================================

function calculateNetProcured() {

    const grossInput =
        document.getElementById(
            'gross-weight-input'
        );


    const tareInput =
        document.getElementById(
            'tare-weight-input'
        );


    if (
        !grossInput ||
        !tareInput
    ) {

        console.error(
            '[Stage 6] Weight inputs not found.'
        );

        return;

    }


    const gross =
        parseFloat(
            grossInput.value
        );


    const tare =
        parseFloat(
            tareInput.value
        );


    // ----------------------------------------
    // Empty fields
    // ----------------------------------------

    if (
        grossInput.value === '' ||
        tareInput.value === ''
    ) {

        setText(
            'net-grain-value',
            'Enter Weights'
        );


        setText(
            'net-kg-display',
            'Enter gross and tare weights'
        );


        setText(
            'final-qty-val',
            'Enter Weights'
        );


        setText(
            'final-dbt-amount',
            '₹0'
        );


        return;

    }


    // ----------------------------------------
    // Invalid numbers
    // ----------------------------------------

    if (
        !Number.isFinite(gross) ||
        !Number.isFinite(tare)
    ) {

        showInvalidWeight(
            'Please enter valid numeric weights.'
        );

        return;

    }


    // ----------------------------------------
    // Validation
    // ----------------------------------------

    if (gross <= 0) {

        showInvalidWeight(
            'Gross weight must be greater than 0.'
        );

        return;

    }


    if (tare < 0) {

        showInvalidWeight(
            'Tare weight cannot be negative.'
        );

        return;

    }


    if (tare >= gross) {

        showInvalidWeight(
            'Tare weight must be less than gross weight.'
        );

        return;

    }


    // ----------------------------------------
    // Actual calculation
    // ----------------------------------------

    const netKg =
        gross - tare;


    const netQuintals =
        netKg / 100;


    // ----------------------------------------
    // Update displays
    // ----------------------------------------

    setText(
        'net-grain-value',
        `${netQuintals.toFixed(2)} Qtl`
    );


    setText(
        'net-kg-display',
        `Gross (${gross} kg) - Tare (${tare} kg) = ${netKg.toFixed(2)} kg`
    );


    setText(
        'final-qty-val',
        `${netQuintals.toFixed(2)} Quintals`
    );


    // ----------------------------------------
    // Calculate estimated payout
    // ----------------------------------------

    calculatePayout(
        netQuintals
    );


    // ----------------------------------------
    // Store current weighed quantity
    // ----------------------------------------

    sessionStorage.setItem(
        'kisanSetuFinalQuantity',
        String(netQuintals)
    );


    sessionStorage.setItem(
        'kisanSetuFinalNetKg',
        String(netKg)
    );

}


// ==========================================
// INVALID WEIGHT DISPLAY
// ==========================================

function showInvalidWeight(
    message
) {

    setText(
        'net-grain-value',
        'Invalid Weight'
    );


    setText(
        'net-kg-display',
        message
    );


    setText(
        'final-qty-val',
        'Invalid Weight'
    );


    setText(
        'final-dbt-amount',
        '₹0'
    );

}


// ==========================================
// GET CURRENT CROP
// ==========================================

function getCurrentCrop() {

    const bookingData =
        sessionStorage.getItem(
            'kisanSetuBooking'
        );


    if (bookingData) {

        try {

            const booking =
                JSON.parse(
                    bookingData
                );


            if (
                booking?.cropType
            ) {

                return String(
                    booking.cropType
                ).toLowerCase();

            }

        } catch (error) {

            console.warn(
                '[Stage 6] Could not parse booking crop.'
            );

        }

    }


    return 'wheat';

}


// ==========================================
// GET MSP
// ==========================================

function getMSP() {

    const crop =
        getCurrentCrop();


    /*
     * These are the prototype MSP values
     * currently used by the Kisan Setu backend.
     */

    if (
        crop === 'paddy'
    ) {

        return 2369;

    }


    return 2275;

}


// ==========================================
// CALCULATE MSP PAYOUT
// ==========================================

function calculatePayout(
    netQuintals
) {

    if (
        !Number.isFinite(
            netQuintals
        )
    ) {

        return;

    }


    const msp =
        getMSP();


    const payout =
        netQuintals * msp;


    setText(
        'final-dbt-amount',
        `₹${payout.toLocaleString(
            'en-IN',
            {
                maximumFractionDigits: 2
            }
        )}`
    );


    sessionStorage.setItem(
        'kisanSetuFinalMSP',
        String(msp)
    );


    sessionStorage.setItem(
        'kisanSetuFinalPayout',
        String(payout)
    );

}


// ==========================================
// QUALITY EVALUATION
// ==========================================
//
// Prototype classification:
//
// GRADE A
// Moisture <= 12.0%
// Foreign Matter <= 0.50%
//
// GRADE B
// Moisture <= 14.0%
// Foreign Matter <= 0.75%
//
// FAILED
// Moisture > 14.0%
// OR Foreign Matter > 0.75%
//
// ==========================================

function evaluateQuality() {

    const moistureInput =
        findInputByLabel(
            'Grain Moisture'
        );


    const foreignMatterInput =
        findInputByLabel(
            'Foreign Matter'
        );


    if (
        !moistureInput ||
        !foreignMatterInput
    ) {

        console.warn(
            '[Stage 6] Quality inputs not found.'
        );

        return null;

    }


    const moisture =
        parseFloat(
            moistureInput.value
        );


    const foreignMatter =
        parseFloat(
            foreignMatterInput.value
        );


    // ----------------------------------------
    // Empty fields
    // ----------------------------------------

    if (
        moistureInput.value === '' ||
        foreignMatterInput.value === ''
    ) {

        updateQualityDisplay(
            'PENDING'
        );

        return null;

    }


    // ----------------------------------------
    // Invalid values
    // ----------------------------------------

    if (
        !Number.isFinite(moisture) ||
        !Number.isFinite(foreignMatter)
    ) {

        updateQualityDisplay(
            'PENDING'
        );

        return null;

    }


    // ----------------------------------------
    // Negative values
    // ----------------------------------------

    if (
        moisture < 0 ||
        foreignMatter < 0
    ) {

        updateQualityDisplay(
            'FAILED'
        );

        return {

            grade:
                'FAILED',

            moisture,

            foreignMatter

        };

    }


    // ----------------------------------------
    // Grade calculation
    // ----------------------------------------

    let grade;


    if (
        moisture <= 12.0 &&
        foreignMatter <= 0.50
    ) {

        grade =
            'GRADE_A';

    }

    else if (
        moisture <= 14.0 &&
        foreignMatter <= 0.75
    ) {

        grade =
            'GRADE_B';

    }

    else {

        grade =
            'FAILED';

    }


    updateQualityDisplay(
        grade
    );


    // ----------------------------------------
    // Persist current quality result
    // ----------------------------------------

    sessionStorage.setItem(
        'kisanSetuQualityGrade',
        grade
    );


    sessionStorage.setItem(
        'kisanSetuMoisture',
        String(moisture)
    );


    sessionStorage.setItem(
        'kisanSetuForeignMatter',
        String(foreignMatter)
    );


    console.log(
        '[Stage 6] Quality result:',
        {
            moisture,
            foreignMatter,
            grade
        }
    );


    return {

        grade,

        moisture,

        foreignMatter

    };

}


// ==========================================
// UPDATE QUALITY DISPLAY
// ==========================================

function updateQualityDisplay(
    grade
) {

    const resultText =
        document.getElementById(
            'quality-result-text'
        );


    const gradeBadge =
        document.getElementById(
            'quality-grade-badge'
        );


    if (
        !resultText ||
        !gradeBadge
    ) {

        console.warn(
            '[Stage 6] Quality result elements not found.'
        );

        return;

    }


    if (
        grade === 'GRADE_A'
    ) {

        resultText.innerText =
            'Grade A FAQ Quality';


        gradeBadge.innerText =
            'GRADE_A';


        return;

    }


    if (
        grade === 'GRADE_B'
    ) {

        resultText.innerText =
            'Grade B - Quality Adjustment';


        gradeBadge.innerText =
            'GRADE_B';


        return;

    }


    if (
        grade === 'FAILED'
    ) {

        resultText.innerText =
            'FAILED - FAQ Limit Exceeded';


        gradeBadge.innerText =
            'FAILED';


        return;

    }


    resultText.innerText =
        'Awaiting Quality Test';


    gradeBadge.innerText =
        'PENDING';

}


// ==========================================
// FIND RECEIPT BUTTON
// ==========================================

function findReceiptButton() {

    const stage6 =
        document.getElementById(
            'stage-view-6'
        );


    if (!stage6) {
        return null;
    }


    const buttons =
        stage6.querySelectorAll(
            'button'
        );


    for (
        const button of buttons
    ) {

        const text =
            button.innerText
                .toLowerCase();


        if (
            text.includes(
                'issue digital receipt'
            ) ||
            text.includes(
                'save quality assay'
            )
        ) {

            return button;

        }

    }


    return null;

}


// ==========================================
// SUBMIT QUALITY LOG
// ==========================================

async function submitQualityLog() {

    // ----------------------------------------
    // Prevent duplicate submissions
    // ----------------------------------------

    if (
        stage6SubmissionInProgress
    ) {

        console.warn(
            '[Stage 6] Receipt submission already in progress.'
        );

        return;

    }


    stage6SubmissionInProgress =
        true;


    // ----------------------------------------
    // Get booking
    // ----------------------------------------

    const bookingData =
        sessionStorage.getItem(
            'kisanSetuBooking'
        );


    if (!bookingData) {

        alert(
            'No active booking found.'
        );

        stage6SubmissionInProgress =
            false;

        return;

    }


    let booking;


    try {

        booking =
            JSON.parse(
                bookingData
            );

    } catch {

        alert(
            'Booking data is invalid.'
        );

        stage6SubmissionInProgress =
            false;

        return;

    }


    if (!booking?.tokenId) {

        alert(
            'Digital token not found.'
        );

        stage6SubmissionInProgress =
            false;

        return;

    }


    // ----------------------------------------
    // Get inputs
    // ----------------------------------------

    const grossInput =
        document.getElementById(
            'gross-weight-input'
        );


    const tareInput =
        document.getElementById(
            'tare-weight-input'
        );


    const moistureInput =
        findInputByLabel(
            'Grain Moisture'
        );


    const foreignMatterInput =
        findInputByLabel(
            'Foreign Matter'
        );


    if (
        !grossInput ||
        !tareInput ||
        !moistureInput ||
        !foreignMatterInput
    ) {

        alert(
            'Stage 6 input fields could not be found.'
        );

        stage6SubmissionInProgress =
            false;

        return;

    }


    // ----------------------------------------
    // Parse values
    // ----------------------------------------

    const gross =
        parseFloat(
            grossInput.value
        );


    const tare =
        parseFloat(
            tareInput.value
        );


    const moisture =
        parseFloat(
            moistureInput.value
        );


    const foreignMatter =
        parseFloat(
            foreignMatterInput.value
        );


    // ----------------------------------------
    // Validate weights
    // ----------------------------------------

    if (
        !Number.isFinite(gross) ||
        gross <= 0
    ) {

        alert(
            'Please enter a valid gross weight.'
        );

        stage6SubmissionInProgress =
            false;

        return;

    }


    if (
        !Number.isFinite(tare) ||
        tare < 0 ||
        tare >= gross
    ) {

        alert(
            'Please enter a valid tare weight.'
        );

        stage6SubmissionInProgress =
            false;

        return;

    }


    // ----------------------------------------
    // Validate quality
    // ----------------------------------------

    if (
        !Number.isFinite(moisture) ||
        moisture < 0
    ) {

        alert(
            'Please enter a valid moisture percentage.'
        );

        stage6SubmissionInProgress =
            false;

        return;

    }


    if (
        !Number.isFinite(foreignMatter) ||
        foreignMatter < 0
    ) {

        alert(
            'Please enter a valid foreign matter percentage.'
        );

        stage6SubmissionInProgress =
            false;

        return;

    }


    // ----------------------------------------
    // Final quality evaluation
    // ----------------------------------------

    const qualityResult =
        evaluateQuality();


    if (!qualityResult) {

        alert(
            'Please enter valid moisture and foreign matter values.'
        );

        stage6SubmissionInProgress =
            false;

        return;

    }


    const qualityGrade =
        qualityResult.grade;


    // ----------------------------------------
    // Reject failed batches
    // ----------------------------------------

    if (
        qualityGrade === 'FAILED'
    ) {

        alert(
            'This batch exceeds the permitted FAQ quality limits and cannot be accepted for procurement.'
        );

        stage6SubmissionInProgress =
            false;

        return;

    }


    // ----------------------------------------
    // Calculate actual final quantity
    // ----------------------------------------

    const netWeightKg =
        gross - tare;


    const netWeightQuintals =
        netWeightKg / 100;


    const msp =
        getMSP();


    const estimatedPayout =
        netWeightQuintals * msp;


    // ----------------------------------------
    // Store final transaction values
    // ----------------------------------------

    sessionStorage.setItem(
        'kisanSetuFinalQuantity',
        String(netWeightQuintals)
    );


    sessionStorage.setItem(
        'kisanSetuFinalNetKg',
        String(netWeightKg)
    );


    sessionStorage.setItem(
        'kisanSetuFinalMSP',
        String(msp)
    );


    sessionStorage.setItem(
        'kisanSetuFinalPayout',
        String(estimatedPayout)
    );


    sessionStorage.setItem(
        'kisanSetuQualityGrade',
        qualityGrade
    );


    // ----------------------------------------
    // Receipt button loading state
    // ----------------------------------------

    const receiptButton =
        findReceiptButton();


    const originalButtonHTML =
        receiptButton?.innerHTML;


    if (receiptButton) {

        receiptButton.disabled =
            true;


        receiptButton.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Processing Quality Assay...';

    }


    // ========================================
    // SEND TO BACKEND
    // ========================================

    try {

        const response =
            await fetch(
                `${STAGE6_API_BASE_URL}/api/procurement/quality-log`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({

                        tokenId:
                            booking.tokenId,

                        grossWeightQuintals:
                            gross / 100,

                        tareWeightQuintals:
                            tare / 100,

                        moisturePercentage:
                            moisture,

                        foreignMatterPercentage:
                            foreignMatter,

                        qualityGrade:
                            qualityGrade

                    })

                }
            );


        let data;


        try {

            data =
                await response.json();

        } catch {

            throw new Error(
                'Server returned an invalid response.'
            );

        }


        // ------------------------------------
        // Backend failure
        // ------------------------------------

        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                'Quality log failed.'
            );

        }


        // ====================================
        // SAVE RECEIPT
        // ====================================

        if (
            data.receipt
        ) {

            const receipt =
                data.receipt;


            sessionStorage.setItem(
                'kisanSetuReceipt',
                JSON.stringify(
                    receipt
                )
            );


            if (
                receipt.receiptId
            ) {

                sessionStorage.setItem(
                    'activeReceiptId',
                    receipt.receiptId
                );

            }


            // --------------------------------
            // Store authoritative receipt data
            // --------------------------------

            if (
                receipt.netWeightQuintals !==
                undefined
            ) {

                sessionStorage.setItem(
                    'kisanSetuFinalQuantity',
                    String(
                        receipt.netWeightQuintals
                    )
                );

            }


            if (
                receipt.msp !==
                undefined
            ) {

                sessionStorage.setItem(
                    'kisanSetuFinalMSP',
                    String(
                        receipt.msp
                    )
                );

            }


            if (
                receipt.payout !==
                undefined
            ) {

                sessionStorage.setItem(
                    'kisanSetuFinalPayout',
                    String(
                        receipt.payout
                    )
                );

            }


            sessionStorage.setItem(
                'kisanSetuQualityGrade',
                qualityGrade
            );

        }


        // ====================================
        // SUCCESS
        // ====================================

        alert(
            `Digital receipt generated successfully.\n\nReceipt ID: ${
                data.receipt?.receiptId ||
                'Generated'
            }`
        );


        // ====================================
        // STAGE 7
        // ====================================

        if (
            typeof window.completeStageAndProceed ===
            'function'
        ) {

            window.completeStageAndProceed(
                6,
                7
            );

        } else {

            console.warn(
                '[Stage 6] Stage navigation function not found.'
            );

        }


    } catch (error) {

        console.error(
            '[Stage 6] Error:',
            error
        );


        alert(
            `Could not generate receipt: ${error.message}`
        );


    } finally {

        stage6SubmissionInProgress =
            false;


        if (receiptButton) {

            receiptButton.disabled =
                false;


            receiptButton.innerHTML =
                originalButtonHTML ||
                '<i class="fa-solid fa-floppy-disk"></i> Save Quality Assay & Issue Digital Receipt';

        }

    }

}


// ==========================================
// SAFE TEXT UPDATE
// ==========================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        console.warn(
            `[Stage 6] Element #${id} not found.`
        );

        return;

    }


    element.textContent =
        value;

}


// ==========================================
// EXPOSE FUNCTIONS
// ==========================================

window.calculateNetProcured =
    calculateNetProcured;


window.evaluateQuality =
    evaluateQuality;


window.submitQualityLog =
    submitQualityLog;
    async function processWeighmentBackend(metrics) {
  const tokenId = sessionStorage.getItem('tokenId');
  const bookingData = JSON.parse(sessionStorage.getItem('bookingData') || '{}');

  try {
    const response = await fetch('/api/procurement/quality-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenId: tokenId,
        grossWeightKg: metrics.grossKg,     // e.g. 40000
        tareWeightKg: metrics.tareKg,       // e.g. 30000
        moisturePercentage: metrics.moisture, // e.g. 10
        foreignMatterPercentage: metrics.foreignMatter, // e.g. 0.6
        cropType: bookingData.cropType || 'wheat'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      const receipt = data.receipt;
      sessionStorage.setItem('receiptData', JSON.stringify(receipt));

      // Overwrite frontend elements with authoritative backend calculations
      document.getElementById('ui-net-weight').textContent = `${receipt.netWeightKg} kg`;
      document.getElementById('ui-actual-qty').textContent = `${receipt.actualQuantityQuintals} qtl`;
      document.getElementById('ui-quality-grade').textContent = receipt.qualityGrade;
      document.getElementById('ui-msp-rate').textContent = `₹${receipt.mspPricePerQuintal}`;
      document.getElementById('ui-total-payout').textContent = `₹${receipt.totalPayoutAmount}`;
      
      return true;
    } else {
      console.error('Procurement failed:', data.message);
      return false;
    }
  } catch (error) {
    console.error('API Error:', error);
    return false;
  }
}