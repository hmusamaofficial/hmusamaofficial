import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";
const PROFILE_LOGIN = "hmusamaofficial";
const MAX_ORGANIZATIONS = 6;
const START_MARKER = "<!-- AUTO-PROFESSIONAL-FOOTPRINT:START -->";
const END_MARKER = "<!-- AUTO-PROFESSIONAL-FOOTPRINT:END -->";
const README_PATH = fileURLToPath(new URL("../README.md", import.meta.url));

const token = process.env.GITHUB_TOKEN?.trim();

if (!token) {
  throw new Error("GITHUB_TOKEN is required to refresh the professional footprint.");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function compareLogins(left, right) {
  const a = left.toLowerCase();
  const b = right.toLowerCase();

  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

async function graphql(query, variables) {
  const response = await fetch(GITHUB_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": `${PROFILE_LOGIN}-profile-updater`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ query, variables }),
  });

  const responseText = await response.text();
  let payload;

  try {
    payload = JSON.parse(responseText);
  } catch {
    throw new Error(`GitHub GraphQL returned invalid JSON (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(`GitHub GraphQL request failed with HTTP ${response.status}.`);
  }

  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    const messages = payload.errors.map((error) => error.message).join("; ");
    throw new Error(`GitHub GraphQL error: ${messages}`);
  }

  if (!payload.data || typeof payload.data !== "object") {
    throw new Error("GitHub GraphQL response did not contain a valid data object.");
  }

  return payload.data;
}

function contributionWindow() {
  const to = new Date();
  const from = new Date(to.getTime() - 365 * 24 * 60 * 60 * 1000);

  return { from: from.toISOString(), to: to.toISOString() };
}

async function fetchProfileData() {
  const query = `
    query ProfileFootprint($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        company
        contributionsCollection(from: $from, to: $to) {
          restrictedContributionsCount
          commitContributionsByRepository(maxRepositories: 100) {
            contributions(first: 1) { totalCount }
            repository {
              isPrivate
              owner {
                __typename
                login
                avatarUrl(size: 96)
                url
                ... on Organization { name }
              }
            }
          }
          pullRequestContributionsByRepository(maxRepositories: 100) {
            contributions(first: 1) { totalCount }
            repository {
              isPrivate
              owner {
                __typename
                login
                avatarUrl(size: 96)
                url
                ... on Organization { name }
              }
            }
          }
          issueContributionsByRepository(maxRepositories: 100) {
            contributions(first: 1) { totalCount }
            repository {
              isPrivate
              owner {
                __typename
                login
                avatarUrl(size: 96)
                url
                ... on Organization { name }
              }
            }
          }
        }
      }
    }
  `;

  const data = await graphql(query, {
    login: PROFILE_LOGIN,
    ...contributionWindow(),
  });

  const user = data.user;
  const collection = user?.contributionsCollection;
  const contributionFields = [
    "commitContributionsByRepository",
    "pullRequestContributionsByRepository",
    "issueContributionsByRepository",
  ];

  if (!user || !collection) {
    throw new Error(`GitHub did not return profile contribution data for ${PROFILE_LOGIN}.`);
  }

  if (
    !Number.isInteger(collection.restrictedContributionsCount) ||
    collection.restrictedContributionsCount < 0
  ) {
    throw new Error("GitHub response contains an invalid restricted contribution count.");
  }

  for (const field of contributionFields) {
    if (!Array.isArray(collection[field])) {
      throw new Error(`GitHub response is missing the expected ${field} array.`);
    }
  }

  return { user, collection, contributionFields };
}

async function resolveCompanyOrganization(company) {
  const match = company?.trim().match(/^@([a-z\d](?:[a-z\d-]{0,37}[a-z\d])?)$/i);

  if (!match) return null;

  const data = await graphql(
    `
      query CompanyOrganization($login: String!) {
        organization(login: $login) {
          login
          name
          avatarUrl(size: 96)
          url
        }
      }
    `,
    { login: match[1] },
  );

  return data.organization ?? null;
}

function collectOrganizations(collection, contributionFields) {
  const organizations = new Map();

  for (const field of contributionFields) {
    for (const entry of collection[field]) {
      const repository = entry?.repository;
      const owner = repository?.owner;
      const count = entry?.contributions?.totalCount;

      if (
        repository?.isPrivate !== false ||
        owner?.__typename !== "Organization" ||
        typeof owner.login !== "string" ||
        typeof owner.url !== "string" ||
        typeof owner.avatarUrl !== "string" ||
        !Number.isInteger(count) ||
        count <= 0
      ) {
        continue;
      }

      const key = owner.login.toLowerCase();
      const existing = organizations.get(key);

      if (existing) {
        existing.relevance += count;
      } else {
        organizations.set(key, {
          login: owner.login,
          name: owner.name?.trim() || owner.login,
          url: owner.url,
          avatarUrl: owner.avatarUrl,
          relevance: count,
        });
      }
    }
  }

  return [...organizations.values()]
    .sort((left, right) => {
      if (right.relevance !== left.relevance) {
        return right.relevance - left.relevance;
      }

      return compareLogins(left.login, right.login);
    })
    .slice(0, MAX_ORGANIZATIONS);
}

function affiliationMarkup(company, companyOrganization) {
  if (!company?.trim()) {
    return "<p><strong>Public GitHub affiliation:</strong> Not listed.</p>";
  }

  if (!companyOrganization) {
    return `<p><strong>Public GitHub affiliation:</strong> ${escapeHtml(company.trim())}</p>`;
  }

  const name = companyOrganization.name?.trim() || companyOrganization.login;
  const alt = `${name} organization avatar`;

  return [
    "<p>",
    "  <strong>Public GitHub affiliation:</strong>",
    `  <a href="${escapeHtml(companyOrganization.url)}"><img src="${escapeHtml(companyOrganization.avatarUrl)}" width="24" height="24" align="center" alt="${escapeHtml(alt)}" /> ${escapeHtml(name)} (@${escapeHtml(companyOrganization.login)})</a>`,
    "</p>",
  ].join("\n");
}

function organizationTable(organizations) {
  if (organizations.length === 0) {
    return "<p><strong>Recent public organization activity:</strong> No organization-owned repositories were returned by GitHub for the selected public contribution window.</p>";
  }

  const rows = [];

  for (let index = 0; index < organizations.length; index += 3) {
    const cells = organizations.slice(index, index + 3).map((organization) => {
      const alt = `${organization.name} organization avatar`;

      return [
        "    <td align=\"center\" width=\"33%\">",
        `      <a href="${escapeHtml(organization.url)}"><img src="${escapeHtml(organization.avatarUrl)}" width="56" height="56" alt="${escapeHtml(alt)}" /><br /><strong>${escapeHtml(organization.name)}</strong><br /><sub>@${escapeHtml(organization.login)}</sub></a>`,
        "    </td>",
      ].join("\n");
    });

    rows.push(["  <tr>", ...cells, "  </tr>"].join("\n"));
  }

  return [
    "<p><strong>Recent public organization activity:</strong></p>",
    "<table>",
    ...rows,
    "</table>",
  ].join("\n");
}

function generatedFootprint({
  company,
  companyOrganization,
  hasRestrictedContributions,
  organizations,
}) {
  const apiLimitation = hasRestrictedContributions
    ? "GitHub reports additional private contributions but does not expose their organization details to this workflow."
    : "GitHub exposes only contribution details visible to this workflow token, so private organization activity may be absent.";

  return [
    affiliationMarkup(company, companyOrganization),
    "",
    organizationTable(organizations),
    "",
    `<sub>Organizations are included only when GitHub verifies recent public commit, pull-request, or issue activity in an organization-owned repository. Contribution activity does not imply employment. ${apiLimitation} Texinnova ERPX experience is described separately below.</sub>`,
  ].join("\n");
}

function replaceMarkedSection(readme, generated) {
  const startIndex = readme.indexOf(START_MARKER);
  const endIndex = readme.indexOf(END_MARKER);

  if (
    startIndex === -1 ||
    endIndex === -1 ||
    startIndex !== readme.lastIndexOf(START_MARKER) ||
    endIndex !== readme.lastIndexOf(END_MARKER) ||
    endIndex <= startIndex
  ) {
    throw new Error("README.md must contain exactly one valid professional-footprint marker pair.");
  }

  const before = readme.slice(0, startIndex + START_MARKER.length);
  const after = readme.slice(endIndex);

  return `${before}\n${generated}\n${after}`;
}

async function main() {
  const readme = await readFile(README_PATH, "utf8");
  const { user, collection, contributionFields } = await fetchProfileData();
  const companyOrganization = await resolveCompanyOrganization(user.company);
  const organizations = collectOrganizations(collection, contributionFields);
  const generated = generatedFootprint({
    company: user.company,
    companyOrganization,
    hasRestrictedContributions: collection.restrictedContributionsCount > 0,
    organizations,
  });
  const updatedReadme = replaceMarkedSection(readme, generated);

  if (updatedReadme === readme) {
    console.log("Professional footprint is already up to date.");
    return;
  }

  await writeFile(README_PATH, updatedReadme, "utf8");
  console.log(`Updated professional footprint with ${organizations.length} verified public organization(s).`);
}

await main();
