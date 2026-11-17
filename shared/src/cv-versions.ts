export type CreateCvVersionInput = {
  name: string;
  description?: string | null;
  attachment?: string | null;
  sourceLink?: string | null;
  enabled?: boolean | null;
};

export type UpdateCvVersionInput = Partial<CreateCvVersionInput>;
