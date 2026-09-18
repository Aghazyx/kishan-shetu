
document.addEventListener('DOMContentLoaded', () => {

    // DARK MODE

    const body =
        document.body;

    const themeButton =
        document.getElementById('theme-toggle');

    const savedTheme =
        localStorage.getItem(
            'kisanSetuAdminTheme'
        );

    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
    }

    if (themeButton) {

        themeButton.addEventListener(
            'click',
            () => {

                body.classList.toggle(
                    'dark-mode'
                );

                localStorage.setItem(
                    'kisanSetuAdminTheme',
                    body.classList.contains(
                        'dark-mode'
                    )
                        ? 'dark'
                        : 'light'
                );
            }
        );
    }


    // ADMIN

    const username =
        document.getElementById(
            'admin-username'
        );

    const avatar =
        document.getElementById(
            'admin-avatar'
        );

    let adminName = 'admin';

    try {

        const raw =
            sessionStorage.getItem(
                'kisanSetuAdminUser'
            );

        if (raw) {

            const parsed =
                JSON.parse(raw);

            adminName =
                parsed?.name ||
                parsed?.username ||
                parsed?.email ||
                adminName;
        }

    } catch {

        adminName =
            sessionStorage.getItem(
                'kisanSetuAdminUser'
            ) || adminName;
    }

    if (username) {
        username.textContent =
            adminName;
    }

    if (avatar) {

    const cleanName =
        String(adminName)
            .trim();

    if (
        !cleanName ||
        cleanName.toLowerCase() === 'admin'
    ) {

        avatar.textContent = 'AD';

    } else {

        const initials =
            cleanName
                .split(/\s+/)
                .slice(0, 2)
                .map(
                    part =>
                        part[0] || ''
                )
                .join('')
                .toUpperCase();

        avatar.textContent =
            initials || 'AD';
    }
}


    // CALENDAR

    const input =
        document.getElementById(
            'mandi-date-input'
        );

    const trigger =
        document.getElementById(
            'mandi-calendar-trigger'
        );

    const dropdown =
        document.getElementById(
            'mandi-calendar-dropdown'
        );

    const title =
        document.getElementById(
            'mandi-calendar-title'
        );

    const days =
        document.getElementById(
            'mandi-calendar-days'
        );

    const prev =
        document.getElementById(
            'mandi-calendar-prev'
        );

    const next =
        document.getElementById(
            'mandi-calendar-next'
        );


    if (
        !input ||
        !trigger ||
        !dropdown ||
        !title ||
        !days
    ) {
        return;
    }


    let selected =
        new Date();

    let view =
        new Date(
            selected.getFullYear(),
            selected.getMonth(),
            1
        );


    const format =
        date =>
            new Intl.DateTimeFormat(
                'en-GB',
                {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }
            ).format(date);


    function renderCalendar() {

        input.value =
            format(selected);

        title.textContent =
            view.toLocaleDateString(
                'en-IN',
                {
                    month: 'long',
                    year: 'numeric'
                }
            );

        days.innerHTML = '';


        const year =
            view.getFullYear();

        const month =
            view.getMonth();

        const firstDay =
            new Date(
                year,
                month,
                1
            ).getDay();

        const count =
            new Date(
                year,
                month + 1,
                0
            ).getDate();

        const previousCount =
            new Date(
                year,
                month,
                0
            ).getDate();


        for (
            let cell = 0;
            cell < 42;
            cell++
        ) {

            const button =
                document.createElement(
                    'button'
                );

            button.type =
                'button';

            button.className =
                'mandi-calendar-day';


            let date;


            if (cell < firstDay) {

                date =
                    new Date(
                        year,
                        month - 1,
                        previousCount -
                            firstDay +
                            cell +
                            1
                    );

                button.classList.add(
                    'muted'
                );

            } else if (
                cell >=
                firstDay + count
            ) {

                date =
                    new Date(
                        year,
                        month + 1,
                        cell -
                            firstDay -
                            count +
                            1
                    );

                button.classList.add(
                    'muted'
                );

            } else {

                date =
                    new Date(
                        year,
                        month,
                        cell -
                            firstDay +
                            1
                    );
            }


            button.textContent =
                date.getDate();


            if (
                date.toDateString() ===
                selected.toDateString()
            ) {

                button.classList.add(
                    'selected'
                );
            }


            button.addEventListener(
                'click',
                () => {

                    selected =
                        date;

                    view =
                        new Date(
                            date.getFullYear(),
                            date.getMonth(),
                            1
                        );

                    renderCalendar();

                    dropdown.hidden =
                        true;

                    input.dispatchEvent(
                        new Event(
                            'change',
                            {
                                bubbles: true
                            }
                        )
                    );
                }
            );


            days.appendChild(
                button
            );
        }
    }


    trigger.addEventListener(
        'click',
        event => {

            event.stopPropagation();

            dropdown.hidden =
                !dropdown.hidden;
        }
    );


    if (prev) {

        prev.addEventListener(
            'click',
            () => {

                view =
                    new Date(
                        view.getFullYear(),
                        view.getMonth() - 1,
                        1
                    );

                renderCalendar();
            }
        );
    }


    if (next) {

        next.addEventListener(
            'click',
            () => {

                view =
                    new Date(
                        view.getFullYear(),
                        view.getMonth() + 1,
                        1
                    );

                renderCalendar();
            }
        );
    }


    document.addEventListener(
        'click',
        event => {

            if (
                !dropdown.contains(
                    event.target
                ) &&
                event.target !==
                    trigger
            ) {

                dropdown.hidden =
                    true;
            }
        }
    );


    renderCalendar();
});
