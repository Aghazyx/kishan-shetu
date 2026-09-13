// ==========================================
// KISAN SETU MAIN DASHBOARD SCRIPT
// Single-page 7-stage navigation controller
// ==========================================

document.addEventListener('DOMContentLoaded', () => {

  // ========================================
  // CONSTANTS
  // ========================================

  const STAGE_STORAGE_KEY =
    'kisanSetuCurrentStage';


  // ========================================
  // STAGE NAVIGATION
  // ========================================

  window.switchStage = function (stageNumber) {

    const stageViews =
      document.querySelectorAll('.stage-view');

    const stepItems =
      document.querySelectorAll('.step-item');


    // ----------------------------------------
    // Validate stage number
    // ----------------------------------------

    if (
      !Number.isInteger(Number(stageNumber)) ||
      Number(stageNumber) < 1 ||
      Number(stageNumber) > 7
    ) {

      console.error(
        'Invalid stage number:',
        stageNumber
      );

      return;
    }


    stageNumber =
      Number(stageNumber);


    // ----------------------------------------
    // Hide all stage views
    // ----------------------------------------

    stageViews.forEach((view) => {

      view.classList.remove(
        'active-view'
      );

    });


    // ----------------------------------------
    // Show requested stage
    // ----------------------------------------

    const targetView =
      document.getElementById(
        `stage-view-${stageNumber}`
      );


    if (!targetView) {

      console.error(
        `Stage view not found: stage-view-${stageNumber}`
      );

      return;
    }


    targetView.classList.add(
      'active-view'
    );


    // ----------------------------------------
    // Update stepper
    // ----------------------------------------

    stepItems.forEach((item) => {

      const itemStage =
        Number(item.dataset.stage);


      item.classList.remove(
        'active'
      );


      if (
        itemStage === stageNumber
      ) {

        item.classList.add(
          'active'
        );

      }

    });


    // ----------------------------------------
    // Mark previous stages completed
    // ----------------------------------------

    stepItems.forEach((item) => {

      const itemStage =
        Number(item.dataset.stage);


      item.classList.remove(
        'completed'
      );


      if (
        itemStage < stageNumber
      ) {

        item.classList.add(
          'completed'
        );

      }

    });


    // ----------------------------------------
    // Persist current stage
    // ----------------------------------------

    sessionStorage.setItem(
      STAGE_STORAGE_KEY,
      String(stageNumber)
    );


    // ----------------------------------------
    // Scroll to main content
    // ----------------------------------------

    const mainWrapper =
      document.querySelector(
        '.main-wrapper'
      );


    if (mainWrapper) {

      mainWrapper.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

    }


    console.log(
      `Kisan Setu: switched to Stage ${stageNumber}`
    );

  };


  // ========================================
  // STAGE COMPLETION + NEXT STAGE
  // ========================================

  window.completeStageAndProceed =
    function (
      currentStage,
      nextStage
    ) {

      const currentView =
        document.getElementById(
          `stage-view-${currentStage}`
        );


      const nextView =
        document.getElementById(
          `stage-view-${nextStage}`
        );


      if (
        !currentView ||
        !nextView
      ) {

        console.error(
          'Stage transition failed:',
          currentStage,
          '→',
          nextStage
        );

        return;
      }


      switchStage(
        Number(nextStage)
      );

    };


  // ========================================
  // STEPPER CLICK NAVIGATION
  // ========================================

  const stepItems =
    document.querySelectorAll(
      '.step-item'
    );


  stepItems.forEach((step) => {

    step.addEventListener(
      'click',
      () => {

        const stageNumber =
          Number(
            step.dataset.stage
          );


        if (!stageNumber) {
          return;
        }


        switchStage(
          stageNumber
        );

      }
    );

  });


  // ========================================
  // NOTIFICATION BUTTON
  // ========================================

  const bellBtn =
    document.querySelector(
      '.icon-badge-btn'
    );


  if (bellBtn) {

    bellBtn.addEventListener(
      'click',
      () => {

        const verifiedFarmer =
          sessionStorage.getItem(
            'verifiedFarmer'
          );


        if (verifiedFarmer) {

          alert(
            'Notifications:\n\n' +
            '1. Land verification complete.\n' +
            '2. Farmer profile verified.\n' +
            '3. You can proceed to slot booking.'
          );

        } else {

          alert(
            'Notifications:\n\n' +
            '1. Complete farmer verification to continue.\n' +
            '2. No active procurement slot found.'
          );

        }

      }
    );

  }


  // ========================================
  // DETERMINE INITIAL STAGE
  // ========================================

  let initialStage = 1;


  // ----------------------------------------
  // Existing active booking
  // ----------------------------------------

  const activeTokenId =
    sessionStorage.getItem(
      'activeTokenId'
    );


  const savedBooking =
    sessionStorage.getItem(
      'kisanSetuBooking'
    );


  if (
    activeTokenId ||
    savedBooking
  ) {

    /*
     * A booking already exists.
     * Restore the user to Stage 4,
     * where the digital token is displayed.
     */

    initialStage = 4;

  } else {

    // --------------------------------------
    // Restore previously active stage
    // --------------------------------------

    const savedStage =
      Number(
        sessionStorage.getItem(
          STAGE_STORAGE_KEY
        )
      );


    if (
      Number.isInteger(savedStage) &&
      savedStage >= 1 &&
      savedStage <= 7
    ) {

      initialStage =
        savedStage;

    }

  }


  // ========================================
  // INITIALIZE STAGE
  // ========================================

  switchStage(
    initialStage
  );


  console.log(
    `[Kisan Setu] Initial stage: ${initialStage}`
  );

});