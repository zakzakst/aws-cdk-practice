## あとで使いそうなことメモ

### 5.8.3
- dev環境にリソースをデプロイする場合には、AWS_PROFILEに加え、STAGEも環境変数として与えます
    - `AWS_PROFILE=dev_admin STAGE=dev cdk deploy dev-*`