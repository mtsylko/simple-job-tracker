export type CvVersionRow = {
  id: string;
  name: string;
  description: string;
  attachment: string;
  sourceLink: string;
  enabled: boolean;
};

export type CvVersionFormValues = {
  name: string;
  description: string;
  attachment: string;
  sourceLink: string;
  enabled: boolean;
};

export const seededCvVersionOptions = [
  'full-stack-v1.0',
  'front-end-v1.0',
  'full-stack-v2.0',
  'front-end-v2.0',
  'front-end-v2.1',
  'front-end-v2.2',
  'full-stack-2.2',
  'front-end-2.3',
  'full-stack-2.3',
  'full-stack-senior-3.0'
] as const;

export const emptyCvVersionFormValues: CvVersionFormValues = {
  name: '',
  description: '',
  attachment: '',
  sourceLink: '',
  enabled: true
};
