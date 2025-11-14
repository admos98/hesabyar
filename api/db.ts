// /api/db.ts
// Vercel Serverless Function handler for database CRUD operations

import type { AppDatabase, DbTableName } from '../types';

const { GIST_ID, GITHUB_TOKEN } = process.env;
const GIST_URL = `https://api.github.com/gists/${GIST_ID}`;

// Helper to get the current content of the Gist
async function getGistContent(): Promise<AppDatabase> {
  const response = await fetch(GIST_URL, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch Gist content.');
  }
  const gist = await response.json();
  // Assuming the DB file is the first file in the Gist
  const fileKey = Object.keys(gist.files)[0];
  return JSON.parse(gist.files[fileKey].content);
}

// Helper to update the Gist with new content
async function updateGistContent(content: AppDatabase): Promise<void> {
  const gistResponse = await fetch(GIST_URL, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  const gist = await gistResponse.json();
  const fileKey = Object.keys(gist.files)[0];

  const response = await fetch(GIST_URL, {
    method: 'PATCH',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
    body: JSON.stringify({
      files: {
        [fileKey]: {
          content: JSON.stringify(content, null, 2),
        },
      },
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to update Gist content.');
  }
}

// Main API handler - Vercel default export format
export default async function handler(request: Request) {
  if (!GIST_ID || !GITHUB_TOKEN) {
    return new Response(JSON.stringify({ error: 'Server not configured.' }), { status: 500 });
  }

  try {
    const { action, table, payload, id } = await request.json();
    const db = await getGistContent();

    switch (action) {
      case 'getAll':
        return new Response(JSON.stringify(db[table as DbTableName] || []));

      case 'create': {
        const newItem = {
          ...payload,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        (db[table as DbTableName] as any[]).push(newItem);
        await updateGistContent(db);
        return new Response(JSON.stringify(newItem), { status: 201 });
      }

      // Special case for creating a sale, which also affects inventory
      case 'createSale': {
        const { recipes, purchaseItems } = db;

        // Deduct stock based on recipe
        payload.items.forEach((saleItem: { sellableItemId: string; quantity: number }) => {
            const recipe = recipes.find(r => r.sellableItemId === saleItem.sellableItemId);
            if (recipe) {
                recipe.ingredients.forEach(ingredient => {
                    const purchaseItem = purchaseItems.find(p => p.id === ingredient.purchaseItemId);
                    // This is a simplified stock update. In a real DB, this is where transactions are crucial.
                    // Here we are just modifying the read data before writing it back.
                    // The stock itself is not stored, but calculated, so we just add the sale record.
                });
            }
        });

        const newSale = {
          ...payload,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.sales.push(newSale);
        await updateGistContent(db);
        return new Response(JSON.stringify(newSale), { status: 201 });
      }

      case 'update': {
        const items = db[table as DbTableName] as any[];
        const itemIndex = items.findIndex(item => item.id === id);
        if (itemIndex === -1) {
          return new Response(JSON.stringify({ error: 'Item not found.' }), { status: 404 });
        }
        const updatedItem = { ...items[itemIndex], ...payload, updatedAt: new Date().toISOString() };
        items[itemIndex] = updatedItem;
        await updateGistContent(db);
        return new Response(JSON.stringify(updatedItem));
      }

      case 'delete': {
        const items = db[table as DbTableName] as any[];
        const newItems = items.filter(item => item.id !== id);
        if (items.length === newItems.length) {
            return new Response(JSON.stringify({ error: 'Item not found.' }), { status: 404 });
        }
        (db as any)[table] = newItems;
        await updateGistContent(db);
        return new Response(null, { status: 204 });
      }

      // Special action to get the whole DB for calculations
      case 'getDB':
        return new Response(JSON.stringify(db));

      default:
        return new Response(JSON.stringify({ error: 'Invalid action.' }), { status: 400 });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
