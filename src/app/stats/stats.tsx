import { compile, CompileOptions } from "prql-js/dist/bundler";

export default async function getStats(): Promise<RepoStats> {
  const res = await fetch("https://raw.githubusercontent.com/pypi-data/data/main/stats/totals.json");

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  const json_res = await res.json();

  const rawPrqlRes = await fetch("https://raw.githubusercontent.com/pypi-data/data/main/sql/_stats.prql");
  const rawPrql = await rawPrqlRes.text();
  const opts = new CompileOptions();
  opts.target = "sql.duckdb";
  opts.format = true;
  opts.signature_comment = false;

  const repo_stats = { sql: {} };
  for (const item of json_res as { name: string; stat: any[] }[]) {
    // @ts-ignore
    repo_stats[item.name] = item.stat;

    if (typeof window === "undefined") {
      continue;
    }

    const sql = compile(`${rawPrql}\nrelation_to_json(${item.name})`, opts);
    if (sql === undefined) {
      throw Error(`Failed to compile PRQL for ${item.name}`);
    }
    // @ts-ignore
    repo_stats.sql[item.name] = sql.replace("$1", "'data_from_the_datasets_page/*.parquet'");
  }
  return repo_stats as RepoStats;
}

export type RepoStats = {
  total_stats: [TotalStat];
  stats_over_time: StatsOverTime[];
  skipped_files_stats: InnerStat[];
  binary_extension_stats: InnerStat[];
  extension_stats: InnerStat[];
  projects_by_files: ProjectStat[];
  skip_reason_stats: SkipReasonStat[];
  binary_sizes: [{ is_binary: boolean; total_files: number; total_size: number }];
  project_level_breakdowns: ProjectLevelBreakdown[];
  new_projects_over_time: [{ month: string; count: number }];
  new_project_versions_over_time: [{ month: string; count: number }];
  new_releases_over_time: [{ month: string; count: number }];

  sql: {
    stats_over_time: string;
    project_level_breakdowns: string;
    binary_sizes: string;
    binary_extension_stats: string;
    projects_by_files: string;
    extension_stats: string;
  };
};

export type TotalStat = {
  total_files: number;
  total_lines: number;
  total_size: number;
  unique_files: number;
};

export type ProjectLevelBreakdown = {
  month: String;
  total_project_uploads: number;
  project_version_releases: number;

  has_pyproject: number;
  has_setup_py: number;
  has_setup_py_and_pyproject: number;
  has_requirements_txt: number;

  init_py_files: number;

  has_markdown: number;
  has_rst: number;

  has_tests: number;
  has_tox: number;
  has_pytest: number;

  has_ini: number;
  has_json: number;
  has_xml: number;
  has_toml: number;
  has_yaml: number;
  has_rust: number;
  has_c_or_cpp: number;

  has_pyi: number;
  has_py_typed: number;
};

export type InnerStat = {
  extension: string;
  total_files: number;
  total_lines: number;
  total_size: number;
  unique_files: number;
};

export type ProjectStat = {
  project_name: string;
  unique_files: number;
  total_files: number;
  total_lines: number;
  total_size: number;
};

export type StatsOverTime = {
  month: string;
  total_files: number;
  total_size: number;
  total_lines: number;
};

export type SkipReasonStat = {
  skip_reason: string;
  total_projects: number;
  count: number;
  unique_files: number;
  total_size: number;
  total_lines: number;
  max_size: number;
  max_lines: number;
};
