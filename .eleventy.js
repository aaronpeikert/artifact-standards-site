module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");

  eleventyConfig.addFilter("tagById", function (curie, standards) {
    const study = (standards.method_type_tags || []).find((t) => t.id === curie);
    if (study) return { ...study, kind: "method-type" };
    const artifact = (standards.artifact_tags || []).find((t) => t.id === curie);
    if (artifact) return { ...artifact, kind: "artifact" };
    return { id: curie, name: curie, kind: "unknown" };
  });

  // Strip CURIE prefix: "as:benchmarking" → "benchmarking"
  eleventyConfig.addFilter("slugify", function (curie) {
    return String(curie)
      .replace(/^[^:]+:/, "")
      .replace(/[^a-z0-9-]/gi, "-")
      .toLowerCase();
  });

  // Return a JSON string of slugified CURIE IDs — used for data attributes
  eleventyConfig.addFilter("tagSlugs", function (curies) {
    return JSON.stringify(
      (curies || []).map((c) =>
        String(c).replace(/^[^:]+:/, "").replace(/[^a-z0-9-]/gi, "-").toLowerCase()
      )
    );
  });

  // Strip the " — Generic" suffix used in data for semantic tagging
  eleventyConfig.addFilter("displayName", function (name) {
    return String(name).replace(/\s*—\s*Generic\s*$/i, "");
  });

  function slugifyCurie(curie) {
    return String(curie).replace(/^[^:]+:/, "").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  }

  // All standard references of a venue: venue-wide ones (badge: null) and
  // those required by each badge it offers.
  function venueRefs(venue) {
    const refs = (venue.required_standards || []).map((ref) => ({ ref, badge: null }));
    (venue.badges || []).forEach((badge) => {
      (badge.required_standards || []).forEach((ref) => refs.push({ ref, badge }));
    });
    return refs;
  }

  function refsFor(implId, venue) {
    return venueRefs(venue).filter((r) => r.ref.standard === implId);
  }

  // JSON array of venue slugs that require this implementation (standard)
  eleventyConfig.addFilter("requiredByVenues", function (implId, venues) {
    if (!venues || !venues.length) return "[]";
    const slugs = venues
      .filter((v) => refsFor(implId, v).length > 0)
      .map((v) => slugifyCurie(v.id));
    return JSON.stringify(slugs);
  });

  // JSON object mapping venue slug → venue-specific display name for this implementation
  eleventyConfig.addFilter("venueDisplayNames", function (implId, venues) {
    if (!venues || !venues.length) return "{}";
    const result = {};
    venues.forEach((v) => {
      const named = refsFor(implId, v).find((r) => r.ref.display_name);
      if (named) result[slugifyCurie(v.id)] = named.ref.display_name;
    });
    return JSON.stringify(result);
  });

  // JSON object mapping venue slug → list of requirement contexts for this
  // implementation: which badge (or all submissions) requires it, at which
  // check level, for which artifact tags, with which note and parameters.
  eleventyConfig.addFilter("venueRequirements", function (implId, venues, standards) {
    if (!venues || !venues.length) return "{}";
    const tagName = (curie) => {
      const all = [...(standards.method_type_tags || []), ...(standards.artifact_tags || [])];
      const tag = all.find((t) => t.id === curie);
      return tag ? tag.name : curie;
    };
    const result = {};
    venues.forEach((v) => {
      const refs = refsFor(implId, v);
      if (!refs.length) return;
      result[slugifyCurie(v.id)] = refs.map(({ ref, badge }) => ({
        scope: badge ? badge.name : "All submissions",
        check_level: ref.check_level || null,
        applies_to: (ref.applies_to_artifact_tags || []).map(tagName),
        note: ref.note ? String(ref.note).trim() : null,
        parameters: (ref.parameters || []).map((p) => ({
          name: p.name,
          value: String(p.value),
          description: p.description || null,
        })),
      }));
    });
    return JSON.stringify(result);
  });

  // JSON array of all venue slugs that require any implementation in this principle
  // Used on principle cards so filter.js can show/hide at the card level
  eleventyConfig.addFilter("principleImplVenues", function (principle, venues) {
    if (!venues || !venues.length) return "[]";
    const implIds = new Set((principle.implementations || []).map((i) => i.id));
    const slugs = new Set();
    venues.forEach((v) => {
      venueRefs(v).forEach(({ ref }) => {
        if (implIds.has(ref.standard)) slugs.add(slugifyCurie(v.id));
      });
    });
    return JSON.stringify([...slugs]);
  });

  return {
    pathPrefix: "/artifact-standards-site/",
    dir: {
      input: "src",
      output: "public",
      includes: "_includes",
      data: "_data",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
