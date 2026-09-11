document.addEventListener('DOMContentLoaded', () => {
  // Notification Click Simulation
  const bellBtn = document.querySelector('.icon-btn');
  if (bellBtn) {
    bellBtn.addEventListener('click', () => {
      alert('Notifications:\n1. Slot booked for tomorrow at 10:00 AM\n2. Land verification complete.\n3. Payment processed.');
    });
  }

  // Action Button Click Simulation
  const primaryBtn = document.querySelector('.btn-primary-action');
  if (primaryBtn) {
    primaryBtn.addEventListener('click', () => {
      alert('Redirecting to Registration & Land Verification Portal...');
    });
  }
});