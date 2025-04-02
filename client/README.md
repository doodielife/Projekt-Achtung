# Achtung Client

## Jak uruchomić projekt?

Poniżej znajdziesz pełną instrukcję krok po kroku, jak uruchomić grę na swoim komputerze – nawet jeśli nigdy wcześniej nie używałeś Node.js, npm ani Phasera z Vite.

### Wymagania wstępne
1. **Node.js i npm**  
   - Pobierz i zainstaluj Node.js z oficjalnej strony: [nodejs.org](https://nodejs.org/).  
   - Wraz z Node.js automatycznie zainstaluje się npm (menadżer pakietów).  
   - Aby sprawdzić, czy wszystko działa, otwórz terminal (np. Wiersz Poleceń na Windowsie lub Terminal na macOS/Linux) i wpisz:
     ```
     node -v
     npm -v
     ```
     Jeśli widzisz numery wersji (np. `v20.11.0` dla Node.js), to działa!

2. **Przeglądarka internetowa**  
   - Dowolna nowoczesna przeglądarka (Chrome, Firefox, Edge itp.) wystarczy do uruchomienia gry.

### Instrukcja uruchomienia
1. **Pobierz projekt**  
   - Sklonuj repozytorium z GitHuba a
     następnie przejdź do folderu projektu
    

2. **Zainstaluj zależności**  
   - W terminalu, w folderze projektu, wpisz:
     ```
     npm install
     ```
     To pobierze wszystkie potrzebne biblioteki (w tym Phaser i Vite).

3. **Uruchom projekt**  
   - Po instalacji wpisz:
     ```
     npm run dev
     ```
     - Vite uruchomi lokalny serwer deweloperski. W terminalu zobaczysz coś w stylu:
       ```
       VITE v5.x.x  ready in 300 ms
       ➜  Local:   http://localhost:5173/
       ```
     - Otwórz przeglądarkę i wpisz adres `http://localhost:5173/` (lub inny port, jeśli `5173` jest zajęty – sprawdź terminal).



## Rozwijanie projektu
1. **Dodawanie nowych funkcji**  
   - Edytuj pliki w folderze `src/`. Na przykład, nowe sceny gry znajdują się w `src/scenes/`.
   - Po zapisaniu zmian Vite automatycznie odświeży grę w przeglądarce.

2. **Budowanie wersji produkcyjnej**  
   - Wpisz:
     ```
     npm run build
     ```
     - Gotowe pliki pojawią się w folderze `dist/`. Możesz je wrzucić na serwer WWW.

## Rozwiązywanie problemów
- **Błąd: "npm command not found"**  
  - Upewnij się, że Node.js jest zainstalowany i dodany do PATH. Zrestartuj terminal lub komputer.
- **Gra się nie ładuje**  
  - Sprawdź, czy port (np. `5173`) nie jest zajęty. W terminalu wpisz `npm run dev` jeszcze raz i zobacz, czy adres się zmienił.

