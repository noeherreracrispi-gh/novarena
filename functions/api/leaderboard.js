import {
  errorResponse,
  getLeaderboard,
  jsonResponse,
  optionsResponse,
  parseLeaderboardRequest
} from '../../cloudflare/lib/novarena-api.js';

export function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestGet(context) {
  try {
    var requestUrl = new URL(context.request.url);
    var options = parseLeaderboardRequest(requestUrl);
    var entries = await getLeaderboard(context.env, options);

    return jsonResponse({
      ok: true,
      game: options.game,
      limit: options.limit,
      period: options.period,
      entries: entries
    });
  } catch (error) {
    return errorResponse(error);
  }
}
