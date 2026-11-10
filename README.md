# 👑 LA SCALATA
Party game a eliminazione per 4–12 concorrenti, con minigiochi, NPC, grafica scenografica, modalità locale e stanze multiplayer Firebase.

## Avvio
L'entrata è **index.html**: usa un server statico oppure GitHub Pages. Il progetto è un sito statico composto da `index.html`, dai motori `arcade-v3.js`, `arcade-v4.js` e dai temi `arena-v3.css`, `arena-v4.css` e richiede una connessione Internet per il multiplayer e i ritratti esterni.


## Versione 0.5 — Arcade Lab e Catalogo Minigiochi

La home contiene il nuovo pulsante **📚 Catalogo Minigiochi**: apre una schermata con tutte le prove attive, istruzioni, descrizioni, categorie, filtro per tipologia e ricerca per nome. Un archivio separato elenca le prove classiche che restano nel codice per compatibilità con le vecchie stanze ma **non vengono estratte nelle nuove partite**.

### Sette nuovi minigiochi (meccaniche effettivamente differenti)
1. **Binari del Caos:** ruota gli scambi ferroviari e costruisci un percorso realmente connesso; quattro mappe.
2. **Labirinto Cangiante:** esplora un labirinto generato proceduralmente, raccogli tre chiavi e trova il portale; due mappe.
3. **Assedio al Castello:** difendi tre corsie con un cannone, nemici avanzanti, tempi di ricarica e vite del portone.
4. **Mosaico Smarrito:** tre puzzle scorrevoli 3×3, generati con mosse legali e quindi sempre risolvibili.
5. **Ascensore Impazzito:** gestisci sei piani, la capienza massima e le destinazioni dei passeggeri.
6. **Fuga sui Tetti:** runner in cui saltare e scivolare superando ostacoli in movimento.
7. **Flipper del Firmamento:** paddle controllabile via mouse, touch o tastiera, pallina fisica, mattoncini e vite.

### Rotazione delle nuove partite
**16 minigiochi attivi** (7 nuovi e 9 selezionati dalla precedente versione per diversità). Ogni blocco di 12 round normali comprende tutte e sette le novità, più cinque prove diverse estratte fra quelle mantenute; non ripete lo stesso minigioco nel blocco. I vecchi minigiochi non più selezionati sono elencati come **archivio** nel catalogo. Gli spareggi continuano a usare una prova dedicata.

I punteggi di piazzamento **non cambiano**: con otto concorrenti restano **14, 11, 9, 7, 5, 4, 3, 1**. I nuovi minigiochi producono una prestazione da 0 a 100, che stabilisce la graduatoria per assegnare quei punti.

## Versione 0.4 — Giardino e punteggi dei minigiochi
- **Giardino delle Illusioni**: 12 aiuole con fiori vettoriali colorati. La griglia passa da 3×3 a 4×3 e infine 4×4; il colore estraneo diventa gradualmente meno evidente.
- Ogni risposta corretta vale **da 2 a 10 punti**, in base al tempo trascorso nella singola aiuola (5,2 secondi massimi). Un errore o una mancata risposta vale 0 punti.
- Il risultato finale del minigioco (0–100) serve per ordinare le prestazioni; **non viene più aggiunto direttamente alla classifica di fase**.
- I premi per 8 giocatori, dal primo all'ultimo: **14, 11, 9, 7, 5, 4, 3, 1**. Con altri numeri di giocatori da 4 a 12 la tabella scala mantenendo primo 14 e ultimo 1. A pari prestazione vengono assegnati gli stessi punti della posizione condivisa; può scattare lo spareggio al momento dell'eliminazione.
- Nuova schermata risultati con **podio dei primi tre**, classifica completa, barra delle prestazioni, premio ottenuto e punteggio cumulato nella fase.
- Le eliminazioni continuano a verificarsi ogni N minigiochi come stabilito dall'host; il concorrente con meno punti della fase viene eliminato.

## Attivazione multiplayer — OBBLIGATORIA
La web config del progetto Firebase **la-scalata-1c162** è già inserita nel sito, ma non basta da sola:
1. Apri [Firebase Console](https://console.firebase.google.com/).
2. Nel progetto `la-scalata-1c162`, vai su **Authentication → Sign-in method** e abilita **Anonymous**.
3. Crea il **Cloud Firestore database**.
4. In **Firestore → Rules**, copia il contenuto di **firestore.rules** e premi **Publish**.
5. In GitHub vai su **Settings → Pages → Build and deployment → Source: GitHub Actions**. Il workflow `.github/workflows/pages.yml` prova automaticamente a pubblicare il sito a ogni push. L'indirizzo sarà `https://mainbow03.github.io/la-scalata/` quando GitHub Pages risulta attivo.
6. Apri il sito da due dispositivi, crea una stanza da uno e inserisci il codice nell'altro. Se aggiorni la pagina, usa **Rientra nella stanza**, sullo stesso browser.

## Arcade Reborn 0.3: 16 prove rinnovate

**Le nuove partite pescano soltanto da queste 16 prove** (le 13 vecchie rimangono nel codice come compatibilità per le stanze già avviate).

| Tipologia | Minigiochi |
|---|---|
| Destrezza e precisione | Orologeria Reale, Costruttori del Trono, Tempesta Stellare, Guardiani del Portale, Il Cuore del Trono |
| Logica e osservazione | Corriere delle Stelle, Laboratorio Alchemico, Bilancia del Gigante, Maschere Intruse, Ordini del Sovrano, Segnali Contraddittori, Giardino delle Illusioni |
| Strategia | Mercato dei Miracoli, Tesoro degli Abissi |
| Memoria e investigazione | Sala degli Echi, Codice del Sovrano |

La maggior parte delle prove dura **circa 40–75 secondi** a seconda del ritmo del giocatore. I limiti massimi vanno da 77 a 91 secondi. Ci sono istruzioni introduttive, progressione a manche, indicazioni visive degli errori, feedback e punteggio normalizzato da 0 a 100.

Il punteggio dei bot viene simulato in modo deterministico per stanza/round e varia in base a difficoltà e specializzazione. Gli NPC non controllano un browser indipendente e non hanno ancora un'IA visiva che osserva davvero lo schermo. L'host resta responsabile dell'avanzamento online.

### File coinvolti
- `index.html`: lobby, classifiche, progressione, Firebase e codice storico
- `arcade-v3.js`: 16 nuovi minigiochi, NPC, HUD e selezione delle prove
- `arena-v3.css`: interfaccia aggiornata per computer, tablet e telefoni
- `firestore.rules`: regole di accesso al backend

## Limiti tecnici
- L'host deve restare online per avanzare il gioco. Non c'è ancora migrazione automatica dell'host.
- I risultati vengono verificati come formato, ma sono generati dal client. Non è anticheat e non va usato per premi o classifiche pubbliche affidabili.
- I ritratti del roster provengono dalle miniature delle schede Wikipedia quando disponibili; il PNG OpenMoji e l'emoji sono fallback. Non sono garantiti PNG ufficiali né sempre l'immagine esatta del personaggio. L'arte ufficiale non è redistribuita nel repository.
- Firestore comporta costi/quote secondo il piano Firebase; le stanze non hanno ancora una procedura di cancellazione automatica.
- Nessun servizio server affidabile di matchmaking o permanenza dei profili nella prima versione.

## Crediti
Le icone OpenMoji (fallback) sono pubblicate con licenza CC BY-SA 4.0 da [OpenMoji](https://openmoji.org/). I personaggi nominati appartengono ai rispettivi titolari. Fan game non ufficiale.

## Test eseguiti
Sintassi del JavaScript verificata tramite compilazione; 16/16 schermate dei nuovi minigiochi avviate in Chromium senza errori JavaScript; controlli di base eseguiti su pulsanti e interazioni. Sono test locali e non sostituiscono collaudi multiplayer dal vivo. La sincronizzazione Firestore reale richiede la pubblicazione delle regole da console e un test da due browser/dispositivi.
