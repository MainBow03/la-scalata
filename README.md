# 👑 LA SCALATA
Party game a eliminazione per 4–12 concorrenti, con minigiochi, NPC, grafica scenografica, modalità locale e stanze multiplayer Firebase.

## Avvio
L'entrata è **index.html**: usa un server statico oppure GitHub Pages. Il progetto è un sito statico composto da `index.html`, dal motore aggiuntivo `arcade-v3.js` e dal tema `arena-v3.css` e richiede una connessione Internet per il multiplayer e i ritratti esterni.

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
