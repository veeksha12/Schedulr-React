/**
 * Standardized fetch with exponential backoff for handling 429 (Rate Limit) errors
 */
export const fetchGemini = async (url, options, maxRetries = 3) => {
  let retries = 0;
  let delay = 1000; // Start with 1 second

  while (retries < maxRetries) {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return await response.json();
      }

      if (response.status === 429) {
        retries++;
        // On a 429 (Rate Limit), we need a meaningful wait based on free-tier reset (usually 60s)
        // We'll wait 20s, then 40s, etc. to give the quota a chance to reset.
        const nextDelay = (15000 * Math.pow(2, retries - 1)) + (Math.random() * 5000);
        console.warn(`Gemini API rate limited (429). Quota exhausted. Waiting ${Math.round(nextDelay/1000)}s before retry ${retries}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, nextDelay));
        continue;
      }

      // Handle other errors immediately
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData?.error?.message || `API error: ${response.status}`;
      throw new Error(errorMsg);

    } catch (error) {
      if (retries >= maxRetries || error.message.includes('rate limit') === false) {
        throw error;
      }
      // If it's a network error or something that might be temporary, retry
      retries++;
      await new Promise(resolve => setTimeout(resolve, delay * retries));
    }
  }

  throw new Error('Maximum retries exceeded. Please try again in a minute.');
};
