# Vercelへの公開

現在のアプリはReact + Viteの静的サイトです。StreamlitやPythonサーバーは使いません。

## ローカル確認

```sh
npm ci
npm run build
npm run preview
```

現在の実装では外部APIを呼び出していないため、GEMINI_API_KEYやAPP_URLの設定は不要です。

## GitHubから公開

1. このディレクトリのコードとvercel.jsonをGitHubのmainへpushします。
2. VercelでAdd New → Projectを開き、M-Ishiyama/fishshiftをImportします。
3. Framework PresetはVite、Root Directoryはリポジトリ直下にします。
4. Install Commandはnpm ci、Build Commandはnpm run build、Output Directoryはdistです。vercel.jsonにも設定しています。
5. Deployを実行します。本番ブランチはmainにします。
6. Settings → Deployment Protectionを確認し、本番サイトにVercel Authenticationやパスワード保護が適用されていないことを確認します。
7. 本番ドメインをシークレットウィンドウで開き、ログインなしで画面表示・タブ切替・デモ操作ができることを確認します。

以後、mainへpushするとGit連携によって自動公開されます。

## CLIから公開

```sh
npx vercel login
npx vercel --prod
```

CLIでの公開だけではGitHubとの自動デプロイ連携を確認したことにはなりません。必要に応じてVercelのSettings → Gitで接続してください。

共有するのは本番ドメインです。プレビューURLは認証で保護されている場合があります。
