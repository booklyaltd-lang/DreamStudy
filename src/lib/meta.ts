export interface MetaTagsConfig {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export function updateMetaTags(config: MetaTagsConfig) {
  // Update title
  if (config.title) {
    document.title = config.title;
  }

  // Update or create description meta tag
  if (config.description) {
    updateMetaTag('name', 'description', config.description);
  }

  // Update Open Graph meta tags
  if (config.type) {
    updateMetaTag('property', 'og:type', config.type);
  }
  if (config.title) {
    updateMetaTag('property', 'og:title', config.title);
  }
  if (config.description) {
    updateMetaTag('property', 'og:description', config.description);
  }
  if (config.image) {
    updateMetaTag('property', 'og:image', config.image);
  }
  if (config.url) {
    updateMetaTag('property', 'og:url', config.url);
  }

  // Update Twitter Card meta tags
  if (config.title) {
    updateMetaTag('name', 'twitter:title', config.title);
  }
  if (config.description) {
    updateMetaTag('name', 'twitter:description', config.description);
  }
  if (config.image) {
    updateMetaTag('name', 'twitter:image', config.image);
  }
}

function updateMetaTag(attribute: string, attributeValue: string, content: string) {
  let element = document.querySelector(`meta[${attribute}="${attributeValue}"]`);

  if (element) {
    element.setAttribute('content', content);
  } else {
    element = document.createElement('meta');
    element.setAttribute(attribute, attributeValue);
    element.setAttribute('content', content);
    document.head.appendChild(element);
  }
}

export function getFullUrl(path: string = ''): string {
  const baseUrl = window.location.origin;
  return path ? `${baseUrl}${path.startsWith('/') ? path : '/' + path}` : baseUrl;
}
