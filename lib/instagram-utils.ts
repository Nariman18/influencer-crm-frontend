/**
 * Extracts Instagram username from various URL formats
 */
export const extractInstagramUsername = (input: string): string | null => {
  if (!input || typeof input !== "string") return null;

  const trimmedInput = input.trim();

  // If it's already a username (no URL), return as-is
  if (!trimmedInput.includes("/") && !trimmedInput.includes(".")) {
    return trimmedInput.replace("@", ""); // Remove @ if present
  }

  // Common Instagram URL patterns
  const patterns = [
    // https://www.instagram.com/username/
    /instagram\.com\/([a-zA-Z0-9._]+)(?:\/|$)/,
    // https://instagram.com/username/
    /instagram\.com\/([a-zA-Z0-9._]+)(?:\/|$)/,
    // www.instagram.com/username/
    /instagram\.com\/([a-zA-Z0-9._]+)(?:\/|$)/,
    // instagram.com/username/
    /instagram\.com\/([a-zA-Z0-9._]+)(?:\/|$)/,
    // @username format
    /@([a-zA-Z0-9._]+)/,
  ];

  for (const pattern of patterns) {
    const match = trimmedInput.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // If no pattern matches but it looks like a simple username, return it
  if (/^[a-zA-Z0-9._]+$/.test(trimmedInput)) {
    return trimmedInput;
  }

  return null;
};

/**
 * Validates if a string is a valid Instagram username
 */
export const isValidInstagramUsername = (username: string): boolean => {
  if (!username || typeof username !== "string") return false;

  // Instagram username rules:
  // - 1-30 characters
  // - Only letters, numbers, periods, underscores
  // - Cannot start or end with period
  // - Cannot have consecutive periods
  const usernameRegex = /^(?!.*\.\.)(?!\.)(?!.*\.$)[a-zA-Z0-9._]{1,30}$/;

  return usernameRegex.test(username);
};

/**
 * Cleans and formats Instagram username input
 */
export const formatInstagramInput = (
  input: string
): { username: string | null; isValid: boolean } => {
  const extracted = extractInstagramUsername(input);

  if (!extracted) {
    return { username: null, isValid: false };
  }

  const isValid = isValidInstagramUsername(extracted);
  return { username: extracted, isValid };
};
