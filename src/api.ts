// Dag 7, del 2: Skriv egna async-funktioner. Gör testerna gröna på tests.html.
// Alla funktioner ska vara async och använda await. Använd INTE .then().
import { meny } from "./data";
import { hamtaMenyFranServer, hamtaRattFranServer } from "./fordrojning";
import type { Ratt, Tillstand } from "./typer";

// 1. Hämta hela menyn (använd hamtaMenyFranServer med 10 ms). Returnerar menyn.
export async function hamtaMeny(): Promise<Ratt[]> {

  const meny = await hamtaMenyFranServer();
  
  return meny;
}

// 2. Hämta namnet på en rätt (hamtaRattFranServer(id, 10)). Okänt id: låt felet följa med (fånga det inte).
export async function hamtaRattNamn(id: number): Promise<string> {

    const ratt = await hamtaRattFranServer(id, 10);
    
    return ratt.namn;
}

// 3. Som 2, men om något går fel returnerar funktionen null istället för att kasta fel (try/catch).
export async function hamtaRattEllerNull(id: number): Promise<Ratt | null> {
  
  try {
    const ratt = await hamtaRattFranServer(id, 10);
    
    return ratt; 

  } catch (fel) {

    return null;
  }
}

// 4. Hämta två rätter EFTER varandra (await, sedan await). Returnerar [ratt1, ratt2]. ms är väntetiden per anrop.
export async function hamtaTvaRatterEfterVarandra(id1: number, id2: number, ms: number = 100): Promise<Ratt[]> {

  const ratt1 = await hamtaRattFranServer(id1, ms);
  const ratt2 = await hamtaRattFranServer(id2, ms);
  //console.log([ratt1, ratt2], meny);// Testet gick igenom när jag hade console avkommenterad, och även med kommentar. 
  // Men när jag uppdaterade testet gick det inte igenom. Hade inte ms i (id2, ms) Det påverkade också hamtaTvaRatterParallellt. Skumt. (Insåg långt senare att det var helt oberoende detta. )
  return [ratt1, ratt2];
}

// 5. Samma sak, men båda ANROPEN startas samtidigt (Promise.all). Ska gå dubbelt så snabbt.
export async function hamtaTvaRatterParallellt(id1: number, id2: number, ms: number = 100): Promise<Ratt[]> {
  
  const ratter = await Promise.all([
    hamtaRattFranServer(id1, ms),
    hamtaRattFranServer(id2, ms),
  ]);

  return ratter;
}

//Så fort jag ändrar nåt i den här filen och sparar så kommer det här: ✗ hamtaTvaRatterParallellt: 
// går nästan dubbelt så fort som efter varandra – tog 872 ms, förväntade under 350 
// (två anrop på 200 ms ska ske samtidigt): förväntade true men fick false. 

// När jag uppdaterar testet blir det grönt. Innan jag fattade att det inte 
// berodde på den här funktionen höll jag på att tappa det. Alltså, jag tror att den är ok, 
// fast det kanske är felmeddelandet som är det rätta... Nu är det grönt och fint ✓ hamtaTvaRatterParallellt: 
// går nästan dubbelt så fort som efter varandra, men om jag sparar blir det rött igen. 



// 6. Försök upp till maxForsok gånger. anropFn är en funktion som returnerar en promise.
//    Lyckas något försök: returnera resultatet. Misslyckas alla: kasta det SISTA felet.
//    Tips: en for-loop med try/catch inuti, och spara det senaste felet i en variabel.
export async function hamtaMedForsok<T>(anropFn: () => Promise<T>, maxForsok: number): Promise<T> {

  let senasteFel: unknown;      

  for (let forsok = 1; forsok <= maxForsok; forsok++) {
    try {
      //console.log(anropFn()); //Den fina console.log ställde till det här med :)
      return await anropFn();
    } catch (fel) {
      senasteFel = fel;
    }
  }
  
  throw senasteFel;
}

// 7. Ge en promise en tidsgräns. Är den inte klar inom ms millisekunder: avvisa med
//    new Error("Tidsgränsen överskreds"). Tips: Promise.race med en promise som avvisas efter ms.
export function medTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {

  const tidsgrans = new Promise<never>((_, reject) => { //never - det finns inte något möjligt värde som Promise kan uppfyllas (resolve) med.
    //Promise ska bara kunna misslyckas. Det ska aldrig returnera något resultat. _ motsvarar resolve, vi tänker inte använda den första parametern och behöver bara reject.
    setTimeout(() => reject(new Error("Tidsgränsen överskreds")), ms);
  });

  return Promise.race([promise, tidsgrans]); //Promise.race() tar emot en samling Promise och väntar på att något av dem ska bli färdigt först.
}

// 8. Tillståndsmaskinen för att ladda något: laddar -> klar / tomt / fel.
//    hamtaFn returnerar en promise med en lista. vidTillstand anropas med ett objekt:
//      { typ: "laddar" }                       först av allt
//      { typ: "klar", ratter: [...] }          om listan har innehåll
//      { typ: "tomt" }                         om listan är tom
//      { typ: "fel", meddelande: "..." }       om hamtaFn misslyckas (felets message)

//hamtaFn	Hämtar menyn   vidTillstand	Meddelar vad som händer med hämtningen
export async function laddaMeny(hamtaFn: () => Promise<Ratt[]>, vidTillstand: (tillstand: Tillstand) => void): Promise<void> {
  
  vidTillstand({ typ: "laddar" }); //Hämtningen har startat

  try {
    const ratter = await hamtaFn();

    if (ratter.length === 0) {
      vidTillstand({typ: "tomt"}); //menyn är tom
      return;
    }

    vidTillstand({typ: "klar", ratter}); //skickar med listan med rätter.
    
  } catch (fel) {
    const meddelande = fel instanceof Error ? fel.message : String(fel);
    // Kontrollerar om felet är ett Error-objekt, i så fall hämtas felmeddelandet med .message.
    // Annars omvandlas felet till en sträng
    vidTillstand({ typ: "fel", meddelande });
  }  
}
 