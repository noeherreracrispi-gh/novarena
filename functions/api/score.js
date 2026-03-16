import {
  errorResponse,
  insertScore,
  jsonResponse,
  normalizeScorePayload,
  optionsResponse,
  readJsonBody
} from '../_shared/novarena-api.js';

export function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestPost(context) {
  try {
    var payload = await readJsonBody(context.request);
    var entry = normalizeScorePayload(payload);
    var savedEntry = await insertScore(context.env, entry);

    return jsonResponse({
      ok: true,
      entry: savedEntry
    }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
