// ==========================================
// KISAN SETU - STAGE / PROGRESS TOGGLE
// ==========================================

(function () {
    "use strict";

    /*
     * Stage navigation is controlled centrally
     * by main.js.
     *
     * This file intentionally does not attach
     * another click handler to the stepper.
     *
     * Keeping a single navigation controller
     * prevents conflicting active/completed
     * states between scripts.
     */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            console.log(
                "[Stage Toggle] Navigation delegated to main.js."
            );

        }
    );

})();