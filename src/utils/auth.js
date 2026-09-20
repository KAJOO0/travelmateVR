const AUTH_KEY = "tm_auth_role";

const MOCK_ACCOUNTS = [
  { email: "admin@travelmate.com", password: "admin123", role: "admin" },
  { email: "traveler@travelmate.com", password: "traveler123", role: "customer" },
];

export const login = (email, password) => {
  const account = MOCK_ACCOUNTS.find((a) => a.email === email && a.password === password);
  if (!account) return null;
  localStorage.setItem(AUTH_KEY, account.role);
  return account.role;
};

export const logout = () => {
  localStorage.removeItem(AUTH_KEY);
};

export const getRole = () => localStorage.getItem(AUTH_KEY);

export const isAuthenticated = (role) => {
  const current = getRole();
  return role ? current === role : current !== null;
};
