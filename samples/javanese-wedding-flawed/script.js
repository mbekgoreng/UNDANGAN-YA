// Simple interaction
document.addEventListener('DOMContentLoaded', function() {
  var btn = document.getElementById('btn-open-invitation');
  if (btn) {
    btn.addEventListener('click', function() {
      var coupleSec = document.getElementById('couple');
      if (coupleSec) {
        coupleSec.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
});