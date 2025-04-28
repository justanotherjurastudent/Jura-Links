# Jura-Links

Die effziente Methode, um mit allen jurstischen Nachweisen zu arbeiten. Wenn dir das Plugin gefällt, dann freuen wir uns auf eine kleine Anerkennung vor dir. Dazu nutzen wit Buy Me A Coffee:

<a href="https://www.buymeacoffee.com/justanotherjurastudent" target="_blank">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" >
</a>


## Beschreibung

Jura-Links wurde insbesondere für Jurastudierende, aber auch darüber hinaus für alle anderen Personen entwickelt, die sich in ihren Notizen mit juristischen Inhalten wie Gesetzen, Urteilen und Zeitschriftenfundstellen befassen. Dieses Plugin sorgt dafür, dass alle eure angegebenen Normen, Aktenzeichen von Gerichtsurteilen, aber auch Funststellenangaben von Zeitschriften erkannt und mit diversen Gesetzesanbietern verlinkt werden. Folgende Gesetzesanbieter werden unterstützt:
> [!IMPORTANT]
> **verfügbare Gesetzesanbieter:**
>- Dejure
>- Rewis.io
>- Buzer
>- LexMea (insbesondere für Studierende geeignet!)
>- Justiz NRW (Quelle für Landesgesetze)

Außerdem bietet Jura-Links ein praktisches Such- und Filterfenster an, um alle dem Plugin bekannten Gesetze zu durchsuchen. Dies ist vor allem dann sehr nützlich, wenn ihr die Abkürzung für ein bestimmtes Landesgesetz erfahren wollt.

## Funktionsweise der Verlinkung

### 1. Schreibe deine Notiz auf.
- Achte hier auf die **zugelassenen Gesetzes-Schreibweisen**! Dabei gilt folgendes:
	- Damit das Plugin die Gesetze im Anschluss erkennt, musst du **am Ende stets die Gesetzesangabe** notieren.
	- Du kannst die **Normpräzisierungen** wie Absatz, Satz, Alternative etc. nur in **verkürzter Schreibweise** notieren, für Absatz also die römische Zahl oder Abs. (Ziffer), für Satz “S. (Ziffer)” oder unmittelbar nach dem Absatz mit der arabischen Ziffer. Ansonsten gibt es noch “Alt. (Ziffer)” für Alternative, “Var. (Ziffer)” für Variante, “Hs. (Ziffer)” für Halbsatz, “Nr. (Ziffer)” für Nummer und “lit. (Buchstabe)” für Buchstabe.
	- Normenketten müssen mit §§ oder Art. beginnen.
	- Innerhalb von Normenketten dienen **Kommas nur zur Abgrenzung der einzelnen Normen** (!) mit Ausnahme der weiteren Nennung eines Absatzes, sofern dieser in römischen Ziffern geschrieben wurde. Das bedeutet, man kann z. B. mehrere Sätze nur mit einem “und” (oder Abkürzung “u.”) oder “in Verbindung mit” (oder Abkürzung “iVm”, “i.V.m.” oder “i. V. m.”) verbinden.
	- Verbindungen einer Norm mit einer anderen mittels des “i. V. m.” müssen so erfolgen, dass zum einen die Gesetzesbezeichnung hiervor steht und hiernach die verbundene Norm nochmals mit § oder Art. anfängt, also z. B. Art. 2 I GG i. V. m. Art. 1 I GG.
	- Normenbereiche kannst du mit einem Bindestrich oder “bis” angeben. Dann wird die erste und letzte Norm verlinkt. Ebenfalls kannst du auch am Ende einer Norm “f.” oder “ff.” angeben.
	- Landesgesetze brauchen die (für das Plugin) korrekten Gesetzesabkürzungen. Diese kannst du über das Suchfenster in der rechten Seitenleiste einsehen (dazu später mehr).
	- Bei Aktenzeichen und Zeitschriften gibt es nichts besonderes zu beachten. Das Aktenzeichen darf nicht verändert werden und die Fundstelle sollte dabei ca. so aussehen “NJW 2024, 1” oder “BGHZ 168, 1”.

> [!TIP]
> **Beispiele für korrekte Gesetzesangaben:**
>- § 1 BGB
>- §§ 535 I, 280 I, 241 II BGB *oder* §§ 535 Abs. 1, 280 Abs. 1, 241 Abs. 2 BGB
>- § 244 I Nr. 1 lit. a StGB
>- § 812 I 1 Alt. 1 BGB
>- Art. 7 I GG
>- §§ Art. 2 I GG i. V. m. Art. 1 I GG
>- § 187 I, II BGB
>- § 288 V 1 u. 2 BGB
>- §§ 305 - 310 BGB _oder_ §§ 305 bis 310 BGB
>- §§ 312 ff. BGB
>- § 1 I SOG LSA

### 2. Rufe die Befehlspalette auf 
- Suche nach dem **Befehl “Jura Links: Verlinkung starten”**. Es dürfte schon ausreichen, nur nach “jur” zu suchen, damit der Befehl erscheint. Aktiviere das und alle gefundenen Gesetze, Gerichtsaktenzeichen und Zeitschriftenfundstellen werden verlinkt.
- Das Plugin sucht nach Aktivierung dieses Befehls die aktuell bearbeitete Notiz nach diesen Jura-Nachweisen ab.
- In den Einstellungen dieses Plugins kannst du auch einstellen, dass die Notiz bei jedem Laden einmal hiernach durchsucht wird.
- In den Einstellungen dieses Plugins legst du eine Reihenfolge für die Gesetzesanbieter fest. Das bedeutet, wenn eine Normangabe gefunden wurde, soll versucht werden, dieses Gesetz mit dem ersten angegeben Gesetzesanbieter zu verlinken. Wenn dies nicht möglich ist (z. B. weil das Gesetz bei dem Anbieter fehlt), dann wird beim nächsten angegeben Anbieter geschaut, ob eine Verlinkung erfolgen kann. Diese Reihenfolge läuft u. U. bis zum letzten Anbieter, der angegeben wurde. Wenn das Gesetz bei keinem Anbieter gefunden wurde, dann entsteht kein Link.
- Aktenzeichen und Funstellen werden immer mit Dejure verlinkt.
### 3. Alle gefundenen Nachweise sind nun im Markdownlink-Format verlinkt. 
- Nicht verlinkt werden §-Zeichen oder “Art.” sowie die Gesetzesangabe selbst.
- Nun kannst du hierauf klicken und der Link wird in deinem Browser geöffnet.
- Solltest du das Obsidian Plugin “Surfing” heruntergeladen haben, kannst du im *Lesemodus* auf den Link mit der Maus hovern und ein Vorschaufenster des Links taucht auf. Das ist sehr nützlich! In den Einstellungen des “Surfing”-Plugins musst du nur die “Hover Popover-Einstellung” aktiviert haben.

## Suchfenster

Das Suchfenster ist über das Waagensymbol links in der Leiste erreichbar. Es öffnet sich rechts in der Seitenleiste.
1. Hier kannst du zum einen im **Suchfeld nach einem bestimmten Gesetz** suchen. Es funktioniert die Abkürzung oder der Titel des Gesetzes. Unten werden dir dann nach Gesetzesanbieter geordnet alle gefundenen Gesetze hierzu angezeigt.
2. Unter dem Suchfeld befinden sich zwei Filter-Buttons.
	1. Der erste ist dazu da, die **Gesetze eines Bundeslandes in Deutschland anzeigen** zu lassen, die der Anbieter LexSoft bereitstellt.
	2. Mit dem zweiten Filter-Button kannst du dir alle **Gesetze eines Gesetzesanbieters anzeigen** lassen.
<img src="https://github.com/user-attachments/assets/3f702b3e-418e-4fb2-b285-f395a925f922" height="700">



## Einstellungen
![Pasted image 20240924161501](https://github.com/user-attachments/assets/32b895c5-944e-4b75-89c2-ee49a06d0cab)

Du kannst unter den Einstellungen folgendes einstellen:
1. Per Toggle (Umschalt-Button): Wenn dies aktiviert wird, dann werden **bei jedem Laden** einer Notiz nach Jura-Nachweisen gesucht und ggf. verlinkt. Sofern dir das einmal aus Versehen passiert, kannst du die Verlinkung mit Strg (oder bei Mac Cmd)+Z rückgängig machen.
2. Per Dropdown: Die **Reihenfolge der angesteuerten Gesetzesanbieter** kannst du hier einstellen. Das bedeutet, wenn eine Normangabe gefunden wurde, soll versucht werden, dieses Gesetz mit dem ersten angegeben Gesetzesanbieter zu verlinken. Wenn dies nicht möglich ist (z. B. weil das Gesetz bei dem Anbieter fehlt), dann wird beim nächsten angegeben Anbieter geschaut, ob eine Verlinkung erfolgen kann. Diese Reihenfolge läuft u. U. bis zum letzten Anbieter, der angegeben wurde. Wenn das Gesetz bei keinem Anbieter gefunden wurde, dann entsteht kein Link.
	- LexSoft wird stets zuerst angesteuert, da es sich hierbei um speziellere Landesgesetze handelt und die Programmlogik damit besser umgehen kann.

## Tipps
### für Jurastudierende
- Wählt als 2. Gesetzesanbieter in den Einstellungen des Plugins **“LexMea”** aus. LexMea bietet gerade Jurastudierenden eine sehr gute Lernoberfläche, wo man Verlinkungen und Notizen zu den einzelnen Normen sehr gut hinzufügen kann.
### für alle anderen Juristen
- Als 2. Gesetzesanbieter kann ich **“Rewis”** empfehlen, da die Seite schön schnell lädt, keine Werbung zeigt und einen cleanen Look hat. Außerdem lädt sie als Popover in Verbindung mit dem “Surfing”-Plugin schnell.
- Ansonsten kommt es immer auf den eigenen Geschmack an. Buzer bietet z. B. auch Gesetzesversionen an und hat ansonsten wohl auch den umfangreichsten Gesetzeskatalog. Allerdings ist die Werbung und das Design dort meiner Ansicht nach erdrückend.
### für alle
- Dieses Plugin macht insbesondere mit dem **Plugin [“Surfing” von Boninall](https://github.com/PKM-er/Obsidian-Surfing)** viel Spaß, weil ihr euch die Gesetzeslinks gleich in Obsidian öffnen lassen könnt. Wenn ihr im *Lesemodus* von Obsidian seid, könnt ihr auch **über die Links hovern** und die Webseite wird euch in einem kleinen Fenster beim Link angezeigt. Das funktioniert gerade mit Rewis schnell.
- Außerdem empfehle ich euch das **Plugin [“Links” von MiiKey](https://github.com/mii-key/obsidian-links)**, da hier hiermit **Verlinkungen wieder löschen** könnt. Sofern das Plugin bei euch aktiviert ist, wähle den Text mit den Verlinkungen aus, klicke mit rechts darauf bzw. öffne das Kontextmenü und wähle dann “Unlink” aus. Dann werden die Links entfernt. Das könnte dannn relevant werden, wenn ihr bei der Gesetzesbezeichnung einen Fehler gemacht habt oder die Reihenfolge der angesteuerten Gesetzesnabieter geändert habt - dann könnte man hiernach nochmal die Notiz neu verlinken lassen.

## Download

Du kannst dir das Plugin in Obsidian unter den Community-Plugins herunterladen oder, sofern du dich auskennst, einen Ordner in deinem Plugins-Ordner anlegst und dort die kompilierten Dateien unter “Releases” auf Github (main.js, styles.css, manifest.json) herunterlädst und dort hineinverschiebst.
Ansonsten kannst du das Projekt auch klonen und folgendermaßen vorgehen:

### Devoloper setup

1. Install all dependencies via console:
    ```
    npm i
    ```
2. Compiles and hot-reloads for development:
    ```
    npm run dev
    ```

### Development

    Make sure that all the tests pass before you make a new pull request.
    ```
    npm run test
    ```
## ❤️ Danksagung
Dieses Plugin wäre ohne die hervorragende Arbeit von Emi ([@myle93](https://github.com/myle93)) nicht möglich gewesen! Sie schrieb den Großteil des Codes.
Außerdem danke ich auch Martin ([@S1SYPHOS](https://github.com/S1SYPHOS)), der bereits ein Programm auf PHP-Basis schrieb, um Gesetze auf Webseiten zu verlinken. Von ihm haben wir uns ein paar Dinge abgeschaut.
