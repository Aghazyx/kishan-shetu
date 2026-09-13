/* =========================================================
   KISAN SETU PORTAL GATEWAY
   ========================================================= */

(function () {

    "use strict";


    /*
     * Existing farmer landing page.
     *
     * If your farmer entry page is index.html,
     * leave this unchanged.
     */
    const FARMER_PORTAL_URL = "index.html";


    /*
     * Existing admin login page.
     */
    const ADMIN_PORTAL_URL = "admin/admin.html";


    const farmerButton =
        document.getElementById("gateway-farmer-button");

    const adminButton =
        document.getElementById("gateway-admin-button");


    /*
     * Farmer Portal
     */
    if (farmerButton) {

        farmerButton.addEventListener("click", function () {

            window.location.href = FARMER_PORTAL_URL;

        });

    }


    /*
     * Admin Portal
     */
    if (adminButton) {

        adminButton.addEventListener("click", function () {

            window.location.href = ADMIN_PORTAL_URL;

        });

    }

})();