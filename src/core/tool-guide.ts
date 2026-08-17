export interface LocalizedText {
  th: string;
  en: string;
}

export interface ToolGuideFaq {
  question: LocalizedText;
  answer: LocalizedText;
}

export interface ToolGuide {
  toolId: string;
  overview: LocalizedText;
  useCases: LocalizedText[];
  supportedInputs: LocalizedText;
  outputs: LocalizedText;
  steps: LocalizedText[];
  limitations: LocalizedText[];
  privacy: LocalizedText;
  faq: ToolGuideFaq[];
  tips: LocalizedText[];
  sampleAvailable: boolean;
}

export function guideText(guide: LocalizedText, locale: 'th' | 'en'): string {
  return guide[locale];
}

export function guideHasRequiredContent(guide: ToolGuide): boolean {
  return Boolean(
    guide.toolId && guide.overview.th && guide.overview.en
    && guide.supportedInputs.th && guide.supportedInputs.en
    && guide.outputs.th && guide.outputs.en
    && guide.steps.length > 0 && guide.limitations.length > 0
    && guide.privacy.th && guide.privacy.en
    && guide.faq.length > 0,
  );
}
