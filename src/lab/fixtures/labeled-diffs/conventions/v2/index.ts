import type { LabeledDiff } from '@/lab/fixtures/labeled-diffs/labeled-diff.types';
import { respectsConventionsDiff } from '@/lab/fixtures/labeled-diffs/conventions/v2/0001-respects-conventions';
import { wrongFileNamingDiff } from '@/lab/fixtures/labeled-diffs/conventions/v2/0002-wrong-file-naming';
import { wrongComponentNamingDiff } from '@/lab/fixtures/labeled-diffs/conventions/v2/0003-wrong-component-naming';
import { wrongFileAndComponentNamingDiff } from '@/lab/fixtures/labeled-diffs/conventions/v2/0004-wrong-file-and-component-naming';
import { moduleMisplacedInComponentsDiff } from '@/lab/fixtures/labeled-diffs/conventions/v2/0005-module-misplaced-in-components';
import { moduleMisplacedInHooksDiff } from '@/lab/fixtures/labeled-diffs/conventions/v2/0006-module-misplaced-in-hooks';
import { fileWrongPlaceAndNamingDiff } from '@/lab/fixtures/labeled-diffs/conventions/v2/0007-file-wrong-place-and-naming';
import { fileMisplacedWrongComponentNamingDiff } from '@/lab/fixtures/labeled-diffs/conventions/v2/0008-file-misplaced-wrong-component-naming';
import { anyTypingDiff } from '@/lab/fixtures/labeled-diffs/conventions/v2/0009-any-typing';
import { anyTypingAndFileMisplacedDiff } from '@/lab/fixtures/labeled-diffs/conventions/v2/0010-any-typing-and-file-misplaced';
import { noUseClientDiff } from '@/lab/fixtures/labeled-diffs/conventions/v2/0011-no-use-client';
import { noUseClientAndWrongComponentNamingDiff } from '@/lab/fixtures/labeled-diffs/conventions/v2/0012-no-use-client-and-wrong-component-naming';
import { noUseClientAndWrongFilePlaceDiff } from '@/lab/fixtures/labeled-diffs/conventions/v2/0013-no-use-client-and-wrong-file-place';
import { noUseClientWrongFilePlaceAndComponentNamingDiff } from '@/lab/fixtures/labeled-diffs/conventions/v2/0014-no-use-client-wrong-file-place-and-component-naming';
import { wrongCssVariableNamingDiff } from '@/lab/fixtures/labeled-diffs/conventions/v2/0015-wrong-css-variable-naming';
import { hookWithPascalCaseDiff } from '@/lab/fixtures/labeled-diffs/conventions/v2/0016-hook-with-pascal-case';
import { wrongCssVariableAndAnyTypingDiff } from '@/lab/fixtures/labeled-diffs/conventions/v2/0017-wrong-css-variable-and-any-typing';
import { wrongFilePlaceAndWrongCssNamingDiff } from '@/lab/fixtures/labeled-diffs/conventions/v2/0018-wrong-file-place-and-wrong-css-naming';
import { wrongFilePlaceNamingAndNoUseClientDiff } from '@/lab/fixtures/labeled-diffs/conventions/v2/0019-wrong-file-place-naming-and-no-use-client';
import { wrongHookNamingInsideDiff } from '@/lab/fixtures/labeled-diffs/conventions/v2/0020-wrong-hook-naming-inside';

export const conventionsLabeledDiffsV2: LabeledDiff[] = [
  respectsConventionsDiff,
  wrongFileNamingDiff,
  wrongComponentNamingDiff,
  wrongFileAndComponentNamingDiff,
  moduleMisplacedInComponentsDiff,
  moduleMisplacedInHooksDiff,
  fileWrongPlaceAndNamingDiff,
  fileMisplacedWrongComponentNamingDiff,
  anyTypingDiff,
  anyTypingAndFileMisplacedDiff,
  noUseClientDiff,
  noUseClientAndWrongComponentNamingDiff,
  noUseClientAndWrongFilePlaceDiff,
  noUseClientWrongFilePlaceAndComponentNamingDiff,
  wrongCssVariableNamingDiff,
  hookWithPascalCaseDiff,
  wrongCssVariableAndAnyTypingDiff,
  wrongFilePlaceAndWrongCssNamingDiff,
  wrongFilePlaceNamingAndNoUseClientDiff,
  wrongHookNamingInsideDiff,
];
