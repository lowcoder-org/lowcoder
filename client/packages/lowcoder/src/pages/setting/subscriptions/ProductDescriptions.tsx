const ProductDescriptions: ProductDescription = {

// Support & Ticket System Subscription

SupportProduct : {
"en" : `
  # Lowcoder Support Subscription
  
  ## Overview
  
  **Support** is a "per Workspace" (Organization) subscription. This means that all Admins and Editing Users (Developers) within the Workspace, but not "Members" (viewers only), can automatically use this subscription and create their own support tickets. Typically, a Workspace Admin activates the Support Subscription.
  
  The subscription is **calculated monthly** based on the number of Admins & Editing Users. Normal App Viewers are **not charged** and cannot access the Support Center.
  
  ## Support Center
  
  The **Support Center** provides an overview of all your support tickets, including the current status of each ticket and the assigned Lowcoder support staff. Each ticket has a detailed page where you can:
  - View and edit the full ticket description
  - Add attachments
  - Leave comments
  
  ## Commitment to Your Success
  
  We offer a support system because we are **dedicated to the success** of Lowcoder users! It’s a key value for us, and we will always strive to provide the best support possible.
  
  ## Support SLA
  
  We keep our **Service Level Agreement (SLA)** simple:
  - We aim to **respond within 1 business day**.
  - Our business hours are from **8am to 10pm GMT**.
  
  ## Support Levels
  
  1. **First Level Support**: Our initial response aims to resolve your questions quickly.
  2. **Second Level Support**: If a deeper technical issue arises, we escalate it to Second Level Support. This is reflected in the ticket's status.
  
  ## Bug Fixing Policy
  
  For bug fixes, we aim to resolve issues **within a workweek or faster**. We provide a \`/dev\` or \`/latest\` tagged Docker image for self-hosted installations to quickly apply updates. The actual update process is not in our hands.
  
  For users on \`app.lowcoder.cloud\`, updates are typically done during regular releases, which occur every **two months**. Only in exceptional cases do we apply updates outside of these scheduled releases.
  
  ## Platform Focus
  
  We do not develop custom apps for companies, as our primary focus is improving the Lowcoder platform. However, through our support system, we welcome all **questions and suggestions** that help Lowcoder users create their own apps.
  
  ## Pricing Table
  
  | User Type            | Monthly Price Per User |
  |----------------------|------------------------|
  | Admin & Editor        | €2.90                  |
  | More than 10 Users    | €1.90                  |
  | More than 100 Users   | €0.90                  |
  | More than 500 Users   | €0.49                  |
  | More than 1,000 Users | €0.29                  |
  | More than 10,000 Users| €0.19                  |
      `,

"de": `
  # Lowcoder Support-Abonnement
  
  ## Übersicht
  
  **Support** ist ein "pro Workspace" (Organisation) Abonnement. Das bedeutet, dass alle Administratoren und Bearbeiter (Entwickler) innerhalb des Workspaces, aber nicht "Mitglieder" (nur Zuschauer), automatisch dieses Abonnement nutzen und ihre eigenen Support-Tickets erstellen können. Typischerweise aktiviert ein Workspace-Administrator das Support-Abonnement.
  
  Das Abonnement wird **monatlich** basierend auf der Anzahl der Administratoren und Bearbeiter berechnet. Normale App-Zuschauer **werden nicht berechnet** und können auf das Support-Center nicht zugreifen.
  
  ## Support-Center
  
  Das **Support-Center** bietet einen Überblick über alle Ihre Support-Tickets, einschließlich des aktuellen Status jedes Tickets und des zugewiesenen Lowcoder-Supportmitarbeiters. Jedes Ticket hat eine Detailseite, auf der Sie:
  - die vollständige Ticketbeschreibung anzeigen und bearbeiten können
  - Anhänge hinzufügen
  - Kommentare hinterlassen
  
  ## Engagement für Ihren Erfolg
  
  Wir bieten ein Support-System an, weil wir **engagiert für den Erfolg** der Lowcoder-Nutzer sind! Es ist ein zentraler Wert für uns, und wir werden immer versuchen, den bestmöglichen Support zu bieten.
  
  ## Support-SLA
  
  Wir halten unser **Service Level Agreement (SLA)** einfach:
  - Wir versuchen, **innerhalb eines Geschäftstags zu antworten**.
  - Unsere Geschäftszeiten sind von **8 Uhr bis 22 Uhr GMT**.
  
  ## Support-Levels
  
  1. **Erster Level-Support**: Unser erster Kontakt versucht, Ihre Fragen schnell zu klären.
  2. **Zweiter Level-Support**: Wenn ein tiefergehendes technisches Problem auftritt, eskalieren wir es zum Zweiten Level-Support. Dies spiegelt sich im Status des Tickets wider.
  
  ## Fehlerbehebungspolitik
  
  Bei Fehlerbehebungen versuchen wir, Probleme **innerhalb einer Arbeitswoche oder schneller** zu lösen. Wir bieten ein \`/dev\` oder \`/latest\` getaggtes Docker-Image für selbst gehostete Installationen an, um Updates schnell anzuwenden. Der tatsächliche Update-Prozess liegt nicht in unserer Hand.
  
  Für Benutzer auf \`app.lowcoder.cloud\` werden Updates in der Regel während regulärer Releases durchgeführt, die alle **zwei Monate** stattfinden. Nur in außergewöhnlichen Fällen wenden wir Updates außerhalb dieser geplanten Releases an.
  
  ## Plattformfokus
  
  Wir entwickeln keine benutzerdefinierten Apps für Unternehmen, da unser Hauptfokus auf der Verbesserung der Lowcoder-Plattform liegt. Durch unser Support-System heißen wir jedoch alle **Fragen und Vorschläge** willkommen, die Lowcoder-Nutzern helfen, ihre eigenen Apps zu erstellen.
  
  ## Preistabelle
  
  | Benutzerart            | Monatlicher Preis pro Benutzer |
  |------------------------|--------------------------------|
  | Administrator & Bearbeiter | €2.90                         |
  | Mehr als 10 Benutzer    | €1.90                          |
  | Mehr als 100 Benutzer   | €0.90                          |
  | Mehr als 500 Benutzer   | €0.49                          |
  | Mehr als 1.000 Benutzer | €0.29                          |
  | Mehr als 10.000 Benutzer| €0.19                          |
      `
},

    // Media Package Subscription

MediaPackageProduct: {
"en": `
  # Media Package Subscription
  
  ## Overview
  
  ... (Add English description)
      `,
"de": `
  # Medienpaket-Abonnement
  
  ## Übersicht
  
  ... (Add German description)
      `
}
  };

  export type Translations = {
    [key: string]: string; // Each language key maps to a string
  };
  
  export type ProductDescription = {
    [productId: string]: Translations; // Each product ID maps to its translations
  };
  
  export default ProductDescriptions;
  