# 🐺 Greyhounds Club — Setup

## Před spuštěním: Nastav Google Sheets jako veřejný

1. Otevři svůj Google Sheets soubor
2. Klikni na **Sdílet** (vpravo nahoře)
3. Klikni na **Změnit na kohokoli s odkazem**
4. Nastav na **Prohlížitel**
5. Potvrď

Bez tohoto kroku appka nebude moci číst data!

## Jak nahrát na GitHub

1. Jdi na github.com → New repository → název: `greyhounds-club` → Public → Create
2. Klikni **uploading an existing file**
3. Nahraj VŠECHNY soubory z tohoto zipu (zachovej strukturu složek)
4. Klikni **Commit changes**

## Jak spustit na Netlify

1. Jdi na netlify.com → Log in with GitHub
2. **Add new site** → **Import an existing project** → GitHub
3. Vyber repozitář `greyhounds-club`
4. Build command: (nechej prázdné)
5. Publish directory: (nechej prázdné nebo `/`)
6. **Deploy site**

Za 2 minuty máš živou appku na URL jako `greyhounds-club.netlify.app`

## Vlastní doména (volitelné)

V Netlify → Domain settings → Add custom domain → `club.greyhoundsatelier.cz`
