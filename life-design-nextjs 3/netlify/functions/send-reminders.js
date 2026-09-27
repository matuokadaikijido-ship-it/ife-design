// Netlify Scheduled Function: 期限が「今日」または「明日」のタスク・予定をチェックし、
// 登録されている端末すべてにプッシュ通知を送る。1日2回（サウジ・日本それぞれの朝に近い時間）実行。
//
// 必要な環境変数（Netlifyの管理画面で設定）:
//   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY … 既存のものをそのまま使う
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY … このリマインダー機能専用の鍵ペア

const { createClient } = require("@supabase/supabase-js");
const webpush = require("web-push");

exports.config = {
  schedule: "0 3,22 * * *", // UTC 03:00（リヤド朝6時ごろ）と 22:00（東京翌朝7時ごろ）
};

exports.handler = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!supabaseUrl || !supabaseKey || !vapidPublicKey || !vapidPrivateKey) {
    console.error("必要な環境変数が設定されていません。");
    return { statusCode: 500, body: "Missing environment variables" };
  }

  webpush.setVapidDetails("mailto:no-reply@example.com", vapidPublicKey, vapidPrivateKey);
  const supabase = createClient(supabaseUrl, supabaseKey);

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  // 今日・明日が期限で、まだ完了しておらず、今日はまだ通知していないタスク
  const { data: tasks, error: taskError } = await supabase
    .from("tasks")
    .select("*")
    .in("due_date", [todayStr, tomorrowStr])
    .eq("done", false);
  if (taskError) {
    console.error("タスクの取得に失敗しました", taskError);
    return { statusCode: 500, body: "Failed to fetch tasks" };
  }

  const targets = (tasks || []).filter((t) => {
    if (!t.reminded_at) return true;
    return t.reminded_at.slice(0, 10) !== todayStr;
  });

  if (targets.length === 0) {
    return { statusCode: 200, body: "No reminders to send" };
  }

  const { data: subs, error: subError } = await supabase.from("push_subscriptions").select("*");
  if (subError) {
    console.error("購読情報の取得に失敗しました", subError);
    return { statusCode: 500, body: "Failed to fetch subscriptions" };
  }
  if (!subs || subs.length === 0) {
    return { statusCode: 200, body: "No subscriptions" };
  }

  for (const task of targets) {
    const isToday = task.due_date === todayStr;
    const kindLabel = task.kind === "event" ? "予定" : "タスク";
    const title = isToday ? `本日期限の${kindLabel}` : `明日期限の${kindLabel}`;
    const payload = JSON.stringify({ title, body: task.text, url: `/tasks/view?id=${task.id}` });

    for (const sub of subs) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };
      try {
        await webpush.sendNotification(pushSubscription, payload);
      } catch (err) {
        // 端末側で通知が無効化されている等（410 Gone）は、購読情報を消しておく
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        } else {
          console.error("通知の送信に失敗しました", err);
        }
      }
    }

    await supabase.from("tasks").update({ reminded_at: new Date().toISOString() }).eq("id", task.id);
  }

  return { statusCode: 200, body: `Sent reminders for ${targets.length} task(s)` };
};
