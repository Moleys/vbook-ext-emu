function getBaseUrl(url) {
  const match = url.match(/^https?:\/\/[^/]+/);
  return match ? match[0] : null;
}