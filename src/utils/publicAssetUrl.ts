export function publicAssetUrl(path: string) {
  if (
    typeof window !== 'undefined'
    && window.location.protocol === 'file:'
    && path.startsWith('/')
    && !path.startsWith('//')
  ) {
    return `.${path}`
  }

  return path
}
