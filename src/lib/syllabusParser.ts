import fs from 'fs';
import path from 'path';

export interface SyllabusNode {
  grade: string;
  stage: string; // Primaria or Secundaria
  units: SyllabusUnit[];
}

export interface SyllabusUnit {
  name: string;
  topics: string[];
}

let cachedSyllabus: SyllabusNode[] = [];

/**
 * Parses a markdown file and extracts the grade, units and topics based on indentation.
 */
function parseMarkdownFile(filePath: string, stage: string): SyllabusNode | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    let currentGrade = '';
    let currentUnit: SyllabusUnit | null = null;
    const units: SyllabusUnit[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip empty lines or just whitespace
      if (!line.trim()) continue;

      const leadingSpaces = line.search(/\S/);
      const text = line.trim();

      if (leadingSpaces === 0) {
        // Grade
        currentGrade = text.replace(':', '');
      } else if (leadingSpaces === 4) {
        // Unit (often prefix with Unidad X: or just upper case text)
        // Skip "Conocimientos:" or "Secciones especiales:"
        if (text === 'Conocimientos:' || text === 'Secciones especiales:') {
          continue;
        }
        currentUnit = { name: text.replace(':', ''), topics: [] };
        units.push(currentUnit);
      } else if (leadingSpaces === 8) {
        // Topic
        if (currentUnit) {
          currentUnit.topics.push(text);
        }
      }
    }

    if (!currentGrade) {
        // Fallback: use filename as grade if no leading 0-space line found
        currentGrade = path.basename(filePath, '.md');
    }

    return {
      grade: currentGrade,
      stage,
      units
    };
  } catch (error) {
    console.error(`Error parsing file ${filePath}:`, error);
    return null;
  }
}

/**
 * Loads all syllabus from the Temario folder.
 */
export function loadSyllabus(): SyllabusNode[] {
  if (cachedSyllabus.length > 0) {
    return cachedSyllabus;
  }

  const baseDir = path.join(process.cwd(), 'Temario');
  const stages = ['Primaria', 'Secundaria'];
  const allNodes: SyllabusNode[] = [];

  for (const stage of stages) {
    const stagePath = path.join(baseDir, stage);
    if (!fs.existsSync(stagePath)) continue;

    const files = fs.readdirSync(stagePath).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const filePath = path.join(stagePath, file);
      const node = parseMarkdownFile(filePath, stage);
      if (node) {
        allNodes.push(node);
      }
    }
  }

  cachedSyllabus = allNodes;
  return allNodes;
}

/**
 * Get random topics from a specific stage for diagnostic tests.
 * Picks 'count' random topics across different grades in that stage.
 */
export function getRandomTopicsForStage(stage: string, count: number = 5): {grade: string, topic: string}[] {
  const syllabus = loadSyllabus();
  const stageNodes = syllabus.filter(s => s.stage.toLowerCase() === stage.toLowerCase());
  
  const allTopics: {grade: string, topic: string}[] = [];
  
  for (const node of stageNodes) {
    for (const unit of node.units) {
      for (const topic of unit.topics) {
        allTopics.push({ grade: node.grade, topic });
      }
    }
  }

  // Shuffle and pick
  const shuffled = allTopics.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Gets all topics for a specific grade.
 */
export function getTopicsForGrade(grade: string, stage: string): string[] {
  const node = getNodeForGrade(grade, stage);
  if (!node) return [];

  const allTopics: string[] = [];
  for (const unit of node.units) {
    allTopics.push(...unit.topics);
  }
  return allTopics;
}

/**
 * Gets the full SyllabusNode for a specific grade.
 */
export function getNodeForGrade(grade: string, stage: string): SyllabusNode | null {
  const syllabus = loadSyllabus();
  
  // Normalize grades like "3ero" to "3er", "1ero" to "1er"
  let searchGrade = grade.toLowerCase();
  if (searchGrade === '1ero') searchGrade = '1er';
  if (searchGrade === '3ero') searchGrade = '3er';

  // Attempt exact match or substring match
  const node = syllabus.find(s => 
    (s.grade.toLowerCase().includes(searchGrade) || searchGrade.includes(s.grade.toLowerCase())) && 
    s.stage.toLowerCase() === stage.toLowerCase()
  );
  return node || null;
}
