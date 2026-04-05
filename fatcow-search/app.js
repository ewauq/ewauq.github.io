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
    var helpBtn = $('search-help');
    var helpPopover = $('search-help-popover');

    // ── Search ──

    function parseQuery(raw) {
        var tokens = { and: [], or: [], not: [], exact: [], wildcard: [] };
        if (!raw) return tokens;

        var remaining = raw.replace(/"([^"]+)"/g, function (_, m) {
            tokens.exact.push(m.toLowerCase().trim());
            return '';
        });

        var hasOr = remaining.indexOf('|') !== -1;

        remaining.trim().split(/\s+/).forEach(function (t) {
            if (!t || t === '|') return;
            if (t.charAt(0) === '-' && t.length > 1) {
                tokens.not.push(t.slice(1).toLowerCase());
            } else if (t.charAt(t.length - 1) === '*' && t.length > 1) {
                var w = t.charAt(0) === '+' ? t.slice(1, -1) : t.slice(0, -1);
                tokens.wildcard.push(w.toLowerCase());
            } else if (hasOr) {
                var word = t.charAt(0) === '+' ? t.slice(1) : t;
                tokens.or.push(word.toLowerCase());
            } else {
                var term = t.charAt(0) === '+' ? t.slice(1) : t;
                tokens.and.push(term.toLowerCase());
            }
        });

        return tokens;
    }

    function matchIcon(ic, tokens) {
        var label = ic.label.toLowerCase();
        var kws = ic.keywords;

        function has(term) {
            return kws.some(function (kw) { return kw.includes(term); }) || label.includes(term);
        }
        function exact(term) {
            return kws.some(function (kw) { return kw === term; });
        }
        function starts(prefix) {
            return kws.some(function (kw) { return kw.indexOf(prefix) === 0; }) || label.indexOf(prefix) === 0;
        }

        for (var i = 0; i < tokens.and.length; i++) if (!has(tokens.and[i])) return false;
        for (var j = 0; j < tokens.exact.length; j++) if (!exact(tokens.exact[j])) return false;
        for (var k = 0; k < tokens.not.length; k++) if (has(tokens.not[k])) return false;

        if (!tokens.or.length && tokens.wildcard.length) {
            for (var m = 0; m < tokens.wildcard.length; m++) if (!starts(tokens.wildcard[m])) return false;
        }

        if (tokens.or.length) {
            var any = tokens.or.some(function (t) { return has(t); }) ||
                      tokens.wildcard.some(function (t) { return starts(t); });
            if (!any) return false;
        }

        return true;
    }

    function doSearch(q, pushHistory) {
        q = (q || '').trim();
        searchInput.value = q;
        state.currentPage = 1;
        state.filtered = q
            ? state.allIcons.filter(function (ic) { return matchIcon(ic, parseQuery(q)); })
            : state.allIcons.slice();

        if (pushHistory !== false) {
            history.pushState({ q: q }, '', q ? '?q=' + encodeURIComponent(q) : location.pathname);
        }

        render();
    }

    var debounce;
    searchInput.addEventListener('input', function (e) {
        clearTimeout(debounce);
        debounce = setTimeout(function () { doSearch(e.target.value); }, 400);
    });

    // ── Render ──

    function render() {
        var total = state.filtered.length;
        var q = searchInput.value.trim();
        resultCount.innerHTML = '<strong>' + total + '</strong> icon' + (total !== 1 ? 's' : '') + (q ? ' found' : '');

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
        var html = '<button aria-label="Previous page"' + (cur === 1 ? ' disabled' : '') +
            ' data-page="' + (cur - 1) + '">&laquo;</button>';

        var pages = totalPages <= 7
            ? Array.from({ length: totalPages }, function (_, i) { return i + 1; })
            : buildPageNumbers(cur, totalPages);

        pages.forEach(function (p) {
            if (p === '...') {
                html += '<span class="ellipsis" aria-hidden="true">&hellip;</span>';
            } else {
                html += '<button' + (p === cur ? ' class="active" aria-current="page"' : '') +
                    ' data-page="' + p + '">' + p + '</button>';
            }
        });

        html += '<button aria-label="Next page"' + (cur === totalPages ? ' disabled' : '') +
            ' data-page="' + (cur + 1) + '">&raquo;</button>';
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

        $('modal-nav').innerHTML =
            '<button class="modal-nav-btn" data-dir="-1" aria-label="Previous icon"' +
            (idx === 0 ? ' disabled' : '') + '>&lsaquo;</button>' +
            '<span class="modal-nav-pos">' + (idx + 1) + ' / ' + state.filtered.length + '</span>' +
            '<button class="modal-nav-btn" data-dir="1" aria-label="Next icon"' +
            (idx === state.filtered.length - 1 ? ' disabled' : '') + '>&rsaquo;</button>';

        modalPreview.innerHTML = '<canvas width="96" height="96" role="img" aria-label="' + icon.label + ' preview"></canvas>';
        var ctx = modalPreview.querySelector('canvas').getContext('2d');
        ctx.imageSmoothingEnabled = false;
        var img = new Image();
        img.onload = function () { ctx.drawImage(img, 0, 0, 96, 96); };
        img.src = 'icons/colored/32x32/' + icon.filename;

        var html = '';
        icon.availableStyles.forEach(function (style) {
            icon.availableSizes.forEach(function (size) {
                var path = 'icons/' + style + '/' + size + 'x' + size + '/' + icon.filename;
                html += '<div class="variant-item">' +
                    '<button class="variant-btn" data-path="' + path + '" aria-label="' + style + ' ' + size + 'x' + size + '">' +
                    '<img src="' + path + '" alt="" width="' + size + '" height="' + size + '">' +
                    '<span>' + style + ' ' + size + '&times;' + size + '</span></button></div>';
            });
        });

        html += '<div class="modal-keywords" role="group" aria-label="Keywords">' + icon.keywords.map(function (kw) {
            return '<button class="keyword-tag" data-keyword="' + kw + '">' + kw + '</button>';
        }).join('') + '</div>';

        html += '<p class="modal-hint" aria-hidden="true">Use &larr; &rarr; arrow keys to navigate</p>';

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

    modal.addEventListener('click', function (e) {
        if (e.target.matches('.modal-close') || e.target.matches('.modal-backdrop')) {
            closeModal(); return;
        }
        var navBtn = e.target.closest('.modal-nav-btn');
        if (navBtn && !navBtn.disabled) {
            navigateModal(parseInt(navBtn.dataset.dir, 10)); return;
        }
        var variantBtn = e.target.closest('.variant-btn');
        if (variantBtn) {
            var item = variantBtn.closest('.variant-item');
            var existing = item.querySelector('.variant-dropdown');
            closeAllDropdowns();
            if (!existing) {
                var path = variantBtn.dataset.path;
                var dd = document.createElement('div');
                dd.className = 'variant-dropdown';
                dd.setAttribute('role', 'menu');
                dd.innerHTML =
                    '<button role="menuitem" data-action="url" data-path="' + path + '">Copy direct URL</button>' +
                    '<button role="menuitem" data-action="base64" data-path="' + path + '">Copy base64 value</button>';
                item.appendChild(dd);
            }
            return;
        }
        var ddBtn = e.target.closest('.variant-dropdown button');
        if (ddBtn) {
            var action = ddBtn.dataset.action;
            var p = ddBtn.dataset.path;
            if (action === 'url') {
                copyAndFeedback(ddBtn, new URL(p, location.href).href);
            } else if (action === 'base64') {
                toBase64(p, function (b64) { copyAndFeedback(ddBtn, b64); }, function () {
                    ddBtn.textContent = 'Unavailable in file://';
                    setTimeout(function () { ddBtn.textContent = 'Copy base64 value'; }, 2000);
                });
            }
            return;
        }
        var kwBtn = e.target.closest('.keyword-tag');
        if (kwBtn) { closeModal(); doSearch(kwBtn.dataset.keyword); return; }
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
            setTimeout(function () { btn.textContent = orig; btn.classList.remove('copied'); }, 1500);
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
            } catch (e) { if (onError) onError(); }
        };
        img.onerror = onError;
        img.src = path;
    }

    // ── Global keyboard ──

    document.addEventListener('keydown', function (e) {
        // Download dropdown
        if (e.key === 'Escape' && !dlDropdown.hidden) {
            dlDropdown.hidden = true;
            dlBtn.setAttribute('aria-expanded', 'false');
            dlBtn.focus();
            return;
        }
        // Popover
        if (e.key === 'Escape' && !helpPopover.hidden) {
            helpPopover.hidden = true;
            helpBtn.setAttribute('aria-expanded', 'false');
            helpBtn.focus();
            return;
        }
        // Modal
        if (!modal.hidden) {
            if (e.key === 'Escape') { closeModal(); return; }
            if (e.key === 'ArrowLeft') { navigateModal(-1); return; }
            if (e.key === 'ArrowRight') { navigateModal(1); return; }
            if (e.key === 'Tab') {
                var focusable = modal.querySelectorAll('button:not(:disabled), a[href]');
                var first = focusable[0], last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
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

        var cards = grid.querySelectorAll('.icon-card');
        if (!cards.length) return;

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
        var oldBg = getComputedStyle(cards[0]).backgroundColor;
        var oldBorder = getComputedStyle(cards[0]).borderColor;
        cards.forEach(function (card) {
            card.style.backgroundColor = oldBg;
            card.style.borderColor = oldBorder;
            card.style.transition = 'none';
        });
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
    });

    // ── Search help ──

    helpBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = !helpPopover.hidden;
        helpPopover.hidden = open;
        helpBtn.setAttribute('aria-expanded', String(!open));
    });

    document.addEventListener('click', function (e) {
        if (!helpPopover.hidden && !helpPopover.contains(e.target) && e.target !== helpBtn) {
            helpPopover.hidden = true;
            helpBtn.setAttribute('aria-expanded', 'false');
        }
    });

    // ── Download dropdown ──

    var dlBtn = $('download-btn');
    var dlDropdown = $('download-dropdown');

    dlBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = !dlDropdown.hidden;
        dlDropdown.hidden = open;
        dlBtn.setAttribute('aria-expanded', String(!open));
    });

    document.addEventListener('click', function (e) {
        if (!dlDropdown.hidden && !dlDropdown.contains(e.target) && e.target !== dlBtn) {
            dlDropdown.hidden = true;
            dlBtn.setAttribute('aria-expanded', 'false');
        }
    });

    // ── Home link ──

    $('home-link').addEventListener('click', function (e) {
        e.preventDefault();
        searchInput.value = '';
        doSearch('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ── Footer ──

    $('footer-toggle').addEventListener('click', function () {
        var expanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', String(!expanded));
        this.textContent = expanded ? 'About FatCow Icons' : 'Hide';
        $('footer-info').hidden = expanded;
    });

    // ── History ──

    window.addEventListener('popstate', function () {
        doSearch(new URLSearchParams(location.search).get('q') || '', false);
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
