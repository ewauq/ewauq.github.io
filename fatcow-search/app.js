(function () {
    'use strict';

    var state = {
        allIcons: typeof ICONS_DATA !== 'undefined' ? ICONS_DATA : [],
        filtered: [],
        currentPage: 1,
        perPage: 196,
        modalIndex: -1
    };

    var $ = function (id) { return document.getElementById(id); };
    var searchInput = $('search-input');
    var resultCount = $('result-count');
    var grid = $('icons-grid');
    var pagination = $('pagination');
    var modal = $('icon-modal');
    var modalTitle = $('modal-title');
    var modalPreview = modal.querySelector('.modal-preview');
    var modalVariants = modal.querySelector('.modal-variants');

    // ── Search ──

    function doSearch(q) {
        q = (q || '').toLowerCase().trim();
        searchInput.value = q;
        state.currentPage = 1;
        state.filtered = q
            ? state.allIcons.filter(function (ic) {
                return ic.label.toLowerCase().includes(q) ||
                    ic.keywords.some(function (kw) { return kw.includes(q); });
            })
            : state.allIcons.slice();

        var url = q ? '?q=' + encodeURIComponent(q) : location.pathname;
        history.pushState({ q: q }, '', url);

        render();
    }

    var debounce;
    searchInput.addEventListener('input', function (e) {
        clearTimeout(debounce);
        debounce = setTimeout(function () { doSearch(e.target.value); }, 200);
    });

    // ── Render ──

    function render() {
        var total = state.filtered.length;
        resultCount.textContent = total + ' icon' + (total !== 1 ? 's' : '');

        var start = (state.currentPage - 1) * state.perPage;
        var page = state.filtered.slice(start, start + state.perPage);

        if (!page.length) {
            grid.innerHTML = '<div class="empty-state">No icons match your search.</div>';
            pagination.innerHTML = '';
            return;
        }

        grid.innerHTML = page.map(function (ic, i) {
            return '<div class="icon-card" role="listitem" data-filename="' + ic.filename +
                '" tabindex="0" title="' + ic.label +
                '" style="animation-delay:' + (i * 3) + 'ms">' +
                '<img src="icons/colored/32x32/' + ic.filename +
                '" alt="' + ic.label + '" width="32" height="32" loading="lazy"></div>';
        }).join('');

        renderPagination();
    }

    function renderPagination() {
        var totalPages = Math.ceil(state.filtered.length / state.perPage);
        if (totalPages <= 1) { pagination.innerHTML = ''; return; }

        var cur = state.currentPage;
        var html = '<button' + (cur === 1 ? ' disabled' : '') + ' data-page="' + (cur - 1) + '">&laquo;</button>';
        var pages = totalPages <= 7
            ? Array.from({ length: totalPages }, function (_, i) { return i + 1; })
            : buildPageNumbers(cur, totalPages);

        pages.forEach(function (p) {
            html += p === '...'
                ? '<span class="ellipsis">&hellip;</span>'
                : '<button' + (p === cur ? ' class="active"' : '') + ' data-page="' + p + '">' + p + '</button>';
        });

        html += '<button' + (cur === totalPages ? ' disabled' : '') + ' data-page="' + (cur + 1) + '">&raquo;</button>';
        pagination.innerHTML = html;
    }

    function buildPageNumbers(cur, total) {
        var p = [1];
        if (cur > 3) p.push('...');
        for (var i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) p.push(i);
        if (cur < total - 2) p.push('...');
        p.push(total);
        return p;
    }

    pagination.addEventListener('click', function (e) {
        var btn = e.target.closest('button');
        if (!btn || btn.disabled) return;
        state.currentPage = parseInt(btn.dataset.page, 10);
        render();
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // ── Grid events ──

    grid.addEventListener('click', function (e) {
        var card = e.target.closest('.icon-card');
        if (card) openModal(card.dataset.filename);
    });

    grid.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            var card = e.target.closest('.icon-card');
            if (card) { e.preventDefault(); openModal(card.dataset.filename); }
        }
    });

    // ── Modal ──

    function openModal(filename) {
        var idx = state.filtered.findIndex(function (i) { return i.filename === filename; });
        if (idx === -1) return;
        state.modalIndex = idx;
        var icon = state.filtered[idx];

        var prev = grid.querySelector('.icon-card.active');
        if (prev) prev.classList.remove('active');
        var card = grid.querySelector('[data-filename="' + filename + '"]');
        if (card) card.classList.add('active');

        modalTitle.textContent = icon.label;

        // Nav
        $('modal-nav').innerHTML =
            '<button class="modal-nav-btn" data-dir="-1" aria-label="Previous icon"' +
            (idx === 0 ? ' disabled' : '') + '>&lsaquo;</button>' +
            '<span class="modal-nav-pos">' + (idx + 1) + ' / ' + state.filtered.length + '</span>' +
            '<button class="modal-nav-btn" data-dir="1" aria-label="Next icon"' +
            (idx === state.filtered.length - 1 ? ' disabled' : '') + '>&rsaquo;</button>';

        modalPreview.innerHTML = '<canvas width="96" height="96"></canvas>';
        var ctx = modalPreview.querySelector('canvas').getContext('2d');
        ctx.imageSmoothingEnabled = false;
        var img = new Image();
        img.onload = function () { ctx.drawImage(img, 0, 0, 96, 96); };
        img.src = 'icons/colored/32x32/' + icon.filename;

        // Variant buttons with dropdown
        var html = '';
        icon.availableStyles.forEach(function (style) {
            icon.availableSizes.forEach(function (size) {
                var path = 'icons/' + style + '/' + size + 'x' + size + '/' + icon.filename;
                html += '<div class="variant-item">' +
                    '<button class="variant-btn" data-path="' + path + '">' +
                    '<img src="' + path + '" alt="' + icon.label + ' ' + style + ' ' + size + 'x' + size +
                    '" width="' + size + '" height="' + size + '">' +
                    '<span>' + style + ' ' + size + '&times;' + size + '</span></button>' +
                    '</div>';
            });
        });

        // Clickable keywords
        html += '<div class="modal-keywords">' + icon.keywords.map(function (kw) {
            return '<button class="keyword-tag" data-keyword="' + kw + '">' + kw + '</button>';
        }).join('') + '</div>';

        html += '<p class="modal-hint">Use &larr; &rarr; arrow keys to navigate</p>';

        modalVariants.innerHTML = html;
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
        modal.querySelector('.modal-close').focus();
    }

    function navigateModal(dir) {
        var next = state.modalIndex + dir;
        if (next < 0 || next >= state.filtered.length) return;
        openModal(state.filtered[next].filename);
    }

    function closeModal() {
        modal.hidden = true;
        document.body.style.overflow = '';
        state.modalIndex = -1;
        var active = grid.querySelector('.icon-card.active');
        if (active) { active.classList.remove('active'); active.focus(); }
    }

    // Modal event delegation
    modal.addEventListener('click', function (e) {
        // Close
        if (e.target.matches('.modal-close') || e.target.matches('.modal-backdrop')) {
            closeModal(); return;
        }
        // Nav buttons
        var navBtn = e.target.closest('.modal-nav-btn');
        if (navBtn && !navBtn.disabled) {
            navigateModal(parseInt(navBtn.dataset.dir, 10)); return;
        }
        // Variant button → toggle dropdown
        var variantBtn = e.target.closest('.variant-btn');
        if (variantBtn) {
            var item = variantBtn.closest('.variant-item');
            var existing = item.querySelector('.variant-dropdown');
            closeAllDropdowns();
            if (!existing) {
                var path = variantBtn.dataset.path;
                var dd = document.createElement('div');
                dd.className = 'variant-dropdown';
                dd.innerHTML =
                    '<button data-action="url" data-path="' + path + '">Copy direct URL</button>' +
                    '<button data-action="base64" data-path="' + path + '">Copy base64 value</button>';
                item.appendChild(dd);
            }
            return;
        }
        // Dropdown actions
        var ddBtn = e.target.closest('.variant-dropdown button');
        if (ddBtn) {
            var action = ddBtn.dataset.action;
            var p = ddBtn.dataset.path;
            if (action === 'url') {
                var url = new URL(p, location.href).href;
                copyAndFeedback(ddBtn, url);
            } else if (action === 'base64') {
                toBase64(p, function (b64) { copyAndFeedback(ddBtn, b64); }, function () {
                    ddBtn.textContent = 'Unavailable in file://';
                    setTimeout(function () { ddBtn.textContent = 'Copy base64 value'; }, 2000);
                });
            }
            return;
        }
        // Keyword click
        var kwBtn = e.target.closest('.keyword-tag');
        if (kwBtn) {
            closeModal();
            doSearch(kwBtn.dataset.keyword);
            return;
        }
        // Click outside dropdown closes it
        closeAllDropdowns();
    });

    function closeAllDropdowns() {
        modal.querySelectorAll('.variant-dropdown').forEach(function (dd) { dd.remove(); });
    }

    function copyAndFeedback(btn, text) {
        navigator.clipboard.writeText(text).then(function () {
            var orig = btn.textContent;
            btn.textContent = 'Copied!';
            btn.classList.add('copied');
            setTimeout(function () {
                btn.textContent = orig;
                btn.classList.remove('copied');
            }, 1500);
        });
    }

    function toBase64(path, cb, onError) {
        var img = new Image();
        img.onload = function () {
            try {
                var c = document.createElement('canvas');
                c.width = img.naturalWidth;
                c.height = img.naturalHeight;
                c.getContext('2d').drawImage(img, 0, 0);
                cb(c.toDataURL('image/png'));
            } catch (e) {
                if (onError) onError();
            }
        };
        img.onerror = onError;
        img.src = path;
    }

    // Keyboard: Escape, arrows, focus trap
    document.addEventListener('keydown', function (e) {
        if (modal.hidden) return;
        if (e.key === 'Escape') { closeModal(); return; }
        if (e.key === 'ArrowLeft') { navigateModal(-1); return; }
        if (e.key === 'ArrowRight') { navigateModal(1); return; }
        if (e.key === 'Tab') {
            var focusable = modal.querySelectorAll('button:not(:disabled), a[href]');
            var first = focusable[0], last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    });

    // ── Theme ──

    var root = document.documentElement;
    var saved = localStorage.getItem('fatcow-theme');
    if (saved) root.setAttribute('data-theme', saved);

    $('theme-toggle').addEventListener('click', function () {
        var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        localStorage.setItem('fatcow-theme', next);

        // Explosion effect: radial delay from grid center
        var cards = grid.querySelectorAll('.icon-card');
        if (cards.length) {
            var isDark = next === 'dark';
            var newBg = isDark ? '#1f2937' : '#ffffff';
            var newBorder = isDark ? '#374151' : '#e5e7eb';
            var rect = grid.getBoundingClientRect();
            var cx = rect.left + rect.width / 2;
            var cy = rect.top + rect.height / 2;
            var maxDist = 0;
            var dists = [];
            cards.forEach(function (card) {
                var r = card.getBoundingClientRect();
                var dx = r.left + r.width / 2 - cx;
                var dy = r.top + r.height / 2 - cy;
                var d = Math.sqrt(dx * dx + dy * dy);
                dists.push(d);
                if (d > maxDist) maxDist = d;
            });
            // Freeze current colors before theme switch applies
            var oldBg = getComputedStyle(cards[0]).backgroundColor;
            var oldBorder = getComputedStyle(cards[0]).borderColor;
            cards.forEach(function (card) {
                card.style.backgroundColor = oldBg;
                card.style.borderColor = oldBorder;
                card.style.transition = 'none';
            });
            // After a frame, animate each card to new color with radial delay
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    cards.forEach(function (card, i) {
                        var delay = maxDist ? (dists[i] / maxDist) * 500 : 0;
                        card.style.transition = 'background-color 0.3s ' + delay + 'ms, border-color 0.3s ' + delay + 'ms';
                        card.style.backgroundColor = newBg;
                        card.style.borderColor = newBorder;
                    });
                    setTimeout(function () {
                        cards.forEach(function (card) {
                            card.style.backgroundColor = '';
                            card.style.borderColor = '';
                            card.style.transition = '';
                        });
                    }, 900);
                });
            });
        }
    });

    // ── Footer ──

    var footerToggle = $('footer-toggle');
    footerToggle.addEventListener('click', function () {
        var expanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', String(!expanded));
        this.textContent = expanded ? 'About FatCow Icons' : 'Hide';
        $('footer-info').hidden = expanded;
    });

    // ── History ──

    window.addEventListener('popstate', function () {
        var q = new URLSearchParams(location.search).get('q') || '';
        searchInput.value = q;
        state.currentPage = 1;
        state.filtered = q
            ? state.allIcons.filter(function (ic) {
                return ic.label.toLowerCase().includes(q) ||
                    ic.keywords.some(function (kw) { return kw.includes(q); });
            })
            : state.allIcons.slice();
        render();
    });

    // ── Init ──

    var initQuery = new URLSearchParams(location.search).get('q');
    if (initQuery) {
        doSearch(initQuery);
    } else {
        state.filtered = state.allIcons.slice();
        render();
    }
})();
