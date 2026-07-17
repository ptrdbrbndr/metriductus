export type DomainConfig = { zoneName: string; label: string; conversionPaths: string[] }

// 11 business/prospect-facing domeinen, allemaal op Cloudflare (fase 1).
// liefdevolleblik.nl is bewust weggelaten (privéproject).
export const DOMAINS: DomainConfig[] = [
  { zoneName: 'iductus.nl',        label: 'Inductus',       conversionPaths: ['/contact', '/offerte'] },
  { zoneName: 'naviductus.nl',     label: 'Naviductus',     conversionPaths: ['/contact'] },
  { zoneName: 'autoductus.nl',     label: 'Autoductus',     conversionPaths: ['/contact'] },
  { zoneName: 'congressionals.nl', label: 'Congressionals', conversionPaths: ['/contact'] },
  { zoneName: 'aquaductus.nl',     label: 'Aquaductus',     conversionPaths: ['/lid-worden', '/contact'] },
  { zoneName: 'vitaductus.nl',     label: 'Vitaductus',     conversionPaths: ['/contact'] },
  { zoneName: 'debrabander.com',   label: 'De Brabander',   conversionPaths: ['/contact'] },
  { zoneName: 'veriductus.nl',     label: 'Veriductus',     conversionPaths: ['/contact'] },
  { zoneName: 'conductus.nl',      label: 'Conductus',      conversionPaths: ['/contact'] },
  { zoneName: 'dataductus.nl',     label: 'Dataductus',     conversionPaths: ['/contact'] },
  { zoneName: 'datamanagement.nl', label: 'Datamanagement', conversionPaths: ['/contact'] },
]
