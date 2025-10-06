export interface URLParams {
  token: string | null;
  artifactId: string | null;
  baseUrl: string | null;
}

export const getURLParams = (): URLParams => {
  const params = new URLSearchParams(window.location.search);
  let baseUrl = params.get('base_url');

  // Remove trailing slash if present
  if (baseUrl && baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }

  return {
    token: params.get('token'),
    artifactId: params.get('artifact_id'),
    baseUrl: baseUrl,
  };
};

export const hasRequiredParams = (params: URLParams): boolean => {
  return !!(params.token && params.artifactId && params.baseUrl);
};
