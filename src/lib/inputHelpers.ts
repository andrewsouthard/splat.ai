/**
 * Estimates token count for base64-encoded images or text files with auto-detection.
 * 
 * @param input The base64-encoded content or plain text
 * @returns Estimated token count
 */
export function estimateTokenCount(input: string): number {
  if (input.startsWith('data:image/')) {
    // Base64 encoding increases size by ~33%
    // Most LLMs use ~1 token per 4-6 characters for base64
    // We'll use 5 as our divisor for a good approximation
    // Remove the data URL prefix if it exists
    const base64Data = input.split(',').pop() || input;
    return Math.ceil(base64Data.length / 5);
  }

  // For text:
  // Most LLMs use roughly ~4 characters per token for English
  // (varies by model but works as approximation)

  // Simple token count estimation for text
  let tokenCount = 0;

  // Split by common token boundaries
  const words = input.split(/\s+/);

  for (const word of words) {
    if (word.length === 0) continue;

    // Longer words tend to be split into multiple tokens
    // Numbers, punctuation, and special characters typically count as separate tokens
    if (word.length <= 4) {
      tokenCount += 1;
    } else {
      // Estimate longer words as 1 token per 4 characters
      tokenCount += Math.ceil(word.length / 4);
    }

    // Add extra tokens for punctuation at end of words
    if (/[.,!?;:]$/.test(word)) {
      tokenCount += 0.5; // Punctuation often shares tokens or forms its own
    }
  }

  // Round to nearest integer
  return Math.round(tokenCount);
}

/**
 * Determines if a string is likely a base64-encoded image.
 * 
 * @param input The string to check
 * @returns Boolean indicating if the input is likely a base64-encoded image
 */
function isBase64EncodedImage(input: string): boolean {
  // Check for data URL pattern
  if (input.startsWith('data:image/')) {
    return true;
  }

  // Check if it's a raw base64 string (without data URL)
  // Base64 strings are typically long and contain only specific characters
  if (input.length > 100) { // Arbitrary minimum length for images
    // Base64 character set: A-Z, a-z, 0-9, +, /, = (for padding)
    const base64Regex = /^[A-Za-z0-9+/=]+$/;

    // Check if string conforms to base64 character set
    if (base64Regex.test(input)) {
      // Check if the string has appropriate padding
      // Base64 strings are padded with '=' to make length a multiple of 4
      if (input.length % 4 === 0) {
        // Final check - most text content wouldn't be valid base64 and
        // would have spaces, punctuation, etc.
        return !(/\s/.test(input)) && input.length > 500; // Likely an image if long enough
      }
    }
  }

  return false;
}

export async function uint8ArrayToBase64(arr: Uint8Array) {
  const blob = new Blob([arr]);

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        resolve(reader.result.toString());
      } else {
        reject(new Error("Failed to convert blob to base64"));
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(blob);
  });
};

export function convertBase64ToPlaintext(base64String: string) {
  try {
    // Grab the substring that contains the base64 string
    const sub = base64String.split(";")[1].replace("base64,", "");
    // Decode base64 to binary string
    const binaryString = atob(sub);

    // Convert binary string to Uint8Array
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Convert bytes to text using TextDecoder
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(bytes);
    return text;
  } catch (e) {
    console.error(e)
    console.error("Error parsing file!")
    throw new Error("Failed to parse file")
  }
}


export function detectMimeTypeFromSignature(uint8Array: Uint8Array) {
  // Simple examples of file signatures
  if (uint8Array.length >= 4) {
    // PNG: 89 50 4E 47
    if (uint8Array[0] === 0x89 && uint8Array[1] === 0x50 &&
      uint8Array[2] === 0x4E && uint8Array[3] === 0x47) {
      return 'image/png';
    }

    // JPEG/JPG: FF D8 FF
    if (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8 && uint8Array[2] === 0xFF) {
      return 'image/jpeg'; // Note: 'image/jpg' is not standard, 'image/jpeg' covers both .jpg and .jpeg
    }

    // PDF: 25 50 44 46
    if (uint8Array[0] === 0x25 && uint8Array[1] === 0x50 &&
      uint8Array[2] === 0x44 && uint8Array[3] === 0x46) {
      return 'application/pdf';
    }

    // GIF: 47 49 46 38
    if (uint8Array[0] === 0x47 && uint8Array[1] === 0x49 &&
      uint8Array[2] === 0x46 && uint8Array[3] === 0x38) {
      return 'image/gif';
    }

    // WebP: 52 49 46 46 (RIFF) + 8 bytes + 57 45 42 50 (WEBP)
    if (uint8Array[0] === 0x52 && uint8Array[1] === 0x49 &&
      uint8Array[2] === 0x46 && uint8Array[3] === 0x46 &&
      uint8Array.length >= 12 &&
      uint8Array[8] === 0x57 && uint8Array[9] === 0x45 &&
      uint8Array[10] === 0x42 && uint8Array[11] === 0x50) {
      return 'image/webp';
    }

    // XML: Check for <?xml
    if (uint8Array[0] === 0x3C && uint8Array[1] === 0x3F &&
      uint8Array[2] === 0x78 && uint8Array[3] === 0x6D &&
      uint8Array[4] === 0x6C) {
      return 'application/xml';
    }

    // HTML: Check for <!DOCTYPE html> or <html
    if ((uint8Array[0] === 0x3C && uint8Array[1] === 0x21 &&
      uint8Array[2] === 0x44 && uint8Array[3] === 0x4F &&
      uint8Array[4] === 0x43 && uint8Array[5] === 0x54 &&
      uint8Array[6] === 0x59 && uint8Array[7] === 0x50 &&
      uint8Array[8] === 0x45 && uint8Array[9] === 0x20 &&
      uint8Array[10] === 0x68 && uint8Array[11] === 0x74 &&
      uint8Array[12] === 0x6D && uint8Array[13] === 0x6C) ||
      (uint8Array[0] === 0x3C && uint8Array[1] === 0x68 &&
        uint8Array[2] === 0x74 && uint8Array[3] === 0x6D &&
        uint8Array[4] === 0x6C)) {
      return 'text/html';
    }

    // JSON: Check for open bracket at beginning (simple check)
    if (uint8Array[0] === 0x7B) { // '{'
      // Try to parse it as JSON
      try {
        // Convert first chunk to a string and try to parse
        const testStr = new TextDecoder().decode(uint8Array.slice(0, Math.min(100, uint8Array.length)));
        JSON.parse(testStr.trim() === '{' ? '{}' : testStr);
        return 'application/json';
      } catch (e) {
        // Not valid JSON
      }
    }

    // UTF-8 BOM
    if (uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF) {
      return 'text/plain; charset=utf-8';
    }

    // UTF-16 BOM (Big Endian)
    if (uint8Array[0] === 0xFE && uint8Array[1] === 0xFF) {
      return 'text/plain; charset=utf-16be';
    }

    // UTF-16 BOM (Little Endian)
    if (uint8Array[0] === 0xFF && uint8Array[1] === 0xFE) {
      return 'text/plain; charset=utf-16le';
    }
  }

  // If we've made it here, perform a text detection heuristic
  if (isLikelyText(uint8Array)) {
    return 'text/plain';
  }

  return null; // Unknown type based on signature
}

// Function to determine if a file is likely a text document
function isLikelyText(uint8Array: Uint8Array) {
  // Only check a reasonable sample of the file
  const sampleSize = Math.min(uint8Array.length, 512);
  let textCharCount = 0;
  let binaryCharCount = 0;

  // Check for common text file characteristics
  for (let i = 0; i < sampleSize; i++) {
    const byte = uint8Array[i];

    // Common ASCII text chars (including newlines, tabs)
    if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
      textCharCount++;
    }
    // Binary chars or control chars that aren't whitespace
    else if (byte < 9 || (byte > 13 && byte < 32) || byte === 0) {
      binaryCharCount++;
    }
  }

  // If over 90% of the sampled bytes are text characters, likely a text file
  return (textCharCount / sampleSize) > 0.9;
}





