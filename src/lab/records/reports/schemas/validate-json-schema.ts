/**
 * Minimal, explicit JSON Schema (draft 2020-12 subset) validator — no external dependency.
 *
 * `ajv` is present in node_modules only as a transitive dependency of prisma tooling, not
 * declared in package.json — importing it directly would be fragile (it can disappear on
 * an unrelated dependency bump). This implements only the keywords judge-study-export.schema.json
 * actually uses: $ref/$defs, type (incl. nullable arrays), enum, const, oneOf, properties,
 * required, additionalProperties, items, minimum/maximum, pattern. Not a general-purpose
 * validator — `format` is accepted but not enforced (descriptive only).
 */

export type JsonSchema = Record<string, unknown>;

interface Context {
  defs: Record<string, JsonSchema>;
}

const resolveRef = (ref: string, ctx: Context): JsonSchema => {
  const match = /^#\/\$defs\/(.+)$/.exec(ref);
  if (!match) throw new Error(`Unsupported $ref: ${ref}`);
  const def = ctx.defs[match[1]!];
  if (!def) throw new Error(`Unknown $ref target: ${ref}`);
  return def;
};

const typeOf = (value: unknown): string => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
};

export const validate = (schema: JsonSchema, data: unknown, ctx: Context, path = '$'): string[] => {
  if (typeof schema.$ref === 'string') {
    return validate(resolveRef(schema.$ref, ctx), data, ctx, path);
  }

  const errors: string[] = [];

  if (Array.isArray(schema.oneOf)) {
    const branchResults = (schema.oneOf as JsonSchema[]).map((sub) => validate(sub, data, ctx, path));
    const matches = branchResults.filter((r) => r.length === 0);
    if (matches.length !== 1) {
      errors.push(
        `${path}: expected exactly one oneOf branch to match, got ${matches.length} ` +
          `(branch errors: ${JSON.stringify(branchResults)})`,
      );
    }
    return errors;
  }

  if (schema.type !== undefined) {
    const types: string[] = Array.isArray(schema.type) ? (schema.type as string[]) : [schema.type as string];
    const actual = typeOf(data);
    const candidates = actual === 'number' && Number.isInteger(data) ? ['integer', 'number'] : [actual];
    const ok = types.some((t) => candidates.includes(t));
    if (!ok) {
      errors.push(`${path}: expected type ${types.join('|')}, got ${actual}`);
      return errors;
    }
  }

  if (schema.enum !== undefined) {
    const options = schema.enum as unknown[];
    if (!options.includes(data)) {
      errors.push(`${path}: value ${JSON.stringify(data)} not in enum ${JSON.stringify(options)}`);
    }
  }

  if (schema.const !== undefined && data !== schema.const) {
    errors.push(`${path}: expected const ${JSON.stringify(schema.const)}, got ${JSON.stringify(data)}`);
  }

  if (typeof data === 'number') {
    if (typeof schema.minimum === 'number' && data < schema.minimum) {
      errors.push(`${path}: ${data} is below minimum ${schema.minimum}`);
    }
    if (typeof schema.maximum === 'number' && data > schema.maximum) {
      errors.push(`${path}: ${data} is above maximum ${schema.maximum}`);
    }
  }

  if (typeof data === 'string' && typeof schema.pattern === 'string') {
    if (!new RegExp(schema.pattern).test(data)) {
      errors.push(`${path}: "${data}" does not match pattern ${schema.pattern}`);
    }
  }

  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    for (const key of (schema.required as string[] | undefined) ?? []) {
      if (!(key in obj)) errors.push(`${path}: missing required property "${key}"`);
    }
    const properties = schema.properties as Record<string, JsonSchema> | undefined;
    if (properties) {
      for (const [key, subSchema] of Object.entries(properties)) {
        if (key in obj) {
          errors.push(...validate(subSchema, obj[key], ctx, `${path}.${key}`));
        }
      }
    }
    if (schema.additionalProperties === false) {
      const allowed = new Set(Object.keys(properties ?? {}));
      for (const key of Object.keys(obj)) {
        if (!allowed.has(key)) errors.push(`${path}: unexpected additional property "${key}"`);
      }
    }
  }

  if (Array.isArray(data) && schema.items) {
    data.forEach((item, i) => {
      errors.push(...validate(schema.items as JsonSchema, item, ctx, `${path}[${i}]`));
    });
  }

  return errors;
};

/** Validates `data` against a full schema document (top-level schema + its own $defs). */
export const validateAgainstSchema = (schema: JsonSchema, data: unknown): string[] => {
  const ctx: Context = { defs: (schema.$defs as Record<string, JsonSchema>) ?? {} };
  return validate(schema, data, ctx, '$');
};
