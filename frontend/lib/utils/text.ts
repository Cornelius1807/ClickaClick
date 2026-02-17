// Normalizador de texto: minúsculas, sin tildes, limpieza

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD') // Descomponer caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos
    .replace(/[^\w\s]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, ' '); // Normalizar espacios
}

// Mapeo de sinónimos peruanos
const PERUVIAN_SYNONYMS: Record<string, string[]> = {
  celular: ['celu', 'equipo', 'dispositivo', 'móvil', 'fono'],
  whatsapp: ['wasap', 'whatssap', 'watsap', 'wa'],
  facebook: ['face', 'fb'],
  llamar: ['llamada', 'téléfono', 'fono'],
  mensaje: ['chat', 'msj', 'msg'],
  foto: ['fotografía', 'fotografia', 'imagen'],
  internet: ['conexión', 'wifi', 'red'],
  aplicación: ['app', 'programa', 'software'],
  pantalla: ['display', 'monitor'],
  estrella: ['favoritos', 'marcador', 'bookmark'],
  compartir: ['enviar', 'difundir'],
  descargar: ['bajar', 'instalar', 'download'],
};

export function expandSynonyms(text: string): string {
  let expanded = text;
  for (const [canonical, synonyms] of Object.entries(PERUVIAN_SYNONYMS)) {
    for (const synonym of synonyms) {
      const regex = new RegExp(`\\b${synonym}\\b`, 'gi');
      expanded = expanded.replace(regex, canonical);
    }
  }
  return expanded;
}

// Tokenizar texto
export function tokenize(text: string): string[] {
  return text
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

// Calcular similitud simple (token overlap / jaccard)
export function calculateSimilarity(input: string, target: string): number {
  const inputTokens = new Set(tokenize(input));
  const targetTokens = new Set(tokenize(target));

  if (inputTokens.size === 0 || targetTokens.size === 0) {
    return 0;
  }

  const intersection = new Set([...inputTokens].filter((x) => targetTokens.has(x)));
  const union = new Set([...inputTokens, ...targetTokens]);

  return intersection.size / union.size;
}
