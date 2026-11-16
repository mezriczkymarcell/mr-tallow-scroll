# Mr Tallow

Mobilra igazított, gomb nélküli termékbemutató.

## Kipróbálás
Nyisd meg az index.html fájlt, majd görgess.
A forgás után következik a teljes címkegrafika:
- a fénycsík magától mozog, érintésre az ujjadat követi;
- két ujjal 1–5× között nagyíthatsz;
- nagyításban egy ujjal mozgathatod a képet;
- dupla koppintással nagyíthatsz vagy visszaállíthatod;
- egérrel a fény követi a mutatót; Ctrl + görgő nagyít;
- billentyűzettel + / − és Escape használható.

A telefon döntése csak akkor vezérli a fényt, ha a böngésző külön engedélykérés nélkül már ad tájolásadatokat. Az oldal nem nyit engedélykérő ablakot; az automatikus és érintéses fény ettől függetlenül működik.

## GitHub + Vercel
A csomag tartalmát közvetlenül a GitHub-repó gyökerébe másold.
Az index.html legyen a repó gyökerében, ne egy újabb almappában.
Importáld a repót Vercelbe. A mellékelt vercel.json beállítja:
- Framework Preset: Other
- Build Command: üres, nincs buildlépés
- Output Directory: .

Nincs telepítendő csomag vagy külön kiszolgáló.
A Vercel HTTPS-címe telefonon is megnyitható.

## Tartalom
index.html — oldal
site.css — reszponzív megjelenés
site.js — görgetés, automatikus fény, érintéses nézegető
assets/logo.svg — a kapott vektoros logó
assets/label.jpg — 4096 px széles címkegrafika
assets/label-foil-mask.png — az aranyelemek átlátszó fényrétegmaszkja
frames/ — az elkészült, 150 képkockás Blender-animáció AVIF és JPEG változata

A képsorozat 1080 × 1080 px; a mozgás 5 másodperc / 30 fps.
A nagy Blender-fájlokat és videót ez a webes csomag nem tartalmazza.

Dokumentáció:
https://vercel.com/docs/builds/configure-a-build
https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static
