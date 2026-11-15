/* =========================================================
   EduManage — shared front-end interactions
   No backend calls here — replace TODOs with real API calls
   once wired up to FastAPI.
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Sidebar toggle (mobile) ---------- */
  var sidebar = document.getElementById('sidebar');
  var backdrop = document.getElementById('sidebarBackdrop');
  var openBtn = document.getElementById('sidebarToggleBtn');
  var closeBtn = document.getElementById('sidebarCloseBtn');

  function openSidebar() {
    sidebar && sidebar.classList.add('show');
    backdrop && backdrop.classList.add('show');
  }
  function closeSidebar() {
    sidebar && sidebar.classList.remove('show');
    backdrop && backdrop.classList.remove('show');
  }
  openBtn && openBtn.addEventListener('click', openSidebar);
  closeBtn && closeBtn.addEventListener('click', closeSidebar);
  backdrop && backdrop.addEventListener('click', closeSidebar);

  /* ---------- Simulated content loader ----------
     Toggles a spinner for a moment before revealing real
     content. In production, show this while awaiting the
     FastAPI response, then render the returned data. */
  document.querySelectorAll('[data-loader-target]').forEach(function (loader) {
    var targetSel = loader.getAttribute('data-loader-target');
    var target = document.querySelector(targetSel);
    if (!target) return;
    target.classList.add('d-none');
    setTimeout(function () {
      loader.classList.add('d-none');
      target.classList.remove('d-none');
    }, 650);
  });

  /* ---------- Dismissible alert auto-hide ---------- */
  document.querySelectorAll('[data-autohide]').forEach(function (alertEl) {
    setTimeout(function () {
      alertEl.classList.add('d-none');
    }, 4500);
  });

  /* ---------- Generic live table / list filter ----------
     Add data-filter-input="#idOfInput" on a text input and
     data-filter-row on each row/card element that should be
     matched against its data-search attribute. */
  document.querySelectorAll('[data-filter-input]').forEach(function (input) {
    input.addEventListener('input', function () {
      var query = input.value.trim().toLowerCase();
      var scope = input.getAttribute('data-filter-scope');
      var rows = scope ? document.querySelectorAll(scope + ' [data-filter-row]') : document.querySelectorAll('[data-filter-row]');
      var visibleCount = 0;
      rows.forEach(function (row) {
        var haystack = (row.getAttribute('data-search') || row.textContent).toLowerCase();
        var match = haystack.indexOf(query) !== -1;
        row.classList.toggle('d-none', !match);
        if (match) visibleCount++;
      });
      var emptyState = document.querySelector('[data-empty-for="' + (scope || 'global') + '"]');
      if (emptyState) emptyState.classList.toggle('d-none', visibleCount !== 0 || query === '');
    });
  });

  /* ---------- Department / status filter dropdowns ---------- */
  document.querySelectorAll('[data-filter-select]').forEach(function (select) {
    select.addEventListener('change', function () {
      var attr = select.getAttribute('data-filter-select');
      var value = select.value;
      var rows = document.querySelectorAll('[data-filter-row]');
      rows.forEach(function (row) {
        var rowValue = row.getAttribute('data-' + attr);
        var show = value === 'all' || rowValue === value;
        row.classList.toggle('d-none', !show);
      });
    });
  });

  /* ---------- Delete confirmation modal wiring ----------
     Any element with data-delete-name / data-delete-id fills
     the shared modal fields before it is shown. */
  var deleteModalEl = document.getElementById('deleteConfirmModal');
  if (deleteModalEl && window.bootstrap) {
    var deleteModal = new bootstrap.Modal(deleteModalEl);
    var nameSlot = deleteModalEl.querySelector('[data-modal-student-name]');
    var metaSlot = deleteModalEl.querySelector('[data-modal-student-meta]');
    var confirmBtn = deleteModalEl.querySelector('[data-modal-confirm-btn]');
    var pendingRow = null;

    document.querySelectorAll('[data-delete-trigger]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        pendingRow = btn.closest('[data-filter-row]');
        if (nameSlot) nameSlot.textContent = btn.getAttribute('data-delete-name') || 'this student';
        if (metaSlot) metaSlot.textContent = btn.getAttribute('data-delete-meta') || '';
        deleteModal.show();
      });
    });

    confirmBtn && confirmBtn.addEventListener('click', function () {
      // TODO: call DELETE /api/students/{id} here.
      deleteModal.hide();
      if (pendingRow) {
        pendingRow.style.transition = 'opacity .25s ease, transform .25s ease';
        pendingRow.style.opacity = '0';
        pendingRow.style.transform = 'translateX(12px)';
        setTimeout(function () { pendingRow.remove(); }, 250);
      }
      showToast('success', 'Student removed', 'The student record was deleted successfully.');
    });
  }

  /* ---------- Standalone delete page confirm button ---------- */
  var standaloneDeleteBtn = document.getElementById('standaloneDeleteConfirm');
  if (standaloneDeleteBtn) {
    standaloneDeleteBtn.addEventListener('click', function () {
      var modalEl = document.getElementById('deleteConfirmModal');
      if (modalEl && window.bootstrap) {
        var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
      }
    });
  }
  var finalDeleteBtn = document.getElementById('finalDeleteBtn');
  if (finalDeleteBtn) {
    finalDeleteBtn.addEventListener('click', function () {
      // TODO: call DELETE /api/students/{id} here.
      var modalEl = document.getElementById('deleteConfirmModal');
      if (modalEl && window.bootstrap) bootstrap.Modal.getOrCreateInstance(modalEl).hide();
      document.getElementById('deletePageDefault').classList.add('d-none');
      document.getElementById('deletePageDone').classList.remove('d-none');
    });
  }

  /* ---------- Empty-state preview toggle (demo only) ---------- */
  var previewEmptyBtn = document.getElementById('previewEmptyStateBtn');
  if (previewEmptyBtn) {
    previewEmptyBtn.addEventListener('click', function () {
      var tableWrap = document.getElementById('studentsTableWrap');
      var emptyWrap = document.getElementById('studentsEmptyState');
      var showingEmpty = !emptyWrap.classList.contains('d-none');
      if (showingEmpty) {
        emptyWrap.classList.add('d-none');
        tableWrap.classList.remove('d-none');
        previewEmptyBtn.innerHTML = '<i class="fa-solid fa-eye"></i> Preview empty state';
      } else {
        emptyWrap.classList.remove('d-none');
        tableWrap.classList.add('d-none');
        previewEmptyBtn.innerHTML = '<i class="fa-solid fa-table"></i> Show sample data';
      }
    });
  }

  /* ---------- Form submit demo handlers (Add / Update) ----------
     Prevents real submission, runs Bootstrap validation, and
     shows a success alert. Swap for a real fetch() POST/PUT
     to FastAPI once the backend is wired in. */
  document.querySelectorAll('[data-demo-form]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
      }
      form.classList.add('was-validated');
      var successMessage = form.getAttribute('data-success-message') || 'Saved successfully.';
      showToast('success', 'Success', successMessage);
      var redirect = form.getAttribute('data-success-redirect');
      if (redirect) {
        setTimeout(function () { window.location.href = redirect; }, 1200);
      }
    });
  });

  /* ---------- Toast helper ---------- */
  window.showToast = function (type, title, message) {
    var stack = document.getElementById('toastStack');
    if (!stack) return;
    var icon = type === 'success' ? 'fa-circle-check' : (type === 'danger' ? 'fa-circle-exclamation' : 'fa-circle-info');
    var el = document.createElement('div');
    el.className = 'alert-modern ' + type;
    el.innerHTML = '<i class="fa-solid ' + icon + '"></i>' +
      '<div><strong>' + title + '</strong><div>' + message + '</div></div>';
    stack.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity .3s ease';
      el.style.opacity = '0';
      setTimeout(function () { el.remove(); }, 300);
    }, 4000);
  };

  /* ---------- Search Student page ---------- */
  var searchInput = document.getElementById('studentSearchInput');
  if (searchInput) {
    var resultsWrap = document.getElementById('searchResults');
    var idleState = document.getElementById('searchIdleState');
    var noResultsState = document.getElementById('searchNoResults');
    var cards = resultsWrap ? Array.from(resultsWrap.querySelectorAll('[data-search-card]')) : [];

    searchInput.addEventListener('input', function () {
      var q = searchInput.value.trim().toLowerCase();
      if (q === '') {
        resultsWrap.classList.add('d-none');
        noResultsState.classList.add('d-none');
        idleState.classList.remove('d-none');
        return;
      }
      idleState.classList.add('d-none');
      var visible = 0;
      cards.forEach(function (card) {
        var hay = (card.getAttribute('data-search') || '').toLowerCase();
        var match = hay.indexOf(q) !== -1;
        card.classList.toggle('d-none', !match);
        if (match) visible++;
      });
      resultsWrap.classList.toggle('d-none', visible === 0);
      noResultsState.classList.toggle('d-none', visible !== 0);
    });
  }

});
