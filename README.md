# PPC Calculator

One-page calculator for document extraction cost by LLM model.

## Structure

```
models/
  sonnet-4-5/config.json              # Sonnet 4.5 pricing
  haiku-4-5/config.json               # Haiku 4.5 pricing (used by hybrid)
  sonnet-4-5-haiku-4-5/config.json    # hybrid option config
data/client.json                      # client document inputs
index.html                            # page with model selector + cost table
```

Available model options: **Sonnet 4.5** and **Sonnet 4.5 + Haiku 4.5**.

## Local preview

ES modules require a local server:

```bash
python3 -m http.server 8080
```

Open http://localhost:8080

## GitHub Pages

1. Push to `main`
2. In the repo: **Settings → Pages**
3. Source: **Deploy from a branch**
4. Branch: `main`, folder: `/ (root)`
5. Save

The site will be available at `https://<username>.github.io/ppccalculator/`.

## Adding a model

1. Create `models/<model-id>/config.json`
2. Add the model id to `MODEL_IDS` in `js/calculator.js`
