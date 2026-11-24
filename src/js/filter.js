(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);

  function getFilters() {
    return {
      "method-type": params.getAll("method-type"),
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
      var methodTypeTags = JSON.parse(card.dataset.methodType || "[]");
      var artifactTags = JSON.parse(card.dataset.artifact || "[]");
      var implVenues = JSON.parse(card.dataset.implVenues || "[]");

      var methodTypeMatch =
        filters["method-type"].length === 0 ||
        filters["method-type"].some(function (f) { return methodTypeTags.indexOf(f) !== -1; });
      var artifactMatch =
        filters.artifact.length === 0 ||
        filters.artifact.some(function (f) { return artifactTags.indexOf(f) !== -1; });
      var venueMatch =
        filters.venue === "" ||
        implVenues.indexOf(filters.venue) !== -1;

      var show = methodTypeMatch && artifactMatch && venueMatch;
      card.hidden = !show;
      if (show) visible++;

      // Swap implementation display names, highlight venue-required impls,
      // and show which badges of the venue require them
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

        renderVenueRequirements(details, isRequired ? venueReqs(details, filters.venue) : []);
      });
    });

    // Show the info panel of the selected venue
    document.querySelectorAll("[data-venue-info]").forEach(function (panel) {
      panel.hidden = panel.dataset.venueInfo !== filters.venue;
    });

    // Update status text
    var counter = document.getElementById("filter-count");
    if (counter) {
      var hasFilter =
        filters["method-type"].length > 0 ||
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

  function venueReqs(details, venue) {
    var all = JSON.parse(details.dataset.venueRequirements || "{}");
    return all[venue] || [];
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  // Render badge chips in the summary and per-badge notes in the body.
  function renderVenueRequirements(details, reqs) {
    var chips = details.querySelector(".venue-scope-tags");
    var section = details.querySelector(".venue-requirements");
    var list = details.querySelector(".venue-requirements__list");
    var levelTag = details.querySelector(".impl-check-level");
    if (!chips || !section || !list) return;

    chips.textContent = "";
    list.textContent = "";
    section.hidden = reqs.length === 0;
    if (levelTag) levelTag.hidden = false;

    reqs.forEach(function (req) {
      chips.appendChild(el("span", "tag tag--scope", req.scope));

      var item = el("div", "check venue-requirement");
      var head = el("p", "venue-requirement__scope");
      head.appendChild(el("strong", null, req.scope));
      if (req.check_level) {
        head.appendChild(document.createTextNode(" "));
        head.appendChild(el("span", "tag tag--" + req.check_level, req.check_level));
      }
      if (req.applies_to.length) {
        head.appendChild(document.createTextNode(" — only for: " + req.applies_to.join(", ")));
      }
      item.appendChild(head);
      if (req.note) item.appendChild(el("p", "venue-requirement__note", req.note));
      if (req.parameters.length) {
        var params = el("ul", "evidence-list");
        req.parameters.forEach(function (p) {
          var li = el("li");
          li.appendChild(el("code", null, p.name + " = " + p.value));
          if (p.description) li.appendChild(document.createTextNode(" — " + p.description));
          params.appendChild(li);
        });
        item.appendChild(params);
      }
      list.appendChild(item);
    });

    // A venue-specific check level replaces the generic one in the summary
    var override = reqs.filter(function (r) { return r.check_level; })[0];
    if (levelTag && override) levelTag.hidden = true;
    if (override) chips.appendChild(el("span", "tag tag--" + override.check_level, override.check_level));
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
