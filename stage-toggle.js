document.addEventListener('DOMContentLoaded', () => {
  const stepItems = document.querySelectorAll('.step-item');
  stepItems.forEach(item => {
    item.addEventListener('click', () => {
      stepItems.forEach(s => s.classList.remove('active'));
      item.classList.add('active');
    });
  });
});