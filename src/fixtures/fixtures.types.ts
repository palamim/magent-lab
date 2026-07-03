export interface FixtureInput {
  name: string;
  direction: string;
  conventions: string;
  fileList: string[]; // paths only
  projectRoot: string; // real repo, for the planner's read_file + judge's fetch
}
