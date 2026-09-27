// Netlify Function: Googleのアクセストークンをリフレッシュトークンから更新する。
// Client Secret を使うのでサーバー側（ここ）でのみ実行する。ブラウザには一切渡さない。
//
// 呼び出し方: POST /.netlify/functions/refresh-google-token
// body: { "refresh_token": "..." }
// 戻り値: { "access_token": "...", "expires_in": 3600 }

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let refreshToken;
  try {
    refreshToken = JSON.parse(event.body || "{}").refresh_token;
  } catch (e) {
    return { statusCode: 400, body: "Invalid JSON" };
  }
  if (!refreshToken) {
    return { statusCode: 400, body: "refresh_token is required" };
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return { statusCode: 500, body: "Server is missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET" };
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    return { statusCode: res.status, body: JSON.stringify(data) };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: data.access_token, expires_in: data.expires_in }),
  };
};
