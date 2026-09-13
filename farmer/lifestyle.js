// ==========================================
// LIFESTYLE / TAB SWITCHING
// ==========================================

document.addEventListener('DOMContentLoaded', () => {

  const tabs =
    document.querySelectorAll('.tab-item');


  // ========================================
  // TAB CLICK HANDLING
  // ========================================

  tabs.forEach(tab => {

    tab.addEventListener('click', function () {

      // Remove active state from all tabs
      tabs.forEach(item => {
        item.classList.remove('active');
      });


      // Activate selected tab
      this.classList.add('active');


      // Get selected tab identifier
      const targetTab =
        this.getAttribute('data-tab');


      // Useful during development
      if (targetTab) {
        console.log(
          `Switched to tab: ${targetTab}`
        );
      }

    });

  });

});