
document.addEventListener("DOMContentLoaded", function () {
    /* =========================================================
       ADMIN INITIALS
    ========================================================== */

    const adminNameElement =
        document.getElementById("admin-user-name");

    const adminAvatarElement =
        document.getElementById("admin-user-avatar");

    function generateInitials(name) {
        if (!name) {
            return "AD";
        }

        const cleaned = name
            .trim()
            .replace(/\s+/g, " ");

        if (!cleaned) {
            return "AD";
        }

        const parts = cleaned.split(" ");

        if (parts.length >= 2) {
            return (
                parts[0][0] +
                parts[parts.length - 1][0]
            ).toUpperCase();
        }

        return cleaned.slice(0, 2).toUpperCase();
    }

    function updateAdminAvatar() {
        if (!adminNameElement || !adminAvatarElement) {
            return;
        }

        adminAvatarElement.textContent =
            generateInitials(
                adminNameElement.textContent.trim()
            );
    }

    updateAdminAvatar();

    if (adminNameElement) {
        const observer = new MutationObserver(updateAdminAvatar);

        observer.observe(adminNameElement, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    /* =========================================================
       DARK / LIGHT MODE
    ========================================================== */

    const themeButton =
        document.getElementById("theme-toggle-btn");

    const themeIcon =
        document.getElementById("theme-toggle-icon");

    const THEME_KEY = "kisan-setu-admin-theme";

    function updateThemeIcon() {
        if (!themeIcon) {
            return;
        }

        const isDark =
            document.body.classList.contains("dark-mode");

        themeIcon.className = isDark
            ? "fa-solid fa-sun"
            : "fa-solid fa-moon";
    }

    const savedTheme =
        localStorage.getItem(THEME_KEY);

    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
    } else if (
        !savedTheme &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
        document.body.classList.add("dark-mode");
    }

    updateThemeIcon();

    if (themeButton) {
        themeButton.addEventListener("click", function () {
            document.body.classList.toggle("dark-mode");

            const isDark =
                document.body.classList.contains("dark-mode");

            localStorage.setItem(
                THEME_KEY,
                isDark ? "dark" : "light"
            );

            updateThemeIcon();
        });
    }

    /* =========================================================
       DATE + CALENDAR
    ========================================================== */

    const visibleDateInput =
        document.getElementById("farmers-date-picker");

    const nativeDateInput =
        document.getElementById("hidden-farmers-native-date");

    const calendarButton =
        document.getElementById("farmers-calendar-btn");

    const currentDateText =
        document.getElementById("current-date");

    function formatDisplayDate(yyyyMmDd) {
        if (!yyyyMmDd) {
            return "";
        }

        const parts = yyyyMmDd.split("-");

        if (parts.length !== 3) {
            return yyyyMmDd;
        }

        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    function formatNativeDate(ddMmYyyy) {
        if (!ddMmYyyy) {
            return "";
        }

        const parts = ddMmYyyy.split("/");

        if (parts.length !== 3) {
            return "";
        }

        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    function setToday() {
        const today = new Date();

        const dd = String(today.getDate()).padStart(2, "0");
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const yyyy = today.getFullYear();

        if (visibleDateInput) {
            visibleDateInput.value = `${dd}/${mm}/${yyyy}`;
        }

        if (nativeDateInput) {
            nativeDateInput.value = `${yyyy}-${mm}-${dd}`;
        }

        if (currentDateText) {
            currentDateText.textContent =
                today.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                });
        }
    }

    function updateCurrentDateTextFromInput() {
        if (!visibleDateInput || !currentDateText) {
            return;
        }

        const nativeValue =
            formatNativeDate(visibleDateInput.value);

        if (!nativeValue) {
            return;
        }

        const date = new Date(nativeValue);

        if (Number.isNaN(date.getTime())) {
            return;
        }

        currentDateText.textContent =
            date.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });
    }

    function openCalendar() {
        if (!nativeDateInput) {
            return;
        }

        if (typeof nativeDateInput.showPicker === "function") {
            try {
                nativeDateInput.showPicker();
            } catch (error) {
                nativeDateInput.click();
            }
        } else {
            nativeDateInput.click();
        }
    }

    setToday();

    if (nativeDateInput && visibleDateInput) {
        nativeDateInput.addEventListener("change", function () {
            visibleDateInput.value =
                formatDisplayDate(nativeDateInput.value);

            updateCurrentDateTextFromInput();

            visibleDateInput.dispatchEvent(
                new Event("change", { bubbles: true })
            );
        });

        visibleDateInput.addEventListener("change", function () {
            const formatted =
                formatNativeDate(visibleDateInput.value);

            if (formatted) {
                nativeDateInput.value = formatted;
            }

            updateCurrentDateTextFromInput();
        });

        visibleDateInput.addEventListener("input", function () {
            let numbers = visibleDateInput.value
                .replace(/\D/g, "")
                .slice(0, 8);

            let formatted = numbers;

            if (numbers.length > 2) {
                formatted =
                    numbers.slice(0, 2) +
                    "/" +
                    numbers.slice(2);
            }

            if (numbers.length > 4) {
                formatted =
                    numbers.slice(0, 2) +
                    "/" +
                    numbers.slice(2, 4) +
                    "/" +
                    numbers.slice(4);
            }

            visibleDateInput.value = formatted;
        });
    }

    if (calendarButton) {
        calendarButton.addEventListener("click", function (event) {
            event.preventDefault();
            openCalendar();
        });
    }

    /* =========================================================
       REFRESH BUTTONS
       Does not change backend logic.
       It only calls existing loadFarmers() if present.
    ========================================================== */

    const refreshFarmersButton =
        document.getElementById("refresh-farmers");

    const refreshSearchButton =
        document.getElementById("farmer-search-refresh");

    const searchInput =
        document.getElementById("farmer-search-input");

    function refreshFarmersData() {
        if (typeof window.loadFarmers === "function") {
            const searchValue =
                searchInput?.value?.trim() || "";

            window.loadFarmers(searchValue);
        }
    }

    if (refreshFarmersButton) {
        refreshFarmersButton.addEventListener(
            "click",
            refreshFarmersData
        );
    }

    if (refreshSearchButton) {
        refreshSearchButton.addEventListener(
            "click",
            refreshFarmersData
        );
    }

    /* =========================================================
       PAGE TRANSITION FOR NAV LINKS
    ========================================================== */

    const overlay =
        document.getElementById("page-transition-overlay");

    const transitionLinks =
        document.querySelectorAll(
            '.admin-nav-item, #admin-farmer-portal-link'
        );

    transitionLinks.forEach(function (link) {
        link.addEventListener("click", function (event) {
            const href = link.getAttribute("href");

            if (!href || href.startsWith("#")) {
                return;
            }

            event.preventDefault();

            if (overlay) {
                overlay.classList.add("active");
            }

            setTimeout(function () {
                window.location.href = href;
            }, 180);
        });
    });
});
