/**
 * Dr. Amani — 7-Beat Spatial Audio Narrative for Human Body & Medicine.
 * Delivers accurate cellular physiology, oncology concepts, and destigmatizing HIV science.
 */

export interface BodyNarrativeBeat {
  beatNumber: number;
  timeRange: string;
  title: string;
  guidanceText: string;
  stemContext: string;
}

export const DR_AMANI_BODY_BEATS: BodyNarrativeBeat[] = [
  {
    beatNumber: 1,
    timeRange: '0:00–2:00',
    title: 'Opening Hook: The Vascular Tree & Medical Disclaimer',
    guidanceText:
      'Welcome to Human Body & Medicine. Please review the medical disclaimer on the entry plinth: this software is strictly for scientific education and does not provide clinical diagnosis. Before you beats a living cardiovascular tree pumping five liters of blood per minute.',
    stemContext:
      'Cardiac output Q = Stroke Volume * Heart Rate (~70 mL * 72 bpm ≈ 5 L/min at rest).',
  },
  {
    beatNumber: 2,
    timeRange: '2:00–5:00',
    title: 'Cardiac Mechanics & The Wiggers Loop',
    guidanceText:
      'Step inside the left ventricle. Notice the fibrous mitral valve leaflets closing as intraventricular pressure spikes to 120 mmHg. Use the hydraulic slider to scrub through the systolic ejection and diastolic filling phases.',
    stemContext:
      'Wiggers diagram correlates ventricular pressure, atrial pressure, aortic pressure, and ECG QRS electrical depolarization.',
  },
  {
    beatNumber: 3,
    timeRange: '5:00–8:00',
    title: 'Physical Challenge: Pacemaker Conduction Timing',
    guidanceText:
      'Synchronize the cardiac electrical conduction system. Grab the pacing dial to adjust the AV nodal delay to precisely 120 milliseconds, ensuring the atria complete filling before ventricular systole fires.',
    stemContext:
      'The atrioventricular (AV) node introduces an essential ~0.12 second delay allowing ventricular end-diastolic volume (EDV) optimization.',
  },
  {
    beatNumber: 4,
    timeRange: '8:00–12:00',
    title: 'Microcirculation & Neural Synaptic Firing',
    guidanceText:
      'Shrink down to capillary scale. Ride a red blood cell as it deforms through a narrow seven-micrometer vessel. Then step into an axon terminal to watch calcium ions trigger neurotransmitter release across the synaptic cleft.',
    stemContext:
      'Action potentials propagate via voltage-gated Na+ and K+ channel conductance changes described by Hodgkin-Huxley equations.',
  },
  {
    beatNumber: 5,
    timeRange: '12:00–16:00',
    title: 'Oncology & CAR-T Immunotherapy',
    guidanceText:
      'Enter the oncology suite. Cancer arises from genetic hallmarks including evasion of apoptosis and sustained proliferation. Help engineer a CAR-T cell by snapping a single-chain variable fragment (scFv) receptor targeting CD19 antigens on lymphoma cells.',
    stemContext:
      'Chimeric Antigen Receptor (CAR) T-cell therapy reprogrammes patient T-cells to identify cancer cell surface antigens independently of MHC presentation.',
  },
  {
    beatNumber: 6,
    timeRange: '16:00–18:00',
    title: 'HIV Virology, The Pumwani Cohort & U=U',
    guidanceText:
      'Inspect the exploded HIV virion. Notice how Antiretroviral Therapy (ART) inhibits reverse transcriptase, integrase, and protease. Emphasize the scientific reality of U=U: an undetectable viral load means the virus is untransmittable. In Nairobi, the historic Pumwani Cohort taught the world about mucosal cytotoxic T-cell immunity.',
    stemContext:
      'University of Nairobi and University of Manitoba researchers identified HLA-restricted mucosal CD8+ CTL responses in highly-exposed seronegative individuals in the Majengo/Pumwani cohort.',
  },
  {
    beatNumber: 7,
    timeRange: '18:00–20:00',
    title: 'Capstone: Molecular Defense & Horizon',
    guidanceText:
      'Complete the final capstone: deploy integrase inhibitors and align cytotoxic T-lymphocytes to clear infected cells. You have earned the Biomedical Pioneer badge. Step through the portal back to the Hub.',
    stemContext:
      'KEMRI (Kenya Medical Research Institute) and partner academic centers lead pioneering clinical trials in HIV treatment and sickle cell therapeutics.',
  },
];

