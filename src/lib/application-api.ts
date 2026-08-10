import type { Application } from "@/lib/crest-data";

const API_URL = "http://localhost:8000";

/**
 * Get new applicants
 * GET /loadata
 */
export async function getApplications(): Promise<Application[]> {
  const response = await fetch(`${API_URL}/loadata`);

  if (!response.ok) {
    throw new Error(
      `Failed to load applications: ${response.status}`
    );
  }

  const data = await response.json();

  return data.map((app: Application) => ({
    ...app,
    status: "new",
  }));
}


/**
 * Get shortlisted applicants
 * GET /loadshortlisted
 */
export async function getShortlistedApplications(): Promise<
  Application[]
> {
  const response = await fetch(
    `${API_URL}/loadshortlisted`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load shortlisted applications: ${response.status}`
    );
  }

  const data = await response.json();

  return data.map((app: Application) => ({
    ...app,
    status: "shortlisted",
  }));
}


/**
 * Get rejected applicants
 * GET /loadrejected
 */
export async function getRejectedApplications(): Promise<
  Application[]
> {
  const response = await fetch(
    `${API_URL}/loadrejected`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load rejected applications: ${response.status}`
    );
  }

  const data = await response.json();

  return data.map((app: Application) => ({
    ...app,
    status: "rejected",
  }));
}


/**
 * Shortlist applicant
 *
 * POST /shortlist/{id}
 */
export async function shortlistApplication(
  id: string
) {
  const response = await fetch(
    `${API_URL}/shortlist/${id}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.detail ||
        `Failed to shortlist application: ${response.status}`
    );
  }

  return response.json();
}


/**
 * Reject applicant
 *
 * POST /reject/{id}
 */
export async function rejectApplication(
  id: string
) {
  const response = await fetch(
    `${API_URL}/reject/${id}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.detail ||
        `Failed to reject application: ${response.status}`
    );
  }

  return response.json();
}