import type { Fixture } from '@/lab/fixtures/fixtures.types';
import type { AgentType } from '@/lab/types/common.types';

export type FixturesOptions = Omit<Fixture, 'input' | 'agentType'>;

export const generateFixtures = <Input>(
  options: FixturesOptions,
  agentType: AgentType,
  inputFactory: (dir: string) => Input,
): Fixture<Input> => {
  return {
    ...options,
    agentType,
    input: inputFactory(options.dir),
  };
};
