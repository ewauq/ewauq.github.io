$(document).ready(() => {

  $.getJSON(`https://ewauq.github.io/distributors/list.json?${Date.now()}`, (json) => {
    console.log("[DEBUG]", "Success");
  })

  .done((json) => {

    // Sorting the distributors list by sorting_name
    json.sort(function(a, b) {
      return compareStrings(a.sorting_name, b.sorting_name);
    })

    json.forEach(distributor => {
      // Choosing the right distributor section
      var fistLetter = distributor.sorting_name.substring(0,1);
      var element = (fistLetter in [0,1,2,3,4,5,6,7,8,9])? "#" : fistLetter.toUpperCase() ;

      // Handling the distributor channels
      const regex = /https:\/\/[w]{0,3}\.?(.+)\.com/gm;
      let channels = [];

      if (distributor.channels && distributor.channels.length > 0) {

        distributor.channels.forEach(channel => {
          let name, m;
          while ((m = regex.exec(channel)) !== null) {
              // This is necessary to avoid infinite loops with zero-width matches
              if (m.index === regex.lastIndex) {
                  regex.lastIndex++;
              }
              name = m[1].charAt(0).toUpperCase() + m[1].substr(1);
          }
          channels.push(`<a href="${channel}" target="_blank" class="channel">${name}</a>`);
        })

      }
      else {
        channels = [];
      }

      // Handling the distributor website
      if(distributor.website) {
        $(`ul[name="${element}"]`).append(`
        <li>
          <a href="${distributor.website}" target="_blank">${distributor.name}</a>
          ${channels.join('')}
        </li>`);
        $(`ul[name="${element}"] li.empty-section`).remove();
      }
      else {
        $(`ul[name="${element}"]`).append(`
        <li>
          <span>${distributor.name}</span>
          ${channels.join('')}
        </li>`);
        $(`ul[name="${element}"] li.empty-section`).remove();
      }

    });

    // Displaying the number of available distributors
    $('main h1').html(`${json.length} distributeurs référencés`);

  })

  .fail(() => {
    console.log("[DEBUG]", "Error while loading json");
  })

  .always(() => {
    console.log("[DEBUG]", "Complete");
  });

  // Sorting elements
  $('.sorter span').click((event) => {

    let target = event.target;
    let isActived = target.classList.contains('active');
    let letter = event.target.attributes['name'].nodeValue;

    $('.sorter span').removeClass('active');

    if(isActived) {
      $(target).removeClass('active');
      $('ul').parent().show();
      $('main h1').show();
    }
    else {
      $(target).addClass('active');
      $('ul').parent().hide();
      $('main h1').hide();
      $(`ul[name="${letter}"]`).parent().show();
    }

  });

  console.log("[DEBUG]", "Document ready.");
});

function compareStrings(a, b) {
  // https://stackoverflow.com/questions/19259233/sorting-json-by-specific-element-alphabetically
  // Assuming you want case-insensitive comparison
  a = a.toLowerCase();
  b = b.toLowerCase();
  return (a < b) ? -1 : (a > b) ? 1 : 0;
}