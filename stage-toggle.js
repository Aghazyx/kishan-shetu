// ==========================================
// STAGE / PROGRESS TOGGLE
// ==========================================

document.addEventListener('DOMContentLoaded', () => {

  const stepItems =
    document.querySelectorAll('.step-item');


  stepItems.forEach(item => {

    item.addEventListener('click', (event) => {

      // Remove active state from all stages
      stepItems.forEach(step => {
        step.classList.remove('active');
      });


      // Activate the selected stage
      event.currentTarget.classList.add('active');

    });

  });

});