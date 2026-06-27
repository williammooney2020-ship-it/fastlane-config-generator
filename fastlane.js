"use strict";

// ── State ───────────────────────────────────────────────────────────────────
const STATE = {
  // Appfile
  app_identifier: "",
  apple_id: "",
  team_name: "",
  team_id: "",
  itc_team_name: "",
  itc_team_id: "",
  workspace: "",
  xcodeproj: "",
  scheme: "",

  // Matchfile
  match_git_url: "",
  storage_mode: "git",        // git | google_cloud | s3 | gitlab_secure_files
  match_type: "appstore",     // development | adhoc | appstore | enterprise
  match_app_identifier: "",   // comma-separated or same as app_identifier
  match_username: "",
  match_team_id: "",
  match_team_name: "",
  keychain_name: "login.keychain",
  shallow_clone: false,
  clone_branch_directly: false,
  force_for_new_devices: false,
  readonly: false,
  verbose: false,

  // s3 options
  s3_bucket: "",
  s3_region: "us-east-1",
  s3_prefix: "",

  // Google Cloud
  google_cloud_bucket_name: "",
  google_cloud_project_id: "",

  // Active tab
  tab: "appfile",
};

function el(id) { return document.getElementById(id); }
function val(id) { const e = el(id); return e ? e.value : ""; }
function checked(id) { const e = el(id); return e ? e.checked : false; }

// ── Tabs ────────────────────────────────────────────────────────────────────
function switchTab(tab) {
  STATE.tab = tab;
  ["appfile","matchfile","gemfile"].forEach(t => {
    el("tab_" + t).classList.toggle("active", t === tab);
    el("panel_" + t).style.display = t === tab ? "" : "none";
  });
  generate();
}

// ── Storage mode ─────────────────────────────────────────────────────────────
function onStorageMode(val) {
  STATE.storage_mode = val;
  el("panel_git").style.display = val === "git" ? "" : "none";
  el("panel_s3").style.display = val === "s3" ? "" : "none";
  el("panel_gcs").style.display = val === "google_cloud" ? "" : "none";
  generate();
}

// ── Collect + Generate ───────────────────────────────────────────────────────
function collect() {
  // Appfile
  STATE.app_identifier = val("app_identifier");
  STATE.apple_id       = val("apple_id");
  STATE.team_name      = val("team_name");
  STATE.team_id        = val("team_id");
  STATE.itc_team_name  = val("itc_team_name");
  STATE.itc_team_id    = val("itc_team_id");
  STATE.workspace      = val("workspace");
  STATE.xcodeproj      = val("xcodeproj");
  STATE.scheme         = val("scheme");

  // Matchfile
  STATE.match_git_url           = val("match_git_url");
  STATE.storage_mode            = val("storage_mode") || STATE.storage_mode;
  STATE.match_type              = val("match_type") || STATE.match_type;
  STATE.match_app_identifier    = val("match_app_identifier");
  STATE.match_username          = val("match_username");
  STATE.match_team_id           = val("match_team_id");
  STATE.match_team_name         = val("match_team_name");
  STATE.keychain_name           = val("keychain_name");
  STATE.shallow_clone           = checked("shallow_clone");
  STATE.clone_branch_directly   = checked("clone_branch_directly");
  STATE.force_for_new_devices   = checked("force_for_new_devices");
  STATE.readonly                = checked("readonly");
  STATE.verbose                 = checked("verbose");
  STATE.s3_bucket               = val("s3_bucket");
  STATE.s3_region               = val("s3_region");
  STATE.s3_prefix               = val("s3_prefix");
  STATE.google_cloud_bucket_name= val("gcs_bucket");
  STATE.google_cloud_project_id = val("gcs_project");
}

function q(s) {
  // quote a string for Ruby (single-quoted)
  return `"${s.replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"`;
}

function multiId(raw) {
  // if comma-separated → Ruby array; else single string
  const parts = raw.split(",").map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) return q(parts[0]);
  return "[" + parts.map(q).join(", ") + "]";
}

function generateAppfile() {
  const lines = [];
  lines.push("# Appfile");
  lines.push("# https://docs.fastlane.tools/advanced/Appfile/");
  lines.push("");

  if (STATE.app_identifier) lines.push(`app_identifier(${q(STATE.app_identifier)})`);
  if (STATE.apple_id)       lines.push(`apple_id(${q(STATE.apple_id)})`);

  if (STATE.team_name || STATE.team_id) {
    lines.push("");
    lines.push("# Developer Portal team");
    if (STATE.team_name) lines.push(`team_name(${q(STATE.team_name)})`);
    if (STATE.team_id)   lines.push(`team_id(${q(STATE.team_id)})`);
  }

  if (STATE.itc_team_name || STATE.itc_team_id) {
    lines.push("");
    lines.push("# App Store Connect team");
    if (STATE.itc_team_name) lines.push(`itc_team_name(${q(STATE.itc_team_name)})`);
    if (STATE.itc_team_id)   lines.push(`itc_team_id(${q(STATE.itc_team_id)})`);
  }

  if (STATE.workspace || STATE.xcodeproj || STATE.scheme) {
    lines.push("");
    lines.push("# Xcode project");
    if (STATE.workspace)  lines.push(`workspace(${q(STATE.workspace)})`);
    if (STATE.xcodeproj)  lines.push(`xcodeproj(${q(STATE.xcodeproj)})`);
    if (STATE.scheme)     lines.push(`scheme(${q(STATE.scheme)})`);
  }

  if (lines.length === 3) {
    lines.push("# Fill in your app details above.");
  }

  return lines.join("\n");
}

function generateMatchfile() {
  const lines = [];
  lines.push("# Matchfile");
  lines.push("# https://docs.fastlane.tools/actions/match/");
  lines.push("");

  // Storage
  lines.push(`storage_mode(${q(STATE.storage_mode)})`);

  if (STATE.storage_mode === "git" && STATE.match_git_url) {
    lines.push(`git_url(${q(STATE.match_git_url)})`);
  }
  if (STATE.storage_mode === "s3") {
    if (STATE.s3_bucket) lines.push(`s3_bucket(${q(STATE.s3_bucket)})`);
    if (STATE.s3_region) lines.push(`s3_region(${q(STATE.s3_region)})`);
    if (STATE.s3_prefix) lines.push(`s3_prefix(${q(STATE.s3_prefix)})`);
  }
  if (STATE.storage_mode === "google_cloud") {
    if (STATE.google_cloud_bucket_name) lines.push(`google_cloud_bucket_name(${q(STATE.google_cloud_bucket_name)})`);
    if (STATE.google_cloud_project_id)  lines.push(`google_cloud_project_id(${q(STATE.google_cloud_project_id)})`);
  }

  lines.push("");

  // Type & identifiers
  lines.push(`type(${q(STATE.match_type)})`);
  const appId = multiId(STATE.match_app_identifier || STATE.app_identifier);
  if (appId) lines.push(`app_identifier(${appId})`);

  lines.push("");

  // Team / user
  if (STATE.match_username || STATE.apple_id)
    lines.push(`username(${q(STATE.match_username || STATE.apple_id)})`);
  if (STATE.match_team_id || STATE.team_id)
    lines.push(`team_id(${q(STATE.match_team_id || STATE.team_id)})`);
  if (STATE.match_team_name || STATE.team_name)
    lines.push(`team_name(${q(STATE.match_team_name || STATE.team_name)})`);

  // Keychain
  lines.push("");
  lines.push(`keychain_name(${q(STATE.keychain_name || "login.keychain")})`);

  // Booleans — only emit if non-default
  const bools = [
    ["shallow_clone",         STATE.shallow_clone,         false],
    ["clone_branch_directly", STATE.clone_branch_directly, false],
    ["force_for_new_devices", STATE.force_for_new_devices, false],
    ["readonly",              STATE.readonly,              false],
    ["verbose",               STATE.verbose,               false],
  ];
  const nonDefault = bools.filter(([,v,def]) => v !== def);
  if (nonDefault.length > 0) {
    lines.push("");
    nonDefault.forEach(([key, val]) => {
      lines.push(`${key}(${val})`);
    });
  }

  return lines.join("\n");
}

function generateGemfile() {
  return `# Gemfile
# Place this in the root of your project (next to fastlane/).
# Run: bundle install

source "https://rubygems.org"

gem "fastlane"

# Uncomment plugins you use:
# gem "fastlane-plugin-versioning"
# gem "fastlane-plugin-firebase_app_distribution"
# gem "fastlane-plugin-appcenter"
# gem "fastlane-plugin-increment_build_number_in_xcodeproj"

# Lock Ruby version (optional but recommended for CI):
# ruby "3.2.2"
`;
}

function generate() {
  collect();
  let text = "";
  if (STATE.tab === "appfile")   text = generateAppfile();
  if (STATE.tab === "matchfile") text = generateMatchfile();
  if (STATE.tab === "gemfile")   text = generateGemfile();
  el("output").textContent = text;
  const filename = STATE.tab === "appfile" ? "fastlane/Appfile"
                 : STATE.tab === "matchfile" ? "fastlane/Matchfile"
                 : "Gemfile";
  el("filenameBadge").textContent = filename;
}

// ── Copy / Download ──────────────────────────────────────────────────────────
function copyOutput() {
  const text = el("output").textContent;
  navigator.clipboard.writeText(text).then(() => {
    const b = el("copyBtn");
    const orig = b.textContent;
    b.textContent = "Copied!";
    setTimeout(() => { b.textContent = orig; }, 1500);
  });
}

function downloadOutput() {
  const text = el("output").textContent;
  const name = STATE.tab === "appfile" ? "Appfile"
             : STATE.tab === "matchfile" ? "Matchfile"
             : "Gemfile";
  const blob = new Blob([text], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
}

document.addEventListener("DOMContentLoaded", () => {
  onStorageMode("git");
  switchTab("appfile");
});
