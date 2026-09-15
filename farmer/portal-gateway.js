/* =========================================================
   KISAN SETU PORTAL GATEWAY
   ========================================================= */

(function () {

    "use strict";


    /*
     * Farmer portal.
     *
     * portal-gateway.html is inside the /farmer folder,
     * and index.html is also inside the /farmer folder.
     */
    const FARMER_PORTAL_URL = "index.html";


    /*
     * Admin portal.
     *
     * The admin folder is outside the /farmer folder:
     *
     * project/
     * ├── farmer/
     * │   ├── index.html
     * │   └── portal-gateway.html
     * │
     * └── admin/
     *     └── admin.html
     *
     * Therefore we must go one directory up first.
     */
    const ADMIN_PORTAL_URL = "../admin/admin.html";


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