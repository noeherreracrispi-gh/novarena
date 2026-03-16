import {
  errorResponse,
  getCurrentProfile,
  jsonResponse,
  optionsResponse,
  parseProfileRequest
} from '../../../cloudflare/lib/novarena-api.js';

export function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestGet(context) {
  try {
    var requestUrl = new URL(context.request.url);
    var options = parseProfileRequest(requestUrl);
    var profile = await getCurrentProfile(context.env, options);

    return jsonResponse({
      ok: true,
      profile: profile
    });
  } catch (error) {
    return errorResponse(error);
  }
}
