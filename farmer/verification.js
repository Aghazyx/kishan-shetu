(function () {
    "use strict";

    // ==========================================
    // KISAN SETU - FARMER VERIFICATION
    // FRONTEND -> EXPRESS BACKEND
    // ==========================================

    const API_BASE_URL =
        "http://localhost:5050";


    // ==========================================
    // DEMO FARMER DATABASE
    // ==========================================

    const FARMER_DATABASE = {

        ramesh: {
            kccKeys: [
                "KCC-PB-2024-8841",
                "KCC-PB-2024-8848",
                "KCC-PB-2024-8849"
            ],

            aadhaar:
                "XXXX-XXXX-4912",

            name:
                "Sardar Ramesh Singh",

            phone:
                "+91 98765-43210",

            landSize:
                "4.5 Acres",

            landKhasra:
                "Verified via Bhoomi Portal",

            mandi:
                "Khanna, Ludhiana",

            state:
                "Punjab State",

            bankName:
                "State Bank of India",

            bankAcc:
                "A/C ****3312",

            wheatCap:
                "Max 87.5 Qtl",

            paddyCap:
                "Max 128 Qtl"
        },


        kaur: {
            kccKeys: [
                "KCC-PB-2024-9102",
                "KCC-PB-2024-5520"
            ],

            aadhaar:
                "XXXX-XXXX-8821",

            name:
                "Gurpreet Kaur",

            phone:
                "+91 98123-65498",

            landSize:
                "6.0 Acres",

            landKhasra:
                "Verified via Bhoomi Portal",

            mandi:
                "Jagraon, Ludhiana",

            state:
                "Punjab State",

            bankName:
                "Punjab National Bank",

            bankAcc:
                "A/C ****8854",

            wheatCap:
                "Max 115 Qtl",

            paddyCap:
                "Max 45 Qtl"
        },


        kumar: {
            kccKeys: [
                "KCC-HR-2024-3312",
                "KCC-PB-2024-3319"
            ],

            aadhaar:
                "XXXX-XXXX-1102",

            name:
                "Rajesh Kumar",

            phone:
                "+91 97456-12389",

            landSize:
                "3.2 Acres",

            landKhasra:
                "Verified via Bhoomi Portal",

            mandi:
                "Samrala, Ludhiana",

            state:
                "Haryana State",

            bankName:
                "HDFC Bank",

            bankAcc:
                "A/C ****1102",

            wheatCap:
                "Max 90 Qtl",

            paddyCap:
                "Max 60 Qtl"
        }

    };


    // ==========================================
    // SAFE TEXT HELPER
    // ==========================================

    function setText(
        id,
        value
    ) {

        const element =
            document.getElementById(
                id
            );


        if (element) {

            element.innerText =
                value ?? "";

        }

    }


    // ==========================================
    // FIND FARMER PRESET
    // ==========================================

    function findFarmerPreset(
        kccNumber
    ) {

        const normalizedKcc =
            String(
                kccNumber || ""
            )
                .trim()
                .toUpperCase();


        return Object.values(
            FARMER_DATABASE
        ).find(
            function (farmer) {

                return farmer.kccKeys.some(
                    function (key) {

                        return (
                            key.toUpperCase() ===
                            normalizedKcc
                        );

                    }
                );

            }
        ) || null;

    }


    // ==========================================
    // RESET VERIFIED PROFILE
    // ==========================================

    function resetVerifiedProfile() {

        setText(
            "farmer-name-val",
            "Not fetched"
        );


        setText(
            "farmer-phone-val",
            "Awaiting verification"
        );


        setText(
            "land-size-val",
            "Not fetched"
        );


        setText(
            "land-khasra-val",
            "Awaiting land record verification"
        );


        setText(
            "loc-mandi-val",
            "Not fetched"
        );


        setText(
            "loc-state-val",
            "Awaiting location verification"
        );


        setText(
            "bank-name-val",
            "Not fetched"
        );


        setText(
            "bank-acc-val",
            "Awaiting bank verification"
        );


        setText(
            "wheat-cap",
            "Not fetched"
        );


        setText(
            "paddy-cap",
            "Not fetched"
        );

    }


    // ==========================================
    // CLEAR VERIFICATION SESSION
    // ==========================================

    function clearVerificationSession() {

        const keysToRemove = [

            "verifiedFarmer",

            "verifiedFarmerProfile",

            "kisanSetuFarmerProfile",

            "verifiedKccNumber",

            "verifiedAadhaar",

            "verifiedFarmerName",

            "verifiedFarmerId",

            "farmerVerified",

            "farmerId",

            "farmerName",

            "farmerData",

            "kccNumber",

            "kcc",

            "KCCNumber",

            "farmerKCC",

            "aadhaarNumber",

            "aadhaar",

            "AadhaarNumber",

            "aadharNumber",

            "aadhar",

            "AadharNumber"

        ];


        keysToRemove.forEach(
            function (key) {

                sessionStorage.removeItem(
                    key
                );

            }
        );

    }


    // ==========================================
    // LOAD PRESET
    // ==========================================

    window.loadPreset =
        function (
            presetKey,
            event
        ) {

            if (event) {

                document
                    .querySelectorAll(
                        ".preset-pill"
                    )
                    .forEach(
                        function (button) {

                            button.classList.remove(
                                "active"
                            );

                        }
                    );


                if (
                    event.currentTarget
                ) {

                    event.currentTarget.classList.add(
                        "active"
                    );

                }

            }


            const key =
                String(
                    presetKey || ""
                )
                    .toLowerCase();


            const preset =
                FARMER_DATABASE[key];


            if (!preset) {

                console.error(
                    "[Verification] Unknown farmer preset:",
                    presetKey
                );

                return;

            }


            const kccInput =
                document.getElementById(
                    "kcc-input"
                );


            const aadhaarInput =
                document.getElementById(
                    "aadhaar-input"
                );


            if (kccInput) {

                kccInput.value =
                    preset.kccKeys[0];

            }


            if (aadhaarInput) {

                aadhaarInput.value =
                    preset.aadhaar;

            }


            /*
             * Changing the preset represents a new
             * verification attempt.
             *
             * Existing verification state must therefore
             * be removed before the new farmer is verified.
             */

            clearVerificationSession();


            resetVerifiedProfile();


            console.log(
                "[Verification] Preset loaded:",
                key
            );

        };


    // ==========================================
    // POPULATE VERIFIED PROFILE
    // ==========================================

    function populateVerifiedProfile(
        farmer,
        preset
    ) {

        setText(
            "farmer-name-val",
            farmer.name ||
                "Not available"
        );


        setText(
            "farmer-phone-val",
            farmer.phone ||
                "Not available"
        );


        setText(
            "land-size-val",
            farmer.landHoldingAcres ||
                farmer.landSize ||
                "Not available"
        );


        setText(
            "land-khasra-val",
            farmer.khasra ||
                farmer.landKhasra ||
                "Verified via Bhoomi Portal"
        );


        setText(
            "loc-mandi-val",
            farmer.mandi ||
                farmer.district ||
                "Not available"
        );


        setText(
            "loc-state-val",
            farmer.state ||
                "Not available"
        );


        setText(
            "bank-name-val",
            farmer.verifiedBank ||
                farmer.bankName ||
                "Not available"
        );


        setText(
            "bank-acc-val",
            farmer.bankAccount ||
                farmer.bankAcc ||
                "Not available"
        );


        if (preset) {

            setText(
                "wheat-cap",
                preset.wheatCap
            );


            setText(
                "paddy-cap",
                preset.paddyCap
            );

        } else {

            setText(
                "wheat-cap",
                farmer.wheatCap ||
                    "Not available"
            );


            setText(
                "paddy-cap",
                farmer.paddyCap ||
                    "Not available"
            );

        }

    }


    // ==========================================
    // SAVE VERIFIED FARMER
    // ==========================================

    function saveVerifiedFarmer(
        farmer,
        kccNumber,
        aadhaar,
        preset
    ) {

        /*
         * The backend may return farmerId under
         * either farmerId or id.
         */

        const farmerId =
            farmer.farmerId ||
            farmer.id ||
            "";


        /*
         * CRITICAL:
         *
         * Always prefer the KCC entered by the farmer.
         * If the backend returns a KCC, use it only when
         * it is actually present.
         */

        const finalKcc =
            String(
                farmer.kccNumber ||
                farmer.kcc ||
                kccNumber ||
                ""
            )
                .trim()
                .toUpperCase();


        const finalAadhaar =
            String(
                aadhaar ||
                farmer.aadhaar ||
                farmer.aadhaarNumber ||
                ""
            )
                .trim();


        const finalName =
            farmer.name ||
            (
                preset
                    ? preset.name
                    : ""
            ) ||
            "Verified Farmer";


        /*
         * Build one canonical farmer profile.
         *
         * This object becomes the primary source for
         * Stage 3 and later stages.
         */

        const canonicalProfile = {

            farmerId:
                farmerId,

            id:
                farmerId,

            name:
                finalName,

            farmerName:
                finalName,

            phone:
                farmer.phone ||
                (
                    preset
                        ? preset.phone
                        : ""
                ),

            kccNumber:
                finalKcc,

            kcc:
                finalKcc,

            aadhaarNumber:
                finalAadhaar,

            aadhaar:
                finalAadhaar,

            landHoldingAcres:
                farmer.landHoldingAcres ||
                farmer.landSize ||
                (
                    preset
                        ? preset.landSize
                        : ""
                ),

            landSize:
                farmer.landSize ||
                (
                    preset
                        ? preset.landSize
                        : ""
                ),

            khasra:
                farmer.khasra ||
                farmer.landKhasra ||
                (
                    preset
                        ? preset.landKhasra
                        : ""
                ),

            landKhasra:
                farmer.landKhasra ||
                (
                    preset
                        ? preset.landKhasra
                        : ""
                ),

            mandi:
                farmer.mandi ||
                (
                    preset
                        ? preset.mandi
                        : ""
                ),

            district:
                farmer.district ||
                (
                    preset
                        ? preset.mandi
                        : ""
                ),

            state:
                farmer.state ||
                (
                    preset
                        ? preset.state
                        : ""
                ),

            bankName:
                farmer.bankName ||
                (
                    preset
                        ? preset.bankName
                        : ""
                ),

            bankAccount:
                farmer.bankAccount ||
                (
                    preset
                        ? preset.bankAcc
                        : ""
                ),

            verifiedBank:
                farmer.verifiedBank ||
                farmer.bankName ||
                (
                    preset
                        ? preset.bankName
                        : ""
                ),

            wheatCap:
                farmer.wheatCap ||
                (
                    preset
                        ? preset.wheatCap
                        : ""
                ),

            paddyCap:
                farmer.paddyCap ||
                (
                    preset
                        ? preset.paddyCap
                        : ""
                )

        };


        // ====================================
        // CANONICAL SESSION
        // ====================================

        sessionStorage.setItem(
            "verifiedFarmer",
            JSON.stringify(
                canonicalProfile
            )
        );


        sessionStorage.setItem(
            "verifiedFarmerProfile",
            JSON.stringify(
                canonicalProfile
            )
        );


        sessionStorage.setItem(
            "kisanSetuFarmerProfile",
            JSON.stringify(
                canonicalProfile
            )
        );


        sessionStorage.setItem(
            "farmerData",
            JSON.stringify(
                canonicalProfile
            )
        );


        // ====================================
        // VERIFICATION FLAGS
        // ====================================

        sessionStorage.setItem(
            "farmerVerified",
            "true"
        );


        sessionStorage.setItem(
            "farmerVerificationComplete",
            "true"
        );


        sessionStorage.setItem(
            "verifiedFarmerId",
            farmerId
        );


        sessionStorage.setItem(
            "farmerId",
            farmerId
        );


        // ====================================
        // KCC STORAGE
        // ====================================

        sessionStorage.setItem(
            "verifiedKccNumber",
            finalKcc
        );


        sessionStorage.setItem(
            "kccNumber",
            finalKcc
        );


        sessionStorage.setItem(
            "kcc",
            finalKcc
        );


        sessionStorage.setItem(
            "KCCNumber",
            finalKcc
        );


        sessionStorage.setItem(
            "farmerKCC",
            finalKcc
        );


        sessionStorage.setItem(
            "kisanSetuKCC",
            finalKcc
        );


        // ====================================
        // AADHAAR STORAGE
        // ====================================

        sessionStorage.setItem(
            "verifiedAadhaar",
            finalAadhaar
        );


        sessionStorage.setItem(
            "aadhaarNumber",
            finalAadhaar
        );


        sessionStorage.setItem(
            "aadhaar",
            finalAadhaar
        );


        sessionStorage.setItem(
            "AadhaarNumber",
            finalAadhaar
        );


        sessionStorage.setItem(
            "aadharNumber",
            finalAadhaar
        );


        sessionStorage.setItem(
            "kisanSetuAadhaar",
            finalAadhaar
        );


        // ====================================
        // NAME STORAGE
        // ====================================

        sessionStorage.setItem(
            "verifiedFarmerName",
            finalName
        );


        sessionStorage.setItem(
            "farmerName",
            finalName
        );


        // ====================================
        // DEBUG LOG
        // ====================================

        console.log(
            "[Verification] Canonical farmer session saved:",
            {
                farmerId:
                    farmerId,

                name:
                    finalName,

                kccNumber:
                    finalKcc,

                aadhaar:
                    finalAadhaar,

                verified:
                    true
            }
        );

    }


    // ==========================================
    // FETCH FARMER RECORDS
    // ==========================================

    async function fetchFarmerRecords() {

        const fetchBtn =
            document.getElementById(
                "btn-fetch"
            );


        const kccInput =
            document.getElementById(
                "kcc-input"
            );


        const aadhaarInput =
            document.getElementById(
                "aadhaar-input"
            );


        if (!fetchBtn) {

            console.error(
                "[Verification] Fetch button not found."
            );

            return;

        }


        const kccNumber =
            kccInput?.value
                ?.trim()
                .toUpperCase();


        const aadhaar =
            aadhaarInput?.value
                ?.trim();


        // ====================================
        // INPUT VALIDATION
        // ====================================

        if (!kccNumber) {

            alert(
                "Please enter a KCC Number first."
            );

            return;

        }


        if (!aadhaar) {

            alert(
                "Please enter the Aadhaar reference before verification."
            );

            return;

        }


        const originalHTML =
            fetchBtn.innerHTML;


        fetchBtn.disabled =
            true;


        fetchBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Fetching Records from Bhoomi...';


        const matchedFarmer =
            findFarmerPreset(
                kccNumber
            );


        const requestName =
            matchedFarmer
                ? matchedFarmer.name
                : "Kisan Setu Farmer";


        const requestPhone =
            matchedFarmer
                ? matchedFarmer.phone
                : "";


        try {

            // ==================================
            // BACKEND REQUEST
            // ==================================

            const response =
                await fetch(
                    `${API_BASE_URL}/api/auth/register-farmer`,
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
                            JSON.stringify({

                                kccNumber:
                                    kccNumber,

                                name:
                                    requestName,

                                phone:
                                    requestPhone,

                                state:
                                    matchedFarmer
                                        ? matchedFarmer.state
                                        : "",

                                district:
                                    matchedFarmer
                                        ? matchedFarmer.mandi
                                        : ""

                            })

                    }
                );


            // ==================================
            // RESPONSE
            // ==================================

            let data =
                {};


            try {

                data =
                    await response.json();

            } catch (error) {

                throw new Error(
                    "The verification server returned an invalid response."
                );

            }


            if (
                !response.ok
            ) {

                throw new Error(
                    data.message ||
                    data.error ||
                    `Verification API returned HTTP ${response.status}.`
                );

            }


            if (
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Farmer verification could not be completed."
                );

            }


            /*
             * Some backend implementations return:
             *
             * {
             *     success: true,
             *     farmer: {...}
             * }
             *
             * Others may return the farmer under data.
             *
             * Support both without changing the backend.
             */

            const farmer =
                data.farmer ||
                data.data ||
                data;


            if (
                !farmer ||
                typeof farmer !== "object"
            ) {

                throw new Error(
                    "Verification succeeded but no farmer record was returned."
                );

            }


            // ==================================
            // SAVE VERIFIED FARMER
            // ==================================

            saveVerifiedFarmer(
                farmer,
                kccNumber,
                aadhaar,
                matchedFarmer
            );


            // ==================================
            // UPDATE PROFILE UI
            // ==================================

            populateVerifiedProfile(
                farmer,
                matchedFarmer
            );


            // ==================================
            // SUCCESS STATE
            // ==================================

            fetchBtn.innerHTML =
                '<i class="fa-solid fa-circle-check"></i> Farmer Records Verified';


            console.log(
                "[Verification] Farmer verified successfully."
            );


            console.log(
                "[Verification] KCC:",
                sessionStorage.getItem(
                    "kccNumber"
                )
            );


            console.log(
                "[Verification] Aadhaar:",
                sessionStorage.getItem(
                    "aadhaarNumber"
                )
            );


            console.log(
                "[Verification] Farmer ID:",
                sessionStorage.getItem(
                    "farmerId"
                )
            );


            /*
             * Keep the button usable so the user can
             * re-run verification if required.
             */

        } catch (error) {

            console.error(
                "[Verification] Farmer verification failed:",
                error
            );


            clearVerificationSession();


            resetVerifiedProfile();


            fetchBtn.innerHTML =
                originalHTML;


            alert(
                `Verification failed.\n\n${error.message}`
            );

        } finally {

            fetchBtn.disabled =
                false;

        }

    }


    // ==========================================
    // BACKEND REGISTRATION HELPER
    // ==========================================

    async function registerFarmerBackend(
        formData
    ) {

        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/api/auth/register-farmer`,
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
                                formData
                            )

                    }
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success ||
                !data.farmer
            ) {

                return false;

            }


            const farmer =
                data.farmer;


            const kccNumber =
                farmer.kccNumber ||
                farmer.kcc ||
                formData.kccNumber ||
                "";


            const aadhaar =
                formData.aadhaarNumber ||
                formData.aadhaar ||
                "";


            /*
             * Use the same canonical persistence
             * mechanism as the main verification flow.
             */

            saveVerifiedFarmer(
                farmer,
                kccNumber,
                aadhaar,
                null
            );


            console.log(
                "[Verification] Backend helper saved farmer session:",
                {
                    farmerId:
                        farmer.farmerId ||
                        farmer.id,

                    kccNumber:
                        kccNumber
                }
            );


            return true;

        } catch (error) {

            console.error(
                "[Verification] Backend registration error:",
                error
            );

            return false;

        }

    }


    // ==========================================
    // EXPOSE FUNCTIONS
    // ==========================================

    window.registerFarmerBackend =
        registerFarmerBackend;


    window.fetchFarmerRecords =
        fetchFarmerRecords;


    // ==========================================
    // INITIALIZE VERIFICATION
    // ==========================================

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            const fetchBtn =
                document.getElementById(
                    "btn-fetch"
                );


            if (!fetchBtn) {

                console.error(
                    "[Verification] #btn-fetch not found."
                );

                return;

            }


            /*
             * Prevent duplicate listener registration.
             */

            if (
                fetchBtn.dataset.verificationBound ===
                "true"
            ) {

                return;

            }


            fetchBtn.dataset.verificationBound =
                "true";


            fetchBtn.addEventListener(
                "click",
                fetchFarmerRecords
            );


            console.log(
                "[Verification] Ready."
            );

        }
    );

})();
// Dynamic navbar profile update & preset trigger sync
document.getElementById('farmer-selector')?.addEventListener('change', (e) => {
    const kccVal = e.target.value;
    const avatarMap = {
        'KCC-PB-2024-8841': 'SR',
        'KCC-PB-2024-9912': 'GK',
        'KCC-PB-2024-7734': 'RK'
    };
    const avatarEl = document.getElementById('nav-user-avatar');
    if (avatarEl) avatarEl.textContent = avatarMap[kccVal] || 'KS';

    const kccInput = document.getElementById('kcc-number-input');
    if (kccInput) {
        kccInput.value = kccVal;
        const fetchBtn = document.getElementById('btn-fetch-farmer');
        if (fetchBtn) fetchBtn.click();
    }
});