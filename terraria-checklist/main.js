const checkboxButtons = document.querySelectorAll('input[type=checkbox]');
const resetButton = document.getElementsByName('reset')[0];

// Checkbox click handler
for (const checkboxButton of checkboxButtons) {
  checkboxButton.addEventListener('click', (event) => {

    const target = event.target;
    const parent = event.target.parentElement.parentNode;
    const name = target.attributes.name.nodeValue;

    if (target.checked) {
      parent.classList.add('completed');
      localStorage.setItem(name, true);
    }
    else {
      parent.classList.remove('completed');
      localStorage.setItem(name, false);
    }
  });
}

// Loading the progress
window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.length > 0) {

    const keys = Object.keys(localStorage);

    for (const name of keys) {
      const value = localStorage.getItem(name) == 'true'; // conversion to bool

      if (document.getElementsByName(name).length) {

        const target = document.getElementsByName(name)[0];
        const parent = target.parentElement.parentNode;

        if (value) {
          target.setAttribute('checked', 'checked');
          parent.classList.add('completed');
        }

      }

    }

  }
});

// Reset button handling
resetButton.addEventListener('click', () => {
  if (confirm('This will reset the checklist progression. Are you sure?')) {
    localStorage.clear();
    location.reload();
  }
})


console.debug("main.js loaded.");