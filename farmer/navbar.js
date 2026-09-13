// ==========================================
// NAVBAR SCRIPT
// ==========================================

document.addEventListener('DOMContentLoaded', () => {

  // ========================================
  // NAVIGATION ITEM ACTIVE STATE
  // ========================================

  const navItems =
    document.querySelectorAll('.nav-item');

  navItems.forEach(item => {

    item.addEventListener('click', () => {

      navItems.forEach(navItem => {
        navItem.classList.remove('active');
      });

      item.classList.add('active');

    });

  });


  // ========================================
  // NOTIFICATION BUTTON
  // ========================================

  const notifBtn =
    document.getElementById('notification-btn');

  if (notifBtn) {

    notifBtn.addEventListener('click', () => {

      // Check whether farmer verification
      // has been completed in this browser session.
      const verifiedFarmer =
        sessionStorage.getItem('verifiedFarmer');


      if (verifiedFarmer) {

        let farmer = {};

        try {
          farmer =
            JSON.parse(verifiedFarmer);
        } catch (error) {
          console.error(
            'Could not read verified farmer data:',
            error
          );
        }


        const farmerName =
          farmer.name || 'Farmer';


        alert(
          `Alerts:\n` +
          `- Land verification completed\n` +
          `- ${farmerName} profile verified\n` +
          `- Ready for procurement slot booking`
        );


      } else {

        alert(
          'Alerts:\n' +
          '- Farmer verification pending\n' +
          '- Complete land & bank verification to continue'
        );

      }

    });

  }

});