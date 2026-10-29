export type TextBlock = { title: string; body: string };

export type PageCopy = {
  heroStrong: string;
  heroLine: string;
  aboutTitle: string;
  aboutLeadBefore: string;
  aboutLeadHighlight: string;
  aboutLeadAfter: string;
  aboutLeftStrong: string;
  aboutLeftRest: string;
  aboutRightStrong: string;
  aboutRightRest: string;
  styleTitle: string;
  styleCards: TextBlock[];
  workCta: string;
  servicesTitle: string;
  services: TextBlock[];
  celebrateTitle: string;
  celebrateCta: string;
  crowdImage: string;
  teamTitle: string;
  teamLead: string;
  teamName: string;
  teamRole: string;
  teamPhoto: string;
  teamEmail: string;
  teamX: string;
  teamLinkedin: string;
  strategyBefore: string;
  strategyHighlight: string;
  strategyAfter: string;
  clientsImage: string;
  clientsTitleBefore: string;
  clientsTitleHighlight: string;
  portfolioTitle: string;
  contactTitle: string;
  contactName: string;
  contactEmail: string;
  footer: string;
};

export const defaultPage: PageCopy = {
  heroStrong: "DE CONNECTORS",
  heroLine: "Celebrating People",
  aboutTitle: "Over De Connectors",
  aboutLeadBefore: "DE CONNECTORS ",
  aboutLeadHighlight: "zijn de nieuwe digital leaders.",
  aboutLeadAfter:
    " We reorganiseren en transformeren, verbinden mensen en geven ze een stem die gehoord moet worden.",
  aboutLeftStrong: "DE CONNECTORS",
  aboutLeftRest:
    " snapt hoe je vertrouwen opbouwt bij mensen en ze verbindt en betrekt bij het geheel. In onze projecten zijn het de mensen die het voor het zeggen krijgen. We geven ze een stem, een podium en teugels en plaatsen ze midden in jouw project of organisatie.",
  aboutRightStrong: "We noemen het Celebrating People.",
  aboutRightRest:
    " Onze interesse en nieuwsgierigheid zijn oprecht. We luisteren naar wat mensen werkelijk te zeggen hebben en checken of we ze goed hebben gehoord. We gebruiken allerlei vormen van interactieve media om hun waardevolle boodschap aan jouw organisatie en de community over te brengen.",
  styleTitle: "Onze stijl",
  styleCards: [
    {
      title: "Hart verbinding",
      body: "We duiken naar het hart van je organisatie en we beginnen bij onze eerste koffie. Hartsverbindingen zijn het meest oprecht en diepgaand, en de enige manier om een echte, no-nonsense verbinding te maken met jouw community.",
    },
    {
      title: "Professional excellence",
      body: "We werken samen met uitblinkers in hun vak. We zijn stuk voor stuk toegewijd aan onze projecten. We zijn open en transparant, betrouwbare en optimistische teamspelers.",
    },
    {
      title: "We houden van happy people",
      body: "We begrijpen hoe we mensen vieren. Samen met jou zorgen we ervoor dat wat we doen in de harten en hoofden blijft van je community. En als die erop terugkijkt, doet ze dat met een vette glimlach.",
    },
  ],
  workCta: "Blik op ons werk",
  servicesTitle: "Wat kunnen we voor je doen?",
  services: [
    {
      title: "Communications & Content",
      body: "Strategie and content productie. We praten open en direct met je community, activeren haar en geven haar een stem en teugels.",
    },
    {
      title: "Blockchain organisatie & ecosystemen",
      body: "Ontwikkeling en uitvoering van kleine en grote verandertrajecten die gebruikmaken van blockchain technologie en iedereen in een ecosysteem de waardevolle rol geeft die bij hem past.",
    },
    {
      title: "Co-Creations",
      body: "Online en offline. We brengen mensen met allerlei achtergronden en kwaliteiten bij elkaar in een ontspannen, creatieve sfeer, waardoor een collectieve intelligentie ontstaat die nieuwe inzichten en oplossingen bieden voor jouw probleem.",
    },
    {
      title: "Live events",
      body: "Open en interactieve events die we opnemen of live uitzenden. Debatten, congressen en award shows.",
    },
    {
      title: "Journalistieke producties",
      body: "Waar iedereen naar rechts kijkt, kijken wij naar links. Daar vinden we vaak vooruitgang en positieve veranderaars.",
    },
    {
      title: "Corporate Stories",
      body: "Bedrijfsverhalen die blijven plakken, omdat we de ziel van de organisatie raken. Door vanaf het begin je stakeholders te betrekken en een actieve rol te geven, worden de stories in alle lagen van de organisatie gedragen.",
    },
  ],
  celebrateTitle: "We love celebrating people",
  celebrateCta: "Get in Touch",
  crowdImage: "/media/cfb1a4b4-crowd_celebrate.jpg",
  teamTitle: "Ik ben De Connectors",
  teamLead:
    "Ik ben Stefanie Vermeulen. Ik ben een CONNECTOR in hart en ziel. Ik hou ervan om mensen te laten samenwerken en een stem te geven die werkelijk wordt gehoord. We willen namelijk allemaal verbinden en gezien en gehoord worden. Maar dan echt.",
  teamName: "Stefanie Vermeulen",
  teamRole: "Runs DE CONNECTORS. Journalist & producer",
  teamPhoto: "/media/9f134de3-screenshot.jpg",
  teamEmail: "stefanie@deconnectors.com",
  teamX: "https://x.com/stefvermeulen",
  teamLinkedin: "https://www.linkedin.com/in/stefanie-vermeulen-89424111",
  strategyBefore: "Change your ",
  strategyHighlight: "strategy",
  strategyAfter: ". Engage your audience",
  clientsImage: "/media/6c97ace5-stef_margreet_bl-e1424621016225.jpg",
  clientsTitleBefore: "Organisaties voor wie we ",
  clientsTitleHighlight: "werkten",
  portfolioTitle: "Blik op onze projecten",
  contactTitle: "Get in Touch",
  contactName: "Stefanie Vermeulen",
  contactEmail: "stefanie@deconnectors.com",
  footer: "© De Connectors",
};

export function mergePage(raw: unknown): PageCopy {
  const parsed = typeof raw === "string" ? safeParse(raw) : raw;
  const source = parsed && typeof parsed === "object" ? (parsed as Partial<PageCopy>) : {};
  const styleCards = Array.isArray(source.styleCards) ? source.styleCards.slice(0, 3) : [];
  const services = Array.isArray(source.services) ? source.services.slice(0, 8) : [];
  return {
    ...defaultPage,
    ...source,
    styleCards: [0, 1, 2].map((index) => ({
      title: textOf(styleCards[index]?.title, defaultPage.styleCards[index].title),
      body: textOf(styleCards[index]?.body, defaultPage.styleCards[index].body),
    })),
    services: (services.length ? services : defaultPage.services).map((item, index) => ({
      title: textOf(item?.title, defaultPage.services[index]?.title ?? ""),
      body: textOf(item?.body, defaultPage.services[index]?.body ?? ""),
    })),
  };
}

function textOf(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
