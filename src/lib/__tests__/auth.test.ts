// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";
import { TextEncoder } from "util";
import { SignJWT } from "jose";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

async function makeValidToken(payload: object, expiresIn = "7d") {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

function makeNextRequest(token?: string) {
  return {
    cookies: {
      get: (name: string) =>
        name === "auth-token" && token ? { value: token } : undefined,
    },
  } as unknown as import("next/server").NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.JWT_SECRET;
});

// ─── createSession ────────────────────────────────────────────────────────────

test("createSession sets an httpOnly cookie", async () => {
  const { createSession } = await import("@/lib/auth");

  await createSession("user-1", "test@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledOnce();
  const [name, , options] = mockCookieStore.set.mock.calls[0];
  expect(name).toBe("auth-token");
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
});

test("createSession sets secure=true in production", async () => {
  const { createSession } = await import("@/lib/auth");
  process.env.NODE_ENV = "production";

  await createSession("user-1", "test@example.com");

  const [, , options] = mockCookieStore.set.mock.calls[0];
  expect(options.secure).toBe(true);
});

test("createSession token contains userId and email", async () => {
  const { jwtVerify } = await import("jose");
  const { createSession } = await import("@/lib/auth");

  await createSession("user-42", "hello@example.com");

  const [, token] = mockCookieStore.set.mock.calls[0];
  const { payload } = await jwtVerify(token, JWT_SECRET);
  expect(payload.userId).toBe("user-42");
  expect(payload.email).toBe("hello@example.com");
});

test("createSession cookie expires ~7 days from now", async () => {
  const { createSession } = await import("@/lib/auth");
  const before = Date.now();

  await createSession("user-1", "test@example.com");

  const [, , options] = mockCookieStore.set.mock.calls[0];
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const diff = options.expires.getTime() - before;
  expect(diff).toBeGreaterThanOrEqual(sevenDaysMs - 1000);
  expect(diff).toBeLessThanOrEqual(sevenDaysMs + 1000);
});

// ─── getSession ───────────────────────────────────────────────────────────────

test("getSession returns null when no cookie", async () => {
  const { getSession } = await import("@/lib/auth");
  mockCookieStore.get.mockReturnValue(undefined);

  expect(await getSession()).toBeNull();
});

test("getSession returns null for an invalid token", async () => {
  const { getSession } = await import("@/lib/auth");
  mockCookieStore.get.mockReturnValue({ value: "not.a.valid.token" });

  expect(await getSession()).toBeNull();
});

test("getSession returns null for an expired token", async () => {
  const { getSession } = await import("@/lib/auth");
  const token = await makeValidToken({ userId: "u1", email: "a@b.com" }, "-1s");
  mockCookieStore.get.mockReturnValue({ value: token });

  expect(await getSession()).toBeNull();
});

test("getSession returns payload for a valid token", async () => {
  const { getSession } = await import("@/lib/auth");
  const token = await makeValidToken({ userId: "u1", email: "user@example.com" });
  mockCookieStore.get.mockReturnValue({ value: token });

  const result = await getSession();
  expect(result?.userId).toBe("u1");
  expect(result?.email).toBe("user@example.com");
});

// ─── deleteSession ────────────────────────────────────────────────────────────

test("deleteSession removes the auth-token cookie", async () => {
  const { deleteSession } = await import("@/lib/auth");

  await deleteSession();

  expect(mockCookieStore.delete).toHaveBeenCalledWith("auth-token");
});

// ─── verifySession ────────────────────────────────────────────────────────────

test("verifySession returns null when no cookie", async () => {
  const { verifySession } = await import("@/lib/auth");

  expect(await verifySession(makeNextRequest())).toBeNull();
});

test("verifySession returns null for an invalid token", async () => {
  const { verifySession } = await import("@/lib/auth");

  expect(await verifySession(makeNextRequest("bad.token.here"))).toBeNull();
});

test("verifySession returns null for an expired token", async () => {
  const { verifySession } = await import("@/lib/auth");
  const token = await makeValidToken({ userId: "u1", email: "a@b.com" }, "-1s");

  expect(await verifySession(makeNextRequest(token))).toBeNull();
});

test("verifySession returns payload for a valid token", async () => {
  const { verifySession } = await import("@/lib/auth");
  const token = await makeValidToken({ userId: "u99", email: "verified@example.com" });

  const result = await verifySession(makeNextRequest(token));
  expect(result?.userId).toBe("u99");
  expect(result?.email).toBe("verified@example.com");
});
