(function () {
    "use strict";

    // ==========================================
    // KISAN SETU - STAGE 5
    // GEOFENCED ARRIVAL & GATE CHECK-IN
    // ==========================================

    const API_BASE_URL =
        "http://localhost:5050";

    const DEFAULT_MANDI = {
        centerId:
            "Mandi-Center-01",

        name:
            "Khanna Grain Market",

        latitude:
            30.702877,

        longitude:
            76.220222,

        radiusMeters:
            500
    };

    let map = null;
    let mandiMarker = null;
    let vehicleMarker = null;
    let geofenceCircle = null;

    let leafletLoading =
        false;

    let currentGPS = {
        latitude: null,
        longitude: null,
        accuracy: null
    };

    let currentDistanceKm =
        null;

    let verificationInProgress =
        false;


    // ==========================================
    // STORAGE
    // ==========================================

    function getStorageValue(
        key
    ) {

        return (
            sessionStorage.getItem(key) ||
            localStorage.getItem(key) ||
            ""
        );
    }


    function getJSON(
        key
    ) {

        const raw =
            getStorageValue(key);

        if (!raw) {
            return null;
        }

        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }


    function saveJSON(
        key,
        value
    ) {

        const serialized =
            JSON.stringify(value);

        sessionStorage.setItem(
            key,
            serialized
        );

        localStorage.setItem(
            key,
            serialized
        );
    }


    // ==========================================
    // BOOKING
    // ==========================================

    function getBooking() {

        return (
            getJSON(
                "kisanSetuBooking"
            ) ||
            getJSON(
                "kisanSetuStage4Booking"
            ) ||
            getJSON(
                "stage4Booking"
            ) ||
            null
        );
    }


    function getTokenId() {

        const booking =
            getBooking();

        return (
            booking?.tokenId ||
            getStorageValue(
                "activeTokenId"
            ) ||
            getStorageValue(
                "kisanSetuTokenId"
            ) ||
            ""
        );
    }


    function getCenterId() {

        const booking =
            getBooking();

        return (
            booking?.centerId ||
            getStorageValue(
                "geofenceCenterId"
            ) ||
            DEFAULT_MANDI.centerId
        );
    }


    function getMandi() {

        const centerId =
            getCenterId();

        if (
            centerId ===
            "Mandi-Center-02"
        ) {

            return {
                centerId,
                name:
                    "Karnal Central Krishi Mandi",
                latitude:
                    30.702877,
                longitude:
                    76.220222,
                radiusMeters:
                    500
            };
        }

        return DEFAULT_MANDI;
    }


    // ==========================================
    // DOM
    // ==========================================

    function setText(
        id,
        value
    ) {

        const element =
            document.getElementById(id);

        if (element) {
            element.textContent =
                value;
        }
    }


    // ==========================================
    // STAGE ACTIVE CHECK
    // ==========================================

    function isStage5Active() {

        const stage =
            document.getElementById(
                "stage-view-5"
            );

        if (!stage) {
            return false;
        }

        return stage.classList.contains(
            "active-view"
        );
    }


    // ==========================================
    // BUTTON STATE
    // ==========================================

    function updateControls() {

        const booking =
            getBooking();

        const hasBooking =
            Boolean(
                booking?.tokenId ||
                getTokenId()
            );


        const verifyButton =
            document.getElementById(
                "btn-verify-geofence"
            );

        if (verifyButton) {

            verifyButton.disabled =
                !hasBooking;

            verifyButton.style.opacity =
                hasBooking
                    ? "1"
                    : "0.55";

            verifyButton.style.cursor =
                hasBooking
                    ? "pointer"
                    : "not-allowed";
        }


        const proceedButton =
            document.getElementById(
                "btn-proceed-stage-6"
            );

        if (proceedButton) {

            const verified =
                getStorageValue(
                    "geofenceVerified"
                ) === "true";

            proceedButton.disabled =
                !verified;

            proceedButton.style.opacity =
                verified
                    ? "1"
                    : "0.65";
        }


        const demoButton =
            document.getElementById(
                "btn-prototype-geofence"
            );

        if (demoButton) {

            demoButton.disabled =
                !hasBooking;

            demoButton.style.opacity =
                hasBooking
                    ? "1"
                    : "0.55";
        }
    }


    // ==========================================
    // DISTANCE
    // ==========================================

    function calculateDistanceKm(
        lat1,
        lng1,
        lat2,
        lng2
    ) {

        const earthRadius =
            6371;

        const dLat =
            (
                (lat2 - lat1) *
                Math.PI
            ) / 180;

        const dLng =
            (
                (lng2 - lng1) *
                Math.PI
            ) / 180;

        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(
                lat1 *
                Math.PI /
                180
            ) *
            Math.cos(
                lat2 *
                Math.PI /
                180
            ) *
            Math.sin(dLng / 2) ** 2;

        const c =
            2 *
            Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
            );

        return (
            earthRadius * c
        );
    }


    function updateDistanceUI(
        distanceKm
    ) {

        currentDistanceKm =
            distanceKm;


        const distanceText =
            `${distanceKm.toFixed(2)} km`;


        setText(
            "map-distance-value",
            distanceText
        );

        setText(
            "current-vehicle-distance",
            distanceText
        );

        setText(
            "distance-from-mandi",
            distanceText
        );


        const statusInside =
            distanceKm <= 0.5;


        setText(
            "map-geofence-status",
            statusInside
                ? "Inside"
                : "Outside"
        );


        setText(
            "geofence-status",
            statusInside
                ? "Inside"
                : "Outside"
        );


        setText(
            "map-live-badge",
            statusInside
                ? "ELIGIBLE FOR CHECK-IN"
                : "OUTSIDE GEOFENCE"
        );


        if (statusInside) {

            setText(
                "gps-telemetry-status",
                "Inside Geofence"
            );

        } else {

            setText(
                "gps-telemetry-status",
                "Outside Geofence"
            );
        }


        const statusTitle =
            document.getElementById(
                "geofence-status-title"
            );

        const statusDescription =
            document.getElementById(
                "geofence-status-desc"
            );


        if (
            statusInside
        ) {

            if (statusTitle) {

                statusTitle.innerText =
                    "Vehicle Inside Mandi Geofence";
            }

            if (statusDescription) {

                statusDescription.innerText =
                    "Vehicle is within the 500 m permitted perimeter and is eligible for check-in.";
            }

        } else {

            if (statusTitle) {

                statusTitle.innerText =
                    "Vehicle Outside Mandi Geofence";
            }

            if (statusDescription) {

                statusDescription.innerText =
                    `Vehicle is ${distanceText} from the target mandi. Check-in requires the vehicle to be within 500 m.`;
            }
        }
    }


    // ==========================================
    // LEAFLET LOADER
    // ==========================================

    function loadLeaflet() {

        return new Promise(
            function (
                resolve,
                reject
            ) {

                if (
                    typeof window.L !==
                    "undefined"
                ) {

                    resolve(
                        window.L
                    );

                    return;
                }


                if (
                    leafletLoading
                ) {

                    const timer =
                        setInterval(
                            function () {

                                if (
                                    typeof window.L !==
                                    "undefined"
                                ) {

                                    clearInterval(
                                        timer
                                    );

                                    resolve(
                                        window.L
                                    );
                                }

                            },
                            100
                        );

                    setTimeout(
                        function () {

                            clearInterval(
                                timer
                            );

                            if (
                                typeof window.L ===
                                "undefined"
                            ) {

                                reject(
                                    new Error(
                                        "Leaflet failed to load."
                                    )
                                );
                            }

                        },
                        10000
                    );

                    return;
                }


                leafletLoading =
                    true;


                const css =
                    document.createElement(
                        "link"
                    );

                css.rel =
                    "stylesheet";

                css.href =
                    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

                css.crossOrigin =
                    "";

                document.head.appendChild(
                    css
                );


                const script =
                    document.createElement(
                        "script"
                    );

                script.src =
                    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

                script.crossOrigin =
                    "";

                script.onload =
                    function () {

                        leafletLoading =
                            false;

                        resolve(
                            window.L
                        );
                    };


                script.onerror =
                    function () {

                        leafletLoading =
                            false;

                        reject(
                            new Error(
                                "Unable to load Leaflet from CDN."
                            )
                        );
                    };


                document.head.appendChild(
                    script
                );
            }
        );
    }


    // ==========================================
    // MAP CONTAINER
    // ==========================================

    function getMapContainer() {

        let container =
            document.getElementById(
                "geofence-map"
            );

        if (container) {
            return container;
        }


        const possibleContainers =
            document.querySelectorAll(
                "#stage-view-5 .card-panel"
            );


        for (
            const card of possibleContainers
        ) {

            if (
                card.textContent
                    .toLowerCase()
                    .includes(
                        "live mandi geofence map"
                    )
            ) {

                container =
                    document.createElement(
                        "div"
                    );

                container.id =
                    "geofence-map";

                container.style.width =
                    "100%";

                container.style.height =
                    "320px";

                container.style.minHeight =
                    "320px";

                container.style.borderRadius =
                    "14px";

                container.style.overflow =
                    "hidden";

                card.appendChild(
                    container
                );

                return container;
            }
        }


        return null;
    }


    // ==========================================
    // INITIALIZE MAP
    // ==========================================

    async function initializeMap() {

        const container =
            getMapContainer();

        if (!container) {
            return;
        }


        try {

            const L =
                await loadLeaflet();

            const mandi =
                getMandi();


            if (
                !map
            ) {

                map =
                    L.map(
                        container,
                        {
                            zoomControl:
                                true
                        }
                    );


                L.tileLayer(
                    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                    {
                        maxZoom:
                            19,

                        attribution:
                            "&copy; OpenStreetMap contributors"
                    }
                ).addTo(
                    map
                );


                mandiMarker =
                    L.marker(
                        [
                            mandi.latitude,
                            mandi.longitude
                        ]
                    )
                        .addTo(
                            map
                        )
                        .bindPopup(
                            mandi.name
                        );


                geofenceCircle =
                    L.circle(
                        [
                            mandi.latitude,
                            mandi.longitude
                        ],
                        {
                            radius:
                                mandi.radiusMeters
                        }
                    )
                        .addTo(
                            map
                        );


                map.setView(
                    [
                        mandi.latitude,
                        mandi.longitude
                    ],
                    12
                );
            }


            /*
             * Leaflet often initializes inside a hidden
             * stage. Repeated invalidateSize calls prevent
             * the classic half-loaded/grey-tile problem.
             */

            const refreshMap =
                function () {

                    if (
                        map
                    ) {

                        map.invalidateSize(
                            true
                        );
                    }
                };


            refreshMap();

            setTimeout(
                refreshMap,
                150
            );

            setTimeout(
                refreshMap,
                500
            );

            setTimeout(
                refreshMap,
                1000
            );

            setTimeout(
                refreshMap,
                2000
            );


        } catch (error) {

            console.error(
                "[Stage 5] Map loading failed:",
                error
            );


            setText(
                "map-geofence-status",
                "Map unavailable"
            );
        }
    }


    // ==========================================
    // UPDATE VEHICLE MARKER
    // ==========================================

    function updateVehicleMarker(
        latitude,
        longitude
    ) {

        if (
            !map ||
            typeof window.L ===
            "undefined"
        ) {

            return;
        }


        const L =
            window.L;


        if (
            vehicleMarker
        ) {

            vehicleMarker.setLatLng(
                [
                    latitude,
                    longitude
                ]
            );

        } else {

            vehicleMarker =
                L.marker(
                    [
                        latitude,
                        longitude
                    ]
                )
                    .addTo(
                        map
                    )
                    .bindPopup(
                        "Vehicle GPS Location"
                    );
        }


        const mandi =
            getMandi();


        const bounds =
            L.latLngBounds(
                [
                    mandi.latitude,
                    mandi.longitude
                ],
                [
                    latitude,
                    longitude
                ]
            );


        map.fitBounds(
            bounds,
            {
                padding:
                    [
                        45,
                        45
                    ],
                maxZoom:
                    15
            }
        );


        setTimeout(
            function () {

                map.invalidateSize(
                    true
                );

            },
            250
        );
    }


    // ==========================================
    // GPS
    // ==========================================

    function handleGPS(
        position
    ) {

        currentGPS = {

            latitude:
                position.coords.latitude,

            longitude:
                position.coords.longitude,

            accuracy:
                position.coords.accuracy
        };


        const mandi =
            getMandi();


        const distance =
            calculateDistanceKm(
                currentGPS.latitude,
                currentGPS.longitude,
                mandi.latitude,
                mandi.longitude
            );


        setText(
            "gps-accuracy-value",
            `${Math.round(
                currentGPS.accuracy || 0
            )} m`
        );


        setText(
            "gps-telemetry-detail",
            "Browser / vehicle GPS location"
        );


        updateDistanceUI(
            distance
        );


        updateVehicleMarker(
            currentGPS.latitude,
            currentGPS.longitude
        );


        updateControls();
    }


    function handleGPSError(
        error
    ) {

        console.warn(
            "[Stage 5] GPS error:",
            error
        );


        setText(
            "gps-telemetry-status",
            "GPS Unavailable"
        );


        setText(
            "gps-telemetry-detail",
            "Browser could not provide a GPS position"
        );


        updateControls();
    }


    function requestGPS() {

        if (
            !navigator.geolocation
        ) {

            handleGPSError(
                {
                    message:
                        "Geolocation is not supported."
                }
            );

            return;
        }


        navigator.geolocation.getCurrentPosition(
            handleGPS,
            handleGPSError,
            {
                enableHighAccuracy:
                    true,

                timeout:
                    10000,

                maximumAge:
                    0
            }
        );
    }


    // ==========================================
    // REAL GEOFENCE VERIFICATION
    // ==========================================

    async function verifyGeofenceCheckIn() {

        if (
            !isStage5Active()
        ) {

            return;
        }


        if (
            verificationInProgress
        ) {

            return;
        }


        const booking =
            getBooking();


        if (
            !booking?.tokenId
        ) {

            /*
             * Do not alert here.
             *
             * The button is disabled when no booking
             * exists. This eliminates the repeated
             * "complete Stage 3 first" popup.
             */

            updateControls();

            return;
        }


        if (
            currentGPS.latitude ===
                null ||
            currentGPS.longitude ===
                null
        ) {

            requestGPS();

            return;
        }


        verificationInProgress =
            true;


        const button =
            document.getElementById(
                "btn-verify-geofence"
            );


        const originalHTML =
            button?.innerHTML;


        try {

            if (button) {

                button.disabled =
                    true;

                button.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> Verifying GPS & Check-In...';
            }


            const response =
                await fetch(
                    `${API_BASE_URL}/api/checkin/geofence`,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Accept:
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                {
                                    tokenId:
                                        booking.tokenId,

                                    farmerId:
                                        booking.farmerId ||
                                        getStorageValue(
                                            "farmerId"
                                        ),

                                    centerId:
                                        booking.centerId ||
                                        getCenterId(),

                                    latitude:
                                        currentGPS.latitude,

                                    longitude:
                                        currentGPS.longitude,

                                    accuracy:
                                        currentGPS.accuracy,

                                    vehicleNumber:
                                        booking.vehicleNumber ||
                                        getStorageValue(
                                            "vehicleNumber"
                                        )
                                }
                            )
                    }
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                data.success !== true
            ) {

                throw new Error(
                    data.message ||
                    "Vehicle is outside the permitted mandi geofence."
                );
            }


            markGeofenceVerified(
                false
            );


            updateDistanceUI(
                Number(
                    data.distanceKm
                ) || 0
            );


            setText(
                "gps-telemetry-status",
                "Inside Geofence"
            );


            setText(
                "gps-telemetry-detail",
                "GPS location verified by backend"
            );


            alert(
                "GPS geofence verified successfully. Vehicle checked in."
            );


        } catch (error) {

            console.error(
                "[Stage 5] Geofence verification failed:",
                error
            );


            alert(
                error.message ||
                "GPS geofence verification failed."
            );

        } finally {

            verificationInProgress =
                false;


            if (button) {

                button.disabled =
                    false;

                if (
                    originalHTML
                ) {

                    button.innerHTML =
                        originalHTML;
                }
            }


            updateControls();
        }
    }


    // ==========================================
    // MARK VERIFIED
    // ==========================================

    function markGeofenceVerified(
        demoMode
    ) {

        const booking =
            getBooking();


        const tokenId =
            getTokenId();


        const timestamp =
            new Date().toISOString();


        const verified =
            {
                geofenceVerified:
                    true,

                geofenceDemoMode:
                    demoMode,

                geofenceTokenId:
                    tokenId,

                geofenceCenterId:
                    getCenterId(),

                geofenceVerifiedAt:
                    timestamp
            };


        Object.keys(
            verified
        ).forEach(
            function (key) {

                sessionStorage.setItem(
                    key,
                    String(
                        verified[key]
                    )
                );

                localStorage.setItem(
                    key,
                    String(
                        verified[key]
                    )
                );
            }
        );


        if (
            currentGPS.latitude !==
            null
        ) {

            sessionStorage.setItem(
                "geofenceLatitude",
                String(
                    currentGPS.latitude
                )
            );

            sessionStorage.setItem(
                "geofenceLongitude",
                String(
                    currentGPS.longitude
                )
            );

            localStorage.setItem(
                "geofenceLatitude",
                String(
                    currentGPS.latitude
                )
            );

            localStorage.setItem(
                "geofenceLongitude",
                String(
                    currentGPS.longitude
                )
            );
        }


        if (
            booking
        ) {

            const updated =
                {
                    ...booking,

                    status:
                        demoMode
                            ? "Active Gate Queue"
                            : (
                                booking.status ===
                                "Scheduled"
                                    ? "Active Gate Queue"
                                    : booking.status
                            ),

                    bookingStatus:
                        demoMode
                            ? "Active Gate Queue"
                            : "Active Gate Queue",

                    geofenceVerified:
                        true,

                    geofenceDemoMode:
                        demoMode,

                    geofenceVerifiedAt:
                        timestamp
                };


            saveJSON(
                "kisanSetuBooking",
                updated
            );
        }


        sessionStorage.setItem(
            "kisanSetuBookingStatus",
            "Active Gate Queue"
        );

        localStorage.setItem(
            "kisanSetuBookingStatus",
            "Active Gate Queue"
        );


        updateControls();
    }


    // ==========================================
    // PROTOTYPE DEMO
    // ==========================================

    function runPrototypeDemoPass() {

        if (
            !isStage5Active()
        ) {

            return;
        }


        const booking =
            getBooking();


        if (
            !booking?.tokenId
        ) {

            updateControls();

            return;
        }


        const confirmed =
            window.confirm(
                "Prototype Demo Mode\n\n" +
                "This temporarily bypasses the live GPS geofencing check so the judges can see the complete downstream procurement workflow.\n\n" +
                "The real GPS geofence remains implemented and available.\n\n" +
                "Continue?"
            );


        if (!confirmed) {
            return;
        }


        const mandi =
            getMandi();


        currentGPS = {

            latitude:
                mandi.latitude,

            longitude:
                mandi.longitude,

            accuracy:
                5
        };


        updateDistanceUI(
            0
        );


        updateVehicleMarker(
            mandi.latitude,
            mandi.longitude
        );


        setText(
            "gps-accuracy-value",
            "5 m"
        );


        setText(
            "gps-telemetry-status",
            "Demo: Inside Geofence"
        );


        setText(
            "gps-telemetry-detail",
            "Prototype demo location"
        );


        setText(
            "map-live-badge",
            "PROTOTYPE DEMO PASSED"
        );


        markGeofenceVerified(
            true
        );


        const status =
            document.getElementById(
                "prototype-demo-status"
            );


        if (status) {

            status.style.display =
                "block";

            status.textContent =
                "✓ Prototype geofencing test passed";
        }


        alert(
            "Prototype geofencing test passed.\n\nStage 6 is now unlocked for the SIH demonstration."
        );
    }


    // ==========================================
    // INJECT DEMO OPTION
    // ==========================================

    function injectDemoOption() {

        if (
            document.getElementById(
                "prototype-geofence-demo"
            )
        ) {

            return;
        }


        const verifyButton =
            document.getElementById(
                "btn-verify-geofence"
            );


        if (!verifyButton) {
            return;
        }


        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.id =
            "prototype-geofence-demo";


        wrapper.style.cssText =
            [
                "margin-top:14px",
                "padding:16px 18px",
                "border:1px solid #ead7a5",
                "border-radius:12px",
                "background:#fffaf0",
                "display:flex",
                "align-items:center",
                "justify-content:space-between",
                "gap:16px",
                "flex-wrap:wrap"
            ].join(";");


        wrapper.innerHTML =
            `
            <div style="flex:1;min-width:240px;">
                <div style="
                    font-weight:700;
                    font-size:15px;
                    color:#79520b;
                    margin-bottom:5px;
                ">
                    🚀 Prototype Demo Option
                </div>

                <div style="
                    font-size:12px;
                    line-height:1.5;
                    color:#6b6252;
                ">
                    Temporarily bypass the live geofencing check
                    to demonstrate the next procurement stages.
                    <strong>Prototype only.</strong>
                </div>

                <div
                    id="prototype-demo-status"
                    style="
                        display:none;
                        margin-top:8px;
                        font-size:12px;
                        font-weight:700;
                        color:#39733f;
                    "
                ></div>
            </div>

            <button
                type="button"
                id="btn-prototype-geofence"
                style="
                    border:0;
                    border-radius:9px;
                    padding:12px 18px;
                    background:#9a5a00;
                    color:#ffffff;
                    font-weight:700;
                    font-size:13px;
                    cursor:pointer;
                    white-space:nowrap;
                "
            >
                Pass Geofencing Test (Demo)
            </button>
            `;


        verifyButton.parentNode.insertBefore(
            wrapper,
            verifyButton.nextSibling
        );


        const demoButton =
            document.getElementById(
                "btn-prototype-geofence"
            );


        if (demoButton) {

            demoButton.onclick =
                runPrototypeDemoPass;
        }
    }


    // ==========================================
    // STAGE 5 INITIALIZATION
    // ==========================================

    function initializeStage5() {

        injectDemoOption();

        updateControls();

        /*
         * Map and GPS are initialized without throwing
         * alerts on pages where Stage 5 isn't active.
         */

        initializeMap();

        requestGPS();


        const stage =
            document.getElementById(
                "stage-view-5"
            );


        if (
            stage
        ) {

            const observer =
                new MutationObserver(
                    function () {

                        if (
                            isStage5Active()
                        ) {

                            setTimeout(
                                function () {

                                    if (
                                        map
                                    ) {

                                        map.invalidateSize(
                                            true
                                        );
                                    }

                                },
                                100
                            );

                            setTimeout(
                                function () {

                                    if (
                                        map
                                    ) {

                                        map.invalidateSize(
                                            true
                                        );
                                    }

                                },
                                500
                            );
                        }

                    }
                );


            observer.observe(
                stage,
                {
                    attributes:
                        true,

                    attributeFilter:
                        [
                            "class"
                        ]
                }
            );
        }
    }


    // ==========================================
    // EXPOSE
    // ==========================================

    window.verifyGeofenceCheckIn =
        verifyGeofenceCheckIn;

    window.runPrototypeDemoPass =
        runPrototypeDemoPass;


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeStage5
        );

    } else {

        initializeStage5();
    }

})();