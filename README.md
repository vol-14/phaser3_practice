# チーム開発環境構築手順

## 技術スタック

### フロントエンド
- **Phaser 3** (v3.90.0) - ゲームフレームワーク
- **TypeScript** (v5.9.3) - 型安全な開発
- **Vite** (v6.4.1) - 高速ビルドツール

### インフラ
- **Docker** - コンテナ化
- **Node.js** (v18-alpine) - JavaScript実行環境

## 前提条件

チームメンバーの各PCに以下がインストールされていること:

- **Git** - バージョン管理
- **Docker Desktop** - コンテナ実行環境
- **Visual Studio Code** - 推奨エディタ
  
### 1. リポジトリをクローンする

```bash
# HTTPSでクローン（推奨）
git clone https://github.com/kopo-k/phaser3_practice.git

# クローンしたディレクトリに移動
cd phaser3_practice
```

### 2. Docker環境を起動する

**注意: Docker Desktopを起動してから以下のコマンドを実行**

```bash
# Dockerイメージをビルドしてコンテナを起動
docker-compose up

# または、バックグラウンドで起動
docker-compose up -d
```

**これだけで開発環境が完成！**
<img width="1470" height="956" alt="スクリーンショット 2025-11-04 19 32 23" src="https://github.com/user-attachments/assets/ff63352c-4b51-4281-9456-53e4778e6099" />


- ブラウザで `http://localhost:4000` にアクセス
- コードを編集すると自動でリロードされる

## Docker関連のチーム作業

### 誰かがpackage.jsonを更新した時

```bash
# 最新のコードを取得
git pull origin <現在のローカルのブランチ名>

# Dockerイメージを再ビルド
docker-compose down
docker-compose up --build
```

### コンテナの状態確認

```bash
# 実行中のコンテナを確認
docker-compose ps

# ログを確認
docker-compose logs

# リアルタイムでログを表示
docker-compose logs -f
```

### コンテナ内でコマンド実行

```bash
# コンテナ内に入る
docker-compose exec phaser-dev sh

# コンテナ内でnpmコマンドを実行
docker-compose exec phaser-dev npm install 新しいパッケージ
```

## トラブルシューティング

### IDE側でのTypeScriptの補完エラー
上記のコマンドのみの場合、ローカルにnode_moduleの中身が空っぽなので、TypeScriptの型チェックがIDEで動作しません
<img width="1470" height="956" alt="スクリーンショット 2025-11-04 19 23 39" src="https://github.com/user-attachments/assets/0e8919da-4c4a-4c13-9e2e-46e7974b026a" />
気になる場合はIDEのターミナルで
```bash
npm install
```
と打てばnode_moduleの中身が作成されるので、TypeScriptの型チェックが正常に動作します。
<img width="1470" height="956" alt="スクリーンショット 2025-11-04 19 29 07" src="https://github.com/user-attachments/assets/26652b53-3942-468c-95ba-5da8876ed1c0" />


# コンテナを停止
```
docker-compose down
```
# イメージを再ビルド（package.jsonの変更を反映）
```
docker-compose up --build
```
### Dockerが起動しない

```bash
# 全てのコンテナを停止
docker-compose down

# キャッシュを削除して再ビルド
docker-compose build --no-cache
docker-compose up
```

### ポート4000が使用中

**Mac/Linux:**
```bash
# 使用中のプロセスを確認
lsof -i :4000
```

**Windows:**
```powershell
# 使用中のプロセスを確認
netstat -ano | findstr :4000
```

**共通の解決方法:**
```yaml
# docker-compose.ymlのポートを変更
ports:
  - "3001:4000"  # 左側を別のポートに変更
```
