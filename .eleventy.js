module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");

  // Resolve a CURIE tag reference to its tag object, annotated with kind
  eleventyConfig.addFilter("tagById", function (curie, standards) {
    const study = (standards.study_tags || []).find((t) => t.id === curie);
    if (study) return { ...study, kind: "study" };
    const artifact = (standards.artifact_tags || []).find((t) => t.id === curie);
    if (artifact) return { ...artifact, kind: "artifact" };
    return { id: curie, name: curie, kind: "unknown" };
  });

  // Convert a CURIE like "as:reproducible-installation" to a URL-safe slug
  eleventyConfig.addFilter("slugify", function (curie) {
    return String(curie)
      .replace(/^[^:]+:/, "")
      .replace(/[^a-z0-9-]/gi, "-")
      .toLowerCase();
  });

  return {
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
