// ==========================================
// KISAN SETU - LIFESTYLE / TAB SWITCHING
// ==========================================

(function () {
    "use strict";

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            const tabs =
                document.querySelectorAll(
                    ".tab-item"
                );


            // ======================================
            // TAB CLICK HANDLING
            // ======================================

            tabs.forEach(
                function (tab) {

                    tab.addEventListener(
                        "click",
                        function () {

                            // Remove active state
                            // from all tabs
                            tabs.forEach(
                                function (item) {

                                    item.classList.remove(
                                        "active"
                                    );

                                }
                            );


                            // Activate selected tab
                            tab.classList.add(
                                "active"
                            );


                            // Get selected tab identifier
                            const targetTab =
                                tab.getAttribute(
                                    "data-tab"
                                );


                            if (targetTab) {

                                console.log(
                                    `[Lifestyle] Switched to tab: ${targetTab}`
                                );

                            }

                        }
                    );

                }
            );


            console.log(
                "[Lifestyle] Tab navigation initialized."
            );

        }
    );

})();