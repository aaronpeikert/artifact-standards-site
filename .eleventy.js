module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");

  eleventyConfig.addFilter("tagById", function (curie, standards) {
    const study = (standards.study_tags || []).find((t) => t.id === curie);
    if (study) return { ...study, kind: "study" };
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

  function slugifyCurie(curie) {
    return String(curie).replace(/^[^:]+:/, "").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  }

  // JSON array of venue slugs that require this implementation (standard)
  eleventyConfig.addFilter("requiredByVenues", function (implId, venues) {
    if (!venues || !venues.length) return "[]";
    const slugs = venues
      .filter((v) => (v.required_standards || []).some((r) => r.standard === implId))
      .map((v) => slugifyCurie(v.id));
    return JSON.stringify(slugs);
  });

  // JSON object mapping venue slug → venue-specific display name for this implementation
  eleventyConfig.addFilter("venueDisplayNames", function (implId, venues) {
    if (!venues || !venues.length) return "{}";
    const result = {};
    venues.forEach((v) => {
      const ref = (v.required_standards || []).find((r) => r.standard === implId);
      if (ref && ref.display_name) {
        result[slugifyCurie(v.id)] = ref.display_name;
      }
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
      (v.required_standards || []).forEach((r) => {
        if (implIds.has(r.standard)) slugs.add(slugifyCurie(v.id));
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
