# 👑 LA SCALATA
Party game a eliminazione per 4–12 concorrenti, con minigiochi, NPC, grafica scenografica, modalità locale e stanze multiplayer Firebase.

## Avvio
L'entrata è **index.html**: usa un server statico oppure GitHub Pages. Il gioco è in un singolo file HTML (CSS + JavaScript inclusi) e richiede una connessione Internet per il multiplayer e i ritratti esterni.

## Attivazione multiplayer — OBBLIGATORIA
La web config del progetto Firebase **la-scalata-1c162** è già inserita nel sito, ma non basta da sola:
1. Apri [Firebase Console](https://console.firebase.google.com/).
2. Nel progetto `la-scalata-1c162`, vai su **Authentication → Sign-in method** e abilita **Anonymous**.
3. Crea il **Cloud Firestore database**.
4. In **Firestore → Rules**, copia il contenuto di **firestore.rules** e premi **Publish**.
5. In GitHub vai su **Settings → Pages → Build and deployment → Source: GitHub Actions**. Il workflow `.github/workflows/pages.yml` prova automaticamente a pubblicare il sito a ogni push. L'indirizzo sarà `https://mainbow03.github.io/la-scalata/` quando GitHub Pages risulta attivo.
6. Apri il sito da due dispositivi, crea una stanza da uno e inserisci il codice nell'altro. Se aggiorni la pagina, usa **Rientra nella stanza**, sullo stesso browser.

## Minigiochi (13)
Caccia alla Corona, Memoria Reale, Riflesso del Re, Calcolo Lampo, Forzieri del Destino, Sequenza Arcana, Conta le Stelle, Caos Cromatico, **Ponte delle Illusioni**, **Fuga dai Laser**, **Torre Traballante**, **Cassaforte delle Tre Rune**, **Il Battito del Trono**.

Gli NPC hanno difficoltà e specializzazioni e usano una simulazione distinta per ciascun minigioco, con una rappresentazione grafica dei risultati durante la sfida. Non sono giocatori umani né controllano un browser separato.

## Limiti tecnici
- L'host deve restare online per avanzare il gioco. Non c'è ancora migrazione automatica dell'host.
- I risultati vengono verificati come formato, ma sono generati dal client. Non è anticheat e non va usato per premi o classifiche pubbliche affidabili.
- I ritratti del roster provengono dalle miniature delle schede Wikipedia quando disponibili; il PNG OpenMoji e l'emoji sono fallback. Non sono garantiti PNG ufficiali né sempre l'immagine esatta del personaggio. L'arte ufficiale non è redistribuita nel repository.
- Firestore comporta costi/quote secondo il piano Firebase; le stanze non hanno ancora una procedura di cancellazione automatica.
- Nessun servizio server affidabile di matchmaking o permanenza dei profili nella prima versione.

## Crediti
Le icone OpenMoji (fallback) sono pubblicate con licenza CC BY-SA 4.0 da [OpenMoji](https://openmoji.org/). I personaggi nominati appartengono ai rispettivi titolari. Fan game non ufficiale.

## Test eseguiti
Sintassi del JavaScript verificata tramite compilazione; punteggi della simulazione NPC controllati per ogni minigioco (risultati nell'intervallo 0–100). La sincronizzazione Firestore reale richiede la pubblicazione delle regole da console e un test da due browser/dispositivi.
