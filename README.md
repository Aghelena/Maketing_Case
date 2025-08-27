# Marketing Performance Case — Email Login + Porta 5001

- **API em Python (Flask)** (porta padrão **5001**)
- **Frontend em React (Vite)** com proxy para `http://127.0.0.1:5001`
- Login por **email** (colunas do `data/users.xlsx`: `email`, `password`, `role`)
- Tabela com **filtro por data**, **ordenação por qualquer coluna** e **`cost_micros` visível só para admin**

## 1) Backend (Flask)
```bash
cd marketing_case_email
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Porta padrão 5001
python3 api.py
# http://127.0.0.1:5001
```

> Se seu `users.xlsx` tiver somente `user`/`username`, a API deriva `email` automaticamente como `{user}@example.com`.

## 2) Frontend (React + Vite)

### Dev (proxy para /api -> 5001)
```bash
cd frontend
npm install
npm run dev
# http://127.0.0.1:5173
```

### Build e servir pelo Flask
```bash
cd frontend
npm install
npm run build   # saída em ../static
cd ..
python3 api.py  # http://127.0.0.1:5001
```

## 3) Endpoints
- `POST /api/login` — body: `{ "email": "...", "password": "..." }`
- `GET /api/metrics?start=YYYY-MM-DD&end=YYYY-MM-DD&sort=col&order=asc|desc` (JWT via `Authorization: Bearer <token>`)

## 4) Observações
- `SECRET_KEY` padrão é didática — troque em produção.
- `openpyxl` incluído para ler `.xlsx`.
- `Flask-Cors` habilitado para `/api/*` (dev).
