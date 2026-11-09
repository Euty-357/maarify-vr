# M5-to-M6 Audit Record

_Completed 2026-11-09. All emulator findings are **NOT verified on headset**._

## Kenya-context correction

- Taifa-1 launched on 15 April 2023 aboard SpaceX Transporter-7 from Vandenberg Space Force Base, California, into a Sun-Synchronous Orbit. The University of Nairobi launch report gives an operational altitude of 508 km and an approximately 95-minute period.
- The Luigi Broglio/San Marco facility near Malindi is retained only as historical Kenyan space context. It is explicitly not represented as Taifa-1's launch site.
- The satellite is described as a KSA-led Kenyan mission developed with Kenyan engineers and collaborators, including SayariLabs and EnduroSat. This avoids implying either that it was an indigenous-only build or that SayariLabs/EnduroSat had identical roles.

## Playwright coverage matrix

| Module | Anchors in definition | Anchors toggled in Playwright | Challenges in definition | Challenge descriptor audit | Result |
| --- | ---: | ---: | ---: | --- | --- |
| M2 Cosmos | 4 | 4 | 4 | seated-compatible + XP | covered |
| M3 Quantum | 4 | 4 | 4 | seated-compatible + XP | covered |
| M4 Human Body | 4 | 4 | 4 | seated-compatible + XP | covered |
| M5 Aerospace | 4 | 4 | 4 | seated-compatible + XP | covered |

Playwright verifies anchor state transitions through the live scene and challenge metadata. It does not yet award XP or simulate every physical challenge completion because the application has no runtime challenge-completion/XP execution path. That remains an implementation gap for M9 integration, not evidence of completed challenge playthroughs.

## Worst-case budget method

`check-budgets.mjs` now evaluates the maximum triangle and draw-call values across every recorded render state. The current scenes preload the heavy dynamic geometry: Cosmos destinations, Quantum gallery/cryostat, Human Body HIV exploded geometry, and Aerospace engine/plume geometry. State records identify that preloaded rendering configuration. Transform-only and material-only interaction states do not add geometry; this is **verified in Playwright/emulator**, not on headset.

## High-risk claim register

| Module | Claim retained or corrected | Primary/authoritative support |
| --- | --- | --- |
| Aerospace | Taifa-1 launched from Vandenberg on 15 April 2023. | Kenya Space Agency, *Possibilities beyond our skies*, https://ksa.go.ke/ |
| Aerospace | Taifa-1 entered a Sun-Synchronous Orbit at about 508 km with an about-95-minute period. | University of Nairobi, *Taifa-1 Satellite Successful Launch*, https://geospatial.uonbi.ac.ke/node/369 |
| Aerospace | Malindi's San Marco range is historic, not Taifa-1's launch site. | University of Nairobi launch report above; KSA, https://ksa.go.ke/Cube_Satellite%20_Training.html |
| Aerospace | Taifa-1 involved Kenyan engineers and collaboration with SayariLabs/EnduroSat. | KSA training history above; KSA EO assessment, https://www.ksa.go.ke/assets/files/TAF7_EO-Assessment_2024101711.pdf |
| Aerospace | Wilson Airport is roughly 1,680 m above sea level. | Kenya Meteorological Department, *Wilson Airport Meteorological Station*, https://meteo.go.ke/our-stations/171/ |
| Human Body | Sustained viral suppression means no sexual HIV transmission (U=U). | WHO/UNAIDS joint statement, https://cdn.who.int/media/docs/default-source/searo/hiv-hepatitis/joint-moph-unaids-who-uu.pdf |
| Human Body | ART targets reverse transcriptase, integrase, and protease. | WHO consolidated HIV guidelines, https://www.who.int/publications/i/item/9789240031593 |
| Human Body | The Pumwani/Majengo work documented HIV resistance in persistently seronegative women. | Fowke et al., *The Lancet* (1996), DOI:10.1016/S0140-6736(95)12269-2 |
| Human Body | CAR-T cells can recognize CD19 independently of MHC. | June et al., *Science* (2018), DOI:10.1126/science.aar6711 |
| Human Body | KEMRI supports regional infectious-disease surveillance. | WHO Africa, *Kenya bolsters polio and measles surveillance with cutting-edge KEMRI laboratory*, https://afro.who.int/countries/kenya/news/kenya-bolsters-polio-and-measles-surveillance-cutting-edge-kemri-laboratory |

All learner-facing numbers and claims should continue to be treated as sourced claims, not medical or engineering advice.

## Claim-level Kenya re-verification and exact evidence

The claims below were rechecked on 2026-11-09 against the cited source. Quotations are intentionally short, exact supporting sentences or fragments; learner copy is paraphrased.

| Module | Learner-facing Kenya-related claim | Exact supporting source sentence | Disposition |
| --- | --- | --- | --- |
| Cosmos | Taifa-1 was Kenya's first operational Earth-observation satellite and launched from Vandenberg. | KSA: “15 April 2023 - Taifa-1, Kenya’s first operational earth observation satellite, launches to space aboard a SpaceX Falcon 9 rocket from Vandenberg Space Force Base in California, US.” | retained and corrected |
| Cosmos | The Malindi/San Marco facility is historical Kenyan space context. | KSA: “Over 20 sounding rockets and 9 satellites were launched from the facility between 1967 and 1988.” | retained as historical context only |
| Aerospace | Taifa-1 flew on Transporter-7 to a Sun-Synchronous Orbit. | University of Nairobi: “Taifa-1 satellite was launched to a Sun-Synchronous Orbit.” | retained and corrected |
| Aerospace | Taifa-1 was at about 508 km with an about-95-minute period. | University of Nairobi: “Taifa-1 satellite was deployed to an orbit of 508km and will complete each orbit around the Earth in 95 min.” | retained and corrected |
| Aerospace | Malindi was not Taifa-1's launch site. | University of Nairobi: “Falcon-9 rocket lifted off … from Vandenberg Space Force Base in California.” | explicitly corrected in anchor, narration, and capstone |
| Aerospace | Wilson Airport is a high-elevation aviation context. | Kenya accident investigation report: “Wilson Airport is located … at an elevation of 5,546 feet (ft) above mean sea level (AMSL).” | retained; learner narration says “roughly 1,680 m” |
| Human Body | U=U applies to sexual HIV transmission when viral load is achieved and maintained. | WHO/UNAIDS: “people living with HIV who achieve and maintain an undetectable viral load, cannot transmit HIV sexually.” | retained; non-diagnostic wording preserved |
| Human Body | The Pumwani study concerns persistently seronegative women in Nairobi. | Fowke et al. title: “Resistance to HIV-1 infection among persistently seronegative prostitutes in Nairobi, Kenya.” | retained; learner copy uses respectful “cohort” terminology |
| Human Body | KEMRI contributes to regional disease surveillance. | WHO Africa: “The KEMRI laboratory is not only critical for Kenya, it also supports cross-border surveillance in the Horn of Africa.” | retained, narrowed from broad clinical-trials claim |
| Human Body | CAR-T recognition of CD19 can occur without MHC restriction. | June et al. source matrix: “targeting CD19 without MHC restriction.” | retained; source DOI is recorded in `src/modules/human-body/SOURCES.md` |

### Audit review outcome

- The earlier “Taifa-1 from Malindi” implication was removed from Cosmos and Aerospace learner copy, source records, labels, and the capstone description.
- The current KEMRI narration should be read as research-context framing, not a claim that KEMRI runs every HIV or sickle-cell trial. Its stronger former wording is not used in the claim register.
- Exact sources inspected: KSA timeline; University of Nairobi launch report; WHO/UNAIDS U=U statement; WHO Africa KEMRI release; Fowke et al.; June et al.; Kenya aviation investigation report. All source URLs are recorded in the relevant module `SOURCES.md` entries or the high-risk table above.
