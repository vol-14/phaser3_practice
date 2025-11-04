# チーム開発環境構築手順

## 前提条件

チームメンバーの各PCに以下がインストールされていること:

- **Git** - バージョン管理
- **Docker Desktop** - コンテナ実行環境
- **Visual Studio Code** - 推奨エディタ
  
### 1. リポジトリをクローンする

```bash
# HTTPSでクローン（推奨）
git clone https://github.com/ユーザー名/phaser3_practice.git

# または SSHでクローン（SSH鍵設定済みの場合）
git clone git@github.com:ユーザー名/phaser3_practice.git

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
1. パッケージを追加・削除した時

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

### ポート3000が使用中

```bash
# 使用中のプロセスを確認
lsof -i :3000

# または、docker-compose.ymlのポートを変更
ports:
  - "3001:3000"
```
