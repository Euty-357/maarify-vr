import type { ModuleSection, ModuleSetting } from '../../core/types.js';

/** The shared hospital-lobby atrium that all six wings open onto. */
export const MEDICINE_ATRIUM: ModuleSetting = {
  id: 'medicine-atrium',
  name: 'Medicine Atrium',
  environment: 'interior',
  lighting: 'bright clinical daylight, warm circulation cores, low glare on screens',
  palette: ['#e7e5e4', '#0f766e', '#b91c1c', '#1d4ed8'],
  props: ['reception desk', 'wayfinding pylons', 'wheelchairs', 'hand-sanitiser stations'],
  ambience: 'quiet lobby, distant trolley, soft announcements',
};

export interface MedicineWing {
  section: ModuleSection;
  setting: ModuleSetting;
}

const wing = (
  id: string,
  title: string,
  summary: string,
  angleDeg: number,
  palette: string[],
  lighting: string,
  props: string[]
): MedicineWing => {
  const angle = (angleDeg * Math.PI) / 180;
  return {
    section: {
      id,
      title,
      settingId: `${id}-setting`,
      summary,
      entryPosition: [Math.sin(angle) * 2.6, 0, -Math.cos(angle) * 2.6],
    },
    setting: {
      id: `${id}-setting`,
      name: title,
      environment: 'interior',
      lighting,
      palette,
      props,
      ambience: 'clinical, calm, equipment hum',
    },
  };
};

export const MEDICINE_WINGS: MedicineWing[] = [
  wing(
    'heart',
    'Heart',
    'Cardiology ward and anatomy theatre: ECG, cardiac cycle, valves, conduction and coronary disease.',
    -90,
    ['#b91c1c', '#fecaca', '#7f1d1d'],
    'cardiology ward daylight plus theatre task lighting',
    ['ECG monitors', 'echo trolley', 'anatomy table', 'drug cabinet']
  ),
  wing(
    'brain',
    'Brain',
    'Neurology lab: neurons, synapses, stroke, and brain networks.',
    30,
    ['#1d4ed8', '#bfdbfe', '#312e81'],
    'cool lab light with dark adaption for neural imaging',
    ['EEG cap', 'microscope bench', 'brain atlas', 'imaging wall']
  ),
  wing(
    'spine',
    'Spine',
    'Orthopaedic clinic and anatomy lab: vertebrae, cord, discs and injury.',
    -30,
    ['#b45309', '#fde68a', '#78350f'],
    'warm clinic light, low-glare procedure lamp',
    ['vertebrae models', 'X-ray viewer', 'brace fitting bench', 'procedure table']
  ),
  wing(
    'cancer',
    'Cancer',
    'Oncology and pathology lab: cell cycle, mutation, hallmarks, screening, staging and immunotherapy.',
    -150,
    ['#7e22ce', '#e9d5ff', '#4c1d95'],
    'pathology lab daylight with microscope spotlights',
    ['microtome', 'stained slides', 'chemotherapy hood', 'staging board']
  ),
  wing(
    'hiv',
    'HIV',
    'Virology lab and clinic: virion, life cycle, CD4, ART, prevention and the care cascade.',
    150,
    ['#0f766e', '#99f6e4', '#134e4a'],
    'clinic daylight with a calm counselling room',
    ['viral load analyser', 'counselling desk', 'ART cabinet', 'prevention display']
  ),
  wing(
    'infection-prevention',
    'Infection Prevention',
    'Hospital ward, hand-hygiene station and theatre: chain of infection, PPE, airflow and outbreak response.',
    90,
    ['#15803d', '#bbf7d0', '#14532d'],
    'ward and theatre lighting, UV inspection lamp',
    ['hand-wash station', 'PPE donning mirror', 'airflow rig', 'line-list board']
  ),
];
