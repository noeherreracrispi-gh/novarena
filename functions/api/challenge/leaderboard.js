import {
  errorResponse,
  getChallengeLeaderboard,
  jsonResponse,
  optionsResponse,
  parseChallengeLeaderboardRequest
} from '../../../cloudflare/lib/novarena-api.js';

export function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestGet(context) {
  try {
    var requestUrl = new URL(context.request.url);
    var options = parseChallengeLeaderboardRequest(requestUrl);
    var result = await getChallengeLeaderboard(context.env, options);

    return jsonResponse({
      ok: true,
      challenge: result.challenge,
      limit: options.limit,
      entries: result.entries
    });
  } catch (error) {
    return errorResponse(error);
  }
}
