const checkboxButtons = document.querySelectorAll('input[type=checkbox]');
const resetButton = document.getElementsByName('reset')[0];
const progressCompleted = document.querySelector('.progress-completed');
const progressUncompleted = document.querySelector('.progress-uncompleted');

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

    refreshProgessbar();
  });
}


window.addEventListener("DOMContentLoaded", () => {

  // Loading the progress
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

  // Progress bar stuff
  refreshProgessbar();
  progressCompleted.classList.add('animated');

});

// Reset button handling
resetButton.addEventListener('click', () => {
  if (confirm('This will reset the checklist progression. Are you sure?')) {
    localStorage.clear();
    location.reload();
  }
})

// On window resizing
window.addEventListener("resize", refreshProgessbar);

// Refreshes the progress bar at the bottom of the window
function refreshProgessbar() {
  const checkboxesTotal = checkboxButtons.length;
  const checkedCheckboxes = document.querySelectorAll('input[type=checkbox]:checked').length;
  const percent = Math.round(checkedCheckboxes * 100 / checkboxesTotal);
  const progessLabel = `${checkedCheckboxes}/${checkboxesTotal} (${percent}%)`;

  progressCompleted.style.width = `${percent}%`;

  if (progressCompleted.offsetWidth < 110) {
    progressUncompleted.innerHTML = progessLabel;
    progressCompleted.innerHTML = '';
  } else {
    progressUncompleted.innerHTML = '';
    progressCompleted.innerHTML = progessLabel;
  }
}

console.debug("main.js loaded.");