
// ==========================================
// KISAN SETU - ADMINISTRATION PORTAL
// A1 • ADMIN LOGIN
// ==========================================

const ADMIN_API_BASE_URL =
    'http://localhost:5050';


// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener(
    'DOMContentLoaded',
    function () {

        console.log(
            '[Admin] Login page loaded'
        );

        initializePasswordToggle();
        initializeLoginForm();

    }
);


// ==========================================
// PASSWORD VISIBILITY TOGGLE
// ==========================================

function initializePasswordToggle() {

    const passwordInput =
        document.getElementById(
            'admin-password'
        );

    const toggleButton =
        document.getElementById(
            'toggle-admin-password'
        );


    if (
        !passwordInput ||
        !toggleButton
    ) {

        return;

    }


    toggleButton.addEventListener(
        'click',
        function () {

            const isPassword =
                passwordInput.type === 'password';


            passwordInput.type =
                isPassword
                    ? 'text'
                    : 'password';


            const icon =
                toggleButton.querySelector(
                    'i'
                );


            if (icon) {

                icon.className =
                    isPassword
                        ? 'fa-solid fa-eye-slash'
                        : 'fa-solid fa-eye';

            }


            toggleButton.setAttribute(
                'aria-label',
                isPassword
                    ? 'Hide password'
                    : 'Show password'
            );

        }
    );

}


// ==========================================
// LOGIN FORM
// ==========================================

function initializeLoginForm() {

    const form =
        document.getElementById(
            'admin-login-form'
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        'submit',
        handleAdminLogin
    );

}


// ==========================================
// HANDLE ADMIN LOGIN
// ==========================================

async function handleAdminLogin(
    event
) {

    event.preventDefault();


    const usernameInput =
        document.getElementById(
            'admin-username'
        );


    const passwordInput =
        document.getElementById(
            'admin-password'
        );


    const loginButton =
        document.getElementById(
            'admin-login-button'
        );


    const buttonText =
        document.getElementById(
            'admin-login-button-text'
        );


    if (
        !usernameInput ||
        !passwordInput
    ) {

        return;

    }


    const username =
        usernameInput.value.trim();


    const password =
        passwordInput.value;


    // ----------------------------------------
    // Basic client-side validation
    // ----------------------------------------

    if (!username) {

        showLoginMessage(
            'Please enter your administrator ID.',
            'error'
        );

        usernameInput.focus();

        return;

    }


    if (!password) {

        showLoginMessage(
            'Please enter your password.',
            'error'
        );

        passwordInput.focus();

        return;

    }


    // ----------------------------------------
    // Loading state
    // ----------------------------------------

    setLoginLoadingState(
        true,
        loginButton,
        buttonText
    );


    try {

        console.log(
            '[Admin] Authenticating administrator...'
        );


        // ------------------------------------
        // Backend authentication
        // ------------------------------------

        const response =
            await fetch(
                `${ADMIN_API_BASE_URL}/api/admin/login`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({
                        username,
                        password
                    })
                }
            );


        let data = null;


        try {

            data =
                await response.json();

        } catch {

            data = null;

        }


        if (!response.ok) {

            throw new Error(
                data?.message ||
                `Authentication failed. HTTP ${response.status}`
            );

        }


        if (
            !data ||
            data.success !== true
        ) {

            throw new Error(
                data?.message ||
                'Administrator authentication failed.'
            );

        }


        // ------------------------------------
        // Store admin session
        // ------------------------------------

        sessionStorage.setItem(
            'kisanSetuAdminAuthenticated',
            'true'
        );


        sessionStorage.setItem(
            'kisanSetuAdminUser',
            JSON.stringify(
                data.admin || {
                    username
                }
            )
        );


        if (data.sessionId) {

            sessionStorage.setItem(
                'kisanSetuAdminSession',
                data.sessionId
            );

        }


        // ------------------------------------
        // Success
        // ------------------------------------

        showLoginMessage(
            'Authentication successful. Opening administration dashboard...',
            'success'
        );


        console.log(
            '[Admin] Authentication successful.'
        );


        // ------------------------------------
        // Short transition before dashboard
        // ------------------------------------

        setTimeout(
            function () {

                window.location.href =
                    'dashboard.html';

            },
            650
        );


    } catch (error) {

        console.error(
            '[Admin] Login failed:',
            error
        );


        let message =
            error.message ||
            'Unable to authenticate administrator.';


        // ------------------------------------
        // Friendlier connection error
        // ------------------------------------

        if (
            error instanceof TypeError ||
            message.toLowerCase().includes(
                'failed to fetch'
            )
        ) {

            message =
                'Unable to connect to the Kisan Setu backend. Make sure the Node.js server is running on port 5050.';

        }


        showLoginMessage(
            message,
            'error'
        );


        setLoginLoadingState(
            false,
            loginButton,
            buttonText
        );

    }

}


// ==========================================
// LOGIN LOADING STATE
// ==========================================

function setLoginLoadingState(
    loading,
    button,
    buttonText
) {

    if (!button) {
        return;
    }


    button.disabled =
        loading;


    if (!buttonText) {
        return;
    }


    if (loading) {

        buttonText.innerText =
            'Authenticating...';


        const icon =
            button.querySelector(
                'i'
            );


        if (icon) {

            icon.className =
                'fa-solid fa-spinner fa-spin';

        }

    } else {

        buttonText.innerText =
            'Login to Dashboard';


        const icon =
            button.querySelector(
                'i'
            );


        if (icon) {

            icon.className =
                'fa-solid fa-arrow-right';

        }

    }

}


// ==========================================
// LOGIN MESSAGE
// ==========================================

function showLoginMessage(
    message,
    type
) {

    const messageElement =
        document.getElementById(
            'admin-login-message'
        );


    if (!messageElement) {
        return;
    }


    messageElement.innerText =
        message;


    messageElement.className =
        `admin-login-message show ${type}`;

}


// ==========================================
// ADMIN SESSION HELPERS
// ==========================================

function isAdminAuthenticated() {

    return (
        sessionStorage.getItem(
            'kisanSetuAdminAuthenticated'
        ) === 'true'
    );

}


function getAdminUser() {

    const storedUser =
        sessionStorage.getItem(
            'kisanSetuAdminUser'
        );


    if (!storedUser) {
        return null;
    }


    try {

        return JSON.parse(
            storedUser
        );

    } catch {

        return null;

    }

}


// ==========================================
// EXPOSE HELPERS
// ==========================================

window.isAdminAuthenticated =
    isAdminAuthenticated;


window.getAdminUser =
    getAdminUser;
