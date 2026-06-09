
/*import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { generateEmbedding } from "@/lib/gemini";

// cosine similarity
function cosineSim(a: number[] = [], b: number[] = []): number {
  if (!a.length || !b.length) return 0;
  const dot = a.reduce((s, v, i) => s + v * (b[i] ?? 0), 0);
  const normA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const normB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return normA && normB ? dot / (normA * normB) : 0;
}

// retry wrapper with exponential backoff
async function generateEmbeddingWithRetry(text: string, maxRetries = 3) {
  let attempt = 0;
  let delay = 1000;
  while (attempt <= maxRetries) {
    try {
      return await generateEmbedding(text);
    } catch (err: any) {
      const message = (err?.message || "").toString();
      const is429 =
        err?.status === 429 || /too many requests|quota/i.test(message);
      attempt++;
      if (!is429 || attempt > maxRetries) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
  throw new Error("Failed to generate embedding after retries");
}

// lexical fallback scoring (now includes niche + location + followerCount)
function lexicalScore(creator: any, query: string) {
  const q = query.toLowerCase();
  let score = 0;

  // ✅ Expanded fields to check
  const fields = ["name", "instagramHandle", "bio", "about", "niche", "location"];

  for (const f of fields) {
    const val = (creator[f] || "").toString().toLowerCase();
    if (!val) continue;

    if (val === q) score += 10;
    else if (val.includes(q)) score += 5;

    // token-wise bonus
    const tokens = q.split(/\s+/).filter(Boolean);
    for (const t of tokens) if (val.includes(t)) score += 1;
  }

  // ✅ Follower count influence
  const followers = Number(creator.followerCount) || 0;
  score += Math.min(followers / 10000, 5);

  return score;
}

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    // 1) load creators
    const snapshot = await getDocs(collection(db, "creators"));
    const creators = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));

    // 2) embedding-based ranking
    try {
      const queryEmbedding = await generateEmbeddingWithRetry(query, 2);
      const ranked = creators
        .filter((c: any) => Array.isArray(c.embedding) && c.embedding.length > 0)
        .map((c: any) => ({
          ...c,
          score: cosineSim(queryEmbedding, c.embedding),
        }))
        .filter((c: any) => c.score >= 0.5) // ✅ relaxed threshold
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      if (ranked.length > 0) {
        return NextResponse.json({ results: ranked, method: "embedding" });
      }
    } catch (embedErr: any) {
      console.error("AI Search Error (embedding):", embedErr);
    }

    // 3) lexical fallback
    const fallback = creators
      .map((c: any) => ({ ...c, score: lexicalScore(c, query) }))
      .filter((c: any) => c.score > 3) // ✅ keep reasonable matches
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 10);

    if (fallback.length === 0) {
      return NextResponse.json({
        results: [],
        method: "none",
        message: "No relevant creators found",
      });
    }

    return NextResponse.json({ results: fallback, method: "lexical-fallback" });
  } catch (error: any) {
    console.error("AI Search Error:", error);
    return NextResponse.json(
      { error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}*/
/*import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { generateEmbedding } from "@/lib/gemini";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 🔥 use Gemini Flash for query expansion
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
const paraphraseModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// cosine similarity
function cosineSim(a: number[] = [], b: number[] = []): number {
  if (!a.length || !b.length) return 0;
  const dot = a.reduce((s, v, i) => s + v * (b[i] ?? 0), 0);
  const normA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const normB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return normA && normB ? dot / (normA * normB) : 0;
}

// expand query with synonyms
async function expandQuery(query: string): Promise<string> {
  try {
    const prompt = `Expand this search query with synonyms and paraphrases. 
Keep it short and useful for matching similar meanings. 
Query: "${query}"`;
    const res = await paraphraseModel.generateContent(prompt);
    const output = res.response?.candidates?.[0]?.content?.parts?.[0]?.text;
    return `${query}. ${output || ""}`;
  } catch (err) {
    console.warn("⚠️ Query expansion failed, using original query:", err);
    return query;
  }
}

async function generateEmbeddingWithRetry(text: string, maxRetries = 3) {
  let attempt = 0;
  let delay = 1000;
  while (attempt <= maxRetries) {
    try {
      return await generateEmbedding(text);
    } catch (err: any) {
      const msg = (err?.message || "").toString();
      const is429 = err?.status === 429 || /too many requests|quota/i.test(msg);
      attempt++;
      if (!is429 || attempt > maxRetries) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
  throw new Error("Failed to generate embedding after retries");
}

// lexical fallback scoring
function lexicalScore(creator: any, query: string) {
  const q = query.toLowerCase();
  let score = 0;
  const fields = ["name", "instagramHandle", "bio", "about", "niche", "location"];
  for (const f of fields) {
    const val = (creator[f] || "").toString().toLowerCase();
    if (!val) continue;
    if (val === q) score += 10;
    else if (val.includes(q)) score += 5;
    const tokens = q.split(/\s+/).filter(Boolean);
    for (const t of tokens) if (val.includes(t)) score += 1;
  }
  const followers = Number(creator.followerCount) || 0;
  score += Math.min(followers / 10000, 5);
  return score;
}

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    // expand query before embedding
    const expandedQuery = await expandQuery(query);

    // 1) load creators
    const snapshot = await getDocs(collection(db, "creators"));
    const creators = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

    // 2) embedding-based ranking
    try {
      const queryEmbedding = await generateEmbeddingWithRetry(expandedQuery, 2);
      const ranked = creators
        .filter((c: any) => Array.isArray(c.embedding) && c.embedding.length > 0)
        .map((c: any) => ({
          ...c,
          score: cosineSim(queryEmbedding, c.embedding),
        }))
        .filter((c: any) => c.score >= 0.4) // relaxed threshold
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      if (ranked.length > 0) {
        return NextResponse.json({ results: ranked, method: "embedding+expansion" });
      }
    } catch (embedErr: any) {
      console.error("AI Search Error (embedding):", embedErr);
    }

    // 3) lexical fallback
    const fallback = creators
      .map((c: any) => ({ ...c, score: lexicalScore(c, query) }))
      .filter((c: any) => c.score > 3)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 10);

    if (fallback.length === 0) {
      return NextResponse.json({
        results: [],
        method: "none",
        message: "No relevant creators found",
      });
    }

    return NextResponse.json({ results: fallback, method: "lexical-fallback" });
  } catch (error: any) {
    console.error("AI Search Error:", error);
    return NextResponse.json(
      { error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}*/
/*import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { generateEmbedding, chatModel } from "@/lib/gemini"; // ✅ make sure chatModel is exported for expansion

// cosine similarity
function cosineSim(a: number[] = [], b: number[] = []): number {
  if (!a.length || !b.length) return 0;
  const dot = a.reduce((s, v, i) => s + v * (b[i] ?? 0), 0);
  const normA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const normB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return normA && normB ? dot / (normA * normB) : 0;
}

// retry wrapper with exponential backoff
async function generateEmbeddingWithRetry(text: string, maxRetries = 3) {
  let attempt = 0;
  let delay = 1000;
  while (attempt <= maxRetries) {
    try {
      return await generateEmbedding(text);
    } catch (err: any) {
      const message = (err?.message || "").toString();
      const is429 =
        err?.status === 429 || /too many requests|quota/i.test(message);
      attempt++;
      if (!is429 || attempt > maxRetries) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
  throw new Error("Failed to generate embedding after retries");
}

// ✅ expand query into variants using Gemini
async function expandQueryVariants(query: string): Promise<string[]> {
  try {
    const prompt = `Give me 5 alternative phrasings or synonyms for this search query, 
    focusing on semantic similarity (jobs, traits, synonyms). 
    Return them as a simple comma-separated list. Query: "${query}"`;

    const res = await chatModel.generateContent(prompt);
    const text =
      res.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const variants = text
      .split(/,|\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    return [query, ...variants];
  } catch (err) {
    console.warn("⚠️ Query expansion failed:", err);
    return [query];
  }
}

// lexical fallback scoring
function lexicalScore(creator: any, queryVariants: string[]) {
  const fields = ["name", "instagramHandle", "bio", "about", "niche", "location"];
  let score = 0;

  for (const q of queryVariants) {
    const qLower = q.toLowerCase();
    for (const f of fields) {
      const val = (creator[f] || "").toString().toLowerCase();
      if (!val) continue;
      if (val === qLower) score += 10;
      else if (val.includes(qLower)) score += 5;

      const tokens = qLower.split(/\s+/).filter(Boolean);
      for (const t of tokens) if (val.includes(t)) score += 1;
    }
  }

  // weight followers
  const followers = Number(creator.followerCount) || 0;
  score += Math.min(followers / 10000, 5);

  return score;
}

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    // expand query into variants
    const queryVariants = await expandQueryVariants(query);

    // 1) load creators
    const snapshot = await getDocs(collection(db, "creators"));
    const creators = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));

    // 2) embedding-based ranking
    try {
      const variantEmbeddings = await Promise.all(
        queryVariants.map((v) => generateEmbeddingWithRetry(v, 2))
      );

      const ranked = creators
        .filter((c: any) => Array.isArray(c.embedding) && c.embedding.length > 0)
        .map((c: any) => {
          const maxScore = Math.max(
            ...variantEmbeddings.map((qe) => cosineSim(qe, c.embedding))
          );
          return { ...c, score: maxScore };
        })
        .filter((c: any) => c.score >= 0.4) // relaxed threshold
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      if (ranked.length > 0) {
        return NextResponse.json({
          results: ranked,
          method: "embedding+variants",
          usedVariants: queryVariants,
        });
      }
    } catch (embedErr: any) {
      console.error("AI Search Error (embedding):", embedErr);
    }

    // 3) lexical fallback
    const fallback = creators
      .map((c: any) => ({
        ...c,
        score: lexicalScore(c, queryVariants),
      }))
      .filter((c: any) => c.score > 3)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 10);

    if (fallback.length === 0) {
      return NextResponse.json({
        results: [],
        method: "none",
        message: "No relevant creators found",
        usedVariants: queryVariants,
      });
    }

    return NextResponse.json({
      results: fallback,
      method: "lexical-fallback",
      usedVariants: queryVariants,
    });
  } catch (error: any) {
    console.error("AI Search Error:", error);
    return NextResponse.json(
      { error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}*/
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { generateEmbedding, chatModel } from "@/lib/gemini"; 
import { demoCreators } from "@/lib/demo-data";

// cosine similarity
function cosineSim(a: number[] = [], b: number[] = []): number {
  if (!a.length || !b.length) return 0;
  const dot = a.reduce((s, v, i) => s + v * (b[i] ?? 0), 0);
  const normA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const normB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return normA && normB ? dot / (normA * normB) : 0;
}

// retry wrapper with exponential backoff
async function generateEmbeddingWithRetry(text: string, maxRetries = 3) {
  let attempt = 0;
  let delay = 1000;
  while (attempt <= maxRetries) {
    try {
      return await generateEmbedding(text);
    } catch (err: any) {
      const message = (err?.message || "").toString();
      const is429 =
        err?.status === 429 || /too many requests|quota/i.test(message);
      attempt++;
      if (!is429 || attempt > maxRetries) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
  throw new Error("Failed to generate embedding after retries");
}

//  expand query into variants using Gemini
async function expandQueryVariants(query: string): Promise<string[]> {
  try {
    const prompt = `Give me 5 alternative phrasings or synonyms for this search query, 
    focusing on semantic similarity (jobs, traits, synonyms). 
    Return them as a simple comma-separated list. Query: "${query}"`;

    const res = await chatModel.generateContent(prompt);
    const text =
      res.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const variants = text
      .split(/,|\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    return [query, ...variants];
  } catch (err) {
    console.warn("⚠️ Query expansion failed:", err);
    return [query];
  }
}

// lexical fallback scoring
function lexicalScore(creator: any, queryVariants: string[]) {
  const fields = ["name", "instagramHandle", "bio", "about", "niche", "location"];
  let score = 0;

  for (const q of queryVariants) {
    const qLower = q.toLowerCase();
    for (const f of fields) {
      const val = (creator[f] || "").toString().toLowerCase();
      if (!val) continue;
      if (val === qLower) score += 10;
      else if (val.includes(qLower)) score += 5;

      const tokens = qLower.split(/\s+/).filter(Boolean);
      for (const t of tokens) if (val.includes(t)) score += 1;
    }
  }

  // weight followers
  const followers = Number(creator.followerCount) || 0;
  score += Math.min(followers / 10000, 5);

  return score;
}

function parseFollowerNumber(raw: string) {
  const value = Number.parseFloat(raw.replace(/,/g, ""));
  if (Number.isNaN(value)) return null;

  if (/m$/i.test(raw)) return value * 1_000_000;
  if (/k$/i.test(raw)) return value * 1_000;
  return value;
}

function getFollowerBounds(query: string) {
  const match = query.match(/(\d+(?:,\d{3})*(?:\.\d+)?\s*[km]?)\s*(?:followers?|subscribers?|subs?|audience)?/i);
  const parsed = match ? parseFollowerNumber(match[1].replace(/\s+/g, "")) : null;

  if (!parsed) {
    return { minFollowers: 0, maxFollowers: Number.POSITIVE_INFINITY };
  }

  if (/below|under|less than|fewer than|max(?:imum)?|at most/i.test(query)) {
    return { minFollowers: 0, maxFollowers: parsed };
  }

  if (/exact|equal/i.test(query)) {
    return { minFollowers: parsed, maxFollowers: parsed };
  }

  return { minFollowers: parsed, maxFollowers: Number.POSITIVE_INFINITY };
}

const NICHE_KEYWORDS: Record<string, string[]> = {
  "Fitness & Health": ["fitness", "fit", "gym", "workout", "health", "diet"],
  "Fashion & Beauty": ["fashion", "beauty", "style", "styling", "makeup"],
  "Food & Cooking": ["food", "cooking", "recipe", "recipes", "cafe"],
  Travel: ["travel", "trip", "destination", "filmmaker"],
  Technology: ["technology", "tech", "camera", "smartphone", "gadget"],
  Lifestyle: ["lifestyle", "routine", "productivity"],
  Business: ["business", "startup", "entrepreneur"],
  "Art & Design": ["art", "design", "branding", "ui"],
  Music: ["music", "song", "podcast"],
  Photography: ["photography", "photo", "photographer"],
  Education: ["education", "teacher", "learning"],
  Gaming: ["gaming", "game", "walkthrough"],
};

function queryNicheMatches(query: string) {
  const q = query.toLowerCase();
  return Object.entries(NICHE_KEYWORDS)
    .filter(([niche, keywords]) => {
      const nicheWords = niche.toLowerCase().split(/\W+/).filter(Boolean);
      return [...nicheWords, ...keywords].some((keyword) => q.includes(keyword));
    })
    .map(([niche]) => niche);
}

function creatorMatchesNiche(creator: any, selectedNiches: string[]) {
  if (selectedNiches.length === 0) return true;

  const haystack = [
    creator.niche,
    creator.bio,
    creator.about,
    creator.name,
    creator.instagramHandle,
    creator.youtubeHandle,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return selectedNiches.some((niche) => {
    const keywords = NICHE_KEYWORDS[niche] || [];
    const nicheWords = niche.toLowerCase().split(/\W+/).filter(Boolean);
    return [...nicheWords, ...keywords].some((keyword) => haystack.includes(keyword));
  });
}

function mergeCreatorsWithDemo(creators: any[]) {
  const merged = [...creators];
  const seen = new Set(
    creators
      .map((creator) => creator.id || creator.uid || creator.email || creator.name)
      .filter(Boolean)
      .map((value) => value.toString().trim().toLowerCase())
  );

  demoCreators.forEach((creator) => {
    const keys = [creator.id, creator.uid, creator.email, creator.name]
      .filter(Boolean)
      .map((value) => value.toString().trim().toLowerCase());

    if (keys.some((key) => seen.has(key))) {
      return;
    }

    keys.forEach((key) => seen.add(key));
    merged.push(creator);
  });

  return merged;
}

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    //  1) parse follower and niche constraints from query
    const { minFollowers, maxFollowers } = getFollowerBounds(query);
    const selectedNiches = queryNicheMatches(query);

    //  2) expand query into variants
    const queryVariants = await expandQueryVariants(query);

    //  3) load creators
    const snapshot = await getDocs(collection(db, "creators"));
    let creators = mergeCreatorsWithDemo(snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    })));

    //  4) filter by follower constraints
    creators = creators.filter((c: any) => {
      const count = Number(c.followerCount) || 0;
      return (
        count >= minFollowers &&
        count <= maxFollowers &&
        creatorMatchesNiche(c, selectedNiches)
      );
    });

    // 5) embedding-based ranking
    try {
      const variantEmbeddings = await Promise.all(
        queryVariants.map((v) => generateEmbeddingWithRetry(v, 2))
      );

      const ranked = creators
        .filter((c: any) => Array.isArray(c.embedding) && c.embedding.length > 0)
        .map((c: any) => {
          const maxScore = Math.max(
            ...variantEmbeddings.map((qe) => cosineSim(qe, c.embedding))
          );
          return { ...c, score: maxScore };
        })
        .filter((c: any) => c.score >= 0.4)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      if (ranked.length > 0) {
        return NextResponse.json({
          results: ranked,
          method: "embedding+variants",
          usedVariants: queryVariants,
        });
      }
    } catch (embedErr: any) {
      console.error("AI Search Error (embedding):", embedErr);
    }

    // 6) lexical fallback
    const fallback = creators
      .map((c: any) => ({
        ...c,
        score: lexicalScore(c, queryVariants),
      }))
      .filter((c: any) => c.score > 3)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 10);

    if (fallback.length === 0) {
      return NextResponse.json({
        results: [],
        method: "none",
        message: "No relevant creators found",
        usedVariants: queryVariants,
      });
    }

    return NextResponse.json({
      results: fallback,
      method: "lexical-fallback",
      usedVariants: queryVariants,
    });
  } catch (error: any) {
    console.error("AI Search Error:", error);
    return NextResponse.json(
      { error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}


