export interface DocDiff {
  name: string;
  diff: string;
}

export interface DirectionProposal {
  rationale: string;
  direction: string;
  conventions: string;
  docs: DocDiff[];
}

export interface ApproveDirectionResult {
  written: boolean;
}

export interface DiscardDirectionResult {
  discarded: boolean;
}
