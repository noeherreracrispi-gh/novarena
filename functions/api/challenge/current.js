import {
  errorResponse,
  getCurrentChallenge,
  jsonResponse,
  optionsResponse
} from '../../../cloudflare/lib/novarena-api.js';

export function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestGet(context) {
  try {
    var challenge = await getCurrentChallenge(context.env);

    return jsonResponse({
      ok: true,
      challenge: challenge
    });
  } catch (error) {
    return errorResponse(error);
  }
}
