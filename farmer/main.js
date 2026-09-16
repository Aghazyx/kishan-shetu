// ==========================================
// KISAN SETU MAIN DASHBOARD SCRIPT
// Single-page 7-stage navigation controller
// ==========================================

(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {

        // ========================================
        // CONSTANTS
        // ========================================

        const STAGE_STORAGE_KEY =
            "kisanSetuCurrentStage";

        const MAX_STAGE = 7;


        // ========================================
        // STORAGE HELPERS
        // ========================================

        function getStorageValue(key) {
            return sessionStorage.getItem(key);
        }


        function getSavedBooking() {

            const storedBooking =
                getStorageValue(
                    "kisanSetuBooking"
                );

            if (!storedBooking) {
                return null;
            }

            try {

                return JSON.parse(
                    storedBooking
                );

            } catch (error) {

                console.error(
                    "[Kisan Setu] Invalid booking data:",
                    error
                );

                return null;
            }
        }


        function getTokenId() {

            return (
                getStorageValue(
                    "kisanSetuTokenId"
                ) ||
                getStorageValue(
                    "tokenId"
                ) ||
                getStorageValue(
                    "activeTokenId"
                ) ||
                getStorageValue(
                    "bookingTokenId"
                )
            );
        }


        // ========================================
        // FARMER VERIFICATION CHECK
        // ========================================

        function isFarmerVerified() {

            /*
             * verification.js may store:
             *
             * verifiedFarmer = "true"
             *
             * OR
             *
             * verifiedFarmer = JSON farmer object
             *
             * OR
             *
             * farmerVerified = "true"
             *
             * Therefore do NOT require the value to be
             * exactly "true".
             */

            const verifiedFarmer =
                getStorageValue(
                    "verifiedFarmer"
                );

            const farmerVerified =
                getStorageValue(
                    "farmerVerified"
                );

            const verifiedFarmerId =
                getStorageValue(
                    "verifiedFarmerId"
                );

            const farmerId =
                getStorageValue(
                    "farmerId"
                );


            function isValidStoredValue(
                value
            ) {

                if (
                    value === null ||
                    value === undefined ||
                    value === ""
                ) {
                    return false;
                }

                if (
                    value === "false" ||
                    value === "null" ||
                    value === "undefined"
                ) {
                    return false;
                }

                return true;
            }


            return (
                isValidStoredValue(
                    verifiedFarmer
                ) ||
                isValidStoredValue(
                    farmerVerified
                ) ||
                isValidStoredValue(
                    verifiedFarmerId
                ) ||
                isValidStoredValue(
                    farmerId
                )
            );
        }


        // ========================================
        // GEOFENCE CHECK
        // ========================================

        function isGeofenceVerified() {

            return (
                getStorageValue(
                    "geofenceVerified"
                ) === "true"
            );
        }


        // ========================================
        // RECEIPT CHECK
        // ========================================

        function getReceipt() {

            return getStorageValue(
                "kisanSetuReceipt"
            );
        }


        // ========================================
        // PAYMENT CHECK
        // ========================================

        function isDBTDispatched() {

            return (
                getStorageValue(
                    "kisanSetuDBTDispatched"
                ) === "true"
            );
        }


        // ========================================
        // SAVED STAGE
        // ========================================

        function getSavedStage() {

            const savedStage =
                Number(
                    getStorageValue(
                        STAGE_STORAGE_KEY
                    )
                );


            if (
                Number.isInteger(
                    savedStage
                ) &&
                savedStage >= 1 &&
                savedStage <= MAX_STAGE
            ) {

                return savedStage;
            }


            return 1;
        }


        // ========================================
        // COMPLETE WORKFLOW STATE
        // ========================================

        function getWorkflowState() {

            return {

                farmerVerified:
                    isFarmerVerified(),

                booking:
                    getSavedBooking(),

                tokenId:
                    getTokenId(),

                geofenceVerified:
                    isGeofenceVerified(),

                receipt:
                    getReceipt(),

                dbtDispatched:
                    isDBTDispatched()

            };
        }


        // ========================================
        // HIGHEST REACHABLE STAGE
        // ========================================

        function getHighestReachableStage() {

            const state =
                getWorkflowState();


            // ------------------------------------
            // Stage 7
            // ------------------------------------

            if (
                state.receipt
            ) {

                return 7;
            }


            // ------------------------------------
            // Stage 6
            // ------------------------------------

            if (
                state.geofenceVerified &&
                state.tokenId &&
                state.booking
            ) {

                return 6;
            }


            // ------------------------------------
            // Stage 5
            // ------------------------------------

            if (
                state.tokenId &&
                state.booking
            ) {

                return 5;
            }


            // ------------------------------------
            // Stage 3
            // ------------------------------------

            if (
                state.farmerVerified
            ) {

                return 3;
            }


            // ------------------------------------
            // Stage 2
            // ------------------------------------

            const savedStage =
                getSavedStage();


            if (
                savedStage >= 2
            ) {

                return 2;
            }


            return 1;
        }


        // ========================================
        // STAGE NAVIGATION
        // ========================================

        window.switchStage =
            function (stageNumber) {

                stageNumber =
                    Number(
                        stageNumber
                    );


                if (
                    !Number.isInteger(
                        stageNumber
                    ) ||
                    stageNumber < 1 ||
                    stageNumber > MAX_STAGE
                ) {

                    console.error(
                        "[Kisan Setu] Invalid stage number:",
                        stageNumber
                    );

                    return;
                }


                const targetView =
                    document.getElementById(
                        "stage-view-" +
                        stageNumber
                    );


                if (!targetView) {

                    console.error(
                        "[Kisan Setu] Stage view not found:",
                        "stage-view-" +
                        stageNumber
                    );

                    return;
                }


                const stageViews =
                    document.querySelectorAll(
                        ".stage-view"
                    );


                const stepItems =
                    document.querySelectorAll(
                        ".step-item"
                    );


                // --------------------------------
                // Hide all stages
                // --------------------------------

                stageViews.forEach(
                    function (view) {

                        view.classList.remove(
                            "active-view"
                        );

                    }
                );


                // --------------------------------
                // Show requested stage
                // --------------------------------

                targetView.classList.add(
                    "active-view"
                );


                // --------------------------------
                // Update stepper
                // --------------------------------

                stepItems.forEach(
                    function (item) {

                        const itemStage =
                            Number(
                                item.dataset.stage
                            );


                        item.classList.remove(
                            "active"
                        );

                        item.classList.remove(
                            "completed"
                        );


                        if (
                            itemStage ===
                            stageNumber
                        ) {

                            item.classList.add(
                                "active"
                            );
                        }


                        if (
                            itemStage <
                            stageNumber
                        ) {

                            item.classList.add(
                                "completed"
                            );
                        }

                    }
                );


                // --------------------------------
                // Save current stage
                // --------------------------------

                sessionStorage.setItem(
                    STAGE_STORAGE_KEY,
                    String(
                        stageNumber
                    )
                );


                // --------------------------------
                // Stage 3 refresh
                // --------------------------------

                if (
                    stageNumber === 3
                ) {

                    setTimeout(
                        function () {

                            if (
                                typeof window.refreshSlotAvailability ===
                                "function"
                            ) {

                                window.refreshSlotAvailability();
                            }

                        },
                        50
                    );
                }


                // --------------------------------
                // Stage 5 map refresh
                // --------------------------------

                if (
                    stageNumber === 5
                ) {

                    setTimeout(
                        function () {

                            if (
                                typeof window.refreshGeofenceMap ===
                                "function"
                            ) {

                                window.refreshGeofenceMap();
                            }

                        },
                        100
                    );


                    setTimeout(
                        function () {

                            if (
                                typeof window.refreshGeofenceMap ===
                                "function"
                            ) {

                                window.refreshGeofenceMap();
                            }

                        },
                        500
                    );


                    setTimeout(
                        function () {

                            if (
                                typeof window.refreshGeofenceMap ===
                                "function"
                            ) {

                                window.refreshGeofenceMap();
                            }

                        },
                        1000
                    );
                }


                // --------------------------------
                // Scroll
                // --------------------------------

                const mainWrapper =
                    document.querySelector(
                        ".main-wrapper"
                    );


                if (
                    mainWrapper
                ) {

                    mainWrapper.scrollIntoView({
                        behavior:
                            "smooth",

                        block:
                            "start"
                    });
                }


                // --------------------------------
                // Broadcast stage change
                // --------------------------------

                document.dispatchEvent(
                    new CustomEvent(
                        "kisanSetu:stageChanged",
                        {
                            detail: {
                                stage:
                                    stageNumber
                            }
                        }
                    )
                );


                console.log(
                    "[Kisan Setu] Switched to Stage " +
                    stageNumber
                );
            };


        // ========================================
        // COMPLETE CURRENT STAGE
        // ========================================

        window.completeStageAndProceed =
            function (
                currentStage,
                nextStage
            ) {

                currentStage =
                    Number(
                        currentStage
                    );

                nextStage =
                    Number(
                        nextStage
                    );


                if (
                    !Number.isInteger(
                        currentStage
                    ) ||
                    !Number.isInteger(
                        nextStage
                    )
                ) {

                    console.error(
                        "[Kisan Setu] Invalid stage transition:",
                        currentStage,
                        nextStage
                    );

                    return;
                }


                const currentView =
                    document.getElementById(
                        "stage-view-" +
                        currentStage
                    );


                const nextView =
                    document.getElementById(
                        "stage-view-" +
                        nextStage
                    );


                if (
                    !currentView ||
                    !nextView
                ) {

                    console.error(
                        "[Kisan Setu] Stage transition failed:",
                        currentStage,
                        "→",
                        nextStage
                    );

                    return;
                }


                // --------------------------------
                // Save next stage
                // --------------------------------

                sessionStorage.setItem(
                    STAGE_STORAGE_KEY,
                    String(
                        nextStage
                    )
                );


                // --------------------------------
                // Switch
                // --------------------------------

                window.switchStage(
                    nextStage
                );

            };


        // ========================================
        // STEPPER NAVIGATION
        // ========================================

        const stepItems =
            document.querySelectorAll(
                ".step-item"
            );


        stepItems.forEach(
            function (step) {

                step.addEventListener(
                    "click",
                    function () {

                        const stageNumber =
                            Number(
                                step.dataset.stage
                            );


                        if (
                            !Number.isInteger(
                                stageNumber
                            )
                        ) {

                            return;
                        }


                        const highestReachableStage =
                            getHighestReachableStage();


                        if (
                            stageNumber >
                            highestReachableStage
                        ) {

                            console.warn(
                                "[Kisan Setu] Stage " +
                                stageNumber +
                                " is locked. Highest reachable stage: " +
                                highestReachableStage
                            );

                            return;
                        }


                        window.switchStage(
                            stageNumber
                        );

                    }
                );

            }
        );


        // ========================================
        // HARD STAGE 2 GUARD
        // ========================================
        /*
         * Capture phase is intentional.
         *
         * The HTML button still has an inline onclick.
         * Capture phase runs before that onclick.
         */

        const stage2ProceedButton =
            document.getElementById(
                "btn-proceed-stage-2"
            );


        if (
            stage2ProceedButton
        ) {

            stage2ProceedButton.addEventListener(
                "click",
                function (event) {

                    if (
                        !isFarmerVerified()
                    ) {

                        event.preventDefault();

                        event.stopImmediatePropagation();

                        alert(
                            "Complete farmer verification before proceeding to Stage 3."
                        );

                        return false;
                    }

                },
                true
            );
        }


        // ========================================
        // HARD STAGE 5 GUARD
        // ========================================

        const stage5ProceedButton =
            document.getElementById(
                "btn-proceed-stage-5"
            );


        if (
            stage5ProceedButton
        ) {

            stage5ProceedButton.addEventListener(
                "click",
                function (event) {

                    if (
                        !isGeofenceVerified()
                    ) {

                        event.preventDefault();

                        event.stopImmediatePropagation();

                        alert(
                            "Complete GPS geofence verification before proceeding to Stage 6."
                        );

                        return false;
                    }

                },
                true
            );
        }


        // ========================================
        // NOTIFICATION BUTTON
        // ========================================

        const bellBtn =
            document.querySelector(
                ".icon-badge-btn"
            );


        if (
            bellBtn
        ) {

            bellBtn.addEventListener(
                "click",
                function () {

                    const state =
                        getWorkflowState();


                    if (
                        state.dbtDispatched
                    ) {

                        alert(
                            "Notifications:\n\n" +
                            "1. Procurement completed.\n" +
                            "2. Digital receipt generated.\n" +
                            "3. DBT payment dispatched successfully."
                        );

                        return;
                    }


                    if (
                        state.receipt
                    ) {

                        alert(
                            "Notifications:\n\n" +
                            "1. Weighment completed.\n" +
                            "2. Quality assay approved.\n" +
                            "3. Digital receipt generated.\n" +
                            "4. Proceed to Stage 7 for DBT payment."
                        );

                        return;
                    }


                    if (
                        state.geofenceVerified
                    ) {

                        alert(
                            "Notifications:\n\n" +
                            "1. GPS geofence verification completed.\n" +
                            "2. Vehicle entered Active Gate Queue.\n" +
                            "3. Proceed to Stage 6 for weighment and quality logging."
                        );

                        return;
                    }


                    if (
                        state.booking &&
                        state.tokenId
                    ) {

                        alert(
                            "Notifications:\n\n" +
                            "1. Procurement slot booked.\n" +
                            "2. Digital token generated.\n" +
                            "3. Proceed to Stage 5 for geofenced arrival."
                        );

                        return;
                    }


                    if (
                        state.farmerVerified
                    ) {

                        alert(
                            "Notifications:\n\n" +
                            "1. Land verification complete.\n" +
                            "2. Farmer profile verified.\n" +
                            "3. You can proceed to slot booking."
                        );

                        return;
                    }


                    alert(
                        "Notifications:\n\n" +
                        "1. Complete farmer verification to continue.\n" +
                        "2. No active procurement slot found."
                    );

                }
            );
        }


        // ========================================
        // INITIAL STAGE
        // ========================================

        function determineInitialStage() {

            const state =
                getWorkflowState();


            // --------------------------------
            // Completed transaction
            // --------------------------------

            if (
                state.dbtDispatched &&
                state.receipt
            ) {

                return 7;
            }


            // --------------------------------
            // Stage 6 complete
            // --------------------------------

            if (
                state.receipt
            ) {

                return 7;
            }


            // --------------------------------
            // Stage 5 complete
            // --------------------------------

            if (
                state.geofenceVerified &&
                state.tokenId &&
                state.booking
            ) {

                return 6;
            }


            // --------------------------------
            // Active booking
            // --------------------------------

            if (
                state.tokenId &&
                state.booking
            ) {

                return 4;
            }


            // --------------------------------
            // Farmer verified
            // --------------------------------

            if (
                state.farmerVerified
            ) {

                return 3;
            }


            // --------------------------------
            // Saved stage
            // --------------------------------

            const savedStage =
                getSavedStage();


            /*
             * Do not allow a stale saved Stage 3/4/5/6/7
             * to bypass actual transaction state.
             */

            if (
                savedStage >= 3
            ) {

                return 2;
            }


            return savedStage;
        }


        // ========================================
        // INITIALIZE
        // ========================================

        const initialStage =
            determineInitialStage();


        window.switchStage(
            initialStage
        );


        // ========================================
        // DEBUG STATE
        // ========================================

        console.log(
            "[Kisan Setu] Dashboard initialized."
        );


        console.log(
            "[Kisan Setu] Farmer verified:",
            isFarmerVerified()
        );


        console.log(
            "[Kisan Setu] Token:",
            getTokenId()
        );


        console.log(
            "[Kisan Setu] Booking:",
            getSavedBooking()
        );


        console.log(
            "[Kisan Setu] Geofence verified:",
            isGeofenceVerified()
        );


        console.log(
            "[Kisan Setu] Highest reachable stage:",
            getHighestReachableStage()
        );


        console.log(
            "[Kisan Setu] Initial stage:",
            initialStage
        );

    });

})();