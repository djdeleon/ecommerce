export function generateGeographicCode(provinceName: string): string {
  // 1. Normalize: lowercase, remove special accents, hyphens, and spaces
  const cleanName = provinceName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Removes accents
    .replace(/[^a-zA-Z]/g, "")      // Removes spaces, dashes, numbers
    .toLowerCase();

  // 2. Strict edge cases where generic rules create duplicates or bad codes
  const structuralOverrides: Record<string, string> = {
    lajunion: 'LUN', 
    bataan: 'BTN',
    batanes: 'BTS', // Prevents clashing with Bataan
  };

  if (structuralOverrides[cleanName]) {
    return structuralOverrides[cleanName];
  }

  // 3. Extract consonants only
  const consonants = cleanName.replace(/[aeiou]/g, "");

  // 4. Fallback generation rule
  let code = "";
  if (consonants.length >= 3) {
    // Standard rule: First 3 consonants (e.g., Pampanga -> pmpng -> PMP)
    code = consonants.substring(0, 3).toUpperCase();
  } else {
    // Fallback for short words: First 3 letters of the clean name uppercase
    code = cleanName.substring(0, 3).toUpperCase();
  }

  return code;
}
