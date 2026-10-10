// Stripe is the pricing authority. Shared snapshot of Support and AI Robot prices,
// verified on 2026-10-10 (price_1PhAKrDDlQgecLSfzpt0hQSA / price_1UP0P3DDlQgecLSfuw4KtcZ0).
// Volume pricing: the selected rate applies to every admin/editor seat. Tax is excluded.
const monthlySeatPriceRows = `| 1–10 | €3.49 |
| 11–100 | €2.90 |
| 101–500 | €1.90 |
| 501–1,000 | €0.90 |
| 1,001–5,000 | €0.49 |
| 5,001+ | €0.39 |`;

const ProductDescriptions: ProductDescription = {

// Support & Ticket System Subscription

SupportProduct : {
"en" : `
  ## Expert help, without leaving Lowcoder

  When a query behaves unexpectedly, an integration blocks progress or you need help with the platform, open a ticket directly in your workspace. Your admins and editors can describe the issue, share attachments and continue the conversation with Lowcoder support.

  **Give your team a clear next step.** The Support Center keeps the ticket status, assigned support contact and replies together, so you can spend less time chasing context and more time building.

  ### See every ticket at a glance

  Follow open questions and their current status from the Support Center built into Lowcoder.

  ![Lowcoder Support Center showing tickets and their status](https://raw.githubusercontent.com/lowcoder-org/lowcoder-media-assets/refs/heads/main/images/Support%20System%20%7C%20List.png)

  ### Keep the details with the conversation

  Edit the description, add attachments and discuss the issue on the ticket itself.

  ![A Lowcoder support ticket with its description, attachments and conversation](https://raw.githubusercontent.com/lowcoder-org/lowcoder-media-assets/refs/heads/main/images/Support%20System%20%7C%20Ticket.png)

  One workspace subscription covers all its admins and editors. App viewers are not billed and do not have access to the Support Center. A workspace admin activates the subscription.

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
  
  Prices are in EUR, excluding tax. The workspace's total number of admins and editors selects one rate, which applies to **every billable seat** (volume pricing). For example, 11 seats cost 11 × €2.90 = €31.90 per month before tax.

| Admins and editors | Monthly price per seat |
|---|---|
${monthlySeatPriceRows}

  The seat count is set at checkout. On installations with seat synchronization enabled, changes to admins and editors are synchronized automatically while the workspace is open. Changes made while it is closed are reconciled on the next visit. Additions and removals are prorated on the next invoice. Viewers are not billable seats.
      `,

  "ru": `
  # Подписка на поддержку Lowcoder
  
  ## Обзор
  
  **Подписка на поддержку является дополнительной услугой и предоставляет доступ к Центру поддержки.**
  
  **Поддержка** оформляется "на Workspace" (организацию). Это означает, что все администраторы и пользователи с правами редактирования (разработчики) внутри Workspace, но не "Члены" (только просмотр), могут автоматически использовать эту подписку и создавать свои собственные тикеты поддержки. Обычно администратор Workspace активирует подписку на поддержку.
  
  Подписка **рассчитывается ежемесячно** на основе количества администраторов и пользователей с правами редактирования. Обычные зрители приложений **не оплачиваются** и не имеют доступа к Центру поддержки.
  
  ## Центр поддержки
  
  **Центр поддержки** предоставляет обзор всех ваших тикетов поддержки, включая текущий статус каждого тикета и назначенного сотрудника поддержки Lowcoder. У каждого тикета есть подробная страница, где вы можете:
  - просматривать и редактировать полное описание тикета
  - добавлять вложения
  - оставлять комментарии
  
  ### Обзор тикетов
  ![image](https://raw.githubusercontent.com/lowcoder-org/lowcoder-media-assets/refs/heads/main/images/Support%20System%20%7C%20List.png)

  ### Подробности тикета
  ![image](https://raw.githubusercontent.com/lowcoder-org/lowcoder-media-assets/refs/heads/main/images/Support%20System%20%7C%20Ticket.png)
  
  ## Обязательство к вашему успеху
  
  Мы предлагаем систему поддержки, потому что мы **преданы успеху** пользователей Lowcoder! Это наш ключевой принцип, и мы всегда будем стремиться предоставить лучший возможный уровень поддержки.
  
  ## SLA Поддержки
  
  Мы сохраняем наш **Service Level Agreement (SLA)** простым:
  - Мы стремимся **ответить в течение 1 рабочего дня**.
  - Наши рабочие часы с **8:00 до 22:00 по Гринвичу**.
  
  ## Уровни поддержки
  
  1. **Поддержка первого уровня**: Наша начальная реакция нацелена на быстрое решение ваших вопросов.
  2. **Поддержка второго уровня**: Если возникает более сложная техническая проблема, мы передаем её на второй уровень поддержки. Это отображается в статусе тикета.
  
  ## Политика исправления ошибок
  
  В случае исправления ошибок мы стремимся решить проблемы **в течение рабочей недели или быстрее**. Мы предоставляем Docker-образ с тегом \`/dev\` или \`/latest\` для самостоятельной установки, чтобы быстро применять обновления. Сам процесс обновления находится вне нашей компетенции.
  
  Для пользователей на \`app.lowcoder.cloud\` обновления обычно проводятся во время регулярных выпусков, которые происходят каждые **два месяца**. Только в исключительных случаях мы применяем обновления вне этих запланированных выпусков.
  
  ## Фокус на платформе
  
  Мы не разрабатываем кастомные приложения для компаний, так как наш основной фокус — улучшение платформы Lowcoder. Тем не менее, через нашу систему поддержки мы приветствуем все **вопросы и предложения**, которые помогают пользователям Lowcoder создавать свои собственные приложения.
  
  ## Таблица цен
  
  Цены указаны в EUR без налогов. Общее число администраторов и редакторов в Workspace определяет единую ставку для **каждого оплачиваемого места** (объёмное ценообразование). Например, 11 мест стоят 11 × €2.90 = €31.90 в месяц без налогов.

| Администраторы и редакторы | Цена за место в месяц |
|---|---|
${monthlySeatPriceRows}

  Число мест задаётся при оформлении подписки. Если синхронизация мест включена для установки, изменения числа администраторов и редакторов синхронизируются автоматически, пока Workspace открыт. Изменения, сделанные при закрытом Workspace, учитываются при следующем посещении. Добавление и удаление мест учитывается пропорционально времени в следующем счёте. Пользователи только с правами просмотра не оплачиваются.
  `,
  "es": `
  # Suscripción de soporte de Lowcoder
  
  ## Descripción general
  
  **La suscripción de soporte es un servicio adicional que proporciona acceso al Centro de Soporte.**
  
  **Soporte** es una suscripción "por espacio de trabajo" (Organización). Esto significa que todos los administradores y usuarios con derechos de edición (Desarrolladores) dentro del espacio de trabajo, pero no los "Miembros" (solo visualizadores), pueden usar automáticamente esta suscripción y crear sus propios tickets de soporte. Normalmente, un administrador del espacio de trabajo activa la suscripción de soporte.
  
  La suscripción se **calcula mensualmente** en función del número de administradores y usuarios con derechos de edición. Los visualizadores normales de la aplicación **no son cobrados** y no pueden acceder al Centro de Soporte.
  
  ## Centro de Soporte
  
  El **Centro de Soporte** proporciona una visión general de todos sus tickets de soporte, incluido el estado actual de cada ticket y el personal de soporte de Lowcoder asignado. Cada ticket tiene una página detallada donde puede:
  - ver y editar la descripción completa del ticket
  - añadir archivos adjuntos
  - dejar comentarios
  
  ### Descripción general del ticket
  ![image](https://raw.githubusercontent.com/lowcoder-org/lowcoder-media-assets/refs/heads/main/images/Support%20System%20%7C%20List.png)

  ### Detalles del ticket
  ![image](https://raw.githubusercontent.com/lowcoder-org/lowcoder-media-assets/refs/heads/main/images/Support%20System%20%7C%20Ticket.png)
  
  ## Compromiso con su éxito
  
  Ofrecemos un sistema de soporte porque estamos **comprometidos con el éxito** de los usuarios de Lowcoder. Es un valor clave para nosotros, y siempre nos esforzaremos por brindar el mejor soporte posible.
  
  ## SLA de soporte
  
  Mantenemos nuestro **Acuerdo de Nivel de Servicio (SLA)** simple:
  - Nos esforzamos por **responder dentro de un día hábil**.
  - Nuestro horario de trabajo es de **8 a.m. a 10 p.m. GMT**.
  
  ## Niveles de soporte
  
  1. **Soporte de Primer Nivel**: Nuestra respuesta inicial busca resolver sus preguntas rápidamente.
  2. **Soporte de Segundo Nivel**: Si surge un problema técnico más profundo, lo escalamos al Soporte de Segundo Nivel. Esto se refleja en el estado del ticket.
  
  ## Política de resolución de errores
  
  Para la resolución de errores, nos esforzamos por resolver los problemas **en una semana laboral o antes**. Proporcionamos una imagen de Docker etiquetada como \`/dev\` o \`/latest\` para instalaciones auto-alojadas para aplicar rápidamente las actualizaciones. El proceso de actualización real no está bajo nuestro control.
  
  Para los usuarios de \`app.lowcoder.cloud\`, las actualizaciones se realizan generalmente durante los lanzamientos regulares, que ocurren cada **dos meses**. Solo en casos excepcionales aplicamos actualizaciones fuera de estos lanzamientos programados.
  
  ## Enfoque en la plataforma
  
  No desarrollamos aplicaciones personalizadas para empresas, ya que nuestro enfoque principal es mejorar la plataforma Lowcoder. Sin embargo, a través de nuestro sistema de soporte, damos la bienvenida a todas las **preguntas y sugerencias** que ayuden a los usuarios de Lowcoder a crear sus propias aplicaciones.
  
  ## Tabla de precios
  
  Los precios están en EUR, sin impuestos. El número total de administradores y editores del espacio de trabajo determina una tarifa única para **cada puesto facturable** (precios por volumen). Por ejemplo, 11 puestos cuestan 11 × €2.90 = €31.90 al mes antes de impuestos.

| Administradores y editores | Precio mensual por puesto |
|---|---|
${monthlySeatPriceRows}

  El número de puestos se fija al contratar la suscripción. En instalaciones con sincronización de puestos habilitada, los cambios de administradores y editores se sincronizan automáticamente mientras el espacio de trabajo está abierto. Los cambios realizados mientras está cerrado se concilian en la siguiente visita. Las altas y bajas se prorratean en la siguiente factura. Los usuarios con permisos de solo lectura no se facturan.
`,
"de": `
  # Lowcoder Support-Abonnement
  
  ## Übersicht
  
  **Das Support-Abonnement ist ein zusätzlicher Service und eröffnet den Zugang zum Support-Center.**
  
  **Support** ist ein "pro Workspace" (Organisation) Abonnement. Das bedeutet, dass alle Administratoren und Bearbeiter (Entwickler) innerhalb des Workspaces, aber nicht "Mitglieder" (nur App-Viewer), automatisch dieses Abonnement nutzen und ihre eigenen Support-Tickets erstellen können. Typischerweise aktiviert ein Workspace-Administrator das Support-Abonnement.
  
  Das Abonnement wird **monatlich** basierend auf der Anzahl der Administratoren und Bearbeiter berechnet. Normale App-Zuschauer **werden nicht berechnet** und können auf das Support-Center nicht zugreifen.
  
  ## Support-Center
  
  Das **Support-Center** bietet einen Überblick über alle Ihre Support-Tickets, einschließlich des aktuellen Status jedes Tickets und des zugewiesenen Lowcoder-Supportmitarbeiters. Jedes Ticket hat eine Detailseite, auf der Sie:
  - die vollständige Ticketbeschreibung anzeigen und bearbeiten können
  - Anhänge hinzufügen
  - Kommentare hinterlassen
  
  ### Ticketübersicht
  ![image](https://raw.githubusercontent.com/lowcoder-org/lowcoder-media-assets/refs/heads/main/images/Support%20System%20%7C%20List.png)

  ### Ticketdetails
  ![image](https://raw.githubusercontent.com/lowcoder-org/lowcoder-media-assets/refs/heads/main/images/Support%20System%20%7C%20Ticket.png)
  
  ## Engagement für Ihren Erfolg
  
  Wir bieten ein Support-System an, weil wir **dem Erfolg** der Lowcoder-Nutzer verpflichtet sind! Es ist ein zentraler Wert für uns, und wir werden stets bemüht sein, den bestmöglichen Support zu bieten.
  
  ## Support SLA
  
  Wir halten unser **Service Level Agreement (SLA)** einfach:
  - Wir streben an, **innerhalb eines Geschäftstages zu antworten**.
  - Unsere Geschäftszeiten sind von **8:00 bis 22:00 Uhr GMT**.
  
  ## Support-Level
  
  1. **Erst-Level-Support**: Unsere erste Antwort zielt darauf ab, Ihre Fragen schnell zu klären.
  2. **Zweit-Level-Support**: Wenn ein tiefergehendes technisches Problem auftritt, eskalieren wir es zum Zweit-Level-Support. Dies wird im Ticketstatus angezeigt.
  
  ## Fehlerbehebungsrichtlinie
  
  Für Fehlerbehebungen streben wir an, Probleme **innerhalb einer Arbeitswoche oder schneller** zu lösen. Wir bieten ein \`/dev\` oder \`/latest\` getaggtes Docker-Image für selbstgehostete Installationen, um Updates schnell anzuwenden. Der eigentliche Update-Prozess liegt nicht in unserer Hand.
  
  Für Benutzer von \`app.lowcoder.cloud\` werden Updates in der Regel während der regelmäßigen Veröffentlichungen durchgeführt, die alle **zwei Monate** stattfinden. Nur in Ausnahmefällen wenden wir Updates außerhalb dieser geplanten Veröffentlichungen an.
  
  ## Plattformfokus
  
  Wir entwickeln keine individuellen Apps für Unternehmen, da unser Hauptaugenmerk auf der Verbesserung der Lowcoder-Plattform liegt. Durch unser Support-System begrüßen wir jedoch alle **Fragen und Vorschläge**, die Lowcoder-Nutzern helfen, ihre eigenen Apps zu erstellen.
  
  ## Preistabelle
  
  Alle Preise sind in EUR und verstehen sich zuzüglich Steuern. Die Gesamtzahl der Administratoren und Bearbeiter im Workspace bestimmt einen einheitlichen Preis für **jeden kostenpflichtigen Benutzer** (Volumenpreis). Beispielsweise kosten 11 Benutzer 11 × €2.90 = €31.90 pro Monat vor Steuern.

| Administratoren und Bearbeiter | Monatlicher Preis pro Benutzer |
|---|---|
${monthlySeatPriceRows}

  Die Benutzeranzahl wird beim Abschluss festgelegt. Bei Installationen mit aktivierter Synchronisierung werden Änderungen an Administratoren und Bearbeitern automatisch abgeglichen, solange der Workspace geöffnet ist. Änderungen bei geschlossenem Workspace werden beim nächsten Besuch abgeglichen. Hinzugefügte und entfernte Plätze werden zeitanteilig auf der nächsten Rechnung berücksichtigt. Reine App-Viewer werden nicht berechnet.
`
},

AIRobotProduct: {
  en: `
# AI Robot

## From an idea to something you can edit

AI Robot unlocks **Lowcoder Automator**, your building partner inside the app editor. Describe a task, create native Lowcoder components and keep refining them through conversation or the visual editor.

- **Start a useful first draft.** Ask for a to-do app, a customer form or a dashboard layout.
- **Make everyday changes faster.** Add a filter, rearrange components or update supported properties and styles.
- **Build on what is already there.** Automator uses the current app context to help with your next change.

### Your first app starts with one connection

Open **Automator → Set up AI connection** in the editor. The guided setup helps you connect an OpenAI API key or an existing model datasource, creates the two queries for you and checks that your model can return tool calls. Then try: “Create a simple to-do app with a task table and an add button.”

### Your model. Your editable app.

Use the OpenAI example to get started, or connect a self-hosted model or private gateway with an OpenAI-compatible API. Other API formats can use a custom bridge query. Inline guidance explains the endpoint, tool support and response format.

Model output can vary. Automator applies supported changes directly in the editor; review the result before publishing. The subscription includes access to Automator, not model credits or custom app development.

### Built for your workspace

A workspace admin subscribes for the workspace. All admins and editors in that workspace count as billable seats and can use the Automator. App viewers are not billed. Each workspace requires its own subscription.

## Monthly pricing

Prices are in EUR, excluding tax. The workspace's seat count determines the price per seat for all seats (volume pricing).

| Admins and editors | Monthly price per seat |
|---|---|
${monthlySeatPriceRows}

For example, 11 seats cost 11 × €2.90 = €31.90 per month before tax. The seat count is set at checkout. On installations with seat synchronization enabled, changes to admins and editors are synchronized automatically while the workspace is open. Changes made while it is closed are reconciled on the next visit. Additions and removals are prorated on the next invoice.

The Automator uses the AI query selected in the editor. Any provider charges associated with that query remain separate.
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
