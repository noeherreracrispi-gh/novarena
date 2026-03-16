import {
  errorResponse,
  getActivity,
  jsonResponse,
  optionsResponse,
  parseActivityRequest
} from '../../cloudflare/lib/novarena-api.js';

export function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestGet(context) {
  try {
    var requestUrl = new URL(context.request.url);
    var options = parseActivityRequest(requestUrl);
    var items = await getActivity(context.env, options);

    return jsonResponse({
      ok: true,
      game: options.game,
      limit: options.limit,
      items: items
    });
  } catch (error) {
    return errorResponse(error);
  }
}
