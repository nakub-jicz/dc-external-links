# 📚 Instrukcja Obsługi - DC External Links

## 🎯 Opis Aplikacji

**DC External Links** to aplikacja Shopify umożliwiająca dodawanie zewnętrznych linków afiliacyjnych do produktów. Aplikacja pozwala zastąpić standardowy przycisk "Dodaj do koszyka" przyciskami przekierowującymi na inne strony (np. Amazon, eBay, itp.), co umożliwia zarabianie na partnerstwie afiliacyjnym.

---

## ⚡ Szybki Start

### 1. Instalacja i Uruchomienie

#### Wymagania:
- Node.js (v18 lub nowszy)
- npm lub yarn
- Shopify CLI
- Konto partnera Shopify

#### Kroki instalacji:
```bash
# 1. Sklonuj repozytorium
git clone [url-repozytorium]
cd dc-external-links

# 2. Zainstaluj zależności
npm install

# 3. Uruchom serwer deweloperski
npm run dev
```

### 2. Konfiguracja w Shopify

1. **Zainstaluj aplikację** w swoim sklepie deweloperskim
2. **Przejdź do aplikacji** w Shopify Admin → Apps
3. **Rozpocznij konfigurację** produktów

---

## 🛠️ Szczegółowa Instrukcja Konfiguracji

### Krok 1: Konfiguracja Produktów

1. **Otwórz aplikację** "DC External Links" w Shopify Admin
2. **Kliknij "Skonfiguruj produkty"** na stronie głównej
3. **Wybierz produkt** klikając przycisk "Wybierz Produkt"
4. **Uzupełnij formularz**:
   - **URL docelowy**: Pełny link afiliacyjny (np. `https://amazon.com/dp/B123456789?tag=twoj-tag`)
   - **Tekst przycisku**: Tekst wyświetlany na przycisku (np. "Kup na Amazon")
   - **Włącz funkcję**: Zaznacz checkbox aby aktywować przycisk
   - **Ukryj ATC** (opcjonalne): Ukrywa standardowy przycisk "Dodaj do koszyka"
5. **Zapisz ustawienia**

### Krok 2: Przycisk Pojawia Się Automatycznie

🎉 **Przycisk dodaje się automatycznie!** Nie musisz nic robić w edytorze motywu.

Po skonfigurowaniu produktu w kroku 1, zewnętrzny przycisk automatycznie pojawi się na stronie produktu.

**Opcjonalne dostosowanie:**
- Jeśli chcesz zmienić wygląd lub pozycję przycisku, możesz użyć edytora motywu
- Znajdź blok "External Button" i dostosuj jego ustawienia
- Ale **to nie jest wymagane** - przycisk działa od razu po konfiguracji

### Krok 3: Testowanie

1. **Sprawdź stronę produktu** w sklepie
2. **Przetestuj przycisk**:
   - Czy wyświetla się prawidłowo?
   - Czy przekierowanie działa?
   - Czy ukrywanie ATC funkcjonuje?
3. **Sprawdź śledzenie** w konsoli przeglądarki
4. **Opublikuj motyw** gdy wszystko działa

---

## 🎨 Dostosowywanie Wyglądu

### Ustawienia Bloku w Edytorze Motywu

#### Wygląd przycisku:
- **Klasa CSS**: Ustaw klasę zgodną z motywem (np. `btn btn-primary`)
- **Kolor tła**: Nadpisuje domyślny kolor motywu
- **Kolor tekstu**: Zmienia kolor tekstu przycisku
- **Szerokość**: CSS width (100%, 200px, auto)
- **Padding**: Odstępy wewnętrzne (12px 24px)
- **Margines**: Odstępy zewnętrzne (10px 0)
- **Zaokrąglenie**: Border-radius (4px, 50%)

#### Dodatkowe opcje:
- **Ikonka zewnętrznego linku**: Pokazuje ikonę obok tekstu
- **Informacja o afiliacji**: Wyświetla komunikat pod przyciskiem
- **Niestandardowy selektor ATC**: Dla zaawansowanych użytkowników

### Przykładowe Klasy CSS dla Popularnych Motywów:

```css
/* Dawn, Refresh */
.btn.btn-primary

/* Debut, Brooklyn */
.btn.product-form__cart-submit

/* Venture */
.btn.btn--full.product-form__cart-submit

/* Supply */
.btn.product-form__add-button

/* Niestandardowe */
.custom-affiliate-button
```

---

## 📊 Śledzenie i Analityka

### Automatyczne Śledzenie

Aplikacja automatycznie śledzi kliki w zewnętrzne linki:

#### Google Analytics 4:
```javascript
gtag('event', 'external_link_click', {
  'external_url': 'https://amazon.com/...',
  'button_text': 'Kup na Amazon',
  'product_id': 'gid://shopify/Product/123'
});
```

#### Google Analytics Universal:
```javascript
ga('send', 'event', 'External Links', 'Click', 'https://amazon.com/...');
```

#### Custom Event:
```javascript
document.addEventListener('clearifyExternalLinkClick', function(event) {
  console.log('Kliknięto link:', event.detail);
});
```

### Monitoring w Konsoli

Otwórz konsolę przeglądarki (F12) aby zobaczyć:
- Logi śledzenia kliknięć
- Informacje o ukrywaniu przycisków ATC
- Błędy konfiguracji

---

## 🔧 Rozwiązywanie Problemów

### Problem: Przycisk się nie wyświetla

**Możliwe przyczyny:**
1. **Produkt nie jest skonfigurowany**
   - Sprawdź w aplikacji czy produkt ma ustawione: URL, tekst i włączoną funkcję
2. **Link nie jest włączony**
   - Sprawdź czy checkbox "Enable this button" jest zaznaczony
3. **Błąd w konfiguracji**
   - Sprawdź czy URL jest prawidłowy (zaczyna się od http:// lub https://)

**Rozwiązanie:**
1. Przejdź do Product Configuration w aplikacji
2. Sprawdź czy produkt ma skonfigurowany przynajmniej jeden włączony link
3. Sprawdź Configuration preview - powinien pokazywać aktywne przyciski
4. Opcjonalnie: użyj edytora motywu do dostosowania wyglądu

### Problem: Ukrywanie ATC nie działa

**Możliwe przyczyny:**
1. **Motyw używa niestandardowych selektorów**
2. **JavaScript jest zablokowany**
3. **Konflikty z innymi skryptami**

**Rozwiązanie:**
1. **Znajdź prawidłowy selektor ATC:**
   ```javascript
   // W konsoli przeglądarki
   document.querySelector('button[name="add"]') // Przykład
   ```
2. **Ustaw niestandardowy selektor** w ustawieniach bloku
3. **Przetestuj debugowanie:**
   ```javascript
   // W konsoli
   ClearifyDebug.hideATC() // Ręczne ukrycie
   ClearifyDebug.restoreATC() // Przywrócenie
   ```

### Problem: Błędy JavaScript

**Sprawdź w konsoli przeglądarki:**
1. Czy są błędy ładowania skryptu?
2. Czy CustomButtonScript jest zdefiniowany?
3. Czy są konflikty z innymi bibliotekami?

**Debugowanie:**
```javascript
// Sprawdź dostępność
typeof CustomButtonScript // powinno zwrócić "object"

// Sprawdź konfigurację
CustomButtonScript.config

// Włącz/wyłącz logowanie
CustomButtonScript.config.enableLogging = true;
```

### Problem: Śledzenie nie działa

**Sprawdź:**
1. Czy Google Analytics jest zainstalowane?
2. Czy w konsoli pojawiają się logi śledzenia?
3. Czy custom eventy są wysyłane?

**Test śledzenia:**
```javascript
// Nasłuchuj custom eventów
document.addEventListener('clearifyExternalLinkClick', function(e) {
  console.log('Custom event:', e.detail);
});
```

---

## ⚙️ Zaawansowana Konfiguracja

### Niestandardowe Selektory ATC

Jeśli automatyczne ukrywanie nie działa, znajdź prawidłowy selektor:

1. **Otwórz Developer Tools** (F12)
2. **Znajdź przycisk ATC** w HTML
3. **Skopiuj selektor** (prawy klik → Copy → Copy selector)
4. **Dodaj w ustawieniach bloku**

**Przykłady selektorów:**
```css
/* Standardowe */
#AddToCart-product-template
.product-form__buttons button[type="submit"]
[data-product-form] .btn[data-add-to-cart]

/* Dawn */
.product-form__buttons product-form button

/* Debut */
.product-form__buttons .btn.product-form__cart-submit

/* Venture */
.product-form__buttons .btn--full
```

### API dla Deweloperów

#### Metody Globalne:
```javascript
// Główny obiekt
CustomButtonScript.handleExternalClick(buttonElement)
CustomButtonScript.initHideATC(options)
CustomButtonScript.trackClick(url, text, element)

// Debug
ClearifyDebug.hideATC()
ClearifyDebug.restoreATC()
ClearifyDebug.config
```

#### Custom Events:
```javascript
// Nasłuchiwanie kliknięć
document.addEventListener('clearifyExternalLinkClick', function(event) {
  const data = event.detail;
  // data.url, data.buttonText, data.productId, data.timestamp
});
```

### Integracja z Zewnętrznymi Systemami

#### Webhook do własnego systemu:
```javascript
// Dodaj do custom_button.js
CustomButtonScript.trackClick = function(url, buttonText, buttonElement) {
  // Własna logika śledzenia
  fetch('/api/track-affiliate-click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: url,
      buttonText: buttonText,
      productId: this.getProductId(buttonElement),
      timestamp: new Date().toISOString()
    })
  });
};
```

---

## 📋 Checklist Wdrożenia

### Przed Publikacją:

- [ ] **Aplikacja zainstalowana** i skonfigurowana
- [ ] **Produkty skonfigurowane** z prawidłowymi linkami
- [ ] **Blok dodany** do motywu na stronach produktów
- [ ] **Wygląd dopasowany** do stylu sklepu
- [ ] **Przekierowania przetestowane** na różnych urządzeniach
- [ ] **Ukrywanie ATC działa** (jeśli włączone)
- [ ] **Śledzenie skonfigurowane** i testowane
- [ ] **Responsywność sprawdzona** (mobile, tablet, desktop)

### Po Publikacji:

- [ ] **Monitoring analytics** - sprawdzanie kliknięć
- [ ] **Testowanie użytkownika** - zbieranie feedbacku
- [ ] **Performance monitoring** - wpływ na szybkość strony
- [ ] **A/B testing** - porównanie konwersji

---

## 🆘 Wsparcie Techniczne

### Częste Problemy i Rozwiązania:

| Problem | Rozwiązanie |
|---------|-------------|
| Przycisk nie wyświetla się | Sprawdź konfigurację produktu i bloku |
| ATC nie jest ukrywany | Ustaw niestandardowy selektor CSS |
| Błędy JavaScript | Sprawdź konflikty z innymi skryptami |
| Śledzenie nie działa | Zweryfikuj instalację analytics |
| Problemy z motywem | Dostosuj selektory CSS do motywu |

### Debug Commands:

```javascript
// Sprawdź status
ClearifyDebug.config

// Przywróć ukryte przyciski
ClearifyDebug.restoreATC()

// Ukryj ponownie
ClearifyDebug.hideATC()

// Włącz logowanie
CustomButtonScript.config.enableLogging = true
```

### Kontakt:

- **Issues**: Zgłoś problem w repozytorium GitHub
- **Email**: [twój-email@domena.com]
- **Dokumentacja**: [link-do-dokumentacji]

---

## 📝 Changelog

### v1.0.0 (Aktualna)
- ✅ Podstawowa funkcjonalność zewnętrznych linków
- ✅ Automatyczne ukrywanie przycisków ATC
- ✅ Śledzenie kliknięć (GA, custom events)
- ✅ Responsywny design
- ✅ Debug tools
- ✅ Polskie tłumaczenie
- ✅ Instrukcje krok po kroku w aplikacji

### Planowane funkcje:
- 🔄 Bulk configuration dla wielu produktów
- 🔄 Scheduling (czasowe włączanie/wyłączanie)
- 🔄 Advanced analytics dashboard
- 🔄 Integration z popularnymi affiliate networks

---

*Dokument ostatnio aktualizowany: {{ "now" | date: "%d.%m.%Y" }}* 