# Life Design（Next.js + Supabase 版）

## これは何か
これまでの静的サイト（localStorageだけで動くバージョン）を、Next.js + Supabaseに置き換えたものです。
データはすべてSupabase（クラウドのデータベース）に保存されるので、スマホとPCなど複数端末から同じデータが見られます。
添付ファイルもSupabase Storageに保存されるので、400KBの制限もありません。

## 事前準備：Supabaseにテーブルを作る

1. `supabase-schema.sql` の中身をすべてコピー
2. Supabaseのプロジェクト画面 → 左メニュー「SQL Editor」→ 新しいクエリに貼り付けて実行
3. 「Table Editor」に `tasks` と `room_items` の2つのテーブルができていればOK
4. 「Storage」に `attachments` というバケットができていればOK

すでに.env.localにこのプロジェクトのURL・anon keyを設定済みなので、上のSQLを実行するだけで動き始めます。

## ローカルで試す

```bash
npm install
npm run dev
```

http://localhost:3000 を開いて確認してください。

## Netlifyにデプロイする

1. このフォルダをGitHubリポジトリにpush（Netlifyはリポジトリ連携が基本です）
2. Netlifyで「Add new site」→「Import an existing project」→ そのリポジトリを選択
3. Build settings は `netlify.toml` に書いてあるので自動で拾われます（Build command: `npm run build` / Publish directory: `out`）
4. 「Environment variables」に以下の2つを追加：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   （値は `.env.local` と同じものを入力）
5. Deployを実行

## できること・まだ移していないこと

**移行済み**
- タスク管理（追加・編集・完了・ピン留め・期限日時・関連項目・全タスク検索と優先度グループ）
- 部屋ごとの項目リスト（題名・備考・リンク・添付ファイル）
- クイックメモ（独立した項目リスト）
- Today's Actionのピン留め・優先タスクプレビュー
- 国ごとのタスクまとめ

**今回まだ移していない機能**（元の静的サイトにはあったもの）
- データのバックアップ書き出し・読み込み（Supabase自体がバックアップになるので優先度は下げています）
- ブラウザの「戻る」への細かい対応（Next.jsの標準ルーティングである程度自然に効きますが、静的サイト版ほど作り込んではいません）

必要であれば、次のステップとしてこの2つも移植できます。

## Googleカレンダー連携を使う

### 事前準備（あなたがすでに済ませていること）
- Google Cloud ConsoleでCalendar APIを有効化し、OAuthクライアントIDを発行ずみ
- Supabaseの Authentication > Providers で Google を有効化し、Client ID / Secretを設定ずみ

### データベースに1行追加
`supabase-schema-calendar.sql` の中身をSupabaseのSQL Editorで実行してください（タスクにGoogleの予定IDを覚えておくための列を1つ追加します）。

### Netlifyの環境変数を追加
トークン更新用のNetlify Function（`netlify/functions/refresh-google-token.js`）が、以下の2つを必要とします。**これらはClient Secretを含むので、コードには書かず、Netlifyの管理画面の環境変数として設定してください。**

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

（Supabase側に設定したのと同じ値です）

### 使い方
1. ヘッダーの「Googleカレンダー連携」ボタンを押す
2. Googleの同意画面が出るので許可する
3. 以降、期限を入れたタスクを追加・編集すると、自動でGoogleカレンダーに予定が作成・更新されます。期限を消すと予定も削除されます
4. ホーム画面の一番下に「直近の予定」カードが表示され、Googleカレンダー側の予定も見られます

### 制限・注意点
- Googleのアクセストークンは約1時間で切れますが、Netlify Functionで自動更新するので普段は意識しなくて大丈夫です
- カレンダー連携の状態（トークン）はこのブラウザだけに保存されます。別の端末で使う場合は、その端末でも「Googleカレンダー連携」を押してログインしてください
- 同期するのは「期限（日付）が入っているタスク」だけです。時刻まで入っていれば30分の予定、日付だけなら終日予定になります
