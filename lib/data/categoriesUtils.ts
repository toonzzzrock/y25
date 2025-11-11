import categoriesData from './categories.json';

export interface Category {
  id: string;
  name: string;
  icon: string;
  tag: string;
}

export interface CategoriesData {
  categories: Category[];
}

const data: CategoriesData = categoriesData;

/**
 * Get all categories
 */
export function getAllCategories(): Category[] {
  return data.categories;
}

/**
 * Filter categories by search query
 * Returns closest matches based on how well the query matches
 */
export function searchCategories(query: string): Category[] {
  if (!query.trim()) {
    return data.categories;
  }

  const lowerQuery = query.toLowerCase();

  // Score each category based on match quality
  const scored = data.categories.map((category) => {
    const name = category.name.toLowerCase();
    let score = 0;

    // Exact match
    if (name === lowerQuery) {
      score = 1000;
    }
    // Starts with query
    else if (name.startsWith(lowerQuery)) {
      score = 500 + (name.length - lowerQuery.length);
    }
    // Contains query
    else if (name.includes(lowerQuery)) {
      score = 100 + (name.length - name.indexOf(lowerQuery));
    }
    // Partial character match
    else {
      let matchCount = 0;
      for (const char of lowerQuery) {
        if (name.includes(char)) {
          matchCount++;
        }
      }
      score = matchCount * 10;
    }

    return { category, score };
  });

  // Filter by minimum score (at least one character must match)
  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.category);
}

/**
 * Get category by ID
 */
export function getCategoryById(id: string): Category | undefined {
  return data.categories.find((cat) => cat.id === id);
}
