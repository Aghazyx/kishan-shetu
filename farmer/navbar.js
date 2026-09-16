(function () {
    "use strict";

    // ==========================================
    // KISAN SETU - NAVBAR SCRIPT
    // ==========================================

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            // ======================================
            // NAVIGATION ITEM ACTIVE STATE
            // ======================================

            const navItems =
                document.querySelectorAll(
                    ".nav-item"
                );


            navItems.forEach(
                function (item) {

                    item.addEventListener(
                        "click",
                        function () {

                            navItems.forEach(
                                function (navItem) {

                                    navItem.classList.remove(
                                        "active"
                                    );

                                }
                            );


                            item.classList.add(
                                "active"
                            );

                        }
                    );

                }
            );


            console.log(
                "[Navbar] Navigation initialized."
            );

        }
    );

})();