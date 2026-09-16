/* =========================================================
   KISAN SETU
   ADMIN PORTAL SHARED NAVIGATION
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const API_BASE_URL = "http://localhost:5050";

    const ADMIN_PAGES = {
        dashboard: "dashboard.html",
        farmers: "farmers.html",
        mandi: "mandi.html",
        queue: "queue.html",
        payments: "payment.html",
        reports: "reports.html"
    };

    const FARMER_PORTAL_PATH = "../farmer/index.html";


    /* =====================================================
       AUTHENTICATION
    ===================================================== */

    function isAdminAuthenticated() {

        const authenticated =
            sessionStorage.getItem(
                "kisanSetuAdminAuthenticated"
            );

        const session =
            sessionStorage.getItem(
                "kisanSetuAdminSession"
            );

        return (
            authenticated === "true" &&
            !!session
        );
    }


    function requireAdminAuthentication() {

        if (!isAdminAuthenticated()) {

            window.location.href = "admin.html";

            return false;
        }

        return true;
    }


    /* =====================================================
       CURRENT PAGE
    ===================================================== */

    function getCurrentPage() {

        const currentFile =
            window.location.pathname
                .split("/")
                .pop()
                .toLowerCase();


        if (currentFile === "dashboard.html") {
            return "dashboard";
        }


        if (currentFile === "farmers.html") {
            return "farmers";
        }


        if (currentFile === "mandi.html") {
            return "mandi";
        }


        if (currentFile === "queue.html") {
            return "queue";
        }


        if (
            currentFile === "payment.html" ||
            currentFile === "payments.html"
        ) {
            return "payments";
        }


        if (currentFile === "reports.html") {
            return "reports";
        }


        return "";
    }


    /* =====================================================
       NAVIGATION
    ===================================================== */

    function navigateTo(page) {

        if (!ADMIN_PAGES[page]) {
            return;
        }

        window.location.href =
            ADMIN_PAGES[page];
    }


    /* =====================================================
       ADMIN LOGOUT
    ===================================================== */

    async function logoutAdmin() {

        const session =
            sessionStorage.getItem(
                "kisanSetuAdminSession"
            );


        try {

            await fetch(
                `${API_BASE_URL}/api/admin/logout`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "x-admin-session":
                            session || ""
                    }
                }
            );

        } catch (error) {

            console.warn(
                "Admin logout request failed:",
                error
            );
        }


        sessionStorage.removeItem(
            "kisanSetuAdminAuthenticated"
        );

        sessionStorage.removeItem(
            "kisanSetuAdminUser"
        );

        sessionStorage.removeItem(
            "kisanSetuAdminSession"
        );


        window.location.href =
            "admin.html";
    }


    /* =====================================================
       ADMIN USER
    ===================================================== */

    function getAdminUsername() {

        const storedUser =
            sessionStorage.getItem(
                "kisanSetuAdminUser"
            );


        if (!storedUser) {
            return "Administrator";
        }


        try {

            const parsed =
                JSON.parse(storedUser);

            return (
                parsed.username ||
                parsed.name ||
                parsed.user ||
                "Administrator"
            );

        } catch (error) {

            return (
                storedUser ||
                "Administrator"
            );
        }
    }


    function renderAdminUsername() {

        const elements =
            document.querySelectorAll(
                "#admin-user-name, .admin-user-name"
            );


        const username =
            getAdminUsername();


        elements.forEach(function (element) {

            element.textContent =
                username;

        });
    }


    /* =====================================================
       ACTIVE NAVIGATION
    ===================================================== */

    function setActiveNavigation() {

        const currentPage =
            getCurrentPage();


        const navLinks =
            document.querySelectorAll(
                "[data-admin-page]"
            );


        navLinks.forEach(function (link) {

            const targetPage =
                link.getAttribute(
                    "data-admin-page"
                );


            if (
                targetPage === currentPage
            ) {

                link.classList.add(
                    "active"
                );

                link.setAttribute(
                    "aria-current",
                    "page"
                );

            } else {

                link.classList.remove(
                    "active"
                );

                link.removeAttribute(
                    "aria-current"
                );
            }

        });
    }


    /* =====================================================
       ADMIN NAVIGATION LINKS
    ===================================================== */

    function bindNavigation() {

        const navLinks =
            document.querySelectorAll(
                "[data-admin-page]"
            );


        navLinks.forEach(function (link) {

            link.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();


                    const page =
                        link.getAttribute(
                            "data-admin-page"
                        );


                    navigateTo(page);

                }
            );

        });
    }


    /* =====================================================
       LOGOUT BUTTONS
    ===================================================== */

    function bindLogoutButtons() {

        const logoutButtons =
            document.querySelectorAll(
                "#admin-logout-button, .admin-logout-button"
            );


        logoutButtons.forEach(function (button) {

            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    logoutAdmin();

                }
            );

        });
    }


    /* =====================================================
       FARMER PORTAL SWITCH
    ===================================================== */

    function bindFarmerPortalSwitch() {

        const buttons =
            document.querySelectorAll(
                ".admin-farmer-portal-button"
            );


        buttons.forEach(function (button) {

            /*
             * Always point directly to the real
             * farmer portal. This prevents stale
             * ../index.html links from breaking.
             */

            button.setAttribute(
                "href",
                FARMER_PORTAL_PATH
            );


            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    window.location.href =
                        FARMER_PORTAL_PATH;

                }
            );

        });
    }


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    function initializeAdminNavigation() {

        const currentPage =
            getCurrentPage();


        /*
         * Login page must remain accessible
         * without an existing admin session.
         */

        const isLoginPage =
            window.location.pathname
                .toLowerCase()
                .endsWith(
                    "/admin/admin.html"
                );


        if (isLoginPage) {

            return;
        }


        /*
         * Every authenticated admin page
         * requires a valid admin session.
         */

        if (
            currentPage &&
            !isAdminAuthenticated()
        ) {

            window.location.href =
                "admin.html";

            return;
        }


        renderAdminUsername();

        setActiveNavigation();

        bindNavigation();

        bindLogoutButtons();

        bindFarmerPortalSwitch();
    }


    /* =====================================================
       GLOBAL API
    ===================================================== */

    window.kisanSetuAdminNavigation = {

        navigateTo,
        logoutAdmin,
        isAdminAuthenticated,
        requireAdminAuthentication,
        getAdminUsername,
        getCurrentPage
    };


    /* =====================================================
       START
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeAdminNavigation
        );

    } else {

        initializeAdminNavigation();
    }

})();