$(document).ready(function() {

  // Zone présentant les nouveautés
  $('.news').draggable();

  let comment_id;

  // Gestion de l'affichage des commentaires.
  $('[name=hide-answers]').click(function() {
    const status = ($(this).attr('hidden-answers') == 'false');
    const nb = $(this).parent().parent().nextUntil('.comment-item:not(.answer)').length;

    if(status) {
      $(this).html('Voir les réponses (' + nb + ')');
      $(this).attr('hidden-answers', 'true');
      $(this).parent().parent().nextUntil('.comment-item:not(.answer)').slideUp();
    } else {
      $(this).html('Masquer les réponses');
      $(this).attr('hidden-answers', 'false');
      $(this).parent().parent().nextUntil('.comment-item:not(.answer)').slideDown();
    }

  });

  // Gestion des likes.
  $('[name=like]').click(function() {
    const status = ($(this).attr('liked') == 'false');
    const likes = parseInt($(this).parent().find('.likes').html());

    if(status) {
      $(this).parent().find('.likes').addClass('liked');
      $(this).html("Je n'aime plus");
      $(this).attr('liked', 'true');
      $(this).parent().find('.likes').html(likes + 1);

      if($(this).parent().find('.likes').length == 0) {
        $(this).after(' · <span class="likes liked">1</span>');
      }
    } else {
      $(this).parent().find('.likes').removeClass('liked');
      $(this).html("J'aime");
      $(this).attr('liked', 'false');
      $(this).parent().find('.likes').html(likes - 1);
    }

  });

  // Ajouter un commentaire.
  $('[name=add-comment]').click(function() {

    comment_id = $(this).parent().parent().attr('comment-id');
    //$('.comment-form').clone().appendTo($(this).parent().parent());

    $('.emoji-wysiwyg-editor').attr("tabindex",-1).focus();
    $('.comment-tools').slideDown(200);
  });


  $(document).on('click', function(event) {
    const class_name = event.target.className;

    // Gestion des options des commentaires
    if(class_name === "comment-options") {
      $(event.target).parent().find('.options-dropdown').css('display', 'block');
      $(event.target).css('display', 'block');
      $(event.target).css('background-color', '#FFF');

      $('.delete-comment-user').click(function() {
        $(this).parent().parent().parent().remove();
      });

      $('.edit-comment').click(function() {
        const message = $(this).parent().parent().parent().find('.comment-body').text();
        $('.emoji-wysiwyg-editor').text(message);
        $('.emoji-wysiwyg-editor').attr('edit-mode', true);
        $('.emoji-wysiwyg-editor').attr("tabindex",-1).focus();
      });
    }

    // Masquage du dropdown
    if(class_name != "comment-options" && class_name != "options-dropdown") {
      $('.options-dropdown').hide();
      $('.comment-options').removeAttr('style');
    }

    // Masquage du formulaire d'ajout de commentaire lors de la perte de focus
    if(class_name !== "comment-zone"
      && class_name !== "emoji-dropdown-button"
      && class_name !== "send-comment"
      && !$('.emoji-wysiwyg-editor').is(":focus")) {
      $('.comment-tools').slideUp(200);
    }

  });


  // Gestion de la zone de texte
  $('textarea').emojiarea({button: '.emoji-dropdown-button'});
  $.emojiarea.path = 'img/emojis/';
  $.emojiarea.icons = {
      ':smile:'     : 'smile.png',
      ':wink:'      : 'wink.png',
      ':rofl:'      : 'rofl.png',
      ':love:'      : 'love.png',
      ':cry:'       : 'cry.png',
      ':scream:'    : 'scream.png',
      ':angry:'     : 'angry.png',
      ':poop:'      : 'poop.png',
      ':thumbsup:'  : 'thumbsup.png',
      ':thumbsdown:': 'thumbsdown.png',
      ':movies:'    : 'movies.png',
      ':videogames:': 'videogames.png',
      ':tv:'        : 'tv.png',
      ':music:'     : 'music.png',
      ':books:'     : 'books.png',
  };

  $('.emoji-wysiwyg-editor').focusin(function() {
    $('.comment-tools').slideDown(200);
  });

  // Envoi des commentaires
  $('.send-comment').click(function() {

    const textarea_value = $('textarea').val();
    const edit_mode = $('.emoji-wysiwyg-editor').attr('edit-mode');

    // Mode édition uniquemement.
    if(edit_mode) {
      $('[comment-id="4"]').find('.comment-body').html(textarea_value);
      $('.emoji-wysiwyg-editor').attr('edit-mode', false);
      $('.emoji-wysiwyg-editor').html('');
      $('.comment-tools').slideUp(200);
      emojize();
      return;
    }


    // Par défaut on ajoute le commentaire à la suite des autres.
    // Si c'est une réponse, on ajoute alors le commentaire au bon endroit.
    let selector;
    let style;

    if(!comment_id) {
      selector = ".comment-item:last";
      style = "";
    } else {
      selector = ".comment-item[comment-id=" + comment_id + "]";
      style = "answer"

      // Si le commentaire a déjà des réponses
      if($(selector).attr('answers') > 0) {
        const answers = $(selector).attr('answers');
        selector = $(selector).nextAll('.comment-item').not('.answer').prev();
      }

      console.log(comment_id);

    }

    if(textarea_value) {
      $(selector).after(' \
        <div class="comment-item ' + style + '"> \
          <picture> \
            <img src="https://media.senscritique.com/media/000016406314/120x120/Kazaam.png"> \
          </picture> \
          \
          <div class="comment-username"> \
            <span class="comment-options"></span>\
            <div class="options-dropdown"> \
              <a href="#">Signaler le commentaire</a> \
              <a href="#" class="block-user">Bloquer l\'utilisateur</a> \
              <a href="#" class="delete-comment-user">Supprimer le commentaire</a> \
            </div> \
            Kazaam \
          </div> \
          \
          <div class="comment-body"> \
            ' + $('textarea').val() + ' \
          </div> \
          \
          <div class="comment-actions"> \
            <span class="date">à l\'instant</span> · <a href="#" name="add-comment">Répondre</a> \
          </div> \
        \
        </div> \
      ');
      $('.emoji-wysiwyg-editor').html('');
      $('.comment-tools').slideUp(200);
      emojize();
    }

  });

  function emojize() {
    $('.comment-body').each(function(index) {
      var that = this;
      $.each($.emojiarea.icons, function(index, value) {
        $(that).html(
          $(that).html().replace(index, '<img src="img/emojis/' + value + '" class="emoji">')
        );
      });
    });
  }

  emojize();

  // Mise en avant des nouveautés
  $('[highlight="answers"]').click(function() {
    const status = $(this).attr('active');

    if(status === "true") {
      $('.answer').removeClass('highlight');
      $(this).attr('active', false);
      $(this).css('font-weight', 'normal');
    } else {
      $('.answer').addClass('highlight');
      $(this).attr('active', true);
      $(this).css('font-weight', 'bold');
    }

  });

  $('[highlight="emojis"]').click(function() {
    const status = $(this).attr('active');

    if(status === "true") {
      $('.emoji-dropdown-button').removeClass('highlight');
      $(this).attr('active', false);
      $(this).css('font-weight', 'normal');
    } else {
      $('.emoji-dropdown-button').addClass('highlight');
      $(this).attr('active', true);
      $(this).css('font-weight', 'bold');
      $('.emoji-wysiwyg-editor').attr("tabindex",-1).focus();
      $('.comment-tools').slideDown(200);
    }

  });

  $('[highlight="likes"]').click(function() {
    const status = $(this).attr('active');

    if(status === "true") {
      $('.likes').removeClass('highlight');
      $(this).attr('active', false);
      $(this).css('font-weight', 'normal');
    } else {
      $('.likes').addClass('highlight');
      $(this).attr('active', true);
      $(this).css('font-weight', 'bold');
    }

  });

  $('[highlight="actions"]').click(function() {
    const status = $(this).attr('active');

    if(status === "true") {
      $('.feed-actions').removeClass('highlight');
      $('.comment-actions').removeClass('highlight');

      $(this).attr('active', false);
      $(this).css('font-weight', 'normal');
    } else {
      $('.feed-actions').addClass('highlight');
      $('.comment-actions').addClass('highlight');

      $(this).attr('active', true);
      $(this).css('font-weight', 'bold');
    }

  });

  $('[highlight="moderation"]').click(function() {
    const status = $(this).attr('active');

    if(status === "true") {
      $('i').removeClass('highlight');

      $(this).attr('active', false);
      $(this).css('font-weight', 'normal');
    } else {
      $('i').addClass('highlight');

      $(this).attr('active', true);
      $(this).css('font-weight', 'bold');
    }

  });

  $('[highlight="nickname"]').click(function() {
    const status = $(this).attr('active');

    if(status === "true") {
      $('small').removeClass('highlight');

      $(this).attr('active', false);
      $(this).css('font-weight', 'normal');
    } else {
      $('small').addClass('highlight');

      $(this).attr('active', true);
      $(this).css('font-weight', 'bold');
    }

  });

});