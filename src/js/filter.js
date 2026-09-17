(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);

  function getFilters() {
    return {
      study: params.getAll("study"),
      artifact: params.getAll("artifact"),
      venue: params.get("venue") || "",
    };
  }

  function applyFilters() {
    var filters = getFilters();
    var cards = document.querySelectorAll(".principle-card");
    var visible = 0;

    // Update tag filter button active states
    document.querySelectorAll("[data-filter-type]").forEach(function (btn) {
      var active = filters[btn.dataset.filterType].includes(btn.dataset.filterId);
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    // Update venue selector
    var venueSelect = document.getElementById("venue-select");
    if (venueSelect) venueSelect.value = filters.venue;

    // Show/hide principle cards
    cards.forEach(function (card) {
      var studyTags = JSON.parse(card.dataset.study || "[]");
      var artifactTags = JSON.parse(card.dataset.artifact || "[]");
      var implVenues = JSON.parse(card.dataset.implVenues || "[]");

      var studyMatch =
        filters.study.length === 0 ||
        filters.study.some(function (f) { return studyTags.indexOf(f) !== -1; });
      var artifactMatch =
        filters.artifact.length === 0 ||
        filters.artifact.some(function (f) { return artifactTags.indexOf(f) !== -1; });
      var venueMatch =
        filters.venue === "" ||
        implVenues.indexOf(filters.venue) !== -1;

      var show = studyMatch && artifactMatch && venueMatch;
      card.hidden = !show;
      if (show) visible++;

      // Swap implementation display names and highlight venue-required impls
      card.querySelectorAll(".impl-details").forEach(function (details) {
        var requiredBy = JSON.parse(details.dataset.requiredBy || "[]");
        var venueNames = JSON.parse(details.dataset.venueNames || "{}");
        var isRequired = filters.venue !== "" && requiredBy.indexOf(filters.venue) !== -1;

        details.classList.toggle("impl-details--venue-required", isRequired);

        var nameEl = details.querySelector(".impl-display-name");
        if (nameEl) {
          if (!nameEl.dataset.defaultName) {
            nameEl.dataset.defaultName = nameEl.textContent;
          }
          var venueName = filters.venue && venueNames[filters.venue];
          nameEl.textContent = venueName || nameEl.dataset.defaultName;
        }
      });
    });

    // Update status text
    var counter = document.getElementById("filter-count");
    if (counter) {
      var hasFilter =
        filters.study.length > 0 ||
        filters.artifact.length > 0 ||
        filters.venue !== "";
      counter.textContent = hasFilter
        ? visible + " of " + cards.length + " principles"
        : "";
    }

    // Show empty state
    var noResults = document.getElementById("no-results");
    if (noResults) noResults.hidden = visible > 0;
  }

  function toggleFilter(type, id) {
    var values = params.getAll(type);
    params.delete(type);
    if (values.indexOf(id) !== -1) {
      values.filter(function (v) { return v !== id; })
        .forEach(function (v) { params.append(type, v); });
    } else {
      values.concat(id).forEach(function (v) { params.append(type, v); });
    }
    var qs = params.toString();
    history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : ""));
    applyFilters();
  }

  function setVenueFilter(venueSlug) {
    if (venueSlug) {
      params.set("venue", venueSlug);
    } else {
      params.delete("venue");
    }
    var qs = params.toString();
    history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : ""));
    applyFilters();
  }

  // Wire up tag filter buttons
  document.querySelectorAll("[data-filter-type]").forEach(function (btn) {
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", function () {
      toggleFilter(btn.dataset.filterType, btn.dataset.filterId);
    });
  });

  // Wire up venue selector
  var venueSelect = document.getElementById("venue-select");
  if (venueSelect) {
    venueSelect.addEventListener("change", function () {
      setVenueFilter(venueSelect.value);
    });
  }

  // Wire up version switcher (preserves current filter params)
  var sel = document.getElementById("version-select");
  if (sel) {
    sel.addEventListener("change", function () {
      window.location.href = sel.dataset.baseUrl + sel.value + "/" + window.location.search;
    });
  }

  // Apply filters on load (restores state from URL)
  applyFilters();
})();
