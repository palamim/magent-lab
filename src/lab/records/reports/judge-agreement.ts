import { prisma } from '@/lab/records/db/client';

export type AgreementRow = {
  criterion: string;
  total: bigint; // Postgres COUNT() returns BigInt via Prisma
  matched: bigint; // Postgres SUM() returns BigInt via Prisma
  agreement_pct: number; // Postgres ROUND() usually comes back as a Decimal/number
};

export const agreementByCriterion = async (experimentId: string) => {
  return prisma.$queryRaw<AgreementRow[]>`
    SELECT
      elem->>'criterion' AS criterion,
      COUNT(*) AS total,
      SUM((elem->>'matched')::boolean::int) AS matched,
      ROUND(AVG((elem->>'matched')::boolean::int) * 100, 1) AS agreement_pct
    FROM "JudgeRun" jr, jsonb_array_elements(jr.agreements) elem
    WHERE jr."experimentId" = ${experimentId}
    GROUP BY elem->>'criterion'
    ORDER BY agreement_pct ASC
  `;
};
