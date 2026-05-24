(function () {
  const config = window.KNOCKDOWN_AUTH_CONFIG || {};
  const brokerUrl = config.brokerUrl || "https://knowdown.github.io/orwell/";
  const requireApproval = Boolean(config.requireApproval);
  const tokenKey = config.tokenStorageKey || "gh_token";
  const userKey = config.userStorageKey || "gh_user";

  function readSession(key) {
    try {
      return window.sessionStorage.getItem(key);
    } catch (_error) {
      return null;
    }
  }

  function writeSession(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (_error) {
      // Ignore storage failures and let the broker flow recover.
    }
  }

  function removeSession(key) {
    try {
      window.sessionStorage.removeItem(key);
    } catch (_error) {
      // Ignore storage failures and let the broker flow recover.
    }
  }

  function readUser() {
    const raw = readSession(userKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_error) {
      removeSession(userKey);
      return null;
    }
  }

  function emitChange() {
    window.dispatchEvent(new CustomEvent("knockdown-auth-change", {
      detail: {
        token: readSession(tokenKey),
        user: readUser(),
      },
    }));
  }

  function clearSession() {
    removeSession(tokenKey);
    removeSession(userKey);
    emitChange();
  }

  function redirectToSignIn(returnTo = window.location.href) {
    const authUrl = new URL(brokerUrl);
    authUrl.searchParams.set("return_to", returnTo);
    if (requireApproval) authUrl.searchParams.set("require_approval", "1");
    window.location.replace(authUrl.toString());
  }

  const auth = {
    get token() {
      return readSession(tokenKey);
    },
    get user() {
      return readUser();
    },
    hasSession() {
      return Boolean(readSession(tokenKey));
    },
    signOut(returnTo = window.location.href) {
      clearSession();
      redirectToSignIn(returnTo);
    },
    ensureSession() {
      if (!readSession(tokenKey)) redirectToSignIn();
    },
    async refreshUser() {
      const token = readSession(tokenKey);
      if (!token) {
        redirectToSignIn();
        return null;
      }

      const response = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });

      if (!response.ok) {
        clearSession();
        redirectToSignIn();
        throw new Error(`Session validation failed (HTTP ${response.status})`);
      }

      const user = await response.json();
      writeSession(userKey, JSON.stringify(user));
      emitChange();
      return user;
    },
  };

  window.KnockdownAuth = auth;
  auth.ensureSession();
  void auth.refreshUser().catch(() => {});
})();
