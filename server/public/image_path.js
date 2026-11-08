function getProductImageUrl(imagePath) {
  const normalizedPath = String(imagePath || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\.\/+/, "")
    .replace(/^\/+/, "");

  if (!normalizedPath) {
    return "";
  }

  const publicImagePath = normalizedPath.toLowerCase().startsWith("images/")
    ? normalizedPath
    : `images/${normalizedPath}`;

  return `/${publicImagePath}`;
}
