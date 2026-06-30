export interface Scenario {
  name: string;
  description: string;
  direction: string;
  conventions: string;
  planA: string;
  planB: string;
  expectedWinner?: 'A' | 'B' | 'tie';
}
