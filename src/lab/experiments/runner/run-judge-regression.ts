import { anthropic } from '@/lab/instruments/clients/anthropic';
import { runConventionsJudge } from '@/lab/instruments/judges/conventions/conventions.judge';
import { checkAgreement } from '@/lab/instruments/metrics/agreement';
import { recordJudgeRun } from '@/lab/records/db/judge-runs.repo';
import { getGitCommitSha } from '@/lib/git';
import type { LabeledDiff } from '@/lab/fixtures/labeled-diffs/labeled-diff.types';
import type { JudgeSubject } from '@/lab/subjects/judges/conventions-judge.subject';

export const runJudgeRegression = async (
  subject: JudgeSubject,
  diffs: LabeledDiff[],
  experimentId: string,
  runsPerDiff: number,
): Promise<void> => {
  // Captured once per experiment run, not per judge call — the commit doesn't change mid-run,
  // and shelling out to git ~100 times would be pure waste.
  const gitCommitSha = getGitCommitSha();

  for (const diff of diffs) {
    for (let i = 0; i < runsPerDiff; i++) {
      const t0 = Date.now();
      const evaluation = await runConventionsJudge(
        anthropic,
        diff.conventions,
        diff.diff,
        subject.criteriaVersion,
        subject.promptVersion,
      );
      const latencyMs = Date.now() - t0;

      const agreements = checkAgreement(evaluation, diff.expected);
      const allMatched = agreements.every((a) => a.matched);

      await recordJudgeRun({
        experimentId,
        subjectKey: subject.key,
        diffKey: diff.key,
        model: subject.model,
        criteriaVersion: subject.criteriaVersion,
        promptVersion: subject.promptVersion,
        gitCommitSha,
        latencyMs,
        allMatched,
        agreements,
      });

      const passStr = agreements
        .map((a) => `${a.criterion}:${a.matched ? '✓' : `✗(want ${a.expected} got ${a.actual})`}`)
        .join('  ');
      console.log(
        `  [${diff.key} #${i + 1}] ${allMatched ? '✅' : '❌'}  ${passStr}  (${(latencyMs / 1000).toFixed(1)}s)`,
      );
    }
  }
};
