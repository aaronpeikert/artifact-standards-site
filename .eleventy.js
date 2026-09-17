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
