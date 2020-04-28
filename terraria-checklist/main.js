const checkboxButtons = document.querySelectorAll('.checkbox');
const resetButton = document.getElementsByName('reset')[0];

// Checkbox click handler
for (const checkboxButton of checkboxButtons) {
  checkboxButton.addEventListener('click', (event) => {

    const target = event.target;
    const parent = event.target.parentElement.parentNode;

    const name = target.attributes.name.nodeValue;

    if (target.classList.contains('checked')) {
      target.classList.remove('checked');
      parent.classList.remove('completed');
      localStorage.setItem(name, false);
    }
    else {
      target.classList.add('checked');
      parent.classList.add('completed');
      localStorage.setItem(name, true);
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.length > 0) {

    const keys = Object.keys(localStorage);

    for (const name of keys) {
      const value = localStorage.getItem(name) == 'true'; // conversion to bool

      if (document.getElementsByName(name).length) {

        const target = document.getElementsByName(name)[0];
        const parent = target.parentElement.parentNode;

        if (value) {
          target.classList.add('checked');
          parent.classList.add('completed');
        }

      }

    }

  }
});

// Reset button handling
resetButton.addEventListener('click', () => {
  if (confirm('Reset the checklist progression?')) {
    localStorage.clear();
    location.reload();
  }
})


console.debug("main.js loaded.");